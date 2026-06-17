/* ----------------------------------------------------------------------------
   CollapsiblePanel — a floating owner-workspace panel whose body collapses to a
   header-only strip. Lets the baseline / live-ledger / interventions / application
   panels be expanded and read INDEPENDENTLY: collapsing one frees vertical space
   for the other in its column, so they never cover each other's information.
---------------------------------------------------------------------------- */

import React, { useState } from "react";

export default function CollapsiblePanel({
  className = "",
  ariaLabel,
  title,
  tag,
  defaultCollapsed = false,
  bodyClassName,
  children,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section
      className={`ow-panel ${className}${collapsed ? " collapsed" : ""}`}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="ow-h ow-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span>{title}</span>
        <span className="ow-hr">
          {tag != null && <span className="tag">{tag}</span>}
          <span className="chev" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 4.5L6 8l3.5-3.5" />
            </svg>
          </span>
        </span>
      </button>

      <div className={`ow-cbody${bodyClassName ? " " + bodyClassName : ""}`}>
        {children}
      </div>
    </section>
  );
}
