/* ----------------------------------------------------------------------------
   LedgerPanel — the live readout (Q17). The 5 key numbers + supporting totals,
   recomputed each render from computeTotals(activeKeys) so they update INSTANTLY
   as toggles flip. Top section is sun-driven (instantOutputMw).
---------------------------------------------------------------------------- */

import React from "react";
import { instantOutputMw } from "../../engine/scoring.js";
import {
  fmtMw, fmtGwh, fmtGal, fmtTons, fmtPct, fmtRange,
} from "../../lib/format.js";
import CollapsiblePanel from "./CollapsiblePanel.jsx";

function Stat({ k, sub, v, amber }) {
  return (
    <div className="ow-stat">
      <span className="k">
        {k}
        {sub ? <small>{sub}</small> : null}
      </span>
      <span className={`v${amber ? " amber" : ""}`}>{v}</span>
    </div>
  );
}

export default function LedgerPanel({ totals, sunT }) {
  const empty = !totals.activeKeys || totals.activeKeys.length === 0;
  const nowMw = instantOutputMw(totals, sunT);
  const peakMw = (totals.solarKwDc || 0) / 1000;
  const livePct = peakMw > 0 ? Math.round((nowMw / peakMw) * 100) : 0;

  return (
    <CollapsiblePanel
      className="ow-ledger"
      ariaLabel="Live impact ledger"
      title="Live ledger"
      tag="recomputes on toggle"
    >
      {/* sun-driven instant output */}
      <div className="ow-live">
        <span className="now">{nowMw.toFixed(1)}</span>
        <span className="u">MW</span>
        <span className="lbl">Instant · sun-driven</span>
      </div>
      <div className="ow-bar"><span style={{ width: `${livePct}%` }} /></div>

      {empty ? (
        <p className="ow-empty">All interventions off — toggle a layer to price the package.</p>
      ) : (
        <>
          {/* ── the 5 key numbers (Q17) ── */}
          <p className="ow-divl">5 key numbers</p>
          <Stat k="Annual generation" v={fmtGwh(totals.annualKwh)} amber />
          <Stat k="Capex range" v={fmtRange(totals.capexUsd, "", { usd: true })} />
          <Stat k="Simple payback" v={fmtRange(totals.paybackYears, "yr")} />
          <Stat
            k="Stormwater managed"
            sub={`${fmtPct(totals.pctOf1inStorm)} of 1″ storm`}
            v={fmtGal(totals.stormwaterGalYr)}
          />
          <Stat k="CO₂ avoided" v={fmtTons(totals.co2TonsYr)} />

          {/* ── supporting totals ── */}
          <p className="ow-divl">Supporting</p>
          <Stat k="Solar capacity" v={fmtMw(totals.solarKwDc)} />
          <Stat k="Building-load offset" v={fmtPct(totals.pctOfBuildingLoadOffset)} />
          <Stat k="Annual savings" v={fmtRange(totals.annualSavingsUsd, "", { usd: true })} />
          <Stat
            k="30% Federal ITC"
            sub="credit on solar capex"
            v={fmtRange(totals.incentives.itcUsd, "", { usd: true })}
            amber
          />
        </>
      )}
    </CollapsiblePanel>
  );
}
