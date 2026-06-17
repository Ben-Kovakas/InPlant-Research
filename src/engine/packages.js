/* ----------------------------------------------------------------------------
   Retrofit packages — the stubbed "preferred priority" presets (Q13).
   Each package is just a named set of active intervention keys + a priority
   framing. Package B (Balanced) is the hero default (fixture hero_defaults).
   The owner can also free-toggle, which puts them in the "Custom" package.
---------------------------------------------------------------------------- */

export const PACKAGES = [
  {
    id: "A",
    name: "Solar-First",
    priority: "ROI",
    tagline: "Maximize generation & payback",
    blurb: "Rooftop PV + lot canopies. Fastest payback, biggest CO₂ cut. Defers the structurally-gated green roof.",
    activeKeys: ["roofSolar", "lotCanopySolar"],
  },
  {
    id: "B",
    name: "Balanced",
    priority: "Balanced",
    tagline: "City-ready, well-rounded (recommended)",
    recommended: true,
    blurb: "Solar + partial green roof + stormwater trees. Hits energy, water, and heat goals at once — the city-ready package.",
    activeKeys: ["roofSolar", "lotCanopySolar", "greenRoof", "stormwaterTrees"],
  },
  {
    id: "C",
    name: "Resilience-Max",
    priority: "Impact / Water",
    tagline: "Every lever, full climate resilience",
    blurb: "All interventions including the BeltLine corridor. Maximum stormwater + heat-island + biodiversity contribution.",
    activeKeys: ["roofSolar", "lotCanopySolar", "greenRoof", "stormwaterTrees", "beltline"],
  },
];

export const PACKAGE_BY_ID = Object.fromEntries(PACKAGES.map((p) => [p.id, p]));

export const DEFAULT_PACKAGE_ID = "B";

/** Given a set of active keys, return the matching package id, or "custom". */
export function matchPackage(activeKeys = []) {
  const a = [...activeKeys].sort().join(",");
  const found = PACKAGES.find(
    (p) => [...p.activeKeys].sort().join(",") === a
  );
  return found ? found.id : "custom";
}
