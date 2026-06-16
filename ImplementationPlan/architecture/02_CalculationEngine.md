# Architecture · 02 — Calculation & Simulation Engine (production fidelity)

> **Question:** how do we turn the seven *mocked* metrics into **real, defensible engineering calculations**, and where does AI/ML genuinely help vs. where must it stay deterministic?
> **Grounds in:** `FINAL.md §7` (the formulas + upgrade-path notes — the spec), `01_PrototypeImplementationPlan.md §3` (the JS functions we mocked), `10_AnsleyMallRetrofitSheet.md` (Google Solar API cross-check), and the sibling architecture docs `01_DataGeospatial.md` (surface/geometry inputs) + `03_PlatformServing.md` (async sim workers + content-addressed result cache + the *shared, non-forked* scoring engine).
> **Author note:** written directly (the research subagent was lost to a transient API error after its web pass). Tool/version specifics flagged **[verify]**.

---

## 0. The core idea: a fidelity ladder, not a rewrite

Every metric keeps the **same function signature** the JS engine already exposes (`estimateSolar(surface, building, ctx)` …). What changes per fidelity tier is *what `ctx` points at*: a closed-form constant today → a real simulation result tomorrow → an ML surrogate of that simulation for real-time interactivity. This is the only way the **live twin (browser, zero-network sun slider)** and the **authoritative persisted scores (server)** stay numerically identical — the non-negotiable continuity rule from `03`.

```
 TIER 0  closed-form / empirical      (FINAL §7 — where we are)        µs, in-browser
   │     PVWatts, GSMM Rv, eGRID factor, empirical roof-temp deltas
 TIER 1  authoritative engineering sims (async workers, cached)        seconds–minutes
   │     PySAM, PySWMM, EnergyPlus/OpenStudio, Cambium, RSMeans
 TIER 2  calibrated + uncertainty      (fit to CBEEO/bills; Monte Carlo) minutes
   │
 TIER 3  ML surrogates of Tier 1/2     (emulators trained on sim runs)  µs → back in the twin
         + multi-objective optimization for auto-recommendation
```

**Key architectural consequence (from `03`):** Tier-1 sims run as **async AWS Batch jobs**, results **content-addressed-cached** in S3+Postgres (same inputs → free re-read). The browser never waits on EnergyPlus; it reads a cached result or a Tier-3 surrogate.

---

## 1. Per-metric model selection

### 1.1 Solar — PVWatts → NREL **SAM / PySAM**
| | |
|---|---|
| Tier 0 (now) | **NREL PVWatts v8** — regional, fast, `ac_annual`. Already cross-checked vs. Google Solar (`10 §7`). |
| Tier 1 (real) | **NREL SAM via `PySAM`** (`pvsamv1`/`pvwattsv8` modules) — detailed losses, real module/inverter, **3D-shading** fed from our own geometry (`01`), **bifacial** gain for parking canopies (PVWatts can't), sub-array layouts. |
| Inputs | NSRDB/TMY weather (lat/lon), system design (from surface area/azimuth/tilt in `CandidateSurface`), a shading profile (ray-cast against the 3D massing). |
| Fidelity / cost | PVWatts ±10–20% regional; SAM is the industry-trusted bankable model (what HelioScope/Aurora approximate). PySAM runs in ~ms–s locally — light enough it may not even need a Batch job. |
| Integration | `solar-worker` calls PySAM; cache by `(geometry_hash, system_hash, weather_year)`. |
| Why it matters | Canopy bifacial + real inter-row shading is exactly the part of Ansley's value Google's roof-only study misses. |

### 1.2 Stormwater — GSMM formula → **EPA SWMM / PySWMM**
| | |
|---|---|
| Tier 0 (now) | `WQv = P·Rv·A/12`, `Rv = 0.05+0.009·I` (GSMM Vol. 2). Single-event, first-inch. |
| Tier 1 (real) | **EPA SWMM 5 via `PySWMM`** with **LID controls** (green roof, bioretention, permeable pavement modules) — **continuous simulation** over a real rainfall time series for *annual* retention %, not just one storm. |
| Inputs | NOAA/Atlanta rainfall time series, subcatchment = roof/lot polygons + impervious % (`01`/NLCD), LID layer specs (media depth, field capacity). |
| Fidelity / cost | SWMM is the regulatory-grade tool DWM reviewers themselves trust → directly strengthens the compliance story. Continuous runs are seconds–minutes. |
| Integration | `hydro-worker`; output both the first-inch compliance flag (gate) and the annual gallons (carrot). |

### 1.3 Building energy — empirical % → **EnergyPlus / OpenStudio** (+ EcoRoof), **URBANopt** for portfolios
| | |
|---|---|
| Tier 0 (now) | empirical % cooling-load reduction × a baseline; solar offset added. |
| Tier 1 (real) | **EnergyPlus** via the **OpenStudio SDK** (Ruby/Python bindings); the **`EcoRoof`** object models the green roof's insulation + evapotranspiration directly. **URBANopt** orchestrates EnergyPlus across a whole portfolio/district. |
| Tier 1.5 (fast alt) | **Reduced-order / grey-box RC models** (resistor-capacitor thermal networks) — minutes→milliseconds, good enough for ranking and for training surrogates. |
| Calibration | the credibility unlock: **calibrate the model to the building's actual CBEEO ENERGY STAR / EUI** (ASHRAE Guideline 14 / Bayesian calibration) so the "before" is the *real* metered building, not a generic archetype. |
| Fidelity / cost | EnergyPlus = the DOE reference engine; a single annual run is ~seconds–minutes but model *authoring* is the real cost → use archetype templates keyed by CBEEO `use_type` + vintage. |
| Integration | `energy-worker` (Batch); heaviest job → prime candidate for a Tier-3 surrogate. |

### 1.4 Heat / urban heat island — empirical deltas → **LST (measured) + surface energy balance**
| | |
|---|---|
| Tier 0 (now) | empirical roof-temp lookup (dark 140°F / cool 100°F / green 90°F). |
| Tier 1 (real) | **Measured baseline:** Landsat 8/9 (`ST_B10`) / ECOSTRESS land-surface-temperature via **Google Earth Engine**, sampled at the roof (`01`). **Delta:** an SEB (surface-energy-balance)/evapotranspiration model, or **ENVI-met** microclimate sim for site-level air-temp + pedestrian comfort. |
| Inputs | LST raster (measured "before"), albedo/SRI per surface, ET parameters for vegetated options. |
| Fidelity / cost | LST is *measured* (high credibility) but coarse (30 m). ENVI-met is heavy + finicky → keep microclimate as a Tier-2 "story" layer, lead with measured LST + literature deltas. |

### 1.5 Carbon — eGRID → NREL **Cambium** (marginal/long-run factors)
| | |
|---|---|
| Tier 0 (now) | EPA **eGRID** SRSO annual average **0.3837 kg CO₂/kWh**. |
| Tier 1 (real) | **NREL Cambium** — **long-run marginal emission rates (LRMER)** and hourly factors, the methodologically-correct basis for *avoided* emissions from new solar (average-factor overstates/understates depending on hour). Add **embodied carbon** (panels/structure) via an EC3-style database for a net-lifecycle figure, and direct sequestration for green roofs (minor, label honestly). |
| Fidelity / cost | a lookup/table join — cheap. The upgrade is *methodological honesty*, not compute. |

### 1.6 Biodiversity — proxy → habitat-suitability index (+ i-Tree)
Keep it honest (no fake species counts). Tier 1: a transparent **habitat-suitability / green-area index**, pollinator-forage scoring, and **i-Tree** for the lot-tree/canopy ecosystem-services co-benefits (stormwater + carbon + air quality from trees). Always labeled qualitative-to-semi-quantitative.

### 1.7 Cost / ROI — placeholder $/W → real cost DBs + a proper financial model
| | |
|---|---|
| Tier 0 (now) | placeholder $/W, $/ft²; payback **band** (2.5–8 yr) per `10`/`12`. |
| Tier 1 (real) | **NREL ATB** + **RSMeans** + Google "Solar Studies" model as references; a real cash-flow engine: incentive stack (30% ITC, §179D, MACRS/bonus depreciation — **OBBBA-2025 timelines** per `12`), NPV/IRR, financing (cash/loan/lease/PPA — the three tabs in the Google model), escalation, O&M. |
| Uncertainty | **Monte Carlo** over cost/rate/yield → the payback **distribution** (we already present a band; this makes it principled). |

---

## 2. Composite score & recommendation as an optimization problem

Today (`04`) the pick is a hand-run **gate→rank** table — correct at demo scale. The production "super real" version is a **constrained multi-objective optimization**: *which intervention on which surface*, subject to physics, structure, budget, and code.

**Formulation (MILP / multi-objective):**
- **Decision vars:** `x[s,i] ∈ {0,1}` — assign intervention `i` to surface `s`.
- **Objectives (Pareto, not a single weighted scalar):** maximize {CO₂↓, gallons retained, kWh saved, heat↓, NPV} — expose the **Pareto front** so an owner sees ROI-first vs. stormwater-first trade-offs (this *is* the weight-slider, done rigorously).
- **Constraints:** mutual exclusion (solar **vs.** green roof on one roof — the `04`/`recommend.js` conflict), structural load `Σ psf ≤ capacity`, budget cap, code minimums (first-inch, tree 1/8), surface eligibility gates.
- **Solver:** small instances → MILP (PuLP/OR-Tools); many surfaces/objectives → **NSGA-II** (genetic, `pymoo`) for the Pareto front.

This stays **classical optimization, not "AI"** — important to not AI-wash it (echoes `04_AIOpportunity.md`).

---

## 3. Where AI/ML genuinely helps (and where it must NOT)

| Use | Technique | Verdict |
|---|---|---|
| **Surrogate / emulator models** of slow sims (EnergyPlus, SWMM, ENVI-met) | gradient-boosted trees / small NN trained on accumulated sim runs | ✅ **the big one** — turns minutes→µs so the twin does real-time "what-if" with sim-grade accuracy |
| **Auto-calibration** of the energy model to sparse CBEEO/utility-bill data | Bayesian calibration / ML parameter fitting | ✅ makes the "before" the *real* building |
| **Gap-filling** missing building attributes (vintage, HVAC, envelope) | ML imputation from CBEEO + typology priors | ✅ enables coverage at portfolio scale |
| Picking the intervention set | multi-objective optimization | ➖ real, but classical (§2), not ML |
| **Solar yield, stormwater sizing, CO₂ factor, payback arithmetic, structural clearance** | deterministic models / PE stamp | ❌ **never an LLM/ML guess** — these are the defensible numbers; keep PVWatts/SWMM/eGRID/finance math exact |

**Rule:** ML *accelerates and calibrates* the physics; it never *replaces the authoritative number* or signs the engineering conclusion. (Consistent with `04_AIOpportunity.md`'s "where AI does NOT belong.")

---

## 4. Validation & uncertainty (the credibility layer)

- **Cross-checks:** solar vs. Google Solar API (already done, `10 §7`); energy vs. the building's metered CBEEO EUI; stormwater vs. published green-roof retention (Chicago City Hall ~75% of 1"). Every metric should have an external anchor.
- **Uncertainty as a feature:** present **ranges/bands** (Monte Carlo), never false precision — already the house style for payback. Each number carries provenance + a confidence tier (ties to `01`'s `{value, provenance}` records and `03`'s versioned results).
- **Surrogate guardrails:** a surrogate must report its error bars and **fall back to the real sim** when an input is out of training distribution.

---

## 5. Phased fidelity roadmap

| Phase | Engine state | What ships |
|---|---|---|
| **A — now (demo)** | Tier 0 closed-form + PVWatts + empirical deltas; Google Solar cross-check | the mockup numbers; defensible, fast, in-browser |
| **B — real models offline** | Tier 1 per metric as **async Batch workers**, content-addressed-cached (`03`): PySAM, PySWMM, EnergyPlus/OpenStudio; eGRID→Cambium; real cost DB | authoritative per-building numbers; twin reads cached results |
| **C — calibrated + uncertain** | Tier 2: calibrate energy to CBEEO/bills; Monte Carlo bands; LST-anchored heat | numbers tied to the *actual* building; honest ranges |
| **D — surrogates + optimization** | Tier 3: ML emulators of B/C → real-time what-if; MILP/NSGA-II auto-recommendation + Pareto front | the interactive "drag the slider, watch sim-grade metrics move" product; auto-generated optimal package |

**First real-engine move (highest leverage, lowest risk):** swap **solar to PySAM** — it's light (no Batch needed), it's the hero metric, and it immediately adds canopy-bifacial + real shading that PVWatts/Google can't. Then **stormwater to PySWMM** (regulatory credibility). EnergyPlus + surrogates are the deeper Phase-B/D lift.

---

## 6. Flags / verify
- **[verify]** current PySAM / SAM version + module names; NSRDB access terms.
- **[verify]** NREL Cambium current dataset/API access and the right LRMER vintage for GA.
- **[verify]** OpenStudio SDK + EnergyPlus version pinning and the EcoRoof object spec.
- **[verify]** ENVI-met licensing (commercial) before committing to microclimate.
- EnergyPlus model *authoring* (not run time) is the real cost — mitigate with CBEEO-keyed archetype templates.
