# Implementation Plan — In-Planted / Climate Resilient ATL

> **Core thesis:** *We help companies transform sustainability ideas into city-ready proposals.*
>
> The company is the user. They arrive with vague intent ("we should green our building"); they leave with a **proposal that is ready to submit** — to the City, to the agencies that permit it, and to the vendors who build it. The 3D twin makes the idea *legible*; the exported report makes it *city-ready*; the engine + data make both *credible*.

> Generated 2026-06-16 from the research base (`projectSummary.md`, `FINAL.md`, `ArchitectureCodeResearchAgents/ExecutiveSummary.md`) and the latest team doc `Play with Purpose (4).pdf` + the scratch-paper vision. Purpose: jump-start prototype development and define the report "export" that drives real-world next steps.

## The three documents

| # | Doc | Answers | Owner-ish |
|---|-----|---------|-----------|
| 01 | [Prototype Implementation Plan](01_PrototypeImplementationPlan.md) | How do we turn the existing hard-coded Three.js/React twin into a data-driven engine, in phases, buildable in days? | Engineering |
| 02 | [Data Acquisition Plan](02_DataAcquisitionPlan.md) | Which exact datasets/APIs do we pull, and which specific Atlanta building is the demo? | Data |
| 03 | [Report & Export Spec](03_ReportExportSpec.md) | How is the exported report structured so the owner can act on it in the real world? | Product |
| 04 | [Selection Logic](04_SelectionLogic.md) | How do interventions get picked & placed — surface → gate → rank → sized geometry? | Engineering |
| 05 | [Single-Owner Portfolio](05_SingleOwnerPortfolio.md) | Which ONE entity + building set anchors the demo (flow step 1)? → Georgia State University | Data/Pitch |
| 06 | [Geospatial Data Pipeline](06_GeospatialDataPipeline.md) | How do we turn addresses into roof geometry efficiently (Google Solar API, Places, footprints)? | Data |
| 07 | [Mayor's Office Data](07_MayorsOfficeData.md) | Side-B: current-state "before" + the city-goal-contribution data (pinned) | Product/Pitch |
| 08 | [Ansley Mall Deep Dive](08_AnsleyMallDeepDive.md) | Is the one-mall demo worth it, what fits on the roof+lot, codes triggered? → Yes | Data/Pitch |
| 09 | [Google Earth Capture Guide](09_GoogleEarthCaptureGuide.md) | Exactly what to grab in Google Earth to run the manual pipeline | Data |
| 10 | [Ansley Mall Retrofit Sheet](10_AnsleyMallRetrofitSheet.md) | The by-hand pipeline run on Ansley + Google Solar API cross-check | Data |
| 11 | [Ansley — Codes](11_Ansley_Codes.md) | Proposal pillar 1: Atlanta codes the retrofit follows (gate/carrot) | Pitch |
| 12 | [Ansley — Tax Benefits](12_Ansley_TaxBenefits.md) | Proposal pillar 2: incentive stack + payback band (OBBBA-updated) | Pitch |
| 13 | [Ansley — City Contribution](13_Ansley_CityContribution.md) | Proposal pillar 3: Side-B Mayor's-Office goal contribution | Pitch |

> **Interactive mockup:** `src/AnsleyApp.jsx` (run `npm run dev`) — monochrome architectural twin of Ansley Mall with sun-path, layer toggles, live readouts, and a "City-Ready Proposal" panel. Data from `src/data/buildings/ansley-mall.json`. The old Lot 0427 demo is preserved in `src/App.jsx`.

> **Backend technology spec:** [`spec-driven/backend-architecture/spec.md`](../spec-driven/backend-architecture/spec.md) — Python offline pipeline → committed JSON → shared JS engine → print-PDF; demo-now/architect-for-later.

## How they connect

```
02 Data  ──feeds──▶  01 Engine (scoring per surface×intervention)  ──feeds──▶  3D twin (show me)
                                   │
                                   └──feeds──▶  03 Report export (now I can act)  ──fans out──▶  vendor/agency briefs + City contribution report
```

The **report export (03) is the "city-ready proposal"** — the artifact at the center of the scratch-paper "two-sided ledger." It is what *gives the company* its incentive/cost case (Side A) and what *provides the Mayor's Office* its goal-contribution view (Side B), packaged so it can actually be submitted. Today commercial owners assemble that write-up by hand; the product generates it = the "gateway."

## New since `FINAL.md` was written (from `Play with Purpose (4).pdf`)

- **CBEEO dataset** (pp. 52–55) — real building-level data + a ready-made demo target list. Now anchors Doc 02. (~2,350 covered Atlanta buildings w/ address, sqft, ENERGY STAR score.)
- **ENERGY STAR scoring mechanics** (pp. 50–51) — feeds the "current rating" in the report.
- **Two-sided Business Ledger** (p. 5) + scratch paper — formalized as the report's Side A / Side B in Doc 03.
- **Pitch-deck guide w/ judging weights** (pp. 73–78) — Value+Innovation 45%, Impact 30%; the demo's hero metric (data-driven solar) targets these.

## Actor — RESOLVED by the thesis

The user is the **company** (commercial building owner / asset manager). The new doc's user-journey pages (pp. 56–70) also describe a **City Sustainability Planner**; that role is the *recipient* of the proposal, not the user of the tool. The thesis settles the lead: the company turns an idea into a **city-ready proposal**, and the City planner is who that proposal is made ready *for* (surfaced as the Side-B contribution report). Every incentive in the research targets the company, and the company is the one who clicks "next step" — so the demo narrative and the hero report lead with the company. (Consistent with `FINAL.md §1`.)

## Suggested order of operations

1. **Pick the demo building** (actor is settled — see above). Doc 02 recommends 100 Peachtree St NW / Fairlie-Poplar, with a large-floorplate mid-rise as the impact-max alternate.
2. **Engineering Phase 0 + 1** (Doc 01): refactor `App.jsx` into modules, then make **solar-via-PVWatts** the one visibly data-driven hero metric end-to-end.
3. **In parallel, pull the demo building's data** (Doc 02 checklist) so the engine has real inputs.
4. **Stand up the minimum-viable export** (Doc 03): master one-pager + incentive checklist + structural-memo stub from one JSON.
