# 01 — Domain Types (shareable artifacts)

> **Owns:** the canonical core types from [`HANDSHAKE.md`](HANDSHAKE.md) §3, expressed as **importable artifacts** so the front end (TS/JSDoc), back end, and Python pipeline all share *identical* shapes.
> **Audience:** FE + BE + pipeline.
> **Rule:** HANDSHAKE §3 is canonical. This doc and the artifacts below *express* it — they never rename a field or change a unit. A shape change starts in HANDSHAKE (+ Changelog), then propagates here.

## Artifacts in this folder

| Artifact | Path | Consumed by | Role |
|---|---|---|---|
| TypeScript interfaces | [`types/domain.ts`](types/domain.ts) | FE, JS engine (browser + server) | **lingua-franca source**; JSDoc-documented |
| JSON Schema (draft 2020-12) | [`schema/*.schema.json`](schema/) | Python pipeline output validation; CI | validatable payloads + shared `$defs` |
| pydantic v2 models | [`types/domain.py`](types/domain.py) | Python pipeline / workers | emit + validate, with camelCase↔snake_case aliases |

The JSON Schemas: `_defs.schema.json` (shared `$defs`: Provenance, ProvenancedValue, Range, GeoPoint, Orientation, SurfaceType, InterventionKey, Objective) plus one file per validatable payload — `Building`, `CandidateSurface`, `Score`, `EngineResult`, `WorkerResult`, `SolarResult`. (`report.schema.json` is owned by Doc 04, not this doc.)

---

## How each side imports these

**Front end / JS engine (TS or JSDoc):**
```ts
import type { Building, EngineResult, Score, SolarResult } from "../contracts/types/domain";
```
The engine is plain ES modules per ImplementationPlan/01 §0; in JS files reference the types via JSDoc:
```js
/** @typedef {import("../contracts/types/domain").Building} Building */
```

**Back end (TS):** same import as FE — one shared package (HANDSHAKE §6: "shared package imported by FE/BE/pipeline").

**Python pipeline / workers:**
```python
from contracts.types.domain import SolarResult, WorkerResult, Building
sr = SolarResult.model_validate(raw)               # parse camelCase JSON
payload = sr.model_dump(by_alias=True)             # emit camelCase JSON
```
Workers then validate their emitted JSON against `contracts/schema/SolarResult.schema.json` (and the envelope against `WorkerResult.schema.json`) in CI before publishing fixtures.

---

## The casing-mapping rule (HANDSHAKE §1)

- **Wire (JSON/TS) is `camelCase`.** TypeScript and JSON Schema use camelCase field names verbatim.
- **Python is `snake_case`** internally. `domain.py` sets, on a shared `BaseSchema`:
  `model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")`.
  So `area_m2` (Python) ⇄ `areaM2` (wire), automatically, for every field.
- **Always serialize with `by_alias=True`** (`model_dump(by_alias=True)` / `model_dump_json(by_alias=True)`) so pipeline output is camelCase and validates against the JSON Schemas.
- `extra="forbid"` mirrors the schemas' `additionalProperties: false` — unknown fields are rejected on both sides, which is how the fixture divergences below were caught.

---

## Type reference

Units live in the field name (HANDSHAKE §1). "Prov?" = is this field a `ProvenancedValue` (value + provenance)?

### Provenance (§3.1)
| Field | Type | Units | Required | Prov? | Notes |
|---|---|---|:--:|:--:|---|
| `tier` | `"measured"\|"fetched"\|"modeled"\|"default"\|"gap"` | — | ✓ | — | closed enum |
| `source` | string | — | ✓ | — | e.g. "NREL PVWatts v8" |
| `method` | string | — | | — | e.g. "PySAM pvwattsv8" |
| `date` | string (ISO 8601) | — | | — | when obtained/computed |
| `note` | string | — | | — | required in spirit when `tier="gap"` |

### ProvenancedValue&lt;T=number&gt; (§3.1)
| Field | Type | Required | Notes |
|---|---|:--:|---|
| `value` | `T \| null` | ✓ | `null` ⇒ `provenance.tier="gap"`; never fabricate |
| `provenance` | `Provenance` | ✓ | |
| `basis` | string | | e.g. "2024 USD" |

### Range (§3.1)
| Field | Type | Units | Required | Notes |
|---|---|---|:--:|---|
| `low` / `high` | number | per context | ✓ | present bands, not false precision |
| `basis` | string | — | | what drives the spread |

### GeoPoint / Orientation / SurfaceType (§3.2)
| Field | Type | Units | Required | Notes |
|---|---|---|:--:|---|
| `lat` / `lon` | number | degrees (WGS84) | ✓ | |
| `azimuthDeg` | number | degrees | ✓ | 180 = south |
| `tiltDeg` | number | degrees | ✓ | |
| `SurfaceType` | `"roof"\|"facade"\|"parking"\|"perimeter"` | — | — | closed enum |

### CandidateSurface (§3.3)
| Field | Type | Units | Required | Prov? | Notes |
|---|---|---|:--:|:--:|---|
| `id` | string | — | ✓ | — | `${buildingId}-${type}` |
| `type` | `SurfaceType` | — | ✓ | — | |
| `areaM2` | `ProvenancedValue` | m² | ✓ | ✓ | gross area |
| `usableAreaM2` | `ProvenancedValue` | m² | | ✓ | after setbacks/obstructions |
| `orientation` | `Orientation` | deg | | — | |
| `imperviousPct` | number | % (0–100) | | — | stormwater Rv input |
| `sunExposure` | number | fraction (0–1) | | — | annual |
| `addedLoadCapacityPsf` | `ProvenancedValue` | psf | | ✓ | structural gate |
| `allowedInterventions` | `InterventionKey[]` | — | ✓ | — | set by eligibility gate (Doc 04) |
| `sceneAnchor` | `[number,number,number]` | scene units | | — | twin label anchor |

### Intervention (§3.4)
| Field | Type | Units | Required | Prov? | Notes |
|---|---|---|:--:|:--:|---|
| `key` | `InterventionKey` | — | ✓ | — | 12-value closed enum |
| `label` | string | — | ✓ | — | |
| `appliesTo` | `SurfaceType[]` | — | ✓ | — | |
| `addressesObjectives` | `Objective[]` | — | ✓ | — | solar/stormwater/heat/carbon/energy/biodiversity |
| `loadPsf` | number | psf | | — | structural gate |
| `unitCost` | `ProvenancedValue` | $/m² or $/W | | ✓ | basis in provenance |

### Building (§3.5)
| Field | Type | Units | Required | Prov? | Notes |
|---|---|---|:--:|:--:|---|
| `id` | string | — | ✓ | — | kebab slug |
| `name` | string | — | ✓ | — | |
| `owner` | string | — | | — | |
| `address` | string | — | | — | |
| `city` | string | — | ✓ | — | selects climate/incentives config |
| `location` | `GeoPoint & {provenance?}` | deg | ✓ | partial | |
| `yearBuilt` | number | year | | — | |
| `stories` | number | count | | — | |
| `roofAreaM2` | number | m² | | — | (raw number, per spine — see Proposed changes) |
| `energyStarScore` | `ProvenancedValue` | score | | ✓ | the "before" |
| `annualElectricityUseKwh` | `ProvenancedValue` | kWh/yr | | ✓ | |
| `surfaces` | `CandidateSurface[]` | — | ✓ | — | |
| `schemaVersion` | string | — | ✓ | — | this contract's version |

### MetricBundle / Score (§3.6)
| Field | Type | Units | Required | Notes |
|---|---|---|:--:|---|
| `metrics.solarKwhYr` | number | kWh/yr | | |
| `metrics.stormwaterGalYr` | number | gal/yr | | |
| `metrics.heatDeltaF` | number | °F | | negative = cooling |
| `metrics.energyKwhYr` / `energyUsdYr` | number | kWh/yr · USD/yr | | |
| `metrics.carbonTonsYr` | number | t CO₂/yr | | |
| `metrics.biodiversityM2` | number | m² | | |
| `metrics.capexUsd` | `number \| Range` | USD | | point or band |
| `metrics.incentivesUsd` | number | USD | | |
| `metrics.paybackYears` | `number \| Range` | years | | point or band |
| `surfaceId` | string | — | ✓ | |
| `intervention` | `InterventionKey` | — | ✓ | |
| `normalized` | `Record<string,number>` | 0–1 | ✓ | per sub-metric |
| `composite` | number | 0–1 | ✓ | weighted (Doc 01 §7.8) |
| `feasibility` | `{permitable, notes[]}` | — | | |

### BuildingTotals / EngineResult (§3.6)
| Field | Type | Units | Required | Notes |
|---|---|---|:--:|---|
| `combinedSolarKwDc` | number | kW DC | | |
| `combinedAnnualKwh` | number | kWh/yr | | |
| `combinedCo2TonsYr` | number | t CO₂/yr | | |
| `stormwaterGalYr` | number | gal/yr | | |
| `pctOfBuildingLoadOffset` | number | % (0–100) | | |
| `annualEnergySavingsUsd` | `Range` | USD/yr | | |
| `paybackYearsRange` | `Range` | years | | |
| `EngineResult.buildingId` | string | — | ✓ | |
| `EngineResult.engineVersion` | string | — | ✓ | determinism key |
| `EngineResult.schemaVersion` | string | — | ✓ | |
| `EngineResult.surfaceScores` / `ranked` | `Score[]` | — | ✓ | |
| `EngineResult.buildingTotals` | `BuildingTotals` | — | ✓ | |
| `EngineResult.timeDependent` | unknown | — | | sun-slider live values (§4) |

### WorkerResult / SolarResult (§3.7)
| Field | Type | Units | Required | Notes |
|---|---|---|:--:|---|
| `worker` | string | — | ✓ | e.g. "solar_pysam" |
| `workerVersion` | string | — | ✓ | |
| `inputHash` | string | — | ✓ | content-addressed caching |
| `result` | `TResult` | — | ✓ | worker-specific payload |
| `provenance` | `Provenance` | — | ✓ | |
| `warnings` | string[] | — | | |
| `computedAt` | string (ISO 8601) | — | ✓ | |
| `SolarResult.surfaceId` | string | — | ✓ | |
| `SolarResult.systemCapacityKwDc` | number | kW DC | ✓ | |
| `SolarResult.acAnnualKwh` | number | kWh/yr | ✓ | |
| `SolarResult.acMonthlyKwh` | number[] | kWh | ✓ | **length 12** |
| `SolarResult.capacityFactor` | number | fraction (0–1) | ✓ | |
| `SolarResult.co2AvoidedTonsYr` | number | t CO₂/yr | ✓ | acAnnualKwh × grid factor |
| `SolarResult.assumptions` | `{tiltDeg,azimuthDeg,lossesPct,arrayType,moduleType,gridFactorKgPerKwh}` | mixed | ✓ | |

---

## Fixture reconciliation — `src/data/buildings/ansley-mall.json`

The fixture predates this contract (its `_meta` notes it is a mockup). Validated against `schema/Building.schema.json` it produces **15 divergences**. Listed below with the migration for each. **We do not edit the fixture here** — this is the migration checklist.

### A. Provenance is a bare string, not an object (the big one)
The fixture writes `"provenance": "google"` / `"measured"` / `"gap"`. The contract requires a `Provenance` object: `{ "tier": "...", "source": "..." }`.
- **Migrate:** map the fixture's shorthand to `tier` + `source`:
  | fixture string | → `tier` | → `source` |
  |---|---|---|
  | `google` | `fetched` | `Google Solar API` |
  | `measured` | `measured` | `Google Earth trace` |
  | `research` | `default` | `In-Planted default constants (FINAL §7)` |
  | `gap` | `gap` | (source TBD; keep the `note`) |
- Affected paths: `location.provenance`, `annualElectricityUseKwh.provenance`, `energyStarScore.provenance`, `surfaces[0].addedLoadCapacityPsf.provenance`, `surfaces[1].areaM2.provenance`.

### B. `areaM2` must be a `ProvenancedValue`, not a bare number
- `surfaces[0].areaM2 = 20033` → `{ "value": 20033, "provenance": { "tier":"measured","source":"Google Earth trace" } }`.
- `surfaces[1].areaM2` is already an object but its `provenance` is a string (see A) and it carries a stray `note` (see D).

### C. `ProvenancedValue.note` is not a field — the note belongs on `provenance`
Fixture puts `note` directly on the value object (`energyStarScore.note`, `addedLoadCapacityPsf.note`). The contract has no `note` on `ProvenancedValue`; notes live on `Provenance.note`.
- **Migrate:** move the `note` text into `provenance.note`.

### D. Stray per-surface fields (rejected by `additionalProperties:false`)
- `surfaces[0].usableNote` → fold into `usableAreaM2.provenance.note` (and set `usableAreaM2.value` when measured), or drop.
- `surfaces[1].estParkingSpaces` → not in the contract; move to a future field or drop for now.
- `surfaces[1].areaM2.note` → `areaM2.provenance.note` (see C).
- `surfaces[2].note` → there is no surface-level `note`; fold into a provenance note on a real field.

### E. `surfaces[2]` (`ansley-beltline-edge`) is missing required `areaM2`
Perimeter surface has no `areaM2`. Contract requires it.
- **Migrate:** add `areaM2` as a `ProvenancedValue` (use `value:null` + `tier:"gap"` + note "perimeter length/area not yet measured" if unknown).

### F. Missing required top-level `schemaVersion`
- **Migrate:** add `"schemaVersion": "0.1.0"`.

### G. Rich top-level fields the contract does not yet model (rejected as additional properties)
`_meta`, `district`, `structure`, `roofAreaFt2`, `roofHeadingDeg`, `roofType`, `interventions`, `buildingTotals`, `incentives`, `codes`, `cityContribution`.
- `buildingTotals` here is a **building-data** blob, but the contract's `BuildingTotals` is an **engine output** (lives in `EngineResult`, not `Building`). These are different objects — the fixture's `buildingTotals` should move into a computed `EngineResult` fixture, not the `Building`.
- `interventions` (instances with computed kWh/capex) likewise belong to engine output / report, not the `Building` input.
- `incentives`, `codes`, `cityContribution` are **report** content → Doc 04 (`04_report-schema.md` / report registry), not the core `Building`.
- `_meta`, `district`, `structure`, `roofAreaFt2`, `roofHeadingDeg`, `roofType` are descriptive extras. See "Proposed contract changes" below — some of these are worth adding to the spine rather than dropping.

**Summary:** the fixture's *core building* fields (`id, name, owner, address, city, location, yearBuilt, stories, roofAreaM2, energyStarScore, annualElectricityUseKwh, surfaces`) all line up once provenance shorthand is expanded; the divergences are (1) the provenance-string→object expansion, (2) `note` placement, (3) `areaM2` wrapping, (4) one missing `areaM2`, (5) missing `schemaVersion`, and (6) several blobs that actually belong to *other* contract objects (EngineResult / report), not `Building`.

---

## Proposed contract changes

Genuine gaps/ambiguities spotted while formalizing. Per the spine's rule these are **proposals, not silent divergences** — adopt in HANDSHAKE §3 (+ Changelog) before relying on them. The artifacts above currently match the spine as-written, *not* these proposals.

1. **`Building.location` provenance is awkward as an intersection.** `GeoPoint & { provenance? }` mixes a primitive with a wrapper. Consider either keeping it (cheap) or, for consistency with the "every meaningful number is a ProvenancedValue" rule, expressing location as two `ProvenancedValue`s or a small `{ point: GeoPoint, provenance?: Provenance }`. Kept as-spec for now.

2. **`roofAreaM2` is a bare number** on `Building`, violating §1 ("every meaningful number is a `ProvenancedValue`"). Same for `yearBuilt`/`stories` (arguably fine as plain ints, but `roofAreaM2` is a measured quantity). Proposal: make `roofAreaM2` a `ProvenancedValue`. Left as bare number to match the spine.

3. **Building-level descriptive fields used by the fixture have no home:** `structure` (free text), `roofType`, `roofHeadingDeg` (a roof azimuth — duplicates per-surface `orientation`), `district`. Proposal: add optional `structure?: string`, `roofType?: string` to `Building`, and treat `roofHeadingDeg` as belonging on the roof surface's `orientation.azimuthDeg` (don't duplicate at building level). Until adopted, these are dropped on migration.

4. **`ProvenancedValue` has no `note`, but every fixture author reached for one** (multiple `note` siblings of `value`). The note currently must go on `provenance.note`, which is correct but non-obvious. Proposal: document this explicitly in §3.1 (a `value`-level note is a smell; put it on provenance) — or, if a value-level note is genuinely wanted, add `note?: string` to `ProvenancedValue`. Recommend documenting, not adding.

5. **`MetricBundle.capexUsd` / `paybackYears` are `number | Range`** (a union). Validators and consumers must branch on the type. Not a bug, but worth a note that the engine should prefer `Range` consistently for cost/payback (the fixture and ImplementationPlan §7.7 both lean on bands). Documentation-only.

6. **`SurfaceType` lacks a value for the fixture's `perimeter` use as a BeltLine edge** — actually covered (`perimeter` exists). No change. (Noting it because the original ImplementationPlan §2 enum was only `roof|facade|perimeter` and omitted `parking`/`solarCanopy`; the spine already fixed this — the *fixture* is the laggard, not the spine.)
