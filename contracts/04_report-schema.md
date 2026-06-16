# 04 · Report / Proposal Schema + the Report Content Registry

> **What this doc owns (per HANDSHAKE §0).** The **report/proposal object** — the typed "city-ready proposal" — and the **deliberately-extensible Report Content Registry** that HANDSHAKE §4.1 sketches. This is the formal end of the *living handshake*: `EngineResult` (HANDSHAKE §3.6) + content blocks (codes/incentives/city-contribution) flow in; one `MasterReport` and its fan-out briefs flow out.
>
> **Status: LIVING / `[DRAFT]`.** The report-gen service is `[PLANNED]`; the demo renders a committed JSON object. The schema here is canonical for that object.
>
> **Reads upstream of this doc:** HANDSHAKE §1 (conventions), §3.1 (`ProvenancedValue`), §3.6 (`EngineResult`), §4 + §4.1 (the registry placeholder this doc formalizes); `ImplementationPlan/03_ReportExportSpec.md` (taxonomy, sections, honesty layer); pillars `ImplementationPlan/11` (codes), `12` (tax), `13` (city contribution); fixture `src/data/buildings/ansley-mall.json`.

---

## 0. How the report is built (the data flow)

```
 Building JSON ─┐
                ├─▶ JS engine ─▶ EngineResult  ─┐
 worker results ┘   (HANDSHAKE §3.6)            │
                                                ├─▶  buildReport()  ─▶  MasterReport  ─┐
 content blocks (codes / incentives /  ─────────┘     (this doc)        (§1)           │
 city-contribution — pillars 11/12/13)                                                 ├─▶ fan-out
 Report Content Registry (§2) ──────────────────────────────────────── feeds new fields│   VendorBrief[]  (§1.2)
                                                                                        └─▶ CityContributionReport (§1.3)
```

- **Numbers come from `EngineResult`.** `MasterReport.impact` mirrors `BuildingTotals`/`MetricBundle`; `package` is derived from `EngineResult.ranked`. The report never recomputes — it *re-frames* engine output for a reader.
- **Words/citations come from content blocks** (the codes matrix, the incentive stack, the city-contribution scorecard). These are the pillars in `ImplementationPlan/11–13`.
- **Every meaningful number is a `ProvenancedValue`** (HANDSHAKE §1, §3.1) — never a bare scalar. Bands use the `ProvenancedRange` wrapper (§1.1).

### 0.1 Casing reconciliation note (important)
`ImplementationPlan/03 §4.1` wrote the first-draft schema in `snake_case` with bare scalars (`solar_kwh_per_yr: 92000`). **This contract supersedes that** and aligns the report object to the HANDSHAKE spine: **`camelCase` on the wire, every number a `ProvenancedValue`** (HANDSHAKE §1). Doc 03 remains the canonical source for the *taxonomy, section semantics, and honesty layer*; this doc is canonical for the *typed shape*. See "Proposed contract changes" (§5) for the spine touch-points.

---

## 1. The report object schema

TypeScript interfaces below are the lingua-franca form; the JSON Schema in [`schema/report.schema.json`](schema/report.schema.json) mirrors them for validation. All `ProvenancedValue`/`Provenance`/`Range` types are the canonical ones from HANDSHAKE §3.1 (imported, not redefined).

### 1.1 Shared report wrappers

```ts
import type { Provenance, ProvenancedValue, Range } from "./types/domain";

/** A band that still carries provenance — payback, capex, savings (HANDSHAKE §1 "bands not false precision"). */
interface ProvenancedRange { value: Range | null; provenance: Provenance; basis?: string; }

/**
 * The honesty layer (Doc 03 §5). DISTINCT from provenance.tier:
 *  - provenance.tier  = where the number came from (measured|fetched|modeled|default|gap)
 *  - credibility.basis = how a *reader* should weight the claim in a report
 * Both are kept so the PDF footer can render "modeled, verify" without overloading tier.
 */
type CredibilityBasis = "measured" | "modeled" | "illustrative" | "literature";
interface FieldCredibility { basis: CredibilityBasis; verify: boolean; citation?: string; }

/** Dotted-path → credibility, e.g. { "impact.solarKwhYr": { basis: "modeled", verify: true } }. */
type DataProvenanceMap = Record<string, FieldCredibility>;
```

### 1.2 `MasterReport` — the six sections (Doc 03 §6 / §2)

```ts
interface MasterReport {
  // identity / versioning (HANDSHAKE §1)
  reportId: string;
  generatedAt: string;          // ISO 8601
  engineVersion: string;        // same EngineResult.engineVersion that produced impact[]
  schemaVersion: string;        // this contract's version
  audience: "owner" | "city";   // render-time framing flag (Side A vs Side B)
  buildingId: string;           // kebab slug

  dataProvenance: DataProvenanceMap;   // §1.1 honesty layer, per-field

  // ── Section 1: snapshot + current rating
  snapshot: BuildingSnapshot;
  // ── Section 2: recommended package on the twin
  package: RecommendedPackage;
  // ── Section 3: impact deltas
  impact: ImpactDeltas;
  // ── Section 4: cost / ROI + stacked incentives
  cost: CostBlock;
  // ── Section 5: feasibility + codes
  feasibility: FeasibilityBlock;
  // ── Section 6: next-step checklist
  nextSteps: NextSteps;

  generatedBriefs?: GeneratedBriefRef[];   // fan-out A1–A6 + B1 (§1.4)

  /** OPEN EXTENSION POINT — promoted registry fields (status DRAFT|STABLE) land here
   *  until they earn a named slot above. See §2. */
  registryFields?: Record<string, ProvenancedValue>;
}

interface BuildingSnapshot {                                   // Doc 03 §2 S1
  parcelId?: string;
  address: string;
  location?: { lat: number; lon: number };
  grossFloorAreaFt2?: ProvenancedValue;
  roofAreaFt2?: ProvenancedValue;
  usableRoofAreaFt2?: ProvenancedValue;
  stories?: number;
  yearBuilt?: number;
  historicDistrict?: string | null;
  energyStarScore?: ProvenancedValue;        // the "before" (HANDSHAKE Building.energyStarScore)
  euiKbtuFt2?: ProvenancedValue;
  coolRoofStatus?: "compliant" | "reroofObligationPending" | "exempt" | "unknown";
  currentRating?: ProvenancedValue;          // 0–100 composite (FINAL §7.8)
}

interface RecommendedPackage {                                 // Doc 03 §2 S2
  packageId: string;
  name: string;
  recommended?: boolean;
  twinState?: { sunTime?: string; layers?: string[]; camera?: number[] };
  interventions: PackagedIntervention[];
}
interface PackagedIntervention {
  key: string;                  // InterventionKey (HANDSHAKE §3.4)
  label?: string;
  surfaceId: string;            // `${buildingId}-${surfaceType}` (HANDSHAKE §1)
  areaFt2?: ProvenancedValue;
  capacityKwDc?: ProvenancedValue;
  placementNote?: string;
}

interface ImpactDeltas {                                       // Doc 03 §2 S3 ≈ BuildingTotals
  stormwaterGalPerStorm?: ProvenancedValue;
  stormwaterGalYr?: ProvenancedValue;
  firstInchCompliance?: boolean | null;     // ← becomes firstInchComplianceGal once PySWMM lands (§2 INBOX)
  solarKwhYr?: ProvenancedValue;
  systemKwDc?: ProvenancedValue;
  energyKwhSavedYr?: ProvenancedValue;
  co2TonsYr?: ProvenancedValue;
  pctOfBuildingLoadOffset?: ProvenancedValue;
  roofTempDropF?: ProvenancedValue;          // illustrative (Doc 03 §5)
  habitatM2Added?: ProvenancedValue;         // illustrative / qualitative (FINAL §7.6)
}

interface CostBlock {                                          // Doc 03 §2 S4
  capexUsd: ProvenancedRange;
  capexByIntervention?: Array<{ key: string; unitCostUsd: number; unit: string; subtotalUsd: ProvenancedRange }>;
  annualSavingsUsd?: {
    energyUsd?: ProvenancedRange;
    avoidedStormwaterFeeUsd?: ProvenancedValue;
    avoidedTreeRecompenseUsd?: ProvenancedValue;
    totalUsd?: ProvenancedRange;
  };
  incentiveStack: IncentiveLine[];
  incentiveTotalUsd?: ProvenancedRange;
  netCapexUsd?: ProvenancedRange;
  paybackYears: ProvenancedRange;            // a BAND (HANDSHAKE §1)
}
interface IncentiveLine {                     // pillar 12 line items
  key: string;                                // "itc" | "ptc" | "179d" | "gaPowerRebate" | "coolRoofExemption" | "treeRecompense" …
  label: string;
  level: "federal" | "state" | "utility" | "city";
  kind?: "credit" | "deduction" | "rebate" | "avoidedCost";
  estValueUsd?: ProvenancedRange;
  requires?: string;
  form?: string | null;
  deadline?: string | null;
  citation: string;
  verify?: boolean;                           // moving-target flag (Doc 03 §5.4)
}

interface FeasibilityBlock {                                   // Doc 03 §2 S5; pillar 11 matrix
  permitabilityConfidence?: "lowRisk" | "mediumRisk" | "highRisk";
  structuralGateStatus?: string;
  codesSatisfied?: CodeRow[];
  codesPreempted?: string[];
  openFlags?: string[];
}
interface CodeRow {
  code: string;
  citation: string;
  role?: "gate" | "carrot" | "gateCarrot" | "constraint";   // pillar 11 GATE/CARROT tagging
  howComplied?: string;
  reviewer?: string;
  status: "met" | "pending" | "needsReview";
}

interface NextSteps {                                         // Doc 03 §2 S6
  rfpScopeLines?: string[];
  incentiveApplications?: Array<{ incentive: string; form?: string | null; prerequisiteArtifact?: string; deadline?: string | null }>;
  agencyHandoffs?: Array<{ phase: number; briefId: string; agency: string; hiredTeam: string }>;
}
```

### 1.3 Fan-out `VendorBrief` types (A1–A6)

Each brief is a **derived projection** of the `MasterReport` (Doc 03 §1) pre-formatted for one hired team / agency. A `MasterReport` carries lightweight references (`generatedBriefs`); the generator materializes a typed `VendorBrief` per reference.

```ts
type BriefId = "A1Structural" | "A2Stormwater" | "A3Tree" | "A4Historic" | "A5Matrix" | "A6Zoning";

interface GeneratedBriefRef {                 // lives on MasterReport.generatedBriefs
  briefId: BriefId | "B1City";
  template: string;                           // §3B template name
  recipient: string;                          // hired team (e.g. "Structural PE")
  agency: string;                             // agency it reaches (e.g. "Office of Buildings")
  conditional: boolean;                       // A4/A6 fire only on parcel flags (Doc 03 §1)
  exportUrl?: string;
}

interface VendorBriefBase {
  briefId: BriefId;
  reportId: string;                           // back-reference to the master
  buildingId: string;
  template: string;
  recipient: string;
  agency: string;
  provenanceFooter: DataProvenanceMap;        // the honesty layer travels with the brief
}

interface StructuralLoadMemo extends VendorBriefBase {        // A1 — always generated (universal gate)
  briefId: "A1Structural";
  roofAreaFt2: ProvenancedValue;
  targetAddedLoadPsf: Range;                  // extensive green roof 15–35 psf
  pvAddedLoadPsf: ProvenancedValue;           // ~3–5 psf — clears trivially (pillar 11)
  precedent?: string;                         // e.g. "Atlanta City Hall: 58 vs 186 psf, no reinforcement"
  peSignatureBlock: { name?: string; license?: string; stampDate?: string };  // blanks for the PE
}
interface StormwaterGiWorksheet extends VendorBriefBase {     // A2 → DWM
  briefId: "A2Stormwater";
  firstInchGal: ProvenancedValue;
  annualGalRetained: ProvenancedValue;
  rvCoefficient: ProvenancedValue;            // Rv = 0.05 + 0.009·%impervious (GSMM Vol.2)
}
interface TreeCreditWorksheet extends VendorBriefBase {       // A3 → City Arborist
  briefId: "A3Tree";
  parkingSpaces: ProvenancedValue;
  treesRequired: ProvenancedValue;            // spaces ÷ 8 (Ch.158 §158-30)
  recompenseAvoidedUsd?: ProvenancedValue;
  plantingCreditFactor?: number;              // 1.25×
}
interface HistoricDesignNarrative extends VendorBriefBase {   // A4 → AUDC (conditional: historicDistrict != null)
  briefId: "A4Historic";
  historicDistrict: string;
  visibilityFromRow?: string;
}
interface CodeComplianceMatrix extends VendorBriefBase {      // A5 → Office of Buildings (the spine, rolls up all evidence)
  briefId: "A5Matrix";
  rows: CodeRow[];                            // requirement → citation → how-complied → reviewer → status
  openFlags: string[];
}
interface ZoningConformanceNarrative extends VendorBriefBase {// A6 → Office of Planning (conditional: zoning trigger)
  briefId: "A6Zoning";
  trigger: string;                            // open-space credit / variance / BeltLine overlay
  fallbackNote?: string;                      // ATL Zoning 2.0 mid-adoption → legacy fallback
}
type VendorBrief =
  | StructuralLoadMemo | StormwaterGiWorksheet | TreeCreditWorksheet
  | HistoricDesignNarrative | CodeComplianceMatrix | ZoningConformanceNarrative;
```

### 1.4 `CityContributionReport` (Side-B / B1)

The **same engine output, re-framed as a contribution ledger** the City books against codified goals (pillar 13). No new pipeline — every number is a projection of `BuildingTotals`.

```ts
interface CityContributionReport {
  briefId: "B1City";
  reportId: string;
  buildingId: string;
  audience: "city";
  preparedFor: string;                        // "City of Atlanta — Mayor's Office of Sustainability & Resilience"
  scorecard: ContributionRow[];               // pillar 13 §1
  cbeeoBenchmarking?: {                        // CBEEO row (≥25,000 ft², annual filing)
    energyStarBefore?: ProvenancedValue;       // ← INBOX field (§2): pull from CBEEO before quoting
    energyStarAfter?: ProvenancedValue;        // ← INBOX field (§2): needs energy model
    euiKbtuFt2Before?: ProvenancedValue;
    euiKbtuFt2After?: ProvenancedValue;
    pctOfBuildingLoadOffset?: ProvenancedValue;
  };
  equityOverlay?: EquityOverlay;               // ← INBOX bundle (§2), pinned-for-later (pillar 13 §8)
  provenanceFooter: DataProvenanceMap;
}
interface ContributionRow {
  metric: string;                             // "~1,665 t CO₂/yr avoided"
  value: ProvenancedValue;
  cityTarget: string;                         // "59% GHG reduction by 2030; net-zero by 2050"
  goalInstrument: string;                     // "Climate Resilient ATL goal #2 / GHG inventory"
}
interface EquityOverlay {                      // all INBOX until the tract join lands
  censusTract?: string;
  energyBurdenPct?: ProvenancedValue;          // DOE LEAD
  heatLstF?: ProvenancedValue;                 // NOAA / Landsat LST
  floodZone?: string;                          // FEMA NFHL / Proctor Creek
  beltlineAdjacent?: boolean;
}
```

---

## 2. THE REPORT CONTENT REGISTRY (the extensible space)

> **This is the "leave a space" the team explicitly asked for, made real.** HANDSHAKE §4.1 is the *inbox table*; this section is the *mechanism* that turns an inbox row into a typed, rendered field. As a source (CBEEO, codes, incentives, equity data, measured retrofit results…) tells us something new to put in a report, **add a row to the registry, promote it, and it flows into the schema and onto the page.** Nothing here is final until it reaches `STABLE`.

### 2.1 The registry entry type

```ts
type RegistryStatus = "INBOX" | "DRAFT" | "STABLE";

interface ReportField {
  /** Field name, units-in-name per HANDSHAKE §1 (e.g. energyStarBefore, firstInchComplianceGal). */
  name: string;
  /** Which report + section it renders into. */
  reportSection:
    | "MasterReport.snapshot" | "MasterReport.impact" | "MasterReport.cost"
    | "MasterReport.feasibility" | "MasterReport.nextSteps"
    | "CityContributionReport.scorecard" | "CityContributionReport.cbeeoBenchmarking"
    | "CityContributionReport.equityOverlay"
    | `VendorBrief.${BriefId}`;
  /** Wire type. Numbers are ProvenancedValue (HANDSHAKE §1). */
  valueType: "ProvenancedValue" | "ProvenancedRange" | "boolean" | "string" | "enum" | "object";
  /** Where the value will come from + when it is available. */
  source: string;
  status: RegistryStatus;
  addedDate: string;                          // ISO 8601
  /** Optional: the canonical credibility basis once known (Doc 03 §5). */
  basis?: CredibilityBasis;
  note?: string;
}

/** The live registry is an array of these — the demo seeds it in code; production reads it from a config. */
type ReportContentRegistry = ReportField[];
```

### 2.2 The promotion process — `INBOX → DRAFT → STABLE`

| Stage | Meaning | Where it lives | What a contributor does |
|---|---|---|---|
| **`INBOX`** | "A source told us X; we want it in a report." Not yet typed or rendered. | A **row in HANDSHAKE §4.1** *and/or* `registryFields` free-map on the report object. | Add the row (name per §1, wrap numbers in `ProvenancedValue`, name the section + source). No schema change yet. |
| **`DRAFT`** | Shape agreed; rendered from the **open `registryFields` map** (§1.2). Visible in reports but flagged `verify: true`, not yet a first-class field. | `MasterReport.registryFields[name]` / equivalent open map on the brief. | Confirm the type + section here in §2.3; wire `buildReport()` to populate `registryFields[name]`; renderer reads it generically. |
| **`STABLE`** | Field has earned a **named slot** in the §1 interfaces + `report.schema.json`. | A typed property on the relevant interface/section. | Add the named property to the TS interface **and** the JSON Schema, move the value out of `registryFields`, bump `schemaVersion`, add a HANDSHAKE Changelog entry. |

**The flow of one field, end to end:**

```
 source lands ("CBEEO row gives us the before-score")
      │
      ▼  add row, status INBOX
 HANDSHAKE §4.1 table  ───────────────────────────────────────────────┐
      │  team agrees name/section/type → status DRAFT                  │ mirror the row
      ▼                                                                ▼
 buildReport() writes report.registryFields["energyStarBefore"]   §2.3 registry table (this doc)
      │  = { value, provenance } (ProvenancedValue)
      │  renderer prints it generically (footer: "modeled, verify")
      │
      ▼  field proves stable → status STABLE
 add `energyStarBefore: ProvenancedValue` to BuildingSnapshot (§1.2)
   + to report.schema.json + bump schemaVersion + HANDSHAKE Changelog
      │
      ▼
 renders as a first-class snapshot row in every report
```

**Rule:** a field is never invented in the schema. It always starts as an `INBOX` row, so the schema only ever hardens fields a real source actually feeds. This keeps the report honest (HANDSHAKE §1: no fabricated numbers) and keeps the open space genuinely open.

### 2.3 Seeded registry — `📥 ADD NEW ROWS HERE`

> Seeded from HANDSHAKE §4.1 plus the pending fields named across pillars 11/12/13. **Future contributors: add a row at the bottom of this table** (and mirror it into HANDSHAKE §4.1 if it is cross-cutting). Keep it sorted by status so the open frontier (`INBOX`) is obvious.

| `name` | `reportSection` | `valueType` | `source` / when available | `status` | `addedDate` |
|---|---|---|---|---|---|
| `energyStarBefore` | `CityContributionReport.cbeeoBenchmarking` + `MasterReport.snapshot` | `ProvenancedValue` | CBEEO / ABID row (pull pending — fixture `energyStarScore` = `gap`) | `INBOX` | 2026-06-16 |
| `energyStarAfter` | `CityContributionReport.cbeeoBenchmarking` | `ProvenancedValue` | Post-retrofit energy model (DOE software, §179D cert) | `INBOX` | 2026-06-16 |
| `euiKbtuFt2Before` / `euiKbtuFt2After` | `CityContributionReport.cbeeoBenchmarking` | `ProvenancedValue` | CBEEO benchmarking export | `INBOX` | 2026-06-16 |
| `firstInchComplianceGal` | `MasterReport.impact` (stormwater/codes) | `ProvenancedValue` | PySWMM (planned) — replaces the boolean `firstInchCompliance` with the actual gal figure | `INBOX` | 2026-06-16 |
| `equityOverlay.energyBurdenPct` | `CityContributionReport.equityOverlay` | `ProvenancedValue` | DOE LEAD, parcel→tract join (pinned, pillar 13 §8) | `INBOX` | 2026-06-16 |
| `equityOverlay.heatLstF` | `CityContributionReport.equityOverlay` | `ProvenancedValue` | NOAA / Landsat LST tract join | `INBOX` | 2026-06-16 |
| `equityOverlay.floodZone` | `CityContributionReport.equityOverlay` | `string` | FEMA NFHL / Proctor Creek | `INBOX` | 2026-06-16 |
| `measuredCo2TonsYr` | `MasterReport.impact` | `ProvenancedValue` | Post-retrofit metered results (flips `co2TonsYr` basis modeled→measured) | `INBOX` | 2026-06-16 |
| `measuredEnergyKwhSavedYr` | `MasterReport.impact` | `ProvenancedValue` | Post-retrofit utility data (CBEEO 12-mo whole-building) | `INBOX` | 2026-06-16 |
| `measuredStormwaterGalYr` | `MasterReport.impact` | `ProvenancedValue` | Post-install monitoring (flips green-roof retention modeled→measured) | `INBOX` | 2026-06-16 |
| `beltlineOverlayLandscapingMin` | `VendorBrief.A6Zoning` | `object` | BeltLine Overlay §16-36.019 (verify vs Ch.158, pillar 11) | `INBOX` | 2026-06-16 |
| `ptcVsItcElection` | `MasterReport.cost` | `enum` (`itc`\|`ptc`) | Tax counsel election (pillar 12 §2.2) | `INBOX` | 2026-06-16 |
| _add new report fields here as sources land →_ | | | | | |

---

## 3. Filled illustrative example — Ansley Mall `MasterReport`

> **⚠️ ILLUSTRATIVE.** Numbers are projections of `src/data/buildings/ansley-mall.json` + pillars 11/12/13. They exemplify the schema; they are **not measured**. They are kept consistent with the fixture: **~1,665 t CO₂/yr, ~4.34 GWh/yr, ~32% load offset, ~2.4M gal/yr, payback band 2.5–8 yr, 30% ITC.** A full machine-readable copy is suitable for `schema/examples/` once that folder exists.

```jsonc
{
  "reportId": "INP-2026-ansley-mall-001",
  "generatedAt": "2026-06-16T14:30:00Z",
  "engineVersion": "0.3.0-hackathon",
  "schemaVersion": "0.1.0",
  "audience": "owner",
  "buildingId": "ansley-mall",

  "dataProvenance": {
    "impact.solarKwhYr":     { "basis": "modeled",      "verify": true,  "citation": "Google Solar API study (fixture)" },
    "impact.co2TonsYr":      { "basis": "modeled",      "verify": true,  "citation": "annualKwh × 0.3837 kg/kWh eGRID SRSO" },
    "impact.roofTempDropF":  { "basis": "illustrative", "verify": true,  "citation": "green ~90°F vs black ~140°F (empirical)" },
    "impact.habitatM2Added": { "basis": "illustrative", "verify": false, "citation": "FINAL §7.6 (qualitative proxy)" },
    "cost.paybackYears":     { "basis": "modeled",      "verify": true,  "citation": "band — sensitive to $/W and $/kWh (pillar 12 §5)" },
    "snapshot.energyStarScore": { "basis": "measured",  "verify": true,  "citation": "GAP — pull CBEEO row before quoting" }
  },

  "snapshot": {
    "parcelId": "ansley-mall",
    "address": "1544 Piedmont Ave NE, Atlanta, GA 30324",
    "location": { "lat": 33.7983, "lon": -84.3711 },
    "roofAreaFt2":     { "value": 215634, "provenance": { "tier": "measured", "source": "Google Earth trace" } },
    "stories": 1,
    "yearBuilt": 1964,
    "historicDistrict": null,
    "energyStarScore": { "value": null, "provenance": { "tier": "gap", "source": "CBEEO", "note": "pull before quoting a 'before' score" } },
    "coolRoofStatus": "reroofObligationPending",
    "currentRating":  { "value": null, "provenance": { "tier": "gap", "source": "composite not yet computed" } }
  },

  "package": {
    "packageId": "ansley-solar-led",
    "name": "Solar-led: rooftop PV + parking-lot canopies + partial green roof + stormwater",
    "recommended": true,
    "twinState": { "sunTime": "2026-06-21T13:00", "layers": ["solar", "drainage"], "camera": [40, 60, 40] },
    "interventions": [
      { "key": "solar",       "label": "Rooftop solar PV",       "surfaceId": "ansley-roof", "capacityKwDc": { "value": 1836, "provenance": { "tier": "fetched", "source": "Google Solar API" } }, "placementNote": "~65% usable roof after fire-access pathways" },
      { "key": "solarCanopy", "label": "Parking-lot solar canopies", "surfaceId": "ansley-lot", "capacityKwDc": { "value": 1400, "provenance": { "tier": "modeled", "source": "research estimate", "note": "pending lot measure" } }, "placementNote": "cars park beneath — no stall loss; coexists w/ 45-ft tree rule" },
      { "key": "greenRoof",   "label": "Extensive green roof (partial, gated)", "surfaceId": "ansley-roof", "areaFt2": { "value": 129000, "provenance": { "tier": "modeled", "source": "60% of roof" } }, "placementNote": "structurally gated on 1964 bar-joist deck — PE memo first" }
    ]
  },

  "impact": {
    "stormwaterGalPerStorm": { "value": 52000,   "provenance": { "tier": "modeled", "source": "research", "note": "first-inch on planted area" } },
    "stormwaterGalYr":       { "value": 2400000, "provenance": { "tier": "modeled", "source": "research", "note": "129k ft² × 50 in/yr × 60% retention" } },
    "firstInchCompliance":   true,
    "solarKwhYr":            { "value": 4338253, "provenance": { "tier": "modeled", "source": "Google Solar API + canopy estimate" } },
    "systemKwDc":            { "value": 3236,    "provenance": { "tier": "modeled", "source": "1836 roof + 1400 canopy" } },
    "co2TonsYr":             { "value": 1665,    "provenance": { "tier": "modeled", "source": "eGRID SRSO 0.3837 kg/kWh" } },
    "pctOfBuildingLoadOffset": { "value": 32,    "provenance": { "tier": "modeled", "source": "4.34 GWh / 13.43 GWh, all self-consumed" } },
    "roofTempDropF":         { "value": 48,      "provenance": { "tier": "default", "source": "empirical literature", "note": "illustrative" } },
    "habitatM2Added":        { "value": 11984,   "provenance": { "tier": "default", "source": "vegetated-area proxy", "note": "qualitative" } }
  },

  "cost": {
    "capexUsd": { "value": { "low": 2800000, "high": 5700000, "basis": "combined roof+canopy; $0.857–$1.75/W" }, "provenance": { "tier": "modeled", "source": "pillar 12 §5.2" } },
    "annualSavingsUsd": {
      "energyUsd": { "value": { "low": 498900, "high": 811253, "basis": "4.34 GWh × $0.115–$0.187/kWh" }, "provenance": { "tier": "modeled", "source": "fixture buildingTotals" } }
    },
    "incentiveStack": [
      { "key": "itc",   "label": "Federal ITC (30%)", "level": "federal", "kind": "credit",   "estValueUsd": { "value": { "low": 833000, "high": 1700000, "basis": "30% of combined solar capex" }, "provenance": { "tier": "modeled", "source": "pillar 12 §2.1" } }, "requires": "PWA compliance (>1 MW); placed in service", "form": "Form 3468", "deadline": "begin construction by Jul 4, 2026 (OBBBA)", "citation": "IRC §48/§48E", "verify": true },
      { "key": "ptc",   "label": "PTC (alternative to ITC)", "level": "federal", "kind": "credit", "estValueUsd": { "value": { "low": 1190000, "high": 1190000, "basis": "$0.0275/kWh × 4.34 GWh × 10 yr" }, "provenance": { "tier": "modeled", "source": "Google study" } }, "requires": "either/or election vs ITC", "citation": "IRC §45/§45Y", "verify": true },
      { "key": "179d",  "label": "§179D EE deduction", "level": "federal", "kind": "deduction", "estValueUsd": { "value": { "low": 125000, "high": 1250000, "basis": "$0.58–$5.81/ft² × 215,634 ft²" }, "provenance": { "tier": "modeled", "source": "pillar 12 §2.3" } }, "requires": "PE-certified ≥25% vs ASHRAE 90.1", "form": "Form 7205", "deadline": "begin construction by Jun 30, 2026 (OBBBA)", "citation": "IRC §179D", "verify": true },
      { "key": "gaPowerRebate", "label": "Georgia Power Commercial EE rebate", "level": "utility", "kind": "rebate", "estValueUsd": { "value": { "low": 100000, "high": 350000, "basis": "program cap/bldg/yr" }, "provenance": { "tier": "fetched", "source": "GA Power CEEP" } }, "requires": "pre-approved qualifying measure (efficiency scope, not PV)", "deadline": "annual program cycle", "citation": "GA Power CEEP", "verify": true },
      { "key": "coolRoofExemption", "label": "Cool-roof exemption (avoided cost)", "level": "city", "kind": "avoidedCost", "requires": "PV/green area documented as exempt", "deadline": "at re-roof", "citation": "Ord. 25-O-1310", "verify": true },
      { "key": "treeRecompense", "label": "Tree-recompense avoidance + 1.25× credit", "level": "city", "kind": "avoidedCost", "requires": "~80 lot trees provided in-kind (arborist)", "citation": "Ch. 158 §158-30", "verify": true }
    ],
    "paybackYears": { "value": { "low": 2.5, "high": 8.0, "basis": "ITC-only; sensitive to $/W and $/kWh — band not point" }, "provenance": { "tier": "modeled", "source": "pillar 12 §5.2" } }
  },

  "feasibility": {
    "permitabilityConfidence": "lowRisk",
    "structuralGateStatus": "PV ~3–5 psf clears trivially. Green roof (15–35 psf) is the gated element on the 1964 bar-joist deck — partial footprint, PE memo pending. Precedent: Atlanta City Hall 58 vs 186 psf, no reinforcement.",
    "codesSatisfied": [
      { "code": "Cool Roof Ordinance", "citation": "25-O-1310", "role": "gateCarrot", "howComplied": "PV + green-roof area exempt; remainder high-SRI cool roof", "reviewer": "Office of Buildings", "status": "met" },
      { "code": "Stormwater first-inch", "citation": "Ch. 74 Art. X", "role": "gateCarrot", "howComplied": "green roof + bioswales/permeable/cistern size the 1.0\"", "reviewer": "DWM", "status": "pending" },
      { "code": "Tree Protection", "citation": "Ch. 158 §158-30", "role": "gate", "howComplied": "~80 lot trees additive; earns 1.25× credit, no recompense", "reviewer": "City Arborist", "status": "pending" },
      { "code": "Structural load", "citation": "2024 IBC + GA amendments", "role": "gate", "howComplied": "PV clears; green roof PE-verified on partial footprint", "reviewer": "Office of Buildings", "status": "needsReview" },
      { "code": "GA Power interconnection", "citation": "RNR tariff", "role": "constraint", "howComplied": "size to self-consume (~32% of load) — no export haircut", "reviewer": "Georgia Power", "status": "pending" }
    ],
    "codesPreempted": ["Future mandatory re-roof cool-roof obligation (converted to compliant amenity)"],
    "openFlags": [
      "Confirm cool-roof exempt-area language in 25-O-1310 [verify]",
      "Confirm DWM stormwater sf applicability threshold [verify]",
      "Confirm GA Power RNR export rate + >100 kW study trigger [verify]",
      "BeltLine Overlay §16-36.019 landscaping min vs Ch.158 [verify]",
      "ITC/§179D begin-construction deadlines (OBBBA) — schedule driver [verify with tax counsel]"
    ]
  },

  "nextSteps": {
    "rfpScopeLines": [
      "Rooftop PV ~1.84 MW DC, ~65% usable roof, code fire-access pathways",
      "Parking-lot solar canopies ~1.4 MW DC, posts clear of stalls and 45-ft tree rule",
      "Extensive green roof ~129,000 ft² (60% of roof), 15–35 psf, partial/PE-verified",
      "Lot stormwater: bioswales + permeable stalls + cistern to size the first 1.0\""
    ],
    "incentiveApplications": [
      { "incentive": "30% ITC (§48)", "form": "Form 3468", "prerequisiteArtifact": "PWA payroll + placed-in-service docs", "deadline": "begin construction by Jul 4, 2026" },
      { "incentive": "§179D",         "form": "Form 7205", "prerequisiteArtifact": "PE energy-model certification (≥25% vs ASHRAE 90.1)", "deadline": "begin construction by Jun 30, 2026" },
      { "incentive": "GA Power CEEP", "form": null, "prerequisiteArtifact": "pre-approved measure application", "deadline": "annual cycle" }
    ],
    "agencyHandoffs": [
      { "phase": 1, "briefId": "A1Structural", "agency": "Office of Buildings", "hiredTeam": "Structural PE (GA-licensed)" },
      { "phase": 2, "briefId": "A2Stormwater", "agency": "DWM",                 "hiredTeam": "Civil/stormwater engineer" },
      { "phase": 2, "briefId": "A3Tree",       "agency": "City Arborist",       "hiredTeam": "Arborist" },
      { "phase": 2, "briefId": "A6Zoning",     "agency": "Office of Planning",  "hiredTeam": "Zoning counsel" },
      { "phase": 3, "briefId": "A5Matrix",     "agency": "Office of Buildings", "hiredTeam": "Law/compliance advisor" }
    ]
  },

  "generatedBriefs": [
    { "briefId": "A1Structural", "template": "B.2 Structural Load Memo", "recipient": "Structural PE",        "agency": "Office of Buildings", "conditional": false, "exportUrl": "/export/INP-2026-ansley-mall-001/A1.pdf" },
    { "briefId": "A2Stormwater", "template": "B.3 GI Sizing Worksheet",  "recipient": "Civil engineer",       "agency": "DWM",                 "conditional": false, "exportUrl": "/export/INP-2026-ansley-mall-001/A2.pdf" },
    { "briefId": "A3Tree",       "template": "B.4 Tree/Planting-Credit",  "recipient": "Arborist",             "agency": "City Arborist",       "conditional": false, "exportUrl": "/export/INP-2026-ansley-mall-001/A3.pdf" },
    { "briefId": "A5Matrix",     "template": "B.1 Code-Compliance Matrix","recipient": "Law/compliance",       "agency": "Office of Buildings", "conditional": false, "exportUrl": "/export/INP-2026-ansley-mall-001/A5.pdf" },
    { "briefId": "A6Zoning",     "template": "B.6 Zoning Conformance",    "recipient": "Zoning counsel",       "agency": "Office of Planning",  "conditional": true,  "exportUrl": "/export/INP-2026-ansley-mall-001/A6.pdf" },
    { "briefId": "B1City",       "template": "City Contribution (Side-B)","recipient": "Mayor's Office (MOSR)", "agency": "City of Atlanta",     "conditional": false, "exportUrl": "/export/INP-2026-ansley-mall-001/B1.pdf" }
  ],

  "registryFields": {
    "//": "DRAFT registry fields render here generically until promoted to STABLE (§2). None populated yet — all seeded fields are still INBOX."
  }
}
```

> **Note (Ansley is NOT historic):** A4 Historic Narrative does **not** generate (`historicDistrict: null`). A6 Zoning **does** (BeltLine Overlay trigger). This is the conditionality rule from Doc 03 §1 firing correctly off the fixture. Note also Ansley is solar-led with a long-payback green roof scoped partial — the band 2.5–8 yr is solar economics; the green roof rides the cool-roof exemption hook rather than a standalone payback.

---

## 4. Provenance & credibility (the honesty layer)

Two orthogonal tags travel with every number; **both** render in the report footer (Doc 03 §5):

1. **`provenance.tier`** (HANDSHAKE §3.1) — *where it came from:* `measured | fetched | modeled | default | gap`. Lives inside every `ProvenancedValue`. `gap` ⇒ `value: null` + a `note` (never a fabricated number).
2. **`credibility.basis`** (this doc, `DataProvenanceMap`) — *how a reader should weight it:* `measured | modeled | illustrative | literature`, plus a `verify` boolean and a `citation`. Keyed by dotted field path.

| Report field | typical `tier` | `basis` | `verify` |
|---|---|---|---|
| `snapshot.roofAreaFt2` | `measured` | `measured` | false |
| `snapshot.energyStarScore` | `gap` → `fetched` once CBEEO lands | `measured` | true |
| `impact.solarKwhYr`, `impact.co2TonsYr` | `modeled` / `fetched` | `modeled` | true (eGRID factor, PVWatts) |
| `impact.roofTempDropF` | `default` | `illustrative` | true |
| `impact.habitatM2Added` | `default` | `illustrative` | false (qualitative, no standard formula) |
| `cost.paybackYears`, `cost.capexUsd` | `modeled` | `modeled` | true ($/W, $/kWh bands) |
| `cost.incentiveStack[].*` (federal) | `modeled`/`fetched` | `literature` | true (OBBBA deadlines, ITC phase-down) |

**`verify: true`** marks moving targets a reviewer must re-confirm at parcel stage (eGRID factor, Rv form, DWM sf threshold, ATL Zoning 2.0, ITC/§179D begin-construction deadlines, GA Power tariff). **Open flags** (`feasibility.openFlags`) surface unknowns rather than hiding them — honesty reads as credibility to both a judge and a real reviewer. The structural gate is treated as binary and first (it never implies feasibility it hasn't earned).

**Lifecycle:** as data lands, `tier` and `basis` flip in lockstep — e.g. `co2TonsYr` goes `modeled/modeled → measured/measured` once post-retrofit metering arrives (which is exactly the `measuredCo2TonsYr` INBOX row in §2.3 promoting to STABLE).

---

## 5. Proposed contract changes (spine touch-points)

Kept consistent with the spine; the following are **proposals** for HANDSHAKE maintainers (do not edit HANDSHAKE without a Changelog bump per its §0 rule):

1. **Casing/shape reconciliation.** `ImplementationPlan/03 §4.1` used `snake_case` + bare scalars; this contract restates the report object as `camelCase` + `ProvenancedValue` to match HANDSHAKE §1. Recommend a one-line note in HANDSHAKE §4 pointing at this doc as canonical for the typed shape (Doc 03 stays canonical for taxonomy/sections/honesty).
2. **`ProvenancedRange` wrapper.** This doc adds `ProvenancedRange = { value: Range | null; provenance; basis? }` so bands (payback, capex) carry provenance like everything else. Candidate for promotion into HANDSHAKE §3.1 alongside `Range`.
3. **`CredibilityBasis` is distinct from `ProvenanceTier`.** Recommend HANDSHAKE §3.1 note that the report layer adds an orthogonal `basis` (`measured|modeled|illustrative|literature`) + `verify` for reader-facing weighting — it does not replace `tier`.
4. **Registry promotion ownership.** HANDSHAKE §4.1 says "`04` owns promotion." This doc §2.2 defines that process; recommend HANDSHAKE §4.1 link to §2.2 explicitly.
5. **Incentive `kind` + `key` vocabulary.** `IncentiveLine.kind` (`credit|deduction|rebate|avoidedCost`) and the `key` set (`itc|ptc|179d|gaPowerRebate|coolRoofExemption|treeRecompense`) are new closed-ish enums introduced here; flag for HANDSHAKE enum registry if they need to be shared.

---

## 6. Changelog
| Date | Version | Change |
|---|---|---|
| 2026-06-16 | 0.1.0 | Initial: MasterReport (6 sections) + VendorBrief A1–A6 + CityContributionReport types; `report.schema.json`; formalized the Report Content Registry (`ReportField`, INBOX→DRAFT→STABLE) seeded from HANDSHAKE §4.1 + pillars; Ansley illustrative example; provenance/credibility layer. |
