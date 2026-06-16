#!/usr/bin/env python3
"""
solar_buildinginsights.py — lat/lon → roof geometry worker (onboarding Stage 2).

Calls Google Solar API `buildingInsights:findClosest` to get roof-segment geometry
(area / pitch / azimuth), and maps it to our canonical CandidateSurface[] so the
engine can size interventions. Emits WorkerResult<BuildingInsightsResult>
(HANDSHAKE.md §3.7 envelope; CandidateSurface = HANDSHAKE §3.3).

BuildingInsightsResult:
  {
    "center": {"lat","lon"},
    "wholeRoofAreaM2": float,
    "maxArrayAreaM2": float | null,
    "maxArrayPanelsCount": int | null,
    "roofSegments": [{ "areaM2","pitchDeg","azimuthDeg" }, ...],
    "candidateSurfaces": [ CandidateSurface ],   # synthesized: one aggregated roof surface
    "imageryQuality": str | null
  }

SECURITY (mirrors the hardened solar worker):
  - GOOGLE_MAPS_API_KEY read from env ONLY; never hardcoded/logged. No key ⇒ live call skipped.
  - Destination is the OFFICIAL, verified domain `solar.googleapis.com` (confirmed against
    developers.google.com), overridable via GOOGLE_SOLAR_BASE for a verified proxy only.
  - ToS: Solar "grounded output" is cacheable ≤30 days — callers must TTL it; our durable
    store keeps derived values + the storable place_id, not the raw Solar payload.
  - Always runs / always emits valid JSON: without a key it falls back to the Ansley fixture roof.

CLI:
  python3 solar_buildinginsights.py --lat 33.7983 --lon -84.3711
  python3 solar_buildinginsights.py --building src/data/buildings/ansley-mall.json
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

WORKER_NAME = "solar_buildinginsights"
WORKER_VERSION = "1.0.0"
SCHEMA_VERSION = "0.1.0"

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BUILDING = REPO_ROOT / "src" / "data" / "buildings" / "ansley-mall.json"
DEFAULT_OUT = REPO_ROOT / "pipeline" / "out" / "building-insights.json"

# Official, verified Google Solar endpoint (developers.google.com). Key NOT included here.
SOLAR_BASE = os.environ.get("GOOGLE_SOLAR_BASE", "https://solar.googleapis.com/v1/buildingInsights:findClosest")


def _now() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _input_hash(payload: dict[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _load_building() -> dict[str, Any] | None:
    try:
        with open(DEFAULT_BUILDING, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return None


def _candidate_surface(building_id: str, area_m2: float, azimuth_deg: float | None,
                       tilt_deg: float | None, tier: str, source: str) -> dict[str, Any]:
    """One aggregated roof CandidateSurface per HANDSHAKE §3.3."""
    surf: dict[str, Any] = {
        "id": f"{building_id}-roof",
        "type": "roof",
        "areaM2": {"value": round(area_m2, 1),
                   "provenance": {"tier": tier, "source": source}},
        "imperviousPct": 100,
        "allowedInterventions": ["solar", "greenRoof", "coolRoof", "cistern"],
    }
    if azimuth_deg is not None or tilt_deg is not None:
        surf["orientation"] = {"azimuthDeg": round(azimuth_deg or 180.0, 1),
                               "tiltDeg": round(tilt_deg or 10.0, 1)}
    return surf


def _run_live(lat: float, lon: float, api_key: str) -> dict[str, Any] | None:
    """Google Solar buildingInsights:findClosest. Returns None/{_error} on failure."""
    import urllib.parse
    import urllib.request
    params = {"location.latitude": lat, "location.longitude": lon,
              "requiredQuality": "HIGH", "key": api_key}
    url = SOLAR_BASE + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        return {"_error": f"Solar API call failed: {exc}"}
    sp = payload.get("solarPotential")
    if not sp:
        return {"_error": f"Solar API response missing solarPotential: {payload.get('error')}"}
    segments = []
    total_area = 0.0
    weighted_az = 0.0
    for seg in sp.get("roofSegmentStats", []):
        area = float(seg.get("stats", {}).get("areaMeters2", 0.0))
        az = seg.get("azimuthDegrees")
        pitch = seg.get("pitchDegrees")
        segments.append({"areaM2": round(area, 1), "pitchDeg": pitch, "azimuthDeg": az})
        total_area += area
        if az is not None:
            weighted_az += az * area
    whole = float(sp.get("wholeRoofStats", {}).get("areaMeters2", total_area))
    dom_az = (weighted_az / total_area) if total_area else None
    center = payload.get("center", {})
    return {
        "center": {"lat": center.get("latitude", lat), "lon": center.get("longitude", lon)},
        "wholeRoofAreaM2": round(whole, 1),
        "maxArrayAreaM2": round(float(sp.get("maxArrayAreaMeters2", 0.0)), 1) or None,
        "maxArrayPanelsCount": sp.get("maxArrayPanelsCount"),
        "roofSegments": segments,
        "dominantAzimuthDeg": dom_az,
        "imageryQuality": payload.get("imageryQuality"),
        "provenance": {"tier": "fetched", "source": "Google Solar API (buildingInsights:findClosest)",
                       "method": "solar.googleapis.com/v1"},
    }


def build_result(lat: float, lon: float, building_id: str) -> dict[str, Any]:
    warnings: list[str] = []
    computed: dict[str, Any] | None = None

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if api_key:
        live = _run_live(lat, lon, api_key)
        if live and "_error" not in live:
            computed = live
        elif live:
            warnings.append(live["_error"])
    else:
        warnings.append("GOOGLE_MAPS_API_KEY not set; skipped live Solar API call.")

    if computed is None:
        # Fallback: the Ansley fixture roof (measured via Google Earth trace).
        b = _load_building() or {}
        area = float(b.get("roofAreaM2", 20033))
        heading = b.get("roofHeadingDeg")
        computed = {
            "center": {"lat": lat, "lon": lon},
            "wholeRoofAreaM2": round(area, 1),
            "maxArrayAreaM2": None, "maxArrayPanelsCount": None,
            "roofSegments": [{"areaM2": round(area, 1), "pitchDeg": 0, "azimuthDeg": heading}],
            "dominantAzimuthDeg": 180.0,
            "imageryQuality": None,
            "provenance": {"tier": "default", "source": "Ansley fixture fallback",
                           "method": "ansley-mall.json roofAreaM2"},
        }
        warnings.append("Fell back to Ansley fixture roof geometry (default).")

    tier = computed["provenance"]["tier"]
    source = computed["provenance"]["source"]
    surfaces = [_candidate_surface(building_id, computed["wholeRoofAreaM2"],
                                   computed.get("dominantAzimuthDeg"), 10.0, tier, source)]
    result = {
        "center": computed["center"],
        "wholeRoofAreaM2": computed["wholeRoofAreaM2"],
        "maxArrayAreaM2": computed["maxArrayAreaM2"],
        "maxArrayPanelsCount": computed["maxArrayPanelsCount"],
        "roofSegments": computed["roofSegments"],
        "candidateSurfaces": surfaces,
        "imageryQuality": computed["imageryQuality"],
    }
    return {
        "worker": WORKER_NAME, "workerVersion": WORKER_VERSION, "schemaVersion": SCHEMA_VERSION,
        "inputHash": _input_hash({"worker": WORKER_NAME, "lat": round(lat, 6),
                                  "lon": round(lon, 6), "buildingId": building_id}),
        "result": result,
        "provenance": {**computed["provenance"], "date": _now()},
        "warnings": warnings,
        "computedAt": _now(),
    }


def main(argv: list[str]) -> int:
    p = argparse.ArgumentParser(description="Roof geometry from Google Solar API (onboarding worker).")
    p.add_argument("--lat", type=float, default=None)
    p.add_argument("--lon", type=float, default=None)
    p.add_argument("--building", type=Path, default=DEFAULT_BUILDING,
                   help="building JSON to read lat/lon + id from when --lat/--lon omitted")
    p.add_argument("--building-id", type=str, default=None)
    p.add_argument("--out", type=Path, default=DEFAULT_OUT)
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args(argv)

    lat, lon, bid = args.lat, args.lon, args.building_id
    if lat is None or lon is None or bid is None:
        try:
            with open(args.building, "r", encoding="utf-8") as fh:
                b = json.load(fh)
            lat = lat if lat is not None else b["location"]["lat"]
            lon = lon if lon is not None else b["location"]["lon"]
            bid = bid or b.get("id", "building")
        except Exception as exc:
            raise SystemExit(f"Need --lat/--lon or a readable --building: {exc}")

    envelope = build_result(float(lat), float(lon), bid)
    rendered = json.dumps(envelope, indent=2)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(rendered + "\n", encoding="utf-8")
    if not args.quiet:
        print(rendered)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
