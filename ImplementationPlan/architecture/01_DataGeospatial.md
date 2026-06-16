# 01 — Production Data & Geospatial Ingestion Architecture

## In-Planted / Climate Resilient ATL · Green-Retrofit Engine + 3D Digital Twin

> **Owner:** Senior geospatial-data architect · **Date:** 2026-06-16
> **Status:** Architecture (production target) — the "architect-for-later" companion to the demo-now stack in `spec-driven/backend-architecture/spec.md`.
> **Scope:** How a *real* system ingests building geometry (roofs/facades/parking/perimeter) + environmental layers and produces a structured, provenance-tracked model **per building**, scaling one building → portfolio → whole city.
> **Grounding:** `spec.md`, `ImplementationPlan/02_DataAcquisitionPlan.md`, `06_GeospatialDataPipeline.md`, `FINAL.md §7`.
> **Verification:** Tools/datasets/pricing checked June 2026 via vendor docs and 2025–26 industry sources. Anything not pinned to a primary source is flagged **[UNVERIFIED]**. Numbers in formulas come from the grounding docs above.

---

## 0. The core problem this layer solves

Every number the engine emits (FINAL §7: solar kWh, gallons retained, °F drop, tons CO₂, $ payback) is a function of **surfaces**. The data layer's job is to manufacture, for any address, a set of **CandidateSurfaces** — roof planes, facades, parking lots, site perimeter — each carrying geometry, area, slope, azimuth, obstruction map, and the environmental context (impervious %, LST, grid factor, rainfall) joined to it, with **per-value provenance**. Then it must do this for *one* building reliably and for *2,350+* (the CBEEO universe) economically.

```
                       THE CANDIDATE-SURFACE FACTORY
  address / ABID / parcel
        │
        ▼
  ┌───────────────┐   ┌────────────────────────────────────┐   ┌──────────────┐
  │  GEOMETRY      │   │  ENVIRONMENTAL CONTEXT (rasters)     │   │  ATTRIBUTES   │
  │ roof planes    │   │  impervious %, LST/heat, irradiance, │   │ ENERGY STAR,  │
  │ facades        │ + │  rainfall normals, grid factor,      │ + │ sqft, use,    │
  │ parking lots   │   │  flood zone, tree canopy             │   │ historic flag │
  │ perimeter      │   └────────────────────────────────────┘   └──────────────┘
  └───────────────┘                    │
        └────────────────┬─────────────┘
                         ▼  JOIN EVERYTHING TO A BUILDING/PARCEL KEY
              ┌────────────────────────────────┐
              │ Building { CandidateSurface[] } │  every field: value + provenance{source, date, method}
              └────────────────────────────────┘
                         ▼
              scoring engine (FINAL §7)  +  3D twin assets (glTF/3D Tiles)
```

The single most important architectural pattern is **"join everything to a parcel/building key."** Geometry, rasters, and tabular attributes all reduce to one row keyed by `ABID` (or a stable parcel id). That row is the contract. Everything below is about producing it cheaply, repeatably, and defensibly.

---

## 1. Surface & roof extraction at scale

The demo leans on Google Solar API for roof geometry (Doc 06). For production at city scale we need a **tiered extraction strategy** because no single source covers all surface types, all buildings, with storable licensing and acceptable cost.

### 1.1 The four surface classes and who can produce them

| Surface class | Why it matters (FINAL §7) | Best primary source | Fallback / scale source |
|---|---|---|---|
| **Roof planes** (area, pitch, azimuth, obstructions) | Solar §7.1, green roof §7.2/7.3 | **Google Solar Building Insights** (per-segment) | **LiDAR/DSM roof-plane segmentation** (USGS 3DEP) → storable |
| **Facades** (wall area, orientation, shading) | vertical greening, shade lattice, future PV | **Photogrammetry / 3D Tiles mesh** or LiDAR-derived massing | procedural extrusion (footprint + height) |
| **Parking lots / surface lots** | solar canopy, depave/stormwater, heat (largest UHI offenders) | **ML segmentation of aerial imagery (SAM2 / land-cover model)** — Google Solar **does not cover these** | NLCD impervious + parcel land-use class |
| **Site perimeter / pervious** | tree canopy, bioswale, runoff `A` term | parcel polygon − footprint(s); NLCD/canopy raster | parcel geometry from county GIS |

**The critical gap:** Google's Solar API is **rooftop-only** — it explicitly does *not* model ground-mount or **parking-lot solar canopies** ([Google Solar methodology](https://developers.google.com/maps/documentation/solar/methodology)). Parking lots are the highest-value non-roof surface for both solar canopy and heat/stormwater, and they are exactly where our own ML earns its keep. This is the single strongest "AI helps here" case in the whole product.

### 1.2 Source comparison for roof/surface geometry

| Approach | What it yields | Geometry fidelity | Storable? | Cost at city scale | Verdict |
|---|---|---|---|---|---|
| **Google Solar — Building Insights** | per-segment area, `pitchDegrees`, `azimuthDegrees`, sunshine quantiles, obstruction-aware panel area | High (0.1 m/px HIGH tier) | ⚠️ **No** — 30-day cache, no derived dataset (Doc 06 §2) | 10k free/mo, then volume | **Buy for seeding/validation; cannot be the durable store** |
| **Google Solar — Data Layers** | DSM, RGB, roof mask, annual/monthly/hourly flux rasters | Highest per-pixel | ⚠️ No (heavy Google content) | **only 1k free/mo** | Skip except live flux overlay |
| **USGS 3DEP LiDAR / DSM** | point cloud → roof-plane segmentation (area, slope, azimuth, ridge lines) | High where flown; QL1/QL2 | ✅ **Yes** (public domain) | Free data; compute cost to process | **Build the storable, city-scale backbone** |
| **Aerial/satellite imagery + ML segmentation** | building footprints, roof masks, **parking lots**, canopy, land cover | Medium–High (depends on GSD) | ✅ Yes (your derived output) | Compute + imagery licensing | **Build — the only path to parking lots & any-city** |
| **Photogrammetry / 3D mesh** (Google 3D Tiles, drone) | textured mesh; visual realism | Mesh, not clean per-plane polygons | ⚠️ (Google) / ✅ (own drone) | $6/1k tiles (Google) | Twin backdrop, not data extraction |
| **Footprint datasets** (Fulton, Microsoft, OSM) | 2D polygons (+ some heights) | 2D only — no slope/azimuth | ✅ Yes (ODbL/public) | Free | **Geometric base + procedural massing input** |

**3DEP status (2025):** at end of FY2025 ~**99% of the US has baseline 3DEP-spec elevation data available or in progress** ([USGS 3DEP](https://www.usgs.gov/3d-elevation-program/what-3dep)). It is published as free LiDAR point clouds, mirrored on [AWS Open Data](https://registry.opendata.aws/usgs-lidar/) and [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/dataset/group/3dep-lidar). This is the storable, license-clean foundation Google can never be — the right city-scale backbone for roof geometry.

### 1.3 Where ML / computer vision genuinely helps (and where it doesn't)

ML is not a blanket win; use it precisely where deterministic geometry fails:

| Task | Use ML? | Concrete model/approach (2025–26) |
|---|---|---|
| **Roof-plane segmentation** from LiDAR | ✅ Yes — DL beats hand-tuned clustering | **RoofSeg** (edge-aware transformer, end-to-end roof-plane seg, [arXiv 2508.19003](https://arxiv.org/abs/2508.19003)); boundary-aware point clustering ([arXiv 2309.03722](https://arxiv.org/pdf/2309.03722)). Classic RANSAC plane-fit is the deterministic baseline. |
| **Parking-lot / surface-lot detection** | ✅ **Yes — highest value** (Google can't) | **SAM2 via `samgeo`** with box/point prompts ([samgeo](https://samgeo.gishub.org/)); land-cover segmentation models; fine-tune on NAIP/aerial. |
| **Building-footprint extraction** (any-city, where no county GIS) | ✅ Yes | U-Net / transformer segmentation on VHR imagery ([Nature Sci Data 2025](https://www.nature.com/articles/s41597-025-06014-4)); Microsoft's pipeline as a free baseline. |
| **Obstruction detection** (HVAC, vents, skylights) | ✅ Yes — refines usable area | Instance segmentation on DSM+RGB; reduces the `0.7 packing` guess to a measured number. |
| **Footprint → polygon area / azimuth** | ❌ **No** — pure geometry | `shapely` area in EPSG:26916; azimuth from `minimum_rotated_rectangle` long axis. Deterministic, exact, free. |
| **Procedural massing** (footprint + height → box) | ❌ No — extrusion math | Extrude footprint by attribute height; no ML needed. |

**Opinion:** the ML investment that pays off first is **parking-lot + obstruction segmentation** (fills the Google gap and de-risks the `0.7` packing assumption), then **LiDAR roof-plane segmentation** (the storable replacement for Google geometry). Footprint extraction is only worth building for the any-city story where county GIS is absent — for Atlanta, Fulton County footprints are free and clean.

```
        TIERED GEOMETRY EXTRACTION (decision flow, per building)
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. 3DEP LiDAR covers this footprint at QL2+?                  │
  │    YES → roof-plane segmentation (RoofSeg/RANSAC) → STORABLE  │ ◀── city-scale backbone
  │    NO  ↓                                                       │
  │ 2. Google Solar imageryQuality ∈ {HIGH,MEDIUM}?               │
  │    YES → seed geometry + validate; persist OUR derived value  │ ◀── high fidelity, transient
  │    NO  ↓                                                       │
  │ 3. Footprint (Fulton/MS) + flat-roof assumption + ML obstruct │ ◀── universal fallback
  │ ── in parallel for ALL: ML segment parking lots & canopy ──   │ ◀── Google can't; always run
  └─────────────────────────────────────────────────────────────┘
```

---

## 2. Geospatial data platform (the storage & compute target)

### 2.1 The decision: vector store

| Engine | Strengths | Weaknesses | Fit here |
|---|---|---|---|
| **PostGIS** | Deepest spatial function library; mature; transactional; battle-tested joins | Not architected for cloud-scale distributed analytics; heavier to operate ([Forrest 2026](https://forrest.nyc/best-spatial-sql-tools/)) | **✅ Primary OLTP/serving store** — the "system of record" for the Building/Surface rows and the parcel join. Fits 2,350 → low-millions of rows easily. |
| **DuckDB + spatial** | Embedded, zero-infra, fast OLAP on GeoParquet/Arrow; ideal for offline pipeline | Spatial extension still maturing vs PostGIS; not a serving DB | **✅ The offline pipeline's compute engine** — read footprints/rasters, crunch areas, write GeoParquet. Natural evolution of today's Python+geopandas step. |
| **BigQuery GIS** | Serverless, huge-scale point-in-polygon/distance; Google-managed sizing | Function depth < PostGIS; cost on heavy geometry | Reach for only at multi-city / national scale joins. |
| **Snowflake geospatial** | Native H3 hex indexing; separation of compute/storage | Spatial joins expensive (no spatial index, polygon overlay burns credits) ([Axis Spatial 2026](https://www.axisspatial.com/blog/geospatial-in-cloud-snowflake)) | Only if the org already standardizes on Snowflake (Cox does — see note). |
| **Apache Sedona / Wherobots** | Distributed spatial (Spark); true big-data | Operational heft | National-scale batch only; overkill for a city. |

**Recommended target:** **PostGIS as the system of record + DuckDB-spatial as the pipeline compute engine + GeoParquet on object storage as the interchange/lake format.** This is the "small-but-correct" stack that scales one building → a city without re-platforming, and it's a clean superset of the demo's geopandas/JSON approach.

> **Org note:** Cox Automotive operates Snowflake heavily (see the available Snowflake MCP connectors). If this productizes inside CAI, Snowflake-native H3 + a PostGIS serving layer is a credible variant — but **do the spatial joins in PostGIS/DuckDB, not Snowflake**, where polygon overlays are expensive. [UNVERIFIED — CAI Snowflake geospatial entitlements not confirmed here.]

### 2.2 The decision: raster handling

Environmental layers (NLCD impervious, Landsat LST, solar flux, canopy, flood) are rasters. The 2025 cloud-native pattern is unambiguous:

- **Storage format:** **Cloud-Optimized GeoTIFF (COG)** — internal tiling + overviews → stream only the window you need ([cogeo.org](https://cogeo.org/)).
- **Catalog/discovery:** **STAC** (SpatioTemporal Asset Catalog) — both Microsoft Planetary Computer and the eoAPI/titiler-pgstac stack are built on it ([Element 84](https://element84.com/geospatial/how-microsofts-planetary-computer-uses-stac/)).
- **Compute-where-the-data-is:**
  - **Google Earth Engine** — for LST/heat (Landsat `ST_B10`, FINAL §7.3) and any planetary-catalog raster math; **now exports COGs and reads COGs from GCS** so it integrates cleanly.
  - **Microsoft Planetary Computer** — free STAC catalog + hosted 3DEP LiDAR, NLCD, Landsat, Sentinel; the best free place to do city-scale raster sampling without egress pain.
- **Sampling in-pipeline:** `rasterio`/`rioxarray` windowed reads against COGs — sample at roof centroid / over the footprint polygon. (Already the demo's `rasterio` step; production just points it at COGs in object storage.)

```
   RASTER PLANE                          VECTOR PLANE
  ┌──────────────────────┐             ┌──────────────────────┐
  │ COGs in object store │             │ PostGIS (parcels,     │
  │  NLCD, LST, flux,    │  zonal      │  footprints, surfaces)│
  │  canopy, flood       │  stats /    │  + GeoParquet lake    │
  │ cataloged via STAC   │  sample ───▶│  (DuckDB compute)     │
  │ GEE / Planetary Comp │  at polygon │                       │
  └──────────────────────┘             └──────────────────────┘
              └──────────── joined on building/parcel key ──────────┘
```

### 2.3 CRS, vector tiles, the join pattern

- **CRS discipline:** store canonical geometry in **EPSG:4326** (WGS84) for interchange; **reproject to EPSG:26916 (UTM 16N)** for any area/distance math in Atlanta (Doc 02 §2.2). Never compute area in degrees. `pyproj` handles transforms; PostGIS `ST_Transform` for in-DB.
- **Vector tiles for the web:** serve the twin/portfolio map as **Mapbox Vector Tiles (MVT)** — PostGIS `ST_AsMVT` or pre-baked PMTiles. Keeps the city-scale portfolio map fast without shipping all geometry to the browser.
- **The join:** every layer carries a `building_id`/`parcel_id`. Geometry → spatial join (footprint within parcel; surface belongs to footprint). Rasters → zonal stats keyed to the polygon. Attributes (CBEEO) → attribute join on ABID. Output: one wide `building` row with a `surfaces[]` array. This is the contract the engine reads — identical shape to today's `buildings/<id>.json`, just sourced from a DB.

---

## 3. Ingestion pipeline orchestration

### 3.1 Batch vs. on-demand — do both

- **On-demand (single building / new address):** owner enters an address → synchronous-ish path (geocode → Solar/LiDAR geometry → PVWatts → raster sample → persist). Sub-minute. This is the product's interactive entry point and the natural extension of the demo's single-building flow.
- **Batch (portfolio / whole city):** nightly/periodic refresh of the CBEEO universe, raster re-sampling when new NLCD/LST drops, footprint refresh. This is where orchestration matters.

### 3.2 Orchestrator choice

| Tool | Model | Fit |
|---|---|---|
| **Dagster** ⭐ | **Asset-centric** — declares each data product (a building's surfaces, an LST sample) as an asset with lineage + checks | **Recommended.** Asset graph = our provenance/lineage requirement for free; tightest dbt integration with column-level lineage ([ZenML](https://www.zenml.io/blog/orchestration-showdown-dagster-vs-prefect-vs-airflow)). Maps perfectly to "every number traceable." |
| **Prefect** | Lighter, dynamic Python workflows; newer `@materialize` asset layer | Good if developer velocity > lineage formality; smaller ops footprint. |
| **Airflow** | Task-centric, biggest ecosystem, heaviest ops | Only if org already runs it. |

**Verdict:** **Dagster** — its asset/lineage model is a near-exact match for the per-number provenance hard requirement, and software-defined assets make the city-scale backfill (re-materialize all buildings when a coefficient changes) trivial.

**Transforms:** **dbt** for the tabular/attribute transforms (CBEEO normalization, EUI→kWh, incentive joins) running on DuckDB or the warehouse — versioned SQL, tested, lineage-tracked, and Dagster-orchestrated.

### 3.3 Data contracts, provenance & versioning

This is non-negotiable per the spec (every number must be defensible).

- **Schema/contract:** the existing JSDoc `Building`/`CandidateSurface`/`Score` typedefs become a **versioned JSON Schema / Pydantic model**. Pipeline output validates against it before write (today's FR-5, made enforceable).
- **Per-value provenance:** each numeric field is an object, not a scalar:
  ```jsonc
  "usableAreaM2": { "value": 1900.0, "provenance": {
      "source": "USGS 3DEP LiDAR QL2 + RoofSeg v1.2",
      "method": "roof-plane segmentation, EPSG:26916 area, minus obstructions",
      "date": "2026-06-16", "confidence": 0.9, "tier": "fetched" } }
  ```
  This is today's `fetched|manual|default` flag, promoted to a full record. Dagster asset metadata stores the lineage; the value record stores the human-facing citation.
- **Versioning:** geometry/raster snapshots are immutable, dated. A building's model is versioned (re-run when source imagery/LST/coefficients change) so a proposal is reproducible against the inputs that produced it. GeoParquet partitions by source-date; PostGIS rows carry `valid_from`/`source_version`.

### 3.4 Source ToS handling (the real operational constraint)

Doc 06 §2 nailed this for the demo; at production scale it becomes a hard architectural rule:

- **Google Solar / Geocode = transient only.** 30-day cache limit, no permanent derived dataset. Use it **live to seed/validate**, never as the stored value. Record *"validated against Solar API on date X"* in provenance; persist the **3DEP/Fulton-derived** equivalent. `place_id` is the one Google value storable forever.
- **System-of-record sources are license-clean:** PVWatts (NREL), 3DEP LiDAR (public domain), NLCD/Landsat (USGS/NASA), Fulton/MS footprints (public/ODbL), CBEEO (public disclosure). **Build the durable store exclusively from these.**
- **Architectural enforcement:** Google-sourced fields are written to a **TTL'd cache table (≤30 days)**, physically separate from the durable store, so the system *cannot* accidentally persist them past ToS. This is the difference between "we got away with it in a demo" and "this scales to production legally."

---

## 4. 3D model generation (geometry → twin assets)

The twin needs renderable 3D, not just numbers. Spectrum from cheapest to richest:

| Approach | Input | Output | Build/Buy | When |
|---|---|---|---|---|
| **Procedural massing** | footprint polygon + height (OSM levels / LiDAR DSM / assumed) | extruded glTF box per building | **Build** (trivial extrusion) | **Default for portfolio/city** — cheap, license-clean, "good enough" massing. Today's Three.js box, generalized. |
| **CityGML / CityJSON LoD2** | LiDAR-derived roof shapes | semantic city model (roofs, walls typed) | Build (from 3DEP) / Buy (vendor city models) | When roof-plane semantics matter for the twin (solar placement viz). [3DCityDB](https://github.com/3dcitydb/3dcitydb-web-map) → Cesium. |
| **3D Tiles / glTF (tiled)** | massing or mesh | streamable city-scale 3D | **Buy: Cesium ion** tiling pipeline (ingests CityGML, KML/COLLADA, IFC, glTF → 3D Tiles, [Cesium](https://cesium.com/platform/cesium-ion/3d-tiling-pipeline/)) | When the twin must stream a whole city without choking the browser. |
| **Photorealistic 3D Tiles** | — | Google's textured real-world mesh | **Buy: Google** ($6/1k tile requests, Doc 06) | Visual backdrop only — **not a data source** (can't extract clean roof planes). |

**Standards posture:** generate **CityJSON LoD1/LoD2** as the semantic interchange (it's the lightweight JSON encoding of CityGML, diff-able, web-friendly), tile to **3D Tiles/glTF** for streaming. CityJSON ↔ our `CandidateSurface` map cleanly: a RoofSurface in CityGML *is* a candidate roof plane.

**Build-vs-buy:** **build** procedural massing + CityJSON (cheap, owns the data); **buy** the *tiling/streaming* (Cesium ion) only when city-scale rendering performance demands it. Google Photorealistic 3D Tiles is a **buy** for backdrop polish, never for geometry. For the current demo's single building, the existing hand-massed Three.js model is fine; procedural massing is the first generalization step.

---

## 5. Build-vs-buy verdicts & phased roadmap

### 5.1 Verdict table

| Capability | Verdict | Rationale |
|---|---|---|
| Solar production (kWh) | **Buy: NREL PVWatts** | Free, authoritative, storable, global. Never build a solar model. |
| Roof geometry — fidelity seed | **Buy: Google Solar (transient)** | Best per-segment data; but ToS forbids persisting → seed/validate only. |
| Roof geometry — durable store | **Build: 3DEP LiDAR + roof-plane seg** | The only high-fidelity *storable* city-scale source. |
| **Parking-lot / obstruction detection** | **Build: ML (SAM2/segmentation)** | **Google can't do it; highest-value AI investment.** |
| Footprints (Atlanta) | **Buy/free: Fulton County / Microsoft** | Clean, free, storable. Build extraction only for any-city gaps. |
| Vector store | **Build on: PostGIS** | System of record + spatial joins. |
| Pipeline compute | **Build on: DuckDB-spatial + GeoParquet** | Embedded, fast, evolves from today's geopandas. |
| Raster catalog/compute | **Buy/free: GEE + Planetary Computer (STAC/COG)** | Free, hosted, compute-near-data. |
| Orchestration | **Buy/OSS: Dagster (+ dbt)** | Asset lineage = provenance requirement. |
| 3D massing / CityJSON | **Build** | Trivial extrusion; owns the data. |
| 3D tiling/streaming | **Buy: Cesium ion** (when needed) | Don't build a tiler. |
| Photoreal backdrop | **Buy: Google 3D Tiles** (optional) | Visual only. |

### 5.2 Phased path from today's offline-JSON demo

```
PHASE 0  (TODAY — demo)         Python pipeline → committed JSON → JS engine.  $0 infra.
   │  geopandas + rasterio + PVWatts cache; Google Solar live cross-check.
   ▼
PHASE 1  ADD FIRST: provenance + DuckDB + GeoParquet  ───────────────────────  [lowest effort, highest leverage]
   │  • Promote every value to {value, provenance{}} records (enforces the credibility req now).
   │  • Swap the in-pipeline compute to DuckDB-spatial reading/writing GeoParquet (keep JSON output for the twin).
   │  • Add the TTL'd Google cache table separation (ToS-safe by construction).
   ▼
PHASE 2  PERSIST: PostGIS system-of-record + portfolio
   │  • Stand up PostGIS; load CBEEO universe + footprints; the building/parcel join becomes a DB query.
   │  • Twin/report read from an API over PostGIS (still can serve static JSON snapshots for demo safety).
   │  • Portfolio view (the 2,350-building story) becomes real.
   ▼
PHASE 3  ORCHESTRATE + AI: Dagster + ML extraction
   │  • Dagster assets wrap each step; dbt for CBEEO/incentive transforms; lineage in the UI.
   │  • Add 3DEP LiDAR roof-plane segmentation (storable geometry) + ML parking-lot/obstruction detection.
   │  • Raster sampling moves to COG/STAC via Planetary Computer + GEE for LST.
   ▼
PHASE 4  SCALE + 3D: city/multi-city + procedural CityJSON → 3D Tiles
       • Procedural massing → CityJSON → Cesium ion tiling for city-scale twin.
       • (Optional) BigQuery/Snowflake for multi-city national joins; any-city footprint ML.
```

**What to add first (Phase 1):** the **provenance value-records** and the **DuckDB/GeoParquet** swap. Both are low-risk, in-place upgrades to the existing pipeline that (a) make the "every number is defensible" claim real today and (b) put the data on a format/engine that scales — without standing up any server. That single phase converts the demo into a credible production seed.

---

## 6. Biggest risks (flagged honestly)

1. **Google ToS vs. "store forever"** — committing/persisting raw Google Solar/geocode geometry violates the 30-day caching limit and the no-derived-dataset rule. *Mitigation:* TTL cache table + durable store built only from 3DEP/Fulton/PVWatts. **Do not claim "we store Google's solar data."** (Doc 06 §2, §7.)
2. **Tall-tower / dense-downtown geometry noise** — 100 Peachtree (35 stories) is the worst case for both Solar DSM and LiDAR (occlusion, parapets, penthouses). *Mitigation:* check `imageryQuality`/point density; fall back to footprint + flat-roof; prefer a mid-rise Fairlie-Poplar demo target.
3. **Parking-lot detection is unbought-able** — no API delivers it; if the product promises parking-canopy solar/heat numbers, that ML is on the critical path and is the riskiest *build*. *Mitigation:* start with SAM2 + NLCD-impervious heuristic before a fine-tuned model.
4. **3DEP coverage/recency gaps** — 99% baseline nationally but tile age and quality-level vary; a building may sit in an old QL3 area. *Mitigation:* tiered fallback (LiDAR → Google → footprint) per building, recorded in provenance.
5. **Provenance scope creep** — full per-value lineage is correct but heavy; if under-scoped it silently degrades to "trust me" numbers. *Mitigation:* enforce the value-record schema in Phase 1 *before* sources multiply.
6. **LST/heat credibility** — Landsat 30 m is coarse for a single roof; the metric stays partly illustrative (FINAL §7.3). *Mitigation:* label modeled-vs-measured; empirical deltas as sanctioned fallback.
7. **Cost asymmetry at scale** — Google Solar Building Insights 10k free/mo vs Data Layers **only 1k**; Snowflake spatial joins burn credits. *Mitigation:* never pull Data Layers per-roof; do joins in PostGIS/DuckDB.

---

## Sources

- Google Solar: [methodology (rooftop-only)](https://developers.google.com/maps/documentation/solar/methodology) · [overview](https://developers.google.com/maps/documentation/solar/overview) · [coverage expansion](https://cloud.google.com/blog/products/maps-platform/our-solar-api-now-covers-more-rooftops-worldwide)
- LiDAR / roof-plane seg: [USGS 3DEP](https://www.usgs.gov/3d-elevation-program/what-3dep) · [3DEP on AWS](https://registry.opendata.aws/usgs-lidar/) · [3DEP on Planetary Computer](https://planetarycomputer.microsoft.com/dataset/group/3dep-lidar) · [RoofSeg arXiv 2508.19003](https://arxiv.org/abs/2508.19003) · [boundary-aware roof clustering arXiv 2309.03722](https://arxiv.org/pdf/2309.03722)
- ML segmentation: [samgeo / SAM2 geospatial](https://samgeo.gishub.org/workshops/AIforGood_2025/) · [Esri SAM extension](https://www.esri.com/arcgis-blog/products/arcgis/geoai/dev-summit-2024-extending-the-segment-anything-model-sam) · [building seg dataset, Nature 2025](https://www.nature.com/articles/s41597-025-06014-4)
- Platform: [Spatial SQL landscape 2026 (Forrest)](https://forrest.nyc/best-spatial-sql-tools/) · [Sedona vs DuckDB vs PostGIS](https://forrest.nyc/sedonadb-vs-duckdb-vs-postgis-which-spatial-sql-engine-is-fastest/) · [Snowflake geospatial 2026](https://www.axisspatial.com/blog/geospatial-in-cloud-snowflake)
- Raster: [COG (cogeo.org)](https://cogeo.org/) · [Planetary Computer + STAC (Element 84)](https://element84.com/geospatial/how-microsofts-planetary-computer-uses-stac/) · [Cloud-Native Geospatial LPS 2025](https://vorgeo.github.io/lps25-cng/)
- Orchestration: [Dagster vs Prefect vs Airflow (ZenML)](https://www.zenml.io/blog/orchestration-showdown-dagster-vs-prefect-vs-airflow) · [Python pipeline tools 2026](https://getbruin.com/blog/best-data-pipeline-tools-2026/)
- 3D: [Cesium ion 3D tiling pipeline](https://cesium.com/platform/cesium-ion/3d-tiling-pipeline/) · [Cesium 3D Buildings](https://cesium.com/platform/cesium-ion/3d-tiling-pipeline/3d-buildings/) · [3DCityDB web viewer](https://github.com/3dcitydb/3dcitydb-web-map)
