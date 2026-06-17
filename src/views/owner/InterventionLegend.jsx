/* ----------------------------------------------------------------------------
   InterventionLegend — the live toggle stack (Q15). One row per intervention;
   clicking a row calls toggleKey(key) which re-prices the ledger instantly.
   Reflects activeKeys for the ON/OFF state.
---------------------------------------------------------------------------- */

import React from "react";
import { INTERVENTIONS } from "../../engine/interventions.js";
import CollapsiblePanel from "./CollapsiblePanel.jsx";

// quiet swatch colors mirroring the 3D twin material palette
const SWATCH = {
  roofSolar: "#23252d",
  lotCanopySolar: "#2c2e36",
  greenRoof: "#66735f",
  stormwaterTrees: "#6f7c6a",
  beltline: "#73806c",
};

export default function InterventionLegend({ activeKeys, toggleKey }) {
  const onSet = new Set(activeKeys);
  return (
    <CollapsiblePanel
      className="ow-legend"
      ariaLabel="Intervention toggles"
      title="Retrofit interventions"
      tag={`${onSet.size}/${INTERVENTIONS.length} on`}
    >
      {INTERVENTIONS.map((iv) => {
        const on = onSet.has(iv.key);
        return (
          <div
            key={iv.key}
            className={`ow-lrow ${on ? "on" : "off"}`}
            role="button"
            tabIndex={0}
            aria-pressed={on}
            onClick={() => toggleKey(iv.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleKey(iv.key);
              }
            }}
          >
            <span className="sw" style={{ background: SWATCH[iv.key] || "#444" }} />
            <span className="meta">
              <span className="name">
                {iv.label}
                <span className="ow-tog" aria-hidden="true" />
              </span>
              <span className="desc">{iv.short} — {iv.blurb}</span>
            </span>
          </div>
        );
      })}
    </CollapsiblePanel>
  );
}
