# 07 — Side-B / Mayor's-Office Data Research

## In-Planted / Climate Resilient ATL — the city-facing (B1) data layer

> **What this document is.** The product is a **two-sided value exchange**: Side A gives the building owner its cost/incentive/payback case; **Side B gives the Atlanta Mayor's Office a report showing the building's contribution to the City's codified sustainability goals.** This file researches (A) where to pull a building's *current* sustainability standing (the "before"), and (B) the specific public data points + framings that make a retrofit **legible to the City as goal-contribution**, plus a recommended structure for the **B1 City / Mayor's-Office Contribution Report** (taxonomy slot in `03_ReportExportSpec.md` §1.1).
>
> **Grounding:** `FINAL.md` §1 (City-as-sponsor; 59% GHG by 2030 / net-zero 2050 / 100% clean energy 2035), §4 (env stats), §5.3 (equity overlay); `03_ReportExportSpec.md` §1.1 (B1 slot), §3 Side-B track (CBEEO); `02_DataAcquisitionPlan.md` §1 (CBEEO anchor), §2.4 (eGRID factor). 
>
> **Pin instruction (honored here):** Side-B is **gathered now, slotted into the report later.** It must NOT complicate the owner-facing eligibility logic. Most of this is **pinned-for-later**; the demo-now cut is a single B1-lite paragraph (see §5).
>
> **Date:** 2026-06-16. All city plans/targets verified against City of Atlanta / 100atl.com / EPA sources June 2026 (citations in §7). "Verify" flags on anything I could not pin exactly.

---

## A. Current-Sustainability / Baseline Data Sources (the "before")

**Cleanest credible path to "this building is currently at X":** the building's **CBEEO benchmarking row** (Atlanta Building ID → ENERGY STAR score 1–100 + EUI), which is *already* computed by EPA ENERGY STAR Portfolio Manager from the owner's whole-building energy+water and disclosed to the City. This is the single most defensible "before" because it is (a) the City's own metric, (b) peer-normalized, and (c) the exact number the City already tracks for the same building. This duplicates and confirms `02_DataAcquisitionPlan.md` §1 — no change to that anchor.

| Source | Field(s) it gives | Access | Days verdict |
|---|---|---|---|
| **CBEEO benchmarking dataset** (City of Atlanta, Mayor's Office of Sustainability & Resilience) | ABID, address, property type, gross sqft, **ENERGY STAR score (1–100)**, **site/source EUI**, weather-normalized energy, GHG — the "before" rating | `gis.atlantaga.gov/cbeeo/` map + `web.atlantaga.gov/coabuildings/` lookup app; bulk CSV via DevTools→FeatureServer or email `buildingefficiency@atlantaga.gov`. 2023 dataset published open. | ✅ **Single building: minutes** (manual row). Bulk CSV: 1–2 days / **[UNVERIFIED service URL]** |
| **ENERGY STAR Portfolio Manager** (EPA) | The engine behind the CBEEO score/EUI; owner can export their own 12-mo energy+water + GHG | Owner login (if we have the owner) OR derive from CBEEO disclosure | ✅ if owner data; else use CBEEO disclosed value |
| **ENERGY STAR peer benchmark** (constant) | Top-25% ≈ **35% less energy & emissions** than peers — the "bar" the score is measured against | Public program constant | ✅ constant |
| **EPA eGRID2023 Rev 2, subregion SRSO (Georgia)** | Grid carbon factor **0.3837 kg CO₂/kWh** → converts the building's kWh baseline into a tons-CO₂ baseline | `epa.gov/egrid` | ✅ **already have it** (hard-coded) |
| **Atlanta Better Buildings Challenge dashboard** | *Aggregate/portfolio context*, not single-building: public dashboard of participant energy+water reduction (program goal was 20% by 2020) | `atlantabbc.com/data-dashboard/` | ✅ context only |
| **Fulton County / Microsoft footprints + NLCD impervious** | Roof area, impervious % — sizes the "before" stormwater runoff baseline | `gisdata.fultoncountyga.gov`, `mrlc.gov` | ✅ download |

**Verdict:** the "before" is a **solved problem** and the path is already documented in `02_DataAcquisitionPlan.md`. The ENERGY STAR score + EUI from CBEEO is the credible single number; eGRID converts its kWh into a CO₂ baseline; footprint+impervious gives the stormwater baseline. Nothing new needed for Side-A; Side-B just *re-frames* these same numbers as a city contribution (below).

---

## B. Mayor's-Office-Useful Data Points (each phrased as the city-goal-contribution it supports)

**The core mechanic:** the City tracks progress against a small set of codified, *quantified* goals. Side-B's job is to express one building's retrofit **delta** as a contribution to one of those tracked metrics. Prioritized by how directly the City can "book" the contribution.

| # | Data point (from the engine / public source) | City goal it counts toward | Public source for the framing |
|---|---|---|---|
| 1 | **Tons CO₂/yr avoided** = (kWh saved + kWh solar) × 0.3837 kg/kWh | **59% GHG reduction by 2030 / net-zero 2050.** City's 2019 baseline; **2023 inventory shows only ~8% achieved so far** and **energy = 67.23% of citywide emissions** — every commercial ton is high-leverage. | Atlanta GHG Inventories (100atl.com); EPA eGRID SRSO |
| 2 | **kWh/yr reduced + kWh/yr solar generated** | **100% clean energy by 2035** (Clean Energy Atlanta). City is **~18% renewable now** and *Georgia Power does not share the target* — so demand-side cuts + on-site solar are the levers the City actually controls. | Clean Energy Atlanta plan (100atl.com); AJC progress reporting |
| 3 | **ENERGY STAR score improvement (before→after) + EUI drop** | **CBEEO program goal: 20% commercial energy reduction by 2030 / 50% emissions cut from 2013 by 2030.** A retrofit that moves a building up the score *is the program's success metric*. Also satisfies the building's **annual CBEEO benchmarking** (≥25,000 sqft, **June 1** deadline). | CBEEO / benchmarkatl.com; SK Collaborative CBEEO summary |
| 4 | **Gallons/yr stormwater retained on-site + first-inch (1.0") compliance** | Citywide GI target **225M gal/yr**; first-inch retention (Ch. 74 Art. X) is the **highest-status downtown metric** and eases CSO pressure in the Connector core. | City GI plan (FINAL §4); DWM |
| 5 | **Roof-temp / land-surface-temp reduction (°F)** | **Climate Resilient ATL** adaptation goal (extreme-heat preparedness). Urban heat island in dense Atlanta runs **up to ~20°F hotter** than canopied areas. | NOAA 2022 Atlanta heat-watch campaign; NASA Earth Obs.; Landsat LST |
| 6 | **Canopy / vegetated area added (m² or "habitat")** | **50% canopy goal** (~45% actual); "City in a Forest." Green-roof area is incremental canopy-equivalent. | GA Tech Atlanta UTC (2018 & 2023) |
| 7 | **Equity overlay flag: is the parcel in / adjacent to a high-burden tract?** (heat, flood, energy-burden) | **Climate Resilient ATL equity principle + Justice40-style framing** — "this high-impact retrofit is *also* in a high-burden block." Energy burden >6% for ~50,000 ATL households; heat/flood risk concentrated **west & south of downtown**. | DOE **LEAD tool** (energy burden by tract); **CEJST** disadvantaged-community flag *(archived — see flag)*; FEMA NFHL + Proctor Creek (flood); NOAA heat campaign |

### Key 2026 development the team should know
Atlanta released its **first Climate Resilience Action Plan ("Climate Resilient ATL")** in **early 2026** — 18 months, 2,100+ residents, community-led + data-driven, environmental justice as a core principle. This is the *named plan the project is themed after* and the single best "the City asked for this" hook. It is adaptation-led (heat, flood, infrastructure) and sits **alongside** the existing mitigation goals (59%/net-zero/100% clean energy), not replacing them. The public plan page is **engagement-framed and does NOT publish new quantified sector targets** beyond the existing commitments — so for hard numbers, cite the GHG Inventory (#1) and CBEEO (#3), and cite Climate Resilient ATL for the *equity + adaptation framing* (#5, #7).

### What the City would actually DO with a B1 report
- **CBEEO compliance + program tracking** — the building's energy data rolls into the City's commercial-sector progress metric (the 20%-by-2030 / 50%-emissions goal).
- **Inventory contribution** — booked tons CO₂ feed the citywide GHG inventory (energy sector = 67%).
- **District/equity prioritization** — flag retrofits landing in high-burden tracts for incentive alignment, Justice40-style benefit-tracking, and Social-Bond (Series 2022A-1) eligible-project lists.
- **Public/Council reporting** — a clean per-building "contribution" line is exactly what feeds a scorecard or a Council update; the City otherwise has to compile this manually.
- **Procurement / partnership signal** — demonstrates private capital moving toward the codified goals the City cannot hit by retrofitting buildings it doesn't own (FINAL §1).

---

## C. Suggested Structure for the B1 City / Mayor's-Office Contribution Report

Audience-flag render (`audience: "city"`) of the **same JSON** the owner report uses (`03_ReportExportSpec.md` §4) — no new data pipeline, just a re-framing. Sections:

1. **Building identity + CBEEO standing** — ABID, address, property type, gross sqft; **current ENERGY STAR score + EUI** (the City's own "before"). Establishes "you already track this building at X."
2. **Contribution to GHG / clean-energy goals** — tons CO₂/yr avoided → *"counts toward the 59%-by-2030 target (energy = 67% of citywide emissions)"*; kWh reduced + solar kWh → *"toward 100% clean energy by 2035."*
3. **Contribution to CBEEO program metric** — projected ENERGY STAR score before→after + EUI drop → *"advances the 20% commercial-energy-reduction-by-2030 goal"*; confirms the building's annual benchmarking is satisfied.
4. **Resilience & stormwater contribution** — gallons/yr retained + first-inch compliance → citywide GI target; roof-temp / LST drop → extreme-heat adaptation (Climate Resilient ATL).
5. **Canopy / green-space contribution** — vegetated m² added → 50%-canopy / City-in-a-Forest (label as canopy-equivalent, honest).
6. **Equity overlay** *(pinned — see §5)* — parcel's tract-level energy-burden (LEAD), heat (NOAA/LST), flood (FEMA NFHL/Proctor Creek) context → Justice40-style "high-impact AND high-burden" flag.
7. **Provenance & honesty footer** — every number tagged `measured / modeled / illustrative / literature` + `verify` flag (same `data_provenance` map as the master report).

**Format:** a 1-page PDF (or single appended section to the master). All values come from the existing `packages[].impact` block — the B1 report is a *projection / framing layer*, never a new computation.

---

## D. Demo-now vs. Pinned-for-later

**DEMO-NOW (cheap, exercises the two-sided pitch — matches `03_ReportExportSpec.md` §6 "B1 lite"):**
- A **single B1-lite paragraph** appended to the owner one-pager: *"This building contributes ~X tons CO₂/yr and ~Y gallons/yr retained toward Atlanta's 59%-by-2030 and stormwater goals, and would improve its ENERGY STAR score from A→B (the CBEEO program metric)."* All four numbers already exist in the engine output. Zero new pipeline.
- The **before** number (ENERGY STAR score / EUI from CBEEO) — already in scope for Side A; just surface it.

**PINNED-FOR-LATER (gather now, slot in later; do NOT complicate owner eligibility logic):**
- The **full multi-section B1 PDF** (§C above).
- The **equity overlay** (#7 / §C.6) — LEAD energy-burden join, CEJST flag, FEMA flood, NOAA/LST heat by tract. This is data-join work and politically nuanced; strongest for the City but not needed to prove the mechanic.
- **CBEEO bulk-CSV wiring** for portfolio-level aggregate contribution (one master per building, summed).
- **Live before→after ENERGY STAR re-scoring** (requires an energy model, not just a delta estimate).
- Citing **Climate Resilient ATL** adaptation framing in the report copy once the published plan's exact language/targets are confirmed.

---

## E. Honest flags (unverified / moving)

- **GHG inventory sector split:** 100atl.com states energy **67.23%** / transportation **33.86%** (2023 inventory, 2019 baseline, ~8% reduction achieved). This differs from FINAL §1's "commercial = 58% of CO₂ / 66% of energy use" framing — the 58/66% figures are an older/different cut. **Use 67% energy (2023 inventory) for the City framing; flag the discrepancy.** **[VERIFY which vintage the team wants to cite.]**
- **CEJST (Climate & Economic Justice Screening Tool) was removed from federal hosting in Jan 2025**; archived versions exist (e.g., UCSB Bren mirror). For the equity overlay, **prefer DOE LEAD (energy burden) + FEMA NFHL (flood) + NOAA/Landsat (heat)** which are still live; treat CEJST as a *nice-to-have archived* flag. **[VERIFY archive availability before relying on it.]**
- **Climate Resilient ATL** public page is engagement-framed and **publishes no new quantified sector targets** beyond the existing 100%-clean-energy-2035 commitment — do not invent numbers from it; cite it for *framing/equity/adaptation*, cite the GHG Inventory + CBEEO for *hard numbers*.
- **CBEEO program targets** ("20% commercial energy reduction by 2030," "50% emissions from 2013 by 2030," "2.4% avg annual savings for consistently-benchmarked buildings") are from third-party CBEEO summaries (SK Collaborative / GreenEconoME), not pulled directly off the City ordinance text. **[VERIFY against the ordinance / benchmarkatl.com before quoting in a deliverable.]**
- **CBEEO deadline:** `02_DataAcquisitionPlan.md` says **July 1**, `03_ReportExportSpec.md` says **June 1**. Third-party guides this round say **June 1**. **[VERIFY the current deadline; reconcile the two docs.]**
- **CBEEO backing ArcGIS Feature Service URL** still not enumerable externally (carried from `02`); single-building manual entry is the safe demo path.
- Energy-burden "~50,000 households >6%" and heat "up to ~20°F" are credible public figures (ARC/33n, NASA) but are **regional/illustrative**, not parcel-specific — label as context, not as a building metric.

---

## F. Sources
- [Mayor's Office of Sustainability and Resilience](https://www.atlantaga.gov/government/mayor-s-office/executive-offices/office-of-sustainability-and-resilience)
- [Climate Resilient ATL plan](https://www.100atl.com/climate-resilient-atl) · [Office of Resilience](https://www.100atl.com/office-of-resilience)
- [Clean Energy Atlanta plan](https://www.100atl.com/cleanenergyatlanta) · [GHG Inventories](https://www.100atl.com/greenhouse-gas-inventories)
- [City releases first Climate Resilience Action Plan (Civic Innovation)](https://civicatlanta.org/blog/2026-03-01-city-of-atlanta-releases-first-climate-resilience-action-plan) · [Utility Dive](https://www.utilitydive.com/news/atlanta-climate-resilience-action-plan/746001/)
- [Atlanta Climate Action Plan — GHG targets](https://atlantaclimateactionplan.wordpress.com/ghg-emissions-and-reduction-targets/)
- [AJC — progress toward 100% clean energy goal](https://www.ajc.com/news/business/how-close-is-atlanta-to-its-100-clean-energy-goal/JPZJ3IDISRF6TDSJDMC7CNG7E4/)
- [CBEEO intro (SK Collaborative)](https://www.skcollaborative.com/2024/11/15/introduction-to-the-atlanta-commercial-building-energy-efficiency-ordinance/) · [GreenEconoME CBEEO](https://greeneconome.com/atlanta-commercial-buildings-energy-efficiency-ordinance/) · [benchmarkatl.com](https://www.benchmarkatl.com/)
- [Atlanta Better Buildings Challenge dashboard](https://www.atlantabbc.com/data-dashboard/benchmarking/)
- [DOE LEAD tool (energy burden)](https://www.energy.gov/cmei/scep/low-income-energy-affordability-data-lead-tool) · [ARC 33n energy-burden mapping](https://33n.atlantaregional.com/monday-mapday/mapping-energy-burden-in-the-metro)
- [CEJST about (archived mirror)](https://apps.bren.ucsb.edu/justice40/en/about/)
- [EPA Atlanta MSA Priority Climate Action Plan (PCAP)](https://www.epa.gov/system/files/documents/2024-03/atlanta-msa-arc-pcap.pdf)
- [EPA Proctor Creek / Urban Waters](https://www.epa.gov/urbanwaterspartners/urban-waters-and-proctor-creek-watershedatlanta-georgia) · [NASA Atlanta urban heat island](https://earthobservatory.nasa.gov/images/7205/urban-heat-island-atlanta-georgia) · [NOAA 2022 heat-mapping results](https://www.noaa.gov/media-advisory/noaa-and-partners-release-2022-urban-heat-island-mapping-results)
