# HANDSHAKE — Living Interface Contract

> **Purpose.** This is the single source of truth for how the parts of In-Planted / Climate Resilient ATL talk to each other: the **types** that flow between systems and the **endpoints** that will connect the front end to the back end. When this project is handed to a new contributor, *start here* — it tells you the shape of every object and the signature of every boundary.
>
> **Status: LIVING.** It evolves with the system. Anything not yet built is marked **`[PLANNED]`**; anything that may change is marked **`[DRAFT]`**. Update the Changelog (§7) on every change.
>
> **Scope of the handshake (who talks to whom):**
> ```
> Python pipeline ──fixtures──▶ JS scoring engine ──scores──▶ {3D twin | report gen}
>        │                            ▲  (same engine, browser + server)
>        └── workers (PySAM…) ────────┘
>   [PLANNED] REST/GraphQL API sits between front end and back end (see 03)
> ```

---

## 0. How to use this folder

| File | Owns | Audience |
|---|---|---|
| **HANDSHAKE.md** (this) | conventions + **canonical core types** + index + report placeholder | everyone — read first |
| [`01_domain-types.md`](01_domain-types.md) | the core domain types as **shareable artifacts** (TS interfaces, JSON Schema, pydantic) | FE + BE + pipeline |
| [`02_engine-contracts.md`](02_engine-contracts.md) | per-metric **worker I/O** + `runEngine` + `Score` | calc engine, pipeline |
| [`03_api-endpoints.md`](03_api-endpoints.md) | **FE ↔ BE** REST/GraphQL surface `[PLANNED]` | FE + BE |
| [`04_report-schema.md`](04_report-schema.md) | the **report/proposal** object + the **extensible content registry** | report gen, product |
| [`05_onboarding.md`](05_onboarding.md) | **address → Building** flow: geocode/Solar/GEE worker results + `POST /onboard` | FE + BE + pipeline |

**Rule for contributors:** the core types in §3 below are **canonical**. The sub-docs *express, extend, and formalize* them — they must never redefine a field with a different name/unit. If you need a change, change it *here* and bump the Changelog.

---

## 1. Conventions (non-negotiable, so systems align)

- **Wire format:** JSON. **Casing:** `camelCase` on the wire (JSON/TS). The Python side uses `snake_case` internally and (de)serializes with explicit aliases — see `01`.
- **Units are in the field name.** Never a bare number. `areaM2`, `annualKwh`, `co2TonsYr`, `capexUsd`, `paybackYears`, `roofTempF`, `galYr`, `lengthM`, `azimuthDeg`, `tiltDeg`. If a unit isn't in the name, it's a bug.
- **Every meaningful number is a `ProvenancedValue`**, not a raw scalar (see §3.1). This is a hard project rule (echoed across the architecture docs).
- **IDs:** `buildingId` = kebab slug (`ansley-mall`). `surfaceId` = `${buildingId}-${surfaceType}` (`ansley-mall-roof`). `interventionKey` ∈ the enum in §3.4.
- **Versioning:** every top-level payload carries `schemaVersion` (this contract's version) and computed artifacts carry `engineVersion`. Same inputs + same `engineVersion` ⇒ identical outputs (determinism — required so the twin and the report agree).
- **Money/time basis:** USD, present-day unless a `basisYear` is given. Ranges use `{ low, high, basis }` (we present bands, not false precision).
- **Nullable + gaps:** unknown values use `null` with `provenance.tier = "gap"` and a `note` — never a fabricated number.
- **Enums are closed.** Adding a value = a Changelog entry.

---

## 2. Type notation

Types are given as **TypeScript interfaces** (the lingua franca). `01_domain-types.md` mirrors each as **JSON Schema** (validation) and **pydantic** (Python pipeline). The JS engine consumes the TS/JSDoc form; the Python pipeline emits the JSON-Schema-valid form; they are the same shape.

---

## 3. Canonical core types  ⟵ source of truth

### 3.1 Provenance (wraps almost everything)
```ts
type ProvenanceTier = "measured" | "fetched" | "modeled" | "default" | "gap";
interface Provenance {
  tier: ProvenanceTier;          // how trustworthy
  source: string;                // e.g. "NREL PVWatts v8", "Google Solar API", "eGRID SRSO"
  method?: string;               // e.g. "PySAM pvwattsv8", "polygon trace"
  date?: string;                 // ISO 8601, when obtained/computed
  note?: string;
}
interface ProvenancedValue<T = number> { value: T | null; provenance: Provenance; basis?: string; }
interface Range { low: number; high: number; basis?: string; }            // for bands (e.g. payback)
```

### 3.2 Geometry primitives
```ts
interface GeoPoint { lat: number; lon: number; }                          // WGS84
interface Orientation { azimuthDeg: number; tiltDeg: number; }            // 180 = south
type SurfaceType = "roof" | "facade" | "parking" | "perimeter";
```

### 3.3 CandidateSurface
```ts
interface CandidateSurface {
  id: string;                         // `${buildingId}-${type}`
  type: SurfaceType;
  areaM2: ProvenancedValue;
  usableAreaM2?: ProvenancedValue;    // after setbacks/obstructions
  orientation?: Orientation;
  imperviousPct?: number;             // 0–100, for stormwater Rv
  sunExposure?: number;               // 0–1 annual, optional
  addedLoadCapacityPsf?: ProvenancedValue;   // structural gate input
  allowedInterventions: InterventionKey[];   // populated by the eligibility gate (Doc 04)
  sceneAnchor?: [number, number, number];    // twin label anchor (optional)
}
```

### 3.4 Intervention
```ts
type InterventionKey =
  | "solar" | "solarCanopy" | "greenRoof" | "coolRoof"
  | "cistern" | "bioswale" | "permeablePaving" | "lotTrees"
  | "shadeLattice" | "pollinatorLandscaping" | "agriculture" | "evCharging";
interface Intervention {
  key: InterventionKey;
  label: string;
  appliesTo: SurfaceType[];
  addressesObjectives: ("solar"|"stormwater"|"heat"|"carbon"|"energy"|"biodiversity")[];
  loadPsf?: number;
  unitCost?: ProvenancedValue;        // $/m² or $/W per the intervention (basis in provenance)
}
```

### 3.5 Building
```ts
interface Building {
  id: string;                         // kebab slug
  name: string;
  owner?: string;
  address?: string;
  city: string;                       // selects climate/incentives config
  location: GeoPoint & { provenance?: Provenance };
  yearBuilt?: number;
  stories?: number;
  roofAreaM2?: number;
  energyStarScore?: ProvenancedValue; // the "before"
  annualElectricityUseKwh?: ProvenancedValue;
  surfaces: CandidateSurface[];
  schemaVersion: string;
}
```

### 3.6 Score, BuildingTotals (engine output — full contract in `02`)
```ts
interface MetricBundle {                 // per (surface × intervention)
  solarKwhYr?: number; stormwaterGalYr?: number; heatDeltaF?: number;
  energyKwhYr?: number; energyUsdYr?: number; carbonTonsYr?: number;
  biodiversityM2?: number; capexUsd?: number | Range; incentivesUsd?: number;
  paybackYears?: number | Range;
}
interface Score {
  surfaceId: string; intervention: InterventionKey;
  metrics: MetricBundle;
  normalized: Record<string, number>;    // 0–1 per sub-metric
  composite: number;                      // weighted (Doc 01 §7.8)
  feasibility?: { permitable: boolean; notes: string[] };
}
interface BuildingTotals {
  combinedSolarKwDc?: number; combinedAnnualKwh?: number;
  combinedCo2TonsYr?: number; stormwaterGalYr?: number;
  pctOfBuildingLoadOffset?: number;
  annualEnergySavingsUsd?: Range; paybackYearsRange?: Range;
}
interface EngineResult {
  buildingId: string; engineVersion: string; schemaVersion: string;
  surfaceScores: Score[]; ranked: Score[]; buildingTotals: BuildingTotals;
  timeDependent?: unknown;               // sun-slider live values (Doc 01 §4)
}
```

### 3.7 Worker envelope (every Python calc worker returns this)
```ts
interface WorkerResult<TResult> {
  worker: string;                        // e.g. "solar_pysam"
  workerVersion: string;
  inputHash: string;                     // for content-addressed caching (arch/03)
  result: TResult;
  provenance: Provenance;
  warnings?: string[];
  computedAt: string;                    // ISO 8601
}
// Canonical SolarResult — the PySAM worker MUST emit this (see 02_engine-contracts.md)
interface SolarResult {
  surfaceId: string;
  systemCapacityKwDc: number;
  acAnnualKwh: number;
  acMonthlyKwh: number[];                // length 12
  capacityFactor: number;
  co2AvoidedTonsYr: number;              // acAnnualKwh × grid factor (eGRID/Cambium)
  assumptions: { tiltDeg: number; azimuthDeg: number; lossesPct: number; arrayType: number; moduleType: number; gridFactorKgPerKwh: number; };
}
```

---

## 4. Report / proposal handshake  ⟶ detail in `04_report-schema.md`

The "city-ready proposal" is itself a typed object built from `EngineResult` + the codes/incentives/city-contribution content. Its full schema lives in `04`. Three pillars already drafted: codes (`ImplementationPlan/11`), tax (`12`), city contribution (`13`).

### 4.1 📥 REPORT CONTENT REGISTRY — the deliberately-open space
> **This is the "leave a space" the team asked for.** As our sources (CBEEO, codes, incentives, equity data, measured results, etc.) tell us new things to put in reports, **add a row here** and `04` formalizes it into the schema. Treat this as the inbox; nothing here is final.

| Field (proposed) | Goes in which report section | Type | Source / when available | Status |
|---|---|---|---|---|
| `energyStarBefore` / `energyStarAfter` | Snapshot + City contribution | `ProvenancedValue` | CBEEO row (pull pending) | `[INBOX]` |
| `firstInchComplianceGal` | Stormwater / codes | `number` | PySWMM (planned) | `[INBOX]` |
| _add new report fields here as sources land →_ | | | | |

Conventions for new entries: name it per §1 (units in the name), wrap numbers in `ProvenancedValue`, say which report section + source, and mark `[INBOX] → [DRAFT] → [STABLE]`. `04` owns promotion into the formal schema.

---

## 5. Endpoints (FE ↔ BE)  ⟶ detail in `03_api-endpoints.md`  `[PLANNED]`

No live API exists yet (the demo reads committed JSON). `03` defines the *target* contract — resources (`/buildings`, `/buildings/{id}/scores`, `/jobs`, `/reports`), async job pattern for heavy sims, auth, error shape, versioning — so that when we wire FE↔BE the contract is already agreed. Until then, the "endpoint" is: the JS engine imports the committed fixture JSON.

---

## 6. Source-of-truth map (where each type physically lives today)

| Concept | Today (demo) | Becomes (production) |
|---|---|---|
| Building/Surface data | `src/data/buildings/*.json` | DB (Aurora+PostGIS) per arch/01 |
| Type definitions | this doc + `01_domain-types.md` artifacts | shared package imported by FE/BE/pipeline |
| Scoring | `src/engine/*` (JS) `[PLANNED build]` | same JS, browser + server (arch/03) |
| Calc workers | `pipeline/workers/*.py` (solar = real now) | async Batch workers (arch/03) |
| Report | `04_report-schema.md` + `ImplementationPlan/11–13` | report-gen service |

---

## 7. Pending reconciliation (raised by the sub-docs — triage before APIs are built)
The sub-docs were built against this spine and flagged real items to reconcile here (none silently applied):
- **Fixture vs. contract:** `src/data/buildings/ansley-mall.json` predates the contract — provenance is a **bare string** (`"google"`) where the contract wants a `Provenance` **object**; `areaM2` is a bare number not a `ProvenancedValue`; several blobs (`buildingTotals`, `interventions`, …) belong to `EngineResult`/the report, not `Building`. → needs a migration pass + a normalizer at the fixture→API boundary.
- **Proposed spine additions:** value-level `note`; wrap `roofAreaM2` in `ProvenancedValue`; cleaner `Building.location` shape; add `solarPeakFrac` to `BuildingTotals`; type `EngineResult.timeDependent` as `TimeDependent`; add `ProvenancedRange` + `CredibilityBasis`; formalize a `Weights` type; promote `firstInchComplianceGal`/`energyStarAfter`/`incentiveBreakdown[]` into the report schema.
- **Endpoint:** `[SECURITY]` the PySAM worker's live-HTTP path now requires an explicitly user-verified `NREL_API_BASE` (no default) — the `developer.nlr.gov` "moved domain" claim from early docs is **unverified** and must be confirmed before any key is sent.

## 8. Changelog
| Date | Version | Change |
|---|---|---|
| 2026-06-16 | 0.2.1 | Added `05_onboarding.md` (address→Building contract) + built `geocode.py` & `solar_buildinginsights.py` workers (safe-by-default, official verified Google domains, offline fallback). New types proposed in `05 §6`. |
| 2026-06-16 | 0.2.0 | Sub-docs `01–04` filled (domain types as TS/JSON-Schema/pydantic artifacts; engine/worker contracts; FE↔BE API surface; report schema + Content Registry). PySAM solar worker built. Reconciliation items logged in §7. |
| 2026-06-16 | 0.1.0 | Initial spine: conventions + canonical core types + report registry placeholder + index. |
