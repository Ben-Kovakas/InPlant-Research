# Spec: Backend Architecture & Technology — In-Planted / Climate Resilient ATL

> **Version:** 1.0 · **Status:** Draft (for validation) · **Date:** 2026-06-16
> **Slug:** `backend-architecture`
> **Backend:** markdown (sds/dolt not detected)
> **Core thesis:** *We help companies transform sustainability ideas into city-ready proposals.*

---

## Overview

This spec defines the **backend technologies and architecture** that power the In-Planted green-retrofit engine: the **data layer** (acquiring and normalizing real Atlanta building/environmental data), the **scoring engine** (turning that data into ranked, quantified retrofit recommendations), and the **report/export** ("city-ready proposal") generation — all in service of the existing 3D digital-twin frontend (`src/App.jsx`).

The product takes a commercial building owner from a vague sustainability intent to a **submittable proposal**: ranked interventions (solar, green roof, agriculture, shade lattice) on a 3D twin, each with payback, captured gallons, tons CO₂, and a stacked-incentive dollar figure, plus a feasibility/permitability layer and an export the owner hands to the City and to the vendors they hire.

### Current State

- A working **client-side prototype** exists: a 608-line `src/App.jsx` (React + Three.js, Vite, no backend). The UI is injected as an HTML string; **all metrics are hard-coded placeholders** (`solarPct = 96 * height`, retention is a static `"1,150 gal"` string).
- Three planning docs are in place: `ImplementationPlan/01_PrototypeImplementationPlan.md` (frontend/engine refactor), `02_DataAcquisitionPlan.md` (verified data sources + demo building), `03_ReportExportSpec.md` (report taxonomy + JSON schema). This spec is the **backend/technology companion** to those.
- No data pipeline, no scoring engine, no report generator, no persistence yet.

### Primary Goal

Stand up the backend technology stack that makes the twin's numbers **real and data-driven** (at least solar end-to-end), produces the **city-ready proposal export**, and is structured to generalize to any city — built within a days-level hackathon timeline.

---

## Technology Decisions (the heart of this spec)

Resolved with the team on 2026-06-16:

| Decision | Choice | Rationale |
|---|---|---|
| **Scope / horizon** | **Demo-now, architect-for-later** | Win the hackathon, but pick tech and a data contract that extend cleanly to any-city production. |
| **Backend posture** | **Offline pipeline + static JSON fixtures + one thin serverless fn** | Demo must not depend on a live network round-trip on stage. The pipeline runs offline and commits results; the frontend reads files; serverless exists only to hide the PVWatts key for an optional live refresh. |
| **Language split** | **Python for data ingestion → JSON; JS scoring engine in the frontend** | Python owns the messy/geospatial work (ArcGIS, raster sampling, geocoding, API pulls); the scoring formulas live in shared JS so the twin can recompute live on the sun slider with zero network. Best-of-both. |
| **Report/export** | **Client print-to-PDF now; server-side PDF as a documented Phase-2 path** | `window.print()` on a styled HTML report = zero infra and a real PDF for the demo; production swaps in headless-Chrome/WeasyPrint without changing the report JSON. |

### Chosen stack

**Data pipeline (offline, Python 3.11+):**
- `requests` / `httpx` — CBEEO ArcGIS + PVWatts + eGRID pulls
- `pandas` — CBEEO tabular wrangling, normalization to the `Building` schema
- `geopandas` + `shapely` + `pyproj` — footprint polygons, area in UTM 16N (EPSG:26916), azimuth from min-bounding-rectangle
- `rasterio` — sample NLCD impervious % (and optional Landsat LST GeoTIFF) at the roof centroid
- *(optional)* `earthengine-api` — LST pull if GEE access lands; else empirical fallback
- Output: deterministic JSON fixtures written into `web/data/` (the data contract — §FR-5)
- Orchestrated by a single `make data` / `python -m pipeline` entrypoint; results **committed to the repo**.

**Scoring engine (JS, ES modules, framework-free):**
- Plain ES modules under `web/src/engine/` (per Doc 01) — pure, synchronous functions; JSDoc typedefs (no TS build step)
- Shared by the twin (live recompute) and the report generator (same numbers everywhere)
- PVWatts results are pre-fetched by the pipeline into a cache the engine reads synchronously

**Serverless (optional, dev/demo polish only):**
- One function `api/pvwatts` (Vercel or Netlify) injecting `NREL_API_KEY`, forwarding to `developer.nlr.gov` — powers a "refresh live" button. **Cut-line:** if it slips, the committed cache still makes solar fully data-driven.

**Report/export:**
- A JS report assembler builds the report object (per `03_ReportExportSpec.md` schema) from engine output; a styled HTML view + `window.print()` produces the PDF. Production path: a serverless/containerized renderer (headless Chrome) from the same JSON.

**Storage:**
- **Flat JSON/CSV fixtures in-repo for the demo** (no DB). The CBEEO bulk file lands as CSV; per-building outputs as JSON.
- *Architect-for-later note:* the schema is DB-ready; production target is **PostgreSQL + PostGIS** (geospatial joins, 2,350-building portfolio) or DuckDB+spatial for an embedded analytics path. Not built now.

**Hosting/deploy:** static frontend + fixtures on **Vercel/Netlify free tier**; serverless fn co-located. $0 infra.

### Data flow

```
[ Python pipeline (offline, committed) ]
  CBEEO (ArcGIS/CSV) ─┐
  Footprints (Fulton)─┤  geocode → area(UTM) → azimuth
  NLCD impervious ────┤  raster sample
  PVWatts v8 ─────────┤  per-roof system_capacity → ac_annual cache
  eGRID 0.3837 / rates┘  constants
        │  normalize
        ▼
  web/data/buildings/<id>.json  +  pvwatts/<key>.json  +  climate.<city>.json  +  incentives.<city>.json
        │  (the DATA CONTRACT)
        ▼
[ JS scoring engine (browser) ]  runEngine(building, ctx) → surfaceScores[], ranked[], buildingTotals, timeDependent
        │                                   ▲ sun t / weights / toggles
        ├──────────────▶ 3D twin (live readouts, in-scene badges)
        └──────────────▶ report assembler → city-ready proposal (HTML → print PDF)
                                              ▲ optional serverless /api/pvwatts (live refresh)
```

---

## Users

| User | Relationship to the backend |
|---|---|
| **Commercial building owner / asset manager** | End user of the *product*; consumes engine output + the exported proposal. Does not touch the backend directly. |
| **The hackathon dev team** | Operates the pipeline (`make data`), authors fixtures, wires the engine. Primary backend operators. |
| **City Sustainability Planner (Mayor's Office)** | *Recipient* of the exported Side-B contribution report — the audience the proposal is made "city-ready" for; not a system user. |
| **Hired vendors (PE, civil, arborist, architect, law)** | Recipients of the fan-out briefs the report generates. |

---

## Functional Requirements

> Acceptance criteria use Given/When/Then. IDs: `AC-{FR}.{seq}`.

### FR-1 — Python data-ingestion pipeline → normalized JSON *(Must)*
A reproducible offline pipeline pulls the demo building's data from the verified sources and emits fixtures conforming to the data contract.

- **AC-1.1** — *Given* a target building address/ABID, *when* `python -m pipeline --building <id>` runs, *then* it writes `web/data/buildings/<id>.json` populated with `location{lat,lon}`, `footprintAreaM2`, per-roof `usableAreaM2`, `orientation{azimuthDeg,tiltDeg}`, `imperviousPct`, and CBEEO fields (`energyStarScore`, `grossSqft`, `useType`).
- **AC-1.2** — *Given* a footprint polygon, *when* the pipeline computes area, *then* it reprojects to EPSG:26916 and reports area in m² (not raw degrees), and derives azimuth from the polygon's min-bounding-rectangle long axis (default 180 for flat roofs).
- **AC-1.3** — *Given* a source is unreachable (e.g., CBEEO bulk service), *when* the pipeline runs, *then* it falls back to a hand-entered building row and emits a valid fixture with a `provenance` flag marking which fields are manual vs. fetched — the build never blocks.
- **AC-1.4** — *Given* the pipeline completes, *when* outputs are inspected, *then* every numeric field carries a provenance tag (`fetched` | `manual` | `default`) and its source, so the demo can defend each number.

### FR-2 — PVWatts integration (offline cache + optional live proxy) *(Must)*
Solar is the hero data-driven metric; PVWatts data is fetched offline and cached, with an optional live path.

- **AC-2.1** — *Given* a roof surface with lat/lon, area, tilt, azimuth, *when* the pipeline runs the PVWatts step, *then* it calls `GET https://developer.nlr.gov/api/pvwatts/v8.json` with `system_capacity = usableAreaM2 × 0.15 × 0.7`, `array_type=1, tilt=10, azimuth=180, losses=14`, and writes `outputs.ac_annual` + `ac_monthly` to `web/data/pvwatts/<cacheKey>.json`.
- **AC-2.2** — *Given* a committed PVWatts cache, *when* the demo runs with no network, *then* solar kWh/yr displays from the cache (no live call in the hot path).
- **AC-2.3** — *Given* the optional serverless fn is deployed, *when* the user clicks "refresh live", *then* `api/pvwatts` injects `NREL_API_KEY` server-side, forwards to NREL, and the key is never present in client code or the repo.
- **AC-2.4** — *Given* a different roof azimuth/area or a new lat/lon in the fixture, *when* the cache is regenerated, *then* the displayed annual kWh and the solar ranking change accordingly (demonstrably data-driven, not `96%` hard-coded).

### FR-3 — Shared JS scoring engine *(Must)*
A framework-free JS engine computes the seven FINAL §7 metrics + the composite Green Infrastructure Suitability Score, consumed by both twin and report.

- **AC-3.1** — *Given* a `Building` + `ctx` (pvwatts cache, coefficients, weights), *when* `runEngine(building, ctx)` is called, *then* it returns `{ surfaceScores[], ranked[], buildingTotals, timeDependent }` per the Doc-01 schema.
- **AC-3.2** — *Given* the sun slider moves, *when* `evalTimeDependent(building, results, t)` runs, *then* it returns updated sun elevation, instantaneous solar capture %, crop shade m², and retention figure using only cheap arithmetic (no network/async).
- **AC-3.3** — *Given* a surface allows both solar and green roof, *when* the engine ranks them, *then* it keeps the higher-composite as the recommended package **and** retains the runner-up so the trade-off can be shown.
- **AC-3.4** — *Given* a weight change (ROI-first vs. stormwater-first), *when* weights update, *then* the ranking re-sorts live.
- **AC-3.5** — *Given* every coefficient, *when* read, *then* it resolves from `coefficients.js` / `climate.<city>.json` with a cited source (e.g., eGRID 0.3837 kg/kWh, GA Power $0.115/kWh) — no magic numbers inline.

### FR-4 — City-ready proposal generation & export *(Must)*
Assemble the master owner report + fan-out briefs from engine output and export to PDF.

- **AC-4.1** — *Given* engine output for a building, *when* the report is generated, *then* it produces the master report object per `03_ReportExportSpec.md` (snapshot+rating, package on twin, impact deltas, cost/ROI + incentive stack, feasibility+codes, next-step checklist).
- **AC-4.2** — *Given* the master report, *when* exported, *then* the owner can produce a PDF via `window.print()` on the styled HTML (no PDF library, no server).
- **AC-4.3** — *Given* the report, *when* generated, *then* each number is tagged modeled/measured/illustrative with its source and any `verify` flag (credibility requirement).
- **AC-4.4** — *Given* the report, *when* generated, *then* it includes the Side-B City/Mayor's-Office contribution snippet (goal-contribution framing) — the two-sided ledger.

### FR-5 — Data contract / schema *(Must)*
A versioned schema is the single interface between the Python pipeline and the JS engine/frontend.

- **AC-5.1** — *Given* the schema (`web/src/data/schema.js` JSDoc typedefs), *when* the pipeline emits a building fixture, *then* it validates against `Building` / `CandidateSurface` / `Score` shapes.
- **AC-5.2** — *Given* a fixture, *when* the engine loads it, *then* no field name or unit mismatch occurs (areas in m², energy in kWh/yr, cost in USD) — units are documented in the schema.

### FR-6 — Any-city generalization via config *(Should)*
Retargeting to another city changes data/config only, not formula code.

- **AC-6.1** — *Given* a new city, *when* a `climate.<city>.json` (grid factor, utility rate, rainfall, first-inch basis) and `incentives.<city>.json` are added and the pipeline is re-pointed, *then* the engine produces scores without code changes to the seven formula modules.
- **AC-6.2** — *Given* the pipeline, *when* run for a new lat/lon, *then* PVWatts (global) works immediately with no city-specific change.

### FR-7 — Optional live serverless PVWatts proxy *(Nice to Have)*
- **AC-7.1** — *Given* time remains after the hero path, *when* `api/pvwatts` is deployed to the free tier, *then* a live re-fetch updates the in-memory cache and the displayed kWh — and degrades gracefully (falls back to committed cache) if the call fails.

---

## Non-Functional Requirements

- **Performance:** `evalTimeDependent` must keep the sun-slider interaction smooth — target < 16 ms recompute per frame (pure arithmetic, no I/O). Pipeline latency is non-critical (offline).
- **Demo-safety / Reliability:** zero network dependency in the demo hot path; all live data is pre-fetched and committed. Any live call (serverless) must have a committed-cache fallback.
- **Security:** `NREL_API_KEY` lives only in serverless env vars — never in client bundles or git. No PII; CBEEO data is public disclosure data.
- **Cost:** $0 infra — static hosting + serverless free tier; all data sources free/public (PVWatts, eGRID, CBEEO, Fulton footprints, NLCD).
- **Operability:** the pipeline is one command, deterministic, and re-runnable; outputs are committed so any teammate can run the demo without secrets (except the optional live path).
- **Portability:** national sources (PVWatts, eGRID, FEMA, NLCD, NPS historic standards) carry over; only city config + local zoning/tree/historic data is re-sourced (per ExecutiveSummary Portability Note).
- **Provenance/credibility:** every emitted number is traceable to `fetched`/`manual`/`default` + a citation; honesty about modeled-vs-measured is a hard requirement.

---

## In Scope

The offline Python ingestion pipeline for the demo building, the PVWatts offline cache (+ optional live proxy), the shared JS scoring engine (7 metrics + composite), the client-side report assembler with print-to-PDF, the JSON data contract, and city-config-based generalization hooks.

## Out of Scope / Non-Goals

- A running application server / persistent database (deferred to production; PostGIS noted as the target).
- Server-side PDF rendering (documented as the Phase-2 path; not built now).
- EnergyPlus / first-principles energy & heat modeling (empirical-% and empirical-delta used instead, per FINAL §7.3/§7.4).
- Live Google Earth Engine integration as a hard dependency (empirical roof-temp deltas are the demo fallback).
- Transportation/walkability features (FINAL §5.5 — out of scope).
- Auth, multi-tenant, billing (not relevant to a hackathon demo).

## Constraints

- **Timeline:** days. Bias to buildable over rigorous; every constant is a defensible placeholder with a source.
- **No live network on stage** for the core demo.
- **CBEEO bulk file is not a confirmed one-click download** — must be captured via ArcGIS DevTools or requested from `buildingefficiency@atlantaga.gov`; single-building manual fallback required.
- **NREL domain moved** to `developer.nlr.gov` (old `developer.nrel.gov` retired 2026-05-29) — all code/docs must use the new host.
- Engine must remain framework-free JS shared with the existing Three.js/React twin (no rewrite to react-three-fiber).

## Assumptions

- Footprint area ≈ roof area for the demo building; usable roof ≈ 0.6–0.7 × footprint.
- Flat-roof south-facing PV (tilt 10°, azimuth 180°) is acceptable for the demo.
- eGRID SRSO = **0.3837 kg CO₂/kWh** and GA Power commercial ≈ **$0.115/kWh** hold for the demo.
- The demo building benchmarks in a lower ENERGY STAR band (good "before") — to be confirmed from CBEEO.
- Free-tier serverless + static hosting is acceptable for the demo.

## Dependencies

- **External data/APIs:** CBEEO (ArcGIS / `buildingefficiency@atlantaga.gov`), NREL PVWatts v8 (`developer.nlr.gov`, free key), EPA eGRID, Fulton County / Microsoft footprints, USGS NLCD, optional Google Earth Engine (LST), Georgia Power tariff, NOAA normals.
- **Internal:** `ImplementationPlan/01` (engine/frontend structure), `02` (data sources + demo building 100 Peachtree / Fairlie-Poplar mid-rise alternate), `03` (report schema), `FINAL.md §7` (formulas), `ExecutiveSummary.md` (feasibility layer).
- **Runtimes:** Python 3.11+ (pipeline), Node 18+ / Vite (frontend + engine), Vercel/Netlify (optional serverless).

---

## Success Metrics

- **At least one metric (solar) is visibly data-driven:** changing a roof input or lat/lon changes the displayed kWh and ranking — sourced from PVWatts, not hard-coded.
- **A city-ready proposal PDF** can be exported for the demo building, with payback, gallons, tons CO₂, and a stacked-incentive dollar figure, every number traceable to a source.
- **Reproducibility:** a teammate can run `make data` and reproduce the committed fixtures (manual fallback path works offline).
- **Generalization proof:** pointing the pipeline at a different lat/lon produces valid solar output with no formula-code change.
- **$0 infra** and **no network dependency** in the on-stage demo path.

---

## Open Questions

1. **CBEEO bulk access** — can we capture the ArcGIS Feature Service URL (DevTools) or get the CSV from the City in time, or do we ship the single-building manual fallback? *(Blocks portfolio view, not the single-building demo.)*
2. **LST/heat** — pursue Google Earth Engine for real roof temps, or ship empirical deltas? *(Affects only the heat metric's credibility; fallback is sanctioned by FINAL §7.3.)*
3. **Composite weights** — fixed defaults vs. user sliders for the demo. *(Doc 01 assumes sliders.)*
4. **Single-building vs. portfolio** as the lead narrative. *(Portfolio needs the CBEEO bulk pull + arguably PostGIS; single-building does not.)*
5. **Serverless provider** — Vercel vs. Netlify for the optional `api/pvwatts` (and where the static site is hosted). *(Cosmetic; either free tier works.)*

---

## Appendix — Repo layout impact

```
/                         # repo root (currently the Vite app)
  web/                    # (or keep current root) — frontend + engine + committed data
    src/engine/           # shared JS scoring engine (FR-3)  [Doc 01 §1]
    src/data/schema.js    # data contract (FR-5)
    data/                 # committed fixtures: buildings/, pvwatts/, climate.*, incentives.*
  pipeline/               # NEW — Python ingestion (FR-1, FR-2 offline)
    __main__.py           # `python -m pipeline --building <id>`
    sources/              # cbeeo.py, pvwatts.py, footprints.py, nlcd.py, egrid.py
    normalize.py          # → Building/CandidateSurface JSON
    requirements.txt      # requests, pandas, geopandas, shapely, pyproj, rasterio
  api/                    # OPTIONAL serverless (FR-7) — pvwatts.js (key in env)
  Makefile                # `make data`, `make dev`
```
