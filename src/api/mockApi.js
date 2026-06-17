/* ----------------------------------------------------------------------------
   Mock API — the front-end-only "backend" for the demo.

   This module is the ONE seam the views talk to. It mirrors the PLANNED REST
   contract (contracts/03_api-endpoints.md) so it can later be swapped for a real
   fetch() client with no view changes:
       getBuilding(id)            ≈ GET  /v1/buildings/{id}
       getScores(id, keys)        ≈ GET  /v1/buildings/{id}/scores
       generateReport(id, opts)   ≈ POST /v1/buildings/{id}/reports
       login(role) / getSession() ≈ POST /v1/auth/token
       getCityPortfolio()         ≈ GET  /v1/cities/{id}/contribution

   "Config stored in backend per user" (Q25) is emulated with localStorage,
   namespaced per session, behind the saveConfig/loadConfig calls.
---------------------------------------------------------------------------- */

import building from "../data/buildings/ansley-mall.json";
import { computeTotals, ENGINE_VERSION, impactSentence } from "../engine/scoring.js";
import { PACKAGE_BY_ID, matchPackage } from "../engine/packages.js";

const LATENCY_MS = 180; // simulate a network hop so loading states are real
const delay = (v) => new Promise((res) => setTimeout(() => res(v), LATENCY_MS));

const LS = {
  session: "inplanted.session",
  config: (uid) => `inplanted.config.${uid}`,
};

/* ── auth / session ──────────────────────────────────────────────────────── */

const USERS = {
  owner: {
    userId: "selig-ent",
    role: "owner",
    displayName: "Selig Enterprises",
    subtitle: "Asset Management · Ansley Mall",
  },
  city: {
    userId: "atl-mosr",
    role: "city",
    displayName: "City of Atlanta",
    subtitle: "Mayor's Office of Sustainability & Resilience",
  },
};

export async function login(role) {
  const user = USERS[role];
  if (!user) throw new Error("unknown_role");
  localStorage.setItem(LS.session, JSON.stringify(user));
  return delay(user);
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(LS.session) || "null");
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(LS.session);
}

/* ── per-user config persistence (Q25) ───────────────────────────────────── */

export function saveConfig(userId, config) {
  if (!userId) return;
  localStorage.setItem(LS.config(userId), JSON.stringify(config));
}

export function loadConfig(userId) {
  if (!userId) return null;
  try {
    return JSON.parse(localStorage.getItem(LS.config(userId)) || "null");
  } catch {
    return null;
  }
}

/* ── buildings ───────────────────────────────────────────────────────────── */

/** The hero building. Returns a shallow clone so callers can't mutate the fixture. */
export async function getBuilding(id = "ansley-mall") {
  if (id !== building.id) throw new Error("building_not_found");
  return delay(structuredClone(building));
}

/** List buildings for the tenant (one hero case in the MVP — Q22). */
export async function listBuildings() {
  return delay([
    {
      id: building.id,
      name: building.name,
      owner: building.owner,
      address: building.address,
      district: building.district,
      roofAreaFt2: building.roofAreaFt2,
      energyStarScore: 63,
    },
  ]);
}

/** Run the shared engine over an active set. ≈ GET /scores. */
export async function getScores(id, activeKeys) {
  if (id !== building.id) throw new Error("building_not_found");
  const totals = computeTotals(activeKeys);
  return delay({
    buildingId: id,
    engineVersion: ENGINE_VERSION,
    packageId: matchPackage(activeKeys),
    totals,
    sentence: impactSentence(totals),
  });
}

/* ── reports / dossier ───────────────────────────────────────────────────── */

/**
 * Build the MasterReport-shaped object the dossier renders
 * (contracts/04_report-schema.md §1.2). Numbers come from the engine; words +
 * citations come from the building fixture's codes / incentives / cityContribution.
 */
export async function generateReport(id, { audience = "owner", packageId = "B", activeKeys } = {}) {
  if (id !== building.id) throw new Error("building_not_found");
  const pkg = PACKAGE_BY_ID[packageId];
  const keys = activeKeys || pkg?.activeKeys || [];
  const totals = computeTotals(keys);

  const report = {
    reportId: `INP-2026-${id}-001`,
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    schemaVersion: "0.1.0",
    audience,
    buildingId: id,
    package: {
      packageId: packageId,
      name: pkg ? pkg.name : "Custom",
      tagline: pkg?.tagline,
      interventions: totals.perIntervention,
    },
    snapshot: {
      address: building.address,
      owner: building.owner,
      location: building.location,
      yearBuilt: building.yearBuilt,
      stories: building.stories,
      roofAreaFt2: building.roofAreaFt2,
      energyStarScore: 63,
      euiKbtuFt2: 58,
      coolRoofStatus: "reroofObligationPending",
    },
    impact: totals,
    cost: {
      capexUsd: totals.capexUsd,
      annualSavingsUsd: totals.annualSavingsUsd,
      incentiveStack: building.incentives,
      itcUsd: totals.incentives.itcUsd,
      netSolarCapexUsd: totals.incentives.netSolarCapexUsd,
      paybackYears: totals.paybackYears,
    },
    feasibility: {
      permitabilityConfidence: "lowRisk",
      codes: building.codes,
    },
    cityContribution: building.cityContribution,
    sentence: impactSentence(totals),
  };
  return delay(report);
}

/* ── city / portfolio (Side-B) ───────────────────────────────────────────── */

/** Side-B contribution view data. The hero building's totals re-framed as a
 *  ledger against the city's codified climate goals (report-schema §1.4). */
export async function getCityPortfolio() {
  const heroTotals = computeTotals(PACKAGE_BY_ID.B.activeKeys);
  const cc = building.cityContribution;
  return delay({
    preparedFor: "City of Atlanta — Mayor's Office of Sustainability & Resilience",
    plan: cc.plan,
    scorecard: [
      {
        metric: "CO₂ avoided",
        value: heroTotals.co2TonsYr,
        unit: "t/yr",
        cityTarget: "59% GHG reduction by 2030; net-zero by 2050",
        goalInstrument: "Climate Resilient ATL — GHG inventory",
      },
      {
        metric: "On-site clean energy",
        value: heroTotals.annualKwh / 1e6,
        unit: "GWh/yr",
        cityTarget: "100% clean energy by 2035",
        goalInstrument: "Clean Energy Atlanta",
      },
      {
        metric: "Stormwater managed",
        value: heroTotals.stormwaterGalYr / 1e6,
        unit: "M gal/yr",
        cityTarget: "Citywide green-infrastructure target (1″ on-site)",
        goalInstrument: "Post-Development Stormwater Ordinance",
      },
      {
        metric: "Building load offset",
        value: heroTotals.pctOfBuildingLoadOffset,
        unit: "%",
        cityTarget: "Commercial Buildings Energy Efficiency (CBEEO)",
        goalInstrument: "BenchmarkATL",
      },
    ],
    // Applications "in the queue" the city sees (one real + seeded context).
    applications: [
      {
        id: "APP-2026-001",
        building: "Ansley Mall",
        owner: "Selig Enterprises",
        district: "Piedmont Heights / BeltLine",
        package: "Balanced (B)",
        status: "Dossier submitted",
        co2TonsYr: heroTotals.co2TonsYr,
        energyStarBefore: 63,
        flags: ["CBEEO ≥25k ft²", "Cool-roof exemption", "1″ stormwater"],
      },
      {
        id: "APP-2026-002",
        building: "Ponce City Market (context)",
        owner: "Jamestown",
        district: "Old Fourth Ward / BeltLine",
        package: "—",
        status: "Benchmarked, no application",
        co2TonsYr: null,
        energyStarBefore: 71,
        flags: ["ENERGY STAR certified"],
      },
    ],
    // Proactive measures the city can push (Q19).
    proactive: [
      "Flag CBEEO buildings ≥25k ft² with ENERGY STAR < 75 for outreach (Ansley: 63).",
      "Promote the cool-roof re-roof exemption as a carrot for solar/green-roof adopters.",
      "Target BeltLine-adjacent parcels for heat-island + green-corridor stacking.",
      "Pre-clear the 1″ stormwater GI pathway for large impervious retail lots.",
    ],
    beltline: cc.beltline,
  });
}
