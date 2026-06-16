#!/usr/bin/env python3
"""
solar_pysam.py — REAL solar calculation worker for In-Planted / Climate Resilient ATL.

Emits a canonical WorkerResult<SolarResult> (HANDSHAKE.md §3.7) so it plugs straight
into the JS scoring engine / 3D twin via the building's `interventions.roofSolar`.

Fidelity ladder (architecture/02_CalculationEngine.md §1.1):
  Tier 1 (preferred):  NREL SAM via PySAM (PySAM.Pvwattsv8) — the bankable model.
  Tier 0 fallbacks (if PySAM is not installed):
    (a) Live NREL PVWatts v8 HTTP call    — ONLY when BOTH NREL_API_KEY and
        NREL_API_BASE (a user-verified official NREL endpoint) are set. No
        default domain, so a credential is never sent to a host the code chose.
    (b) Closed-form PVWatts-style estimate — Atlanta specific-yield constant.

The script ALWAYS runs and ALWAYS emits valid JSON, regardless of whether PySAM
or a network/API key is available. `provenance.tier` + `provenance.source/method`
reflect exactly which path produced the number.

Conventions (HANDSHAKE.md §1): camelCase JSON on the wire, units-in-name,
deterministic (same inputs + same workerVersion => identical output), inputHash
for the content-addressed result cache (architecture/03).

CLI:
  python3 solar_pysam.py [--building PATH] [--surface SURFACE_ID]
                         [--capacity-kw KW] [--out PATH] [--quiet]

Examples:
  # Default: Ansley fixture, roof surface, capacity derived from roof area.
  python3 solar_pysam.py

  # Use Google's modeled 1,836 kW DC capacity as a cross-check.
  python3 solar_pysam.py --capacity-kw 1836
"""

from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Worker identity + defensible default constants
# (ImplementationPlan/02_DataAcquisitionPlan.md §5; HANDSHAKE.md §3.7)
# ---------------------------------------------------------------------------
WORKER_NAME = "solar_pysam"
WORKER_VERSION = "1.0.0"
SCHEMA_VERSION = "0.1.0"

# PVWatts / system-sizing defaults
MODULE_POWER_DENSITY_KW_PER_M2 = 0.15   # ~19-20% efficient module @ 1 kW/m^2 STC
ROOF_PACKING_FACTOR = 0.70              # standard PV roof packing
DEFAULT_TILT_DEG = 10                   # low-tilt flat-roof mount
DEFAULT_AZIMUTH_DEG = 180               # south-facing
DEFAULT_LOSSES_PCT = 14                 # PVWatts default
DEFAULT_ARRAY_TYPE = 1                  # 1 = fixed roof mount
DEFAULT_MODULE_TYPE = 1                 # 1 = premium

# Carbon
DEFAULT_GRID_FACTOR_KG_PER_KWH = 0.3837  # EPA eGRID2023 Rev 2, SRSO (846 lb CO2e/MWh)

# Closed-form fallback: Atlanta specific yield (kWh per kWp per year).
# PVWatts-class fixed-tilt rooftop in Atlanta (NSRDB TMY, GHI ~4.7-5.0 kWh/m^2/day,
# ~14% losses) lands ~1,300-1,400 kWh/kWp/yr. We use 1,300 to stay conservative and
# to match the fixture cross-check (1,836 kW DC * ~1,295 = ~2.378 GWh, Google value).
# Sources: NREL PVWatts v8 regional runs for Atlanta, GA; NSRDB TMY.
ATLANTA_SPECIFIC_YIELD_KWH_PER_KWP = 1300.0
# Implied capacity factor for the closed-form path: yield / hours-per-year.
HOURS_PER_YEAR = 8760.0
# Monthly distribution shape for Atlanta (normalized; sums to 1.0). Higher in
# spring/summer, lower in mid-winter. Used only to split the closed-form annual
# total into a 12-month series so the SolarResult.acMonthlyKwh is always present.
ATLANTA_MONTHLY_SHAPE = [
    0.0700, 0.0760, 0.0900, 0.0960, 0.0980, 0.0950,
    0.0930, 0.0920, 0.0860, 0.0820, 0.0680, 0.0540,
]

# ---------------------------------------------------------------------------
# SECURITY: the live HTTP fallback transmits NREL_API_KEY. We DO NOT hardcode a
# destination domain — earlier project notes claimed NREL "moved" to
# `developer.nlr.gov`, which is UNVERIFIED and resembles a typosquat of the real,
# long-established `developer.nrel.gov`. To avoid sending a credential to a domain
# the code picked, the HTTP path is OFF unless YOU explicitly set NREL_API_BASE to
# an endpoint you have personally verified as official NREL. No default => no send.
# Local PySAM (Tier 1) and the closed-form estimate (Tier 0b) need no network/key.
# ---------------------------------------------------------------------------
PVWATTS_HTTP_ENDPOINT = os.environ.get("NREL_API_BASE", "").strip()  # e.g. https://developer.nrel.gov/api/pvwatts/v8.json

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BUILDING = REPO_ROOT / "src" / "data" / "buildings" / "ansley-mall.json"
DEFAULT_OUT = REPO_ROOT / "pipeline" / "out" / "ansley-mall-solar.json"


# ---------------------------------------------------------------------------
# Input loading / surface selection
# ---------------------------------------------------------------------------
def load_building(path: Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _coerce_area_m2(area_field: Any) -> float | None:
    """areaM2 may be a bare number or a ProvenancedValue {value, provenance}."""
    if area_field is None:
        return None
    if isinstance(area_field, dict):
        v = area_field.get("value")
        return float(v) if v is not None else None
    return float(area_field)


def select_surface(building: dict[str, Any], surface_id: str | None) -> dict[str, Any]:
    surfaces = building.get("surfaces", [])
    if surface_id:
        for s in surfaces:
            if s.get("id") == surface_id:
                return s
        raise SystemExit(f"surface '{surface_id}' not found in building "
                         f"'{building.get('id')}'")
    # Default: the first roof surface.
    for s in surfaces:
        if s.get("type") == "roof":
            return s
    raise SystemExit(f"no roof surface found in building '{building.get('id')}'")


def get_lat_lon(building: dict[str, Any]) -> tuple[float, float]:
    loc = building.get("location", {})
    return float(loc["lat"]), float(loc["lon"])


def derive_capacity_kw_dc(surface: dict[str, Any]) -> float:
    """systemCapacityKwDc from usable roof area: areaM2 * 0.15 * 0.7."""
    area = _coerce_area_m2(surface.get("usableAreaM2")) or _coerce_area_m2(surface.get("areaM2"))
    if area is None:
        raise SystemExit(f"surface '{surface.get('id')}' has no usable areaM2/areaM2 "
                         f"to derive capacity; pass --capacity-kw")
    return round(area * MODULE_POWER_DENSITY_KW_PER_M2 * ROOF_PACKING_FACTOR, 3)


# ---------------------------------------------------------------------------
# Compute paths (the fidelity ladder)
# ---------------------------------------------------------------------------
def _run_pysam(capacity_kw: float, lat: float, lon: float,
               assumptions: dict[str, Any]) -> dict[str, Any] | None:
    """Tier 1: NREL SAM via PySAM.Pvwattsv8. Returns None if PySAM unavailable."""
    try:
        import PySAM.Pvwattsv8 as Pvwatts  # type: ignore
    except Exception:
        return None

    model = Pvwatts.default("PVWattsNone")
    model.SystemDesign.system_capacity = capacity_kw
    model.SystemDesign.dc_ac_ratio = 1.2
    model.SystemDesign.inv_eff = 96.0
    model.SystemDesign.losses = float(assumptions["lossesPct"])
    model.SystemDesign.array_type = int(assumptions["arrayType"])
    model.SystemDesign.tilt = float(assumptions["tiltDeg"])
    model.SystemDesign.azimuth = float(assumptions["azimuthDeg"])
    model.SystemDesign.module_type = int(assumptions["moduleType"])
    model.SystemDesign.gcr = 0.4
    # Lat/lon path: PySAM resolves NSRDB TMY for the site.
    model.LocationAndResource.lat = lat  # type: ignore[attr-defined]
    model.LocationAndResource.lon = lon  # type: ignore[attr-defined]
    model.execute()
    out = model.Outputs
    ac_monthly = [round(float(x), 2) for x in list(out.ac_monthly)]
    return {
        "acAnnualKwh": round(float(out.ac_annual), 2),
        "acMonthlyKwh": ac_monthly,
        "capacityFactor": round(float(out.capacity_factor) / 100.0, 4),
        "provenance": {
            "tier": "modeled",
            "source": "NREL SAM (PySAM) PVWatts v8",
            "method": "PySAM Pvwattsv8 (NSRDB TMY)",
        },
        "warnings": [],
    }


def _run_pvwatts_http(capacity_kw: float, lat: float, lon: float,
                      assumptions: dict[str, Any], api_key: str) -> dict[str, Any] | None:
    """Tier 0 (a): live NREL PVWatts v8 HTTP call. Returns None on any failure."""
    try:
        import urllib.parse
        import urllib.request
    except Exception:
        return None
    params = {
        "api_key": api_key,
        "system_capacity": capacity_kw,
        "module_type": assumptions["moduleType"],
        "losses": assumptions["lossesPct"],
        "array_type": assumptions["arrayType"],
        "tilt": assumptions["tiltDeg"],
        "azimuth": assumptions["azimuthDeg"],
        "lat": lat,
        "lon": lon,
        "dataset": "nsrdb",
        "timeframe": "monthly",
    }
    url = PVWATTS_HTTP_ENDPOINT + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001 — fallback must never raise
        return {"_error": f"PVWatts HTTP call failed: {exc}"}
    outputs = payload.get("outputs") or {}
    if "ac_annual" not in outputs:
        return {"_error": f"PVWatts HTTP response missing ac_annual: {payload.get('errors')}"}
    ac_monthly = [round(float(x), 2) for x in outputs.get("ac_monthly", [])]
    return {
        "acAnnualKwh": round(float(outputs["ac_annual"]), 2),
        "acMonthlyKwh": ac_monthly,
        "capacityFactor": round(float(outputs.get("capacity_factor", 0.0)) / 100.0, 4),
        "provenance": {
            "tier": "modeled",
            "source": "NREL PVWatts v8 (HTTP API)",
            "method": f"PVWatts v8 (NSRDB) via user-configured NREL_API_BASE={PVWATTS_HTTP_ENDPOINT}",
        },
        "warnings": [],
    }


def _run_closed_form(capacity_kw: float, assumptions: dict[str, Any]) -> dict[str, Any]:
    """Tier 0 (b): closed-form PVWatts-style estimate (always succeeds)."""
    ac_annual = capacity_kw * ATLANTA_SPECIFIC_YIELD_KWH_PER_KWP
    ac_monthly = [round(ac_annual * frac, 2) for frac in ATLANTA_MONTHLY_SHAPE]
    capacity_factor = ATLANTA_SPECIFIC_YIELD_KWH_PER_KWP / HOURS_PER_YEAR
    return {
        "acAnnualKwh": round(ac_annual, 2),
        "acMonthlyKwh": ac_monthly,
        "capacityFactor": round(capacity_factor, 4),
        "provenance": {
            "tier": "modeled",
            "source": "Closed-form PVWatts-style estimate",
            "method": (
                "specific-yield constant "
                f"{ATLANTA_SPECIFIC_YIELD_KWH_PER_KWP:.0f} kWh/kWp/yr "
                "(Atlanta, GA; NREL PVWatts v8 / NSRDB TMY regional, ~14% losses)"
            ),
        },
        "warnings": [
            "PySAM not installed and no live NREL PVWatts call available; "
            "used a closed-form Atlanta specific-yield estimate (Tier 0)."
        ],
    }


# ---------------------------------------------------------------------------
# Hashing (content-addressed cache key) + envelope assembly
# ---------------------------------------------------------------------------
def compute_input_hash(surface_id: str, capacity_kw: float, lat: float, lon: float,
                       assumptions: dict[str, Any]) -> str:
    """Stable hash of the inputs (architecture/03 content-addressed cache)."""
    canonical = json.dumps(
        {
            "worker": WORKER_NAME,
            "workerVersion": WORKER_VERSION,
            "surfaceId": surface_id,
            "systemCapacityKwDc": round(capacity_kw, 6),
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "assumptions": assumptions,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def build_worker_result(building: dict[str, Any], surface: dict[str, Any],
                        capacity_kw: float, capacity_from_override: bool,
                        grid_factor: float) -> dict[str, Any]:
    surface_id = surface["id"]
    lat, lon = get_lat_lon(building)

    assumptions = {
        "tiltDeg": DEFAULT_TILT_DEG,
        "azimuthDeg": DEFAULT_AZIMUTH_DEG,
        "lossesPct": DEFAULT_LOSSES_PCT,
        "arrayType": DEFAULT_ARRAY_TYPE,
        "moduleType": DEFAULT_MODULE_TYPE,
        "gridFactorKgPerKwh": grid_factor,
    }

    warnings: list[str] = []

    # --- fidelity ladder: PySAM -> live HTTP -> closed-form ---
    computed = _run_pysam(capacity_kw, lat, lon, assumptions)
    if computed is None:
        warnings.append("PySAM (PySAM.Pvwattsv8) not importable in this environment.")
        api_key = os.environ.get("NREL_API_KEY")
        if api_key and PVWATTS_HTTP_ENDPOINT:
            # Both an API key AND an explicitly user-verified endpoint are required.
            http_result = _run_pvwatts_http(capacity_kw, lat, lon, assumptions, api_key)
            if http_result and "_error" not in http_result:
                computed = http_result
            elif http_result and "_error" in http_result:
                warnings.append(http_result["_error"])
        elif api_key and not PVWATTS_HTTP_ENDPOINT:
            warnings.append(
                "NREL_API_KEY is set but NREL_API_BASE is not — live HTTP skipped. "
                "For safety the key is NOT sent to any default domain; set NREL_API_BASE "
                "to an endpoint you have verified as official NREL to enable it."
            )
        else:
            warnings.append("NREL_API_KEY not set; skipped live PVWatts HTTP fallback.")
        if computed is None:
            computed = _run_closed_form(capacity_kw, assumptions)

    warnings.extend(computed.get("warnings", []))
    if capacity_from_override:
        warnings.append(
            f"systemCapacityKwDc overridden via --capacity-kw ({capacity_kw} kW DC)."
        )

    ac_annual = computed["acAnnualKwh"]
    co2_avoided_tons = round(ac_annual * grid_factor / 1000.0, 2)

    solar_result = {
        "surfaceId": surface_id,
        "systemCapacityKwDc": round(capacity_kw, 3),
        "acAnnualKwh": ac_annual,
        "acMonthlyKwh": computed["acMonthlyKwh"],
        "capacityFactor": computed["capacityFactor"],
        "co2AvoidedTonsYr": co2_avoided_tons,
        "assumptions": assumptions,
    }

    input_hash = compute_input_hash(surface_id, capacity_kw, lat, lon, assumptions)
    now = _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    prov = dict(computed["provenance"])
    prov["date"] = now
    prov["note"] = (
        f"Grid factor {grid_factor} kg CO2/kWh (EPA eGRID2023 Rev 2, SRSO). "
        f"Capacity {'from --capacity-kw override' if capacity_from_override else 'derived from usable roof area x 0.15 kW/m^2 x 0.70 packing'}."
    )

    return {
        "worker": WORKER_NAME,
        "workerVersion": WORKER_VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "inputHash": input_hash,
        "result": solar_result,
        "provenance": prov,
        "warnings": warnings,
        "computedAt": now,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="solar_pysam.py",
        description="PySAM-based solar worker emitting canonical WorkerResult<SolarResult>.",
    )
    p.add_argument("--building", type=Path, default=DEFAULT_BUILDING,
                   help=f"Building JSON path (default: {DEFAULT_BUILDING})")
    p.add_argument("--surface", type=str, default=None,
                   help="CandidateSurface id (default: first roof surface)")
    p.add_argument("--capacity-kw", type=float, default=None,
                   help="Override systemCapacityKwDc (e.g. 1836 for Google's value)")
    p.add_argument("--out", type=Path, default=DEFAULT_OUT,
                   help=f"Output JSON path (default: {DEFAULT_OUT})")
    p.add_argument("--grid-factor", type=float, default=DEFAULT_GRID_FACTOR_KG_PER_KWH,
                   help=f"Grid emission factor kg CO2/kWh (default: {DEFAULT_GRID_FACTOR_KG_PER_KWH})")
    p.add_argument("--quiet", action="store_true",
                   help="Do not print JSON to stdout (still writes --out)")
    return p.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    building = load_building(args.building)
    surface = select_surface(building, args.surface)

    if args.capacity_kw is not None:
        capacity_kw = float(args.capacity_kw)
        capacity_from_override = True
    else:
        capacity_kw = derive_capacity_kw_dc(surface)
        capacity_from_override = False

    envelope = build_worker_result(
        building, surface, capacity_kw, capacity_from_override, args.grid_factor
    )

    rendered = json.dumps(envelope, indent=2)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(rendered + "\n")

    if not args.quiet:
        print(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
