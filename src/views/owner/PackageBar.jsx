/* ----------------------------------------------------------------------------
   PackageBar — the three preset packages A/B/C (Q13). applyPackage(id) swaps the
   active set; the chip matching the current packageId is highlighted. When toggles
   don't match any preset, a "Custom" chip lights up instead. B is Recommended.
---------------------------------------------------------------------------- */

import React from "react";
import { PACKAGES } from "../../engine/packages.js";

export default function PackageBar({ packageId, applyPackage }) {
  const isCustom = packageId === "custom";
  return (
    <div className="ow-pkgbar" aria-label="Retrofit packages">
      {PACKAGES.map((p) => {
        const active = p.id === packageId;
        return (
          <button
            key={p.id}
            className={`ow-pkg${active ? " active" : ""}`}
            onClick={() => applyPackage(p.id)}
            aria-pressed={active}
          >
            {p.recommended && <span className="rec">Recommended</span>}
            <span className="pid">Package {p.id} · {p.priority}</span>
            <span className="pn">{p.name}</span>
            <span className="pt">{p.tagline}</span>
          </button>
        );
      })}
      <div
        className={`ow-pkg custom-chip${isCustom ? " active" : ""}`}
        aria-current={isCustom}
        title="Free-toggle state — does not match a preset"
      >
        <span>
          <span className="pid">State</span>
          <span className="pn">{isCustom ? "Custom" : `Package ${packageId}`}</span>
        </span>
      </div>
    </div>
  );
}
