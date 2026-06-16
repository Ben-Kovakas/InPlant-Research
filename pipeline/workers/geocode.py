#!/usr/bin/env python3
"""
geocode.py — address → coordinates worker (onboarding Stage 1→2).

Emits a canonical WorkerResult<GeocodeResult> (HANDSHAKE.md §3.7) so it plugs into
the onboarding flow (contracts/05_onboarding.md) and feeds the Building.location.

GeocodeResult:
  {
    "inputAddress": str,
    "formattedAddress": str | null,
    "location": { "lat": float, "lon": float },
    "placeId": str | null,        # storable indefinitely per Google ToS
    "locationType": str | null
  }

Fidelity ladder:
  Live (preferred): Google Geocoding API — ONLY if GOOGLE_MAPS_API_KEY is set.
  Fallback:         --lat/--lon if provided, else the Ansley fixture coords.

SECURITY (mirrors the hardened solar worker):
  - The API key is read from the environment ONLY (GOOGLE_MAPS_API_KEY); never hardcoded,
    never logged. Without a key the live call is skipped and a fallback is used.
  - The destination is the OFFICIAL, verified Google domain `maps.googleapis.com`
    (confirmed against developers.google.com). It is overridable via GOOGLE_GEOCODE_BASE
    if you ever need to point at a verified proxy.
  - The script ALWAYS runs and ALWAYS emits valid JSON (offline fallback).

CLI:
  python3 geocode.py --address "1544 Piedmont Ave NE, Atlanta, GA 30324"
  python3 geocode.py --lat 33.7983 --lon -84.3711      # manual fallback, no network
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

WORKER_NAME = "geocode"
WORKER_VERSION = "1.0.0"
SCHEMA_VERSION = "0.1.0"

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BUILDING = REPO_ROOT / "src" / "data" / "buildings" / "ansley-mall.json"
DEFAULT_OUT = REPO_ROOT / "pipeline" / "out" / "geocode.json"

# Official, verified Google Geocoding endpoint (developers.google.com). Key NOT included here.
GEOCODE_BASE = os.environ.get("GOOGLE_GEOCODE_BASE", "https://maps.googleapis.com/maps/api/geocode/json")


def _now() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _input_hash(payload: dict[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _fixture_coords() -> dict[str, Any] | None:
    try:
        with open(DEFAULT_BUILDING, "r", encoding="utf-8") as fh:
            b = json.load(fh)
        loc = b.get("location", {})
        if "lat" in loc and "lon" in loc:
            return {"lat": float(loc["lat"]), "lon": float(loc["lon"]),
                    "address": b.get("address")}
    except Exception:
        return None
    return None


def _run_live(address: str, api_key: str) -> dict[str, Any] | None:
    """Google Geocoding API. Returns None on failure (never raises)."""
    import urllib.parse
    import urllib.request
    params = {"address": address, "key": api_key}
    url = GEOCODE_BASE + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:  # noqa: BLE001 — fallback must never raise
        return {"_error": f"Geocoding HTTP call failed: {exc}"}
    if payload.get("status") != "OK" or not payload.get("results"):
        return {"_error": f"Geocoding returned status={payload.get('status')}"}
    top = payload["results"][0]
    loc = top["geometry"]["location"]
    return {
        "formattedAddress": top.get("formatted_address"),
        "location": {"lat": float(loc["lat"]), "lon": float(loc["lng"])},
        "placeId": top.get("place_id"),
        "locationType": top.get("geometry", {}).get("location_type"),
        "provenance": {"tier": "fetched", "source": "Google Geocoding API",
                       "method": "maps.googleapis.com/maps/api/geocode/json"},
    }


def build_result(address: str | None, lat: float | None, lon: float | None) -> dict[str, Any]:
    warnings: list[str] = []
    computed: dict[str, Any] | None = None

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if address and api_key:
        live = _run_live(address, api_key)
        if live and "_error" not in live:
            computed = live
        elif live:
            warnings.append(live["_error"])
    elif address and not api_key:
        warnings.append("GOOGLE_MAPS_API_KEY not set; skipped live Geocoding call.")

    if computed is None:
        if lat is not None and lon is not None:
            computed = {"formattedAddress": address, "location": {"lat": lat, "lon": lon},
                        "placeId": None, "locationType": None,
                        "provenance": {"tier": "measured", "source": "manual --lat/--lon",
                                       "method": "operator-provided coordinates"}}
            warnings.append("Used manual --lat/--lon (no live geocode).")
        else:
            fx = _fixture_coords()
            if fx is None:
                raise SystemExit("No geocode possible: no API key, no --lat/--lon, no fixture.")
            computed = {"formattedAddress": fx.get("address") or address,
                        "location": {"lat": fx["lat"], "lon": fx["lon"]},
                        "placeId": None, "locationType": None,
                        "provenance": {"tier": "default", "source": "Ansley fixture fallback",
                                       "method": "ansley-mall.json location"}}
            warnings.append("Fell back to Ansley fixture coordinates (default).")

    result = {
        "inputAddress": address,
        "formattedAddress": computed["formattedAddress"],
        "location": computed["location"],
        "placeId": computed["placeId"],
        "locationType": computed["locationType"],
    }
    return {
        "worker": WORKER_NAME, "workerVersion": WORKER_VERSION, "schemaVersion": SCHEMA_VERSION,
        "inputHash": _input_hash({"worker": WORKER_NAME, "address": address,
                                  "lat": lat, "lon": lon}),
        "result": result,
        "provenance": {**computed["provenance"], "date": _now()},
        "warnings": warnings,
        "computedAt": _now(),
    }


def main(argv: list[str]) -> int:
    p = argparse.ArgumentParser(description="Geocode an address → coordinates (onboarding worker).")
    p.add_argument("--address", type=str, default="1544 Piedmont Ave NE, Atlanta, GA 30324")
    p.add_argument("--lat", type=float, default=None)
    p.add_argument("--lon", type=float, default=None)
    p.add_argument("--out", type=Path, default=DEFAULT_OUT)
    p.add_argument("--quiet", action="store_true")
    args = p.parse_args(argv)

    envelope = build_result(args.address, args.lat, args.lon)
    rendered = json.dumps(envelope, indent=2)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(rendered + "\n", encoding="utf-8")
    if not args.quiet:
        print(rendered)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
