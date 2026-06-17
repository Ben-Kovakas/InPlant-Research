/* ----------------------------------------------------------------------------
   Owner workspace — scoped CSS. One amber accent, charcoal ground, glassy
   panels, hairline strokes. Mirrors the polish of AnsleyApp but driven by the
   controlled React layer (TwinCanvas + the shared engine).
   Root class: .owner-root
---------------------------------------------------------------------------- */

export const OWNER_CSS = `
  .owner-root *{box-sizing:border-box;}
  .owner-root{position:fixed;inset:0;height:100vh;width:100vw;overflow:hidden;
    background:#0b0c0e;color:var(--text);
    font-family:var(--font-sans);-webkit-font-smoothing:antialiased;}

  /* the 3D twin fills everything; panels float over it */
  .ow-stage{position:absolute;inset:0;}
  .ow-twin{position:absolute;inset:0;}
  .ow-ui{position:absolute;inset:0;pointer-events:none;}
  .ow-ui > *{pointer-events:auto;}

  /* ---- top bar ---- */
  .ow-top{position:absolute;top:0;left:0;right:0;height:62px;display:flex;
    align-items:center;justify-content:space-between;padding:0 22px;z-index:30;
    background:linear-gradient(180deg,rgba(11,12,14,.82),rgba(11,12,14,0));}
  .ow-brand{display:flex;align-items:center;gap:13px;min-width:0;}
  .ow-glyph{width:26px;height:26px;flex:0 0 auto;display:grid;place-items:center;
    border:1px solid var(--stroke-strong);border-radius:7px;color:var(--accent);}
  .ow-brand .nm{font-family:var(--font-mono);font-size:9.5px;letter-spacing:.26em;
    text-transform:uppercase;color:var(--muted);}
  .ow-brand .ti{font-family:var(--font-display);font-weight:500;font-size:15px;
    letter-spacing:-.01em;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ow-brand .ti b{font-weight:600;}
  .ow-who{display:flex;align-items:center;gap:14px;flex:0 0 auto;}
  .ow-who .acct{text-align:right;}
  .ow-who .acct .nm{font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;
    text-transform:uppercase;color:var(--faint);}
  .ow-who .acct .dn{font-size:13px;font-weight:500;margin-top:2px;}

  /* ---- generic floating panel ---- */
  .ow-panel{background:var(--panel);border:1px solid var(--stroke);border-radius:14px;
    backdrop-filter:blur(16px);box-shadow:0 18px 50px rgba(0,0,0,.4);}
  .ow-h{font-family:var(--font-mono);font-size:9.5px;letter-spacing:.2em;
    text-transform:uppercase;color:var(--muted);margin:0 0 11px;font-weight:500;
    display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .ow-h .tag{font-family:var(--font-mono);font-size:8.5px;letter-spacing:.12em;
    padding:2px 7px;border-radius:5px;border:1px solid var(--stroke-strong);color:var(--muted);}

  /* ---- collapsible panel header / body ---- */
  /* the column wrappers hold two stacked panels each; they FLOW (never overlap),
     and each panel collapses to header-only so the others can be read independently. */
  .ow-col{position:absolute;top:74px;display:flex;flex-direction:column;gap:12px;
    z-index:20;pointer-events:none;}
  .ow-col > *{pointer-events:auto;}
  .ow-col-left{left:22px;width:276px;bottom:118px;}
  .ow-col-right{right:22px;width:308px;bottom:22px;}

  .ow-h.ow-toggle{width:100%;background:none;border:none;cursor:pointer;color:var(--muted);
    font:inherit;text-transform:uppercase;letter-spacing:.2em;font-size:9.5px;font-weight:500;
    -webkit-appearance:none;appearance:none;}
  .ow-h.ow-toggle:hover{color:var(--text);}
  .ow-h .ow-hr{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
  .ow-h .chev{display:grid;place-items:center;color:var(--muted);transition:transform .2s;}
  .ow-panel.collapsed .ow-h{margin-bottom:0;}
  .ow-panel.collapsed .chev{transform:rotate(-90deg);}
  .ow-cbody{min-height:0;overflow:auto;}
  .ow-panel.collapsed .ow-cbody{display:none;}

  /* ---- baseline card (top of left column) ---- */
  .ow-baseline{padding:15px 16px;display:flex;flex-direction:column;min-height:0;}
  .ow-score{display:flex;align-items:flex-end;gap:10px;}
  .ow-score .big{font-family:var(--font-display);font-size:42px;font-weight:600;
    line-height:.9;letter-spacing:-.02em;color:var(--warn);}
  .ow-score .of{font-family:var(--font-mono);font-size:11px;color:var(--muted);padding-bottom:5px;}
  .ow-flag{margin-top:9px;display:inline-flex;align-items:center;gap:7px;font-size:11px;
    color:var(--warn);background:rgba(231,176,138,.1);border:1px solid rgba(231,176,138,.3);
    border-radius:7px;padding:5px 9px;line-height:1.3;}
  .ow-flag svg{flex:0 0 auto;}
  .ow-meta{margin-top:12px;border-top:1px solid var(--stroke);padding-top:4px;}
  .ow-meta .row{display:flex;justify-content:space-between;align-items:center;
    padding:6px 0;border-top:1px solid var(--stroke);}
  .ow-meta .row:first-child{border-top:none;}
  .ow-meta .k{font-size:11px;color:var(--muted);}
  .ow-meta .v{font-family:var(--font-mono);font-size:11.5px;font-weight:500;}
  .ow-cbeeo{margin-top:10px;font-size:10px;color:var(--faint);line-height:1.45;
    font-family:var(--font-mono);letter-spacing:.02em;}
  .ow-cbeeo b{color:var(--accent);font-weight:500;}

  /* ---- legend / toggles (bottom of left column) ---- */
  .ow-legend{padding:14px 14px 9px;display:flex;flex-direction:column;min-height:0;}
  .ow-lrow{display:flex;align-items:flex-start;gap:11px;padding:8px;margin:0 -8px;cursor:pointer;
    user-select:none;border-radius:9px;transition:background .15s;border:1px solid transparent;}
  .ow-lrow:hover{background:rgba(255,255,255,.04);}
  .ow-lrow .sw{flex:0 0 auto;width:13px;height:13px;border-radius:4px;margin-top:3px;
    border:1px solid rgba(255,255,255,.22);}
  .ow-lrow .meta{flex:1;min-width:0;}
  .ow-lrow .name{font-size:12.5px;font-weight:500;display:flex;justify-content:space-between;
    align-items:center;gap:8px;}
  .ow-lrow .desc{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:2px;}
  .ow-tog{flex:0 0 auto;width:34px;height:19px;border-radius:11px;border:1px solid var(--stroke-strong);
    background:rgba(255,255,255,.05);position:relative;transition:all .18s;}
  .ow-tog::after{content:"";position:absolute;top:1.5px;left:1.5px;width:14px;height:14px;border-radius:50%;
    background:var(--muted);transition:all .18s;}
  .ow-lrow.on .ow-tog{background:var(--accent-dim);border-color:var(--accent-line);}
  .ow-lrow.on .ow-tog::after{left:16px;background:var(--accent);}
  .ow-lrow.off{opacity:.5;}

  /* ---- live ledger (top of right column) ---- */
  .ow-ledger{padding:15px 16px;display:flex;flex-direction:column;min-height:0;}
  .ow-live{display:flex;align-items:baseline;gap:9px;margin-bottom:4px;}
  .ow-live .now{font-family:var(--font-display);font-weight:600;font-size:30px;letter-spacing:-.02em;color:var(--accent);}
  .ow-live .u{font-family:var(--font-mono);font-size:12px;color:var(--accent);}
  .ow-live .lbl{margin-left:auto;font-family:var(--font-mono);font-size:9px;letter-spacing:.14em;
    text-transform:uppercase;color:var(--faint);}
  .ow-bar{height:2px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden;margin:0 0 8px;}
  .ow-bar > span{display:block;height:100%;background:var(--accent);transition:width .12s linear;}
  .ow-divl{font-family:var(--font-mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;
    color:var(--faint);margin:12px 0 2px;}
  .ow-stat{display:flex;justify-content:space-between;align-items:baseline;gap:8px;
    padding:7px 0;border-top:1px solid var(--stroke);}
  .ow-stat .k{font-size:11px;color:var(--muted);line-height:1.3;}
  .ow-stat .k small{display:block;font-size:9.5px;color:var(--faint);}
  .ow-stat .v{font-family:var(--font-mono);font-size:12.5px;font-weight:500;text-align:right;white-space:nowrap;}
  .ow-stat .v.amber{color:var(--accent);}
  .ow-empty{font-size:11px;color:var(--faint);font-style:italic;padding:6px 0;}

  /* ---- sun dock (bottom-center) ---- */
  .ow-dock{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);
    width:min(560px,calc(100vw - 600px));min-width:340px;padding:13px 18px 15px;z-index:25;}
  .ow-dock-top{display:flex;align-items:center;gap:13px;margin-bottom:10px;}
  .ow-play{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:1px solid var(--stroke-strong);
    background:rgba(255,255,255,.04);color:var(--text);cursor:pointer;display:grid;place-items:center;transition:all .15s;}
  .ow-play:hover{background:var(--accent-dim);border-color:var(--accent-line);color:var(--accent);}
  .ow-play:active{transform:scale(.94);}
  .ow-dock-lbl{flex:1;min-width:0;}
  .ow-dock-lbl .l1{font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);}
  .ow-dock-lbl .l2{font-size:12px;font-weight:500;margin-top:2px;}
  .ow-clock{flex:0 0 auto;text-align:right;}
  .ow-clock .t{font-family:var(--font-display);font-weight:500;font-size:20px;letter-spacing:-.02em;}
  .ow-clock .ap{font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-left:4px;}
  .ow-track{display:flex;align-items:center;gap:12px;}
  .ow-track .ico{flex:0 0 auto;color:var(--faint);display:grid;place-items:center;}
  .owner-root input[type=range]{-webkit-appearance:none;appearance:none;flex:1;height:22px;background:transparent;cursor:pointer;}
  .owner-root input[type=range]::-webkit-slider-runnable-track{height:3px;border-radius:3px;
    background:linear-gradient(90deg,#3a3d44,var(--accent),#3a3d44);}
  .owner-root input[type=range]::-moz-range-track{height:3px;border-radius:3px;
    background:linear-gradient(90deg,#3a3d44,var(--accent),#3a3d44);}
  .owner-root input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:15px;height:15px;
    border-radius:50%;margin-top:-6px;background:var(--accent);border:3px solid #14161a;
    box-shadow:0 0 0 1px var(--accent),0 0 14px rgba(244,196,122,.6);}
  .owner-root input[type=range]::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--accent);
    border:3px solid #14161a;box-shadow:0 0 0 1px var(--accent),0 0 14px rgba(244,196,122,.6);}

  /* ---- package bar (top-center) ---- */
  .ow-pkgbar{position:absolute;top:74px;left:50%;transform:translateX(-50%);z-index:20;
    display:flex;gap:10px;align-items:stretch;}
  .ow-pkg{width:150px;text-align:left;cursor:pointer;padding:11px 13px;border-radius:13px;
    background:var(--panel);border:1px solid var(--stroke);backdrop-filter:blur(16px);
    box-shadow:0 14px 40px rgba(0,0,0,.35);transition:all .16s;position:relative;}
  .ow-pkg:hover{border-color:var(--stroke-strong);}
  .ow-pkg.active{border-color:var(--accent);background:rgba(244,196,122,.07);}
  .ow-pkg .pid{font-family:var(--font-mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);}
  .ow-pkg.active .pid{color:var(--accent);}
  .ow-pkg .pn{font-family:var(--font-display);font-size:14px;font-weight:600;margin-top:3px;letter-spacing:-.01em;}
  .ow-pkg .pt{font-size:10px;color:var(--muted);margin-top:3px;line-height:1.35;}
  .ow-pkg .rec{position:absolute;top:-8px;right:10px;font-family:var(--font-mono);font-size:8px;letter-spacing:.12em;
    text-transform:uppercase;background:var(--accent);color:#14161a;border-radius:5px;padding:2px 6px;font-weight:600;}
  .ow-pkg.custom-chip{width:auto;display:flex;align-items:center;padding:0 16px;}
  .ow-pkg.custom-chip .pn{margin-top:0;}

  /* ---- next steps / application ledger (bottom of right column) ---- */
  .ow-next{padding:15px 16px;display:flex;flex-direction:column;min-height:0;}
  .ow-next .ow-cbody{display:flex;flex-direction:column;min-height:0;overflow:hidden;}
  .ow-next-scroll{overflow:auto;margin:0 -4px;padding:0 4px;flex:1;min-height:0;}
  .ow-item{display:flex;gap:11px;padding:9px 0;border-top:1px solid var(--stroke);}
  .ow-item:first-child{border-top:none;}
  .ow-chk{flex:0 0 auto;width:16px;height:16px;border-radius:5px;margin-top:1px;display:grid;place-items:center;
    border:1px solid var(--stroke-strong);font-size:10px;}
  .ow-chk.met{border-color:var(--accent-line);background:var(--accent-dim);color:var(--accent);}
  .ow-chk.gate{border-color:rgba(231,176,138,.5);color:var(--warn);}
  .ow-item .b{flex:1;min-width:0;}
  .ow-item .lab{font-size:12px;font-weight:500;line-height:1.3;}
  .ow-item .ref{font-family:var(--font-mono);font-size:9.5px;color:var(--accent);margin-top:3px;}
  .ow-item .role{font-family:var(--font-mono);font-size:9px;color:var(--faint);text-transform:uppercase;letter-spacing:.08em;}
  .ow-item .note{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:3px;}
  .ow-export{margin-top:13px;width:100%;display:flex;align-items:center;justify-content:center;gap:9px;
    padding:13px;font-size:13.5px;}

  /* keep things from colliding on smaller desktop widths */
  @media (max-width:1400px){
    .ow-pkg{width:128px;}
    .ow-pkg .pt{display:none;}
    .ow-dock{min-width:300px;}
  }
  @media (max-width:1180px){
    .ow-pkgbar{display:none;}
    .ow-col-right{width:280px;}
  }
`;
