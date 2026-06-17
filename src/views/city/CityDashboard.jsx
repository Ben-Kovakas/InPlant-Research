import React, { useEffect, useState } from "react";
import { useApp } from "../../state/AppContext.jsx";
import { getCityPortfolio } from "../../api/mockApi.js";
import { fmtInt } from "../../lib/format.js";

/* ----------------------------------------------------------------------------
   City / Mayor dashboard — Side-B view for the City of Atlanta MOSR.
   A scrollable, data-rich "Climate Contribution Ledger": how proactive retrofit
   measures contribute to codified sustainability goals + current applications.
   Reuses the shared In-Planted look: charcoal ground, off-white matte, ONE warm
   amber accent. All styling scoped under .city-root.
---------------------------------------------------------------------------- */

const CSS = `
  .city-root{min-height:100%;background:var(--ink);color:var(--text);
    font-family:var(--font-sans);-webkit-font-smoothing:antialiased;
    padding-bottom:64px;}
  .city-root *{box-sizing:border-box;}
  .city-wrap{max-width:1180px;margin:0 auto;padding:0 28px;}

  /* top bar */
  .city-topbar{position:sticky;top:0;z-index:10;background:rgba(11,12,14,0.82);
    backdrop-filter:blur(14px);border-bottom:1px solid var(--stroke);}
  .city-topbar-in{max-width:1180px;margin:0 auto;padding:16px 28px;display:flex;
    align-items:center;gap:18px;}
  .city-brand{display:flex;flex-direction:column;gap:5px;min-width:0;}
  .city-brand .nm{font-family:var(--font-display);font-weight:600;font-size:16px;
    letter-spacing:-.01em;}
  .city-topbar .spacer{flex:1;}
  .city-who{display:flex;flex-direction:column;align-items:flex-end;gap:3px;
    text-align:right;}
  .city-who .name{font-size:12.5px;font-weight:500;}
  .city-who .role{font-size:10.5px;color:var(--muted);}

  /* hero */
  .city-hero{padding:54px 0 30px;border-bottom:1px solid var(--stroke);
    margin-bottom:38px;}
  .city-hero h1{font-family:var(--font-display);font-weight:500;font-size:42px;
    line-height:1.08;letter-spacing:-.02em;margin:14px 0 0;}
  .city-hero h1 b{font-weight:600;}
  .city-hero .lede{font-size:14px;color:var(--muted);line-height:1.6;margin:16px 0 0;
    max-width:680px;}
  .city-hero .lede .accent{color:var(--accent);}

  /* section heading */
  .city-sec{margin:0 0 44px;}
  .city-sec-head{display:flex;align-items:baseline;gap:14px;margin:0 0 18px;}
  .city-sec-head h2{font-family:var(--font-display);font-weight:500;font-size:21px;
    letter-spacing:-.01em;margin:0;}
  .city-sec-head .hint{font-size:12px;color:var(--faint);margin:0;line-height:1.5;}

  /* scorecard grid */
  .city-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
  .scard{padding:20px 20px 18px;display:flex;flex-direction:column;gap:0;}
  .scard .val{font-family:var(--font-display);font-weight:600;font-size:33px;
    line-height:1;letter-spacing:-.02em;color:var(--accent);}
  .scard .val .u{font-size:15px;font-weight:500;color:var(--accent);margin-left:5px;
    letter-spacing:0;}
  .scard .metric{font-size:13px;font-weight:500;margin-top:13px;}
  .scard .target{font-size:11.5px;color:var(--muted);line-height:1.5;margin-top:8px;}
  .scard .target .arrow{color:var(--accent);}
  .scard .instr{font-family:var(--font-mono);font-size:9.5px;letter-spacing:.08em;
    color:var(--faint);margin-top:9px;text-transform:uppercase;}

  /* applications table */
  .city-table{width:100%;border-collapse:collapse;}
  .city-table thead th{font-family:var(--font-mono);font-size:9px;letter-spacing:.16em;
    text-transform:uppercase;color:var(--faint);text-align:left;font-weight:500;
    padding:0 14px 12px;border-bottom:1px solid var(--stroke);}
  .city-table tbody td{padding:16px 14px;border-bottom:1px solid var(--stroke);
    font-size:13px;vertical-align:top;}
  .city-table tbody tr:last-child td{border-bottom:none;}
  .city-table .t-id{font-family:var(--font-mono);font-size:11px;color:var(--muted);}
  .city-table .t-bld{font-weight:500;}
  .city-table .t-sub{font-size:11px;color:var(--muted);margin-top:3px;}
  .city-table .t-co2{font-family:var(--font-mono);color:var(--accent);}
  .city-table .t-co2.none{color:var(--faint);}
  .es{font-family:var(--font-mono);font-size:13px;}
  .es.warn{color:var(--warn);}
  .pill{display:inline-block;font-family:var(--font-mono);font-size:9.5px;
    letter-spacing:.06em;padding:4px 9px;border-radius:20px;border:1px solid var(--stroke-strong);
    color:var(--muted);white-space:nowrap;}
  .pill.live{color:var(--accent);border-color:var(--accent-line);background:var(--accent-dim);}
  .chips{display:flex;flex-wrap:wrap;gap:6px;}
  .chip{font-size:10.5px;color:var(--muted);background:rgba(255,255,255,.03);
    border:1px solid var(--stroke);border-radius:6px;padding:3px 8px;line-height:1.3;}

  /* proactive measures */
  .pro-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .pro-card{display:flex;gap:14px;padding:18px 18px;align-items:flex-start;}
  .pro-card .lead{flex:0 0 auto;width:10px;height:10px;border-radius:3px;margin-top:4px;
    border:1px solid var(--accent-line);background:var(--accent-dim);}
  .pro-card .txt{font-size:13px;line-height:1.55;}

  /* beltline footer */
  .belt{padding:22px 24px;}
  .belt .eyebrow{margin-bottom:10px;}
  .belt p{font-size:13px;line-height:1.6;margin:0;color:var(--text);}
  .belt .meth{font-size:11.5px;color:var(--muted);margin-top:12px;line-height:1.55;}
  .belt .meth a{color:var(--accent);text-decoration:none;}

  /* loading */
  .city-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;
    min-height:60vh;gap:14px;color:var(--muted);}
  .city-loading .pulse{width:34px;height:34px;border-radius:9px;border:1px solid var(--accent-line);
    background:var(--accent-dim);animation:cityPulse 1.1s ease-in-out infinite;}
  @keyframes cityPulse{0%,100%{opacity:.35;transform:scale(.92);}50%{opacity:1;transform:scale(1);}}

  @media (max-width:1100px){
    .city-grid{grid-template-columns:repeat(2,1fr);}
  }
  @media (max-width:760px){
    .city-grid,.pro-grid{grid-template-columns:1fr;}
    .city-hero h1{font-size:32px;}
    .city-wrap,.city-topbar-in{padding-left:18px;padding-right:18px;}
  }
`;

/* format a scorecard value by its unit (per spec) */
function fmtScoreValue(value, unit) {
  if (value == null) return { num: "—", unit: "" };
  if (unit.includes("GWh") || unit.includes("M gal")) {
    const digits = unit.includes("GWh") ? 2 : 1;
    return { num: value.toFixed(digits), unit };
  }
  if (unit.includes("%")) return { num: String(Math.round(value)), unit: "%" };
  if (unit.includes("t/yr")) return { num: fmtInt(value), unit: "t/yr" };
  return { num: String(value), unit };
}

function ScoreCard({ row }) {
  const { num, unit } = fmtScoreValue(row.value, row.unit);
  return (
    <div className="ip-card scard">
      <div className="val">
        {num}
        {unit && <span className="u">{unit}</span>}
      </div>
      <div className="metric">{row.metric}</div>
      <div className="target">
        <span className="arrow">&rarr;&nbsp;</span>
        {row.cityTarget}
      </div>
      <div className="instr">{row.goalInstrument}</div>
    </div>
  );
}

function ApplicationsTable({ applications }) {
  return (
    <div className="ip-card" style={{ padding: "20px 8px 8px" }}>
      <table className="city-table">
        <thead>
          <tr>
            <th>Application</th>
            <th>Owner / District</th>
            <th>Package</th>
            <th>Status</th>
            <th>ENERGY STAR</th>
            <th>CO&#8322;/yr</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => {
            const submitted = a.package && a.package !== "—";
            const esWarn = a.energyStarBefore < 75;
            return (
              <tr key={a.id}>
                <td>
                  <div className="t-bld">{a.building}</div>
                  <div className="t-id">{a.id}</div>
                </td>
                <td>
                  <div>{a.owner}</div>
                  <div className="t-sub">{a.district}</div>
                </td>
                <td>{a.package}</td>
                <td>
                  <span className={"pill" + (submitted ? " live" : "")}>{a.status}</span>
                </td>
                <td>
                  <span className={"es" + (esWarn ? " warn" : "")}>
                    {a.energyStarBefore}
                    {esWarn && " ⚠"}
                  </span>
                </td>
                <td>
                  <span className={"t-co2" + (a.co2TonsYr == null ? " none" : "")}>
                    {a.co2TonsYr == null ? "—" : fmtInt(a.co2TonsYr) + " t"}
                  </span>
                </td>
                <td>
                  <div className="chips">
                    {a.flags.map((f, i) => (
                      <span className="chip" key={i}>
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CityDashboard() {
  const { session, logout } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getCityPortfolio()
      .then((d) => {
        if (alive) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const displayName = session?.displayName || "City of Atlanta";

  return (
    <div className="city-root">
      <style>{CSS}</style>

      {/* 1. TOP BAR */}
      <div className="city-topbar">
        <div className="city-topbar-in">
          <div className="city-brand">
            <p className="ip-eyebrow">Mayor&apos;s Office of Sustainability &amp; Resilience</p>
            <span className="nm">City of Atlanta</span>
          </div>
          <span className="spacer" />
          <div className="city-who">
            <span className="name">{displayName}</span>
            <span className="role">{session?.subtitle || "MOSR"}</span>
          </div>
          <button className="ip-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="city-loading">
          <div className="pulse" />
          <p className="ip-mono" style={{ fontSize: 11, letterSpacing: ".14em" }}>
            LOADING CONTRIBUTION LEDGER&hellip;
          </p>
        </div>
      ) : (
        <div className="city-wrap">
          {/* 2. HERO HEADER */}
          <header className="city-hero">
            <p className="ip-eyebrow">Side-B &middot; Contribution View</p>
            <h1>
              Climate Contribution <b>Ledger</b>
            </h1>
            <p className="lede">
              Prepared for {data.preparedFor}. How proactive retrofit measures on
              existing buildings contribute toward codified city sustainability
              goals &mdash; <span className="accent">{data.plan}</span>.
            </p>
          </header>

          {/* 3. CONTRIBUTION SCORECARD */}
          <section className="city-sec">
            <div className="city-sec-head">
              <h2>Contribution Scorecard</h2>
              <p className="hint">
                Ansley Mall&apos;s Balanced (B) package, re-framed against codified
                city goals.
              </p>
            </div>
            <div className="city-grid">
              {data.scorecard.map((row, i) => (
                <ScoreCard row={row} key={i} />
              ))}
            </div>
          </section>

          {/* 4. APPLICATIONS */}
          <section className="city-sec">
            <div className="city-sec-head">
              <h2>Current Applications</h2>
              <p className="hint">Retrofit dossiers and benchmarked buildings in the city&apos;s queue.</p>
            </div>
            <ApplicationsTable applications={data.applications} />
          </section>

          {/* 5. PROACTIVE MEASURES */}
          <section className="city-sec">
            <div className="city-sec-head">
              <h2>Proactive Measures</h2>
              <p className="hint">
                What the city can do with existing buildings to reach its goals.
              </p>
            </div>
            <div className="pro-grid">
              {data.proactive.map((item, i) => (
                <div className="ip-card pro-card" key={i}>
                  <span className="lead" />
                  <span className="txt">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 6. BELTLINE NOTE */}
          <section className="city-sec" style={{ marginBottom: 0 }}>
            <div className="ip-card belt">
              <p className="ip-eyebrow eyebrow">BeltLine &amp; Methodology</p>
              <p>{data.beltline}</p>
              <p className="meth">
                Full methodology and data come from BenchmarkATL building disclosures
                and the Smart Surfaces Coalition references. Figures are illustrative
                mockup values for the demo.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
