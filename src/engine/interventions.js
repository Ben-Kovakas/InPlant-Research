/* ----------------------------------------------------------------------------
   Intervention catalog — In-Planted / Climate-Resilient ATL
   The toggleable retrofit pieces for the Ansley Mall hero case.

   Each entry carries the canonical per-intervention numbers (sourced from
   src/data/buildings/ansley-mall.json + the report schema). The scoring engine
   (scoring.js) sums the ACTIVE entries to produce live building totals — this is
   what makes the on-screen toggles change prices/credits (Play-with-Purpose Q15).

   When every layer is ON the sums reproduce the fixture's buildingTotals exactly:
     solar 3,236 kW · 4.34 GWh · 1,665 t CO2 · 32% offset · 2.4M gal · 2.5–8 yr.

   `layerKey` is the visual layer key the 3D twin (TwinCanvas) toggles.
---------------------------------------------------------------------------- */

export const INTERVENTIONS = [
  {
    key: "roofSolar",
    layerKey: "roofSolar",
    label: "Rooftop Solar PV",
    short: "Rooftop PV",
    blurb: "Glassy PV grids across the usable roof planes (~65% after fire-access pathways).",
    surfaceId: "ansley-roof",
    objectives: ["solar", "carbon", "energy"],
    capacityKwDc: 1836,
    annualKwh: 2378253,
    co2TonsYr: 913,
    stormwaterGalYr: 0,
    treeCount: 0,
    capexUsd: { low: 1573752, high: 3213613, basis: "$0.857–$1.75/W × 1.836 MW" },
    eligible: true,
    feasibilityNote: "PV ~3–5 psf clears the 1964 structural gate trivially.",
    provenance: "Google Solar API study",
  },
  {
    key: "lotCanopySolar",
    layerKey: "lotCanopySolar",
    label: "Parking-Lot Solar Canopies",
    short: "Lot canopies",
    blurb: "Angled carport canopies over parking — cars park beneath, no stall loss. Our value-add (Google modeled 0 W on the lot).",
    surfaceId: "ansley-lot",
    objectives: ["solar", "carbon", "energy", "heat"],
    capacityKwDc: 1400,
    annualKwh: 1960000,
    co2TonsYr: 752,
    stormwaterGalYr: 0,
    treeCount: 0,
    capexUsd: { low: 1199800, high: 2450000, basis: "$0.857–$1.75/W × 1.4 MW (est., pending lot measure)" },
    eligible: true,
    feasibilityNote: "Posts clear of stalls and the 45-ft tree rule; hosts EV charging + stormwater routing.",
    provenance: "research estimate",
  },
  {
    key: "greenRoof",
    layerKey: "greenRoof",
    label: "Extensive Green Roof (partial)",
    short: "Green roof",
    blurb: "Planted band on ~60% of the roof for stormwater retention. Structurally gated on the 1964 bar-joist deck — PE memo first.",
    surfaceId: "ansley-roof",
    objectives: ["stormwater", "heat", "biodiversity"],
    capacityKwDc: 0,
    annualKwh: 0,
    co2TonsYr: 0,
    stormwaterGalYr: 2400000,
    firstInchStormGal: 52000,
    treeCount: 0,
    roofTempDropF: 48,
    habitatM2Added: 11984,
    capexUsd: { low: 1900000, high: 3225000, basis: "~$15–$25/ft² × 129,000 ft²" },
    eligible: true,
    feasibilityNote: "15–35 psf — partial footprint, PE-verified. Rides the cool-roof exemption rather than a standalone payback.",
    provenance: "research (129k ft² × 50 in/yr × 60% retention)",
  },
  {
    key: "stormwaterTrees",
    layerKey: "stormwaterTrees",
    label: "Stormwater Trees + Bioswales",
    short: "Trees / bioswales",
    blurb: "~80 lot trees (Ch.158: 1 tree / 8 spaces) + bioswale channels. Earns a 1.25× planting credit, avoids tree recompense.",
    surfaceId: "ansley-lot",
    objectives: ["stormwater", "heat", "biodiversity"],
    capacityKwDc: 0,
    annualKwh: 0,
    co2TonsYr: 0,
    stormwaterGalYr: 180000,
    firstInchStormGal: 24000,
    treeCount: 80,
    capexUsd: { low: 120000, high: 240000, basis: "~80 trees + bioswale grading @ $1.5–3k each" },
    eligible: true,
    feasibilityNote: "Additive to the parking lot; satisfies Tree Protection Ch.158 §158-30.",
    provenance: "Tree Protection Ch. 158 §158-30",
  },
  {
    key: "beltline",
    layerKey: "beltline",
    label: "BeltLine Lattice Corridor",
    short: "BeltLine corridor",
    blurb: "Planted west-edge green corridor + shade lattice adjoining the Atlanta BeltLine. Heat-island + green-corridor contribution.",
    surfaceId: "ansley-beltline-edge",
    objectives: ["heat", "biodiversity"],
    capacityKwDc: 0,
    annualKwh: 0,
    co2TonsYr: 0,
    stormwaterGalYr: 60000,
    treeCount: 0,
    capexUsd: { low: 90000, high: 180000, basis: "linear planting + pollinator landscaping (qualitative)" },
    eligible: true,
    feasibilityNote: "Walls < 40 ft clear the NFPA-285 fire gate; pedestrian-zone shade lattice.",
    provenance: "qualitative / BeltLine overlay",
  },
];

/** Convenience: lookup by key. */
export const INTERVENTION_BY_KEY = Object.fromEntries(
  INTERVENTIONS.map((i) => [i.key, i])
);

/** All intervention keys, in display order. */
export const INTERVENTION_KEYS = INTERVENTIONS.map((i) => i.key);

/** Economic + grid constants (documented assumptions — Play-with-Purpose Q14). */
export const CONSTANTS = {
  baselineAnnualElectricityKwh: 13428838, // fixture annualElectricityUseKwh (Google)
  baselineStormwaterTargetGal1in: 434900, // PDF baseline_annual_stormwater_target_gal_1in
  electricityRateUsdPerKwh: { low: 0.115, high: 0.187 }, // research → Google
  gridFactorKgPerKwh: 0.3837, // eGRID SRSO
  itcRate: 0.3, // 30% federal Investment Tax Credit
  baselineEnergyStarScore: 63, // PDF baseline_energy_star_score
  energyStarCertThreshold: 75,
  baselineEuiKbtuPerSfYr: 58, // PDF baseline_eui
};
