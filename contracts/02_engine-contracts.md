# 02 — Engine Contracts (Calculation-Engine & Worker I/O)

> **Owns:** the per-metric **worker I/O** types, the engine `ctx`, `runEngine`, `evalTimeDependent`, and the worker↔engine flow. This is the **calc-engine half of the living handshake**.
>
> **Status: LIVING.** Builds on [`HANDSHAKE.md`](HANDSHAKE.md) §3.6 (`Score`, `BuildingTotals`, `EngineResult`), §3.7 (`WorkerResult`, `SolarResult`), §1 conventions. It **expresses and extends** the spine — it never redefines a canonical field with a different name or unit. Where a worker needs a shape the spine doesn't yet carry, it is gathered under [§8 Proposed contract changes](#8-proposed-contract-changes) rather than diverging silently.
>
> **Grounded in:** [`architecture/02_CalculationEngine.md`](../ImplementationPlan/architecture/02_CalculationEngine.md) (the real models + the fidelity ladder), [`architecture/03_PlatformServing.md`](../ImplementationPlan/architecture/03_PlatformServing.md) §4 (content-addressed cache, tiered fidelity), and [`ImplementationPlan/01_PrototypeImplementationPlan.md`](../ImplementationPlan/01_PrototypeImplementationPlan.md) §3 (the mocked JS metric functions + composite + recommend).
>
> **Reality check:** Only the **solar** worker is real today (PySAM, per arch/02 §5 "first real-engine move"). Every other worker type below is marked **`[PLANNED]`** — its TS interface is the agreed *target* shape, and until the worker ships the JS engine computes that metric inline from the Tier-0 closed-form in Doc 01 §3.

---

## 0. Mental model

```
 Python calc workers                JS scoring engine                     consumers
 ───────────────────                ─────────────────                     ─────────
 solar_pysam   ─▶ SolarResult ┐
 hydro_pyswmm  ─▶ HydroResult ┤
 energy_eplus  ─▶ EnergyResult┤    runEngine(building, ctx)               twin (3D)
 heat_gee_lst  ─▶ HeatResult  ├──▶  ├─ surfaceScores: Score[]   ──▶  report gen
 carbon_factor ─▶ CarbonResult┤    ├─ ranked: Score[]                    portfolio
 biodiv_hsi    ─▶ BiodivResult┤    └─ buildingTotals
 cost_finance  ─▶ CostResult  ┘    evalTimeDependent(b, results, t) ─▶ sun slider (live)
        │                                  ▲
        └── WorkerResult<T> ── inputHash ──┘ ctx.workers cache (content-addressed)
```

Two laws inherited from the spine (HANDSHAKE §1, arch/02 §0):

1. **Same signature across the fidelity ladder.** Each metric keeps one function shape; what changes per tier is *what `ctx` points at* — a closed-form constant (Tier 0), a cached `WorkerResult` (Tier 1), or an ML surrogate of it (Tier 3). This is the only reason the browser twin and the server scores stay numerically identical.
2. **Determinism.** Same inputs + same `engineVersion` ⇒ byte-identical `EngineResult`. The engine performs **no I/O** — every external number arrives pre-resolved in `ctx`.

### Units & wrapping (HANDSHAKE §1, restated)

- Units live in the field name (`acAnnualKwh`, `co2AvoidedTonsYr`, `galYr`, `roofTempF`, `capexUsd`, `paybackYears`). A bare number without a unit suffix is a bug.
- **`WorkerResult<T>` fields are "engineering payload" — they are *plain numbers*, not `ProvenancedValue`.** Provenance for the whole worker run lives once on `WorkerResult.provenance` (the run is one provenance event). When a worker number is lifted into a `Building`/`Score`/report field that the spine types as `ProvenancedValue`, the engine wraps it, copying `WorkerResult.provenance` and stamping `tier`. This keeps the worker payload lean and the domain layer provenanced.
- `null` + `provenance.tier = "gap"` for unknowns. Never fabricate.

---

## 1. Per-metric worker contract

Each metric defines an **input type** (`XxxInput`), an **output type** (`XxxResult`), the **model** that produces it (arch/02 §1), the **`WorkerResult<T>` wrapper** the Python worker returns, and which **fidelity tier** it represents today.

`WorkerResult<T>` (canonical, HANDSHAKE §3.7) wraps *every* result below:

```ts
interface WorkerResult<TResult> {
  worker: string;          // e.g. "solar_pysam", "hydro_pyswmm"
  workerVersion: string;   // pinned model/lib version — part of determinism (§5)
  inputHash: string;       // content-addressed cache key over normalized inputs (arch/03 §4)
  result: TResult;         // one of the XxxResult types below
  provenance: Provenance;  // tier ∈ measured|fetched|modeled|default|gap
  warnings?: string[];
  computedAt: string;      // ISO 8601
}
```

A shared input preamble all workers receive (so caching can hash a stable, normalized object):

```ts
interface WorkerInputCommon {
  buildingId: string;
  surfaceId: string;          // the surface this run is for
  location: GeoPoint;         // WGS84, drives weather/grid/LST lookups
  fidelityTier: 0 | 1 | 2 | 3;// requested tier (arch/02 §0 ladder)
  weatherYear?: number;       // NSRDB/TMY or rainfall series vintage; part of inputHash
}
```

### Summary table

| Metric | Worker name | Model (arch/02) | Result type | Status | Tier today |
|---|---|---|---|---|---|
| Solar | `solar_pysam` | NREL SAM via **PySAM** (`pvsamv1`/`pvwattsv8`) | **`SolarResult`** (canonical, §3.7) | **REAL** | 1 |
| Stormwater | `hydro_pyswmm` | EPA SWMM 5 via **PySWMM** + LID controls | `HydroResult` | `[PLANNED]` | 0 inline |
| Energy | `energy_eplus` | **EnergyPlus / OpenStudio** (+ `EcoRoof`) | `EnergyResult` | `[PLANNED]` | 0 inline |
| Heat | `heat_gee_lst` | **GEE** Landsat/ECOSTRESS LST + SEB delta | `HeatResult` | `[PLANNED]` | 0 inline |
| Carbon | `carbon_factor` | EPA **eGRID** → NREL **Cambium** LRMER | `CarbonResult` | `[PLANNED]` | 0 inline |
| Biodiversity | `biodiv_hsi` | Habitat-suitability index (+ i-Tree) | `BiodiversityResult` | `[PLANNED]` | 0 inline |
| Cost / ROI | `cost_finance` | **RSMeans/ATB** + cash-flow (ITC/§179D/MACRS) | `CostResult` | `[PLANNED]` | 0 inline |

---

### 1.1 Solar — `solar_pysam` · **REAL** (Tier 1)

`SolarResult` is **already canonical** in HANDSHAKE §3.7 — *reference it, do not redefine.* Reproduced here for convenience only:

```ts
// CANONICAL — defined in HANDSHAKE §3.7. Edits happen THERE, not here.
interface SolarResult {
  surfaceId: string;
  systemCapacityKwDc: number;
  acAnnualKwh: number;
  acMonthlyKwh: number[];   // length 12
  capacityFactor: number;
  co2AvoidedTonsYr: number; // acAnnualKwh × grid factor (eGRID/Cambium)
  assumptions: {
    tiltDeg: number; azimuthDeg: number; lossesPct: number;
    arrayType: number; moduleType: number; gridFactorKgPerKwh: number;
  };
}
```

Input (extends the common preamble):

```ts
interface SolarInput extends WorkerInputCommon {
  systemCapacityKwDc: number;     // = usableAreaM2 × modulePowerDensityKwPerM2 × packingFactor
  orientation: Orientation;       // azimuthDeg (180 = south), tiltDeg
  lossesPct: number;              // PVWatts/SAM system losses (default 14)
  arrayType: number;              // 0 fixed-open, 1 fixed-roof, 2 1-axis…
  moduleType: number;             // 0 standard, 1 premium, 2 thin-film
  bifacial?: boolean;             // [PLANNED] canopy bifacial gain — SAM only, PVWatts can't
  shadingProfile?: number[];      // [PLANNED] ray-cast hourly/monthly shade from 3D massing (arch/01)
}
```

- **Wrapper:** `WorkerResult<SolarResult>`, `worker: "solar_pysam"`.
- **Provenance tier:** `modeled` (PySAM is a model; the weather file is `fetched`). Cross-checked vs. Google Solar API (arch/02 §1.1, doc 10 §7).
- **Cache key inputs:** `(geometryHash, systemHash, weatherYear)` per arch/02 §1.1.
- **Tier-0 fallback (no worker):** Doc 01 §3.1 `estimateSolar` reads `acAnnualKwh`/`acMonthlyKwh`/`capacityFactor` straight from a PVWatts fixture — *same field names*, so the engine code is tier-agnostic.

---

### 1.2 Stormwater — `hydro_pyswmm` · `[PLANNED]` (Tier 0 inline today)

```ts
interface HydroInput extends WorkerInputCommon {
  intervention: InterventionKey;     // greenRoof | bioswale | permeablePaving | cistern …
  areaM2: number;
  imperviousPct: number;             // 0–100 → Rv = 0.05 + 0.009·I (GSMM Vol.2, Doc 01 §3.2)
  rainfallSeriesId?: string;         // [PLANNED] NOAA/Atlanta continuous series id (Tier 1)
  lidSpec?: {                        // [PLANNED] SWMM LID layer specs
    mediaDepthMm: number; fieldCapacity: number; lidType: "greenRoof"|"bioretention"|"permeablePavement";
  };
}

interface HydroResult {
  surfaceId: string;
  firstInchGalYr: number;            // design first-inch volume on this surface
  capturedGalYr: number;            // volume retained by the intervention
  retentionFrac: number;            // capturedGalYr / inflow (Tier 1: annual continuous-sim %)
  meetsFirstInch: boolean;          // Ch.74 Art.X compliance GATE flag (the gate)
  annualRetainedGalYr: number;      // continuous-sim annual gallons (the carrot)
}
```

- **Wrapper:** `WorkerResult<HydroResult>`, `worker: "hydro_pyswmm"`.
- **Model:** EPA SWMM 5 / PySWMM, **continuous** simulation over a real rainfall series → *annual* retention, not a single storm (arch/02 §1.2).
- **Provenance tier:** Tier 0 inline → `modeled`/`default` (GSMM closed-form); Tier 1 PySWMM → `modeled` with a regulatory-grade source string.
- **Two outputs by design:** the boolean gate (`meetsFirstInch`) and the continuous annual carrot (`annualRetainedGalYr`). Maps to the registry's proposed `firstInchComplianceGal` (HANDSHAKE §4.1).

---

### 1.3 Energy — `energy_eplus` · `[PLANNED]` (Tier 0 inline today)

```ts
interface EnergyInput extends WorkerInputCommon {
  intervention: InterventionKey;     // greenRoof | coolRoof | solar (offset) …
  areaM2: number;
  solarAcAnnualKwh?: number;         // solar offset folded in (Doc 01 §3.4)
  archetype?: {                      // [PLANNED] CBEEO use_type + vintage → EnergyPlus template
    useType: string; yearBuilt: number;
  };
  calibrationTarget?: {              // [PLANNED] calibrate to the REAL metered building (arch/02 §1.3)
    energyStarScore?: number; annualElectricityUseKwh?: number;
  };
}

interface EnergyResult {
  surfaceId: string;
  baselineCoolingKwhYr: number;      // modeled or calibrated "before"
  savedKwhYr: number;                // reduction from the intervention (+ solar offset)
  savedUsdYr: number;                // savedKwhYr × local tariff
  netAnnualKwhYr: number;            // building electricity after intervention
  calibrated: boolean;              // true once fit to CBEEO/bills (credibility flag)
}
```

- **Wrapper:** `WorkerResult<EnergyResult>`, `worker: "energy_eplus"`.
- **Model:** EnergyPlus via OpenStudio SDK; green roof via the `EcoRoof` object; URBANopt for portfolios; RC grey-box as the fast Tier-1.5 alt (arch/02 §1.3). Heaviest job → prime Tier-3 surrogate candidate.
- **Provenance tier:** `modeled`; `measured`-anchored once `calibrated: true`.

---

### 1.4 Heat — `heat_gee_lst` · `[PLANNED]` (Tier 0 inline today)

```ts
interface HeatInput extends WorkerInputCommon {
  intervention: InterventionKey;
  currentRoof: "darkMembrane" | "coolRoof" | "greenRoof" | "solarShaded";
  albedo?: number;                   // [PLANNED] per-surface SRI/albedo for SEB delta
}

interface HeatResult {
  surfaceId: string;
  roofTempBeforeF: number;           // Tier 1: MEASURED LST sample at the roof (GEE)
  roofTempAfterF: number;            // SEB/ET-modeled delta for the intervention
  deltaF: number;                    // after − before (negative = cooling)
  lstMeasured: boolean;              // true when "before" is a real Landsat/ECOSTRESS sample
}
```

- **Wrapper:** `WorkerResult<HeatResult>`, `worker: "heat_gee_lst"`.
- **Model:** measured baseline = Landsat 8/9 `ST_B10` / ECOSTRESS LST via Google Earth Engine, sampled at the roof; delta from an SEB/ET model (arch/02 §1.4). ENVI-met microclimate stays a Tier-2 story layer.
- **Provenance tier:** `before` = `measured` (LST raster) when `lstMeasured`; otherwise the Doc 01 §3.3 empirical `ROOF_TEMP_F` lookup → `default`. Same field names either way.

---

### 1.5 Carbon — `carbon_factor` · `[PLANNED]` (Tier 0 inline today)

```ts
interface CarbonInput extends WorkerInputCommon {
  energyKwhYr: number;               // avoided/offset electricity (solar + energy savings)
  vegetatedAreaM2?: number;          // green-roof sequestration (minor, label honestly)
  embodiedKgCo2?: number;            // [PLANNED] panels/structure embodied carbon (EC3-style)
}

interface CarbonResult {
  surfaceId: string;
  gridFactorKgPerKwh: number;        // eGRID avg today → Cambium LRMER [PLANNED]
  operationalCo2TonsYr: number;      // energyKwhYr × gridFactor (dominant term)
  sequestrationCo2TonsYr: number;    // vegetatedAreaM2 × sequestration rate (minor)
  embodiedCo2Tons?: number;          // [PLANNED] one-time, amortized for net-lifecycle
  co2TonsYr: number;                 // net annual avoided (matches Score.metrics.carbonTonsYr)
}
```

- **Wrapper:** `WorkerResult<CarbonResult>`, `worker: "carbon_factor"`.
- **Model:** EPA eGRID SRSO `0.3837 kg/kWh` (Tier 0) → NREL Cambium long-run marginal (LRMER) + hourly factors (Tier 1). The upgrade is *methodological honesty*, not compute (arch/02 §1.5).
- **Provenance tier:** `fetched` (factor table) → the math is `modeled`.
- **Note:** `gridFactorKgPerKwh` here MUST equal `SolarResult.assumptions.gridFactorKgPerKwh` for the same run — the engine asserts this (single source of grid factor in `ctx`, §2).

---

### 1.6 Biodiversity — `biodiv_hsi` · `[PLANNED]` (Tier 0 inline today)

```ts
interface BiodiversityInput extends WorkerInputCommon {
  intervention: InterventionKey;
  areaM2: number;
}

interface BiodiversityResult {
  surfaceId: string;
  habitatM2: number;                 // vegetated area contributing habitat
  habitatSuitabilityIndex?: number;  // [PLANNED] 0–1 transparent HSI / green-area index
  pollinatorForageScore?: number;    // [PLANNED] 0–1
  qualitative: true;                 // ALWAYS true — honest label, no fake species counts
}
```

- **Wrapper:** `WorkerResult<BiodiversityResult>`, `worker: "biodiv_hsi"`.
- **Model:** transparent habitat-suitability/green-area index + i-Tree co-benefits; always labeled qualitative-to-semi-quantitative (arch/02 §1.6, Doc 01 §3.6).
- **Provenance tier:** `modeled` with an explicit "qualitative proxy" note.

---

### 1.7 Cost / ROI — `cost_finance` · `[PLANNED]` (Tier 0 inline today)

```ts
interface CostInput extends WorkerInputCommon {
  intervention: InterventionKey;
  systemCapacityKwDc?: number;       // solar: $/W basis
  areaM2?: number;                   // green roof / lattice: $/m² basis
  annualSavingsUsd: number;          // from EnergyResult + tariff (drives payback)
  incentivesConfigId: string;        // selects the city/federal incentive stack (ctx.incentives)
  monteCarloRuns?: number;           // [PLANNED] → payback DISTRIBUTION (band), arch/02 §1.7
}

interface CostResult {
  surfaceId: string;
  capexUsd: number | Range;          // RSMeans/ATB; Range under Monte Carlo [PLANNED]
  incentivesUsd: number;             // stacked: 30% ITC, §179D, MACRS, GA Power rebate, cool-roof, tree avoidance
  netCapexUsd: number;               // capex − incentives, clamped ≥ 0
  annualSavingsUsd: number;
  paybackYears: number | Range;      // band, never false precision (HANDSHAKE §1)
  npvUsd?: number;                   // [PLANNED] cash-flow model
  irrPct?: number;                   // [PLANNED]
  incentiveBreakdown?: { key: string; usd: number }[]; // [PLANNED] for the report
}
```

- **Wrapper:** `WorkerResult<CostResult>`, `worker: "cost_finance"`.
- **Model:** NREL ATB + RSMeans references; real cash-flow engine (incentive stack with OBBBA-2025 timelines, NPV/IRR, financing tabs); Monte Carlo over cost/rate/yield → payback distribution (arch/02 §1.7).
- **Provenance tier:** `modeled`; incentive amounts `fetched` from `incentives.<city>.json`.
- **`capexUsd`/`paybackYears` are `number | Range`** to match `MetricBundle` exactly (HANDSHAKE §3.6).

---

## 2. The engine `ctx` object

`ctx` is the **fully-resolved, I/O-free bundle** the engine reads. It carries everything external so `runEngine` itself is pure (the determinism law). Workers feed it; the engine never calls a worker.

```ts
interface EngineCtx {
  engineVersion: string;             // stamped onto EngineResult; bump on any math change (§5)
  schemaVersion: string;             // HANDSHAKE contract version

  // 1. Coefficients — the Tier-0 closed-form constants (Doc 01 §3 `coefficients.js`)
  coefficients: Coefficients;

  // 2. Composite weights — user-adjustable sliders, sane defaults (Doc 01 §3.8)
  weights: CompositeWeights;

  // 3. Precomputed worker results — content-addressed cache, the Tier-1+ inputs
  workers: {
    solar?: Record<string, WorkerResult<SolarResult>>;          // keyed by inputHash
    hydro?: Record<string, WorkerResult<HydroResult>>;          // [PLANNED]
    energy?: Record<string, WorkerResult<EnergyResult>>;        // [PLANNED]
    heat?: Record<string, WorkerResult<HeatResult>>;            // [PLANNED]
    carbon?: Record<string, WorkerResult<CarbonResult>>;        // [PLANNED]
    biodiversity?: Record<string, WorkerResult<BiodiversityResult>>; // [PLANNED]
    cost?: Record<string, WorkerResult<CostResult>>;            // [PLANNED]
  };

  // legacy demo path: PVWatts fixture keyed like Doc 01 §3.1 pvwattsKey()
  pvwattsCache?: Record<string, { acAnnualKwh: number; acMonthlyKwh: number[]; capacityFactor: number }>;

  // 4. Climate config — selected by Building.city (Doc 01 §6)
  climate: {
    city: string;
    gridFactorKgPerKwh: number;      // eGRID/Cambium — SINGLE source (shared by carbon + solar)
    tariffUsdPerKwh: number;         // local utility commercial rate
    firstInchIn: number;             // BMP manual (Atlanta = GSMM)
    weatherYear?: number;
  };

  // 5. Incentives config — the only genuinely city-specific scoring input (Doc 01 §6)
  incentives: {
    city: string;
    stack: { key: string; appliesTo: InterventionKey[]; rule: unknown; capUsd?: number }[];
  };

  // catalog of intervention definitions (HANDSHAKE §3.4), for loadPsf / appliesTo / unitCost
  interventions: Record<InterventionKey, Intervention>;
}

interface CompositeWeights {        // Doc 01 §3.8 DEFAULT_WEIGHTS
  stormwater: number; heat: number; energy: number; carbon: number;
  biodiversity: number; roi: number; feasibility: number;   // env .60 / roi .25 / feas .15
}

interface Coefficients {            // mirrors Doc 01 §3 `C` — every value carries a // SOURCE
  modulePowerDensityKwPerM2: number; packingFactor: number; pvwattsLossesPct: number;
  firstInchIn: number; galPerFt3: number; greenroofRetentionFrac: number;
  roofTempF: Record<string, number>;
  greenroofCoolingReductionFrac: number; baselineCoolingKwhPerM2Yr: number;
  gridEmissionKgPerKwh: number; sequestrationKgCPerM2Yr: number; kgPerMetricTon: number;
  unitCost: Record<string, number>;
}
```

**Resolution rule:** `gridFactorKgPerKwh` exists in exactly one place (`ctx.climate`). Workers that emit a grid factor (`SolarResult.assumptions`, `CarbonResult`) must have been run with that same value; the engine asserts equality and emits a `warning` on mismatch rather than silently picking one.

---

## 3. `runEngine(building, ctx) → EngineResult`

```ts
function runEngine(building: Building, ctx: EngineCtx): EngineResult;
```

Pure and synchronous. Returns the canonical `EngineResult` (HANDSHAKE §3.6) unchanged.

### 3.1 Producing `surfaceScores` (surface × allowedInterventions)

```
for each surface in building.surfaces:
  for each intervention in surface.allowedInterventions:      // the eligibility gate already ran (Doc 04)
    metrics = computeMetrics(surface, intervention, building, ctx)  // see below → MetricBundle
    score   = { surfaceId: surface.id, intervention, metrics,
                normalized: {}, composite: 0,
                feasibility: checkFeasibility(surface, intervention, ctx) }
    push score
```

`computeMetrics` builds one `MetricBundle` (HANDSHAKE §3.6) by, per metric, **preferring a cached `WorkerResult` and falling back to the Tier-0 closed-form**:

| MetricBundle field | Worker path (Tier 1+) | Inline path (Tier 0, today) |
|---|---|---|
| `solarKwhYr` | `ctx.workers.solar[hash].result.acAnnualKwh` | `estimateSolar` from `ctx.pvwattsCache` |
| `stormwaterGalYr` | `ctx.workers.hydro[hash].result.annualRetainedGalYr` | `estimateStormwater` (GSMM) |
| `heatDeltaF` | `ctx.workers.heat[hash].result.deltaF` | `ROOF_TEMP_F` lookup |
| `energyKwhYr` / `energyUsdYr` | `ctx.workers.energy[hash].result.savedKwhYr` / `savedUsdYr` | `estimateEnergy` (empirical %) |
| `carbonTonsYr` | `ctx.workers.carbon[hash].result.co2TonsYr` | `estimateCarbon` (eGRID) |
| `biodiversityM2` | `ctx.workers.biodiversity[hash].result.habitatM2` | `estimateBiodiversity` proxy |
| `capexUsd` / `incentivesUsd` / `paybackYears` | `ctx.workers.cost[hash].result.*` | `estimateCostROI` |

The lookup `hash` is computed by the engine the *same way* the worker computed `inputHash` (see §5) — that is what makes a cache hit possible.

### 3.2 `normalized` (0–1) and `composite` — Doc 01 §3.8 / §7.8

1. **Normalize** each sub-metric by **min-max across all candidate scores for this building** (so the best candidate on an axis = 1, the worst = 0). Axes: `solar, stormwater, heat, energy, carbon, biodiversity, roi, feasibility`. Sign-correct so "more cooling" (`heatDeltaF` more negative) and "shorter payback" map toward 1.
2. Write the per-axis 0–1 values into `Score.normalized: Record<string, number>`.
3. **Composite** = `Σ wᵢ · normalizedᵢ` over `ctx.weights` (defaults: env .60 / roi .25 / feas .15). Identical to Doc 01 §3.8 `composite()`.

Weights arrive via `ctx.weights` so the slider UI can re-run `runEngine` and watch the ranking reorder live — without re-running any worker (only normalization + composite recompute).

### 3.3 `ranked` — resolving the solar-vs-green-roof conflict (Doc 01 §3.9)

```
group surfaceScores by surfaceId
for each surface group:
  pick the highest-composite Score as the surface's recommended pick
  but RETAIN the runner-up (the engine does not drop it) so the UI can show the trade-off
ranked = picks sorted by composite desc
```

Mutual exclusion today is the explicit **solar vs. greenRoof on one roof** rule. `surfaceScores` always keeps the full set (every allowed pair) so "south roof: solar (0.74) edges green roof (0.69)" is renderable. The production upgrade is the MILP/NSGA-II Pareto formulation (arch/02 §2) — same `ranked` output shape, smarter selection.

### 3.4 `buildingTotals` aggregation (HANDSHAKE §3.6)

Aggregate over the `ranked` picks (not all candidates — you can't build both solar and a green roof on one roof):

```ts
buildingTotals = {
  combinedSolarKwDc:    Σ ranked solar systemCapacityKwDc,
  combinedAnnualKwh:    Σ ranked solarKwhYr,
  combinedCo2TonsYr:    Σ ranked carbonTonsYr,
  stormwaterGalYr:      Σ ranked stormwaterGalYr,
  pctOfBuildingLoadOffset: combinedAnnualKwh / building.annualElectricityUseKwh.value,
  annualEnergySavingsUsd:  { low, high } over ranked energyUsdYr (band),
  paybackYearsRange:       { low, high } over ranked paybackYears (band),
};
```

`EngineResult` is then `{ buildingId, engineVersion: ctx.engineVersion, schemaVersion: ctx.schemaVersion, surfaceScores, ranked, buildingTotals, timeDependent? }`.

---

## 4. `evalTimeDependent(building, results, t) → TimeDependent`

The **sun-slider live contract** — the function behind `EngineResult.timeDependent` (typed `unknown` in the spine §3.6; this doc gives it a concrete shape). It runs on **every** slider move.

```ts
type SunT = number;   // 0..1, normalized time across the modeled day arc

interface TimeDependent {
  elevDeg: number;            // sun elevation at t
  solarCapturePct: number;    // instantaneous % of modeled peak AC at this sun angle
  cropShadeM2: number;        // canopy footprint × (1/sin(elev)) — geometric
  retentionGal: number;       // annual design-capture figure shown live (constant in t)
}

function evalTimeDependent(
  building: Building,
  results: EngineResult,
  t: SunT
): TimeDependent;
```

**Twin requirement (non-negotiable, arch/02 §0):** `evalTimeDependent` is **pure, synchronous, and zero-network**. It is cheap arithmetic over already-computed `results` — no PVWatts call, no worker, no `ctx` lookup that could miss. This is what keeps the slider smooth and what guarantees the browser twin and server agree at any `t`. Implementation matches Doc 01 §4.1: `elevDeg = ELEV_MAX_DEG · max(0, sin(π·t))`, `solarCapturePct = round(captureFrac · solarPeakFrac · 100)`.

> **Note:** Doc 01 §4.1 reads `results.buildingTotals.solarPeakFrac`. That field is **not yet on canonical `BuildingTotals`** — flagged in §8.

---

## 5. Worker ↔ engine flow & caching

### 5.1 How a `WorkerResult` feeds `ctx` (content-addressed)

1. A worker runs (async AWS Batch / Lambda per arch/03 §4), computing `inputHash` over its **normalized** inputs (`WorkerInputCommon` + the metric-specific input, canonicalized: sorted keys, fixed number precision).
2. The result persists as a `WorkerResult<T>` row keyed by `(worker, workerVersion, inputHash)` in S3 + Postgres `simulation_results` (arch/03 §4).
3. To assemble `ctx`, the orchestrator loads the relevant `WorkerResult`s into `ctx.workers.<metric>[inputHash]`.
4. `runEngine` recomputes the **same** `inputHash` for each (surface × intervention) and reads it back. **Same inputs → cache hit, $0 compute** (arch/03 §4, the cost lever).

### 5.2 Fidelity-tier tag

`WorkerInputCommon.fidelityTier` (0–3, arch/02 §0 ladder) records *which rung* produced a result. The engine prefers the highest available tier present in `ctx.workers` and otherwise drops to the Tier-0 inline formula. Default is empirical/instant; a full sim is only dispatched on explicit "high-fidelity" request or report finalization (arch/03 §4 — don't burn a sim on every slider drag). A Tier-3 surrogate must carry error bars and **fall back to the real sim when out of training distribution** (arch/02 §4).

### 5.3 Determinism & `engineVersion`

- **`engineVersion`** is bumped on any change to engine math (normalization, weights defaults, aggregation, a coefficient default). Same `(building, ctx)` + same `engineVersion` ⇒ byte-identical `EngineResult` (HANDSHAKE §1). The twin and the report **must** read the same `engineVersion` to agree.
- **`workerVersion`** is part of each result's cache key, so upgrading PySAM invalidates only that worker's cache, not the engine.
- The engine performs **no I/O** — every external value is pre-resolved in `ctx`. That is what makes determinism testable (golden-file `EngineResult` per `engineVersion`).

---

## 6. Provenance lifting (worker payload → domain types)

`WorkerResult.result` fields are plain numbers. When the engine surfaces one into a spine field typed `ProvenancedValue` (e.g. a report's `firstInchComplianceGal`, or `Building.energyStarScore` "after"), it wraps:

```ts
function lift(wr: WorkerResult<any>, value: number | null): ProvenancedValue {
  return { value, provenance: { ...wr.provenance, method: wr.worker, date: wr.computedAt } };
}
```

`Score.metrics` (`MetricBundle`) stays plain numbers per HANDSHAKE §3.6 — provenance is carried at the `EngineResult`/report layer, not duplicated per metric.

---

## 7. Tier-0 fallback parity (what runs today)

Until each worker ships, the engine computes that metric inline using Doc 01 §3 — the field names are chosen to match the `XxxResult` types so swapping in a worker is a `ctx`-only change, never a signature change:

| Metric | Today (inline, Doc 01 §3) | Lands as |
|---|---|---|
| Solar | `estimateSolar` ← `ctx.pvwattsCache` | `WorkerResult<SolarResult>` (REAL now) |
| Stormwater | `estimateStormwater` (GSMM `Rv`) | `WorkerResult<HydroResult>` |
| Heat | `ROOF_TEMP_F` lookup | `WorkerResult<HeatResult>` (LST `before`) |
| Energy | `estimateEnergy` (empirical %) | `WorkerResult<EnergyResult>` (calibrated) |
| Carbon | `estimateCarbon` (eGRID) | `WorkerResult<CarbonResult>` (Cambium) |
| Biodiversity | `estimateBiodiversity` proxy | `WorkerResult<BiodiversityResult>` |
| Cost/ROI | `estimateCostROI` + `stackIncentives` | `WorkerResult<CostResult>` (Monte Carlo) |

---

## 8. Proposed contract changes

> Where this doc needs a shape the spine doesn't carry, it is proposed here — **not** added to HANDSHAKE unilaterally. Promote with a Changelog bump in HANDSHAKE §7.

| # | Proposed change | Where | Why | Status |
|---|---|---|---|---|
| 1 | Add `solarPeakFrac: number` to canonical `BuildingTotals` (§3.6) | HANDSHAKE | `evalTimeDependent` (Doc 01 §4.1) reads it to scale instantaneous capture; today it's implied | `[PROPOSED]` |
| 2 | Replace `EngineResult.timeDependent: unknown` with `timeDependent?: TimeDependent` (§4 here) | HANDSHAKE §3.6 | give the sun-slider field a real type | `[PROPOSED]` |
| 3 | Promote `firstInchComplianceGal` (registry `[INBOX]`) sourced from `HydroResult.firstInchGalYr` | HANDSHAKE §4.1 → 04 | the gate flag the codes section needs | `[INBOX]` |
| 4 | Add `energyStarAfter` (`ProvenancedValue`) lifted from `EnergyResult` (calibrated) | HANDSHAKE §4.1 → 04 | the "after" snapshot vs. CBEEO "before" | `[INBOX]` |
| 5 | Add `incentiveBreakdown[]` to the report schema, sourced from `CostResult.incentiveBreakdown` | 04 | itemized stack for the city-ready proposal | `[PROPOSED]` |
| 6 | Confirm `MetricBundle.capexUsd`/`paybackYears` `number\|Range` accepted by twin renderers | consumers | Monte Carlo emits `Range`; UI must handle bands | `[VERIFY]` |

---

## 9. Changelog

| Date | Version | Change |
|---|---|---|
| 2026-06-16 | 0.1.0 | Initial engine-contract doc: per-metric worker I/O (`SolarResult` referenced; `Hydro/Energy/Heat/Carbon/Biodiversity/Cost` `[PLANNED]`), `EngineCtx`, `runEngine`, `evalTimeDependent`, worker↔engine caching/determinism, and §8 proposed spine changes. |
