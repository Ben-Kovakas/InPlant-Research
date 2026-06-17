import React, { useEffect, useState } from "react";
import { useApp } from "../../state/AppContext.jsx";
import { generateReport } from "../../api/mockApi.js";
import {
  fmtInt, fmtUsd, fmtUsdCompact, fmtRange,
  fmtMw, fmtGwh, fmtGal, fmtTons, fmtPct,
} from "../../lib/format.js";

/* ----------------------------------------------------------------------------
   Retrofit Action Dossier — the file the owner walks away with (Q16/Q17).
   In-browser HTML document + Print-to-PDF (window.print()).

   On screen: dark charcoal theme matching the twin.
   On print: the "paper" recolors to a clean LIGHT theme (white bg / dark ink)
   via an @media print block; the toolbar/nav is hidden. Cards avoid page breaks.
---------------------------------------------------------------------------- */

const CSS = `
  .dossier-root{position:fixed;inset:0;overflow:auto;background:var(--ink);color:var(--text);
    font-family:var(--font-sans);-webkit-font-smoothing:antialiased;}

  /* ---- toolbar (screen only) ---- */
  .dz-toolbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;
    gap:16px;padding:14px clamp(16px,4vw,40px);
    background:rgba(11,12,14,0.82);backdrop-filter:blur(14px);border-bottom:1px solid var(--stroke);}
  .dz-toolbar .left{display:flex;align-items:center;gap:14px;min-width:0;}
  .dz-toolbar .brand{font-family:var(--font-mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;
    color:var(--muted);white-space:nowrap;}
  .dz-toolbar .brand b{color:var(--accent);}

  /* ---- loading ---- */
  .dz-loading{display:grid;place-items:center;height:100%;gap:14px;text-align:center;padding:32px;}
  .dz-spinner{width:30px;height:30px;border-radius:50%;border:2.5px solid var(--stroke-strong);
    border-top-color:var(--accent);animation:dz-spin .8s linear infinite;}
  @keyframes dz-spin{to{transform:rotate(360deg);}}

  /* ---- the paper ---- */
  .dz-paper{max-width:880px;margin:32px auto 64px;padding:clamp(28px,5vw,64px);
    background:var(--ink2);border:1px solid var(--stroke);border-radius:var(--radius);
    box-shadow:var(--shadow);}

  .dz-cover{padding-bottom:26px;border-bottom:1px solid var(--stroke);}
  .dz-cover .mark{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;
    font-family:var(--font-mono);font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--muted);}
  .dz-cover .mark .g{color:var(--accent);display:grid;place-items:center;}
  .dz-title{font-family:var(--font-display);font-weight:600;font-size:clamp(28px,4vw,42px);
    letter-spacing:-.02em;line-height:1.05;margin:0;}
  .dz-bldg{font-family:var(--font-display);font-weight:500;font-size:18px;margin:14px 0 0;color:var(--accent);}
  .dz-meta{display:flex;flex-wrap:wrap;gap:6px 22px;margin:12px 0 0;
    font-family:var(--font-mono);font-size:11px;color:var(--muted);letter-spacing:.02em;}
  .dz-meta .k{color:var(--faint);}
  .dz-tagline{font-size:14px;color:var(--muted);font-style:italic;margin:18px 0 0;}
  .dz-lead{font-size:15.5px;line-height:1.6;margin:16px 0 0;color:var(--text);}

  /* ---- section scaffolding ---- */
  .dz-sec{margin-top:38px;break-inside:avoid;}
  .dz-h{display:flex;align-items:baseline;gap:12px;margin:0 0 16px;padding-bottom:9px;
    border-bottom:1px solid var(--stroke);}
  .dz-h .n{font-family:var(--font-display);font-weight:600;font-size:15px;color:var(--accent);}
  .dz-h .t{font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);}
  .dz-note{font-size:12.5px;color:var(--muted);line-height:1.55;margin:0 0 14px;}

  /* spec list (snapshot) */
  .dz-specs{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;
    background:var(--stroke);border:1px solid var(--stroke);border-radius:10px;overflow:hidden;}
  .dz-spec{background:var(--ink2);padding:13px 15px;}
  .dz-spec .l{font-size:10.5px;color:var(--muted);font-family:var(--font-mono);letter-spacing:.04em;
    text-transform:uppercase;margin:0 0 6px;}
  .dz-spec .v{font-family:var(--font-display);font-weight:500;font-size:17px;letter-spacing:-.01em;}
  .dz-flag{display:inline-block;margin-left:7px;font-family:var(--font-mono);font-size:9px;letter-spacing:.08em;
    text-transform:uppercase;padding:2px 6px;border-radius:5px;
    background:rgba(231,176,138,.14);color:var(--warn);border:1px solid rgba(231,176,138,.35);}

  /* tables */
  .dz-table{width:100%;border-collapse:collapse;font-size:12.5px;}
  .dz-table thead th{text-align:left;font-family:var(--font-mono);font-size:9.5px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--muted);font-weight:500;padding:0 10px 9px;border-bottom:1px solid var(--stroke);}
  .dz-table tbody td{padding:11px 10px;border-bottom:1px solid var(--stroke);vertical-align:top;line-height:1.45;}
  .dz-table tbody tr:last-child td{border-bottom:none;}
  .dz-table .num{font-family:var(--font-mono);white-space:nowrap;}
  .dz-table .lab{font-weight:500;}
  .dz-table .sub{color:var(--muted);font-size:11px;}
  .dz-pill{display:inline-block;font-family:var(--font-mono);font-size:9px;letter-spacing:.06em;
    text-transform:uppercase;padding:2px 7px;border-radius:5px;border:1px solid var(--stroke-strong);color:var(--muted);}
  .dz-pill.gate{color:var(--warn);border-color:rgba(231,176,138,.4);}
  .dz-pill.carrot{color:var(--good);border-color:rgba(143,191,138,.4);}

  /* impact big numbers */
  .dz-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;}
  .dz-metric{border:1px solid var(--stroke);border-radius:11px;padding:16px 16px;background:rgba(255,255,255,.02);}
  .dz-metric .mv{font-family:var(--font-display);font-weight:600;font-size:26px;letter-spacing:-.02em;color:var(--accent);}
  .dz-metric .ml{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4;}
  .dz-metric .mx{font-size:11px;color:var(--faint);margin-top:3px;}

  /* cost line items */
  .dz-cost{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px;}
  .dz-cost .row{border:1px solid var(--stroke);border-radius:10px;padding:13px 15px;background:rgba(255,255,255,.02);}
  .dz-cost .l{font-size:10.5px;color:var(--muted);font-family:var(--font-mono);letter-spacing:.04em;
    text-transform:uppercase;margin:0 0 6px;}
  .dz-cost .v{font-family:var(--font-display);font-weight:500;font-size:18px;letter-spacing:-.01em;}
  .dz-cost .v.accent{color:var(--accent);}

  .dz-stack{list-style:none;margin:0;padding:0;}
  .dz-stack li{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-top:1px solid var(--stroke);}
  .dz-stack li:first-child{border-top:none;}
  .dz-stack .lead{flex:0 0 auto;width:7px;height:7px;border-radius:2px;margin-top:5px;
    background:rgba(244,196,122,.14);border:1px solid var(--accent-line);}
  .dz-stack .body{flex:1;min-width:0;}
  .dz-stack .lab{font-size:13px;font-weight:500;}
  .dz-stack .det{font-family:var(--font-mono);font-size:11px;color:var(--accent);margin-top:3px;}
  .dz-stack .win{font-size:11px;color:var(--muted);margin-top:2px;}

  /* checklist */
  .dz-check{list-style:none;margin:0;padding:0;}
  .dz-check li{display:flex;align-items:flex-start;gap:11px;padding:9px 0;font-size:13px;line-height:1.5;}
  .dz-check .box{flex:0 0 auto;width:16px;height:16px;border-radius:4px;margin-top:1px;
    border:1.5px solid var(--accent-line);color:var(--accent);display:grid;place-items:center;}
  .dz-check b{font-weight:600;}
  .dz-check .mono{font-family:var(--font-mono);font-size:11.5px;color:var(--accent);}

  /* city contribution callout (Side-B) */
  .dz-city{margin-top:38px;border:1px solid var(--accent-line);border-radius:var(--radius);
    background:rgba(244,196,122,.05);padding:24px clamp(20px,4vw,30px);break-inside:avoid;}
  .dz-city .eyebrow{font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;
    color:var(--accent);margin:0 0 6px;}
  .dz-city h3{font-family:var(--font-display);font-weight:500;font-size:18px;margin:0 0 14px;letter-spacing:-.01em;}
  .dz-city dl{margin:0;display:grid;gap:12px;}
  .dz-city dt{font-family:var(--font-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
  .dz-city dd{margin:3px 0 0;font-size:13.5px;line-height:1.5;}

  /* footer */
  .dz-footer{margin-top:38px;padding-top:18px;border-top:1px solid var(--stroke);
    font-size:11.5px;color:var(--faint);line-height:1.6;}

  @media (max-width:680px){
    .dz-toolbar .brand{display:none;}
  }

  /* ============================================================
     PRINT — hide chrome, recolor paper to a clean LIGHT theme.
     ============================================================ */
  @media print{
    @page{margin:14mm;}
    .dz-toolbar{display:none !important;}
    .dossier-root{position:static;overflow:visible;background:#fff;color:#16181c;}

    .dz-paper{max-width:none;margin:0;padding:0;border:none;border-radius:0;box-shadow:none;
      background:#fff;color:#16181c;}

    /* recolor every tokened surface to ink-on-paper */
    .dz-paper .dz-cover{border-color:#cfd2d7;}
    .dz-paper .dz-title,.dz-paper .dz-spec .v,.dz-paper .dz-cost .v,.dz-paper .dz-check{color:#16181c;}
    .dz-paper .dz-bldg,.dz-paper .dz-metric .mv,.dz-paper .dz-cost .v.accent,.dz-paper .dz-h .n,
    .dz-paper .dz-stack .det,.dz-paper .dz-check .mono,.dz-paper .dz-city .eyebrow{color:#a9772a;}
    .dz-paper .dz-lead{color:#222;}
    .dz-paper .dz-tagline,.dz-paper .dz-note,.dz-paper .dz-meta,.dz-paper .dz-metric .ml,
    .dz-paper .dz-cost .l,.dz-paper .dz-spec .l,.dz-paper .dz-stack .win,
    .dz-paper .dz-table thead th,.dz-paper .dz-table .sub,.dz-paper .dz-pill{color:#55585f;}
    .dz-paper .dz-meta .k,.dz-paper .dz-metric .mx,.dz-paper .dz-footer{color:#777;}

    .dz-paper .dz-h,.dz-paper .dz-table thead th,.dz-paper .dz-table tbody td,
    .dz-paper .dz-stack li,.dz-paper .dz-footer{border-color:#d7dadf;}
    .dz-paper .dz-specs{background:#d7dadf;border-color:#cfd2d7;}
    .dz-paper .dz-spec{background:#fff;}
    .dz-paper .dz-metric,.dz-paper .dz-cost .row{background:#faf9f6;border-color:#d7dadf;}
    .dz-paper .dz-pill{border-color:#c7cad0;}
    .dz-paper .dz-pill.gate{color:#9a5b2e;}
    .dz-paper .dz-pill.carrot{color:#3f7a3a;}
    .dz-paper .dz-stack .lead,.dz-paper .dz-check .box{border-color:#a9772a;background:rgba(169,119,42,.10);}
    .dz-paper .dz-city{background:#fbf4e7;border-color:#e0c694;}
    .dz-paper .dz-flag{background:#f6e7da;color:#9a5b2e;border-color:#e2c3a8;}

    /* keep groups intact across pages */
    .dz-sec,.dz-city,.dz-metric,.dz-cost .row,.dz-table tr{break-inside:avoid;}
  }
`;

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Check() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5l2.5 2.5 4.5-5.5" />
    </svg>
  );
}

export default function Dossier() {
  const { navigate, activeKeys, packageId } = useApp();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError(null);
    generateReport("ansley-mall", { audience: "owner", packageId, activeKeys })
      .then((r) => { if (!cancelled) setReport(r); })
      .catch((e) => { if (!cancelled) setError(e?.message || String(e)); });
    return () => { cancelled = true; };
  }, [packageId, activeKeys]);

  const toolbar = (
    <div className="dz-toolbar">
      <div className="left">
        <button className="ip-btn" onClick={() => navigate("owner")}>← Back to workspace</button>
        <span className="brand"><b>In-Planted</b> · Retrofit Action Dossier</span>
      </div>
      <button
        className="ip-btn ip-btn-primary"
        onClick={() => window.print()}
        disabled={!report}
      >
        Print / Save as PDF
      </button>
    </div>
  );

  if (error) {
    return (
      <>
        <style>{CSS}</style>
        <div className="dossier-root">
          {toolbar}
          <div className="dz-loading">
            <p className="ip-eyebrow">Could not build dossier</p>
            <p style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <style>{CSS}</style>
        <div className="dossier-root">
          {toolbar}
          <div className="dz-loading">
            <div className="dz-spinner" />
            <p className="ip-eyebrow">Generating Retrofit Action Dossier…</p>
          </div>
        </div>
      </>
    );
  }

  const { snapshot, impact, cost, feasibility, cityContribution, sentence } = report;
  const pkg = report.package;
  const cc = cityContribution || {};

  return (
    <>
      <style>{CSS}</style>
      <div className="dossier-root">
        {toolbar}

        <article className="dz-paper">
          {/* ---- COVER / HEADER ---- */}
          <header className="dz-cover">
            <span className="mark">
              <span className="g">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                  strokeWidth="1.3" strokeLinecap="round">
                  <path d="M6 11V5" />
                  <path d="M6 5c0-2 1.5-3.5 3.5-3.5C9.5 3.5 8 5 6 5z" />
                  <path d="M6 6.5C6 5 4.6 3.8 2.7 3.8 2.7 5.3 4.1 6.5 6 6.5z" />
                </svg>
              </span>
              In-Planted · Climate-Resilient ATL
            </span>

            <h1 className="dz-title">Retrofit Action Dossier</h1>
            <p className="dz-bldg">Ansley Mall</p>

            <div className="dz-meta">
              <span><span className="k">Report</span> {report.reportId}</span>
              <span><span className="k">Owner</span> {snapshot.owner}</span>
              <span><span className="k">Address</span> {snapshot.address}</span>
              <span><span className="k">Generated</span> {fmtDate(report.generatedAt)}</span>
              <span><span className="k">Engine</span> {report.engineVersion}</span>
            </div>

            {pkg.tagline && <p className="dz-tagline">"{pkg.tagline}"</p>}
            <p className="dz-lead">{sentence}</p>
          </header>

          {/* ---- 1 · SNAPSHOT ---- */}
          <section className="dz-sec">
            <h2 className="dz-h"><span className="n">1</span><span className="t">Snapshot · the "before"</span></h2>
            <div className="dz-specs">
              <div className="dz-spec"><p className="l">Address</p><div className="v" style={{ fontSize: 13 }}>{snapshot.address}</div></div>
              <div className="dz-spec"><p className="l">Year built</p><div className="v">{snapshot.yearBuilt}</div></div>
              <div className="dz-spec"><p className="l">Stories</p><div className="v">{snapshot.stories}</div></div>
              <div className="dz-spec"><p className="l">Roof area</p><div className="v">{fmtInt(snapshot.roofAreaFt2)} ft²</div></div>
              <div className="dz-spec">
                <p className="l">ENERGY STAR</p>
                <div className="v">{snapshot.energyStarScore}
                  {snapshot.energyStarScore < 75 && <span className="dz-flag">below 75</span>}
                </div>
              </div>
              <div className="dz-spec"><p className="l">EUI (kBtu/ft²)</p><div className="v">{snapshot.euiKbtuFt2}</div></div>
              <div className="dz-spec"><p className="l">Cool roof</p><div className="v" style={{ fontSize: 13 }}>Re-roof obligation pending</div></div>
            </div>
            <p className="dz-note" style={{ marginTop: 12, marginBottom: 0 }}>
              ENERGY STAR {snapshot.energyStarScore} sits below the 75 certification threshold — the re-roof
              obligation is the hook this package converts into a carrot.
            </p>
          </section>

          {/* ---- 2 · RECOMMENDED PACKAGE ---- */}
          <section className="dz-sec">
            <h2 className="dz-h"><span className="n">2</span><span className="t">Recommended package</span></h2>
            <p className="dz-note">
              <b style={{ color: "var(--text)" }}>{pkg.name}</b>{pkg.tagline ? ` — ${pkg.tagline}` : ""}
            </p>
            <table className="dz-table">
              <thead>
                <tr>
                  <th>Intervention</th>
                  <th>Surface</th>
                  <th>Capacity</th>
                  <th>Annual gen.</th>
                  <th>Capex</th>
                </tr>
              </thead>
              <tbody>
                {pkg.interventions.map((iv) => (
                  <tr key={iv.key}>
                    <td>
                      <div className="lab">{iv.label}</div>
                      {iv.feasibilityNote && <div className="sub">{iv.feasibilityNote}</div>}
                    </td>
                    <td className="num sub">{iv.surfaceId || "—"}</td>
                    <td className="num">{iv.capacityKwDc > 0 ? fmtMw(iv.capacityKwDc) : "—"}</td>
                    <td className="num">{iv.annualKwh > 0 ? fmtGwh(iv.annualKwh) : "—"}</td>
                    <td className="num">{fmtRange(iv.capexUsd, "", { usd: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ---- 3 · IMPACT ---- */}
          <section className="dz-sec">
            <h2 className="dz-h"><span className="n">3</span><span className="t">Impact · the key numbers</span></h2>
            <div className="dz-metrics">
              <div className="dz-metric">
                <div className="mv">{fmtGwh(impact.annualKwh)}</div>
                <div className="ml">Annual generation</div>
              </div>
              <div className="dz-metric">
                <div className="mv">{fmtTons(impact.co2TonsYr)}</div>
                <div className="ml">CO₂ avoided / yr</div>
              </div>
              <div className="dz-metric">
                <div className="mv">{fmtPct(impact.pctOfBuildingLoadOffset)}</div>
                <div className="ml">Building-load offset</div>
              </div>
              <div className="dz-metric">
                <div className="mv">{fmtGal(impact.stormwaterGalYr)}</div>
                <div className="ml">Stormwater managed / yr</div>
                <div className="mx">{fmtPct(impact.pctOf1inStorm)} of the 1″ storm</div>
              </div>
              <div className="dz-metric">
                <div className="mv">{fmtMw(impact.solarKwDc)}</div>
                <div className="ml">Solar capacity</div>
              </div>
              <div className="dz-metric">
                <div className="mv">{fmtInt(impact.treeCount)}</div>
                <div className="ml">Trees added</div>
              </div>
            </div>
          </section>

          {/* ---- 4 · COST & INCENTIVES ---- */}
          <section className="dz-sec">
            <h2 className="dz-h"><span className="n">4</span><span className="t">Cost &amp; incentives</span></h2>
            <div className="dz-cost">
              <div className="row"><p className="l">Total capex</p><div className="v">{fmtRange(cost.capexUsd, "", { usd: true })}</div></div>
              <div className="row"><p className="l">30% Federal ITC</p><div className="v accent">−{fmtRange(cost.itcUsd, "", { usd: true })}</div></div>
              <div className="row"><p className="l">Net solar capex (after ITC)</p><div className="v">{fmtRange(cost.netSolarCapexUsd, "", { usd: true })}</div></div>
              <div className="row"><p className="l">Annual energy savings</p><div className="v accent">{fmtRange(cost.annualSavingsUsd, "", { usd: true })}</div></div>
              <div className="row"><p className="l">Simple payback</p><div className="v">{fmtRange(cost.paybackYears, "yr")}</div></div>
            </div>
            <p className="dz-note">Incentive stack available on this parcel:</p>
            <ul className="dz-stack">
              {(cost.incentiveStack || []).map((inc) => (
                <li key={inc.key}>
                  <span className="lead" />
                  <span className="body">
                    <div className="lab">{inc.label}</div>
                    {inc.value && <div className="det">{inc.value}</div>}
                    {inc.window && <div className="win">Window: {inc.window}</div>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* ---- 5 · FEASIBILITY & CODES ---- */}
          <section className="dz-sec">
            <h2 className="dz-h"><span className="n">5</span><span className="t">Feasibility &amp; codes</span></h2>
            <p className="dz-note">
              Permitability confidence: <b style={{ color: "var(--good)" }}>
                {String(feasibility.permitabilityConfidence).replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
              </b>. Each code below is either a gate this package clears or a carrot it unlocks.
            </p>
            <table className="dz-table">
              <thead>
                <tr><th>Reference</th><th>Role</th><th>Note</th></tr>
              </thead>
              <tbody>
                {(feasibility.codes || []).map((c) => {
                  const isCarrot = /carrot/i.test(c.role);
                  const isGate = /gate/i.test(c.role);
                  const cls = isCarrot && !isGate ? "carrot" : isGate ? "gate" : "";
                  return (
                    <tr key={c.key}>
                      <td className="lab">{c.ref}</td>
                      <td><span className={`dz-pill ${cls}`}>{c.role}</span></td>
                      <td className="sub">{c.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* ---- 6 · NEXT STEPS ---- */}
          <section className="dz-sec">
            <h2 className="dz-h"><span className="n">6</span><span className="t">Next steps</span></h2>
            <ul className="dz-check">
              <li><span className="box"><Check /></span>
                <span>Choose <b>{pkg.name}</b> for Ansley Mall — take this dossier to your engineer and the City.</span></li>
              <li><span className="box"><Check /></span>
                <span>Commission structural confirmation of roof load headroom (PV clears ~3–5 psf; green roof is the gated item).</span></li>
              <li><span className="box"><Check /></span>
                <span>File the 30% ITC with <span className="mono">IRS Form 3468</span> at placed-in-service.</span></li>
              <li><span className="box"><Check /></span>
                <span>Claim the §179D energy-efficiency deduction via <span className="mono">IRS Form 7205</span>.</span></li>
              <li><span className="box"><Check /></span>
                <span>Agency handoffs: <b>Office of Buildings</b> (permit + cool-roof exemption), <b>Dept. of Watershed Management (DWM)</b> (1″ stormwater), and the <b>City Arborist</b> (tree ordinance).</span></li>
            </ul>
          </section>

          {/* ---- CITY CONTRIBUTION (Side-B) ---- */}
          <section className="dz-city">
            <p className="eyebrow">Side B · For the Mayor's Office</p>
            <h3>Contribution to Atlanta's climate goals</h3>
            <dl>
              {cc.framingForMayorsOffice && (<div><dt>Framing</dt><dd>{cc.framingForMayorsOffice}</dd></div>)}
              {cc.co2TowardTarget && (<div><dt>CO₂ toward target</dt><dd>{cc.co2TowardTarget}</dd></div>)}
              {cc.cleanEnergy && (<div><dt>Clean energy</dt><dd>{cc.cleanEnergy}</dd></div>)}
              {cc.stormwater && (<div><dt>Stormwater</dt><dd>{cc.stormwater}</dd></div>)}
              {cc.beltline && (<div><dt>BeltLine</dt><dd>{cc.beltline}</dd></div>)}
              {cc.plan && (<div><dt>Plan alignment</dt><dd>{cc.plan}</dd></div>)}
            </dl>
          </section>

          {/* ---- FOOTER ---- */}
          <footer className="dz-footer">
            Illustrative figures (Google Solar API study, Google Earth trace, research constants).
            Verify moving targets (incentive deadlines, tariffs) at parcel stage.
          </footer>
        </article>
      </div>
    </>
  );
}
