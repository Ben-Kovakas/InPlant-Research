# 06 — Geospatial Data Pipeline (Address → Building / CandidateSurface JSON)

## In-Planted / Climate Resilient ATL · Green-Retrofit Engine + 3D Twin

> **Owner:** Geospatial / data-acquisition lead · **Date:** 2026-06-16 · **Timeline:** days
> **Scope:** The offline Python pipeline that turns a small list of Atlanta addresses (one owner's portfolio) into the `Building` + `CandidateSurface` JSON the engine/twin needs (Doc 01 §2.2; spec FR-1/FR-5).
> **Grounding:** `02_DataAcquisitionPlan.md`, `spec-driven/backend-architecture/spec.md`, `01_PrototypeImplementationPlan.md`.
> **Verification note:** Google Maps Platform docs/pricing checked June 2026 via official `developers.google.com` / `cloud.google.com` and a 2026 pricing aggregator. Anything I could not pin to a Google page is flagged **[UNVERIFIED]**.

---

## 0. TL;DR — the headline

- **Google Maps Platform Solar API (Building Insights) is the win.** A single `findClosest` call on a lat/lon returns, per roof segment: **`areaMeters2`**, **`pitchDegrees`** (tilt), **`azimuthDegrees`**, plus whole-roof totals, panel configs, and annual sunshine. That fills `footprintAreaM2` / `usableAreaM2` / `orientation.azimuthDeg` / `orientation.tiltDeg` **directly** and **cross-checks PVWatts** — replacing the manual footprint-download + min-bounding-rectangle azimuth work in Doc 02 §2.2.
- **Free tier is generous for a portfolio demo:** Building Insights = **10,000 free calls/month**; a one-owner portfolio is single/double digits. Effective cost = **$0**.
- **The catch is ToS, not capability.** Google's terms only allow caching Solar "grounded output" and geocode lat/lon for **~30 days**, and forbid building a permanent derived dataset. Our architecture **commits JSON to the repo forever** → that is a literal ToS violation if the committed numbers are raw Google content. **Mitigation: treat Google Solar/geocode output as a cross-check + seed, persist our *own derived* values (PVWatts kWh, our area math), and keep PVWatts (NREL, no caching limit) as the system of record for the committed fixtures.**
- **Coverage risk:** Atlanta metro is well inside US HIGH/MEDIUM Solar coverage, but a **35-story tower (100 Peachtree)** is exactly the case where rooftop DSM can be noisy/occluded — verify `imageryQuality` per building; fall back to Fulton County footprints + flat-roof assumption.

---

## 1. Source-by-source findings (verified June 2026)

### 1.1 ⭐ Solar API — Building Insights (`buildingInsights:findClosest`)

**Endpoint**
```
GET https://solar.googleapis.com/v1/buildingInsights:findClosest
    ?location.latitude=33.7565
    &location.longitude=-84.3884
    &requiredQuality=HIGH        # optional: HIGH | MEDIUM | LOW | BASE
    &key=API_KEY
```
- `location` (lat/lon) is the **only required** field. `requiredQuality` sets the minimum imagery tier you'll accept (request fails if not met). `experiments=EXPANDED_COVERAGE` in the body unlocks experimental **BASE** quality for thinner areas.
- Auth: a Google Maps Platform API key with the Solar API enabled (Google Cloud project + billing enabled, even though usage is free under the cap).

**Response shape (the fields we care about)**
```jsonc
{
  "name": "buildings/ChIJ...",            // building resource id (place-id-like)
  "center": { "latitude": ..., "longitude": ... },
  "boundingBox": { "sw": {...}, "ne": {...} },
  "imageryDate": { "year": 2023, "month": .., "day": .. },
  "imageryQuality": "HIGH",               // HIGH=0.1 m/px, MEDIUM=0.25 m/px, LOW/BASE coarser
  "solarPotential": {
    "maxArrayPanelsCount": 1234,
    "maxArrayAreaMeters2": 4200.5,        // ← total panel-able roof area
    "wholeRoofStats": {                    // SizeAndSunshineStats
      "areaMeters2": 6100.2,              // ← whole roof surface area (slope-corrected)
      "groundAreaMeters2": 6010.0,        // ← roof footprint area (≈ our footprintAreaM2)
      "sunshineQuantiles": [ ... ]        // annual kWh/kW distribution → sunExposure proxy
    },
    "buildingStats": { "areaMeters2": ..., "groundAreaMeters2": ... },
    "roofSegmentStats": [                  // ← the gold: one per roof plane
      {
        "pitchDegrees": 8.4,             // ← orientation.tiltDeg
        "azimuthDegrees": 178.0,         // ← orientation.azimuthDeg (compass, 180=S)
        "planeHeightAtCenterMeters": ..,
        "stats": {
          "areaMeters2": 1820.0,         // ← per-segment usable area
          "groundAreaMeters2": 1801.0,
          "sunshineQuantiles": [ ... ]   // ← sunExposure: normalize median/max
        },
        "center": {...}, "boundingBox": {...}
      }
      // ... more segments
    ],
    "solarPanelConfigs": [                 // panel-count → yearlyEnergyDcKwh sweep
      { "panelsCount": 800, "yearlyEnergyDcKwh": 410000, "roofSegmentSummaries": [...] }
    ],
    "solarPanels": [ ... ]                 // per-panel placements (heavy; usually skip)
  }
}
```

**Field → `CandidateSurface` map (Doc 01 §2.2)**
| Our field | Solar API source | Note |
|---|---|---|
| `footprintAreaM2` | `solarPotential.wholeRoofStats.groundAreaMeters2` | Ground (footprint) area — replaces Fulton polygon area math |
| `areaM2` (roof surface) | `wholeRoofStats.areaMeters2` | Slope-corrected; for flat roofs ≈ ground area |
| `usableAreaM2` | `maxArrayAreaMeters2` (whole) or per-segment `stats.areaMeters2` | Google's panel-able area already excludes obstructions → **better than our `0.7 × footprint` guess** |
| `orientation.tiltDeg` | `roofSegmentStats[].pitchDegrees` | Per segment; pick dominant/largest segment |
| `orientation.azimuthDeg` | `roofSegmentStats[].azimuthDegrees` | Per segment; flat roofs report ~0 pitch (azimuth less meaningful → keep 180 for PVWatts) |
| `sunExposure` (0–1) | `stats.sunshineQuantiles` | Normalize e.g. `median / theoretical_max` — a measured shading proxy, not the twin's geometric guess |
| (cross-check only) solar kWh | `solarPanelConfigs[].yearlyEnergyDcKwh` | **DC** annual; sanity-check vs PVWatts `ac_annual` (expect PV-AC ≈ 0.8× DC) |

- **Coverage:** "hundreds of millions of buildings worldwide"; **US is core coverage**, Atlanta metro is firmly in HIGH/MEDIUM. HIGH = aerial @ **0.1 m/px**, MEDIUM = **0.25 m/px**. Tall-tower DSM can be noisy → check `imageryQuality` and segment sanity per building.
- **Cost:** **10,000 free Building Insights calls/month**, then volume pricing (Essentials tier). A one-owner portfolio is trivially free. *(Exact post-cap $/1k not published as a flat number; not relevant at our volume.)*
- **EEA note:** since **2025-07-08**, some Solar fields are withheld for EEA developers — **not a problem for Atlanta/US**, noting for the "any-city" generalization story.

### 1.2 Solar API — Data Layers (`dataLayers:get`)

**Endpoint**: `GET https://solar.googleapis.com/v1/dataLayers:get?location...&radiusMeters=...&view=...&key=...`
Returns **GeoTIFF download URLs** for: DSM (digital surface model), RGB aerial, roof mask, **annual flux**, **monthly flux** (12), and **hourly shade** (rasters, 0.1–0.25 m/px).
- **Use for us:** only if we want a real per-pixel shading/flux map or an RGB roof texture for the twin. **Not needed for the core CandidateSurface** — Building Insights already gives areas/tilt/azimuth.
- **Cost / ToS:** **only 1,000 free calls/month** (Enterprise tier) and GeoTIFFs are heavy Google content with the 30-day cache limit. **Verdict: skip for the demo** unless the twin needs a flux overlay; if used, treat as visual, don't commit the rasters.

### 1.3 Geocoding API (address → lat/lon)

**Endpoint**: `GET https://maps.googleapis.com/maps/api/geocode/json?address=100+Peachtree+St+NW,+Atlanta,+GA&key=...`
Returns `results[0].geometry.location.{lat,lng}`, `formatted_address`, `place_id`, `location_type` (ROOFTOP best).
- **Role:** the entry point — turns each portfolio address into the lat/lon that drives **Solar API + PVWatts**. Fills `Building.location`.
- **Cost:** **$5.00 / 1,000**, **10,000 free/month** → $0 at our volume.
- **ToS:** lat/lon may be cached **only ≤30 days**; **`place_id` may be stored indefinitely**. → In committed JSON, persist `place_id` + our own re-derivable lat/lon, treat the Google lat/lon as transient. (For 100 Peachtree we already have a public coordinate, so storage risk is moot.)

### 1.4 Places API (New) — `places.googleapis.com/v1/...`

- **Geocode/identify:** `places:searchText` (POST) turns a free-text address or **owner/business name** ("Equitable Building Atlanta") into a `places/{place_id}`, `location` (lat/lon), `formattedAddress`, `displayName`, `types`. Use when an address is messy or you only have a building/owner name.
- **Photos:** `Place Details` + `places.photos[].name` → `…/media?maxHeightPx=…` returns a street-level/business photo. **Useful as a real reference image** in the report/twin card.
- **Cost:** Place Details / Text Search have **per-SKU free caps (1k–10k/month)** then volume pricing; **Place Photos billed with Details**. $0 at our volume. **[UNVERIFIED exact per-1k Places $ — SKU table is tiered (Essentials/Pro/Enterprise); not load-bearing at <100 calls.]**
- **Verdict:** **Geocoding API is enough** for clean addresses (cheaper, simpler). Reach for Places only for name-based lookup or a building photo. `place_id` is the one Google value we can keep forever.

### 1.5 Google Earth / Earth Engine / 3D Tiles / Aerial View / Static — disambiguated

| Product | What it actually is | Gives building **geometry**? | Use for us |
|---|---|---|---|
| **Consumer Google Earth** (earth.google.com) | End-user app | No (no API/export) | Visual scouting only |
| **Google Earth Engine** | Planetary raster catalog + compute (Landsat, MODIS, Sentinel) | No — rasters, not vector buildings | **LST/heat metric** (Doc 02 §2.5): Landsat `ST_B10`. *This is the only place EE belongs.* |
| **Photorealistic 3D Tiles** (Map Tiles API) | Streamed **glTF textured mesh** of the real world — same source as Google Earth | Mesh, **not clean per-building polygons** (can't cleanly extract a roof plane) | A photoreal backdrop for the twin **if** we render in CesiumJS/deck.gl. **$6/1,000, 1k free.** Visual, not data. |
| **Aerial View API** | Pre-rendered **flyaround video** of a POI (built on 3D Tiles) | No | Eye-candy clip; **$16/1,000.** Skip. |
| **Maps Static API** | Flat satellite/roadmap **image** | No | A cheap top-down roof image for the report. **$2/1,000, 10k free.** |

**Bottom line:** for *geometry*, only the **Solar API** delivers usable numbers. 3D Tiles/Aerial/Static/Earth are **imagery/visuals**; Earth **Engine** is for the **heat raster**, nothing else.

### 1.6 Non-Google fallbacks (already in the registry — Doc 02 §2.2)

| Source | Gives | Why prefer over Google |
|---|---|---|
| **Fulton County Structure Footprints** | Footprint polygons (GeoJSON/REST), local + fresh | **No ToS/caching limit — fully storable.** Primary fallback if Solar coverage/quality is poor; lets us commit area freely. |
| **Microsoft US Building Footprints** | 3.8M GA polygons (ODbL) | Free, storable, national; the generalization story. |
| **OSM (Overpass)** | Some buildings w/ height/levels (ODbL) | Free/storable; uneven downtown. |
| **COA / ARC Open Data Hub** | Parcels, historic overlays, regional footprints | Public/open; for the Fairlie-Poplar historic flag. |

> **When to prefer non-Google:** any time we need a value **persisted permanently** in the committed repo without ToS exposure (footprint area, parcel geometry), **or** when Solar `imageryQuality` is LOW/absent. Compute area ourselves in EPSG:26916 — that derived number is ours to keep.

---

## 2. Licensing / ToS reality check (the real constraint)

Our architecture **commits JSON to git and reuses it offline forever** (spec FR-1, "results committed to the repo"). Google Maps Platform ToS directly limit that:

- **No pre-fetch / no permanent cache / no derived dataset.** "Customers must not pre-fetch, cache, index, or store any Content, except limited temporary caching for performance." Building a committed dataset of Google content is exactly what's prohibited.
- **Geocoding lat/lon:** cacheable **≤ 30 consecutive days**, then must delete.
- **`place_id`:** **may be stored indefinitely** (explicit exception).
- **Solar "Grounded Output":** cacheable **≤ 30 days**, solely to evaluate/optimize display.
- **No manipulating/aggregating Content to evade restrictions** — so "we transformed the Google area a bit" is not a safe-harbor.

**What this means for our committed fixtures — do / don't:**
- ✅ **Store permanently:** PVWatts `ac_annual`/`ac_monthly` (NREL, no such limit), areas we compute ourselves from **Fulton/MS footprints** (their licenses, not Google's), `place_id`, eGRID/rate constants, our final engine outputs.
- ⚠️ **Use transiently (don't commit raw):** Solar API `roofSegmentStats`, `maxArrayAreaMeters2`, `sunshineQuantiles`, Google geocode lat/lon, Data Layers GeoTIFFs.
- ✅ **Safe pattern:** use Solar API **live, as a one-time cross-check** to validate our footprint area / tilt / azimuth and sanity-check PVWatts; record in `provenance` *that it was validated against Solar API on date X* **without committing Google's raw numbers as the stored value.** Persist the **PVWatts/Fulton-derived** equivalents.
- 🚩 **Honest flag:** committing raw Solar `areaMeters2`/`azimuthDegrees` as the durable fixture value is a ToS gray-to-red zone. For a hackathon demo this is low practical risk, but **for the "architect-for-later / any-city production" claim it does not scale** — note it explicitly.

---

## 3. Recommended pipeline recipe (addresses → committed JSON)

Ordered steps; each names the source and the field it fills. Run offline via `python -m pipeline`.

| # | Step | Source / API | Fills | Storable in repo? |
|---|---|---|---|---|
| 1 | **Address → lat/lon + place_id** | **Geocoding API** (or Places `searchText` for name/owner lookup) | `Building.location{lat,lon}`, `place_id` | place_id ✅; lat/lon re-derivable (public coord for demo) |
| 2 | **lat/lon → roof geometry (PRIMARY)** | **Solar API `buildingInsights:findClosest`** | `footprintAreaM2`←`wholeRoofStats.groundAreaMeters2`; `usableAreaM2`←`maxArrayAreaMeters2`; per-surface `tiltDeg`←`pitchDegrees`, `azimuthDeg`←`azimuthDegrees`; `sunExposure`←`sunshineQuantiles`; `imageryQuality` | ⚠️ use to **derive/validate**, persist our own values |
| 2b | **Fallback geometry (if quality LOW/missing or for storable value)** | **Fulton County footprints** → area in EPSG:26916 (shapely); azimuth from min-bounding-rect long axis | same fields, **fully storable** | ✅ |
| 3 | **imperviousPct** | **NLCD GeoTIFF** sampled at centroid (rasterio); rooftop ≈ 100 | `imperviousPct` | ✅ (USGS public) |
| 4 | **Solar production (system of record)** | **PVWatts v8** `https://developer.nlr.gov/api/pvwatts/v8.json` with `system_capacity = usableAreaM2 × 0.15 × 0.7`, `array_type=1, tilt=10, azimuth=180, losses=14` | `pvwatts/<key>.json` → `ac_annual`, `ac_monthly` | ✅ (NREL, no cache limit) |
| 4b | **Cross-check** | Compare PVWatts `ac_annual` vs Solar `solarPanelConfigs[].yearlyEnergyDcKwh × ~0.8` | provenance note | n/a |
| 5 | **CBEEO attributes** | CBEEO ArcGIS / lookup app (Doc 02 §1) | `energyStarScore`, `grossSqft`, `useType` | ✅ (public disclosure) |
| 6 | **Historic flag** | COA Open Data Hub historic overlay | feasibility narrative | ✅ |
| 7 | **(optional) heat** | **Earth Engine** Landsat `ST_B10` summer scene | roof "before" temp; else empirical lookup | ✅ (USGS) |
| 8 | **(optional) photo/backdrop** | Places **Place Photos** / Maps **Static** / **3D Tiles** | report image / twin backdrop | ⚠️ render live, don't commit |
| 9 | **Normalize + provenance** | `normalize.py` | `buildings/<id>.json` (validates vs `schema.js`); every field tagged `fetched`/`manual`/`default` + source | ✅ |

**Decision rule for geometry (step 2 vs 2b):** if `imageryQuality ∈ {HIGH, MEDIUM}` and `roofSegmentStats` are sane → use Solar API to **set our values and validate** (best fidelity, real per-segment tilt/azimuth). Else → Fulton footprint + flat-roof assumption. Either way the **committed** number should be one we're licensed to keep (PVWatts-derived / Fulton-derived), with a provenance flag noting Solar cross-check.

**What Google lets us SKIP** (vs Doc 02's manual plan): downloading the 1.1 GB Microsoft GA file and clipping; the min-bounding-rectangle azimuth derivation; guessing `usableAreaM2 = 0.7 × footprint` (Solar gives real obstruction-aware panel area); and a separate shading assumption (`sunshineQuantiles`). Net: steps 2b+azimuth math become a *fallback*, not the default.

---

## 4. Worked example — 100 Peachtree St NW, Atlanta, GA 30303

1. **Geocode**
   `GET https://maps.googleapis.com/maps/api/geocode/json?address=100+Peachtree+St+NW,+Atlanta,+GA+30303&key=…`
   → `{ location:{lat:33.7565, lng:-84.3884}, place_id:"ChIJ…", location_type:"ROOFTOP" }`
   Fills `Building.location` + `place_id`.

2. **Building Insights**
   `GET https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=33.7565&location.longitude=-84.3884&requiredQuality=HIGH&key=…`
   → e.g. `imageryQuality:"HIGH"`, `wholeRoofStats.groundAreaMeters2 ≈ 2,800`, `maxArrayAreaMeters2 ≈ 1,900`, `roofSegmentStats:[{pitchDegrees:3.2, azimuthDegrees:182, stats.areaMeters2:2,650, sunshineQuantiles:[…]}]` (flat low-slope roof, as expected for a 1968 tower).
   Fills `footprintAreaM2`, `usableAreaM2`, surface `tiltDeg≈3`, `azimuthDeg≈180`, `sunExposure` (from quantiles). *(Numbers illustrative — a 35-story tower may yield noisy DSM; verify and fall back to Fulton if `imageryQuality` is LOW.)*

3. **PVWatts** (system of record, storable)
   `GET https://developer.nlr.gov/api/pvwatts/v8.json?api_key=…&system_capacity=199.5&module_type=1&losses=14&array_type=1&tilt=10&azimuth=180&lat=33.7565&lon=-84.3884`
   (`system_capacity = 1900 × 0.15 × 0.7 ≈ 199.5 kW`)
   → `outputs.ac_annual` (kWh/yr) → committed to `pvwatts/<key>.json`. Cross-check vs Solar `yearlyEnergyDcKwh × 0.8`.

4. **NLCD** sample → `imperviousPct ≈ 100`. **CBEEO** → ABID, ENERGY STAR score, gross sqft, EUI.

Committed `buildings/100-peachtree.json` then carries Google-validated geometry but PVWatts/Fulton-derived **stored** values, each with a `provenance` tag.

---

## 5. Python libraries per step

| Step | Libs |
|---|---|
| HTTP to Google + PVWatts | `httpx` (or `requests`) |
| Footprint area / azimuth (fallback) | `geopandas`, `shapely`, `pyproj` (reproject to EPSG:26916; min-bounding-rect via `shapely.minimum_rotated_rectangle`) |
| NLCD / Solar Data Layers / Landsat raster sample | `rasterio` (+ `numpy`) |
| CBEEO tabular wrangling | `pandas` (+ `papaparse`-free; just pandas) |
| (optional) Earth Engine LST | `earthengine-api` |
| Geometry parsing from Solar API | none extra — JSON only |

**Solar API removes the need for** `geopandas`/`shapely` **in the happy path** (no polygon area or MBR azimuth math) — they remain only for the Fulton fallback. That is the main labor Google saves.

---

## 6. Source comparison table

| Source | Gives | Format | Cost (2026) | ToS / storable | Days verdict |
|---|---|---|---|---|---|
| **Solar API — Building Insights** ⭐ | roof area, tilt (`pitchDegrees`), azimuth, usable area, sunshine, panel configs | JSON | 10k free/mo, then volume | ⚠️ ~30-day cache; **don't commit raw** | ✅ minutes; **the win** for geometry |
| **Solar API — Data Layers** | DSM/RGB/mask/flux/shade rasters | GeoTIFF URLs | **1k free/mo** | ⚠️ heavy Google content, 30-day | 🟠 skip unless flux overlay needed |
| **Geocoding API** | address→lat/lon, place_id | JSON | $5/1k, 10k free | lat/lon ≤30d; **place_id ∞** | ✅ minutes |
| **Places API (New)** | name/owner→place, photos | JSON | tiered free caps **[UNVERIFIED $/1k]** | place_id ∞; photos transient | ✅ optional |
| **Photorealistic 3D Tiles** | glTF photoreal mesh (visual) | 3D tiles | $6/1k, 1k free | mesh = Google content | 🟠 twin backdrop only |
| **Aerial View** | flyaround video | mp4 | $16/1k, 5k free | — | ❌ skip |
| **Maps Static** | top-down sat image | PNG | $2/1k, 10k free | imagery = Google content | 🟠 report image only |
| **Earth Engine** | Landsat/MODIS rasters (LST) | GeoTIFF | free (account) | public USGS/NASA — **storable** | 🟠 heat metric, long pole |
| **Fulton County footprints** | footprint polygons | GeoJSON/REST | free | **fully storable** | ✅ primary geometry fallback |
| **Microsoft US footprints** | 3.8M GA polygons | GeoJSON | free (ODbL) | storable (attribute) | ✅ generalization |
| **OSM / Overpass** | buildings + some height | GeoJSON | free (ODbL) | storable (attribute) | ✅ uneven downtown |
| **NLCD** | impervious % raster | GeoTIFF | free | storable (USGS) | ✅ |
| **CBEEO** | ABID, ENERGY STAR, sqft, EUI | ArcGIS/CSV | free | public disclosure | ✅ (bulk caveat, Doc 02 §1) |
| **PVWatts v8** | ac_annual/monthly kWh | JSON | free | **storable** (NREL) | ✅ system of record |

---

## 7. Honest flags

- **ToS vs "commit forever":** committing raw Solar/geocode content violates the 30-day caching limit; the *derived-value + place_id + PVWatts-as-record* pattern (§2) is the compliant route. Low practical risk for a hackathon, **real risk for the productization pitch.** Don't claim we "store Google's solar data."
- **Tall-tower coverage:** 100 Peachtree (35 stories) is the worst case for rooftop DSM (occlusion, parapets, mechanical penthouses) — **always check `imageryQuality`** and have the Fulton fallback wired. The mid-rise Fairlie-Poplar alternate (Doc 02 §3) is a safer Solar-API target.
- **Free-tier asymmetry:** Building Insights 10k free vs **Data Layers only 1k** — don't accidentally pull Data Layers per-roof.
- **DC vs AC:** Solar `yearlyEnergyDcKwh` is **DC**; PVWatts `ac_annual` is **AC** — apply ~0.8 before comparing, or they'll look ~20% off.
- **Billing enablement:** even "free" Solar/Maps calls require a Google Cloud project **with billing enabled** and the API turned on; the key must stay server-side (mirror the `NREL_API_KEY` handling). A live Google call must never be in the on-stage hot path (spec NFR).
- **EEA field withholding** (2025-07-08) doesn't affect Atlanta but will bite a European "any-city" port.
- **[UNVERIFIED]:** exact post-free-cap $/1k for Solar Building Insights and Places SKUs (tiered; not published as a single flat rate) — irrelevant at our <100-call volume but confirm before any portfolio-scale (2,350-building) run.

---

## Sources

- [Solar API overview](https://developers.google.com/maps/documentation/solar/overview) · [buildingInsights.findClosest reference](https://developers.google.com/maps/documentation/solar/reference/rest/v1/buildingInsights/findClosest) · [Building insights guide](https://developers.google.com/maps/documentation/solar/building-insights) · [Coverage](https://developers.google.com/maps/documentation/solar/coverage) · [Usage & billing](https://developers.google.com/maps/documentation/solar/usage-and-billing)
- [Geocoding API overview](https://developers.google.com/maps/documentation/geocoding/overview) · [Places API (New) overview](https://developers.google.com/maps/documentation/places/web-service/overview) · [Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles)
- [Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) · caching/derived-data summary via [ConductAtlas](https://conductatlas.com/platform/google-maps/google-maps-platform-terms-of-service/)
- 2026 pricing aggregator: [nicolalazzari.ai Google Maps APIs $/SKU guide](https://nicolalazzari.ai/articles/understanding-google-maps-apis-a-comprehensive-guide-to-uses-and-costs)
