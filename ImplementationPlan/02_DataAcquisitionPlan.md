# 02 — Data Acquisition Plan

## In-Planted / Climate Resilient ATL · Green-Retrofit Engine + 3D Digital Twin

> **Owner:** Data-acquisition lead · **Date:** 2026-06-16 · **Timeline:** days
> **Scope:** Exactly which datasets/APIs to pull, in what format, and which Atlanta building to demo on.
> **Grounding docs:** `FINAL.md` (§7 formulas, Appendix endpoints), `ArchitectureCodeResearchAgents/ExecutiveSummary.md` (§3A Data Source Registry), `projectSummary.md`.
>
> **⚠️ Verification note:** All endpoints checked June 2026. The biggest live change: **NREL's developer domain moved from `developer.nrel.gov` → `developer.nlr.gov`** (old domain retired 2026-05-29). Items I could not fully verify are flagged **[UNVERIFIED]**.

---

## 0. Executive read (for the team)

- **CBEEO is real and it is the anchor.** ~2,350 covered commercial/multifamily Atlanta buildings (>25,000 sqft), each with an **Atlanta Building ID (ABID)**, address, sqft, property type, and ENERGY STAR / energy+water use, reported via EPA Portfolio Manager. The **2023 benchmarking dataset is published open-source** through the City's CBEEO GIS map. This is our master building list and our "before" score source.
- **Access caveat:** CBEEO is surfaced as a **GIS web map + building-lookup app**, not (yet found) a one-click CSV. We have a confirmed map URL and lookup app; the clean bulk file requires either the map's backing ArcGIS Feature Service (scrape with browser dev-tools / ArcGIS query) or a direct request to `buildingefficiency@atlantaga.gov`. **Plan a fallback** (manual entry of one building) so the demo never blocks on this.
- **Everything else for the demo is gettable in days:** PVWatts (free key, minutes), eGRID GA factor (single constant, done — below), building footprints (Fulton County / Microsoft, free download), Georgia Power rate (~11.5¢/kWh, done), green-roof & solar cost ranges (literature, done).
- **Hardest-to-get-in-time:** land-surface temperature via Google Earth Engine (needs an account + a script) and the *exact* CBEEO bulk CSV. Both have defensible fallbacks.

---

## 1. The CBEEO Dataset (the "gold" master list)

### 1.1 What it is

| Attribute | Detail |
|---|---|
| Full name | Commercial Buildings Energy Efficiency Ordinance (**CBEEO**) benchmarking & disclosure program |
| Authority | City of Atlanta, Mayor's Office of Sustainability & Resilience |
| Coverage | Commercial **and** multifamily buildings > **25,000 sqft**; municipal > 10,000 sqft. ~**2,350 properties** ≈ 80% of the city's commercial floor area |
| Reporting | Annual whole-building energy + water via **EPA ENERGY STAR Portfolio Manager**; due **July 1** for prior calendar year |
| Key ID | Each covered building gets an **Atlanta Building ID (ABID)** |
| Open data | **2023 benchmarking dataset published open-source** via the City's CBEEO map |
| Contact | `buildingefficiency@atlantaga.gov` |

### 1.2 Where to get it (verified URLs)

| Resource | URL | What it gives | Format |
|---|---|---|---|
| **CBEEO GIS map / "Atlanta Energy Map"** | `https://gis.atlantaga.gov/cbeeo/` (a.k.a. `gis.atlantaga.gov/CBEEO/`) | Searchable map of covered buildings; 2023 open dataset surfaced here | ArcGIS web map (interactive) |
| **COA Buildings lookup app** | `https://web.atlantaga.gov/coabuildings/#/` | Look up a property's **ABID** + property attributes | Web app / search |
| **Program hub** | `https://www.benchmarkatl.com/` | Program landing; links to the map + 2023 open dataset | Web |
| **Program blog/archive** | `https://atlantabuildingbenchmarking.wordpress.com/` | Reports, FAQ, history | Web |
| **City planning GIS / Open Data Hub** | `https://dpcd-coaplangis.opendata.arcgis.com/` | Parcels, zoning, historic overlays (companion layers) | GeoJSON / Shapefile / REST |

### 1.3 How to actually download it (do this, in order)

1. **Open `gis.atlantaga.gov/cbeeo/`**, then open browser DevTools → Network tab → filter `query` or `FeatureServer`. The map fetches its data from an **ArcGIS Feature Service**; capture that service URL. Then bulk-pull with:
   `…/FeatureServer/0/query?where=1=1&outFields=*&f=geojson` (ArcGIS supports `f=geojson`, `resultOffset` paging). **[UNVERIFIED — service URL not enumerable from outside; the `dpcd` and base `server` REST roots I probed did not list a CBEEO service, so it likely lives on a different ArcGIS Online/host.]**
2. **If (1) fails fast:** email `buildingefficiency@atlantaga.gov` requesting the **2023 benchmarking dataset as CSV** (it's published open-source — a direct file should exist). Ask explicitly for: ABID, address, property type, gross floor area (sqft), ENERGY STAR score, site/source EUI, weather-normalized energy, GHG.
3. **Fallback for the demo (do this in parallel regardless):** manually transcribe the **one demo building's** row from the lookup app + map popup. We only need ~5 fields to drive the engine (see §1.4). Do not let bulk acquisition block the build.

### 1.4 Field → `Building` object mapping

| CBEEO field | Building object field | Use in engine |
|---|---|---|
| ABID | `building.id` | Join key across all layers |
| Address | `building.address` | Geocode → lat/lon for PVWatts; locate footprint |
| Property type (e.g. Office) | `building.use_type` | Picks intervention defaults + ENERGY STAR peer baseline |
| Gross floor area (sqft) | `building.gross_sqft` | Energy normalization (EUI × sqft = kWh) |
| **ENERGY STAR score (1–100)** | `building.energy_star_score` | The **"before" sustainability rating** (FINAL §3.1); lower = better demo |
| Site/Source EUI (kBtu/sqft) | `building.eui` | Baseline energy → kWh → savings & CO₂ |
| Weather-normalized energy / GHG | `building.baseline_kwh`, `baseline_ghg` | Carbon baseline |

> **Licensing:** Published by the City as open/public disclosure data. Treat as **public/open** (cite "City of Atlanta CBEEO"); no commercial restriction found. **[UNVERIFIED — no explicit license string on the map; confirm if redistributing the bulk file.]**

---

## 2. Per-Metric Data Sources (refreshed registry)

### 2.1 Solar — NREL PVWatts API v8 ✅ STRONG (do first)

| | |
|---|---|
| **Source** | NREL PVWatts v8 |
| **Endpoint** | `GET https://developer.nlr.gov/api/pvwatts/v8.json?...` (⚠️ **nlr.gov**, not nrel.gov — old domain retired 2026-05-29) |
| **API key** | Free, instant: sign up at the NREL/NLR Developer Network key signup page. Use `DEMO_KEY` for first smoke test |
| **Rate limit** | 1,000 req/hr |
| **Format** | JSON (or XML) |
| **License** | Public US-Gov / NREL API ToS (free, attribution) |
| **Days verdict** | ✅ **Minutes.** No blocker |

**Required request params:** `api_key`, `system_capacity` (kW DC), `module_type` (0 std / 1 premium / 2 thin-film), `losses` (% — use **14**), `array_type` (use **1 = fixed roof mount**), `tilt` (deg — flat roof ≈ **10**), `azimuth` (deg — **180** = south), `lat`, `lon`.
**Useful optional:** `dataset=nsrdb`, `dc_ac_ratio=1.2`, `inv_eff=96`, `gcr=0.4`, `timeframe=monthly`.

**Response shape (`outputs`):** `ac_annual` (kWh/yr — **the headline number**), `ac_monthly[12]`, `solrad_annual`, `solrad_monthly[12]`, `capacity_factor`, `dc_monthly`, `poa_monthly`.

**Example (smoke test):**
```
https://developer.nlr.gov/api/pvwatts/v8.json?api_key=DEMO_KEY&system_capacity=500&module_type=1&losses=14&array_type=1&tilt=10&azimuth=180&lat=33.7565&lon=-84.3922
```

**Roof → system size (FINAL §7.1):** `kW_DC ≈ usable_roof_m² × 0.15 kW/m² × 0.7 packing`. (0.15 kW/m² ≈ a ~19–20%-efficient module at 1 kW/m² STC.)

### 2.2 Building geometry / footprints ✅ STRONG

| Source | URL | Gives | Format | Days verdict |
|---|---|---|---|---|
| **Fulton County Structure Footprints** ⭐ *best local* | `https://gisdata.fultoncountyga.gov/` → "Structure Footprints" | Footprint polygons (imagery-derived), local + current | GeoJSON/Shapefile/CSV/REST | ✅ download |
| **Microsoft US Building Footprints** | `https://github.com/microsoft/USBuildingFootprints` | GA = 3.8M polygons (national, free) | GeoJSON (zipped) | ✅ download (1.1 GB GA file — clip to downtown) |
| **COA Open Data Hub** | `https://dpcd-coaplangis.opendata.arcgis.com/` | Parcels, zoning, historic overlays | GeoJSON/REST | ✅ |
| **ARC Open Data Hub** | `https://opendata.atlantaregional.com/` | Regional footprints, land use | GeoJSON/CSV/WFS | ✅ |
| **OpenStreetMap** | Overpass API / `geofabrik.de` GA extract | Some buildings tagged with height/levels | GeoJSON/PBF | ✅ (coverage uneven downtown) |

- **Roof area:** polygon area of the footprint (project to a metric CRS, e.g. EPSG:26916 UTM 16N, then compute area in m²). For a multi-story tower, **footprint area ≈ roof area** (use footprint, not gross floor area).
- **Orientation/azimuth:** derive from the footprint's minimum-bounding-rectangle long axis, or assume flat-roof south-facing (azimuth 180) for PVWatts — fine for a flat roof.
- **Recommendation:** Fulton County footprints (freshest, smallest, local) for the demo block; Microsoft as the generalization story.

### 2.3 Stormwater / impervious ✅ MOSTLY

| Source | URL | Gives | Format | Days verdict |
|---|---|---|---|---|
| **GSMM Vol. 2** (GA Stormwater Mgmt Manual) | georgiastormwater.com (Vol. 2) | Sizing basis + runoff coeff `Rv = 0.05 + 0.009×I` | PDF (manual) | ✅ read once, hard-code formula |
| **USGS NLCD % Impervious** | `https://www.mrlc.gov/` (NLCD Viewer / Direct Download) | 30 m impervious % raster (2019/2021) | GeoTIFF | ✅ download/clip |
| **Atlanta Watershed GIS / DWM** | `https://atlantawatershed.org/gis/` | Local stormwater layers; sf applicability threshold | Partly request-based | ⚠️ no clean REST; confirm threshold w/ DWM at parcel stage |
| **FEMA NFHL** (flood) | `https://www.fema.gov/flood-maps/national-flood-hazard-layer` | Flood zones | REST/WMS | ✅ portable |

- **Regulatory target:** capture the **first 1.0"** on-site (Ch. 74 Art. X). *Verify vs. GSMM's historic 1.2" WQv basis at parcel stage.*
- **Engine math:** `WQv (ft³) = P × Rv × A / 12`; `Rv = 0.05 + 0.009 × I%`; green-roof annual capture ≈ `area × annual_rainfall × retention%`; `1 ft³ = 7.48 gal`.

### 2.4 Carbon — EPA eGRID ✅ DONE (single constant)

| | |
|---|---|
| **Source** | EPA eGRID2023 (released 2025), subregion **SRSO** (SERC South) = Georgia |
| **Verified factor** | **846.0 lb CO₂e/MWh → 0.3837 kg CO₂/kWh** (eGRID2023 Rev 2, SRSO) |
| **Use** | `CO₂ avoided (kg) = (kWh_saved + kWh_solar) × 0.3837` |
| **Where** | `https://www.epa.gov/egrid` (Data Explorer / summary tables) |
| **License** | Public US-Gov |
| **Days verdict** | ✅ **Already have it** — hard-code `0.3837 kg/kWh` |

> Note: SRSO mix ≈ gas 55% / nuclear 20% / coal 15%; ~30% carbon-free. This is *cleaner* than the old "~0.4" placeholder in FINAL §7.5 — update the doc.

### 2.5 Heat — Land Surface Temperature (LST) 🟠 HARDEST IN-TIME

| | |
|---|---|
| **Source** | Landsat 8/9 (Collection 2 L2 `ST_B10`) or MODIS LST via **Google Earth Engine (GEE)** |
| **Access** | GEE account (free, sign-up approval may take hours–a day) + a JS/Python script; or pre-export a GeoTIFF |
| **Format** | GeoTIFF raster (30 m Landsat / 1 km MODIS) |
| **License** | Public (USGS/NASA) |
| **Days verdict** | 🟠 **Feasible but the long pole.** Needs an account + scripting. **Fallback:** use empirical deltas from the research (black roof ~140°F vs green roof ~90°F; parking 120–150°F vs park 85°F) and label heat as illustrative |

**Pragmatic plan:** pull one summer Landsat LST scene over downtown, sample the demo roof's pixels for the "before" temp, then apply an empirical post-retrofit delta per intervention. If GEE access slips, ship the empirical-delta version.

### 2.6 Energy — ENERGY STAR + Georgia Power rate ✅ STRONG

| Source | Gives | Access | Days verdict |
|---|---|---|---|
| **CBEEO / ENERGY STAR Portfolio Manager** | Building's ENERGY STAR score (1–100) + EUI = the baseline | From CBEEO row (§1) | ✅ |
| **ENERGY STAR benchmark** | Top-25% ≈ **35% less energy** than peers (the "bar") | Public | ✅ constant |
| **Georgia Power commercial tariff** | **~11.5¢/kWh** (GA commercial avg, June 2026; sources: 11.49–11.57¢) | Public rate data; tariff sheets at georgiapower.com/business/billing-and-rates | ✅ use **$0.115/kWh** |

- **Energy math (FINAL §7.4):** empirical-% cooling reduction from green roof + solar offset; `$ saved = kWh_saved × $0.115`. Use empirical % for the hackathon (EnergyPlus is out of scope for days).

### 2.7 Cost — green-roof / solar / GI ✅ DONE (literature ranges)

| Item | Defensible range | Source |
|---|---|---|
| **Extensive green roof** | **$10–$30/sqft** installed (use **$20/sqft** midpoint) | Multiple 2025–26 cost surveys (Angi, Fixr, RAND) |
| **Intensive green roof** | $20–$200/sqft (we model extensive → low-load, clears structural gate) | same |
| **Commercial rooftop PV** | **~$1.5–$2.0/W DC** installed (use **$1.75/W**) | NREL ATB 2024 / Q1-2024 Solar Cost Benchmark **[number range from NREL docs; ATB page didn't load on last fetch — confirm exact $/W]** |
| **GI cost-per-gallon / cistern** | EPA GI toolkits + Chattahoochee Riverkeeper ATL case study | EPA green-infrastructure cost data |

- **Days verdict:** ✅ Use the midpoints above as defaults; cite source. Refine only if time allows.

---

## 3. Demo Building Selection

### ⭐ PRIMARY RECOMMENDATION: **100 Peachtree Street (the former Equitable Building)**

| Field | Value |
|---|---|
| **Address** | 100 Peachtree St NW, Atlanta, GA 30303 |
| **District** | **Fairlie-Poplar** (designated downtown historic district) → exercises the AUDC regulatory story |
| **Size** | ~**620,000 sqft**, 35-story Class A office tower (1968, SOM) |
| **Approx lat/lon** | 33.7565, -84.3884 (for PVWatts) |
| **CBEEO** | >25,000 sqft office → **covered**; has an ABID + ENERGY STAR score to pull as the "before" |
| **Roof** | Flat low-slope roof typical of the era → good for PV + extensive green roof |

**Why it wins the demo:**
- **(a) Mediocre "before" score:** a 1968 tower mid-renovation almost certainly benchmarks in the **lower ENERGY STAR band** → strong before/after narrative. *(Pull the actual score from CBEEO to confirm.)*
- **(b) Large flat roof** for solar + green roof.
- **(c) Stormwater + heat + carbon together:** big impervious roof in the CSO-pressured Connector core.
- **(d) Regulatory story:** **Fairlie-Poplar = AUDC Certificate of Appropriateness** (the historic gate in ExecutiveSummary §1), and it directly parallels the **Atlanta City Hall green-roof precedent** (1930s downtown historic high-rise, no reinforcement) — our strongest "it gets permitted" proof.

> ⚠️ **Caveat:** A 35-story tower has a *small roof relative to floor area* — solar/green-roof area is modest vs. total sqft. If the team wants **max roof area to dramatize stormwater/solar**, prefer a **low/mid-rise big-floorplate** building (Alternate 1).

### Alternate 1 — **A Fairlie-Poplar / South Downtown mid-rise (4–8 stories, big floorplate)** ⭐ best if roof-area impact is the hero
Pick from the CBEEO list filtered to: downtown, 4–8 stories, large footprint, low ENERGY STAR score. A mid-rise gives a **bigger roof-to-volume ratio** → bigger gallons/kWh per building, while still hitting the Fairlie-Poplar AUDC story and the ≥4-story / parapet-conceal pattern the historic precedent recommends (ExecutiveSummary §2, §6). **Action:** once the CBEEO bulk pull lands, sort by `(footprint_area DESC, energy_star_score ASC)` within the Fairlie-Poplar / Five Points polygon and take the top hit.

### Alternate 2 — **Atlanta City Hall (68 Mitchell St SW)**
Not the owner-pitch actor (it's municipal), **but** it is the *literal precedent* cited in the regulatory chain (58 psf added vs 186 psf capacity, no reinforcement) and is CBEEO-covered (municipal). Excellent if the City-sponsor framing leads the pitch; weaker if the "private owner wants the money" framing leads.

---

## 4. Concrete Pull List (execute this checklist for the chosen building)

> Target: 100 Peachtree (or the chosen Fairlie-Poplar building). All values feed the scoring engine's `Building` object.

- [ ] **CBEEO row** → ABID, address, property type, **gross sqft**, **ENERGY STAR score**, **EUI**, GHG. (From `web.atlantaga.gov/coabuildings/` + `gis.atlantaga.gov/cbeeo/`; fallback email DWM/Sustainability.)
- [ ] **Lat/lon** → geocode the address (COA `GIS_CompositeLocator_2024` GeocodeServer, or any geocoder). ~`33.7565, -84.3884`.
- [ ] **Roof polygon + area (m²)** → Fulton County Structure Footprints (`gisdata.fultoncountyga.gov`); compute area in UTM 16N. Usable roof ≈ `0.6–0.7 × footprint`.
- [ ] **PVWatts call** → `system_capacity = usable_m² × 0.15 × 0.7`; `array_type=1, tilt=10, azimuth=180, losses=14`. Capture `ac_annual` (kWh/yr). Endpoint: `developer.nlr.gov/api/pvwatts/v8.json`.
- [ ] **Impervious %** for the parcel → NLCD GeoTIFF (mrlc.gov) sampled at lat/lon (rooftop ≈ 100%). Feeds `Rv`.
- [ ] **Stormwater capture** → `WQv = 1.0" × Rv × roof_area / 12` ft³ → ×7.48 gal; green-roof annual ≈ `roof_area × ~50"/yr Atlanta rainfall × 60% retention`.
- [ ] **Carbon** → `(kWh_solar + kWh_saved) × 0.3837 kg/kWh` (eGRID SRSO).
- [ ] **Energy $ saved** → `kWh_saved × $0.115`.
- [ ] **Cost / ROI** → green roof `usable_sqft × $20`; PV `kW_DC × 1000 × $1.75`; payback = `(capex − incentives) / annual_savings`.
- [ ] **(Optional) LST** → one summer Landsat scene over downtown via GEE; sample roof pixels for "before" temp. Else use empirical deltas.
- [ ] **Regulatory flags** → confirm Fairlie-Poplar historic overlay (COA Open Data Hub historic layer) → triggers AUDC narrative + cool-roof-exemption hook.

---

## 5. Defensible Default Constants (cite these in the demo)

| Constant | Default | Source / note |
|---|---|---|
| Grid emission factor (GA) | **0.3837 kg CO₂/kWh** | EPA **eGRID2023 Rev 2, SRSO** (846 lb CO₂e/MWh) — *replaces FINAL's ~0.4 placeholder* |
| Georgia Power commercial rate | **$0.115/kWh** | GA commercial avg, June 2026 (11.49–11.57¢) |
| Module power density | **0.15 kW/m²** | ~19–20% efficient module @ 1 kW/m² STC (FINAL §7.1) |
| Roof packing factor | **0.70** | Standard PV roof packing (FINAL §7.1) |
| PV system losses | **14%** | PVWatts default |
| PV tilt / azimuth (flat roof) | **10° / 180°** | Low-tilt flat-roof mount, south-facing |
| Green-roof stormwater retention | **~60% of annual rainfall** (range 30–86%; lit. avg ~56%) | Extensive green-roof retention studies; Chicago City Hall ~75% of a 1" storm |
| First-inch capture target | **1.0"** on-site | Ch. 74 Art. X (verify vs. GSMM 1.2" WQv) |
| Runoff coefficient | `Rv = 0.05 + 0.009 × I%` | GSMM Vol. 2 |
| Extensive green-roof cost | **$20/sqft** (range $10–$30) | 2025–26 cost surveys |
| Commercial rooftop PV cost | **$1.75/W DC** (range $1.5–$2.0) | NREL ATB 2024 / Solar Cost Benchmark **[confirm exact $/W]** |
| Atlanta annual rainfall | **~50 in/yr** | NOAA climate normals **[round figure — confirm if precise number needed]** |
| ENERGY STAR top-25% benefit | **~35% less energy & emissions** | ENERGY STAR program (FINAL §3.1) |
| ft³ → gallons | **7.48 gal/ft³** | Standard |
| Green-roof structural load | **15–35 psf** (extensive) | Clears structural gate; ExecutiveSummary §1 |
| Incentives (already researched) | §179D, 30% ITC (→2032), GA Power rebate $100K–350K/bldg/yr, Conservation Tax Credit (25% FMV, $500K cap), cool-roof exemption | FINAL §5.1 |

---

## 6. Flags / things I could NOT fully verify

- **CBEEO backing ArcGIS Feature Service URL** — not enumerable from the public `gis.atlantaga.gov` REST roots I probed; likely hosted on ArcGIS Online or a separate host. **Capture via browser DevTools on the live map, or request the CSV from `buildingefficiency@atlantaga.gov`.**
- **100 Peachtree's actual ENERGY STAR score / ABID** — assumed "mediocre"; **must confirm from CBEEO** before quoting.
- **CBEEO license string** — treated as open/public; confirm before redistributing the bulk file.
- **NREL commercial PV exact $/W** — ATB page failed to load on last fetch; range ($1.5–$2.0/W) is from NREL docs but confirm the precise 2024 figure.
- **Atlanta annual rainfall** — used ~50 in/yr; confirm exact NOAA normal if a precise gallons number is needed.
- **NREL domain** — confirmed moved to `developer.nlr.gov`; update any code/docs that still point at `developer.nrel.gov`.
