/* ----------------------------------------------------------------------------
   OwnerWorkspace — the CORE journey for the commercial building owner
   (Selig Enterprises, hero = Ansley Mall):

     SELECT BUILDING → SEE BASELINE → TOGGLE INTERVENTIONS & COMPARE PACKAGES
     → EXPORT DOSSIER (Q20).

   Full-viewport workspace: the controlled 3D twin (TwinCanvas) is the centerpiece;
   baseline, live ledger, intervention toggles, sun dock, package selector, and the
   application ledger float over it (AnsleyApp-style). Every number is recomputed
   from computeTotals(activeKeys) on each render, so toggles re-price instantly.
---------------------------------------------------------------------------- */

import React, { useState } from "react";

import { useApp } from "../../state/AppContext.jsx";
import TwinCanvas from "../../components/TwinCanvas.jsx";
import { INTERVENTION_BY_KEY } from "../../engine/interventions.js";
import { computeTotals } from "../../engine/scoring.js";
import building from "../../data/buildings/ansley-mall.json";

import { OWNER_CSS } from "./ownerStyles.js";
import BaselineCard from "./BaselineCard.jsx";
import LedgerPanel from "./LedgerPanel.jsx";
import InterventionLegend from "./InterventionLegend.jsx";
import SunDock from "./SunDock.jsx";
import PackageBar from "./PackageBar.jsx";
import NextSteps from "./NextSteps.jsx";

/** Map the active intervention keys → TwinCanvas activeLayers via each
 *  intervention's layerKey. */
function buildActiveLayers(activeKeys) {
  const layers = {
    roofSolar: false,
    lotCanopySolar: false,
    greenRoof: false,
    stormwaterTrees: false,
    beltline: false,
  };
  for (const k of activeKeys) {
    const iv = INTERVENTION_BY_KEY[k];
    if (iv && iv.layerKey in layers) layers[iv.layerKey] = true;
  }
  return layers;
}

export default function OwnerWorkspace() {
  const {
    session,
    logout,
    activeKeys,
    toggleKey,
    applyPackage,
    packageId,
    sunT,
    setSunT,
    navigate,
  } = useApp();

  // local UI state — the 3D animation play/pause
  const [playing, setPlaying] = useState(false);

  // recompute live on EVERY render → toggling a layer instantly re-prices.
  const totals = computeTotals(activeKeys);
  const activeLayers = buildActiveLayers(activeKeys);

  return (
    <>
      <style>{OWNER_CSS}</style>
      <div className="owner-root">
        {/* ── centerpiece: controlled 3D twin ── */}
        <div className="ow-stage">
          <TwinCanvas
            className="ow-twin"
            activeLayers={activeLayers}
            sunT={sunT}
            playing={playing}
            showTags
          />
        </div>

        {/* ── overlay UI layer ── */}
        <div className="ow-ui">
          {/* top bar */}
          <header className="ow-top">
            <div className="ow-brand">
              <span className="ow-glyph" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                  <path d="M6 11V5" />
                  <path d="M6 5c0-2 1.5-3.5 3.5-3.5C9.5 3.5 8 5 6 5z" />
                  <path d="M6 6.5C6 5 4.6 3.8 2.7 3.8 2.7 5.3 4.1 6.5 6 6.5z" />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="nm">In-Planted · Climate-Resilient ATL</div>
                <div className="ti">
                  Ansley Mall — <b>Climate-Resilient Retrofit</b>
                </div>
              </div>
            </div>

            <div className="ow-who">
              <div className="acct">
                <div className="nm">{session?.subtitle || "Owner workspace"}</div>
                <div className="dn">{session?.displayName || "Selig Enterprises"}</div>
              </div>
              <button className="ip-btn" onClick={logout}>Sign out</button>
            </div>
          </header>

          {/* baseline — the trigger for action */}
          <BaselineCard building={building} />

          {/* package presets A/B/C + custom */}
          <PackageBar packageId={packageId} applyPackage={applyPackage} />

          {/* live ledger — the 5 key numbers, sun-driven instant output */}
          <LedgerPanel totals={totals} sunT={sunT} />

          {/* intervention toggles — drive the twin + the ledger */}
          <InterventionLegend activeKeys={activeKeys} toggleKey={toggleKey} />

          {/* sun path control */}
          <SunDock
            sunT={sunT}
            setSunT={setSunT}
            playing={playing}
            setPlaying={setPlaying}
          />

          {/* application ledger + export CTA → dossier */}
          <NextSteps building={building} navigate={navigate} />
        </div>
      </div>
    </>
  );
}
