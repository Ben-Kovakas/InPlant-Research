/* ----------------------------------------------------------------------------
   BaselineCard — the "before". The trigger for action (Q4/Q5):
   ENERGY STAR 63 (below the 75 cert threshold), EUI 58 kBtu/ft²·yr, roof area,
   year built, owner, and the CBEEO applicability flag (≥25k ft²).
---------------------------------------------------------------------------- */

import React from "react";
import { fmtInt } from "../../lib/format.js";
import CollapsiblePanel from "./CollapsiblePanel.jsx";

// PDF baseline constants (also in engine CONSTANTS, restated here for the "before").
const ENERGY_STAR = 63;
const ENERGY_STAR_THRESHOLD = 75;
const EUI = 58;

export default function BaselineCard({ building }) {
  const roofFt2 = building.roofAreaFt2 || 0;
  const cbeeoApplies = roofFt2 >= 25000;

  return (
    <CollapsiblePanel
      className="ow-baseline"
      ariaLabel="Building baseline"
      title={"Baseline · the “before”"}
      tag="ENERGY STAR"
    >
      <div className="ow-score">
        <span className="big">{ENERGY_STAR}</span>
        <span className="of">/ 100 score</span>
      </div>

      <div className="ow-flag">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1.5l6.5 11.5h-13z" />
          <line x1="8" y1="6" x2="8" y2="9.5" />
          <circle cx="8" cy="11.6" r="0.4" fill="currentColor" />
        </svg>
        <span>
          Below the <b>{ENERGY_STAR_THRESHOLD}</b> certification threshold — retrofit
          required to certify.
        </span>
      </div>

      <div className="ow-meta">
        <div className="row">
          <span className="k">Site EUI</span>
          <span className="v">{EUI} kBtu/ft²·yr</span>
        </div>
        <div className="row">
          <span className="k">Roof area</span>
          <span className="v">{fmtInt(roofFt2)} ft²</span>
        </div>
        <div className="row">
          <span className="k">Year built</span>
          <span className="v">{building.yearBuilt}</span>
        </div>
        <div className="row">
          <span className="k">Stories</span>
          <span className="v">{building.stories}</span>
        </div>
        <div className="row">
          <span className="k">Owner</span>
          <span className="v" style={{ fontSize: 10.5 }}>Selig Enterprises</span>
        </div>
      </div>

      <p className="ow-cbeeo">
        {cbeeoApplies ? (
          <>
            <b>CBEEO applies</b> — {fmtInt(roofFt2)} ft² ≥ 25,000 ft² benchmarking &amp;
            audit threshold.
          </>
        ) : (
          <>Below the 25,000 ft² CBEEO threshold.</>
        )}
      </p>
    </CollapsiblePanel>
  );
}
