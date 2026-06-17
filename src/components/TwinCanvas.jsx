/* ----------------------------------------------------------------------------
   TwinCanvas — controlled 3D digital-twin of Ansley Mall.

   A CONTROLLED port of the Three.js scene in src/AnsleyApp.jsx. It owns the
   renderer, scene, camera/orbit, lights, massing, intervention layers, the
   sun arc, and the floating in-scene tags — nothing else. All HUD chrome
   (brand, readout/clock, legend, dock/sun-slider, City-Ready Proposal) now
   lives in the Owner workspace and drives this component via props.

   PROP CONTRACT (do not change without updating the Owner workspace):
     activeLayers : { roofSolar:bool, lotCanopySolar:bool, greenRoof:bool,
                      stormwaterTrees:bool, beltline:bool }   // which scene groups are visible
     sunT         : number 0..1     // normalized time of day (drives sun position + lighting)
     playing      : bool            // animate the sun arc
     showTags     : bool            // show floating in-scene labels (default true)
     className    : string          // applied to the root element

   The component fills its parent (parent must be position:relative). It owns
   NO HUD/legend/dock/readout — those live in the Owner workspace React layer
   and drive this component via props.
---------------------------------------------------------------------------- */

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const ACCENT_HEX = 0xf4c47a; // the one restrained warm accent

/* Scoped tag styles — copied from AnsleyApp but namespaced under .twin-root so
   they never clash with the .ax-root CSS that still ships with AnsleyApp. */
const CSS = `
  .twin-root{position:absolute;inset:0;overflow:hidden;
    font-family:"Inter",system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;}
  .twin-root .twin-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;}
  .twin-root .twin-ui{position:absolute;inset:0;pointer-events:none;}

  .twin-root .twin-err{position:absolute;inset:0;display:none;place-items:center;padding:32px;text-align:center;
    font-family:ui-monospace,"SF Mono",monospace;font-size:13px;line-height:1.6;color:#e7b08a;background:#0b0c0e;}

  /* in-scene tags — minimal hairline cards */
  .twin-root .tag{position:absolute;transform:translate(-50%,-115%);pointer-events:none;padding:5px 9px;border-radius:7px;
    white-space:nowrap;font-family:ui-monospace,"SF Mono",monospace;font-size:10.5px;font-weight:500;letter-spacing:.03em;
    color:#eef0f3;background:rgba(11,12,14,0.78);border:1px solid rgba(255,255,255,0.16);
    backdrop-filter:blur(7px);transition:opacity .25s;box-shadow:0 6px 22px rgba(0,0,0,.35);}
  .twin-root .tag::after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);
    border:5px solid transparent;border-top-color:rgba(11,12,14,0.78);}
  .twin-root .tag .dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:7px;vertical-align:middle;
    background:#f4c47a;box-shadow:0 0 7px rgba(244,196,122,.7);}
  .twin-root .tag .num{color:#f4c47a;}
`;

export default function TwinCanvas({
  activeLayers = {},
  sunT = 0.5,
  playing = false,
  showTags = true,
  className = "",
}) {
  const canvasRef = useRef(null);
  const uiRef = useRef(null);
  const errRef = useRef(null);

  // Live mirrors of the controlling props so the rAF loop reads current values
  // without re-subscribing / rebuilding the scene.
  const sunTRef = useRef(sunT);
  const playingRef = useRef(playing);
  const showTagsRef = useRef(showTags);

  // Handles published by the scene-building effect so the prop-reacting effects
  // can drive the live scene without rebuilding it.
  const apiRef = useRef(null);

  // ---- build the scene once ----
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

      // ---- camera orbit (manual; matches AnsleyApp) ----
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

      // ---- sun + arc (reuses AnsleyApp math) ----
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

      // ---- sun update (driven by the sunT ref / animation loop) ----
      function update() {
        const tVal = sunTRef.current;
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
      }

      // ---- layer groups + tags (keyed by the activeLayers prop) ----
      const groups = {
        roofSolar: gRoofSolar, lotCanopySolar: gLotCanopy, greenRoof: gGreenRoof,
        stormwaterTrees: gStorm, beltline: gBeltline,
      };
      const tags = {
        roofSolar: $("tag-roof"), lotCanopySolar: $("tag-canopy"), greenRoof: $("tag-green"),
        stormwaterTrees: $("tag-storm"), beltline: $("tag-belt"),
      };

      // ---- floating in-scene labels ----
      const anchors = {
        roofSolar: new THREE.Vector3(-2, H + 4, -12),
        lotCanopySolar: new THREE.Vector3(-10, 4.5, -33),
        greenRoof: new THREE.Vector3(-6, H + 2.5, -1),
        stormwaterTrees: new THREE.Vector3(-44, 5, -49),
        beltline: new THREE.Vector3(-46, 5, -30),
      };
      const pv = new THREE.Vector3();
      function placeTags(w, h) {
        for (const k in anchors) {
          const el = tags[k];
          if (!el) continue;
          // global gate: tags hidden entirely when showTags is off
          if (!showTagsRef.current) { el.style.display = "none"; continue; }
          pv.copy(anchors[k]).project(camera);
          if (pv.z > 1 || (groups[k] && groups[k].visible === false)) { el.style.display = "none"; continue; }
          el.style.display = "block";
          el.style.left = (pv.x * 0.5 + 0.5) * w + "px";
          el.style.top = (-pv.y * 0.5 + 0.5) * h + "px";
        }
      }

      // ---- sizing (ResizeObserver on the canvas, not the window) ----
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

      // ---- publish handles for the prop-reacting effects ----
      const applyLayers = (layers) => {
        for (const k in groups) {
          const on = !!layers[k];
          groups[k].visible = on;
          if (tags[k]) tags[k].style.opacity = on ? "1" : "0";
        }
      };
      apiRef.current = { update, applyLayers };

      // initial state from current props
      applyLayers(activeLayers);
      applyCamera(); update();
      renderer.render(scene, camera);

      // ---- render / sun-animation loop ----
      let last = performance.now();
      function loop(now) {
        const dt = (now - last) / 1000; last = now;
        if (playingRef.current) {
          let tVal = sunTRef.current + dt * 0.06;
          if (tVal > 1) tVal = 0;
          sunTRef.current = tVal;
          update();
        }
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
        apiRef.current = null;
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
  }, []); // build once

  // ---- react to activeLayers: toggle group.visible + tag opacity ----
  useEffect(() => {
    apiRef.current?.applyLayers(activeLayers);
  }, [activeLayers]);

  // ---- react to sunT while paused: drive the sun directly ----
  useEffect(() => {
    sunTRef.current = sunT;
    if (!playingRef.current) apiRef.current?.update();
  }, [sunT]);

  // ---- react to playing: the loop reads playingRef each frame ----
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // ---- react to showTags: the loop reads showTagsRef each frame ----
  useEffect(() => {
    showTagsRef.current = showTags;
  }, [showTags]);

  return (
    <>
      <style>{CSS}</style>
      <div className={"twin-root" + (className ? " " + className : "")}>
        <canvas className="twin-canvas" ref={canvasRef} />

        {/* in-scene 3D floating tags only — all HUD chrome lives in the parent */}
        <div className="twin-ui" ref={uiRef} dangerouslySetInnerHTML={{ __html: `
          <div class="tag" id="tag-roof"><span class="dot"></span>Rooftop PV · <span class="num">1.84&nbsp;MW</span></div>
          <div class="tag" id="tag-canopy"><span class="dot"></span>Lot canopies · <span class="num">~1.4&nbsp;MW</span></div>
          <div class="tag" id="tag-green"><span class="dot"></span>Green roof · <span class="num">2.4M&nbsp;gal/yr</span></div>
          <div class="tag" id="tag-storm"><span class="dot"></span>Trees · <span class="num">~80 lot trees</span></div>
          <div class="tag" id="tag-belt"><span class="dot"></span>BeltLine lattice corridor</div>
        ` }} />

        <div className="twin-err" ref={errRef} />
      </div>
    </>
  );
}
