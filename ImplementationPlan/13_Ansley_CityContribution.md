# 13 — Ansley Mall: City-Contribution Report (Side-B / Mayor's Office)

**Building:** Ansley Mall — 1544 Piedmont Ave NE, Atlanta, GA 30324
**Owner:** Selig Enterprises (private) · **Built:** 1964 · **Type:** single-story retail center (~215,634 ft² roof)
**Context:** Midtown / Atlanta BeltLine-adjacent (west edge adjoins the corridor)
**Prepared for:** City of Atlanta — Mayor's Office of Sustainability & Resilience (MOSR)
**Date:** 2026-06-16 · **Status of plan citations:** verified June 2026 (WebSearch); `verify` flags retained where exact figures are third-party-sourced.

> **What this is.** The owner-facing report (Side-A) shows Selig the money — payback, incentives, the cool-roof carrot. **This is Side-B: the same engine output, re-framed as a contribution ledger the City can book against its codified climate goals.** No new data pipeline — every number here is a projection/framing of the existing `buildingTotals` block in `ansley-mall.json`. The argument the City cares about (FINAL §1): *66% of Atlanta's energy use sits in privately owned commercial buildings the City cannot retrofit directly — so private retrofits like this one are how the codified targets actually get hit.*

---

## 1. Contribution Scorecard

Each retrofit outcome expressed as a **delta** against a **tracked, codified City goal**. All deltas are *modeled/illustrative* for the demo (see §6 provenance).

| Metric (this building's delta) | City target it advances | Goal owner / instrument | Contribution |
|---|---|---|---|
| **~1,665 t CO₂/yr avoided** (4.34 GWh solar × 0.3837 kg/kWh eGRID SRSO) | **59% GHG reduction by 2030; net-zero by 2050** | Climate Resilient ATL goal #2; 2019 baseline; energy = **~67%** of citywide emissions | High-leverage: energy is the dominant sector; every commercial ton is directly bookable to the citywide inventory |
| **~4.34 GWh/yr on-site solar** (3,236 kW DC: 1,836 roof + 1,400 lot-canopy) | **100% clean energy by 2035** | Clean Energy Atlanta / Climate Resilient ATL goal #1 | City is ~18% renewable (= Georgia Power mix) and does not control utility supply — **on-site generation is a lever the City can actually count** |
| **~32% of building electric load offset** (4.34 GWh of 13.43 GWh, all self-consumed) | **CBEEO: 20% commercial energy reduction by 2030** | Commercial Buildings Energy Efficiency Ordinance | Demand offset advances the commercial-sector reduction metric and the building's required annual benchmarking |
| **ENERGY STAR score before→after + EUI drop** | **CBEEO: 50% carbon cut from 2013; 20% energy by 2030** | CBEEO benchmarking (≥25,000 ft²) | Moving the building up its score *is* the program's own success metric *(before-score = `gap`; pull from CBEEO)* |
| **~2.4M gal/yr stormwater retained** (60% green roof) + ~52,000 gal first-inch event | **Citywide green-infrastructure target; first-inch (1.0″) on-site retention** | Dept. of Watershed Mgmt; Code Ch. 74 Art. X | Reduces runoff/CSO pressure; first-inch compliance is a high-status local metric |
| **Lot-tree canopy + BeltLine pollinator landscaping** (~80 lot trees per Tree Ord.) + green-roof vegetated m² | **Tree-canopy / "City in a Forest"; extreme-heat adaptation** | Tree Protection Ch. 158; Climate Resilient ATL heat goal | Adds canopy-equivalent over a 100%-impervious lot/roof; mitigates heat-island over big-box-style roofs |
| **Equity flag: BeltLine-adjacent, high-impact retrofit** | **Energy-burden reduction for the 10% most-burdened households; EJ as core principle** | Climate Resilient ATL goal #4 + equity principle | Positions a high-emissions-leverage retrofit inside the BeltLine equity corridor *(parcel-level tract join = pinned, §5)* |

*Demo-now totals are intentionally consistent with `ansley-mall.json`: ~1,665 t CO₂/yr, ~4.34 GWh/yr, ~32% load offset, ~2.4M gal/yr.*

---

## 2. Contribution to GHG & Clean-Energy Goals

**~1,665 t CO₂/yr avoided** is the headline the City can book directly to its **GHG inventory**. The 2023 inventory shows the **energy sector at ~67% of citywide emissions** (the single largest source), with the city only modestly off its 2019 baseline — so a commercial-building avoided ton is among the highest-leverage tons available, and it sits in the exact sector the City is furthest from controlling.

**~4.34 GWh/yr of on-site solar** advances **100% clean energy by 2035** (Climate Resilient ATL goal #1 / Clean Energy Atlanta). Because the City's grid supply is whatever Georgia Power provides (~18% renewable, utility-controlled), behind-the-meter generation is one of the few clean-energy levers the City can attribute to local action. All 4.34 GWh is modeled as self-consumed (load 13.43 GWh ≫ generation), so there is **no export haircut** — the full offset counts.

---

## 3. Contribution to the CBEEO Program Metric

Ansley Mall is a covered building (≥25,000 ft² commercial) and already files **annual whole-building benchmarking** with the City (ABID → ENERGY STAR score + EUI). This retrofit advances two CBEEO targets: **20% commercial energy reduction by 2030** and **50% carbon reduction from a 2013 baseline** *(targets per City CBEEO program / third-party summaries — `verify` against ordinance text)*. The ~32% load offset plus efficiency measures move the building's ENERGY STAR score upward; **that upward move is literally the program's success metric**, and the report doubles as evidence the building's benchmarking obligation is satisfied.

> The CBEEO benchmarking row is also the credible **"before"** the City already tracks. `ansley-mall.json` carries `energyStarScore = gap` — pull the CBEEO row before quoting a before→after score in a real deliverable.

---

## 4. Resilience, Stormwater & Canopy Contribution

- **Stormwater:** ~2.4M gal/yr retained (60% green-roof coverage) + ~52,000 gal of first-inch storm capture advances the citywide **green-infrastructure target** and **Ch. 74 Art. X first-inch (1.0″) on-site retention**. Material in a dense, impervious corridor where runoff loads the combined system.
- **Heat / adaptation:** Climate Resilient ATL is **adaptation-led**, naming **extreme heat, drought, and flooding** as Atlanta's three primary challenges. Green roof + cool roof + ~80 lot trees + BeltLine landscaping reduce land-surface temperature over what is today a 100%-impervious roof and lot — a direct heat-island contribution in exactly the big-box-roof condition the plan flags.
- **Canopy:** lot trees (Tree Protection Ch. 158: parking 30+ spaces → 1 tree/8 spaces, ~80 trees) plus vegetated green-roof m² add **canopy-equivalent** toward the "City in a Forest" canopy goal. *Label as canopy-equivalent — green roof is not literal tree canopy.*

---

## 5. How the City Would USE This Report

| Use | Mechanism |
|---|---|
| **CBEEO compliance + program tracking** | Building energy data rolls into the commercial-sector progress metric (20%-by-2030 / 50%-carbon); confirms annual benchmarking filed |
| **GHG inventory contribution** | Booked ~1,665 t CO₂/yr feeds the citywide inventory (energy = ~67%) |
| **District / equity prioritization** | Flags a high-leverage retrofit in the BeltLine corridor for incentive alignment, Justice40-style benefit-tracking, and Social-Bond (Series 2022A-1) eligible-project lists |
| **Council / public reporting** | A clean per-building "contribution" line drops straight into a scorecard or Council update the City otherwise compiles by hand |
| **Procurement / partnership signal** | Demonstrates private capital moving toward goals the City cannot reach by retrofitting buildings it doesn't own (FINAL §1) — supports public-private programs and incentive design |

---

## 6. Alignment with Climate Resilient ATL (2026)

Atlanta published its **first community-led Climate Resilience Action Plan — "Climate Resilient ATL" — in March 2026** (18 months, 2,100+ residents, environmental justice as a core principle). **Verified June 2026**, the plan carries **five goals**, and this single retrofit touches four of them:

| Climate Resilient ATL goal | Ansley contribution |
|---|---|
| **1. 100% clean energy by 2035** | ~4.34 GWh/yr on-site solar |
| **2. 59% GHG by 2030 / net-zero 2050** | ~1,665 t CO₂/yr avoided |
| **3. Fresh/affordable food within ½ mile by 2030** | *n/a (retail tenant mix only — not claimed)* |
| **4. Reduce energy burden for 10% most-burdened households** | BeltLine-adjacent equity framing *(tract join pinned, §7)* |
| **5. Expand multimodal transportation** | EV-charging host at lot-canopy *(co-benefit, not a primary metric)* |

The plan is **adaptation-led and engagement-framed; it does NOT publish new quantified sector targets** beyond the existing commitments. So: cite Climate Resilient ATL for **framing, equity, and adaptation**; cite the **GHG inventory (#2)** and **CBEEO (#3)** for hard numbers. Do not invent figures from the plan page.

---

## 7. GHG-Split Reconciliation Note (resolves the FINAL.md discrepancy)

Two different sector figures exist in our source docs:

- **FINAL.md §1 (older cut):** "commercial = **58% of CO₂**, **66% of energy use**." This describes the *commercial-buildings share of energy/emissions* and is the **owner-facing leverage argument** ("the City can't retrofit what it doesn't own").
- **2023 GHG Inventory (current, verified):** **energy sector ≈ 67% of citywide emissions** (search returned **67.75%**), transportation ≈ 31%; 2019 baseline.

These are **not the same denominator** — one is "commercial buildings' share," the other is "the energy sector's share of *all* citywide emissions." **For the City-facing Side-B framing, use the 2023 inventory's ~67% energy-sector figure**, because that is the number the Mayor's Office tracks against its own inventory. Retain FINAL's 58%/66% only for the owner-facing leverage narrative, and flag it as an older/different cut. **[VERIFY which vintage the team wants quoted in a final deliverable.]**

---

## 8. Demo-Now vs. Pinned-for-Later

**DEMO-NOW** (all numbers already in `ansley-mall.json` — zero new pipeline):
- The **Contribution Scorecard (§1)** and the four headline deltas (CO₂, GWh, % load, gallons).
- The **B1-lite paragraph**: *"This retrofit contributes ~1,665 t CO₂/yr and ~2.4M gal/yr retained toward Atlanta's 59%-by-2030 and stormwater goals, generates ~4.34 GWh/yr toward 100% clean energy by 2035, and offsets ~32% of building load toward the CBEEO commercial-energy goal."*
- Climate Resilient ATL **framing/alignment** (§6) and the GHG reconciliation (§7).

**PINNED-FOR-LATER** (gather now, slot in later — do NOT complicate owner eligibility logic):
- **Equity overlay join** — parcel/tract-level energy burden (DOE LEAD), heat (NOAA/Landsat LST), flood (FEMA NFHL / Proctor Creek). Strongest for the City but data-join work; CEJST removed from federal hosting Jan 2025, treat archived mirror as nice-to-have.
- **CBEEO before→after ENERGY STAR re-score** — needs an energy model; pull the current `gap` before-score from the CBEEO row first.
- **Full multi-section B1 PDF** + portfolio aggregation via CBEEO bulk CSV.

**Honest flags:** CBEEO targets (20%/50%) and **deadline (July 1 — reconciles `02`'s July 1 vs `03`'s June 1; current third-party + City sources say July 1)** are third-party-sourced — `verify` against ordinance text before quoting. Lot area (~6 ac), lot-canopy solar (1,400 kW), ~80 trees, and green-roof retention are **estimates** (`research`/`gap` provenance). Energy-burden "~50,000 households" and "~20°F hotter" are regional/illustrative context, not building metrics.

---

## 9. Sources (verified June 2026)
- [Climate Resilient ATL](https://www.100atl.com/climate-resilient-atl) · [climateresilientatl.com](https://climateresilientatl.com/)
- [City releases first Climate Resilience Action Plan (Center for Civic Innovation)](https://civicatlanta.org/blog/2026-03-01-city-of-atlanta-releases-first-climate-resilience-action-plan) · [Utility Dive](https://www.utilitydive.com/news/atlanta-climate-resilience-action-plan/746001/) · [UN: Atlanta building climate resilience](https://www.un.org/en/climatechange/atlanta-building-climate-resilience)
- [Clean Energy Atlanta — the plan](https://www.100atl.com/cleanenergyatlanta) · [Greenhouse Gas Inventories](https://www.100atl.com/greenhouse-gas-inventories) · [GHG targets](https://atlantaclimateactionplan.wordpress.com/ghg-emissions-and-reduction-targets/)
- [AJC — Atlanta toward 100% clean energy goal](https://www.ajc.com/news/business/how-close-is-atlanta-to-its-100-clean-energy-goal/JPZJ3IDISRF6TDSJDMC7CNG7E4/)
- [CBEEO deadlines (Atlanta Building Efficiency)](https://atlantabuildingefficiency.com/deadlines/) · [CBEEO overview (SK Collaborative)](https://www.skcollaborative.com/2024/11/15/introduction-to-the-atlanta-commercial-building-energy-efficiency-ordinance/) · [benchmarkatl.com](https://www.benchmarkatl.com/)
- [EPA eGRID](https://www.epa.gov/egrid) (SRSO 0.3837 kg CO₂/kWh)
- [Atlanta links resilience plan to household energy equity](https://news.sustainability-directory.com/urbanism/atlanta-links-climate-resilience-plan-to-household-energy-equity/)
