# Production Architecture — Overview, Journey Review & Development Kickoff

> **What this folder is:** the "architect-for-later" research — if In-Planted is to become a *real* product with *actual calculations* (not the mocked demo), what architectures support it and where does AI genuinely help. Four deep-dives + this synthesis.
> **Read order:** this overview → [01 Data/Geospatial](01_DataGeospatial.md) · [02 Calculation Engine](02_CalculationEngine.md) · [03 Platform/Serving](03_PlatformServing.md) · [04 AI Opportunity](04_AIOpportunity.md).

---

## 1. Where we've been (the journey so far)

| Stage | Artifact | What it established |
|---|---|---|
| Concept | `projectSummary.md`, `FINAL.md` | The actor (commercial owner), the seven metrics, the §7 formulas, the thesis: **companies → city-ready proposals** |
| Regulatory research | `ArchitectureCodeResearchAgents/ExecutiveSummary.md` | Codes/incentives/gates as a real, citable chain |
| Demo-now spec | `spec-driven/backend-architecture/spec.md` | Decided: **Python offline pipeline → committed JSON → shared JS engine → print-PDF**, $0 infra |
| Selection logic | `ImplementationPlan/04` | **surface → gate → rank → sized geometry** (not an optimizer at demo scale) |
| Real worked example | `ImplementationPlan/05–10` | Single private owner (**Selig / Ansley Mall**), a by-hand pipeline, **validated against Google's Solar API** |
| Visual + proposal | `src/AnsleyApp.jsx`, `ImplementationPlan/11–13` | An aesthetic monochrome twin + the 3-pillar written proposal (codes / tax / city contribution) |

**Everything to date is intentionally mocked/offline.** This folder is the other end of the telescope: the production system that makes the numbers real.

---

## 2. The production architecture in one picture

```
                    ┌───────────────────────────── AI LAYER (04) ─────────────────────────────┐
                    │  Codes/Incentives RAG (currency) · Grounded report gen (Claude Citations) │
                    │  Parking-lot CV · ML surrogates of slow sims · agentic what-if            │
                    └──────────────▲───────────────────────────────────────▲───────────────────┘
                                   │ (accelerate/calibrate, never replace)  │ (draft, never compute)
 DATA/GEO (01)            CALC ENGINE (02)                 PLATFORM/SERVING (03)
 ┌───────────────┐        ┌──────────────────┐            ┌──────────────────────────────┐
 │ 3DEP LiDAR    │        │ Tier0 closed-form │            │ Modular monolith API +        │
 │ +roof seg     │        │ Tier1 PySAM/SWMM/ │            │ async compute plane:          │
 │ +parking CV   │──surf─▶│  EnergyPlus/Cambium│──scores──▶│ SQS→AWS Batch workers,        │
 │ PostGIS / COG │        │ Tier2 calibrate+MC │            │ Step Functions, S3 result     │
 │ STAC / GEE    │        │ Tier3 ML surrogates│            │ content-addressed cache       │
 │ provenance{}  │        │ +MILP/NSGA-II opt  │            │ Aurora+PostGIS, Cognito, CDK  │
 └───────────────┘        └──────────────────┘            └───────────────┬──────────────┘
        the SAME JS scoring engine runs in the browser (live twin) AND server-side (authoritative)
                                                                          │ glTF/3D Tiles via CloudFront
                                                                          ▼
                                                         React + Three.js twin (sun-path = client-side, zero-network)
```

---

## 3. What the four docs agree on (the load-bearing decisions)

1. **Never fork the scoring engine.** The same pure-JS metric modules run in the browser (live, zero-network sun slider) *and* server-side (authoritative persisted scores). If these diverge, the twin and the report stop agreeing — this is the single most important production invariant. *(02, 03)*
2. **Provenance on every number** — a `{value, provenance{source, method, date, tier}}` record end-to-end. It's already our house rule; production just makes it structural. *(01, 02, 04)*
3. **Heavy sims run async + cached.** EnergyPlus/SWMM/SAM as AWS Batch jobs, content-addressed in S3 (same inputs → free re-read). The browser reads a cached result or an ML surrogate — never waits on a simulation. *(02, 03)*
4. **AI accelerates and calibrates; it never produces the defensible number or signs the conclusion.** Solar yield (PVWatts/SAM), stormwater (SWMM), CO₂ (eGRID/Cambium), payback math, and structural clearance stay deterministic / PE-stamped. *(02, 04)*
5. **Build the moats, buy the commodities.** Buy PVWatts/SAM, Cesium tiling, roof-solar (Google/HelioScope). **Build** the two things nobody sells and that make us portable + differentiated: **parking-lot CV** (Google Solar is rooftop-only) and the **codes/incentives RAG** (the expensive-to-maintain, least-portable layer). *(01, 04)*

---

## 4. Where AI helps — the consensus ranking

| Rank | AI play | Why it's high-leverage | Build-vs-buy |
|---|---|---|---|
| 1 | **Codes & incentives RAG** (per-city, kept current; Claude + Citations API) | The expensive, least-portable layer; OBBBA-2025 proved currency must be automated; it's *how the product generalizes to any city* | Build |
| 2 | **Grounded report generation** (Claude drafts the proposal from engine JSON, every claim cited) | Directly produces the "city-ready proposal"; provenance for free; numbers stay templated/deterministic | Build |
| 3 | **ML surrogates of slow sims** | Turns EnergyPlus/SWMM minutes → µs so the twin does sim-grade real-time what-if | Build (needs real sims first) |
| 4 | **Parking-lot perception CV** | Sizes the canopy intervention Google's API can't see | Build (watch for a Google update) |
| — | **NOT AI:** solar/stormwater/carbon/payback/structural | deterministic = defensible | keep exact |

---

## 5. How to begin development (prioritized kickoff)

Each architecture doc named its highest-leverage, lowest-risk first move. Sequenced, that *is* the development plan — and it splits cleanly into two tracks you can run in parallel.

### Track A — make the demo's numbers real (product value)
1. **Promote solar to NREL PySAM** (`02`). Light enough to need no new infra; immediately adds canopy-bifacial + real shading that PVWatts/Google can't. Hero metric becomes bankable. *(first real-engine move)*
2. **Add the `{value, provenance}` record + switch the pipeline to DuckDB/GeoParquet** (`01`). Makes "every number defensible" structural, zero new infra.
3. **Stormwater → PySWMM** (`02`) for regulatory-grade, DWM-trusted retention numbers.

### Track B — the AI moats (differentiation + portability)
4. **Grounded one-pager report generation** (`04` G1) — Claude drafts the owner proposal from the existing Ansley JSON, Citations API grounding every claim. Rides on artifacts we already have.
5. **R1-lite codes/incentives RAG** over the Ansley regulatory corpus (`04`) — the seed of the any-city engine.

### Track C — stand up the platform (only when multi-building/persistence is needed)
6. Per `03`: **ALKS account + CDK + CI/CD spine → Aurora+PostGIS (tenant_id/RLS) → API Gateway + the monolith running the shared JS engine server-side → Cognito + Secrets → PVWatts as a cached Lambda.** Defer EnergyPlus/SWMM workers, 3D tiling, and async PDF to the following phase.

> **The single first commit if you do nothing else:** swap solar to **PySAM** (Track A #1) — it's the smallest change that converts the hero metric from "mock" to "real engineering," with no infra and an immediate, visible payoff in the twin.

### Build-later (named so they're not forgotten)
EnergyPlus + calibration to CBEEO actuals · ML surrogates · MILP/NSGA-II multi-objective optimization (replaces the hand-run gate→rank at scale) · parking-lot CV · 3D-Tiles city-scale serving · microclimate heat.

---

## 6. Open / verify (carried from the four docs)
- Google Maps/Solar **ToS caching limit (~30 days)** vs. "store forever" → use as transient seed, persist NREL/USGS/Fulton-derived values *(01)*.
- **CAI Snowflake geospatial entitlements**, Cesium ion + post-free-cap Google pricing *(01, 03)* — unverified.
- PySAM / Cambium / OpenStudio version + access specifics *(02)* — verify before building Track A.
- A potential **Google Earth parking-lot feature** could flip parking-lot CV from build→buy *(04)* — watch.
- OBBBA-2025 federal incentive timelines (ITC begin-construction by Jul 4 2026; §179D ends Jun 30 2026) make the **codes/incentives RAG** time-sensitive *(04, 12)*.
