/**
 * In-Planted / Climate Resilient ATL — canonical core domain types.
 *
 * THIS FILE IS THE LINGUA-FRANCA SOURCE. It mirrors, verbatim, the canonical
 * types in `contracts/HANDSHAKE.md` §3. The JSON Schema files in
 * `contracts/schema/` and the pydantic models in `contracts/types/domain.py`
 * are generated/maintained to match these shapes exactly. If a shape needs to
 * change, change `HANDSHAKE.md` first, then propagate here.
 *
 * Conventions (HANDSHAKE §1):
 *  - Wire format is JSON, camelCase. Units live in field names (areaM2, annualKwh…).
 *  - Every meaningful number is a {@link ProvenancedValue}, never a bare scalar.
 *  - Unknown values are `null` with `provenance.tier = "gap"` and a note.
 *  - Enums are closed. Adding a value is a Changelog entry in HANDSHAKE §7.
 *
 * @packageDocumentation
 */

// ───────────────────────────────────────────────────────────────────────────
// §3.1 Provenance (wraps almost everything)
// ───────────────────────────────────────────────────────────────────────────

/** How trustworthy a value is. Closed enum (HANDSHAKE §3.1). */
export type ProvenanceTier = "measured" | "fetched" | "modeled" | "default" | "gap";

/** Where a value came from and how it was obtained. */
export interface Provenance {
  /** How trustworthy the value is. */
  tier: ProvenanceTier;
  /** Human/source label, e.g. "NREL PVWatts v8", "Google Solar API", "eGRID SRSO". */
  source: string;
  /** How it was computed, e.g. "PySAM pvwattsv8", "polygon trace". */
  method?: string;
  /** ISO 8601 date the value was obtained/computed. */
  date?: string;
  /** Free-text caveat or explanation (required when tier = "gap"). */
  note?: string;
}

/**
 * A value plus its provenance. The project-wide rule: every meaningful number
 * is wrapped in this, not emitted as a raw scalar. Use `value: null` +
 * `provenance.tier = "gap"` for unknowns — never fabricate a number.
 *
 * @typeParam T - the wrapped value type (defaults to `number`).
 */
export interface ProvenancedValue<T = number> {
  /** The value, or `null` when unknown (then provenance.tier must be "gap"). */
  value: T | null;
  provenance: Provenance;
  /** Optional basis string, e.g. "2024 USD", "annualKwh x 0.3837 kg/kWh". */
  basis?: string;
}

/** A low/high band — used where we present a range, not false precision. */
export interface Range {
  low: number;
  high: number;
  /** Optional explanation of what drives the spread. */
  basis?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// §3.2 Geometry primitives
// ───────────────────────────────────────────────────────────────────────────

/** A WGS84 lat/lon point. */
export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Surface orientation. azimuthDeg 180 = due south. */
export interface Orientation {
  azimuthDeg: number;
  tiltDeg: number;
}

/** Kinds of building surface an intervention can apply to. Closed enum. */
export type SurfaceType = "roof" | "facade" | "parking" | "perimeter";

// ───────────────────────────────────────────────────────────────────────────
// §3.3 CandidateSurface
// ───────────────────────────────────────────────────────────────────────────

/** A surface of a building the engine can place interventions on. */
export interface CandidateSurface {
  /** `${buildingId}-${type}`, e.g. "ansley-mall-roof". */
  id: string;
  type: SurfaceType;
  /** Gross area. */
  areaM2: ProvenancedValue;
  /** Net area after setbacks/obstructions. */
  usableAreaM2?: ProvenancedValue;
  orientation?: Orientation;
  /** 0–100, percent impervious; feeds the stormwater runoff coefficient (Rv). */
  imperviousPct?: number;
  /** 0–1 annual sun exposure fraction (optional). */
  sunExposure?: number;
  /** Structural gate input: allowed added load. */
  addedLoadCapacityPsf?: ProvenancedValue;
  /** Populated by the eligibility gate (Doc 04). */
  allowedInterventions: InterventionKey[];
  /** 3D twin label anchor [x, y, z] (optional). */
  sceneAnchor?: [number, number, number];
}

// ───────────────────────────────────────────────────────────────────────────
// §3.4 Intervention
// ───────────────────────────────────────────────────────────────────────────

/** The closed catalog of intervention kinds (HANDSHAKE §3.4). */
export type InterventionKey =
  | "solar"
  | "solarCanopy"
  | "greenRoof"
  | "coolRoof"
  | "cistern"
  | "bioswale"
  | "permeablePaving"
  | "lotTrees"
  | "shadeLattice"
  | "pollinatorLandscaping"
  | "agriculture"
  | "evCharging";

/** The objectives an intervention can address. Closed enum. */
export type Objective =
  | "solar"
  | "stormwater"
  | "heat"
  | "carbon"
  | "energy"
  | "biodiversity";

/** A static intervention definition (catalog entry, not an instance). */
export interface Intervention {
  key: InterventionKey;
  label: string;
  appliesTo: SurfaceType[];
  addressesObjectives: Objective[];
  /** Dead/live load the intervention adds (structural gate). */
  loadPsf?: number;
  /** $/m² or $/W per the intervention; the basis lives in provenance. */
  unitCost?: ProvenancedValue;
}

// ───────────────────────────────────────────────────────────────────────────
// §3.5 Building
// ───────────────────────────────────────────────────────────────────────────

/** A building's location, optionally carrying its own provenance. */
export type BuildingLocation = GeoPoint & { provenance?: Provenance };

/** A building and its candidate surfaces — the primary input to the engine. */
export interface Building {
  /** Kebab slug, e.g. "ansley-mall". */
  id: string;
  name: string;
  owner?: string;
  address?: string;
  /** Selects climate/incentives config, e.g. "atlanta". */
  city: string;
  location: BuildingLocation;
  yearBuilt?: number;
  stories?: number;
  roofAreaM2?: number;
  /** The "before" ENERGY STAR score. */
  energyStarScore?: ProvenancedValue;
  annualElectricityUseKwh?: ProvenancedValue;
  surfaces: CandidateSurface[];
  /** This contract's version (HANDSHAKE §1 versioning rule). */
  schemaVersion: string;
}

// ───────────────────────────────────────────────────────────────────────────
// §3.6 Score, BuildingTotals (engine output — full contract in `02`)
// ───────────────────────────────────────────────────────────────────────────

/** The metrics computed for one (surface × intervention) pairing. */
export interface MetricBundle {
  solarKwhYr?: number;
  stormwaterGalYr?: number;
  heatDeltaF?: number;
  energyKwhYr?: number;
  energyUsdYr?: number;
  carbonTonsYr?: number;
  biodiversityM2?: number;
  /** Capex as a point estimate or a band. */
  capexUsd?: number | Range;
  incentivesUsd?: number;
  /** Payback as a point estimate or a band. */
  paybackYears?: number | Range;
}

/** Feasibility verdict attached to a Score. */
export interface Feasibility {
  permitable: boolean;
  notes: string[];
}

/** The engine's per-(surface × intervention) score. */
export interface Score {
  surfaceId: string;
  intervention: InterventionKey;
  metrics: MetricBundle;
  /** 0–1 per sub-metric (min-max normalized across the building's candidates). */
  normalized: Record<string, number>;
  /** Weighted composite (Doc 01 §7.8). */
  composite: number;
  feasibility?: Feasibility;
}

/** Building-level rollups across the recommended package. */
export interface BuildingTotals {
  combinedSolarKwDc?: number;
  combinedAnnualKwh?: number;
  combinedCo2TonsYr?: number;
  stormwaterGalYr?: number;
  /** 0–100, share of building electricity load offset. */
  pctOfBuildingLoadOffset?: number;
  annualEnergySavingsUsd?: Range;
  paybackYearsRange?: Range;
}

/** The full output of `runEngine` for one building. */
export interface EngineResult {
  buildingId: string;
  /** Same inputs + same engineVersion ⇒ identical outputs (determinism). */
  engineVersion: string;
  schemaVersion: string;
  surfaceScores: Score[];
  ranked: Score[];
  buildingTotals: BuildingTotals;
  /** Sun-slider live values (Doc 01 §4). */
  timeDependent?: unknown;
}

// ───────────────────────────────────────────────────────────────────────────
// §3.7 Worker envelope (every Python calc worker returns this)
// ───────────────────────────────────────────────────────────────────────────

/**
 * The standard envelope every Python calc worker returns.
 * @typeParam TResult - the worker-specific payload (e.g. {@link SolarResult}).
 */
export interface WorkerResult<TResult = unknown> {
  /** Worker name, e.g. "solar_pysam". */
  worker: string;
  workerVersion: string;
  /** Content hash of the inputs, for content-addressed caching (arch/03). */
  inputHash: string;
  result: TResult;
  provenance: Provenance;
  warnings?: string[];
  /** ISO 8601. */
  computedAt: string;
}

/** Assumptions the solar model ran under. */
export interface SolarAssumptions {
  tiltDeg: number;
  azimuthDeg: number;
  lossesPct: number;
  /** PVWatts/PySAM array_type code. */
  arrayType: number;
  /** PVWatts/PySAM module_type code. */
  moduleType: number;
  gridFactorKgPerKwh: number;
}

/** Canonical solar payload — the PySAM worker MUST emit this (see 02). */
export interface SolarResult {
  surfaceId: string;
  systemCapacityKwDc: number;
  acAnnualKwh: number;
  /** Length 12. */
  acMonthlyKwh: number[];
  capacityFactor: number;
  /** acAnnualKwh × grid factor (eGRID/Cambium). */
  co2AvoidedTonsYr: number;
  assumptions: SolarAssumptions;
}
