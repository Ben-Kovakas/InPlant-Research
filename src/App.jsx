import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const CSS = `
  :root{
    --ink:#0c0f16; --panel:rgba(16,20,29,0.74); --stroke:rgba(255,255,255,0.10);
    --stroke-strong:rgba(255,255,255,0.18); --text:#eef2f8; --muted:#9aa6b8;
    --solar:#ffc83c; --drain:#43c4f5; --agri:#ec6fa6; --canopy:#8fce46; --sun:#ffd45e; --lattice:#a7c4a0;
  }
  .gr-root *{box-sizing:border-box;}
  .gr-root{position:fixed;inset:0;background:#0c0f16;color:var(--text);
    font-family:"Inter",system-ui,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased;}
  .gr-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;}
  .gr-ui{position:absolute;inset:0;pointer-events:none;}
  .gr-ui .readout,.gr-ui .legend,.gr-ui .dock{pointer-events:auto;}

  .gr-err{position:absolute;inset:0;display:none;place-items:center;padding:32px;text-align:center;
    font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:13px;line-height:1.6;color:#ffb4b4;
    background:#0c0f16;}

  .tag{position:absolute;transform:translate(-50%,-100%);pointer-events:none;padding:5px 9px;border-radius:8px;
    white-space:nowrap;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11px;font-weight:500;letter-spacing:.03em;
    background:rgba(10,13,20,0.8);border:1px solid var(--stroke-strong);backdrop-filter:blur(6px);transition:opacity .25s;}
  .tag .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:middle;}
  .tag.solar .dot{background:var(--solar);} .tag.drain .dot{background:var(--drain);} .tag.agri .dot{background:var(--agri);} .tag.lattice .dot{background:var(--lattice);}

  .brand{position:absolute;top:22px;left:24px;max-width:340px;}
  .eyebrow{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin:0 0 6px;}
  .title{font-family:"Space Grotesk","Inter",sans-serif;font-weight:600;font-size:22px;line-height:1.15;margin:0;}
  .title b{color:var(--solar);font-weight:700;}
  .sub{font-size:12.5px;color:var(--muted);margin:8px 0 0;line-height:1.5;}

  .legend{position:absolute;left:24px;bottom:128px;width:264px;background:var(--panel);border:1px solid var(--stroke);
    border-radius:14px;padding:14px 14px 10px;backdrop-filter:blur(14px);}
  .legend h3{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:0 0 12px;font-weight:500;}
  .lrow{display:flex;align-items:flex-start;gap:11px;padding:7px 0;cursor:pointer;user-select:none;border-radius:8px;transition:background .15s;pointer-events:auto;}
  .lrow:hover{background:rgba(255,255,255,.04);}
  .lrow .swatch{flex:0 0 auto;width:14px;height:14px;border-radius:4px;margin-top:1px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);}
  .lrow .meta{flex:1;min-width:0;}
  .lrow .name{font-size:13px;font-weight:600;display:flex;justify-content:space-between;align-items:center;}
  .lrow .desc{font-size:11.5px;color:var(--muted);line-height:1.4;margin-top:2px;}
  .lrow .toggle{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;color:var(--muted);border:1px solid var(--stroke-strong);border-radius:5px;padding:1px 6px;}
  .lrow.off{opacity:.45;} .lrow.off .toggle{color:#5c6675;} .lrow.on .toggle{color:var(--text);}

  .readout{position:absolute;top:22px;right:24px;width:236px;background:var(--panel);border:1px solid var(--stroke);border-radius:14px;padding:14px 16px;backdrop-filter:blur(14px);}
  .clock{display:flex;align-items:baseline;gap:8px;margin-bottom:2px;}
  .clock .t{font-family:"Space Grotesk","Inter",sans-serif;font-weight:600;font-size:30px;}
  .clock .ampm{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:13px;color:var(--muted);}
  .clock .phase{margin-left:auto;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);}
  .stat{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-top:1px solid var(--stroke);}
  .stat:first-of-type{margin-top:8px;}
  .stat .k{font-size:11.5px;color:var(--muted);display:flex;align-items:center;gap:7px;}
  .stat .k i{width:7px;height:7px;border-radius:50%;display:inline-block;}
  .stat .v{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:13px;font-weight:500;}
  .bar{height:3px;border-radius:2px;background:rgba(255,255,255,.10);margin-top:6px;overflow:hidden;}
  .bar > span{display:block;height:100%;border-radius:2px;transition:width .12s linear;}

  .dock{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);width:min(620px,calc(100vw - 48px));
    background:var(--panel);border:1px solid var(--stroke);border-radius:16px;padding:14px 18px 16px;backdrop-filter:blur(14px);}
  .dock-top{display:flex;align-items:center;gap:14px;margin-bottom:11px;}
  .play{flex:0 0 auto;width:38px;height:38px;border-radius:50%;border:1px solid var(--stroke-strong);background:rgba(255,255,255,.05);color:var(--text);cursor:pointer;display:grid;place-items:center;transition:background .15s,transform .1s;}
  .play:hover{background:rgba(255,255,255,.1);} .play:active{transform:scale(.94);}
  .dock-label{flex:1;}
  .dock-label .l1{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);}
  .dock-label .l2{font-size:13px;font-weight:600;margin-top:2px;}
  .track{display:flex;align-items:center;gap:12px;}
  .track .ico{flex:0 0 auto;color:var(--muted);display:grid;place-items:center;}
  .gr-root input[type=range]{-webkit-appearance:none;appearance:none;flex:1;height:26px;background:transparent;cursor:pointer;}
  .gr-root input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:3px;background:linear-gradient(90deg,#5b6577,var(--sun),#5b6577);}
  .gr-root input[type=range]::-moz-range-track{height:5px;border-radius:3px;background:linear-gradient(90deg,#5b6577,var(--sun),#5b6577);}
  .gr-root input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;margin-top:-7.5px;background:var(--sun);border:3px solid #1a1e28;box-shadow:0 0 0 1px var(--sun),0 0 16px rgba(255,212,94,.7);}
  .gr-root input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--sun);border:3px solid #1a1e28;box-shadow:0 0 0 1px var(--sun),0 0 16px rgba(255,212,94,.7);}
  .hint{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:10px;color:#5c6675;letter-spacing:.06em;}
  @media (max-width:720px){
    .brand{top:14px;left:14px;max-width:62vw;} .title{font-size:17px;} .sub{display:none;}
    .readout{top:12px;right:12px;width:150px;padding:11px 12px;} .clock .t{font-size:22px;}
    .legend{left:12px;right:12px;width:auto;bottom:150px;} .legend .desc{display:none;}
    .dock{bottom:14px;padding:12px 14px 14px;} .hint{display:none;}
  }
`;

const UI = `
  <div class="tag solar" id="tag-solar"><span class="dot"></span>Solar array · S + W faces</div>
  <div class="tag drain" id="tag-drain"><span class="dot"></span>Green roof · stormwater</div>
  <div class="tag agri"  id="tag-agri"><span class="dot"></span>Shade-crop plot</div>
  <div class="tag lattice" id="tag-lattice"><span class="dot"></span>Shade lattice · seating</div>
  <div class="brand">
    <p class="eyebrow">Atlanta · Climate Resilient ATL</p>
    <h1 class="title">Lot 0427 — <b>Green Retrofit</b> Model</h1>
    <p class="sub">A scanned block, re-tagged for intervention. Drag the sun across the day and watch shade, solar capture, and drainage shift in real time.</p>
  </div>
  <div class="readout">
    <div class="clock"><span class="t" id="r-time">11:42</span><span class="ampm" id="r-ampm">AM</span><span class="phase" id="r-phase">Midday</span></div>
    <div class="stat"><span class="k"><i style="background:var(--sun)"></i>Sun elevation</span><span class="v" id="r-elev">72°</span></div>
    <div class="stat"><span class="k"><i style="background:var(--solar)"></i>Solar capture</span><span class="v" id="r-solar">96%</span></div>
    <div class="bar"><span id="r-solar-bar" style="background:var(--solar);width:96%"></span></div>
    <div class="stat"><span class="k"><i style="background:var(--agri)"></i>Crop shade</span><span class="v" id="r-shade">18 m²</span></div>
    <div class="stat"><span class="k"><i style="background:var(--drain)"></i>Roof retention</span><span class="v" id="r-drain">1,150 gal</span></div>
  </div>
  <div class="legend">
    <h3>Intervention layers</h3>
    <div class="lrow on" data-layer="solar" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:var(--solar)"></span><span class="meta"><span class="name">Solar <span class="toggle">ON</span></span><span class="desc">PV potential on sun-facing roofs &amp; walls</span></span></div>
    <div class="lrow on" data-layer="drain" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:var(--drain)"></span><span class="meta"><span class="name">Drainage <span class="toggle">ON</span></span><span class="desc">Vegetated green roof for stormwater retention</span></span></div>
    <div class="lrow on" data-layer="agri" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:var(--agri)"></span><span class="meta"><span class="name">Agriculture <span class="toggle">ON</span></span><span class="desc">Shade-tolerant crops under a louvered canopy</span></span></div>
    <div class="lrow on" data-layer="lattice" tabindex="0" role="button" aria-pressed="true"><span class="swatch" style="background:var(--lattice)"></span><span class="meta"><span class="name">Shade lattice <span class="toggle">ON</span></span><span class="desc">Vine-covered perimeter trellis for shaded seating</span></span></div>
  </div>
  <div class="dock">
    <div class="dock-top">
      <button class="play" id="play" aria-label="Play sun animation"><svg id="play-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5l9 5.5-9 5.5z"/></svg></button>
      <div class="dock-label"><div class="l1">Sun path</div><div class="l2">June 21 · summer solstice</div></div>
    </div>
    <div class="track">
      <span class="ico" title="Sunrise"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><path d="M8 6l4-4 4 4"/></svg></span>
      <input type="range" id="sun" min="0" max="1000" value="500" aria-label="Time of day" />
      <span class="ico" title="Sunset"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="3" y1="18" x2="21" y2="18"/><path d="M12 6V2"/><path d="M16 4l-4 4-4-4"/></svg></span>
    </div>
  </div>
  <div class="hint">drag to orbit · scroll to zoom</div>
`;

export default function App() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const uiRef = useRef(null);
  const errRef = useRef(null);

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
      // r184 colour pipeline — explicit & predictable
      if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setClearColor(0x9fc0e8, 1);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x9fc0e8);
      scene.fog = new THREE.Fog(0x9fc0e8, 60, 165);

      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 600);

      // ---- camera orbit (manual; OrbitControls not bundled) ----
      const tgt = new THREE.Vector3(0, 3, -1);
      const orbit = { radius: 40, theta: 0.62, phi: 0.95 };
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
        orbit.phi = Math.max(0.25, Math.min(1.45, orbit.phi - (e.clientY - ly) * 0.004));
        lx = e.clientX; ly = e.clientY; applyCamera();
      };
      const wheel = (e) => { e.preventDefault(); orbit.radius = Math.max(20, Math.min(75, orbit.radius + e.deltaY * 0.02)); applyCamera(); };
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("wheel", wheel, { passive: false });

      // ---- lights (tuned for r155+ physical lighting, with an ambient floor) ----
      const amb = new THREE.AmbientLight(0xffffff, 0.55); scene.add(amb);
      const hemi = new THREE.HemisphereLight(0xdcefff, 0x4a4030, 0.7); scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfff2cc, 2.4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 110;
      sun.shadow.camera.left = -32; sun.shadow.camera.right = 32;
      sun.shadow.camera.top = 32; sun.shadow.camera.bottom = -32;
      sun.shadow.bias = -0.0004;
      sun.target.position.set(0, 1, -1);
      scene.add(sun, sun.target);

      // ---- ground ----
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ color: 0x4c5a48, roughness: 1 })
      );
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      const lot = new THREE.Mesh(
        new THREE.PlaneGeometry(44, 42),
        new THREE.MeshStandardMaterial({ color: 0x6b6e74, roughness: 1 })
      );
      lot.rotation.x = -Math.PI / 2; lot.position.y = 0.02; lot.receiveShadow = true; scene.add(lot);

      // ---- helpers ----
      const gSolar = new THREE.Group(), gDrain = new THREE.Group(), gAgri = new THREE.Group(), gLattice = new THREE.Group();
      scene.add(gSolar, gDrain, gAgri, gLattice);

      // shared facade materials
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x7ab8d4, emissive: 0x0a2a38, emissiveIntensity: 0.28,
        roughness: 0.08, metalness: 0.45, transparent: true, opacity: 0.72
      });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2c2f38, roughness: 0.6 });
      const doorMat  = new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.55, metalness: 0.2 });

      // addFacade: windows + double doors on one inner-facing wall
      function addFacade(bx, bh, bz, bw, bd, faceAxis, faceSign, windowsOnly = false) {
        const eps = 0.04;
        const faceX = faceAxis === 'x' ? bx + faceSign * (bw / 2 + eps) : bx;
        const faceZ = faceAxis === 'z' ? bz + faceSign * (bd / 2 + eps) : bz;
        const spanW = faceAxis === 'x' ? bd : bw;
        const cols = Math.max(2, Math.round(spanW / 2.0));
        const spacing = spanW / (cols + 1);
        const wW = 1.0, wH = 1.2;
        [bh * 0.60, bh * 0.82].forEach((ry) => {
          for (let c = 1; c <= cols; c++) {
            const along = -spanW / 2 + c * spacing;
            const px = faceAxis === 'x' ? faceX : bx + along;
            const pz = faceAxis === 'x' ? bz + along : faceZ;
            // frame
            const fr = new THREE.Mesh(new THREE.BoxGeometry(
              faceAxis === 'x' ? 0.09 : wW + 0.16,
              wH + 0.16,
              faceAxis === 'x' ? wW + 0.16 : 0.09
            ), frameMat);
            fr.position.set(px, ry, pz); fr.castShadow = true; scene.add(fr);
            // glass
            const gl = new THREE.Mesh(new THREE.BoxGeometry(
              faceAxis === 'x' ? 0.07 : wW,
              wH,
              faceAxis === 'x' ? wW : 0.07
            ), glassMat);
            gl.position.set(px, ry, pz); scene.add(gl);
            // cross divider
            const hBar = new THREE.Mesh(new THREE.BoxGeometry(
              faceAxis === 'x' ? 0.07 : wW, 0.06, faceAxis === 'x' ? wW : 0.07
            ), frameMat);
            hBar.position.set(px, ry, pz); scene.add(hBar);
          }
        });
        // double doors — inner face only
        if (!windowsOnly) {
        const dW = 0.82, dH = 2.3;
        [-dW * 0.5, dW * 0.5].forEach((off, i) => {
          const px = faceAxis === 'x' ? faceX : bx + off;
          const pz = faceAxis === 'x' ? bz + off : faceZ;
          const dfr = new THREE.Mesh(new THREE.BoxGeometry(
            faceAxis === 'x' ? 0.1 : dW + 0.14, dH + 0.14,
            faceAxis === 'x' ? dW + 0.14 : 0.1
          ), frameMat);
          dfr.position.set(px, dH / 2 + 0.07, pz); scene.add(dfr);
          const dp = new THREE.Mesh(new THREE.BoxGeometry(
            faceAxis === 'x' ? 0.09 : dW, dH,
            faceAxis === 'x' ? dW : 0.09
          ), doorMat);
          dp.position.set(px, dH / 2, pz); scene.add(dp);
          // handle
          const hx = faceAxis === 'x' ? faceX + faceSign * 0.05 : bx + off + (i === 0 ? 0.28 : -0.28);
          const hz = faceAxis === 'x' ? bz + off + (i === 0 ? 0.28 : -0.28) : faceZ + faceSign * 0.05;
          const hn = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), frameMat);
          hn.position.set(hx, dH * 0.52, hz); scene.add(hn);
        });
        // step slab
        const step = new THREE.Mesh(new THREE.BoxGeometry(
          faceAxis === 'x' ? 0.2 : dW * 2.4, 0.12,
          faceAxis === 'x' ? dW * 2.4 : 0.2
        ), new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 1 }));
        step.position.set(faceAxis === 'x' ? faceX : bx, 0.06, faceAxis === 'x' ? bz : faceZ);
        scene.add(step);
        } // end !windowsOnly
      }

      function solarPanel(w, d, x, y, z) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d),
          new THREE.MeshStandardMaterial({ color: 0xffc83c, emissive: 0x5a4400, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.15 }));
        p.position.set(x, y, z); p.castShadow = true; gSolar.add(p);
      }

      // building 1 — left solar  (all 4 faces; inner = +X gets doors, others windows-only)
      (() => {
        const [bx,bh,bz,bw,bd] = [-8.5, 11, 1, 7, 7];
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),
          new THREE.MeshStandardMaterial({ color: 0xb9c0cc, roughness: 0.9 }));
        m.position.set(bx, bh/2, bz); m.castShadow = true; m.receiveShadow = true; scene.add(m);
        addFacade(bx, bh, bz, bw, bd, 'x', +1);   // inner — doors + windows
        addFacade(bx, bh, bz, bw, bd, 'x', -1, true);  // outer left — windows only
        addFacade(bx, bh, bz, bw, bd, 'z', +1, true);  // front — windows only
        addFacade(bx, bh, bz, bw, bd, 'z', -1, true);  // back — windows only
      })();
      solarPanel(6.2, 6.2, -8.5, 11.2, 1);

      // building 2 — right solar  (inner = -X gets doors)
      (() => {
        const [bx,bh,bz,bw,bd] = [8.7, 9.5, 1.6, 6.5, 6.5];
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),
          new THREE.MeshStandardMaterial({ color: 0xc7cdd6, roughness: 0.9 }));
        m.position.set(bx, bh/2, bz); m.castShadow = true; m.receiveShadow = true; scene.add(m);
        addFacade(bx, bh, bz, bw, bd, 'x', -1);        // inner — doors + windows
        addFacade(bx, bh, bz, bw, bd, 'x', +1, true);  // outer right — windows only
        addFacade(bx, bh, bz, bw, bd, 'z', +1, true);  // front — windows only
        addFacade(bx, bh, bz, bw, bd, 'z', -1, true);  // back — windows only
      })();
      solarPanel(5.7, 5.7, 8.7, 9.65, 1.6);

      // building 3 — back drainage (inner = +Z gets doors)
      (() => {
        const [bx,bh,bz,bw,bd] = [0, 8.5, -8, 8, 6.5];
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),
          new THREE.MeshStandardMaterial({ color: 0xaeb6c2, roughness: 0.9 }));
        m.position.set(bx, bh/2, bz); m.castShadow = true; m.receiveShadow = true; scene.add(m);
        addFacade(bx, bh, bz, bw, bd, 'z', +1);        // inner — doors + windows
        addFacade(bx, bh, bz, bw, bd, 'z', -1, true);  // back — windows only
        addFacade(bx, bh, bz, bw, bd, 'x', +1, true);  // right side — windows only
        addFacade(bx, bh, bz, bw, bd, 'x', -1, true);  // left side — windows only
      })();
      const bed = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.7, 5.9),
        new THREE.MeshStandardMaterial({ color: 0x4f8a2e, roughness: 1 }));
      bed.position.set(0, 8.85, -8); bed.castShadow = true; bed.receiveShadow = true; gDrain.add(bed);
      const tuftMat = new THREE.MeshStandardMaterial({ color: 0x6cbf3f, roughness: 1 });
      for (let i = 0; i < 24; i++) {
        const s = 0.35 + Math.random() * 0.5;
        const t = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 5), tuftMat);
        t.position.set((Math.random() - 0.5) * 6.6, 9.25, -8 + (Math.random() - 0.5) * 5);
        t.scale.y = 0.7; t.castShadow = true; gDrain.add(t);
      }
      [3.4, -3.4].forEach((x) => {
        const ch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.2, 0.3),
          new THREE.MeshStandardMaterial({ color: 0x43c4f5, emissive: 0x0c4a66, emissiveIntensity: 0.7, roughness: 0.3 }));
        ch.position.set(x, 4.3, -4.75); gDrain.add(ch);
      });

      // zone 4 — front agriculture + canopy
      const plot = new THREE.Mesh(new THREE.PlaneGeometry(11, 7),
        new THREE.MeshStandardMaterial({ color: 0xec6fa6, roughness: 1 }));
      plot.rotation.x = -Math.PI / 2; plot.position.set(0, 0.05, 9); plot.receiveShadow = true; gAgri.add(plot);
      const cropMat = new THREE.MeshStandardMaterial({ color: 0x5fa83a, roughness: 1 });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7 + Math.random() * 0.4, 0.5), cropMat);
        b.position.set(-4 + c, 0.5, 7 + r * 1.4); b.castShadow = true; b.receiveShadow = true; gAgri.add(b);
      }
      const postMat = new THREE.MeshStandardMaterial({ color: 0x6b5640, roughness: 0.9 });
      [-5, 5].forEach((x) => [6.4, 11.6].forEach((z) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 5, 10), postMat);
        p.position.set(x, 2.5, z); p.castShadow = true; gAgri.add(p);
      }));
      const frame = new THREE.Mesh(new THREE.BoxGeometry(11, 0.3, 7),
        new THREE.MeshStandardMaterial({ color: 0x7a6447, roughness: 0.9 }));
      frame.position.set(0, 5, 9); frame.castShadow = true; gAgri.add(frame);
      const slatMat = new THREE.MeshStandardMaterial({ color: 0x8fce46, roughness: 0.85, side: THREE.DoubleSide });
      for (let i = 0; i < 11; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.12, 0.42), slatMat);
        s.position.set(0, 5.15, 6.2 + i * 0.56); s.castShadow = true; gAgri.add(s);
      }

      // ---- shade lattice asset (vine-covered cantilever trellis) ----
      function meshTexture() {
        const c = document.createElement("canvas"); c.width = c.height = 128;
        const g = c.getContext("2d"); g.clearRect(0, 0, 128, 128);
        g.strokeStyle = "rgba(225,231,237,0.95)"; g.lineWidth = 2;
        for (let i = -128; i <= 128; i += 16) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke();
          g.beginPath(); g.moveTo(i, 128); g.lineTo(i + 128, 0); g.stroke();
        }
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
      }
      const latticeMeshTex = meshTexture();

      function buildLattice(len) {
        const grp = new THREE.Group();
        const concrete = new THREE.MeshStandardMaterial({ color: 0xd9d3c7, roughness: 0.85 });
        const vineMat = new THREE.MeshStandardMaterial({ color: 0x4f8f33, roughness: 1 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a7c63, roughness: 0.9 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x3c4450, roughness: 0.5, metalness: 0.3 });
        const depth = 2.0, postH = 3.9;                       // half-depth canopy, hugs the wall
        const innerY = postH - 0.2, outerY = postH + 0.55, z0 = 0.2, z1 = depth + 0.7;
        const tilt = Math.atan2(outerY - innerY, z1 - z0);
        const n = Math.max(2, Math.round(len / 2.3));

        for (let i = 0; i <= n; i++) {
          const x = -len / 2 + len * (i / n);
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, postH, 8), concrete);
          post.position.set(x, postH / 2, depth); post.castShadow = true; grp.add(post);
          const rl = Math.sqrt((z1 - z0) ** 2 + (outerY - innerY) ** 2);
          const raf = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, rl), concrete);
          raf.position.set(x, (innerY + outerY) / 2, (z0 + z1) / 2);
          raf.rotation.x = -tilt; raf.castShadow = true; grp.add(raf);
        }
        [{ z: 0.3, y: postH - 0.05 }, { z: depth + 0.6, y: postH + 0.5 }].forEach((b) => {
          const beam = new THREE.Mesh(new THREE.BoxGeometry(len + 0.5, 0.16, 0.28), concrete);
          beam.position.set(0, b.y, b.z); beam.castShadow = true; grp.add(beam);
        });
        // wire-mesh panel laid over the rafters
        const panelLen = Math.sqrt((z1 - z0) ** 2 + (outerY - innerY) ** 2);
        const meshMat = new THREE.MeshStandardMaterial({ map: latticeMeshTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, panelLen), meshMat);
        panel.position.set(0, (innerY + outerY) / 2 + 0.04, (z0 + z1) / 2);
        panel.rotation.x = -Math.PI / 2 + tilt; grp.add(panel);
        // climbing vines spread across the top only (no vertical drapes)
        for (let i = 0; i < Math.round(len * 1.8); i++) {
          const s = 0.28 + Math.random() * 0.4;
          const v = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 5), vineMat);
          const z = 0.4 + Math.random() * (depth + 0.3);
          v.position.set(-len / 2 + Math.random() * len, postH + 0.15 + (z / depth) * 0.45 + Math.random() * 0.3, z);
          v.scale.y = 0.6; v.castShadow = true; grp.add(v);
        }
        // café table + two chairs, placed in the shaded strip
        function tableSet(cx) {
          const set = new THREE.Group();
          const top = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.07, 16), woodMat);
          top.position.y = 0.92; top.castShadow = true; top.receiveShadow = true; set.add(top);
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8), metalMat);
          leg.position.y = 0.45; leg.castShadow = true; set.add(leg);
          const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12), metalMat);
          base.position.y = 0.03; set.add(base);
          [0.85, -0.85].forEach((oz) => {
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.42), woodMat);
            seat.position.set(0, 0.5, oz); seat.castShadow = true; set.add(seat);
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.07), woodMat);
            back.position.set(0, 0.75, oz + (oz > 0 ? 0.18 : -0.18)); back.castShadow = true; set.add(back);
            for (const sx of [-0.16, 0.16]) for (const sz of [-0.16, 0.16]) {
              const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), metalMat);
              cl.position.set(sx, 0.25, oz + sz); set.add(cl);
            }
          });
          set.position.set(cx, 0, depth * 0.5);
          return set;
        }
        const sets = Math.max(1, Math.floor(len / 3));
        for (let i = 0; i < sets; i++) grp.add(tableSet(-len / 2 + (len / sets) * (i + 0.5)));
        return grp;
      }

      // place along the buildings' inner-facing walls (local +Z projects toward the courtyard)
      const latLeft = buildLattice(6.4); latLeft.position.set(-5, 0, 1); latLeft.rotation.y = Math.PI / 2; gLattice.add(latLeft);
      const latRight = buildLattice(6.0); latRight.position.set(5.45, 0, 1.6); latRight.rotation.y = -Math.PI / 2; gLattice.add(latRight);
      const latBack = buildLattice(7.4); latBack.position.set(0, 0, -4.75); latBack.rotation.y = 0; gLattice.add(latBack);

      // ---- sun + arc ----
      const ELEV_MAX = (72 * Math.PI) / 180, ARC_R = 36;
      function sunDir(t) {
        const elev = ELEV_MAX * Math.sin(Math.PI * t), horiz = Math.cos(elev);
        return new THREE.Vector3(horiz * Math.cos(Math.PI * t), Math.sin(elev), horiz * 0.55 * Math.sin(Math.PI * t) + 0.12).normalize();
      }
      const sunBall = new THREE.Mesh(new THREE.SphereGeometry(1.7, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd45e }));
      scene.add(sunBall);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd45e, transparent: true, opacity: 0.22 }));
      sunBall.add(halo);

      const arcPts = [];
      for (let i = 0; i <= 64; i++) arcPts.push(sunDir(i / 64).multiplyScalar(ARC_R));
      const arc = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPts), 64, 0.14, 8, false),
        new THREE.MeshBasicMaterial({ color: 0xffd45e, transparent: true, opacity: 0.5 })
      );
      scene.add(arc);

      // ---- day-cycle colour keyframes ----
      const C = (h) => new THREE.Color(h);
      const skyKeys = [{ t: 0, c: C(0xf0995a) }, { t: 0.5, c: C(0x9fc0e8) }, { t: 1, c: C(0xe8775a) }];
      const sunKeys = [{ t: 0, c: C(0xff8a4c) }, { t: 0.5, c: C(0xfff2cc) }, { t: 1, c: C(0xff8a4c) }];
      function lerpKey(arr, t) {
        for (let i = 0; i < arr.length - 1; i++) if (t <= arr[i + 1].t) {
          const a = arr[i], b = arr[i + 1]; return a.c.clone().lerp(b.c, (t - a.t) / (b.t - a.t));
        }
        return arr[arr.length - 1].c.clone();
      }

      // ---- UI state ----
      let playing = false, tVal = 0.5;
      const slider = $("sun");
      const fmt = (t) => {
        const hf = 6 + t * 12; let h = Math.floor(hf); const m = Math.round((hf - h) * 60);
        const ampm = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12;
        return { hm: hh + ":" + String(m).padStart(2, "0"), ampm };
      };
      const phase = (t) => t < 0.12 ? "Sunrise" : t < 0.38 ? "Morning" : t < 0.62 ? "Midday" : t < 0.88 ? "Afternoon" : "Sunset";

      function update() {
        const dir = sunDir(tVal), height = Math.max(0, Math.sin(Math.PI * tVal));
        sun.position.copy(dir).multiplyScalar(46);
        sunBall.position.copy(dir).multiplyScalar(ARC_R);
        sun.intensity = 0.5 + 2.2 * height;
        hemi.intensity = 0.45 + 0.4 * height;
        amb.intensity = 0.4 + 0.2 * height;
        const sc = lerpKey(sunKeys, tVal); sun.color.copy(sc); sunBall.material.color.copy(sc); halo.material.color.copy(sc);
        const bg = lerpKey(skyKeys, tVal);
        scene.background.copy(bg); scene.fog.color.copy(bg); renderer.setClearColor(bg, 1);
        const tm = fmt(tVal);
        $("r-time").textContent = tm.hm; $("r-ampm").textContent = tm.ampm; $("r-phase").textContent = phase(tVal);
        $("r-elev").textContent = Math.round((ELEV_MAX * 180 / Math.PI) * height) + "°";
        const solarPct = Math.round(96 * height);
        $("r-solar").textContent = solarPct + "%"; $("r-solar-bar").style.width = solarPct + "%";
        $("r-shade").textContent = Math.min(Math.round(18 / Math.max(0.18, height)), 140) + " m²";
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
      const groups = { solar: gSolar, drain: gDrain, agri: gAgri, lattice: gLattice };
      const tags = { solar: $("tag-solar"), drain: $("tag-drain"), agri: $("tag-agri"), lattice: $("tag-lattice") };
      const rowHandlers = [];
      Array.from(ui.querySelectorAll(".lrow")).forEach((row) => {
        const toggle = () => {
          const layer = row.dataset.layer, on = row.classList.toggle("off") === false;
          row.classList.toggle("on", on); row.setAttribute("aria-pressed", String(on));
          row.querySelector(".toggle").textContent = on ? "ON" : "OFF";
          groups[layer].visible = on; tags[layer].style.opacity = on ? "1" : "0";
        };
        const key = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } };
        row.addEventListener("click", toggle); row.addEventListener("keydown", key);
        rowHandlers.push([row, toggle, key]);
      });

      // ---- floating tags ----
      const anchors = { solar: new THREE.Vector3(-8.5, 12.6, 1), drain: new THREE.Vector3(0, 10.5, -8), agri: new THREE.Vector3(0, 6, 9), lattice: new THREE.Vector3(-3.4, 4.8, 1) };
      const pv = new THREE.Vector3();
      function placeTags(w, h) {
        for (const k in anchors) {
          pv.copy(anchors[k]).project(camera); const el = tags[k];
          if (pv.z > 1 || groups[k].visible === false) { el.style.display = "none"; continue; }
          el.style.display = "block";
          el.style.left = (pv.x * 0.5 + 0.5) * w + "px";
          el.style.top = (-pv.y * 0.5 + 0.5) * h + "px";
        }
      }

      // ---- explicit sizing via ResizeObserver (the reliability fix) ----
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
      renderer.render(scene, camera); // immediate first frame

      let last = performance.now();
      function loop(now) {
        const dt = (now - last) / 1000; last = now;
        if (playing) { tVal += dt * 0.07; if (tVal > 1) tVal = 0; slider.value = Math.round(tVal * 1000); update(); }
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
      <div className="gr-root" ref={rootRef}>
        <canvas className="gr-canvas" ref={canvasRef} />
        <div className="gr-ui" ref={uiRef} dangerouslySetInnerHTML={{ __html: UI }} />
        <div className="gr-err" ref={errRef} />
      </div>
    </>
  );
}
