# 14 — Automated Business Onboarding (Address → Building + CandidateSurface[])

## In-Planted / Climate Resilient ATL · Green-Retrofit Engine + 3D Twin

> **Owner:** Geospatial-integration researcher · **Date:** 2026-06-16
> **Scope:** How **Google Earth Engine (GEE) API endpoints** + the **Google Maps Platform geospatial APIs** can streamline *business onboarding*: a company types an **address** (maybe a name/SQFT) and the backend automatically "grabs" the layers needed to build a retrofit model — assembling our `Building` + `CandidateSurface[]` (HANDSHAKE §3).
> **Builds on (does not repeat):** `06_GeospatialDataPipeline.md` (Solar/Geocode/footprints/NLCD/GEE-LST findings), `architecture/01_DataGeospatial.md` (production data arch, CandidateSurface factory, ToS rules). This doc refines those for the **onboarding** angle and adds GEE REST + commercial-licensing reality.
> **Verification:** Every Google endpoint/domain/dataset below was checked June 2026 against official Google docs (`developers.google.com`, `cloud.google.com`, `earthengine.google.com`). Anything not pinned to a primary source is flagged **[UNVERIFIED]**. Pricing-page bodies truncate in-tool; figures are cross-checked against the official pricing/FAQ pages and flagged where the page body could not be fully rendered.

---

## 0. TL;DR — the headline

- **GEE genuinely streamlines onboarding for the *environmental raster* half** — LST/heat, NDVI/canopy, impervious %, imagery, elevation/DSM — all from **one auth, one client, one parcel geometry**, via `computePixels` / `getPixels` / `getThumbnail`. It does **not** give building geometry.
- **The division of labor is clean:** **Maps Platform = building geometry & identity** (address→validated address→lat/lon→`place_id`→roof segments). **GEE = environmental context rasters** sampled over that footprint. Onboarding = run both, join on the building key.
- **Licensing verdict (go/no-go): GEE commercial use is PAID.** Noncommercial (research/edu/nonprofit/gov-research) is free; **a for-profit product backend must register a commercial Cloud Earth Engine project** — pay-as-you-go **~$1.33/Online-EECU-hr, ~$0.40/Batch-EECU-hr, ~$0.026/GB-month**, or a **Professional plan ~$2,000/mo** (verified figures; pricing-page body truncated — confirm at sales/console before commit). **This is a real cost line, not free.** A license-clean alternative (Microsoft Planetary Computer + COG/STAC, already in `architecture/01`) sidesteps the GEE fee for most of these same rasters.
- **Maps Platform free tier (post March-2025):** the old $200 credit is gone; now **per-SKU free monthly calls — 10K Essentials / 5K Pro / 1K Enterprise.** At onboarding volumes (one building at a time) this is effectively $0, but it is **per-SKU**, so a multi-call onboarding flow burns several SKUs per building.
- **Top things to add:** ingestion workers `geocode.py`, `solar_buildinginsights.py`, `gee_layers.py` (all emitting the canonical `WorkerResult`), one `[PLANNED]` `POST /onboard` API endpoint, and two secrets (a **GEE service-account JSON** + a **Maps API key**). Maps geometry stays **transient (≤30-day ToS)**; GEE/USGS rasters and our derived values are the durable store.

---

## 1. Google Earth Engine REST API / client — what it is and how to call it

### 1.1 What it actually is
GEE is a **planetary raster catalog (50+ PB) + a server-side compute engine.** You never download the petabytes; you describe a computation (clip to a polygon, reduce over a date range, select a band) and the server runs it and returns a small result (pixels, a thumbnail, or a `Feature`). It is **rasters, not vector buildings** — confirming `06` §1.5: GEE is for environmental layers only, never building geometry.

### 1.2 The two ways to call it
| Path | What it is | When to use |
|---|---|---|
| **Python client** (`earthengine-api`, `import ee`) | Thin wrapper that builds a serialized compute graph and POSTs it to the REST backend. `ee.Image(...).reduceRegion(...)`, `ee.data.computePixels()`, `ee.data.getPixels()`. | **Recommended for our pipeline** — Pythonic, matches the existing worker style. |
| **Raw REST** (`earthengine.googleapis.com`, `v1`) | Direct HTTPS against the same backend. Discovery doc: `https://earthengine.googleapis.com/$discovery/rest?version=v1`. | When you can't install the client, or for a thin serverless function. |

**Key REST methods (host `earthengine.googleapis.com`, version `v1`):**
| Method | Endpoint shape | Returns | Sync/async |
|---|---|---|---|
| `projects.image.computePixels` | `POST /v1/{project}/image:computePixels` | computed pixels (GeoTIFF/NPY/PNG) for a window | **synchronous**, size-limited |
| `projects.assets.getPixels` | `POST /v1/{name}:getPixels` | raw pixels from a stored asset | synchronous, size-limited |
| `projects.image.computeImages` / `.value:compute` | `POST /v1/{project}/value:compute` | the JSON result of an expression (e.g. a `reduceRegion` mean = the number we actually want) | synchronous |
| `projects.thumbnails.getPixels` / `computeThumbnails` | `POST /v1/{project}/thumbnails:...` | a rendered **PNG/JPEG thumbnail** (the twin backdrop image) | synchronous |
| `projects.image.export` / `projects.table.export` (+ `operations`) | `POST .../image:export` then poll `projects.operations` | a long-running **batch export** to GCS/Drive | **async** (operation polling) |

> **Compute model for onboarding:** for a single building we want **scalar reductions, not rasters** — e.g. "mean LST over the footprint", "mean canopy %", "mean impervious %". Those go through `value:compute` (a `reduceRegion` graph) and return **a single number per layer synchronously in seconds** — ideal for an interactive onboarding call. Use `computePixels`/`getThumbnail` only when we want an actual clipped raster or a backdrop image. Reserve `export` (async) for batch/portfolio runs.
> Source: [EE REST API reference](https://developers.google.com/earth-engine/reference/rest), [computePixels](https://developers.google.com/earth-engine/reference/rest/v1/projects.image/computePixels), [getPixels method](https://developers.google.com/earth-engine/reference/rest/v1beta/projects.thumbnails/getPixels), [Image computations w/ REST](https://developers.google.com/earth-engine/Earth_Engine_REST_API_compute_image).

### 1.3 Service-account auth (the only sane mode for a backend)
- Create a Google Cloud **service account**, grant it the **Earth Engine Resource Viewer** role, register it on an **Earth Engine-enabled (commercial) Cloud project**, download a **private-key JSON**.
- Authenticate: `ee.ServiceAccountCredentials(email, key_file)` → `ee.Initialize(creds, project=...)`. (Raw REST: `google.oauth2.service_account.Credentials.from_service_account_file(...)` → bearer token on every request.)
- The key JSON is a secret — mount via env/secret manager exactly like the existing `NREL_API_KEY` handling in `solar_pysam.py` (server-side only, never in the on-stage hot path).
- Source: [EE Service Accounts](https://developers.google.com/earth-engine/guides/service_account), [Auth & Init](https://developers.google.com/earth-engine/guides/auth).

### 1.4 Quotas / compute units
- Work is metered in **EECU-hours** (Earth Engine Compute Units). **Online EECU** = near-real-time interactive requests (our onboarding path); **Batch EECU** = big exports. Concurrency + EECU quotas apply per project/plan. Single-building scalar reductions are tiny (sub-EECU-hour). Source: [EE quotas/usage](https://developers.google.com/earth-engine/guides/usage), [EE pricing](https://cloud.google.com/earth-engine/pricing).

### 1.5 Layers to pull per a business's parcel/footprint (verified dataset IDs)
| Need (FINAL §7) | GEE dataset ID | What it gives | Native resolution | Fills in our model |
|---|---|---|---|---|
| **Land-surface temperature** (heat, §7.3) | `LANDSAT/LC08_C02_T1_L2` / `LANDSAT/LC09_C02_T1_L2` (band `ST_B10`, scale to °C) | Surface temp from Landsat 8/9 thermal | **30 m** (100 m resampled) | roof "before" temp → `heatDeltaF` baseline |
| **LST, higher-res alt** | `NASA/ECOSTRESS/L2T_LSTE/V2` | ISS-borne LST + emissivity | **70 m** | sharper urban-heat sampling where coverage exists |
| **NDVI / vegetation** (biodiversity, shade) | `NASA/ECOSTRESS/L2T_STARS/V2` (NDVI), or Landsat/Sentinel NDVI composites | greenness index over parcel | 70 m / 10–30 m | shade & `biodiversityM2` baseline, pervious context |
| **Tree canopy** | `USGS/NLCD_RELEASES/2023_REL/TCC/v2023-5` (USFS Tree Canopy Cover) | % tree canopy per pixel | 30 m | canopy baseline for `lotTrees` / shade interventions |
| **Impervious surface** (stormwater, §7.2) | `USGS/NLCD_RELEASES/2021_REL/NLCD` (impervious band) or `2019_REL/NLCD` | % impervious per pixel | 30 m | `CandidateSurface.imperviousPct` (Rv input) |
| **Imagery** (twin backdrop / report) | NAIP `USDA/NAIP/DOQQ`, or Sentinel-2 `COPERNICUS/S2_SR_HARMONIZED` | RGB aerial/satellite | 0.6–1 m (NAIP) / 10 m (S2) | report image via `getThumbnail` |
| **Elevation / DSM** (roof/slope, site) | `USGS/SRTMGL1_003` (band `elevation`, 30 m); production uses **3DEP LiDAR** (see `architecture/01`) | terrain elevation | **30 m** (SRTM); sub-meter (3DEP) | site slope; SRTM too coarse for roof planes — use Solar API / 3DEP for those |

> Sources: [EE Data Catalog](https://developers.google.com/earth-engine/datasets/catalog), [Landsat 8 L2](https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C02_T1_L2), [ECOSTRESS LSTE V2](https://developers.google.com/earth-engine/datasets/catalog/NASA_ECOSTRESS_L2T_LSTE_V2), [ECOSTRESS STARS NDVI V2](https://developers.google.com/earth-engine/datasets/catalog/NASA_ECOSTRESS_L2T_STARS_V2), [USFS Tree Canopy Cover v2023-5](https://developers.google.com/earth-engine/datasets/catalog/USGS_NLCD_RELEASES_2023_REL_TCC_v2023-5), [NLCD 2021](https://developers.google.com/earth-engine/datasets/catalog/USGS_NLCD_RELEASES_2021_REL_NLCD), [SRTM GL1 v003](https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003).
>
> **Note:** these datasets (USGS/NASA/USDA) are **public-domain and storable** — when sampled *through GEE* you pay GEE compute, but the *resulting numbers* are USGS/NASA values we can persist freely (unlike Google Maps content). This is why GEE-vs-Planetary-Computer is a **cost** choice, not a licensing one, for these layers.

---

## 2. GEE LICENSING reality (the go/no-go) ⚠️

**Verified (June 2026):**
- **Noncommercial use is free** — "verified noncommercial" projects (undergrad/grad students, nonprofits/NGOs, university & government *research* groups) get monthly EECU-hour quotas at no cost (Community / Contributor / Partner tiers). Source: [Noncommercial tiers](https://developers.google.com/earth-engine/guides/noncommercial_tiers), [earthengine.google.com/noncommercial](https://earthengine.google.com/noncommercial/).
- **Commercial / for-profit use is PAID.** "If you work at a private company, you need to configure a paid (commercial) Earth Engine account." You register the Cloud project as commercial and attach a billing account + an active Earth Engine plan. Source: [Transition to commercial](https://developers.google.com/earth-engine/guides/transition_to_commercial), [earthengine.google.com/commercial](https://earthengine.google.com/commercial/), [EE access](https://developers.google.com/earth-engine/guides/access).

**Pricing tiers (verified figures; the cloud.google.com/earth-engine/pricing body truncated in-tool, so confirm at console/sales before committing budget):**
| Mode | Price | Note |
|---|---|---|
| On-demand **Online** EECU-hour | **~$1.33** | interactive (our onboarding path) |
| On-demand **Batch** EECU-hour | **~$0.40** | large exports |
| **Storage** | **~$0.026 / GB-month** | EE Cloud assets |
| **Professional plan** | **~$2,000 / month** flat | bundles ~500 Batch + ~50 Online EECU-hr + 1 TB storage credit |

> Source for figures: [EE pricing page](https://cloud.google.com/earth-engine/pricing) (body truncated — figures cross-checked against secondary summaries; **[VERIFY exact numbers at the console before any budget commitment]**).

**Verdict for *our* product:**
- **In-Planted / Climate Resilient ATL is sponsored by the City of Atlanta** and frames as climate-resilience/sustainability work. If it ships as a **government / nonprofit research** tool, it may qualify for **free noncommercial** (Partner tier even targets "high-impact sustainability"). **If it ships as a Cox Automotive commercial product, GEE is a paid line item.** This must be decided before relying on GEE in the hot path.
- **Recommended hedge (consistent with `architecture/01`):** use GEE for **rapid prototyping / the demo** (cheap, one auth), but architect the production raster path to **Microsoft Planetary Computer (STAC/COG) + `rasterio` windowed reads**, which serves the *same* NLCD/Landsat/canopy layers **free with no per-compute fee and no commercial-license gate.** GEE then becomes optional/swappable, not load-bearing. **Flag clearly in any productization pitch: do not assume GEE is free.**

---

## 3. The Google Maps Platform onboarding stack (the address→building half)

All four below share one **Maps API key** (server-side). Post-**March 1, 2025** there is **no $200 credit**; instead **free monthly calls per SKU: 10K Essentials / 5K Pro / 1K Enterprise**, then pay-as-you-go with volume discounts. Source: [March 2025 changes](https://developers.google.com/maps/billing-and-pricing/march-2025), [billing FAQ](https://developers.google.com/maps/billing-and-pricing/faq), [10K free calls blog](https://mapsplatform.google.com/resources/blog/start-building-today-with-up-to-10-000-monthly-free-calls-per-product/).

| API | Input → Output | How it advances "address → Building/CandidateSurface" | Pricing / free tier | ToS caching |
|---|---|---|---|---|
| **Address Validation** `POST https://addressvalidation.googleapis.com/v1:validateAddress` | messy address → `verdict` (granularity/completeness), corrected `address`, `geocode{location, placeId}`, `metadata{business/residential/poBox}`, USPS data | **Gate + clean** the user's typed address before anything else; rejects undeliverable/ambiguous input; yields lat/lon + `place_id` in one call | pay-as-you-go (no free $200 credit post-3/25); per-SKU free calls apply | per Maps ToS (transient); `place_id` storable ∞ |
| **Geocoding** `GET https://maps.googleapis.com/maps/api/geocode/json?address=...` | address → `results[0].geometry.location{lat,lng}`, `place_id`, `location_type` (ROOFTOP best) | Fills `Building.location`; the lat/lon that drives Solar + GEE | **Essentials SKU**, 10K free/mo | lat/lon **≤30 days**; `place_id` **∞** (confirmed `06` §1.3) |
| **Places API (New)** `POST https://places.googleapis.com/v1/places:searchText` (+ `GET /v1/places/{place_id}` Details, requires `FieldMask`) | free-text **address or business/owner name** → `places/{id}`, `location`, `formattedAddress`, `displayName`, `types`; Details → photos, `regularOpeningHours`, etc. | Resolve **"Equitable Building Atlanta"** or a messy entry to a canonical place; pull a **building photo** for the report card; identify `useType` from `types` | **SKU-tiered** (Essentials/Pro/Enterprise); billed at the **highest SKU in the field mask**; per-SKU free calls | `place_id` ∞; other content transient |
| **Solar API — Building Insights** `GET https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=..&location.longitude=..` | lat/lon → per-roof-segment `areaMeters2`, `pitchDegrees`, `azimuthDegrees`, `wholeRoofStats.groundAreaMeters2`, `maxArrayAreaMeters2`, `sunshineQuantiles`, `imageryQuality` | **The geometry win** (full mapping in `06` §1.1): fills `footprintAreaM2`, `usableAreaM2`, per-surface `tiltDeg`/`azimuthDeg`, `sunExposure` | **10K free Building Insights/mo**, then volume | Solar "Grounded Output" cacheable **≤30 days**; don't commit raw |
| **Solar API — Data Layers** `GET .../v1/dataLayers:get?...&radiusMeters=..` | lat/lon + radius → GeoTIFF URLs: DSM, RGB, mask, annual/monthly flux, hourly shade | optional real per-pixel flux/DSM or RGB roof texture for twin | **only 1K free/mo** | heavy Google content, ≤30 days — **skip unless flux overlay needed** |
| **Aerial View / Map Tiles / Photorealistic 3D Tiles** (`tile.googleapis.com`, `aerialview.googleapis.com`) | POI/region → flyaround video / streamed glTF photoreal mesh / tiles | **Visual only** — twin backdrop, not data; mesh ≠ clean roof planes (`06` §1.5, `architecture/01` §4) | 3D Tiles ~$6/1k; Aerial View ~$16/1k | Google content; render live, don't persist |

> **Caching confirmation (the ToS limit we already knew):** Geocoding lat/lon and Solar "Grounded Output" are cacheable **≤30 consecutive days**; `place_id` may be stored **indefinitely**. This is the hard rule from `06` §2 / `architecture/01` §3.4 and it governs the onboarding store design below. Source: [Geocoding overview](https://developers.google.com/maps/documentation/geocoding/overview), [Solar overview](https://developers.google.com/maps/documentation/solar/overview), [Maps service terms](https://cloud.google.com/maps-platform/terms/maps-service-terms).

---

## 4. The combined streamlined-onboarding flow

### 4.1 Call-sequence diagram (one building, interactive)

```
 BUSINESS USER
   │  enters: address  (+ optional building name, gross SQFT)
   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ONBOARDING BACKEND   POST /onboard   [PLANNED]                            │
│                                                                            │
│  STEP 1  Address Validation API ──────────────► verdict + corrected addr   │
│          addressvalidation.googleapis.com/v1   + geocode{lat,lon,placeId}  │
│          ▼ (if verdict granularity < PREMISE → bounce back to human)       │
│  STEP 2  [name given?] Places searchText ─────► place_id, displayName,     │
│          places.googleapis.com/v1               types→useType, photo        │
│          ▼ (else reuse placeId/lat-lon from Step 1; Geocoding as fallback)  │
│  STEP 3  Solar buildingInsights:findClosest ──► roofSegmentStats[],        │
│          solar.googleapis.com/v1                groundAreaMeters2,           │
│          ▼                                      maxArrayAreaMeters2, quality │
│  STEP 4  GEE value:compute (reduceRegion ×N) ─► meanLST, canopy%,          │
│          earthengine.googleapis.com/v1          impervious%, NDVI           │
│          (+ getThumbnail → backdrop PNG)        [over Solar footprint poly] │
│          ▼                                                                  │
│  STEP 5  ASSEMBLE + PROVENANCE                                              │
│          • Building{location, name, address, useType, surfaces[]}           │
│          • CandidateSurface[] roof (Solar) + perimeter/parking (GEE+poly)   │
│          • Maps content → TTL'd transient cache (≤30d); persist OUR derived │
│          ▼                                                                  │
│  STEP 6  HAND TO ENGINE  → solar_pysam.py (kWh) + scoring (FINAL §7)        │
└──────────────────────────────────────────────────────────────────────────┘
   ▼
 Building + CandidateSurface[]  →  EngineResult  →  3D twin / report
```

### 4.2 What each step fills (mapped to HANDSHAKE §3 types)
| Step | API | Fills | Automated? |
|---|---|---|---|
| 1 | Address Validation | `Building.address` (corrected), `location{lat,lon}`, `place_id`; **gate** | ✅ fully; **human only if** `verdict` granularity is sub-premise/undeliverable |
| 2 | Places (New) / Geocoding fallback | `Building.name`, `owner?`, `useType` (from `types`), report photo, `place_id` | ✅ auto; human optional to confirm the matched place if name was fuzzy |
| 3 | Solar Building Insights | per-roof `CandidateSurface{areaM2, usableAreaM2, orientation{tiltDeg,azimuthDeg}, sunExposure}`, `roofAreaM2` | ✅ if `imageryQuality ∈ {HIGH,MEDIUM}`; **fallback to Fulton footprint + flat-roof** if LOW/missing (`06` §2b) |
| 4 | GEE `value:compute` | roof/perimeter `CandidateSurface.imperviousPct`, heat baseline (→`heatDeltaF`), canopy/NDVI (→`biodiversityM2`), backdrop image | ✅ auto; values are USGS/NASA → **storable** |
| 5 | assemble | full `Building` + `CandidateSurface[]` with per-value `Provenance`; eligibility gate → `allowedInterventions[]` | ✅ auto (deterministic) |
| 6 | engine | `solar_pysam` → `SolarResult`; scoring → `EngineResult` | ✅ auto |

**Where it stays automated vs. needs a human:**
- **Fully automated happy path:** clean address in a Solar-HIGH-coverage area → zero human touch from address to scored model.
- **Human-in-the-loop triggers:** (a) Address Validation `verdict` below premise granularity; (b) Places returns multiple candidates for a fuzzy name; (c) Solar `imageryQuality` LOW/absent on a tall tower (100 Peachtree case) → confirm the Fulton-footprint fallback; (d) structural load (`addedLoadCapacityPsf`) and `useType` confirmation are **always** manual/attribute-sourced (no API delivers them) — these stay `provenance.tier="manual"` or `"gap"`.

---

## 5. What to ADD to our system

### 5.1 New ingestion workers (canonical `WorkerResult`, mirror `solar_pysam.py`)
Each: deterministic, `inputHash`, fidelity ladder, **always emits valid JSON**, secret handling like `NREL_API_KEY` (no default domain; off unless a verified base/key is set).

| Worker | Input | Emits (`WorkerResult<T>.result`) | Source / fallback ladder |
|---|---|---|---|
| **`geocode.py`** | address (+name) | `{lat, lon, placeId, formattedAddress, locationType, useType?}` | Address Validation → Places searchText → Geocoding; **place_id durable, lat/lon transient** |
| **`solar_buildinginsights.py`** | lat/lon | `{surfaces:[{areaM2, usableAreaM2, tiltDeg, azimuthDeg, sunExposure}], imageryQuality}` per roof segment | Solar `findClosest` → **Fulton footprint + flat-roof** fallback (`06` §2b). Persist OUR derived areas, not raw Google |
| **`gee_layers.py`** | footprint polygon (or centroid + radius) | `{meanLstC, impervPct, canopyPct, ndvi, backdropPngRef?}` | GEE `value:compute` reductions over the polygon → **Planetary Computer COG sample** fallback (license-clean, no GEE fee) |

> `gee_layers.py` is **one worker, many layers** — it builds N `reduceRegion` graphs in a single `ee.Initialize` session and returns one bundle, minimizing EECU and auth overhead. Its values are USGS/NASA → storable with `provenance.tier="fetched"`.

### 5.2 New `[PLANNED]` API endpoint (extends HANDSHAKE §5 / `03_api-endpoints.md`)
```
POST /onboard            [PLANNED]
  body:    { address: string, name?: string, grossSqft?: number }
  async:   returns { jobId }  →  poll  GET /jobs/{jobId}
  result:  { building: Building, surfaces: CandidateSurface[],
             warnings: string[], provenance per value }
  notes:   orchestrates geocode → solar_buildinginsights → gee_layers,
           then assembles + validates against the Building JSON Schema (01_domain-types.md).
           Heavy/uncertain calls run async (job pattern), matching the existing
           "no live Google call on the on-stage hot path" NFR.
```

### 5.3 Auth / secrets to add
| Secret | For | Handling |
|---|---|---|
| `GEE_SERVICE_ACCOUNT_JSON` (+ `GEE_PROJECT`) | `gee_layers.py` | service-account key, **commercial EE project**; env/secret-manager only; never client-side |
| `GOOGLE_MAPS_API_KEY` | `geocode.py`, `solar_buildinginsights.py` | server-side key, **billing-enabled** Cloud project, restricted to the enabled APIs |
| (existing) `NREL_API_KEY` / `NREL_API_BASE` | `solar_pysam.py` | unchanged — the model for safe secret handling |

### 5.4 Mapping to product Stage 1 → Stage 2
- **Stage 1 (Onboard / "grab the data"):** `POST /onboard` runs Steps 1–5 → a populated, provenance-tagged `Building` + `CandidateSurface[]`. This is the "company types an address, we build the model inputs" experience.
- **Stage 2 (Score / propose):** the assembled object feeds `solar_pysam.py` + the scoring engine (FINAL §7) → `EngineResult` → 3D twin + city-ready proposal. Onboarding is exactly the front door of the **CandidateSurface factory** in `architecture/01` §0.

### 5.5 Build-vs-buy & GEE-vs-Maps division of labor
| Capability | Verdict |
|---|---|
| Address clean/validate, identity, lat/lon | **Buy: Maps Platform** (Address Validation + Places/Geocoding) — nothing to build |
| Roof geometry (area/tilt/azimuth) | **Buy: Solar Building Insights** (transient) → **Build fallback:** Fulton footprint + flat-roof (storable) |
| Environmental rasters (LST/canopy/impervious/NDVI/imagery/elevation) | **Buy (prototype): GEE**; **Build/free (production): Planetary Computer COG/STAC** — same data, no GEE fee/commercial gate |
| Parking-lot / obstruction surfaces | **Build: ML** (SAM2) — *no API delivers it* (`architecture/01` §1.1); not part of address-only onboarding |

> **Clean rule:** **Maps Platform owns building geometry & identity; GEE (or Planetary Computer) owns environmental rasters.** Onboarding runs both and joins on the building key.

---

## 6. Risks / flags

1. **GEE commercial licensing (go/no-go).** Free only for verified noncommercial; **a for-profit backend pays** (~$1.33 Online EECU-hr / ~$2,000/mo Professional). Decide product classification **before** GEE is load-bearing; keep Planetary Computer as the license-clean swap. **[Pricing-page body truncated in-tool — verify exact numbers at the Cloud console/sales.]**
2. **Maps ToS caching.** Geocode lat/lon & Solar output **≤30-day** cache; **no permanent derived dataset.** Onboarding must write Maps content to a **TTL'd transient cache** and persist only `place_id` + our derived/PVWatts/USGS values (`06` §2, `architecture/01` §3.4). Do **not** claim "we store Google's solar data."
3. **Per-SKU free tier, not per-account.** Post-March-2025 each onboarding hits ~4 SKUs (Validation, Places, Solar, [Geocoding]); free caps are **per SKU** (10K/5K/1K). Fine for onboarding volumes; watch at portfolio (2,350-building) scale.
4. **Coverage gaps.** Solar tall-tower DSM noise (100 Peachtree); ECOSTRESS LST coverage is intermittent (ISS orbit) — Landsat `ST_B10` is the reliable baseline; NAIP/3DEP not everywhere. Always record `imageryQuality` and have fallbacks wired.
5. **Resolution honesty.** 30 m LST/impervious is coarse for a single roof — label heat as modeled/illustrative (FINAL §7.3). SRTM 30 m is **too coarse for roof slope**; use Solar API / 3DEP for roof planes, SRTM only for site terrain.
6. **Auth complexity.** Two distinct Google auth modes (Maps **API key** vs. GEE **service-account OAuth**) + a commercial-EE-registration step. More moving parts than the current NREL-only secret.
7. **Cost at scale.** GEE Online EECU billing + Maps per-SKU overages compound across a portfolio; Solar Data Layers is only **1K free/mo** (don't pull per-roof).
8. **Unverified items.** Exact GEE pricing numbers (page truncated); exact Places (New) per-1k SKU rates (tiered, billed at highest field-mask SKU). Confirm both before any budget commitment. The earlier `developer.nlr.gov` typosquat lesson applies — every domain above (`earthengine.googleapis.com`, `solar.googleapis.com`, `addressvalidation.googleapis.com`, `places.googleapis.com`, `maps.googleapis.com`) was checked against official Google docs.

---

## Sources
- **GEE REST/auth/quota:** [REST reference](https://developers.google.com/earth-engine/reference/rest) · [computePixels](https://developers.google.com/earth-engine/reference/rest/v1/projects.image/computePixels) · [thumbnails.getPixels](https://developers.google.com/earth-engine/reference/rest/v1beta/projects.thumbnails/getPixels) · [Image computations REST](https://developers.google.com/earth-engine/Earth_Engine_REST_API_compute_image) · [Service accounts](https://developers.google.com/earth-engine/guides/service_account) · [Auth & init](https://developers.google.com/earth-engine/guides/auth) · [Quotas/usage](https://developers.google.com/earth-engine/guides/usage)
- **GEE licensing/pricing:** [Pricing](https://cloud.google.com/earth-engine/pricing) · [Transition to commercial](https://developers.google.com/earth-engine/guides/transition_to_commercial) · [Noncommercial tiers](https://developers.google.com/earth-engine/guides/noncommercial_tiers) · [Commercial](https://earthengine.google.com/commercial/) · [EE access](https://developers.google.com/earth-engine/guides/access)
- **GEE datasets:** [Catalog](https://developers.google.com/earth-engine/datasets/catalog) · [Landsat 8 L2](https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C02_T1_L2) · [ECOSTRESS LSTE V2](https://developers.google.com/earth-engine/datasets/catalog/NASA_ECOSTRESS_L2T_LSTE_V2) · [ECOSTRESS STARS NDVI](https://developers.google.com/earth-engine/datasets/catalog/NASA_ECOSTRESS_L2T_STARS_V2) · [USFS TCC v2023-5](https://developers.google.com/earth-engine/datasets/catalog/USGS_NLCD_RELEASES_2023_REL_TCC_v2023-5) · [NLCD 2021](https://developers.google.com/earth-engine/datasets/catalog/USGS_NLCD_RELEASES_2021_REL_NLCD) · [SRTM GL1](https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003)
- **Maps Platform:** [Address Validation overview](https://developers.google.com/maps/documentation/address-validation/overview) · [AV response](https://developers.google.com/maps/documentation/address-validation/understand-response) · [AV billing](https://developers.google.com/maps/documentation/address-validation/usage-and-billing) · [Places searchText](https://developers.google.com/maps/documentation/places/web-service/text-search) · [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details) · [Places billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) · [Geocoding overview](https://developers.google.com/maps/documentation/geocoding/overview) · [Solar overview](https://developers.google.com/maps/documentation/solar/overview) · [findClosest](https://developers.google.com/maps/documentation/solar/reference/rest/v1/buildingInsights/findClosest)
- **Maps pricing changes:** [March 2025 changes](https://developers.google.com/maps/billing-and-pricing/march-2025) · [Billing FAQ](https://developers.google.com/maps/billing-and-pricing/faq) · [10K free calls/SKU blog](https://mapsplatform.google.com/resources/blog/start-building-today-with-up-to-10-000-monthly-free-calls-per-product/) · [Maps service terms (caching)](https://cloud.google.com/maps-platform/terms/maps-service-terms)
</content>
</invoke>
