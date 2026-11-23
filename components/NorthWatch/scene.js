// Three.js scene for NORTH°: one procedural watch (case, bezel, dial, hands, crystal, strap)
// carried through every chapter. Each frame reads the smoothed scroll position and the DOM
// section boxes, then drives the explode/assembly, placement, strap colour, face and props.
// Ported from a three r149 prototype: lights are scaled by PI because r155+ dropped legacy lighting.

import * as THREE from "three";

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export const EDITIONS = { move: ["#FF6A1A", "#FF6A1A", "sport"], roam: ["#E9DCC4", "#1E2B4A", "chrono"], play: ["#F2F2F2", "#F2F2F2", "pet"] };

export function createNorthScene({ root, canvas, fonts, reduce, getEdition }) {
  const $ = (s) => root.querySelector(s);
  const DISP = `${fonts.disp}, sans-serif`, BODY = `${fonts.body}, sans-serif`, MONO = `${fonts.mono}, monospace`;
  const timers = [];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  // studio environment generated in code
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x24272c, side: THREE.BackSide })));
  const panel = (w, h, c, s, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(s), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(7, 2.2, 0xffffff, 7, 0, 5.6, 1.5); panel(2.2, 7, 0xffe6cc, 5, -5.6, 0.5, 2.5); panel(1.4, 6, 0xd6e8ff, 4, 5.6, 0.5, -1.5);
  panel(5, 1.2, 0xffffff, 3, 0, -5.5, 3); panel(1, 4, 0xffffff, 8, 4, 2, 4); panel(3, 3, 0xffffff, 2.5, -2, -2, -5.5);
  scene.environment = pmrem.fromScene(env, 0.02).texture;
  env.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xfff1e0, 1.6 * Math.PI); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe2ff, 1.1 * Math.PI); rim.position.set(-4, 2, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25 * Math.PI));

  // ---- procedural textures (brushing, grain) ----
  const mkCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const streakTex = (() => {
    const c = mkCanvas(256, 256), x = c.getContext("2d"), d = x.createImageData(256, 256);
    for (let j = 0; j < 256; j++) { const base = 110 + Math.random() * 90; for (let i = 0; i < 256; i++) { const k = (j * 256 + i) * 4, v = base * 0.8 + Math.random() * 50; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; } }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
  })();
  const grainTex = (() => {
    const c = mkCanvas(256, 256), x = c.getContext("2d"), d = x.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 150 + Math.random() * 80; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 8); return t;
  })();

  // ---- materials ----
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xe2e6eb, metalness: 1, roughness: 0.13, clearcoat: 0.4, clearcoatRoughness: 0.1 });
  const brushed = new THREE.MeshPhysicalMaterial({ color: 0xd2d7dd, metalness: 1, roughness: 0.62, roughnessMap: streakTex, bumpMap: streakTex, bumpScale: 0.0015 });
  const gunmetal = new THREE.MeshPhysicalMaterial({ color: 0x30343b, metalness: 1, roughness: 0.18, clearcoat: 0.6 });
  const lume = new THREE.MeshStandardMaterial({ color: 0xf2efe2, roughness: 0.6, emissive: 0x3a3a30, emissiveIntensity: 0.5 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0f1113, roughness: 0.5, metalness: 0.3 });
  const strapMatA = new THREE.MeshPhysicalMaterial({ color: 0xff6a1a, roughness: 0.78, bumpMap: grainTex, bumpScale: 0.004, clearcoat: 0.15, clearcoatRoughness: 0.6, sheen: 0.4, sheenRoughness: 0.8 });
  const strapMatB = strapMatA.clone(); strapMatB.color = new THREE.Color(0xff6a1a);
  const accentMat = new THREE.MeshPhysicalMaterial({ color: 0xff6a1a, roughness: 0.3, clearcoat: 0.8 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, clearcoat: 1, clearcoatRoughness: 0, transparent: true, opacity: 0.06, envMapIntensity: 2.2, depthWrite: false });

  const rbox = (w, h, d, r) => {
    const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r;
    s.moveTo(x, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, y); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, y); s.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - r), bevelEnabled: true, bevelSize: r * 0.5, bevelThickness: r * 0.5, bevelSegments: 4, curveSegments: 8 });
    g.center(); return g;
  };
  const lathe = (pts, seg = 128) => { const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg); g.rotateX(Math.PI / 2); return g; };

  const watch = new THREE.Group(); scene.add(watch);
  const parts = {};
  const mk = (name) => { const g = new THREE.Group(); watch.add(g); parts[name] = g; return g; };

  // ---- case: polished body, brushed lugs, knurled crown ----
  const caseG = mk("case");
  caseG.add(new THREE.Mesh(lathe([[0, -0.24], [0.78, -0.26], [0.95, -0.22], [1.04, -0.14], [1.078, -0.03], [1.072, 0.08], [1.045, 0.16], [1.0, 0.2], [0.86, 0.2]]), steel));
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.8, 96), brushed); back.position.z = -0.261; back.rotation.y = Math.PI; caseG.add(back);
  [[-0.52, 1], [0.52, 1], [-0.52, -1], [0.52, -1]].forEach(([x, y]) => { const l = new THREE.Mesh(rbox(0.2, 0.52, 0.2, 0.08), brushed); l.position.set(x, y, -0.07); l.rotation.x = y > 0 ? -0.32 : 0.32; caseG.add(l); });
  const crownG = new THREE.Group(); crownG.position.set(1.12, 0, -0.01); caseG.add(crownG);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 24), steel); tube.rotation.z = Math.PI / 2; crownG.add(tube);
  const crownM = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.18, 36), brushed); crownM.rotation.z = Math.PI / 2; crownM.position.x = 0.12; crownG.add(crownM);
  const knurl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.012, 0.018), steel, 36);
  const dm = new THREE.Object3D();
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; dm.position.set(0.12, Math.cos(a) * 0.152, Math.sin(a) * 0.152); dm.rotation.set(a, 0, 0); dm.updateMatrix(); knurl.setMatrixAt(i, dm.matrix); }
  crownG.add(knurl);
  const capC = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 36), steel); capC.rotation.z = Math.PI / 2; capC.position.x = 0.215; crownG.add(capC);
  [0.62, -0.62].forEach((a) => {
    const p = new THREE.Group(); p.position.set(Math.cos(a) * 1.02, Math.sin(a) * 1.02, -0.01); p.rotation.z = a; caseG.add(p);
    const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 24), steel); pm.rotation.z = Math.PI / 2; pm.position.x = 0.1; p.add(pm);
  });

  // ---- bezel: ceramic insert with printed scale, coin-edge grip ----
  const bezelG = mk("bezel");
  bezelG.add(new THREE.Mesh(lathe([[0.86, 0.2], [0.995, 0.2], [1.025, 0.235], [1.01, 0.29], [0.86, 0.29]]), brushed));
  const grip = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.02, 0.07), steel, 120);
  for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2; dm.position.set(Math.sin(a) * 1.024, Math.cos(a) * 1.024, 0.245); dm.rotation.set(0, 0, -a); dm.updateMatrix(); grip.setMatrixAt(i, dm.matrix); }
  bezelG.add(grip);
  const bc = mkCanvas(1024, 1024), bx = bc.getContext("2d");
  bx.fillStyle = "#14171c"; bx.fillRect(0, 0, 1024, 1024);
  bx.save(); bx.translate(512, 512);
  for (let i = 0; i < 60; i++) {
    bx.save(); bx.rotate((i / 60) * Math.PI * 2);
    if (i === 0) { bx.fillStyle = "#FF8A3D"; bx.beginPath(); bx.moveTo(0, -452); bx.lineTo(-22, -500); bx.lineTo(22, -500); bx.fill(); }
    else if (i % 10 === 0) { bx.fillStyle = "#E8EAED"; bx.font = `700 40px ${DISP}`; bx.textAlign = "center"; bx.textBaseline = "middle"; bx.fillText(String(i), 0, -478); }
    else if (i % 5 === 0) { bx.fillStyle = "#E8EAED"; bx.fillRect(-5, -500, 10, 40); }
    else if (i < 15) { bx.fillStyle = "#B9BEC6"; bx.fillRect(-2, -500, 4, 22); }
    bx.restore();
  }
  bx.restore();
  const bezelTex = new THREE.CanvasTexture(bc); bezelTex.colorSpace = THREE.SRGBColorSpace; bezelTex.anisotropy = 8;
  const insert = new THREE.Mesh(new THREE.RingGeometry(0.875, 0.995, 128, 1), new THREE.MeshPhysicalMaterial({ map: bezelTex, roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }));
  insert.position.z = 0.292; bezelG.add(insert);

  // ---- dial: sunburst face texture, rehaut, applied indices, subdial rings ----
  const dialG = mk("dial");
  const rc = mkCanvas(2048, 64), rx = rc.getContext("2d");
  rx.fillStyle = "#e4e7eb"; rx.fillRect(0, 0, 2048, 64); rx.fillStyle = "#2b2f36";
  for (let i = 0; i < 240; i++) { const w = i % 20 === 0 ? 6 : 2, h = i % 20 === 0 ? 40 : 22; rx.fillRect((i / 240) * 2048 - w / 2, 64 - h, w, h); }
  const rehautTex = new THREE.CanvasTexture(rc); rehautTex.colorSpace = THREE.SRGBColorSpace;
  dialG.add(new THREE.Mesh(lathe([[0.86, 0.289], [0.812, 0.205]]), new THREE.MeshStandardMaterial({ map: rehautTex, roughness: 0.5, side: THREE.DoubleSide })));
  const faceCanvas = mkCanvas(1024, 1024);
  const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.815, 128), new THREE.MeshPhysicalMaterial({ map: faceTex, roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.3 }));
  dial.position.z = 0.205; dialG.add(dial);
  const D = 0.815, cw = (px, py) => [((px - 512) / 512) * D, -((py - 512) / 512) * D];
  const idx = {};
  const markerGeo = rbox(0.055, 0.15, 0.03, 0.014), lumeGeo = new THREE.PlaneGeometry(0.022, 0.1);
  const buildIdx = (name, hours, subs, win) => {
    const g = new THREE.Group(); dialG.add(g); idx[name] = g;
    hours.forEach((h) => {
      const a = (h / 12) * Math.PI * 2, r = 0.64;
      const m = new THREE.Mesh(markerGeo, steel); m.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.222); m.rotation.z = -a; g.add(m);
      const lm = new THREE.Mesh(lumeGeo, lume); lm.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.2375); lm.rotation.z = -a; g.add(lm);
    });
    subs.forEach(([px, py, pr]) => { const [x, y] = cw(px, py), r = (pr / 512) * D; const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 10, 96), steel); t.position.set(x, y, 0.208); g.add(t); });
    if (win) {
      const [x, y] = cw(win[0], win[1]), w = (win[2] / 512) * D, h = (win[3] / 512) * D;
      const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.02, -h / 2 - 0.02); s.lineTo(w / 2 + 0.02, -h / 2 - 0.02); s.lineTo(w / 2 + 0.02, h / 2 + 0.02); s.lineTo(-w / 2 - 0.02, h / 2 + 0.02);
      const hole = new THREE.Path(); hole.moveTo(-w / 2, -h / 2); hole.lineTo(-w / 2, h / 2); hole.lineTo(w / 2, h / 2); hole.lineTo(w / 2, -h / 2); s.holes.push(hole);
      const f = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }), steel); f.position.set(x, y, 0.206); g.add(f);
    }
  };
  buildIdx("sport", [1, 2, 4, 5, 7, 8, 9, 10, 11], [[512, 715, 100], [720, 520, 52]]);
  buildIdx("chrono", [1, 2, 4, 5, 7, 8, 10, 11, 12], [[512, 715, 95], [740, 512, 66]], [310, 520, 120, 140]);
  idx.pet = new THREE.Group(); dialG.add(idx.pet);

  let face = "sport";
  const drawFace = () => {
    const c = faceCanvas.getContext("2d"), now = new Date();
    const hh = String(now.getHours()).padStart(2, "0"), mm = String(now.getMinutes()).padStart(2, "0");
    const day = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const md = String(now.getMonth() + 1).padStart(2, "0") + "/" + String(now.getDate()).padStart(2, "0");
    const base = { sport: ["#F3F4F6", "#DADDE2"], chrono: ["#F2EEE5", "#D9D2C2"], pet: ["#F2A3BD", "#D9678F"] }[face];
    c.fillStyle = base[0]; c.fillRect(0, 0, 1024, 1024);
    if (c.createConicGradient) { const g = c.createConicGradient(0, 512, 512); for (let i = 0; i <= 24; i++) g.addColorStop(i / 24, i % 2 ? base[0] : base[1]); c.globalAlpha = face === "pet" ? 0.35 : 0.22; c.fillStyle = g; c.fillRect(0, 0, 1024, 1024); c.globalAlpha = 1; }
    const v = c.createRadialGradient(512, 512, 300, 512, 512, 540); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.14)"); c.fillStyle = v; c.fillRect(0, 0, 1024, 1024);
    c.textAlign = "center"; c.textBaseline = "middle";
    const ring = (r, n, len, w, col) => { c.strokeStyle = col; c.lineWidth = w; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; c.beginPath(); c.moveTo(512 + Math.sin(a) * r, 512 - Math.cos(a) * r); c.lineTo(512 + Math.sin(a) * (r - len), 512 - Math.cos(a) * (r - len)); c.stroke(); } };
    const snail = (x, y, r, col, fill) => { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = col; c.lineWidth = 1.5; for (let k = 6; k < r; k += 6) { c.beginPath(); c.arc(x, y, k, 0, 7); c.stroke(); } };
    if (face === "sport") {
      ring(500, 60, 16, 3, "#8A9099");
      c.fillStyle = "#121417"; c.font = `800 180px ${DISP}`; c.fillText("12", 512, 250);
      c.fillStyle = "#E2550F"; c.font = `700 36px ${BODY}`; c.fillText(day, 512, 380);
      c.fillStyle = "#5B616B"; c.font = `500 34px ${BODY}`; c.fillText(md, 512, 428);
      c.fillStyle = "#121417"; c.font = `800 30px ${DISP}`; c.fillText("NORTH°", 512, 535);
      snail(512, 715, 100, "rgba(255,255,255,.18)", "#FF6A1A"); ring(95, 30, 14, 3, "rgba(255,255,255,.75)");
      c.save(); c.translate(0, 203); ring(92, 30, 12, 3, "rgba(255,255,255,.8)"); c.restore();
      snail(720, 520, 52, "rgba(0,0,0,.08)", "#E2E5E9");
    } else if (face === "chrono") {
      ring(500, 240, 12, 2, "#B0A690"); ring(500, 60, 24, 3, "#6E6656");
      c.fillStyle = "#1A1D22"; c.font = `800 28px ${DISP}`; c.fillText("NORTH°", 512, 215);
      c.font = `600 80px ${MONO}`; c.fillText(hh + ":" + mm, 512, 330);
      c.fillStyle = "#1A1D22"; c.fillRect(250, 450, 120, 140); c.fillStyle = "#F2EEE5"; c.font = `500 28px ${BODY}`;
      c.fillText(now.toLocaleDateString("en-US", { month: "short" }).toUpperCase(), 310, 492); c.font = `800 50px ${DISP}`; c.fillText(String(now.getDate()), 310, 548);
      snail(512, 715, 95, "rgba(255,255,255,.07)", "#1A1D22"); c.save(); c.translate(0, 203); ring(88, 12, 14, 4, "#F2EEE5"); c.restore();
      snail(740, 512, 66, "rgba(0,0,0,.08)", "#E7E1D4"); c.save(); c.translate(228, 0); ring(62, 24, 10, 2, "#6E6656"); c.restore();
    } else {
      c.fillStyle = "#fff"; c.font = `700 42px ${BODY}`; c.fillText(now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase() + " " + now.getDate(), 512, 320);
      c.shadowColor = "rgba(120,20,60,.35)"; c.shadowBlur = 24; c.shadowOffsetY = 8;
      c.font = `900 210px ${DISP}`; c.fillText(hh + ":" + mm, 512, 520);
      c.beginPath(); c.moveTo(512, 760); c.bezierCurveTo(400, 680, 430, 600, 480, 620); c.lineTo(512, 650); c.lineTo(544, 620); c.bezierCurveTo(594, 600, 624, 680, 512, 760); c.fill();
      c.shadowColor = "transparent";
    }
    c.globalAlpha = 0.05; for (let i = 0; i < 9000; i++) { c.fillStyle = Math.random() < 0.5 ? "#000" : "#fff"; c.fillRect(Math.random() * 1024, Math.random() * 1024, 1.5, 1.5); } c.globalAlpha = 1;
    faceTex.needsUpdate = true;
    Object.keys(idx).forEach((k) => { idx[k].visible = k === face; });
  };
  drawFace();
  timers.push(setInterval(drawFace, 20000));

  // ---- hands: sword-shaped gunmetal with lume inlays ----
  const handsG = mk("hands");
  const sword = (len, w) => { const s = new THREE.Shape(); s.moveTo(0, -0.06); s.quadraticCurveTo(w * 0.6, -0.06, w / 2, 0.02); s.lineTo(w * 0.42, len * 0.82); s.lineTo(0, len); s.lineTo(-w * 0.42, len * 0.82); s.lineTo(-w / 2, 0.02); s.quadraticCurveTo(-w * 0.6, -0.06, 0, -0.06); return s; };
  const hand = (len, w, z) => {
    const g = new THREE.Group(); g.position.z = z; handsG.add(g);
    g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sword(len, w), { depth: 0.01, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }), gunmetal));
    const inl = new THREE.Mesh(new THREE.ShapeGeometry(sword(len * 0.62, w * 0.5)), lume); inl.position.set(0, len * 0.22, 0.0145); g.add(inl);
    return g;
  };
  const hH = hand(0.44, 0.095, 0.24), hM = hand(0.68, 0.07, 0.255);
  const hS = new THREE.Group(); hS.position.z = 0.275; handsG.add(hS);
  const sb = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.9, 0.008), accentMat); sb.position.y = 0.3; hS.add(sb);
  const cwt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 32), accentMat); cwt.rotation.x = Math.PI / 2; cwt.position.y = -0.1; hS.add(cwt);
  const tipL = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), lume); tipL.position.set(0, 0.62, 0.006); hS.add(tipL);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 24), steel); pin.rotation.x = Math.PI / 2; pin.position.z = 0.285; handsG.add(pin);

  // ---- crystal: low domed sapphire ----
  const crystalG = mk("crystal");
  const CR = 3.4, th0 = Math.asin(0.865 / CR);
  const cr = new THREE.Mesh(new THREE.SphereGeometry(CR, 96, 24, 0, Math.PI * 2, 0, th0), glass);
  cr.rotation.x = Math.PI / 2; cr.position.z = 0.292 - CR * Math.cos(th0); crystalG.add(cr);

  // ---- strap: tapered rubber with rounded edges, holes and keeper ----
  const SR = 1.75, SL = 2.7, SW = 0.84, ST = 0.14;
  const bendPt = (s, t) => [0.9 + (SR + t) * Math.sin(s / SR), -0.06 - SR + (SR + t) * Math.cos(s / SR)];
  const strapGeo = () => {
    const r = 0.055, sh = new THREE.Shape(), w = SW / 2, h = ST / 2;
    sh.moveTo(-w + r, -h); sh.lineTo(w - r, -h); sh.quadraticCurveTo(w, -h, w, -h + r); sh.lineTo(w, h - r); sh.quadraticCurveTo(w, h, w - r, h); sh.lineTo(-w + r, h); sh.quadraticCurveTo(-w, h, -w, h - r); sh.lineTo(-w, -h + r); sh.quadraticCurveTo(-w, -h, -w + r, -h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: SL, steps: 64, bevelEnabled: false, curveSegments: 6 }), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const s = p.getZ(i), t = p.getY(i), k = 1 - 0.14 * (s / SL), [Y, Z] = bendPt(s, t); p.setXYZ(i, p.getX(i) * k, Y, Z); }
    g.computeVertexNormals(); return g;
  };
  const strapG = mk("strap");
  strapG.add(new THREE.Mesh(strapGeo(), strapMatA));
  const bot = new THREE.Mesh(strapGeo(), strapMatB); bot.rotation.z = Math.PI; strapG.add(bot);
  const holeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20);
  for (let i = 0; i < 6; i++) { const s = 1.15 + i * 0.2, [Y, Z] = bendPt(s, ST / 2); const h = new THREE.Mesh(holeGeo, black); h.position.set(0, Y, Z); h.rotation.x = Math.PI / 2 - s / SR; bot.add(h); }
  const keeper = new THREE.Mesh(rbox(SW * 0.9 + 0.06, 0.12, ST + 0.07, 0.05), strapMatB);
  { const s = 0.75, [Y, Z] = bendPt(s, 0); keeper.position.set(0, Y, Z); keeper.rotation.x = -s / SR; bot.add(keeper); }
  [1, -1].forEach((d) => { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.06, 12), steel); sp.rotation.z = Math.PI / 2; sp.position.set(0, d * 1.08, -0.06); strapG.add(sp); });

  // ---- soft shadow behind the watch ----
  const shC = mkCanvas(256, 256), shX = shC.getContext("2d"), sg = shX.createRadialGradient(128, 128, 10, 128, 128, 128);
  sg.addColorStop(0, "rgba(0,0,0,.55)"); sg.addColorStop(0.5, "rgba(0,0,0,.2)"); sg.addColorStop(1, "rgba(0,0,0,0)"); shX.fillStyle = sg; shX.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shC), transparent: true, depthWrite: false, opacity: 0 }));
  scene.add(shadow);

  // explode offsets, assembly order: case, bezel, dial, hands, crystal, strap
  const order = ["case", "bezel", "dial", "hands", "crystal", "strap"];
  const off = { strap: [-1.8, -0.2, -1.6], case: [-0.6, 0, -0.5], bezel: [0.4, 0.1, 0.5], dial: [1.1, 0.15, 1.1], hands: [1.7, 0.2, 1.6], crystal: [2.4, 0.3, 2.2] };

  // floating props per chapter
  const chapters = ["move", "roam", "play"];
  const pal = { move: [0xf2b33d, 0x6b3f2a, 0xe3a21a, 0xe2552b, 0x2b2b2e, 0xe2552b], roam: [0x2f5bff, 0x1e2b4a, 0x8fa9ff, 0x2f5bff, 0xf4f1ea, 0x5c7cff], play: [0xe8457a, 0xf0a7be, 0xc9ced6, 0x2b2b2e, 0xffffff, 0xe8457a] };
  const geos = [new THREE.CapsuleGeometry(0.16, 0.7, 6, 16), rbox(0.5, 0.7, 0.3, 0.08), new THREE.SphereGeometry(0.28, 32, 16), new THREE.TorusGeometry(0.26, 0.09, 16, 40), rbox(0.42, 0.42, 0.42, 0.08), new THREE.SphereGeometry(0.18, 32, 16)];
  const spots = [[-0.36, 0.32, -1.5, 0.6], [0.34, 0.36, -2, 0.5], [0.4, -0.18, -1, 0.7], [-0.22, -0.3, 1.6, 1.3], [0.2, 0.2, 1.8, 1.2], [-0.4, -0.05, 1.2, 1.1]];
  const propGroups = {};
  chapters.forEach((ch, ci) => {
    const g = new THREE.Group(); scene.add(g); propGroups[ch] = [];
    geos.forEach((geo, i) => {
      const shiny = i === 2 && ch === "play";
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: pal[ch][i], roughness: shiny ? 0.15 : 0.5, metalness: shiny ? 0.9 : 0 }));
      m.rotation.set(i, ci + i * 0.7, i * 0.3); g.add(m); propGroups[ch].push(m);
    });
    propGroups[ch].group = g;
  });

  /* ---------- scroll state ---------- */
  const ids = ["assembly", "move", "roam", "play", "rings", "specs"];
  const els = Object.fromEntries(ids.map((id) => [id, $("#" + id)]));
  const bgs = Object.fromEntries(["move", "roam", "play", "rings"].map((id) => [id, els[id].dataset.bg]));
  const sec = {};
  let vw = 1, vh = 1, visH = 1, visW = 1;
  const measure = () => {
    vw = innerWidth; vh = innerHeight;
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360); visW = visH * camera.aspect;
    ids.forEach((id) => { const el = els[id], r = el.getBoundingClientRect(); sec[id] = { top: r.top + scrollY, h: el.offsetHeight }; });
  };
  measure();
  const enter = (id, y) => clamp((y - (sec[id].top - vh)) / vh);
  const prog = (id, y) => clamp((y - sec[id].top) / Math.max(1, sec[id].h - vh));

  const cA = new THREE.Color(), cB = new THREE.Color(), tmp = new THREE.Color(), bgc = new THREE.Color();
  const partLis = [...root.querySelectorAll(".parts li")];
  const plinth = $(".plinth");
  let sy = scrollY, mx = 0, my = 0, lastBg = "", lastT = 0, raf = 0;
  const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove);

  const frame = (tms) => {
    const t = tms / 1000; const dt = Math.min(0.1, lastT ? t - lastT : 0.016); lastT = t;
    sy = reduce ? scrollY : lerp(sy, scrollY, 1 - Math.exp(-dt * 7));
    const y = sy;
    const eA = enter("assembly", y), pA = prog("assembly", y);
    const eM = enter("move", y), eR = enter("roam", y), eP = enter("play", y), eG = enter("rings", y), eS = enter("specs", y);

    // background room colour
    bgc.set("#0B0D10");
    [["move", eM], ["roam", eR], ["play", eP], ["rings", eG]].forEach(([id, e]) => bgc.lerp(tmp.set(bgs[id]), ss(0.35, 0.95, e)));
    const hex = "#" + bgc.getHexString(); if (hex !== lastBg) { root.style.background = hex; lastBg = hex; }

    // strap colours + face
    const edition = getEdition();
    cA.set("#FF6A1A"); cB.set("#FF6A1A");
    const stR = ss(0.4, 0.9, eR), stP = ss(0.4, 0.9, eP), stG = ss(0.4, 0.9, eG);
    cA.lerp(tmp.set("#E9DCC4"), stR); cB.lerp(tmp.set("#1E2B4A"), stR);
    cA.lerp(tmp.set("#F2F2F2"), stP); cB.lerp(tmp.set("#F2F2F2"), stP);
    cA.lerp(tmp.set(EDITIONS[edition][0]), stG); cB.lerp(tmp.set(EDITIONS[edition][1]), stG);
    const kc = 1 - Math.exp(-dt * 9); strapMatA.color.lerp(cA, kc); strapMatB.color.lerp(cB, kc);
    const f = eG > 0.5 ? EDITIONS[edition][2] : eP > 0.5 ? "pet" : eR > 0.5 ? "chrono" : "sport";
    if (f !== face) { face = f; drawFace(); accentMat.color.set(f === "chrono" ? "#D93A2B" : f === "pet" ? "#E8457A" : "#FF6A1A"); }
    handsG.visible = face !== "pet";

    // assembly: staggered explode
    order.forEach((n, i) => {
      const a = 0.05 + i * 0.1, e = 1 - ss(a, a + 0.3, pA), o = off[n];
      parts[n].position.set(o[0] * e, o[1] * e, o[2] * e);
      if (partLis[i]) partLis[i].classList.toggle("done", e < 0.04);
    });

    // placement
    const narrow = vw < 900;
    let s = Math.min((visH * 0.62) / 4.2, (visW * 0.62) / 2.4);
    let px = narrow ? 0 : visW * 0.14 * (1 - ss(0.2, 0.9, eM)), py = (narrow ? -visH * 0.12 : 0) * (1 - ss(0.2, 0.9, eM));
    py -= visH * (1 - ss(0, 1, eA));
    if (eG > 0 && plinth) {
      const r = plinth.getBoundingClientRect(), k = ss(0.3, 0.95, eG);
      const tx = ((r.left + r.width / 2) / vw - 0.5) * visW, ty = -((r.top + r.height / 2) / vh - 0.5) * visH;
      px = lerp(px, tx, k); py = lerp(py, ty, k); s = lerp(s, ((r.height / vh) * visH * 1.05) / 4.2, k);
    }
    py += visH * 1.1 * ss(0, 1, eS);
    const chW = ss(0.2, 0.8, eM) * (1 - ss(0.3, 0.9, eG));
    const yaw = 0.95 * (1 - ss(0.05, 0.75, pA));
    const swing = Math.sin((y / vh) * 1.3) * 0.45 * chW;
    const idle = reduce ? 0 : Math.sin(t * 1.2) * 0.04;
    watch.position.set(px, py + idle, 0);
    watch.scale.setScalar(s);
    shadow.position.set(px + 0.35 * s, py - 0.45 * s, -2.6); shadow.scale.setScalar(s * 1.15);
    shadow.material.opacity = 0.5 * ss(0.2, 0.8, eM) * (1 - ss(0, 0.6, eS));
    watch.rotation.set(
      -0.12 * (1 - eA) + my * 0.15 + 0.18 * chW,
      yaw + swing + mx * 0.25 - 0.25 * (1 - ss(0.2, 0.9, eM)) * eA,
      (-0.12 * ss(0.3, 0.9, eM) + 0.22 * stR - 0.16 * stP + 0.06 * stG) * (1 - ss(0.4, 1, eG)),
    );

    // hands on real time
    const now = new Date(), sec2 = now.getSeconds() + now.getMilliseconds() / 1000, min = now.getMinutes() + sec2 / 60, hr = (now.getHours() % 12) + min / 60;
    hS.rotation.z = (-sec2 / 60) * Math.PI * 2; hM.rotation.z = (-min / 60) * Math.PI * 2; hH.rotation.z = (-hr / 12) * Math.PI * 2;

    // props
    chapters.forEach((ch, ci) => {
      const e = enter(ch, y), next = ci < 2 ? enter(chapters[ci + 1], y) : enter("rings", y);
      const w = ss(0.25, 0.8, e) * (1 - ss(0.15, 0.7, next)), local = prog(ch, y), g = propGroups[ch];
      g.group.visible = w > 0.01;
      g.forEach((m, i) => {
        const [nx, ny, z, d] = spots[i];
        const sc = w * s * (narrow ? 0.8 : 1.15);
        m.scale.setScalar(Math.max(sc, 0.0001));
        m.position.set(nx * visW * (narrow ? 0.85 : 1), ny * visH + (local - 0.5) * d * 2.4 - (1 - w) * 2, z);
        if (!reduce) { m.rotation.x += 0.004 * d; m.rotation.y += 0.006 * d; }
      });
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    measure,
    redrawFace: drawFace,
    dispose() {
      cancelAnimationFrame(raf);
      timers.forEach(clearInterval);
      removeEventListener("pointermove", onMove);
      const seen = new Set();
      scene.traverse((o) => {
        if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
        [].concat(o.material || []).forEach((m) => {
          if (seen.has(m)) return;
          seen.add(m);
          for (const k in m) if (m[k]?.isTexture) m[k].dispose();
          m.dispose();
        });
      });
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
}
