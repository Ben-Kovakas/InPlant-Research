/* ----------------------------------------------------------------------------
   NextSteps — the application ledger / path to the Mayor's office (Q15).
   A compact checklist derived from building.codes (each ref + gate/carrot role +
   note → an item flagged as satisfied or a gate) plus incentive application steps
   from building.incentives. Footer = the Export City-Ready Dossier CTA.
---------------------------------------------------------------------------- */

import React from "react";

// A code is "satisfied" by the modeled retrofit when its role is a carrot or a
// gate the package clears; pure gates/constraints stay flagged as action items.
function codeState(role) {
  const r = (role || "").toLowerCase();
  if (r.includes("carrot")) return "met"; // gate→carrot or gate+carrot — exemption earned
  return "gate"; // gate / constraint — still an action item before filing
}

export default function NextSteps({ building, navigate }) {
  const codes = building.codes || [];
  const incentives = building.incentives || [];

  return (
    <section className="ow-panel ow-next" aria-label="Application ledger and next steps">
      <p className="ow-h">
        Application ledger
        <span className="tag">path to City</span>
      </p>

      <div className="ow-next-scroll">
        {codes.map((c) => {
          const st = codeState(c.role);
          return (
            <div className="ow-item" key={c.key}>
              <span className={`ow-chk ${st}`} aria-hidden="true">
                {st === "met" ? "✓" : "!"}
              </span>
              <span className="b">
                <span className="lab">{c.ref}</span>
                <span className="role">{c.role}</span>
                {c.note && <span className="note">{c.note}</span>}
              </span>
            </div>
          );
        })}

        {incentives.map((inc) => (
          <div className="ow-item" key={inc.key}>
            <span className="ow-chk met" aria-hidden="true">$</span>
            <span className="b">
              <span className="lab">{inc.label}</span>
              {inc.value && <span className="ref">{inc.value}</span>}
              {inc.window && <span className="note">Application window: {inc.window}</span>}
            </span>
          </div>
        ))}
      </div>

      <button className="ip-btn ip-btn-primary ow-export" onClick={() => navigate("dossier")}>
        Export City-Ready Dossier
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2.5" y1="8" x2="13" y2="8" />
          <path d="M9 4l4 4-4 4" />
        </svg>
      </button>
    </section>
  );
}
