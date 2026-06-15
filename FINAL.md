# FINAL.md — Compiled Product Report
## In-Planted / Climate Resilient ATL · "Places & Spaces" Track 3 · Sponsor: City of Atlanta

> **Purpose:** Compile the team research (`Play with Purpose` PDF) + the regulatory chain (`ExecutiveSummary.md`) into one decision document that answers: **(1) who is the actor that will ultimately use the product, (2) what metrics make them say "wow — now I can take a solid direction with next steps," and (3) the roadmap to the actual formulas/equations behind each metric.** Validates the team's proposed content buckets against the research and flags what's missing.
> **Date:** 2026-06-15. Source docs: `Play with Purpose (1).pdf`, `projectSummary.md`, `ArchitectureCodeResearchAgents/ExecutiveSummary.md`.
> **Actor: CONFIRMED — the commercial building owner.** The product is a **visual representation model + an actionable "next-steps" report**, interconnected with the backend logic. The demo is not being built yet; this doc defines the metrics and the path to the equations that compute them (§7).

---

## 1. The Actor — CONFIRMED

**Primary actor (the user): the commercial building owner.**
The entity that owns existing downtown Atlanta building stock and controls retrofit capital. They are the one who clicks "next steps."

**Why the owner is the right hub — they are who hires everyone else.** The owner is the single decision-maker who *contracts* every other party in the value chain: structural/PE reviewers, environmental firms, law/compliance advisors, architects, and contractors. That makes the owner the natural product user, and it reframes the PDF's six personas cleanly:

> **The other five personas are the teams the owner hires.** The product's "multi-view exports" are therefore the **briefs the owner hands to each hired team** — the structural memo to the PE, the compliance dashboard to the law firm, the design palette to the architect, the GI sizing to the civil engineer. One owner-facing report, fanning out into vendor-ready packages.

**Sponsor & ultimate beneficiary: the City of Atlanta** — *not the end user.* The City interacts with, and depends on, private building owners to hit its codified goals. The product is the bridge that moves private capital toward those goals.

### Why this actor (the evidence)
- **The leverage is privately owned.** Commercial buildings are **66% of Atlanta's energy use and 58% of CO₂** — the single largest GHG source — and the City doesn't own them. To hit **59% GHG reduction by 2030 / net-zero 2050**, the City must mobilize private owners. (PDF: Background, Emissions & sector targets.)
- **Every financial incentive in the research targets a private owner**, not the City: 179D deduction, 30% ITC, Georgia Power rebates ($100K–350K/building/yr), the Conservation Tax Credit, the cool-roof exemption, tree-recompense avoidance. The cost-benefit case only "lands" for a private actor. (PDF: Environmental Policies / Incentives.)
- **The owner has the most visceral "next step."** "Retrofit Building #3 → Package B → $X capex, 7-yr payback, captures Y gallons, $140K incentive stack, here's the RFP" is a concrete action. City-level "target these blocks" is real but slower and softer.
- **The team's own instinct** ("development companies concerned with cost, time") already points here.

### The City-as-sponsor framing (use this in the pitch)
> "Atlanta has the goals (59% by 2030) and the codes (cool-roof, stormwater first-inch, tree protection) — but **66% of emissions sit in privately owned commercial buildings** the City can't retrofit directly. In-Planted makes private owners *want* to act by showing them the money: the impact, the payback, and the stacked incentives, rendered on a 3D twin of their actual building."

### The two interconnected outputs
The product is **not** a single dashboard — it's two linked surfaces over one backend engine:
1. **Visual representation model** — the 3D twin of the building/block where interventions appear in place and time-aware readouts (solar, shade, retention) update as you drag the sun. This is the "show me."
2. **Actionable next-steps report** — the "now I can take a solid direction" write-up: ranked package, impact deltas, cost/ROI, stacked incentives, feasibility, and the vendor briefs the owner hands to their hired teams. This is the "what do I do."

The visual model makes it *legible*; the report makes it *actionable*; the backend logic (data + the equations in §7) makes both *credible*.

---

## 2. The "Wow" Metrics — for the building owner / asset manager

Ranked by how directly they produce "now I can take a solid direction." Each is what the 3D twin should surface per building.

| # | Metric | What it shows | "Next step" it unlocks | Data path |
|---|--------|---------------|------------------------|-----------|
| 1 | **Simple payback / ROI per package** | Capex vs. annual savings (energy + avoided fees) | "Commission Package B — 7-yr payback" | Cost ranges (GI toolkits) + PVWatts + energy model |
| 2 | **Incentive stack $ value** | 179D + 30% ITC + Georgia Power rebate + cool-roof exemption + tree-credit avoidance | "Apply for these before year-end" | Policy appendix (already researched) |
| 3 | **Stormwater capture (gallons) + compliance status** | First-inch capture vs. Ch. 74 Art. X obligation | "Pre-empt a future stormwater fee/fine" | GI sizing (first 1.0"); DWM |
| 4 | **Energy savings (kWh/yr & $/yr)** | Cooling-load reduction from green roof + solar offset | "Cut the utility bill / hit ENERGY STAR top-25%" | NREL PVWatts + roof-temp/insulation model |
| 5 | **GHG reduction (metric tons CO₂/yr)** | ESG/reporting number; alignment with city goals | "Report it; qualify for green financing" | kWh→CO₂ + direct sequestration estimate |
| 6 | **Green Infrastructure Suitability Score (portfolio rank)** | "Top N buildings, most impact per dollar" | "Sequence projects across 1–5 years" | Composite of the above |
| 7 | **Regulatory-feasibility / permitability confidence** | Can this actually get permitted? (structural gate, cool-roof exemption) | "Low-risk — proceed to design" | Regulatory chain (`ExecutiveSummary.md`) |

**The one-line "wow":** *a ranked portfolio where each building shows payback, captured gallons, tons CO₂, and a stacked-incentive dollar figure — on a 3D twin you can explore by time of day.*

---

## 3. Validation of the Team's Four Proposed Buckets

### 3.1 "What counts as a sustainable building" — ✅ VALID, well-sourced
Concrete benchmarks exist in the research; use them as the **"bar" the product scores against**:
- **ENERGY STAR:** top 25% nationwide → ~**35% less energy and 35% fewer emissions** than peers. Metro Atlanta has **373 certified commercial/multifamily buildings, 70M+ sqft.** (Good "where do I rank?" hook.)
- **LEED Silver** mandate (Ch. 75 / Ord. 03-O-1693): new city facilities & major renovations >5,000 sqft; municipal >25,000 sqft → LEED O+M.
- **Cool-Roof SRI thresholds** (Ord. 25-O-1310): low-slope SRI ≥85 / reflectance ≥0.70; steep-slope SRI ≥20 / reflectance ≥0.21.
**Use it as:** a "sustainability rating" the product reports per building, with the retrofit shown as the path to climb it.

### 3.2 "Development companies concerned with cost, time" — ✅ VALID (framing strong, $ thin)
- The **Developers persona** is fully fleshed in the PDF: site-feasibility snapshot (required GI volume / first-inch capture, available area, recommended GI features) + 2–3 concept-design alternatives with rough financial/performance metrics.
- **Cost/time is the explicit pain point**: "retrofits are expensive, complex, and slow"; small/mid owners "navigate codes, financing, and permitting." That's the gap the product fills.
- ⚠️ **Gap:** the research never populates actual cost/payback numbers — see §5.2.

### 3.3 "Codes, laws, case studies that enable the suggestions" — ✅✅ STRONGEST AREA
Fully covered across the PDF policy appendix + the regulatory chain:
- **Codes/laws:** Cool Roof Ordinance 25-O-1310 (green roofs **exempt** → compliant path for a mandatory re-roof obligation); Tree Protection Ch. 158 ($140/DBH-inch, permit for any tree ≥6" DBH, registered tree pro per §158-33, parking lots 30+ spaces → 1 tree/8 spaces); Stormwater Ch. 74 Art. X (capture first **1.0"** on-site via GI); Sustainable Development Ch. 75 (LEED).
- **Case studies (proof it gets permitted):** Atlanta City Hall green roof (58 psf added vs. 186 psf capacity → **no reinforcement**), Chicago City Hall (75% of 1" retained; cantilever-over-columns trick), Ponce City Market (lightweight media), Kendeda Building, Historic Fourth Ward Park (green infra accepted as gray-infra substitute).
**Use it as:** the **"feasibility/permitability" layer** (metric #7) that de-risks the owner's decision. Full detail in `ExecutiveSummary.md`.

### 3.4 "Environmental sustainability stats" — ✅ VALID but UNEVEN
See §4 for the strong-vs-thin breakdown. All six themes are present; flooding and green space are well quantified, the rest need work.

---

## 4. Environmental Stats Inventory (flood / heat / green / carbon / energy / biodiversity)

| Theme | Strength | Best numbers in the research | Gap to close |
|---|---|---|---|
| **Flooding / stormwater** | 🟢 Strong | 1" rain = **640M gal** runoff citywide · GI plan target **225M gal/yr** · 4,800 GI projects → **950M gal/yr** reduced · green roofs retain **50–80%** (Chicago 75% of 1") · funding gap **$6 vs. $85/capita/yr** | Per-roof gallons (GI sizing) |
| **Green space / canopy** | 🟢 Strong | **50% canopy goal** (~45% actual) · **10 acres/1,000 residents** goal · "City in a Forest" | Per-project canopy/credit contribution |
| **Carbon** | 🟡 City-level only | Commercial = **58% of CO₂** · **59% GHG cut by 2030 / net-zero 2050 / 100% clean energy 2035** | Building-level tons CO₂/yr (kWh→CO₂ + sequestration) |
| **Energy efficiency** | 🟡 Has a benchmark, no model | ENERGY STAR = **35% less energy** · *"reduce cooling costs by **X%**"* ← **placeholder, must fill** | Real kWh/$ savings per intervention |
| **Heat** | 🟠 Illustrative only | Parking lot **120–150°F** vs. park **85°F** · black roof **140°F** vs. green roof **90°F** | Real land-surface-temp data (Google Earth LST layer) |
| **Biodiversity** | 🔴 Qualitative only | Pollinators / native plants / habitat (no metric) | Hard to quantify — **be honest**; consider a simple "pollinator habitat m² added" proxy |

---

## 5. What's Missing — 100% Consider Adding

### 5.1 Promote the financial incentive stack to a headline deliverable
Currently buried in the PDF appendix. For the owner, **this IS the "wow."** Surface per building:
- **Federal:** §179D (commercial energy-efficiency deduction); **30% ITC** for solar PV / geothermal / storage (locked through **2032**); §45L (residential).
- **State/utility:** Georgia Power Commercial Energy Efficiency rebates **$100K–$350K/building/yr**; **Georgia Conservation Tax Credit** = 25% of FMV of donated land/easement, **capped $500K** for corporations.
- **City:** Cool-roof exemption (avoided re-roof compliance cost); tree-recompense avoidance + 1.25× planting credit; Series **2022A-1 Social Bonds** (equitable-infrastructure financing).

### 5.2 Populate actual cost / payback numbers ← biggest gap
The research references "$/sqft," "cost per gallon," "payback" but never fills them. This is the line between "interesting demo" and "I can take a solid direction." Even ballpark ranges (green roof $/sqft, solar $/W via PVWatts, cistern $/gal, GI $/gal captured from EPA/Chattahoochee toolkits) close it. **Recommend a "cost & ROI" engine even if rough.**

### 5.3 Elevate the equity / environmental-justice overlay from "optional" to a feature
For a **City of Atlanta** sponsor this is near-mandatory: West-Atlanta flooding (decades of damage in predominantly Black neighborhoods), the top-10%-energy-burden goal, and Climate Resilient ATL being **community-led (2,100+ residents)**. An equity view ("these high-impact roofs are also in high-flood / high-heat-burden blocks") is the City's "wow."

### 5.4 Output building-level deltas, not just city-level context
City stats are *context*; the twin needs *"this roof → X gal / Y kWh / Z tons."* Bridge with NREL PVWatts (solar), GI sizing (gallons), and an energy/roof-temp model (kWh→CO₂).

### 5.5 Explicitly scope OUT transportation / walkability
Present in the research (31% of emissions, the cross-highway green-bridge idea) but **not a building-retrofit feature.** State it as out-of-scope (or "future") so it doesn't dilute the pitch.

### 5.6 Add a "regulatory-feasibility" confidence layer
The regulatory chain already proves these retrofits get permitted (the structural gate + cool-roof exemption). Expose it as metric #7 so the owner sees **low permitting risk** — directly answering their "time" concern.

---

## 6. Recommended Product Output — the Score, Expanded

The team's **Green Infrastructure Suitability Score** (Heat Reduction · Stormwater Retention · Energy Savings · Carbon · Biodiversity) is a good core. To make it *actionable for the actor*, add two non-environmental axes:

```
Green Infrastructure Suitability Score  =
   Environmental impact  (heat ↓, gallons captured, kWh saved, tons CO₂, habitat)
 + Cost / ROI            (capex, payback, stacked incentive $)        ← ADD
 + Regulatory feasibility(permitability, cool-roof exemption, gate risk) ← ADD
```

This turns a purely environmental score into a **"should I do this, and what's my next step"** score — which is exactly what makes the owner say "wow."

**Suggested per-building report (the hero artifact):**
1. Building snapshot + current sustainability rating (ENERGY STAR percentile / cool-roof status).
2. Recommended package(s) on the 3D twin (solar / green roof / cistern / lattice), time-aware.
3. Impact deltas: gallons, kWh, tons CO₂, °F roof-temp drop, habitat m².
4. Cost & ROI: capex, payback, **stacked incentive dollar figure.**
5. Feasibility: permitability + which code obligations it satisfies/pre-empts.
6. Next step: RFP starter / incentive application checklist.

---

## 7. Metrics → Formulas, Equations & Where to Find Them

The important metrics, and the **next step to find the real formula/coefficients** for each. Scope is deliberately left open — this is the research path, not a build commitment. Equations are shown in their standard form; **every coefficient flagged "verify" must be pulled from the cited authoritative source before it's defensible.**

### 7.1 Solar potential → energy yield (kWh/yr)
- **Use the model that already exists — don't build one:** **NREL PVWatts API** (`developer.nrel.gov`, free key). It internally handles irradiance, tilt, azimuth, losses.
- **Roof → system size:** `kW_DC ≈ usable_roof_area(m²) × ~0.15–0.20 kW/m² × packing_factor(~0.7)` *(verify module power density + packing for the chosen panel).*
- **Yield:** PVWatts returns monthly/annual `kWh`. Conceptually `kWh/yr = kW_DC × specific_yield(kWh/kW/yr for Atlanta) × performance_ratio`.
- **Inputs needed:** roof centroid lat/long, usable area, tilt, azimuth.
- **Next step:** get a PVWatts key; feed roof polygons (Microsoft US Building Footprints / COA GIS).

### 7.2 Stormwater retention → gallons captured + first-inch compliance
- **Regulatory target:** capture the first **1.0"** on-site (Ch. 74 Art. X) — *verify Atlanta's coefficient vs. the GSMM's historic 1.2" WQv basis.*
- **Water-quality volume:** `WQv (ft³) = (P × Rv × A) / 12`, where `P` = rainfall depth (in), `A` = drainage area (ft²), and `Rv = 0.05 + 0.009 × I` (`I` = % impervious). *Confirm `Rv` form in **GSMM Vol. 2**.*
- **Green-roof retention:** single-storm retained ≈ media storage capacity (`area × media_depth × field-capacity retention fraction`); annual ≈ `area × annual_rainfall × retention_rate (50–80%)`.
- **Unit:** `1 ft³ = 7.48 gal`.
- **Next step:** GSMM Vol. 2 (sizing + `Rv`); confirm the first-inch applicability sf threshold with **DWM** at parcel stage.

### 7.3 Heat reduction → roof-surface / ambient temp drop (°F)
- **Don't model from first principles for a hackathon — use measured data + empirical deltas.**
- **Data:** land-surface temperature (LST) from **Landsat 8/9 or MODIS via Google Earth Engine** (the "Land Surface Temperature" layer your team already flagged); sample the roof's pixels.
- **Intervention effect:** use literature/empirical deltas (e.g., green roof ~90°F vs. black ~140°F; cool roof per SRI). A physically rigorous path is the **energy-balance / evapotranspiration** model (complex — defer).
- **Next step:** pull an LST raster for downtown; overlay building footprints; attach an empirical "post-retrofit" delta per intervention type.

### 7.4 Energy efficiency → cooling-load / kWh & $ saved
- **Mechanism:** green roof adds insulation (raises roof R-value) + evapotranspiration cooling → lower cooling load.
- **Simplified heat-transfer:** `Q_roof = U × A × ΔT`; saving ≈ `(U_before − U_after) × A × cooling_degree_hours / COP`. *(Get `U`-values + Atlanta cooling-degree-hours; `COP` of typical commercial HVAC.)*
- **Pragmatic alternative:** apply empirical % cooling-energy reductions from literature, or benchmark via **ENERGY STAR Portfolio Manager** (top-25% = 35% less energy). For rigor: **DOE EnergyPlus "EcoRoof"** module.
- **Cost link:** `$ saved = kWh saved × Georgia Power $/kWh tariff` *(pull current commercial rate).*
- **Next step:** choose empirical-% vs. EnergyPlus; gather `U`-values + Atlanta CDH + utility rate.

### 7.5 Carbon reduction → metric tons CO₂/yr
- **Operational (dominant):** `CO₂ avoided = (kWh saved + kWh solar generated) × grid emission factor`. *Pull Georgia's factor from **EPA eGRID** (SERC/Southern subregion, ~0.4 kg CO₂/kWh — verify current eGRID).*
- **Direct sequestration (small):** `≈ vegetated_area × sequestration_rate (kg C/m²/yr)` from green-roof literature — flag that it's minor vs. operational.
- **Next step:** EPA eGRID for the GA factor; literature value for sequestration; sum the two.

### 7.6 Biodiversity → habitat proxy (no clean equation)
- **No standard formula.** Use a transparent proxy: `vegetated habitat area (m²) + native/pollinator species count`, or a simple weighted habitat-suitability index.
- **Next step:** define the proxy explicitly and label it qualitative — don't overclaim. (Weakest metric in the research; honesty reads as credible.)

### 7.7 Cost / ROI → capex, payback, incentive-adjusted return
- **Capex:** `Σ (intervention_area × unit_cost)` — green roof `$/sqft`, solar `$/W`, cistern `$/gal`. *(Pull ranges from **EPA GI cost data**, **Chattahoochee Riverkeeper** Atlanta case study, **NREL** solar benchmarks, or RSMeans.)*
- **Annual savings:** `energy_$ + avoided_stormwater_fees + avoided_tree_recompense`.
- **Incentive-adjusted capex:** `capex − (§179D + 30% ITC + Georgia Power rebate + Conservation Tax Credit + cool-roof-exemption value)`.
- **Simple payback (yrs):** `(capex − incentives) / annual_savings`. (NPV/IRR optional.)
- **Next step:** assemble unit-cost ranges + Georgia Power tariff; the incentive values are already researched (§5.1).

### 7.8 Composite Green Infrastructure Suitability Score
- **Form:** normalize each sub-metric to 0–1, then `Score = Σ (wᵢ × normalized_metricᵢ)` across environmental + cost/ROI + feasibility axes (§6).
- **Next step:** decide the weights (consider exposing them as **user-adjustable sliders** so the owner can prioritize, e.g., ROI-first vs. stormwater-first).

---

## 8. Open Questions for the Team (deferred — not blocking)
- **Weighting of the composite score** — fixed weights vs. user sliders (§7.8).
- **Energy model fidelity** — empirical-% vs. EnergyPlus (§7.4).
- **Equity overlay** — surfaced in the report or roadmap (strong for the City sponsor; §5.3).
- **Single building vs. portfolio** — the report supports both; which leads the narrative.

---

## Appendix — Source Map
- **City goals & gaps, stakeholder personas, data sources:** `Play with Purpose (1).pdf` (Background → Possible data sources).
- **Codes, incentives, "sustainable building" definitions:** `Play with Purpose (1).pdf` (Environmental Policies appendix).
- **Regulatory feasibility, gates/carrots, case studies:** `ArchitectureCodeResearchAgents/ExecutiveSummary.md` (+ the three agent reports).
- **Product concept & prototype:** `projectSummary.md`.
- **Key data endpoints to wire:** COA GIS Open Data Hub · ARC Open Data · Microsoft US Building Footprints · USGS NLCD impervious · **NREL PVWatts API** (solar kWh) · DWM GI pages · Chattahoochee Riverkeeper GI case study · EPA GI toolkits.
