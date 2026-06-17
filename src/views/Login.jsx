import React from "react";
import { useApp } from "../state/AppContext.jsx";

/* ----------------------------------------------------------------------------
   Login — role select (mock, no passwords). Split hero / role-card layout.
   Charcoal ground, off-white matte, one warm amber accent. Scoped under
   .login-root so styles never leak.
---------------------------------------------------------------------------- */

const CSS = `
  .login-root{position:fixed;inset:0;display:flex;background:var(--ink);color:var(--text);
    font-family:var(--font-sans);overflow:auto;-webkit-font-smoothing:antialiased;}

  /* ---- LEFT: hero ---- */
  .login-hero{position:relative;flex:0 0 55%;display:flex;flex-direction:column;justify-content:center;
    padding:64px clamp(40px,6vw,96px);overflow:hidden;
    background:
      radial-gradient(900px 600px at 18% 22%, rgba(244,196,122,0.10), transparent 60%),
      linear-gradient(160deg,#0c0d10 0%, #14161a 100%);
    border-right:1px solid var(--stroke);}
  /* faint decorative grid + glow */
  .login-hero::before{content:"";position:absolute;inset:0;pointer-events:none;
    background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);
    background-size:46px 46px;mask-image:radial-gradient(680px 540px at 30% 40%,#000,transparent 75%);}
  .login-hero::after{content:"";position:absolute;right:-160px;bottom:-160px;width:520px;height:520px;
    border-radius:50%;pointer-events:none;
    background:radial-gradient(circle,rgba(244,196,122,0.14),transparent 65%);filter:blur(8px);}
  .login-hero > *{position:relative;z-index:1;}

  .login-mark{display:inline-flex;align-items:center;gap:9px;margin:0 0 30px;}
  .login-mark .glyph{width:24px;height:24px;display:grid;place-items:center;border:1px solid var(--stroke-strong);
    border-radius:7px;color:var(--accent);background:rgba(244,196,122,.06);}
  .login-mark .nm{font-family:var(--font-mono);font-size:11px;letter-spacing:.28em;
    text-transform:uppercase;color:var(--muted);}

  .login-headline{font-family:var(--font-display);font-weight:600;
    font-size:clamp(34px,4.4vw,58px);line-height:1.05;letter-spacing:-.02em;margin:0;max-width:13ch;}
  .login-headline .amber{color:var(--accent);}
  .login-sub{font-size:15px;color:var(--muted);line-height:1.6;margin:24px 0 0;max-width:54ch;}

  .login-case{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:34px 0 0;
    font-family:var(--font-mono);font-size:11px;letter-spacing:.04em;color:var(--faint);}
  .login-case .chip{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border-radius:999px;
    border:1px solid var(--stroke);background:rgba(255,255,255,.02);color:var(--muted);}
  .login-case .chip .dot{width:5px;height:5px;border-radius:50%;background:var(--accent);
    box-shadow:0 0 7px rgba(244,196,122,.7);}

  /* ---- RIGHT: role cards ---- */
  .login-panel{flex:1;display:flex;flex-direction:column;justify-content:center;
    padding:64px clamp(32px,4vw,64px);min-width:0;}
  .login-panel-head{margin:0 0 22px;}
  .login-panel-head .ttl{font-family:var(--font-display);font-weight:500;font-size:21px;
    letter-spacing:-.01em;margin:8px 0 0;}
  .login-panel-head .cap{font-size:13px;color:var(--muted);margin:7px 0 0;line-height:1.5;}

  .login-roles{display:flex;flex-direction:column;gap:16px;max-width:440px;}
  .role-card{display:flex;align-items:flex-start;gap:16px;width:100%;text-align:left;cursor:pointer;
    padding:20px;border-radius:var(--radius);background:var(--panel);border:1px solid var(--stroke);
    color:var(--text);box-shadow:var(--shadow);backdrop-filter:blur(16px);
    transition:transform .16s ease, border-color .16s ease, background .16s ease;}
  .role-card:hover,.role-card:focus-visible{transform:translateY(-3px);border-color:var(--accent-line);
    background:rgba(244,196,122,.04);outline:none;}
  .role-card:hover .role-ic,.role-card:focus-visible .role-ic{color:var(--accent);
    border-color:var(--accent-line);background:rgba(244,196,122,.10);}
  .role-card:hover .role-go,.role-card:focus-visible .role-go{color:var(--accent);transform:translateX(3px);}
  .role-ic{flex:0 0 auto;width:46px;height:46px;display:grid;place-items:center;border-radius:11px;
    border:1px solid var(--stroke-strong);color:var(--muted);background:rgba(255,255,255,.02);
    transition:all .16s ease;}
  .role-body{flex:1;min-width:0;}
  .role-eyebrow{font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;
    color:var(--accent);margin:0 0 5px;}
  .role-name{font-family:var(--font-display);font-weight:500;font-size:16px;letter-spacing:-.01em;margin:0;
    display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .role-sub{font-size:12px;color:var(--muted);margin:3px 0 0;font-family:var(--font-mono);letter-spacing:.02em;}
  .role-desc{font-size:12.5px;color:var(--faint);line-height:1.5;margin:10px 0 0;}
  .role-go{flex:0 0 auto;color:var(--faint);transition:transform .16s ease,color .16s ease;}

  .login-foot{margin:26px 0 0;font-family:var(--font-mono);font-size:9.5px;letter-spacing:.1em;
    text-transform:uppercase;color:var(--faint);max-width:440px;line-height:1.6;}

  @media (max-width:860px){
    .login-root{flex-direction:column;position:absolute;min-height:100%;}
    .login-hero{flex:0 0 auto;border-right:none;border-bottom:1px solid var(--stroke);
      padding:48px clamp(24px,6vw,48px);}
    .login-panel{padding:40px clamp(24px,6vw,48px);}
    .login-roles,.login-panel-head{max-width:none;}
    .login-foot{max-width:none;}
  }
`;

function Leaf() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.3" strokeLinecap="round">
      <path d="M6 11V5" />
      <path d="M6 5c0-2 1.5-3.5 3.5-3.5C9.5 3.5 8 5 6 5z" />
      <path d="M6 6.5C6 5 4.6 3.8 2.7 3.8 2.7 5.3 4.1 6.5 6 6.5z" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 9h11" />
      <path d="M10 4.5L14.5 9 10 13.5" />
    </svg>
  );
}

function OwnerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-5h6v5" />
      <path d="M9 10h.01M15 10h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

function CityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M12 3l8 5H4l8-5z" />
      <path d="M6 21V10M10 21V10M14 21V10M18 21V10" />
    </svg>
  );
}

export default function Login() {
  const { login } = useApp();

  return (
    <>
      <style>{CSS}</style>
      <div className="login-root">
        {/* LEFT — hero */}
        <section className="login-hero">
          <span className="login-mark">
            <span className="glyph"><Leaf /></span>
            <span className="nm">In-Planted</span>
          </span>

          <h1 className="login-headline">
            Climate-Resilient Retrofit,<br />
            made <span className="amber">city-ready.</span>
          </h1>

          <p className="login-sub">
            Commercial building owners face multiple retrofitting and compliance steps
            before reaching the Mayor's office for approval — In-Planted turns intent
            into a city-ready proposal.
          </p>

          <div className="login-case">
            <span className="chip"><span className="dot" />Ansley Mall</span>
            <span className="chip">Selig Enterprises</span>
            <span className="chip">Atlanta BeltLine</span>
          </div>
        </section>

        {/* RIGHT — role select */}
        <section className="login-panel">
          <div className="login-panel-head">
            <p className="ip-eyebrow">Select your role</p>
            <h2 className="ttl">Sign in to continue</h2>
            <p className="cap">Pick the workspace that fits you. No password needed for the demo.</p>
          </div>

          <div className="login-roles">
            <button className="role-card" onClick={() => login("owner")}>
              <span className="role-ic"><OwnerIcon /></span>
              <span className="role-body">
                <p className="role-eyebrow">Side A · Owner</p>
                <p className="role-name">
                  Building Owner / Asset Manager
                  <span className="role-go"><Arrow /></span>
                </p>
                <p className="role-sub">Selig Enterprises · Ansley Mall</p>
                <p className="role-desc">
                  Explore the digital twin, toggle retrofit interventions, compare packages,
                  and generate the printable Retrofit Action Dossier.
                </p>
              </span>
            </button>

            <button className="role-card" onClick={() => login("city")}>
              <span className="role-ic"><CityIcon /></span>
              <span className="role-body">
                <p className="role-eyebrow">Side B · City</p>
                <p className="role-name">
                  City of Atlanta — Mayor's Office
                  <span className="role-go"><Arrow /></span>
                </p>
                <p className="role-sub">Sustainability &amp; Resilience</p>
                <p className="role-desc">
                  See submitted proposals scored against Atlanta's climate goals — CO₂, clean
                  energy, and stormwater contribution toward Climate Resilient ATL.
                </p>
              </span>
            </button>
          </div>

          <p className="login-foot">
            In-Planted · Climate-Resilient ATL — hackathon demo. Illustrative figures.
          </p>
        </section>
      </div>
    </>
  );
}
