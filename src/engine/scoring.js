/* ----------------------------------------------------------------------------
   Scoring engine — In-Planted / Climate-Resilient ATL
   Pure functions. No React, no DOM. Given a set of ACTIVE intervention keys,
   compute the live building totals + the 5 key numbers the owner walks away with
   (Play-with-Purpose Q17): kWh/yr, capex range, simple payback, gallons/yr,
   % of the 1" storm addressed, plus CO2, offset %, incentives.

   This is the front-end "engine" the mock API runs (mockApi.getScores). It is
   intentionally additive + deterministic so the same active set always yields the
   same EngineResult — and so toggling a layer instantly re-prices the package.
---------------------------------------------------------------------------- */

import { INTERVENTIONS, INTERVENTION_BY_KEY, CONSTANTS } from "./interventions.js";

export const ENGINE_VERSION = "0.3.0-hackathon";

const round = (n) => Math.round(n);
const round1 = (n) => Math.round(n * 10) / 10;
const clampPct = (n) => Math.max(0, Math.min(100, n));

/**
 * @param {string[]} activeKeys  intervention keys currently toggled ON
 * @returns {object} EngineResult-shaped totals (see contracts/HANDSHAKE §3.6)
 */
export function computeTotals(activeKeys = []) {
  const active = activeKeys
    .map((k) => INTERVENTION_BY_KEY[k])
    .filter(Boolean);

  const sum = (sel) => active.reduce((acc, i) => acc + (sel(i) || 0), 0);

  const solarKwDc = sum((i) => i.capacityKwDc);
  const annualKwh = sum((i) => i.annualKwh);
  const co2TonsYr = sum((i) => i.co2TonsYr);
  const stormwaterGalYr = sum((i) => i.stormwaterGalYr);
  const firstInchGal = sum((i) => i.firstInchStormGal);
  const treeCount = sum((i) => i.treeCount);

  const capexLow = sum((i) => i.capexUsd?.low);
  const capexHigh = sum((i) => i.capexUsd?.high);

  // Solar-only capex drives the payback band (green roof rides the cool-roof
  // exemption, not a standalone payback — report-schema §3 note).
  const solarActive = active.filter((i) => i.capacityKwDc > 0);
  const solarCapexLow = solarActive.reduce((a, i) => a + i.capexUsd.low, 0);
  const solarCapexHigh = solarActive.reduce((a, i) => a + i.capexUsd.high, 0);

  // Annual energy savings = generation × retail rate band.
  const savingsLow = annualKwh * CONSTANTS.electricityRateUsdPerKwh.low;
  const savingsHigh = annualKwh * CONSTANTS.electricityRateUsdPerKwh.high;

  // Incentives: 30% ITC on solar capex (the headline stack line).
  const itcLow = solarCapexLow * CONSTANTS.itcRate;
  const itcHigh = solarCapexHigh * CONSTANTS.itcRate;
  const netSolarCapexLow = solarCapexLow - itcLow;
  const netSolarCapexHigh = solarCapexHigh - itcHigh;

  // Simple payback band = net solar capex / annual savings. Present as a band.
  let paybackLow = null;
  let paybackHigh = null;
  if (annualKwh > 0 && savingsHigh > 0) {
    paybackLow = round1(netSolarCapexLow / savingsHigh);
    paybackHigh = round1(netSolarCapexHigh / savingsLow);
  }

  const pctOfBuildingLoadOffset = clampPct(
    (annualKwh / CONSTANTS.baselineAnnualElectricityKwh) * 100
  );

  const pctOf1inStorm = clampPct(
    (firstInchGal / CONSTANTS.baselineStormwaterTargetGal1in) * 100
  );

  // Per-intervention breakdown (for the ledger / dossier line items).
  const perIntervention = active.map((i) => ({
    key: i.key,
    label: i.label,
    surfaceId: i.surfaceId,
    capacityKwDc: i.capacityKwDc,
    annualKwh: i.annualKwh,
    co2TonsYr: i.co2TonsYr,
    stormwaterGalYr: i.stormwaterGalYr,
    treeCount: i.treeCount,
    capexUsd: i.capexUsd,
    feasibilityNote: i.feasibilityNote,
  }));

  return {
    engineVersion: ENGINE_VERSION,
    activeKeys: active.map((i) => i.key),
    // ── the 5 key numbers (Q17) ──
    annualKwh: round(annualKwh),
    capexUsd: { low: round(capexLow), high: round(capexHigh) },
    paybackYears: { low: paybackLow, high: paybackHigh },
    stormwaterGalYr: round(stormwaterGalYr),
    pctOf1inStorm: round(pctOf1inStorm),
    // ── supporting totals ──
    solarKwDc: round(solarKwDc),
    co2TonsYr: round(co2TonsYr),
    pctOfBuildingLoadOffset: round(pctOfBuildingLoadOffset),
    firstInchGal: round(firstInchGal),
    treeCount: round(treeCount),
    annualSavingsUsd: { low: round(savingsLow), high: round(savingsHigh) },
    incentives: {
      itcUsd: { low: round(itcLow), high: round(itcHigh) },
      netSolarCapexUsd: { low: round(netSolarCapexLow), high: round(netSolarCapexHigh) },
    },
    perIntervention,
  };
}

/** Instantaneous output (MW) at a given normalized time-of-day t∈[0,1].
 *  Used by the twin's live readout (sun-driven). */
export function instantOutputMw(totals, t) {
  const peakMw = (totals.solarKwDc || 0) / 1000;
  const height = Math.max(0, Math.sin(Math.PI * t));
  return round1(peakMw * height * 10) / 10;
}

/** A defensible "headline impact sentence" for the demo (Q29). */
export function impactSentence(totals) {
  const saveMid = round(
    (totals.annualSavingsUsd.low + totals.annualSavingsUsd.high) / 2
  );
  const gal = totals.stormwaterGalYr;
  const pb = totals.paybackYears;
  const pbStr = pb.low != null ? `${pb.low}–${pb.high} yr` : "—";
  return `This package generates ~${(totals.annualKwh / 1e6).toFixed(2)} GWh/yr (saving ~$${saveMid.toLocaleString()}/yr), manages ~${gal.toLocaleString()} gal of stormwater, avoids ~${totals.co2TonsYr.toLocaleString()} t CO₂/yr, with a ${pbStr} payback band.`;
}
