import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import data from "./data/buildings/ansley-mall.json";

/* ----------------------------------------------------------------------------
   Ansley Mall — Climate-Resilient Retrofit
   A polished, monochrome / blueprint architectural digital-twin mockup.
   Built on the structural patterns of App.jsx (scene/sun/orbit/tags/legend),
   but completely re-skinned: charcoal background, off-white matte massing,
   graphite glassy PV, crisp white stall lines, one warm amber accent (sun + UI).
---------------------------------------------------------------------------- */

const ACCENT = "#f4c47a"; // the one restrained warm accent
const ACCENT_HEX = 0xf4c47a;

const CSS = `
  :root{
    --ink:#0b0c0e; --ink2:#16181c;
    --panel:rgba(20,22,26,0.62); --panel-solid:rgba(17,19,23,0.92);
    --stroke:rgba(255,255,255,0.09); --stroke-strong:rgba(255,255,255,0.16);
    --text:#eef0f3; --muted:#9aa0aa; --faint:#5c626c;
    --accent:${ACCENT};
  }
  .ax-root *{box-sizing:border-box;}
  .ax-root{position:fixed;inset:0;background:#0b0c0e;color:var(--text);
    font-family:"Inter",system-ui,-apple-system,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased;}
  .ax-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;}
  .ax-ui{position:absolute;inset:0;pointer-events:none;}
  .ax-ui .readout,.ax-ui .legend,.ax-ui .dock,.ax-ui .propbtn,.ax-ui .slideover{pointer-events:auto;}

  .ax-err{position:absolute;inset:0;display:none;place-items:center;padding:32px;text-align:center;
    font-family:ui-monospace,"SF Mono",monospace;font-size:13px;line-height:1.6;color:#e7b08a;background:#0b0c0e;}

  /* in-scene tags — minimal hairline cards */
  .tag{position:absolute;transform:translate(-50%,-115%);pointer-events:none;padding:5px 9px;border-radius:7px;
    white-space:nowrap;font-family:ui-monospace,"SF Mono",monospace;font-size:10.5px;font-weight:500;letter-spacing:.03em;
    color:var(--text);background:rgba(11,12,14,0.78);border:1px solid var(--stroke-strong);
    backdrop-filter:blur(7px);transition:opacity .25s;box-shadow:0 6px 22px rgba(0,0,0,.35);}
  .tag::after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);
    border:5px solid transparent;border-top-color:rgba(11,12,14,0.78);}
  .tag .dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:7px;vertical-align:middle;
    background:var(--accent);box-shadow:0 0 7px rgba(244,196,122,.7);}
  .tag .num{color:var(--accent);}

  /* brand */
  .brand{position:absolute;top:24px;left:26px;max-width:360px;}
  .mark{display:inline-flex;align-items:center;gap:8px;margin:0 0 10px;}
  .mark .glyph{width:18px;height:18px;display:grid;place-items:center;border:1px solid var(--stroke-strong);
    border-radius:5px;color:var(--accent);}
  .mark .nm{font-family:ui-monospace,"SF Mono",monospace;font-size:10.5px;letter-spacing:.26em;
    text-transform:uppercase;color:var(--muted);}
  .title{font-family:"Space Grotesk","Inter",sans-serif;font-weight:500;font-size:23px;line-height:1.16;margin:0;letter-spacing:-.01em;}
  .title b{font-weight:600;}
  .sub{font-size:12px;color:var(--muted);margin:9px 0 0;line-height:1.55;letter-spacing:.01em;}

  /* readout */
  .readout{position:absolute;top:24px;right:26px;width:248px;background:var(--panel);border:1px solid var(--stroke);
    border-radius:14px;padding:15px 17px;backdrop-filter:blur(16px);box-shadow:0 18px 50px rgba(0,0,0,.4);}
  .rhead{font-family:ui-monospace,"SF Mono",monospace;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;
    color:var(--muted);margin:0 0 12px;font-weight:500;}
  .clock{display:flex;align-items:baseline;gap:8px;margin-bottom:10px;}
  .clock .t{font-family:"Space Grotesk","Inter",sans-serif;font-weight:500;font-size:30px;letter-spacing:-.02em;}
  .clock .ampm{font-family:ui-monospace,monospace;font-size:13px;color:var(--muted);}
  .clock .phase{margin-left:auto;font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--accent);}
  .stat{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-top:1px solid var(--stroke);}
  .stat .k{font-size:11.5px;color:var(--muted);letter-spacing:.01em;}
  .stat .v{font-family:ui-monospace,monospace;font-size:13px;font-weight:500;color:var(--text);}
  .stat .v.live{color:var(--accent);}
  .bar{height:2px;border-radius:2px;background:rgba(255,255,255,.08);margin:2px 0 0;overflow:hidden;}
  .bar > span{display:block;height:100%;border-radius:2px;background:var(--accent);transition:width .12s linear;}
  .divlabel{font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;
    color:var(--faint);margin:12px 0 2px;}

  /* legend */
  .legend{position:absolute;left:26px;bottom:130px;width:272px;background:var(--panel);border:1px solid var(--stroke);
    border-radius:14px;padding:14px 14px 9px;backdrop-filter:blur(16px);box-shadow:0 18px 50px rgba(0,0,0,.4);}
  .legend h3{font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;
    color:var(--muted);margin:0 0 10px;font-weight:500;}
  .lrow{display:flex;align-items:flex-start;gap:11px;padding:7px 8px;margin:0 -8px;cursor:pointer;user-select:none;
    border-radius:8px;transition:background .15s;}
  .lrow:hover{background:rgba(255,255,255,.04);}
  .lrow .swatch{flex:0 0 auto;width:13px;height:13px;border-radius:4px;margin-top:2px;
    border:1px solid rgba(255,255,255,.22);}
  .lrow .meta{flex:1;min-width:0;}
  .lrow .name{font-size:12.5px;font-weight:500;display:flex;justify-content:space-between;align-items:center;gap:8px;}
  .lrow .desc{font-size:11px;color:var(--muted);line-height:1.4;margin-top:2px;}
  .lrow .toggle{font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.1em;border:1px solid var(--stroke-strong);
    border-radius:5px;padding:1px 6px;color:var(--muted);}
  .lrow.off{opacity:.4;} .lrow.on .toggle{color:var(--accent);border-color:rgba(244,196,122,.4);}

  /* dock / sun slider */
  .dock{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);width:min(600px,calc(100vw - 52px));
    background:var(--panel);border:1px solid var(--stroke);border-radius:16px;padding:14px 18px 16px;
    backdrop-filter:blur(16px);box-shadow:0 18px 50px rgba(0,0,0,.4);}
  .dock-top{display:flex;align-items:center;gap:14px;margin-bottom:11px;}
  .play{flex:0 0 auto;width:36px;height:36px;border-radius:50%;border:1px solid var(--stroke-strong);
    background:rgba(255,255,255,.04);color:var(--text);cursor:pointer;display:grid;place-items:center;
    transition:background .15s,transform .1s;}
  .play:hover{background:rgba(244,196,122,.12);border-color:rgba(244,196,122,.4);color:var(--accent);}
  .play:active{transform:scale(.94);}
  .dock-label{flex:1;}
  .dock-label .l1{font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);}
  .dock-label .l2{font-size:12.5px;font-weight:500;margin-top:3px;}
  .track{display:flex;align-items:center;gap:13px;}
  .track .ico{flex:0 0 auto;color:var(--faint);display:grid;place-items:center;}
  .ax-root input[type=range]{-webkit-appearance:none;appearance:none;flex:1;height:24px;background:transparent;cursor:pointer;}
  .ax-root input[type=range]::-webkit-slider-runnable-track{height:3px;border-radius:3px;
    background:linear-gradient(90deg,#3a3d44,var(--accent),#3a3d44);}
  .ax-root input[type=range]::-moz-range-track{height:3px;border-radius:3px;
    background:linear-gradient(90deg,#3a3d44,var(--accent),#3a3d44);}
  .ax-root input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;
    border-radius:50%;margin-top:-6.5px;background:var(--accent);border:3px solid #14161a;
    box-shadow:0 0 0 1px var(--accent),0 0 14px rgba(244,196,122,.6);}
  .ax-root input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--accent);
    border:3px solid #14161a;box-shadow:0 0 0 1px var(--accent),0 0 14px rgba(244,196,122,.6);}

  .hint{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);font-family:ui-monospace,monospace;
    font-size:9.5px;color:var(--faint);letter-spacing:.06em;}

  /* City-Ready Proposal button + slide-over */
  .propbtn{position:absolute;top:24px;right:290px;display:flex;align-items:center;gap:9px;
    background:var(--panel);border:1px solid var(--stroke-strong);border-radius:11px;padding:11px 15px;
    color:var(--text);font-family:"Inter",sans-serif;font-size:12.5px;font-weight:500;cursor:pointer;
    backdrop-filter:blur(16px);transition:all .15s;box-shadow:0 14px 40px rgba(0,0,0,.35);}
  .propbtn:hover{border-color:rgba(244,196,122,.5);color:var(--accent);}
  .propbtn .ic{color:var(--accent);display:grid;place-items:center;}

  .scrim{position:absolute;inset:0;background:rgba(6,7,9,0.55);backdrop-filter:blur(2px);opacity:0;
    pointer-events:none;transition:opacity .3s;}
  .scrim.open{opacity:1;pointer-events:auto;}
  .slideover{position:absolute;top:0;right:0;height:100%;width:min(440px,92vw);background:var(--panel-solid);
    border-left:1px solid var(--stroke-strong);transform:translateX(102%);transition:transform .34s cubic-bezier(.5,0,.2,1);
    backdrop-filter:blur(20px);overflow-y:auto;box-shadow:-30px 0 80px rgba(0,0,0,.5);}
  .slideover.open{transform:translateX(0);}
  .so-head{padding:24px 26px 16px;border-bottom:1px solid var(--stroke);position:sticky;top:0;
    background:var(--panel-solid);z-index:2;}
  .so-eyebrow{font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin:0 0 7px;}
  .so-title{font-family:"Space Grotesk","Inter",sans-serif;font-weight:500;font-size:19px;margin:0;letter-spacing:-.01em;}
  .so-sub{font-size:11.5px;color:var(--muted);margin:7px 0 0;line-height:1.5;}
  .so-close{position:absolute;top:22px;right:22px;width:30px;height:30px;border-radius:8px;cursor:pointer;
    border:1px solid var(--stroke-strong);background:transparent;color:var(--muted);display:grid;place-items:center;}
  .so-close:hover{color:var(--accent);border-color:rgba(244,196,122,.4);}
  .so-body{padding:8px 26px 40px;}
  .so-sec{margin-top:26px;}
  .so-sec h4{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;
    color:var(--muted);margin:0 0 4px;display:flex;align-items:center;gap:9px;}
  .so-sec h4 .n{color:var(--accent);font-size:11px;}
  .so-sec .cap{font-size:11px;color:var(--faint);margin:0 0 13px;line-height:1.5;}
  .item{display:flex;gap:12px;padding:11px 0;border-top:1px solid var(--stroke);}
  .item .lead{flex:0 0 auto;width:8px;height:8px;border-radius:2px;margin-top:5px;border:1px solid rgba(244,196,122,.55);
    background:rgba(244,196,122,.14);}
  .item .body{flex:1;min-width:0;}
  .item .lab{font-size:12.5px;font-weight:500;line-height:1.35;}
  .item .ref{font-family:ui-monospace,monospace;font-size:10.5px;color:var(--accent);margin-top:3px;}
  .item .note{font-size:11px;color:var(--muted);line-height:1.45;margin-top:4px;}
  .metricgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:6px;}
  .metric{border:1px solid var(--stroke);border-radius:10px;padding:12px 13px;background:rgba(255,255,255,.02);}
  .metric .mv{font-family:"Space Grotesk","Inter",sans-serif;font-size:19px;font-weight:500;color:var(--accent);letter-spacing:-.01em;}
  .metric .ml{font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.4;}
  .so-foot{margin-top:24px;padding:14px 0 0;border-top:1px solid var(--stroke);font-size:11px;color:var(--faint);line-height:1.55;}

  /* permit pathway */
  .badge{font-family:ui-monospace,monospace;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;
    border-radius:4px;padding:1px 6px;border:1px solid;white-space:nowrap;flex:0 0 auto;}
  .badge.required{color:#8fd9a0;border-color:rgba(143,217,160,.45);background:rgba(143,217,160,.1);}
  .badge.likely{color:var(--accent);border-color:rgba(244,196,122,.45);background:rgba(244,196,122,.1);}
  .badge.conditional{color:#9aa0aa;border-color:var(--stroke-strong);background:rgba(255,255,255,.03);}
  .item .labrow{display:flex;align-items:flex-start;gap:8px;justify-content:space-between;}
  .item .office{font-size:10.5px;color:var(--muted);margin-top:3px;}
  .pulllist{margin:8px 0 0;padding:0;list-style:none;}
  .pulllist li{font-size:11px;color:var(--muted);line-height:1.4;padding:5px 0 5px 14px;position:relative;border-top:1px solid var(--stroke);}
  .pulllist li:first-child{border-top:none;}
  .pulllist li::before{content:"?";position:absolute;left:0;top:5px;color:var(--accent);font-family:ui-monospace,monospace;font-size:10px;}
  .pulllist li b{color:var(--text);font-weight:500;}

  @media (max-width:760px){
    .brand{top:14px;left:14px;max-width:60vw;} .title{font-size:17px;} .sub{display:none;}
    .readout{top:12px;right:12px;width:160px;padding:12px;} .clock .t{font-size:22px;}
    .legend{left:12px;right:12px;width:auto;bottom:152px;} .legend .desc{display:none;}
    .dock{bottom:14px;} .hint{display:none;}
    .propbtn{top:auto;bottom:200px;right:12px;}
  }
`;

export default function AnsleyApp() {
  const canvasRef = useRef(null);
  const uiRef = useRef(null);
  const errRef = useRef(null);
  const scrimRef = useRef(null);
  const soRef = useRef(null);

  // ---- build the proposal slide-over content from the fixture ----
  const codes = data.codes || [];
  const incentives = data.incentives || [];
  const cc = data.cityContribution || {};
  const bt = data.buildingTotals || {};
  const pp = data.permitPathway || {};
  const ppApps = pp.applications || [];
  const ppPull = pp.needsDataPull || [];

  const openProposal = () => { scrimRef.current?.classList.add("open"); soRef.current?.classList.add("open"); };
  const closeProposal = () => { scrimRef.current?.classList.remove("open"); soRef.current?.classList.remove("open"); };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ui = uiRef.current;
    const $ = (id) => ui.querySelector("#" + id);
    let raf = 0, ro = null;

    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;

      const scene = new THREE.Scene();
      const BG_DAY = new THREE.Color(0x14161a);
      scene.background = BG_DAY.clone();
      scene.fog = new THREE.Fog(0x14161a, 78, 220);

      const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 700);

      // ---- camera orbit (manual; matches App.jsx) ----
      const tgt = new THREE.Vector3(0, 2.5, 0);
      const orbit = { radius: 78, theta: 0.7, phi: 0.78 };
      function applyCamera() {
        const { radius: r, phi: p, theta: t } = orbit;
        camera.position.set(
          tgt.x + r * Math.sin(p) * Math.sin(t),
          tgt.y + r * Math.cos(p),
          tgt.z + r * Math.sin(p) * Math.cos(t)
        );
        camera.lookAt(tgt);
      }
      let drag = false, lx = 0, ly = 0;
      const down = (e) => { drag = true; lx = e.clientX; ly = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} };
      const up = () => { drag = false; };
      const move = (e) => {
        if (!drag) return;
        orbit.theta -= (e.clientX - lx) * 0.005;
        orbit.phi = Math.max(0.18, Math.min(1.35, orbit.phi - (e.clientY - ly) * 0.004));
        lx = e.clientX; ly = e.clientY; applyCamera();
      };
      const wheel = (e) => { e.preventDefault(); orbit.radius = Math.max(36, Math.min(150, orbit.radius + e.deltaY * 0.05)); applyCamera(); };
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("wheel", wheel, { passive: false });

      // ---- lights ----
      const amb = new THREE.AmbientLight(0xffffff, 0.42);
      scene.add(amb);
      const hemi = new THREE.HemisphereLight(0xb8c0cc, 0x22242a, 0.55);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfff0d6, 2.2);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 260;
      sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
      sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
      sun.shadow.bias = -0.0004;
      sun.target.position.set(0, 0, 0);
      scene.add(sun, sun.target);
      // soft fill from opposite side, keeps shadows readable not black
      const fill = new THREE.DirectionalLight(0xc6ccd6, 0.25);
      fill.position.set(-40, 30, -50);
      scene.add(fill);

      // ---- shared materials (monochrome palette) ----
      const matGroundDark = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 1 });
      const matLot        = new THREE.MeshStandardMaterial({ color: 0x33363c, roughness: 0.96 });
      const matWall       = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.92 });
      const matWall2      = new THREE.MeshStandardMaterial({ color: 0xcfcbc2, roughness: 0.92 });
      const matRoof       = new THREE.MeshStandardMaterial({ color: 0x4a4d54, roughness: 0.95 });
      const matParapet    = new THREE.MeshStandardMaterial({ color: 0xb7b3aa, roughness: 0.9 });
      const matPanel      = new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 0.22, metalness: 0.55 });
      const matPanelTrim  = new THREE.MeshStandardMaterial({ color: 0x6b7079, roughness: 0.5, metalness: 0.4 });
      const matPost       = new THREE.MeshStandardMaterial({ color: 0x55585f, roughness: 0.6, metalness: 0.3 });
      const matCar        = new THREE.MeshStandardMaterial({ color: 0x787c84, roughness: 0.55, metalness: 0.25 });
      const matTrunk      = new THREE.MeshStandardMaterial({ color: 0x4d4a44, roughness: 1 });
      const matLeaf       = new THREE.MeshStandardMaterial({ color: 0x6f7c6a, roughness: 1 });   // desaturated gray-green
      const matLeaf2      = new THREE.MeshStandardMaterial({ color: 0x7e8a78, roughness: 1 });
      const matGreenRoof  = new THREE.MeshStandardMaterial({ color: 0x66735f, roughness: 1 });
      const matBeltPlant  = new THREE.MeshStandardMaterial({ color: 0x73806c, roughness: 1 });
      const matPath       = new THREE.MeshStandardMaterial({ color: 0x55575c, roughness: 1 });

      // shared geometries
      const geoTrunk = new THREE.CylinderGeometry(0.16, 0.22, 1.6, 7);
      const geoLeaf  = new THREE.IcosahedronGeometry(1, 0); // low-poly muted canopy
      const geoCar   = new THREE.BoxGeometry(2.0, 0.9, 4.3);
      const geoCarTop= new THREE.BoxGeometry(1.7, 0.7, 2.2);
      const geoPanel = new THREE.BoxGeometry(1, 0.08, 1);

      // ---- groups (layer toggles) ----
      const gRoofSolar = new THREE.Group();
      const gLotCanopy = new THREE.Group();
      const gGreenRoof = new THREE.Group();
      const gStorm     = new THREE.Group(); // stormwater / trees
      const gBeltline  = new THREE.Group();
      const gStatic    = new THREE.Group(); // buildings, lot, cars (always on)
      scene.add(gRoofSolar, gLotCanopy, gGreenRoof, gStorm, gBeltline, gStatic);

      // ---- ground ----
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), matGroundDark);
      ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
      scene.add(ground);

      // faint blueprint grid on the ground
      const grid = new THREE.GridHelper(420, 84, 0x2a2d33, 0x202227);
      grid.position.y = 0.0; grid.material.opacity = 0.5; grid.material.transparent = true;
      scene.add(grid);

      /* --------------------------------------------------------------------
         SITE LAYOUT (top-down, units ~meters at 1:1-ish demo scale)
         X = east(+), Z = south(+). Comb/L footprint of low retail wings.
         Parking wraps north (−Z) and east (+X). BeltLine along west (−X).
      -------------------------------------------------------------------- */

      // helper: a retail wing (flat-roof box w/ parapet + darker roof + storefront stripe)
      const wings = []; // store {x,z,w,d,h} for solar placement
      function addWing(cx, cz, w, d, h, wallMat) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat || matWall);
        box.position.set(cx, h / 2, cz); box.castShadow = true; box.receiveShadow = true;
        gStatic.add(box);
        // roof deck (slightly darker, inset)
        const roof = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.4, d - 0.6), matRoof);
        roof.position.set(cx, h + 0.0, cz); roof.receiveShadow = true; roof.castShadow = true;
        gStatic.add(roof);
        // parapet rim
        const rimH = 0.7;
        const parN = new THREE.Mesh(new THREE.BoxGeometry(w, rimH, 0.5), matParapet);
        parN.position.set(cx, h + rimH / 2, cz - d / 2 + 0.25); parN.castShadow = true; gStatic.add(parN);
        const parS = parN.clone(); parS.position.z = cz + d / 2 - 0.25; gStatic.add(parS);
        const parE = new THREE.Mesh(new THREE.BoxGeometry(0.5, rimH, d), matParapet);
        parE.position.set(cx + w / 2 - 0.25, h + rimH / 2, cz); parE.castShadow = true; gStatic.add(parE);
        const parW = parE.clone(); parW.position.x = cx - w / 2 + 0.25; gStatic.add(parW);
        // storefront base stripe (darker band at ground, reads as glazing)
        const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 2.3, d + 0.05),
          new THREE.MeshStandardMaterial({ color: 0x3c3f46, roughness: 0.4, metalness: 0.3 }));
        base.position.set(cx, 1.15, cz); gStatic.add(base);
        wings.push({ x: cx, z: cz, w, d, h });
        return { cx, cz, w, d, h };
      }

      // Comb/L footprint — a main spine wing + perpendicular arms (Ansley-like)
      const H = 7.0;
      addWing(-6, 4, 46, 16, H, matWall);          // long main spine (E-W)
      addWing(-22, -10, 14, 24, H, matWall2);      // north-west arm
      addWing(-2, -12, 13, 20, H, matWall);        // north-center arm
      addWing(16, -9, 12, 22, H + 0.6, matWall2);  // north-east anchor (slightly taller)
      addWing(22, 6, 18, 12, H, matWall);          // east arm

      // ---- rooftop solar arrays: neat dark glassy panel grids over roof planes ----
      function addRoofArray(cx, cz, w, d, h) {
        const inset = 1.6;
        const aw = w - inset * 2, ad = d - inset * 2;
        const cell = 2.2, gap = 0.25;
        const cols = Math.max(1, Math.floor(aw / cell));
        const rows = Math.max(1, Math.floor(ad / cell));
        const usableW = cols * cell - gap, usableD = rows * cell - gap;
        const x0 = cx - usableW / 2 + cell / 2;
        const z0 = cz - usableD / 2 + cell / 2;
        const pw = cell - gap, pd = cell - gap;
        const tilt = -0.14; // slight south tilt for sheen
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const p = new THREE.Mesh(geoPanel, matPanel);
            p.scale.set(pw, 1, pd);
            p.position.set(x0 + c * cell, h + 0.55, z0 + r * cell);
            p.rotation.x = tilt;
            p.castShadow = true; p.receiveShadow = true;
            gRoofSolar.add(p);
          }
        }
        // thin trim frame around the array
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(usableW + 0.4, 0.12, usableD + 0.4), matPanelTrim);
        frame.position.set(cx, h + 0.46, cz);
        gRoofSolar.add(frame);
      }
      // cover most roof planes (skip the green-roof wing partially)
      addRoofArray(-6, 7, 46, 9, H);     // main spine south band
      addRoofArray(-22, -10, 14, 24, H); // NW arm
      addRoofArray(-2, -12, 13, 20, H);  // N-center arm
      addRoofArray(16, -9, 12, 22, H + 0.6); // NE anchor
      addRoofArray(22, 6, 18, 12, H);    // east arm

      // ---- green roof: planted band on part of the main spine (biosolar split) ----
      (() => {
        const gx = -6, gz = -1, gw = 44, gd = 5;
        const bed = new THREE.Mesh(new THREE.BoxGeometry(gw, 0.5, gd), matGreenRoof);
        bed.position.set(gx, H + 0.45, gz); bed.castShadow = true; bed.receiveShadow = true;
        gGreenRoof.add(bed);
        // tufts
        for (let i = 0; i < 80; i++) {
          const s = 0.28 + Math.random() * 0.4;
          const t = new THREE.Mesh(geoLeaf, Math.random() > 0.5 ? matLeaf : matLeaf2);
          t.scale.set(s, s * 0.55, s);
          t.position.set(gx + (Math.random() - 0.5) * (gw - 1), H + 0.8, gz + (Math.random() - 0.5) * (gd - 0.6));
          t.castShadow = true; gGreenRoof.add(t);
        }
      })();

      // ---- parking lot: wraps north (−Z) and east (+X) ----
      function addLot(cx, cz, w, d) {
        const lot = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matLot);
        lot.rotation.x = -Math.PI / 2; lot.position.set(cx, 0.01, cz); lot.receiveShadow = true;
        gStatic.add(lot);
        return { cx, cz, w, d };
      }
      const lotNorth = addLot(0, -34, 96, 30);
      const lotEast  = addLot(46, 2, 26, 64);

      // crisp white stall lines (thin instanced-ish via merged simple planes)
      const stallMat = new THREE.MeshBasicMaterial({ color: 0xe9e9ea, transparent: true, opacity: 0.62 });
      function stallLines(lot, dir) {
        // dir 'h': lines run along z, repeated along x ; 'v': inverse
        const lineLen = 5.0, spacing = 2.6;
        if (dir === "h") {
          const count = Math.floor(lot.w / spacing);
          for (let i = 0; i <= count; i++) {
            const x = lot.cx - lot.w / 2 + i * spacing;
            for (const zoff of [-lineLen / 2 - 2, lineLen / 2 + 2]) {
              const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.12, lineLen), stallMat);
              ln.rotation.x = -Math.PI / 2; ln.position.set(x, 0.03, lot.cz + zoff);
              gStatic.add(ln);
            }
          }
        } else {
          const count = Math.floor(lot.d / spacing);
          for (let i = 0; i <= count; i++) {
            const z = lot.cz - lot.d / 2 + i * spacing;
            for (const xoff of [-lineLen / 2 - 2, lineLen / 2 + 2]) {
              const ln = new THREE.Mesh(new THREE.PlaneGeometry(lineLen, 0.12), stallMat);
              ln.rotation.x = -Math.PI / 2; ln.position.set(lot.cx + xoff, 0.03, z);
              gStatic.add(ln);
            }
          }
        }
      }
      stallLines(lotNorth, "h");
      stallLines(lotEast, "v");

      // a few small car forms (kept quiet, monochrome)
      function addCar(x, z, rot) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(geoCar, matCar); body.position.y = 0.55; body.castShadow = true; g.add(body);
        const top = new THREE.Mesh(geoCarTop, matCar); top.position.set(0, 1.15, -0.2); top.castShadow = true; g.add(top);
        g.position.set(x, 0, z); g.rotation.y = rot;
        gStatic.add(g);
      }
      // scatter cars in the north lot rows (not under canopies)
      for (let i = 0; i < 11; i++) addCar(-40 + i * 5.4, -41, 0);
      for (let i = 0; i < 8; i++) addCar(-30 + i * 5.4, -27.5, Math.PI);
      for (let i = 0; i < 7; i++) addCar(52, -22 + i * 6, Math.PI / 2);

      // ---- solar carport canopies (signature lot intervention) ----
      function addCanopyRow(cx, cz, len, rot) {
        const g = new THREE.Group();
        const colW = 2.4, n = Math.max(2, Math.round(len / colW));
        const deckW = n * colW;
        const deckD = 5.4;
        const h = 3.0, tilt = 0.12;
        // posts
        for (const side of [-deckD / 2 + 0.4, deckD / 2 - 0.4]) {
          for (let i = 0; i <= n; i += 2) {
            const x = -deckW / 2 + i * colW;
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, h, 8), matPost);
            post.position.set(x, h / 2, side); post.castShadow = true; g.add(post);
          }
        }
        // beam
        const beam = new THREE.Mesh(new THREE.BoxGeometry(deckW + 0.6, 0.3, 0.3), matPost);
        beam.position.set(0, h + 0.1, 0); g.add(beam);
        // angled panel deck made of dark glassy cells
        const cell = 2.2;
        const cols = Math.max(1, Math.floor(deckW / cell));
        const rows = Math.max(1, Math.floor(deckD / cell));
        const x0 = -(cols * cell) / 2 + cell / 2;
        const z0 = -(rows * cell) / 2 + cell / 2;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const p = new THREE.Mesh(geoPanel, matPanel);
          p.scale.set(cell - 0.2, 1, cell - 0.2);
          p.position.set(x0 + c * cell, h + 0.45 + (z0 + r * cell) * Math.sin(tilt), z0 + r * cell);
          p.rotation.x = tilt; p.castShadow = true; p.receiveShadow = true;
          g.add(p);
        }
        const trim = new THREE.Mesh(new THREE.BoxGeometry(deckW + 0.3, 0.1, deckD + 0.3), matPanelTrim);
        trim.position.set(0, h + 0.3, 0); trim.rotation.x = tilt; g.add(trim);
        g.position.set(cx, 0, cz); g.rotation.y = rot;
        gLotCanopy.add(g);
      }
      // a portion of the north lot covered by canopy rows
      addCanopyRow(-10, -33, 30, 0);
      addCanopyRow(20, -33, 22, 0);
      addCanopyRow(-10, -39, 30, 0);

      // ---- trees / greenery (stormwater + trees layer) ----
      function addTree(x, z, scale) {
        const g = new THREE.Group();
        const tr = new THREE.Mesh(geoTrunk, matTrunk); tr.position.y = 0.8 * scale; tr.scale.setScalar(scale);
        tr.castShadow = true; g.add(tr);
        const cn = new THREE.Mesh(geoLeaf, Math.random() > 0.5 ? matLeaf : matLeaf2);
        const s = (1.4 + Math.random() * 0.6) * scale;
        cn.scale.set(s, s * 1.1, s); cn.position.y = (1.7 + s * 0.6) * scale * 0.85;
        cn.castShadow = true; g.add(cn);
        g.position.set(x, 0, z);
        gStorm.add(g);
      }
      // perimeter + lot trees (ordinance: ~1 tree / 8 spaces)
      const treeSpots = [];
      for (let i = 0; i < 12; i++) treeSpots.push([-44 + i * 8, -49 + Math.random() * 2]);   // north edge
      for (let i = 0; i < 8; i++) treeSpots.push([-38 + i * 9, -33.5]);                       // lot islands N
      for (let i = 0; i < 7; i++) treeSpots.push([60, -24 + i * 8]);                          // east edge
      for (let i = 0; i < 6; i++) treeSpots.push([-6 + i * 8, 16 + Math.random() * 2]);       // south edge
      treeSpots.forEach(([x, z]) => addTree(x, z, 0.9 + Math.random() * 0.5));

      // a couple of bioswale strips (stormwater) in the lot — muted green channels
      [[-10, -45, 34], [20, -45, 22]].forEach(([x, z, w]) => {
        const sw = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 2.2), matBeltPlant);
        sw.position.set(x, 0.09, z); sw.receiveShadow = true; gStorm.add(sw);
      });

      // ---- BeltLine green corridor (west edge, −X) ----
      (() => {
        const bx = -46, bz = 0, bw = 7, bd = 96;
        // planted linear strip
        const strip = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.16, bd), matBeltPlant);
        strip.position.set(bx, 0.08, bz); strip.receiveShadow = true; gBeltline.add(strip);
        // path running through it
        const path = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, bd), matPath);
        path.position.set(bx, 0.1, bz); path.receiveShadow = true; gBeltline.add(path);
        // lattice posts + cabling along the corridor (the "lattice" signature)
        for (let i = 0; i < 16; i++) {
          const z = bz - bd / 2 + 3 + i * (bd / 16);
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.2, 6), matPost);
          post.position.set(bx + bw / 2 - 0.4, 2.1, z); post.castShadow = true; gBeltline.add(post);
        }
        // top rail
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, bd - 3), matPanelTrim);
        rail.position.set(bx + bw / 2 - 0.4, 4.0, bz); gBeltline.add(rail);
        // corridor trees / planting clusters
        for (let i = 0; i < 14; i++) {
          const z = bz - bd / 2 + 4 + i * (bd / 14);
          const cn = new THREE.Mesh(geoLeaf, Math.random() > 0.5 ? matLeaf : matLeaf2);
          const s = 1.3 + Math.random() * 0.7;
          cn.scale.set(s, s * 1.1, s); cn.position.set(bx - bw / 2 + 1 + Math.random() * 2, 1.8, z);
          cn.castShadow = true; gBeltline.add(cn);
        }
      })();

      // ---- sun + arc (reuses App.jsx math) ----
      const ELEV_MAX = (74 * Math.PI) / 180, ARC_R = 130;
      function sunDir(t) {
        const elev = ELEV_MAX * Math.sin(Math.PI * t), horiz = Math.cos(elev);
        return new THREE.Vector3(
          horiz * Math.cos(Math.PI * t),
          Math.sin(elev),
          horiz * 0.5 * Math.sin(Math.PI * t) + 0.1
        ).normalize();
      }
      const sunBall = new THREE.Mesh(new THREE.SphereGeometry(4.2, 24, 24),
        new THREE.MeshBasicMaterial({ color: ACCENT_HEX }));
      scene.add(sunBall);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(8.5, 20, 20),
        new THREE.MeshBasicMaterial({ color: ACCENT_HEX, transparent: true, opacity: 0.16 }));
      sunBall.add(halo);

      const arcPts = [];
      for (let i = 0; i <= 64; i++) arcPts.push(sunDir(i / 64).multiplyScalar(ARC_R));
      const arc = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 64, 0.28, 8, false),
        new THREE.MeshBasicMaterial({ color: ACCENT_HEX, transparent: true, opacity: 0.42 })
      );
      scene.add(arc);

      // ---- subtle monochrome sky tone shift across the day ----
      const C = (h) => new THREE.Color(h);
      const skyKeys = [
        { t: 0, c: C(0x101012) },     // dawn — near black, faintly warm
        { t: 0.5, c: C(0x1b1e24) },   // midday — cool charcoal
        { t: 1, c: C(0x121013) },     // dusk
      ];
      const sunColKeys = [
        { t: 0, c: C(0xe09a52) },
        { t: 0.5, c: C(0xfff0d6) },
        { t: 1, c: C(0xe0894a) },
      ];
      function lerpKey(arr, t) {
        for (let i = 0; i < arr.length - 1; i++) if (t <= arr[i + 1].t) {
          const a = arr[i], b = arr[i + 1]; return a.c.clone().lerp(b.c, (t - a.t) / (b.t - a.t));
        }
        return arr[arr.length - 1].c.clone();
      }

      // ---- UI state + readout ----
      let playing = false, tVal = 0.5;
      const slider = $("sun");
      const fmt = (t) => {
        const hf = 6 + t * 12; let h = Math.floor(hf); const m = Math.round((hf - h) * 60);
        const ampm = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12;
        return { hm: hh + ":" + String(m).padStart(2, "0"), ampm };
      };
      const phase = (t) => t < 0.12 ? "Sunrise" : t < 0.38 ? "Morning" : t < 0.62 ? "Midday" : t < 0.88 ? "Afternoon" : "Sunset";

      // static headline figures from fixture
      $("s-cap").textContent = (bt.combinedSolarKwDc / 1000).toFixed(2) + " MW";
      $("s-gen").textContent = (bt.combinedAnnualKwh / 1e6).toFixed(2) + " GWh";
      $("s-co2").textContent = bt.combinedCo2TonsYr.toLocaleString() + " t";
      $("s-off").textContent = bt.pctOfBuildingLoadOffset.value + "%";
      $("s-storm").textContent = (bt.stormwaterGalYr / 1e6).toFixed(1) + "M gal";
      $("s-pay").textContent = bt.paybackYearsRange.low + "–" + bt.paybackYearsRange.high + " yr";

      function update() {
        const dir = sunDir(tVal), height = Math.max(0, Math.sin(Math.PI * tVal));
        sun.position.copy(dir).multiplyScalar(150);
        sunBall.position.copy(dir).multiplyScalar(ARC_R);
        sun.intensity = 0.35 + 2.2 * height;
        hemi.intensity = 0.4 + 0.35 * height;
        amb.intensity = 0.3 + 0.18 * height;
        const sc = lerpKey(sunColKeys, tVal);
        sun.color.copy(sc); sunBall.material.color.copy(sc); halo.material.color.copy(sc);
        const bg = lerpKey(skyKeys, tVal);
        scene.background.copy(bg); scene.fog.color.copy(bg);
        // clock + live stats
        const tm = fmt(tVal);
        $("r-time").textContent = tm.hm; $("r-ampm").textContent = tm.ampm; $("r-phase").textContent = phase(tVal);
        $("r-elev").textContent = Math.round((ELEV_MAX * 180 / Math.PI) * height) + "°";
        // instantaneous solar capture (live, responds to sun)
        const capPct = Math.round(98 * height);
        $("r-cap").textContent = capPct + "%"; $("r-cap-bar").style.width = capPct + "%";
        // instantaneous output derived from annual avg, scaled by sun height (live)
        const peakMw = bt.combinedSolarKwDc / 1000;
        const nowMw = (peakMw * height).toFixed(2);
        $("r-now").textContent = nowMw + " MW";
      }

      const onSlide = () => { tVal = slider.value / 1000; if (playing) setPlay(false); update(); };
      slider.addEventListener("input", onSlide);

      const playIcon = $("play-icon");
      function setPlay(p) {
        playing = p;
        playIcon.innerHTML = p
          ? '<rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/>'
          : '<path d="M3 1.5l9 5.5-9 5.5z"/>';
      }
      const playBtn = $("play");
      const onPlay = () => setPlay(!playing);
      playBtn.addEventListener("click", onPlay);

      // ---- layer toggles ----
      const groups = {
        roofSolar: gRoofSolar, lotCanopy: gLotCanopy, greenRoof: gGreenRoof,
        storm: gStorm, beltline: gBeltline,
      };
      const tags = {
        roofSolar: $("tag-roof"), lotCanopy: $("tag-canopy"), greenRoof: $("tag-green"),
        storm: $("tag-storm"), beltline: $("tag-belt"),
      };
      const rowHandlers = [];
      Array.from(ui.querySelectorAll(".lrow")).forEach((row) => {
        const toggle = () => {
          const layer = row.dataset.layer;
          const on = row.classList.toggle("off") === false;
          row.classList.toggle("on", on); row.setAttribute("aria-pressed", String(on));
          row.querySelector(".toggle").textContent = on ? "ON" : "OFF";
          if (groups[layer]) groups[layer].visible = on;
          if (tags[layer]) tags[layer].style.opacity = on ? "1" : "0";
        };
        const key = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } };
        row.addEventListener("click", toggle); row.addEventListener("keydown", key);
        rowHandlers.push([row, toggle, key]);
      });

      // ---- floating in-scene labels ----
      const anchors = {
        roofSolar: new THREE.Vector3(-2, H + 4, -12),
        lotCanopy: new THREE.Vector3(-10, 4.5, -33),
        greenRoof: new THREE.Vector3(-6, H + 2.5, -1),
        storm:     new THREE.Vector3(-44, 5, -49),
        beltline:  new THREE.Vector3(-46, 5, -30),
      };
      const pv = new THREE.Vector3();
      function placeTags(w, h) {
        for (const k in anchors) {
          pv.copy(anchors[k]).project(camera);
          const el = tags[k];
          if (!el) continue;
          if (pv.z > 1 || (groups[k] && groups[k].visible === false)) { el.style.display = "none"; continue; }
          el.style.display = "block";
          el.style.left = (pv.x * 0.5 + 0.5) * w + "px";
          el.style.top = (-pv.y * 0.5 + 0.5) * h + "px";
        }
      }

      // ---- sizing ----
      function setSize() {
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.floor(rect.width)), h = Math.max(1, Math.floor(rect.height));
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        return [w, h];
      }
      let size = setSize();
      ro = new ResizeObserver(() => { size = setSize(); });
      ro.observe(canvas);

      applyCamera(); update();
      renderer.render(scene, camera);

      let last = performance.now();
      function loop(now) {
        const dt = (now - last) / 1000; last = now;
        if (playing) { tVal += dt * 0.06; if (tVal > 1) tVal = 0; slider.value = Math.round(tVal * 1000); update(); }
        placeTags(size[0], size[1]);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        canvas.removeEventListener("pointerdown", down);
        canvas.removeEventListener("pointerup", up);
        canvas.removeEventListener("pointercancel", up);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("wheel", wheel);
        slider.removeEventListener("input", onSlide);
        playBtn.removeEventListener("click", onPlay);
        rowHandlers.forEach(([row, t, k]) => { row.removeEventListener("click", t); row.removeEventListener("keydown", k); });
        renderer.dispose();
      };
    } catch (err) {
      if (errRef.current) {
        errRef.current.style.display = "grid";
        errRef.current.textContent = "3D failed to initialize: " + (err && err.message ? err.message : String(err));
      }
      // eslint-disable-next-line no-console
      console.error(err);
      return () => {};
    }
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="ax-root">
        <canvas className="ax-canvas" ref={canvasRef} />

        {/* in-scene 3D + HUD layer (innerHTML-driven, like App.jsx) */}
        <div className="ax-ui" ref={uiRef} dangerouslySetInnerHTML={{ __html: `
          <div class="tag" id="tag-roof"><span class="dot"></span>Rooftop PV · <span class="num">1.84&nbsp;MW</span></div>
          <div class="tag" id="tag-canopy"><span class="dot"></span>Lot canopies · <span class="num">~1.4&nbsp;MW</span></div>
          <div class="tag" id="tag-green"><span class="dot"></span>Green roof · <span class="num">2.4M&nbsp;gal/yr</span></div>
          <div class="tag" id="tag-storm"><span class="dot"></span>Trees · <span class="num">~80 lot trees</span></div>
          <div class="tag" id="tag-belt"><span class="dot"></span>BeltLine lattice corridor</div>

          <div class="brand">
            <span class="mark">
              <span class="glyph"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M6 11V5"/><path d="M6 5c0-2 1.5-3.5 3.5-3.5C9.5 3.5 8 5 6 5z"/><path d="M6 6.5C6 5 4.6 3.8 2.7 3.8 2.7 5.3 4.1 6.5 6 6.5z"/></svg></span>
              <span class="nm">In-Planted</span>
            </span>
            <h1 class="title">Ansley Mall — <b>Climate-Resilient Retrofit</b></h1>
            <p class="sub">Selig Enterprises · Midtown / BeltLine. A digital-twin study of a low-rise retail block re-tagged for rooftop &amp; lot solar, green roof, and stormwater. Drag the sun across the day to watch capture shift.</p>
          </div>

          <div class="readout">
            <p class="rhead">Live · Sun-driven</p>
            <div class="clock"><span class="t" id="r-time">11:42</span><span class="ampm" id="r-ampm">AM</span><span class="phase" id="r-phase">Midday</span></div>
            <div class="stat"><span class="k">Sun elevation</span><span class="v" id="r-elev">74°</span></div>
            <div class="stat"><span class="k">Solar capture</span><span class="v live" id="r-cap">98%</span></div>
            <div class="bar"><span id="r-cap-bar" style="width:98%"></span></div>
            <div class="stat"><span class="k">Instant output</span><span class="v live" id="r-now">3.24 MW</span></div>

            <p class="divlabel">Project headline · annual</p>
            <div class="stat"><span class="k">Solar capacity</span><span class="v" id="s-cap">3.24 MW</span></div>
            <div class="stat"><span class="k">Generation</span><span class="v" id="s-gen">4.34 GWh</span></div>
            <div class="stat"><span class="k">CO₂ avoided</span><span class="v" id="s-co2">1,665 t</span></div>
            <div class="stat"><span class="k">Building load offset</span><span class="v" id="s-off">32%</span></div>
            <div class="stat"><span class="k">Stormwater retained</span><span class="v" id="s-storm">2.4M gal</span></div>
            <div class="stat"><span class="k">Payback band</span><span class="v" id="s-pay">2.5–8 yr</span></div>
          </div>

          <div class="legend">
            <h3>Intervention layers</h3>
            <div class="lrow on" data-layer="roofSolar" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:#23252d"></span><span class="meta"><span class="name">Rooftop Solar <span class="toggle">ON</span></span><span class="desc">Glassy PV grids across the roof planes</span></span></div>
            <div class="lrow on" data-layer="lotCanopy" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:#2c2e36"></span><span class="meta"><span class="name">Lot Canopy Solar <span class="toggle">ON</span></span><span class="desc">Angled carport canopies over parking</span></span></div>
            <div class="lrow on" data-layer="greenRoof" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:#66735f"></span><span class="meta"><span class="name">Green Roof <span class="toggle">ON</span></span><span class="desc">Planted band — stormwater retention</span></span></div>
            <div class="lrow on" data-layer="storm" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:#6f7c6a"></span><span class="meta"><span class="name">Stormwater / Trees <span class="toggle">ON</span></span><span class="desc">Lot trees + bioswale channels</span></span></div>
            <div class="lrow on" data-layer="beltline" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:#73806c"></span><span class="meta"><span class="name">BeltLine Lattice <span class="toggle">ON</span></span><span class="desc">Planted west-edge green corridor</span></span></div>
          </div>

          <div class="dock">
            <div class="dock-top">
              <button class="play" id="play" aria-label="Play sun animation"><svg id="play-icon" width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l9 5.5-9 5.5z"/></svg></button>
              <div class="dock-label"><div class="l1">Sun path</div><div class="l2">June 21 · summer solstice · 33.8°N</div></div>
            </div>
            <div class="track">
              <span class="ico" title="Sunrise"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><path d="M8 6l4-4 4 4"/></svg></span>
              <input type="range" id="sun" min="0" max="1000" value="500" aria-label="Time of day" />
              <span class="ico" title="Sunset"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="3" y1="18" x2="21" y2="18"/><path d="M12 6V2"/><path d="M16 4l-4 4-4-4"/></svg></span>
            </div>
          </div>

          <div class="hint">drag to orbit · scroll to zoom</div>
        ` }} />

        {/* City-Ready Proposal trigger */}
        <button className="propbtn" onClick={openProposal}>
          <span className="ic">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="1.5" width="11" height="13" rx="1.2" />
              <line x1="5" y1="5" x2="11" y2="5" /><line x1="5" y1="8" x2="11" y2="8" /><line x1="5" y1="11" x2="9" y2="11" />
            </svg>
          </span>
          City-Ready Proposal
        </button>

        {/* scrim + slide-over digest */}
        <div className="scrim" ref={scrimRef} onClick={closeProposal} />
        <aside className="slideover" ref={soRef} aria-label="City-Ready Proposal digest">
          <div className="so-head">
            <p className="so-eyebrow">In-Planted · City-Ready Digest</p>
            <h2 className="so-title">Ansley Mall — Proposal Summary</h2>
            <p className="so-sub">{data.address} · {data.owner}. The in-product digest of codes, incentives, and the contribution to Atlanta's climate goals.</p>
            <button className="so-close" onClick={closeProposal} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8" /></svg>
            </button>
          </div>

          <div className="so-body">
            {/* 1. Codes */}
            <div className="so-sec">
              <h4><span className="n">01</span> Codes it follows</h4>
              <p className="cap">Each gate is met or turned into a carrot — including the Cool Roof re-roof exemption.</p>
              {codes.map((c) => (
                <div className="item" key={c.key}>
                  <span className="lead" />
                  <span className="body">
                    <span className="lab">{c.ref}</span>
                    <span className="ref">{c.role}</span>
                    {c.note && <span className="note">{c.note}</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* 2. Tax benefits */}
            <div className="so-sec">
              <h4><span className="n">02</span> Tax benefits &amp; incentives</h4>
              <p className="cap">Federal, utility, and state stacking that drives the 2.5–8 yr payback band.</p>
              {incentives.map((inc) => (
                <div className="item" key={inc.key}>
                  <span className="lead" />
                  <span className="body">
                    <span className="lab">{inc.label}</span>
                    {inc.value && <span className="ref">{inc.value}</span>}
                    {inc.window && <span className="note">Window: {inc.window}</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* 3. Mayor's Office contribution */}
            <div className="so-sec">
              <h4><span className="n">03</span> Contribution to City climate goals</h4>
              <p className="cap">{cc.framingForMayorsOffice} — {cc.plan}.</p>
              <div className="metricgrid">
                <div className="metric"><div className="mv">{(bt.combinedCo2TonsYr || 1665).toLocaleString()} t</div><div className="ml">CO₂/yr → 59%-by-2030 / net-zero-2050</div></div>
                <div className="metric"><div className="mv">{((bt.combinedAnnualKwh || 4338253) / 1e6).toFixed(2)} GWh</div><div className="ml">on-site clean energy → 100% by 2035</div></div>
                <div className="metric"><div className="mv">{((bt.stormwaterGalYr || 2400000) / 1e6).toFixed(1)}M gal</div><div className="ml">stormwater/yr → citywide GI target</div></div>
                <div className="metric"><div className="mv">BeltLine</div><div className="ml">heat-island + green-corridor contribution</div></div>
              </div>
              <div className="item" style={{ marginTop: 14 }}>
                <span className="lead" />
                <span className="body">
                  <span className="lab">Plan alignment</span>
                  <span className="note">{cc.plan}. {cc.beltline}.</span>
                </span>
              </div>
            </div>

            {/* 4. Permit pathway */}
            <div className="so-sec">
              <h4><span className="n">04</span> Permit pathway</h4>
              <p className="cap">DCP applications this scope triggers — via {pp.portal}. Lead: {pp.leadOffice}.</p>
              {ppApps.map((a) => (
                <div className="item" key={a.key}>
                  <span className="lead" />
                  <span className="body">
                    <span className="labrow">
                      <span className="lab">{a.type}</span>
                      <span className={"badge " + (a.status || "conditional")}>{a.status}</span>
                    </span>
                    <span className="office">{a.office}</span>
                    <span className="note">{a.trigger}{a.note ? ` · ${a.note}` : ""}</span>
                    <span className="ref">{a.dcpRef}</span>
                  </span>
                </div>
              ))}
              {ppPull.length > 0 && (
                <>
                  <p className="cap" style={{ marginTop: 16 }}>Needs a parcel data pull before filing (the zoning branch):</p>
                  <ul className="pulllist">
                    {ppPull.map((p, i) => (
                      <li key={i}><b>{p.item}</b> — {p.why} <span style={{ color: "var(--faint)" }}>({p.source})</span></li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <p className="so-foot">
              Mockup figures from the project fixture (Google Solar API study, Google Earth trace, and research constants). Permit pathway grounded in the DCP Permitting Services Guide (Aug 2023). Full written proposals are produced as separate documents — this panel is the in-product digest.
            </p>
          </div>
        </aside>

        <div className="ax-err" ref={errRef} />
      </div>
    </>
  );
}
