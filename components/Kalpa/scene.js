// Three.js scene for the Kalpa story: a procedural coconut that cracks open, a can that
// pops out of it, and orbiting "fact" coins. Everything is generated (no assets).
// The scroll timeline in index.jsx tweens the plain object `S`; the render loop reads it.

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export const FLAVOURS = [
  ["ORIGINAL", "#2F5D3A"],
  ["LIME + MINT", "#8DA834"],
  ["PINK GUAVA", "#D9715F"],
];

const COINS = [
  ["100%", "COCONUT WATER", "#E4DA2C", "#2A1A12"],
  ["0g", "ADDED SUGAR", "#7A5814", "#F1E36A"],
  ["1", "INGREDIENT", "#E4DA2C", "#2A1A12"],
  ["NO", "CONCENTRATE", "#7A5814", "#F1E36A"],
  ["FRESH", "PRESSED", "#E4DA2C", "#2A1A12"],
];

// ---------- helpers ----------
function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => hash(xi + i, yi + j, zi + k);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w) - 0.5;
}

/** Wait (briefly) for the page fonts so the canvas-drawn labels use them. */
export async function fontsReady(f) {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`900 100px ${f.disp}`),
        document.fonts.load(`800 100px ${f.disp}`),
        document.fonts.load(`600 40px ${f.body}`),
        document.fonts.load(`700 40px ${f.hand}`),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {}
}

export function createKalpaScene(canvas, fonts) {
  const R = rng(7);
  const DISP = `${fonts.disp}, Impact, sans-serif`;
  const BODY = `${fonts.body}, sans-serif`;
  const HAND = `${fonts.hand}, cursive`;
  const disposables = [];
  const keep = (o) => (disposables.push(o), o);

  // ---------- textures ----------
  function huskTextures() {
    const W = 2048, H = 1024;
    const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const b = document.createElement("canvas"); b.width = W; b.height = H; const y = b.getContext("2d");
    x.fillStyle = "#341a0f"; x.fillRect(0, 0, W, H); y.fillStyle = "#808080"; y.fillRect(0, 0, W, H);
    function strand(px, py, len, lw, col, bump, alpha, tilt) {
      const d1 = (R() - 0.5) * 40 + tilt * 0.33, d2 = (R() - 0.5) * 40 + tilt * 0.66, d3 = tilt + (R() - 0.5) * 30;
      for (const off of [0, -W, W]) {
        if (px + off > W || px + off + len < 0) continue;
        for (const [ctx, st, a] of [[x, col, alpha], [y, `rgb(${bump},${bump},${bump})`, Math.min(1, alpha * 1.6)]]) {
          ctx.globalAlpha = a; ctx.strokeStyle = st; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(px + off, py);
          ctx.bezierCurveTo(px + off + len * 0.33, py + d1, px + off + len * 0.66, py + d2, px + off + len, py + d3); ctx.stroke();
        }
      }
    }
    // broad tonal patches so it doesn't read as wood grain
    for (let i = 0; i < 260; i++) {
      const pc = ["#6e3b22", "#2c130a", "#83492b", "#4b2516", "#9a5a36"][(R() * 5) | 0];
      strand(R() * W, R() * H, 150 + R() * 600, 14 + R() * 34, pc, 90 + R() * 80, 0.12 + R() * 0.18, (R() - 0.5) * 160);
    }
    // fibre bundles: clumps of roughly parallel strands
    for (let bi = 0; bi < 520; bi++) {
      const bx = R() * W, by = R() * H, blen = 120 + R() * 520, tilt = (R() - 0.5) * 120, n = 4 + ((R() * 9) | 0), light = R();
      for (let k = 0; k < n; k++) {
        const col = light > 0.84 ? ["#b77a4f", "#c98c5e", "#a5683f"][(R() * 3) | 0] : light > 0.4 ? ["#6e3c22", "#7b4529", "#5c301b"][(R() * 3) | 0] : ["#2a1209", "#3a1a0c", "#1d0b05"][(R() * 3) | 0];
        const bump = light > 0.84 ? 235 : light > 0.4 ? 170 : 25;
        strand(bx + (R() - 0.5) * 30, by + k * (1.5 + R() * 3), blen * (0.6 + R() * 0.5), 0.8 + R() * 2.6, col, bump, 0.28 + R() * 0.4, tilt + (R() - 0.5) * 20);
      }
    }
    // deep crevices
    for (let i = 0; i < 160; i++) strand(R() * W, R() * H, 120 + R() * 500, 2.5 + R() * 5, "#140702", 0, 0.6, (R() - 0.5) * 90);
    // stray light hairs
    for (let i = 0; i < 1400; i++) strand(R() * W, R() * H, 15 + R() * 90, 0.5 + R() * 0.9, "#d9a273", 255, 0.18 + R() * 0.25, (R() - 0.5) * 60);
    // dark blotches
    for (let i = 0; i < 70; i++) {
      const px = R() * W, py = R() * H, r = 14 + R() * 60;
      const rg = x.createRadialGradient(px, py, 0, px, py, r);
      rg.addColorStop(0, "rgba(16,6,2,.5)"); rg.addColorStop(1, "rgba(16,6,2,0)");
      x.globalAlpha = 1; x.fillStyle = rg; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    // the three eyes, at phi = PI (u=.5), equator
    x.globalAlpha = 1; y.globalAlpha = 1;
    for (const [ex, ey] of [[1010, 470], [1050, 478], [1030, 512]]) {
      x.fillStyle = "#160803"; x.beginPath(); x.ellipse(ex, ey, 13, 10, 0, 0, Math.PI * 2); x.fill();
      y.fillStyle = "#101010"; y.beginPath(); y.ellipse(ex, ey, 14, 11, 0, 0, Math.PI * 2); y.fill();
    }
    const map = keep(new THREE.CanvasTexture(c)); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; map.wrapS = THREE.RepeatWrapping;
    const bumpT = keep(new THREE.CanvasTexture(b)); bumpT.wrapS = THREE.RepeatWrapping;
    return { map, bump: bumpT };
  }

  function drawPalm(x, cx, cy, s, col, lw) {
    x.save(); x.translate(cx, cy); x.scale(s, s); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = "round";
    const P = ["M20 38 C21 28 21 20 20 14", "M20 14 C14 8 8 8 3 11", "M20 14 C16 6 18 3 22 2", "M20 14 C26 7 32 7 37 11", "M20 14 C12 14 8 18 6 23", "M20 14 C28 14 32 18 34 23"];
    x.translate(-20, -20); for (const d of P) x.stroke(new Path2D(d)); x.restore();
  }
  const spacing = (x, v) => { try { x.letterSpacing = v; } catch {} };

  function labelTexture(name, band) {
    const W = 2048, H = 1434; const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    x.fillStyle = "#F4F0E7"; x.fillRect(0, 0, W, H);
    // paper grain
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(80,60,40,${Math.random() * 0.035})`; x.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    const cx = W / 2;
    x.textAlign = "center"; x.fillStyle = "#2A1A12";
    drawPalm(x, cx, 230, 3.2, "#2A1A12", 2.6);
    x.font = `900 210px ${DISP}`; spacing(x, "18px");
    x.fillText("KALPA", cx + 9, 500);
    x.font = `600 40px ${BODY}`; spacing(x, "12px");
    x.fillStyle = "#2F5D3A"; x.fillText("TENDER COCONUT WATER", cx + 6, 575);
    spacing(x, "0px");
    x.font = `700 58px ${HAND}`; x.fillStyle = "#2A1A12"; x.fillText("straight from the palm", cx, 660);
    // illustration: palm leaves
    x.save(); x.translate(cx + 40, 960); x.strokeStyle = "#3E6B3E"; x.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      const a = -2.6 + i * 0.3; x.lineWidth = 10; x.beginPath(); x.moveTo(60, -40);
      x.quadraticCurveTo(60 + Math.cos(a) * 140, -40 + Math.sin(a) * 200, 60 + Math.cos(a) * 300, -40 + Math.sin(a) * 260); x.stroke();
      for (let k = 1; k < 9; k++) {
        const t = k / 9; const px = 60 + Math.cos(a) * 300 * t, py = -40 + Math.sin(a) * 260 * t - 20 * Math.sin(t * 3);
        x.lineWidth = 4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a + 1.3) * 40 * (1 - t * 0.5), py + Math.sin(a + 1.3) * 40 * (1 - t * 0.5)); x.stroke();
      }
    }
    x.restore();
    // coconut half
    x.save(); x.translate(cx - 30, 1010);
    const gg = x.createRadialGradient(-60, 40, 10, 0, 40, 240); gg.addColorStop(0, "#9a5a36"); gg.addColorStop(1, "#4a2414");
    x.fillStyle = gg; x.beginPath(); x.ellipse(0, 0, 230, 190, 0, 0, Math.PI); x.fill();
    x.fillStyle = "#FBF8F1"; x.beginPath(); x.ellipse(0, 0, 230, 64, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#ECE6D6"; x.beginPath(); x.ellipse(0, 6, 196, 46, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "#5a2d18"; x.lineWidth = 6; x.beginPath(); x.ellipse(0, 0, 230, 64, 0, 0, Math.PI * 2); x.stroke();
    // straw
    x.strokeStyle = "#2A1A12"; x.lineWidth = 16; x.lineCap = "round"; x.beginPath(); x.moveTo(30, 0); x.lineTo(160, -240); x.lineTo(230, -250); x.stroke();
    x.restore();
    // band
    x.fillStyle = band; x.fillRect(0, H - 230, W, 140);
    x.fillStyle = "#F4F0E7"; x.font = `800 78px ${DISP}`; spacing(x, "10px");
    x.fillText(name, cx + 5, H - 132);
    spacing(x, "0px");
    // back panel (centred on the seam, u=0)
    function back(bx) {
      x.textAlign = "center"; x.fillStyle = "#2A1A12";
      x.font = `800 62px ${DISP}`; x.fillText("INGREDIENTS", bx, 340);
      x.font = `500 40px ${BODY}`; x.fillText("Tender coconut water.", bx, 410);
      x.strokeStyle = "#2A1A12"; x.lineWidth = 3; x.beginPath(); x.moveTo(bx - 230, 470); x.lineTo(bx + 230, 470); x.stroke();
      x.font = `500 34px ${BODY}`;
      ["Keep chilled.", "Shake gently before opening.", "Best within a day of opening."].forEach((t, i) => x.fillText(t, bx, 540 + i * 54));
      x.beginPath(); x.moveTo(bx - 230, 730); x.lineTo(bx + 230, 730); x.stroke();
      let bxx = bx - 150; for (let i = 0; i < 46; i++) { const w = ((i * 7) % 5) + 2; x.fillRect(bxx, 790, w, 150); bxx += w + 4; }
      drawPalm(x, bx, 1050, 2, "#2A1A12", 2.6);
    }
    back(0); back(W);
    // side text
    x.save(); x.translate(W * 0.27, H / 2); x.rotate(-Math.PI / 2); x.font = `600 30px ${BODY}`; spacing(x, "10px"); x.fillStyle = "#6a5246"; x.textAlign = "center"; x.fillText("CRACKED · POURED · CANNED", 0, 0); x.restore();
    x.save(); x.translate(W * 0.73, H / 2); x.rotate(Math.PI / 2); x.font = `600 30px ${BODY}`; spacing(x, "10px"); x.fillStyle = "#6a5246"; x.textAlign = "center"; x.fillText("NOTHING ADDED", 0, 0); x.restore();
    const t = keep(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }

  function coinTexture(big, small, bg, fg) {
    const S = 512; const c = document.createElement("canvas"); c.width = S; c.height = S; const x = c.getContext("2d");
    x.fillStyle = bg; x.fillRect(0, 0, S, S);
    x.strokeStyle = fg; x.globalAlpha = 0.35; x.lineWidth = 6; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 34, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
    x.translate(S / 2, S / 2); x.rotate(-0.35); x.fillStyle = fg; x.textAlign = "center";
    x.font = `900 150px ${DISP}`; x.fillText(big, 0, 30);
    x.font = `700 38px ${BODY}`; x.fillText(small, 0, 90);
    const t = keep(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  // ---------- coconut geometry ----------
  const TEETH = [];
  for (let k = 0, N = 19; k < N; k++) TEETH.push((k % 2 ? 1 : -1) * (0.045 + R() * 0.05) + (R() - 0.5) * 0.02);
  function thc(phi) {
    const N = TEETH.length; const f = (phi / (Math.PI * 2)) * N;
    const i = Math.floor(f) % N, j = (i + 1) % N, t = f - Math.floor(f);
    return Math.PI / 2 + 0.03 + TEETH[i] + (TEETH[j] - TEETH[i]) * t;
  }
  function P(theta, phi, r) {
    const sx = Math.sin(theta) * Math.cos(phi), sy = Math.cos(theta), sz = Math.sin(theta) * Math.sin(phi);
    let ax = 1.14; const ay = 0.96, az = 0.96;
    if (sx < 0) ax *= 1 + 0.09 * sx * sx;
    const n = noise3(sx * 1.6 + 3, sy * 1.6, sz * 1.6) * 0.045 + noise3(sx * 4.5, sy * 4.5, sz * 4.5) * 0.018 + noise3(sx * 11, sy * 11, sz * 11) * 0.006;
    const k = r * (1 + n); return [sx * ax * k, sy * ay * k, sz * az * k];
  }
  function shell(top, r) {
    const U = 200, V = 60, pos = [], uv = [], idx = [];
    for (let j = 0; j <= V; j++) {
      const t = j / V;
      for (let i = 0; i <= U; i++) {
        const phi = (i / U) * Math.PI * 2, c = thc(phi);
        const th = top ? t * c : c + t * (Math.PI - c);
        pos.push(...P(th, phi, r)); uv.push(i / U, 1 - th / Math.PI);
      }
    }
    for (let j = 0; j < V; j++) for (let i = 0; i < U; i++) { const a = j * (U + 1) + i, b = a + 1, c = a + U + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = keep(new THREE.BufferGeometry()); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function rim() {
    const U = 200, rings = [[1, "#3a1c0f"], [0.955, "#6b3a22"], [0.948, "#efe7d6"], [0.86, "#fbf8f1"]], pos = [], col = [], idx = [];
    const C = new THREE.Color();
    rings.forEach(([r, cl]) => {
      C.set(cl).convertSRGBToLinear();
      for (let i = 0; i <= U; i++) { const phi = (i / U) * Math.PI * 2; pos.push(...P(thc(phi), phi, r)); col.push(C.r, C.g, C.b); }
    });
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < U; i++) { const a = k * (U + 1) + i, b = a + 1, c = a + U + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = keep(new THREE.BufferGeometry()); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function canGeometry() {
    const pts = [[0, -1.25], [0.36, -1.25], [0.4, -1.235], [0.43, -1.2], [0.47, -1.15], [0.5, -1.08], [0.5, 1.06], [0.485, 1.13], [0.455, 1.19], [0.44, 1.22], [0.445, 1.245], [0.44, 1.262], [0.42, 1.262], [0.415, 1.24], [0.4, 1.225], [0, 1.225]].map((p) => new THREE.Vector2(p[0], p[1]));
    return keep(new THREE.LatheGeometry(pts, 96));
  }

  // ---------- renderer + scene ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new RoomEnvironment();
  scene.environment = keep(pmrem.fromScene(env, 0.04).texture);
  env.dispose?.();
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100); camera.position.set(0, 0, 10);

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2a20, 0.55));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.6); key.position.set(-4, 5, 6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6); fill.position.set(5, -1, 4); scene.add(fill);
  const rimL = new THREE.DirectionalLight(0xffffff, 1.6); rimL.position.set(3, 4, -6); scene.add(rimL);

  const { map: huskMap, bump: huskBump } = huskTextures();
  const huskMat = keep(new THREE.MeshStandardMaterial({ map: huskMap, bumpMap: huskBump, bumpScale: 4.5, roughness: 0.9, metalness: 0, envMapIntensity: 0.55 }));
  const fleshMat = keep(new THREE.MeshStandardMaterial({ color: 0xf7f3ea, roughness: 0.42, side: THREE.BackSide, envMapIntensity: 0.9 }));
  const rimMat = keep(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }));

  const outer = new THREE.Group(), spinner = new THREE.Group(), topH = new THREE.Group(), botH = new THREE.Group();
  scene.add(outer); outer.add(spinner); spinner.add(topH, botH);
  topH.add(new THREE.Mesh(shell(true, 1), huskMat), new THREE.Mesh(shell(true, 0.86), fleshMat), new THREE.Mesh(rim(), rimMat));
  botH.add(new THREE.Mesh(shell(false, 1), huskMat), new THREE.Mesh(shell(false, 0.86), fleshMat), new THREE.Mesh(rim(), rimMat));
  spinner.rotation.order = "YXZ";

  // soft contact shadow
  const sc = document.createElement("canvas"); sc.width = sc.height = 256;
  {
    const x = sc.getContext("2d"); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(42,26,18,.55)"); g.addColorStop(0.5, "rgba(42,26,18,.2)"); g.addColorStop(1, "rgba(42,26,18,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  }
  const shadow = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: keep(new THREE.CanvasTexture(sc)), depthWrite: false, transparent: true, opacity: 0.5 })));
  scene.add(shadow);

  // can
  const labels = FLAVOURS.map((f) => labelTexture(f[0], f[1]));
  const metal = keep(new THREE.MeshStandardMaterial({ color: 0xdadada, metalness: 1, roughness: 0.22 }));
  const labelMat = keep(new THREE.MeshPhysicalMaterial({ map: labels[0], roughness: 0.32, metalness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.18 }));
  const canG = new THREE.Group(); scene.add(canG);
  canG.add(new THREE.Mesh(canGeometry(), metal));
  const labelMesh = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.503, 0.503, 2.12, 128, 1, true, Math.PI, Math.PI * 2)), labelMat);
  labelMesh.position.y = -0.02; canG.add(labelMesh);
  // pull-tab
  const tab = new THREE.Mesh(keep(new THREE.TorusGeometry(0.09, 0.025, 12, 32)), metal);
  tab.rotation.x = Math.PI / 2; tab.position.set(0, 1.235, 0.12); tab.scale.set(1, 1.6, 1); canG.add(tab);
  canG.rotation.order = "ZYX";

  // coins
  const coinGeo = keep(new THREE.CylinderGeometry(0.5, 0.5, 0.09, 64));
  const coins = COINS.map((c, i) => {
    const face = keep(new THREE.MeshStandardMaterial({ map: coinTexture(c[0], c[1], c[2], c[3]), roughness: 0.5, metalness: 0, envMapIntensity: 0.5 }));
    const side = keep(new THREE.MeshStandardMaterial({ color: new THREE.Color(c[2]).multiplyScalar(0.7), roughness: 0.3, metalness: 0.5 }));
    const m = new THREE.Mesh(coinGeo, [side, face, face]);
    m.userData = { a: (i / COINS.length) * Math.PI * 2 + 0.4, yo: (R() - 0.5) * 0.5, zp: R() * Math.PI * 2, sp: 0.6 + R() * 0.6 };
    scene.add(m); return m;
  });

  // ---------- state (tweened by the scroll timeline) ----------
  const S = { cx: 0.07, cy: -0.1, cs: 1, crx: 0.35, crz: -0.42, cry: 0, topY: 0, topX: 0, topRX: 0, topRZ: 0, botY: 0, gap: 0, shake: 0, coins: 0, coinsOut: 0, canS: 0, canX: 0, canY: 0, canRY: 0, canRZ: 0, cocoVis: 1 };
  let visW = 1, visH = 1, unit = 1;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; visW = visH * camera.aspect;
    unit = Math.min(visW * 0.25, visH * 0.19);
  }
  let spinA = 0, last = performance.now(), time = 0, raf = 0;
  function apply() {
    // coconut
    const jx = S.shake * Math.sin(time * 47) * 0.07, jz = S.shake * Math.cos(time * 39) * 0.06;
    outer.visible = S.cocoVis > 0;
    outer.position.set((S.cx * visW) / 2 + S.shake * Math.sin(time * 61) * 0.03, (S.cy * visH) / 2, 0);
    outer.scale.setScalar(unit * S.cs);
    outer.rotation.set(S.crx + jx, 0, S.crz + jz);
    spinner.rotation.y = S.cry + spinA;
    topH.position.set(S.topX, S.topY + S.gap, 0); topH.rotation.set(S.topRX, 0, S.topRZ);
    botH.position.set(0, S.botY, 0);
    // shadow
    const lift = Math.max(0, Math.min(1, Math.abs(S.botY) / 2));
    shadow.visible = outer.visible;
    shadow.position.set(outer.position.x, outer.position.y - unit * S.cs * 1.15 - lift * unit, -0.5);
    shadow.scale.set(unit * S.cs * 2.6, unit * S.cs * 0.55, 1);
    shadow.material.opacity = 0.42 * (1 - lift) * (1 - Math.min(1, S.crx > 0.9 ? 0.5 : 0));
    // can
    canG.visible = S.canS > 0.002;
    canG.position.set((S.canX * visW) / 2, (S.canY * visH) / 2 + Math.sin(time * 1.1) * 0.04 * unit, 0.5);
    canG.scale.setScalar(unit * 0.95 * S.canS);
    canG.rotation.set(0, S.canRY + Math.sin(time * 0.7) * 0.22, S.canRZ);
    // coins
    coins.forEach((m, i) => {
      const d = m.userData; const ent = THREE.MathUtils.clamp(S.coins * 2.4 - i * 0.28, 0, 1); const e = 1 - Math.pow(1 - ent, 3); const out = 1 - S.coinsOut;
      m.visible = e * out > 0.01;
      const a = d.a + S.coins * Math.PI * 1.1 + time * 0.08;
      const rx = Math.min(visW * 0.36, unit * 3.3), ry = Math.min(visH * 0.34, unit * 2.1);
      m.position.set(Math.cos(a) * rx * (1 + (1 - e) * 0.8), Math.sin(a) * ry + d.yo * unit + (1 - e) * -visH * 0.6 + S.coinsOut * visH * 0.7, Math.sin(a * 1.4 + d.zp) * 1.2);
      m.scale.setScalar(unit * 0.95 * e);
      m.rotation.set(Math.PI / 2 + Math.sin(time * d.sp + i) * 0.45, Math.cos(time * 0.5 + i) * 0.3, Math.sin(time * 0.4 * d.sp + i * 2) * 0.6);
    });
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    spinA += dt * 0.28;
    apply(); renderer.render(scene, camera); raf = requestAnimationFrame(loop);
  }

  // ---------- product snapshots for the cards and polaroids ----------
  function snap(w, h, setup) {
    renderer.setPixelRatio(1); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * 10;
    outer.visible = false; canG.visible = false; shadow.visible = false; coins.forEach((c) => (c.visible = false));
    setup(vh); renderer.render(scene, camera); return renderer.domElement.toDataURL("image/png");
  }
  const cans = FLAVOURS.map((_, i) =>
    snap(600, 800, (vh) => { labelMat.map = labels[i]; canG.visible = true; canG.position.set(0, 0, 0); canG.scale.setScalar(vh * 0.33); canG.rotation.set(0, 0.35, -0.32); }),
  );
  const half = snap(600, 750, (vh) => { outer.visible = true; outer.position.set(0, -0.2, 0); outer.scale.setScalar(vh * 0.24); outer.rotation.set(1.0, 0, -0.1); spinner.rotation.y = 0.8; topH.visible = false; botH.position.set(0, 0, 0); });
  topH.visible = true;
  const whole = snap(600, 750, (vh) => { outer.visible = true; outer.position.set(0, 0, 0); outer.scale.setScalar(vh * 0.27); outer.rotation.set(0.35, 0, -0.45); spinner.rotation.y = 2.2; topH.position.set(0, 0, 0); topH.rotation.set(0, 0, 0); });
  labelMat.map = labels[0];
  resize();

  return {
    S,
    images: { cans, half, whole },
    start() { last = performance.now(); raf = requestAnimationFrame(loop); },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
    },
  };
}
