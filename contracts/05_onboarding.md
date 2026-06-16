# Contract · 05 — Onboarding (address → grabbable data)

> **What this defines:** the contract for the streamlined onboarding flow — a company supplies minimal parameters (ideally just an address) and the backend assembles a `Building` + `CandidateSurface[]` (HANDSHAKE §3). This is Stage 1→2 of the product flow.
> **Canonical:** HANDSHAKE.md §1 conventions, §3 core types, §3.7 `WorkerResult<T>`. Builds on the API surface in `03_api-endpoints.md` and the research in `ImplementationPlan/14_AutomatedOnboarding.md`.
> **Built today:** `pipeline/workers/geocode.py` (✅), `pipeline/workers/solar_buildinginsights.py` (✅), both safe-by-default with offline fallbacks. `gee_layers.py` (env rasters) and `POST /v1/onboard` are `[PLANNED]`.

---

## 1. Division of labor (verified domains)
| Step | Worker | Source (official, verified) | Fills |
|---|---|---|---|
| address → lat/lon + placeId | `geocode.py` ✅ | `maps.googleapis.com/maps/api/geocode/json` | `Building.location` |
| lat/lon → roof geometry | `solar_buildinginsights.py` ✅ | `solar.googleapis.com/v1/buildingInsights:findClosest` | `CandidateSurface[]` (roof) |
| footprint → env rasters | `gee_layers.py` `[PLANNED]` | `earthengine.googleapis.com` (or MS Planetary Computer) | LST (heat), canopy, impervious% |
| roof → solar yield | `solar_pysam.py` ✅ | NREL SAM / PySAM (local) | `SolarResult` |

> **GEE = environmental rasters; Maps Platform = building geometry.** Neither alone is enough — onboarding fans out to both. (See `14` for the GEE commercial-licensing caveat: prefer MS Planetary Computer if license-clean is required.)

## 2. New worker result types
```ts
interface GeocodeResult {
  inputAddress: string | null;
  formattedAddress: string | null;
  location: GeoPoint;                 // {lat, lon}
  placeId: string | null;             // storable indefinitely (Google ToS)
  locationType: string | null;
}
interface RoofSegment { areaM2: number; pitchDeg: number | null; azimuthDeg: number | null; }
interface BuildingInsightsResult {
  center: GeoPoint;
  wholeRoofAreaM2: number;
  maxArrayAreaM2: number | null;
  maxArrayPanelsCount: number | null;
  roofSegments: RoofSegment[];
  candidateSurfaces: CandidateSurface[];   // synthesized aggregated roof surface(s), HANDSHAKE §3.3
  imageryQuality: string | null;
}
interface GeeLayersResult {                 // [PLANNED]
  lstSummerF: ProvenancedValue;             // heat baseline
  treeCanopyPct: ProvenancedValue;
  imperviousPct: ProvenancedValue;          // stormwater Rv input
}
```
Each is returned wrapped in `WorkerResult<T>` (HANDSHAKE §3.7), content-addressed by `inputHash`.

## 3. The `POST /v1/onboard` endpoint  `[PLANNED]`
```ts
interface OnboardRequest {
  address?: string;                   // primary input
  lat?: number; lon?: number;         // optional manual override
  name?: string; owner?: string; city?: string;
  priority?: "roi" | "stormwater" | "heat" | "carbon" | "balanced";  // → engine weights
}
interface OnboardResult {
  building: Building;                 // assembled, HANDSHAKE §3.5
  sources: WorkerResult<unknown>[];   // geocode + buildingInsights + gee provenance trail
  gaps: string[];                     // fields still needing data (e.g. structural capacity, ENERGY STAR)
}
```
- **Async** (heavy fan-out): returns `202` + a `Job` (per `03`); `GET /v1/jobs/{id}` resolves to `OnboardResult`. Cached by the workers' `inputHash`.
- **Assembly:** geocode → `location`; buildingInsights → `surfaces[]`; gee → per-surface `imperviousPct` + building heat baseline; CBEEO lookup (separate, `[PLANNED]`) → `energyStarScore`. Result conforms to the `Building` schema and flows straight into `runEngine` (`contracts/02`).
- **Gaps surfaced, never faked:** structural `addedLoadCapacityPsf` (needs drawings/PE — no API), exact ENERGY STAR (CBEEO pull) → returned in `gaps[]` with `provenance.tier="gap"`.

## 4. Security posture (all onboarding workers)
- API keys (`GOOGLE_MAPS_API_KEY`, `[PLANNED]` `GEE_SERVICE_ACCOUNT_JSON`) read from **env/secrets only**; never hardcoded or logged.
- Destinations are **official, verified Google domains** (confirmed against developers.google.com) — and overridable only to a verified proxy via `*_BASE` env vars. (Contrast the `developer.nlr.gov` incident: no unverified domain ever receives a credential.)
- **ToS:** Maps geocode lat/lon + Solar grounded output cacheable **≤30 days** → transient TTL cache; `placeId` + our derived values are the durable store.
- Every worker **runs offline** (fixture fallback) so the demo never blocks on a key/network.

## 5. Status & maps-to-today
| Piece | Status |
|---|---|
| `geocode.py`, `solar_buildinginsights.py` | ✅ built, safe-by-default, offline fallback to Ansley |
| `gee_layers.py`, CBEEO lookup worker | `[PLANNED]` |
| `POST /v1/onboard` orchestration | `[PLANNED]` (today: run the workers via CLI, hand to `runEngine`) |

## 6. Proposed contract changes (for HANDSHAKE triage)
- Add `GeocodeResult`, `RoofSegment`, `BuildingInsightsResult`, `GeeLayersResult`, `OnboardRequest`, `OnboardResult` to the §3 type set.
- Add `/v1/onboard` + `/v1/jobs/{id}` (onboard variant) to the `03` endpoint list.
