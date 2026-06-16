"""In-Planted / Climate Resilient ATL — canonical core domain types (pydantic v2).

This module mirrors, shape-for-shape, the canonical TypeScript types in
`contracts/types/domain.ts` and the JSON Schema in `contracts/schema/`, which
in turn mirror `contracts/HANDSHAKE.md` §3. HANDSHAKE is the source of truth.

Casing handshake (HANDSHAKE §1):
  - The wire (JSON) is **camelCase**. Python is **snake_case** internally.
  - `BaseSchema` below configures `alias_generator=to_camel` + `populate_by_name`,
    so every field is read/written as camelCase on the wire but accessed as
    snake_case in Python. Always serialize with `model_dump(by_alias=True)` /
    `model_dump_json(by_alias=True)` so the pipeline emits camelCase JSON that
    validates against the JSON Schemas.

Provenance rule: every meaningful number is a `ProvenancedValue`. Unknown values
use `value=None` with `provenance.tier="gap"` and a `note` — never a fabricated
number.

Requires: pydantic>=2.
"""

from __future__ import annotations

from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

# ---------------------------------------------------------------------------
# Base config: snake_case (Python) <-> camelCase (JSON wire)
# ---------------------------------------------------------------------------


class BaseSchema(BaseModel):
    """Base for all domain models: camelCase aliases, populate-by-name, strict extras."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
    )


# ---------------------------------------------------------------------------
# §3.1 Provenance
# ---------------------------------------------------------------------------

ProvenanceTier = Literal["measured", "fetched", "modeled", "default", "gap"]


class Provenance(BaseSchema):
    """Where a value came from and how it was obtained."""

    tier: ProvenanceTier
    source: str
    method: Optional[str] = None
    date: Optional[str] = None  # ISO 8601
    note: Optional[str] = None


class ProvenancedValue(BaseSchema):
    """A value plus its provenance. `value` is None only when tier == 'gap'."""

    value: Optional[Union[float, str, bool]] = None
    provenance: Provenance
    basis: Optional[str] = None


class Range(BaseSchema):
    """A low/high band — we present ranges, not false precision."""

    low: float
    high: float
    basis: Optional[str] = None


# ---------------------------------------------------------------------------
# §3.2 Geometry primitives
# ---------------------------------------------------------------------------


class GeoPoint(BaseSchema):
    """A WGS84 lat/lon point."""

    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class Orientation(BaseSchema):
    """Surface orientation. azimuth_deg 180 = due south."""

    azimuth_deg: float = Field(ge=0, le=360)
    tilt_deg: float = Field(ge=0, le=90)


SurfaceType = Literal["roof", "facade", "parking", "perimeter"]


# ---------------------------------------------------------------------------
# §3.4 Intervention enums
# ---------------------------------------------------------------------------

InterventionKey = Literal[
    "solar",
    "solarCanopy",
    "greenRoof",
    "coolRoof",
    "cistern",
    "bioswale",
    "permeablePaving",
    "lotTrees",
    "shadeLattice",
    "pollinatorLandscaping",
    "agriculture",
    "evCharging",
]

Objective = Literal["solar", "stormwater", "heat", "carbon", "energy", "biodiversity"]


# ---------------------------------------------------------------------------
# §3.3 CandidateSurface
# ---------------------------------------------------------------------------


class CandidateSurface(BaseSchema):
    """A surface of a building the engine can place interventions on."""

    id: str  # `${building_id}-${type}`
    type: SurfaceType
    area_m2: ProvenancedValue
    usable_area_m2: Optional[ProvenancedValue] = None
    orientation: Optional[Orientation] = None
    impervious_pct: Optional[float] = Field(default=None, ge=0, le=100)
    sun_exposure: Optional[float] = Field(default=None, ge=0, le=1)
    added_load_capacity_psf: Optional[ProvenancedValue] = None
    allowed_interventions: list[InterventionKey] = Field(default_factory=list)
    scene_anchor: Optional[tuple[float, float, float]] = None


# ---------------------------------------------------------------------------
# §3.4 Intervention (catalog definition)
# ---------------------------------------------------------------------------


class Intervention(BaseSchema):
    """A static intervention definition (catalog entry, not an instance)."""

    key: InterventionKey
    label: str
    applies_to: list[SurfaceType] = Field(default_factory=list)
    addresses_objectives: list[Objective] = Field(default_factory=list)
    load_psf: Optional[float] = None
    unit_cost: Optional[ProvenancedValue] = None


# ---------------------------------------------------------------------------
# §3.5 Building
# ---------------------------------------------------------------------------


class BuildingLocation(GeoPoint):
    """A building location, optionally carrying its own provenance."""

    provenance: Optional[Provenance] = None


class Building(BaseSchema):
    """A building and its candidate surfaces — the primary input to the engine."""

    id: str  # kebab slug
    name: str
    owner: Optional[str] = None
    address: Optional[str] = None
    city: str  # selects climate/incentives config
    location: BuildingLocation
    year_built: Optional[int] = None
    stories: Optional[int] = None
    roof_area_m2: Optional[float] = None
    energy_star_score: Optional[ProvenancedValue] = None
    annual_electricity_use_kwh: Optional[ProvenancedValue] = None
    surfaces: list[CandidateSurface] = Field(default_factory=list)
    schema_version: str


# ---------------------------------------------------------------------------
# §3.6 Score, BuildingTotals, EngineResult
# ---------------------------------------------------------------------------

NumberOrRange = Union[float, Range]


class MetricBundle(BaseSchema):
    """The metrics computed for one (surface × intervention) pairing."""

    solar_kwh_yr: Optional[float] = None
    stormwater_gal_yr: Optional[float] = None
    heat_delta_f: Optional[float] = None
    energy_kwh_yr: Optional[float] = None
    energy_usd_yr: Optional[float] = None
    carbon_tons_yr: Optional[float] = None
    biodiversity_m2: Optional[float] = None
    capex_usd: Optional[NumberOrRange] = None
    incentives_usd: Optional[float] = None
    payback_years: Optional[NumberOrRange] = None


class Feasibility(BaseSchema):
    """Feasibility verdict attached to a Score."""

    permitable: bool
    notes: list[str] = Field(default_factory=list)


class Score(BaseSchema):
    """The engine's per-(surface × intervention) score."""

    surface_id: str
    intervention: InterventionKey
    metrics: MetricBundle
    normalized: dict[str, float] = Field(default_factory=dict)  # 0-1 per sub-metric
    composite: float
    feasibility: Optional[Feasibility] = None


class BuildingTotals(BaseSchema):
    """Building-level rollups across the recommended package."""

    combined_solar_kw_dc: Optional[float] = None
    combined_annual_kwh: Optional[float] = None
    combined_co2_tons_yr: Optional[float] = None
    stormwater_gal_yr: Optional[float] = None
    pct_of_building_load_offset: Optional[float] = Field(default=None, ge=0, le=100)
    annual_energy_savings_usd: Optional[Range] = None
    payback_years_range: Optional[Range] = None


class EngineResult(BaseSchema):
    """The full output of runEngine for one building."""

    building_id: str
    engine_version: str
    schema_version: str
    surface_scores: list[Score] = Field(default_factory=list)
    ranked: list[Score] = Field(default_factory=list)
    building_totals: BuildingTotals
    time_dependent: Optional[Any] = None  # sun-slider live values (Doc 01 §4)


# ---------------------------------------------------------------------------
# §3.7 Worker envelope + SolarResult
# ---------------------------------------------------------------------------


class SolarAssumptions(BaseSchema):
    """Assumptions the solar model ran under."""

    tilt_deg: float
    azimuth_deg: float
    losses_pct: float
    array_type: int
    module_type: int
    grid_factor_kg_per_kwh: float


class SolarResult(BaseSchema):
    """Canonical solar payload — the PySAM worker MUST emit this."""

    surface_id: str
    system_capacity_kw_dc: float = Field(ge=0)
    ac_annual_kwh: float = Field(ge=0)
    ac_monthly_kwh: list[float] = Field(min_length=12, max_length=12)
    capacity_factor: float = Field(ge=0, le=1)
    co2_avoided_tons_yr: float = Field(ge=0)
    assumptions: SolarAssumptions


class WorkerResult(BaseSchema):
    """Standard envelope every Python calc worker returns.

    `result` is worker-specific; the solar worker sets it to a `SolarResult`.
    Kept as `Any` here so the envelope is reusable across workers; validate the
    payload against its own model/schema downstream.
    """

    worker: str
    worker_version: str
    input_hash: str
    result: Any
    provenance: Provenance
    warnings: Optional[list[str]] = None
    computed_at: str  # ISO 8601
