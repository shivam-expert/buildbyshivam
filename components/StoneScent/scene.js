// Three.js scene for the Stone Scent story: a pre-fractured stone, a black flacon,
// a stone plinth with mist, and an atomiser spray. Everything is procedural (no assets).
//
// Performance notes
// - The stone is ONE merged mesh. Every shard's break-apart motion runs in the vertex shader
//   (offset + axis rotation per shard), so the explosion is one draw call with no CPU work.
// - Dust, spray and ambient motes are GPU particles: positions come from time/progress
//   uniforms in the shader, so no buffers are re-uploaded per frame.
// - No point lights: the ember glow is emissive on the shards' inner faces plus an additive
//   sprite; the shop backlight is a warm tint on the rim light plus a halo sprite.
// - Every shader is compiled up front (compileAsync), so nothing hitches when an object first
//   appears mid-scroll, and the pixel ratio steps down if frames run slow.
// - Loading is staged: the stone renders first; the flacon, plinth, mist and spray are built in
//   an idle slot right after, while nobody can scroll to them yet. Named three imports keep the
//   bundle small, and the environment map is generated at a reduced size.

import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  Points,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SpotLight,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softTexture(size, stops) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/* ---------- GPU particles ---------- */
const POINT_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * uOpacity * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

// attenuation matches PointsMaterial: size in world units, uScale = drawing-buffer height / 2
const POINT_SIZE = /* glsl */ `
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uScale / -mv.z;
`;

function pointsMaterial(vertexShader, uniforms) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(0xffffff) },
      uOpacity: { value: 0 },
      uScale: { value: 400 },
      uTime: { value: 0 },
      ...uniforms,
    },
    vertexShader,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ brand: string, fontFamily: string, anchors: number[][], onReady?: () => void }} opts
 */
export function createStoneScene(canvas, { brand, fontFamily, anchors, onReady }) {
  const rand = mulberry32(7);
  const R = (a, b) => a + (b - a) * rand();
  const V = () => new Vector3(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();

  /* ---------- renderer ---------- */
  let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.fog = new Fog(0x050505, 9, 22);
  const pmrem = new PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: 128 });
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.4; // newer RoomEnvironment is brighter; keep the studio-black mood

  const camera = new PerspectiveCamera(34, 1, 0.1, 60);

  // hard rims from behind = the studio-black product look
  const rimCool = new Color(0xdfe6ff);
  const rimWarm = new Color(0xff8a4a);
  const rimL = new DirectionalLight(0xffffff, 4.2);
  rimL.position.set(-5, 3, -4);
  const rimR = new DirectionalLight(rimCool.clone(), 3.2);
  rimR.position.set(5, 2.5, -5);
  const key = new DirectionalLight(0xffffff, 0.9);
  key.position.set(2, 5, 6);
  const top = new SpotLight(0xffffff, 40, 14, 0.5, 0.6);
  top.position.set(0, 7, 2);
  scene.add(new AmbientLight(0xffffff, 0.08), rimL, rimR, key, top, top.target);

  const emberTex = softTexture(128, [[0, "rgba(255,150,80,1)"], [0.35, "rgba(255,90,31,.45)"], [1, "rgba(255,90,31,0)"]]);
  const mistTex = softTexture(256, [[0, "rgba(255,255,255,.9)"], [1, "rgba(255,255,255,0)"]]);

  /* ---------- the stone ----------
     One rock surface split into Voronoi cells on the sphere. Each cell becomes a closed, chunky
     fragment: its outer skin plus walls from the cell's border down to an inner apex. The centre
     stays hollow (the flacon lives there) and only border edges get walls, so the mesh is light. */
  const rockGroup = new Group();
  scene.add(rockGroup);
  const waves = [...Array(16)].map((_, i) => ({
    f: V().multiplyScalar(1.6 * Math.pow(1.32, i) * R(0.85, 1.15)),
    p: R(0, 6.28),
    a: (i < 2 ? 0.24 : 0.15) * Math.pow(0.74, i),
  }));
  const fbm = (d) => {
    let n = 0;
    for (const w of waves) n += w.a * Math.sin(w.f.dot(d) + w.p);
    return n;
  };
  const cuts = [...Array(14)].map(() => ({ n: V(), d: R(1.08, 1.32) }));
  const squash = new Vector3(0.98, 1.3, 0.84);
  const rockPoint = (dir) => {
    const p = dir.clone().multiplyScalar(1.5 * (1 + fbm(dir))).multiply(squash);
    for (const c of cuts) {
      const s = p.dot(c.n);
      if (s > c.d) p.addScaledVector(c.n, -(s - c.d));
    }
    return p;
  };

  const SEEDS = 64;
  const seeds = [];
  for (let i = 0; i < SEEDS; i++) {
    const y = 1 - ((i + 0.5) / SEEDS) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.39996;
    seeds.push(new Vector3(Math.cos(th) * r + R(-0.2, 0.2), y + R(-0.2, 0.2), Math.sin(th) * r + R(-0.2, 0.2)).normalize());
  }

  const ico = new IcosahedronGeometry(1, 4);
  const ip = ico.attributes.position;
  const key3 = (v) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
  const tris = [];
  for (let t = 0; t < ip.count; t += 3) {
    const dirs = [0, 1, 2].map((k) => new Vector3().fromBufferAttribute(ip, t + k).normalize());
    const cen = dirs[0].clone().add(dirs[1]).add(dirs[2]).normalize();
    let cell = 0;
    let bd = -9;
    seeds.forEach((s, i) => {
      const d = s.dot(cen);
      if (d > bd) {
        bd = d;
        cell = i;
      }
    });
    tris.push({ dirs, keys: dirs.map(key3), cell });
  }
  ico.dispose();

  // which cells share each edge → walls only on borders between different cells
  const ek = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const edgeCells = new Map();
  for (const t of tris) {
    for (let k = 0; k < 3; k++) {
      const e = ek(t.keys[k], t.keys[(k + 1) % 3]);
      if (!edgeCells.has(e)) edgeCells.set(e, []);
      edgeCells.get(e).push(t.cell);
    }
  }
  const pointCache = new Map();
  const surf = (dir, k) => {
    if (!pointCache.has(k)) pointCache.set(k, rockPoint(dir));
    return pointCache.get(k);
  };
  const cells = seeds.map(() => ({ outer: [], walls: [] }));
  for (const t of tris) {
    const p = t.dirs.map((d, k) => surf(d, t.keys[k]));
    cells[t.cell].outer.push(p);
    for (let k = 0; k < 3; k++) {
      const n = (k + 1) % 3;
      if (edgeCells.get(ek(t.keys[k], t.keys[n])).some((c) => c !== t.cell)) cells[t.cell].walls.push([p[k], p[n]]);
    }
  }

  // the crack starts front-right and runs across the stone
  const impact = new Vector3(0.6, 0.3, 0.75).normalize();
  const A = { pos: [], col: [], center: [], dir: [], axis: [], params: [], inner: [] };
  for (const cell of cells) {
    if (!cell.outer.length) continue;
    const c = new Vector3();
    cell.outer.forEach((t) => t.forEach((v) => c.add(v)));
    c.multiplyScalar(1 / (cell.outer.length * 3));
    const apex = c.clone().multiplyScalar(R(0.4, 0.55)); // chunky fragments, hollow centre
    const dir = c.clone().normalize().add(new Vector3(R(-0.3, 0.3), R(-0.2, 0.4), R(-0.4, 0.15))).normalize();
    const axis = V();
    const delay = 0.07 * (1 - dir.dot(impact)) + R(0, 0.03);
    const params = [R(2.6, 6.2), R(6, 12), R(1.2, 3.6) * (rand() < 0.5 ? -1 : 1), delay];
    const push = (v, g, inner) => {
      A.pos.push(v.x - c.x, v.y - c.y, v.z - c.z);
      A.col.push(g, g, g * 1.02);
      A.center.push(c.x, c.y, c.z);
      A.dir.push(dir.x, dir.y, dir.z);
      A.axis.push(axis.x, axis.y, axis.z);
      A.params.push(...params);
      A.inner.push(inner);
    };
    const tone = R(0.85, 1.15);
    for (const [a, b, d] of cell.outer) {
      const g = (0.055 + fbm(a.clone().normalize().multiplyScalar(2.3)) * 0.15) * tone * (rand() < 0.04 ? 1.8 : 1); // speckled granite
      push(a, g, 0);
      push(b, g, 0);
      push(d, g, 0);
    }
    for (const [a, b] of cell.walls) {
      const g = R(0.025, 0.04); // raw interior
      push(b, g, 1);
      push(a, g, 1);
      push(apex, g * 0.7, 1);
    }
  }
  const rockGeo = new BufferGeometry();
  rockGeo.setAttribute("position", new Float32BufferAttribute(A.pos, 3));
  rockGeo.setAttribute("color", new Float32BufferAttribute(A.col, 3));
  rockGeo.setAttribute("aCenter", new Float32BufferAttribute(A.center, 3));
  rockGeo.setAttribute("aDir", new Float32BufferAttribute(A.dir, 3));
  rockGeo.setAttribute("aAxis", new Float32BufferAttribute(A.axis, 3));
  rockGeo.setAttribute("aParams", new Float32BufferAttribute(A.params, 4));
  rockGeo.setAttribute("aInner", new Float32BufferAttribute(A.inner, 1));

  const rockU = { uE: { value: 0 }, uTime: { value: 0 }, uGlow: { value: 0 } };
  const rockMat = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0.06, envMapIntensity: 0.2 });
  rockMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, rockU);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        attribute vec3 aCenter; attribute vec3 aDir; attribute vec3 aAxis; attribute vec4 aParams; attribute float aInner;
        uniform float uE; uniform float uTime; varying float vInner;
        mat3 axisRot(vec3 a, float t) {
          float s = sin(t), c = cos(t), o = 1.0 - c;
          return mat3(o*a.x*a.x + c,     o*a.x*a.y + a.z*s, o*a.z*a.x - a.y*s,
                      o*a.x*a.y - a.z*s, o*a.y*a.y + c,     o*a.y*a.z + a.x*s,
                      o*a.z*a.x + a.y*s, o*a.y*a.z - a.x*s, o*a.z*a.z + c);
        }`,
      )
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `
        float le = clamp((uE - aParams.w) / (1.0 - aParams.w), 0.0, 1.0);
        float burst = 1.0 - pow(1.0 - le, 2.6);                // fast break, long glide
        float crack = smoothstep(0.0, 0.12, uE) * 0.045;        // hairline cracks open first
        float away = smoothstep(0.55, 1.0, uE);                 // then the debris clears frame
        float spin = aParams.z * burst + burst * uTime * 0.1 * sign(aParams.z);
        vec3 transformed = axisRot(aAxis, spin) * position + aCenter
          + aDir * (crack + aParams.x * burst + aParams.y * away);
        transformed.y += sin(uTime * 0.7 + aParams.x * 3.0) * 0.06 * burst; // weightless drift
        vInner = aInner;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uGlow; varying float vInner;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vInner * uGlow * vec3(1.0, 0.3, 0.08);");
  };
  const rock = new Mesh(rockGeo, rockMat);
  rock.frustumCulled = false; // vertices move in the shader
  rockGroup.add(rock);

  const ember = new Sprite(new SpriteMaterial({ map: emberTex, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
  rockGroup.add(ember);

  /* dust burst (GPU) */
  const DUST = 1800;
  const dBase = new Float32Array(DUST * 3);
  const dVel = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const d = V();
    const b = d.clone().multiplyScalar(R(0.8, 1.6));
    const v = d.add(new Vector3(R(-0.5, 0.5), R(-0.5, 0.5), R(-0.5, 0.5))).multiplyScalar(R(1.2, 6));
    dBase.set([b.x, b.y, b.z], i * 3);
    dVel.set([v.x, v.y, v.z], i * 3);
  }
  const dGeo = new BufferGeometry();
  dGeo.setAttribute("position", new BufferAttribute(dBase, 3));
  dGeo.setAttribute("aVel", new BufferAttribute(dVel, 3));
  const dMat = pointsMaterial(
    /* glsl */ `
    attribute vec3 aVel; uniform float uE; uniform float uSize; uniform float uScale; uniform float uTime; varying float vAlpha;
    void main() {
      float b = 1.0 - pow(1.0 - uE, 2.4);
      vec3 p = position + aVel * b + vec3(0.0, -b * b * 0.6 + sin(uTime + aVel.x) * 0.03 * b, 0.0);
      vAlpha = 1.0;
      ${POINT_SIZE}
    }`,
    { uE: { value: 0 }, uSize: { value: 0.035 } },
  );
  dMat.uniforms.uColor.value.set(0xd8d6d2);
  const dust = new Points(dGeo, dMat);
  dust.frustumCulled = false;
  rockGroup.add(dust);

  /* ambient motes (GPU) */
  const MOTES = 520;
  const mPos = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++) mPos.set([R(-9, 9), R(-6, 6), R(-8, 3)], i * 3);
  const mGeo = new BufferGeometry();
  mGeo.setAttribute("position", new BufferAttribute(mPos, 3));
  const mMat = pointsMaterial(
    /* glsl */ `
    uniform float uSize; uniform float uScale; uniform float uTime; varying float vAlpha;
    void main() {
      vec3 p = position;
      p.y = mod(p.y + uTime * 0.15 + 6.0, 12.0) - 6.0;
      p.x += sin(uTime * 0.2 + position.z) * 0.15;
      vAlpha = smoothstep(6.0, 4.5, abs(p.y));
      ${POINT_SIZE}
    }`,
    { uSize: { value: 0.03 } },
  );
  mMat.uniforms.uOpacity.value = 0.35;
  const motes = new Points(mGeo, mMat);
  motes.frustumCulled = false;
  scene.add(motes);

  const pointMats = [dMat, mMat];
  let disposed = false;

  /* ---------- the flacon (stage 2: built right after the first frame) ---------- */
  const bottle = new Group();
  scene.add(bottle);
  let P = null; // halo, slab, mist, spray — the parts that are not needed for the first frame

  function buildProduct() {
    if (disposed || P) return;
    const lathe = (pts) => new LatheGeometry(pts.map(([x, y]) => new Vector2(x, y)), 96);
    const glassBlack = new MeshPhysicalMaterial({ color: 0x0a0a0b, roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.22, envMapIntensity: 1.1 });
    const capMat = new MeshStandardMaterial({ color: 0x101011, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.8 });
    const collarMat = new MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.3, metalness: 1 });
    bottle.add(new Mesh(lathe([[0, -0.75], [0.5, -0.75], [0.58, -0.73], [0.6, -0.68], [0.6, 0.42], [0.585, 0.5], [0.53, 0.545], [0.2, 0.56], [0, 0.56]]), glassBlack));
    const collar = new Mesh(new CylinderGeometry(0.215, 0.215, 0.08, 48), collarMat);
    collar.position.y = 0.6;
    bottle.add(collar);
    bottle.add(new Mesh(lathe([[0, 0.64], [0.31, 0.64], [0.33, 0.66], [0.33, 1.17], [0.315, 1.2], [0, 1.2]]), capMat));

    const halo = new Sprite(new SpriteMaterial({ map: emberTex, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
    halo.scale.set(6, 6, 1);
    scene.add(halo);

    /* ---------- plinth stone + mist ---------- */
    const slabGeo = new IcosahedronGeometry(1, 4);
    {
      const p = slabGeo.attributes.position;
      const v = new Vector3();
      const d = new Vector3();
      const s = new Vector3(1.9, 0.62, 1.1);
      for (let i = 0; i < p.count; i++) {
        d.fromBufferAttribute(p, i).normalize();
        const n = fbm(d.clone().multiplyScalar(1.3));
        const n2 = fbm(d.clone().multiplyScalar(2.6));
        v.copy(d).multiplyScalar(1 + n * 0.8 + n2 * 0.35).multiply(s);
        if (v.y > 0.2) v.y = 0.2 + n2 * 0.06; // chiselled flat top for the flacon
        p.setXYZ(i, v.x, v.y, v.z);
      }
      slabGeo.computeVertexNormals();
    }
    const slab = new Mesh(slabGeo, new MeshStandardMaterial({ color: 0x232324, roughness: 0.95, metalness: 0.05, flatShading: true, envMapIntensity: 0.3 }));
    scene.add(slab);

    const mist = [];
    for (let i = 0; i < 18; i++) {
      const s = new Sprite(new SpriteMaterial({ map: mistTex, color: 0xdde1e4, transparent: true, depthWrite: false, opacity: 0 }));
      const sc = R(1.2, 2.4);
      s.scale.set(sc * 1.8, sc * 0.55, 1);
      mist.push({ s, x: R(-2.2, 2.2), y: R(-0.05, 0.35), z: R(-0.9, 1.1), ph: R(0, 6.28), k: R(0.5, 1) });
      scene.add(s);
    }

    /* ---------- atomiser spray (GPU) ---------- */
    const SPRAY = 1200;
    const sDir = new Float32Array(SPRAY * 3);
    const sOff = new Float32Array(SPRAY);
    for (let i = 0; i < SPRAY; i++) {
      const d = new Vector3(1, R(0.02, 0.22), R(-0.15, 0.15)).add(new Vector3(0, R(-1, 1), R(-1, 1)).multiplyScalar(R(0, 0.16)));
      sDir.set([d.x, d.y, d.z], i * 3);
      sOff[i] = rand();
    }
    const sGeo = new BufferGeometry();
    sGeo.setAttribute("position", new BufferAttribute(sDir, 3));
    sGeo.setAttribute("aOff", new BufferAttribute(sOff, 1));
    const sMat = pointsMaterial(
      /* glsl */ `
      attribute float aOff; uniform vec3 uOrigin; uniform float uSize; uniform float uScale; uniform float uTime; varying float vAlpha;
      void main() {
        float age = fract(uTime * 0.55 + aOff);
        float spread = 1.0 + age * 2.2;
        vec3 d = position;
        vec3 p = uOrigin + vec3(d.x * age * 3.2, d.y * spread * age * 1.4 + age * age * 0.25, d.z * spread * age * 2.0);
        vAlpha = smoothstep(0.0, 0.08, age) * (1.0 - smoothstep(0.7, 1.0, age));
        ${POINT_SIZE}
      }`,
      { uOrigin: { value: new Vector3() }, uSize: { value: 0.06 } },
    );
    sMat.uniforms.uColor.value.set(0xe9ecef);
    const spray = new Points(sGeo, sMat);
    spray.frustumCulled = false;
    scene.add(spray);

    pointMats.push(sMat);
    sMat.uniforms.uScale.value = mMat.uniforms.uScale.value;
    P = { halo, slab, mist, sMat, spray };
    buildLabel();
    warmUp();
  }

  /* ---------- shader warm-up: compile everything now, not mid-scroll ---------- */
  function warmUp() {
    if (disposed) return;
    const hidden = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    const restore = () => hidden.forEach((o) => (o.visible = false));
    if (renderer.compileAsync) renderer.compileAsync(scene, camera).then(restore, restore);
    else {
      renderer.compile(scene, camera);
      restore();
    }
  }

  async function buildLabel() {
    try {
      await document.fonts.load(`600 80px ${fontFamily}`);
    } catch {}
    if (disposed) return;
    const W = 512;
    const H = 934;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    const hex = (cx, cy, r) => {
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        g[i ? "lineTo" : "moveTo"](cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      g.closePath();
      g.stroke();
    };
    g.strokeStyle = "rgba(225,225,222,.9)";
    g.lineWidth = 7;
    hex(W / 2, H * 0.2, 58);
    g.lineWidth = 5;
    hex(W / 2, H * 0.2, 29);
    const px = W * 0.08;
    const py = H * 0.6;
    const pw = W * 0.84;
    const ph = H * 0.27;
    g.fillStyle = "rgba(30,30,32,1)";
    g.strokeStyle = "rgba(210,210,206,.85)";
    g.lineWidth = 5;
    g.beginPath();
    g.roundRect(px, py, pw, ph, 10);
    g.fill();
    g.stroke();
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#f2f1ee";
    g.font = `600 104px ${fontFamily}, Arial, sans-serif`;
    g.fillText(brand, W / 2, py + ph * 0.4, pw * 0.9);
    g.font = `500 34px ${fontFamily}, Arial, sans-serif`;
    g.fillStyle = "rgba(220,220,216,.75)";
    g.fillText("N° 01  ·  EAU DE PARFUM", W / 2, py + ph * 0.78, pw * 0.9);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const label = new Mesh(
      new CylinderGeometry(0.604, 0.604, 1.1, 48, 1, true, -0.5, 1.0),
      new MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.35, metalness: 0.35, envMapIntensity: 0.8 }),
    );
    label.position.y = -0.12;
    bottle.add(label);
    warmUp(); // the label is a new material variant: compile it before it is seen
  }

  /* ---------- layout ---------- */
  let L = {};
  let size = { w: 1, h: 1 };
  function resize(w, h) {
    size = { w, h };
    const a = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = a;
    camera.updateProjectionMatrix();
    for (const m of pointMats) m.uniforms.uScale.value = (h * dpr) / 2;
    const wide = a > 1.05;
    const k = wide ? 1 : Math.min(1.9, 1.05 / a);
    L = {
      camZ0: 8.2 * k,
      camZ1: 7.0 * k,
      heroX: wide ? 0.55 : 0, heroY: wide ? 0.45 : 0.75,
      restX: wide ? 1.35 : 0, restY: wide ? -0.1 : 0.15,
      detX: wide ? 0.75 : 0, detY: -0.2, detS: wide ? 1.12 : 1.0,
      downY: wide ? -2.45 : -3.6, downS: wide ? 1.55 : 1.4,
      buyX: wide ? 1.5 : 0, buyY: wide ? -0.15 : 1.1, buyS: wide ? 1.0 : 0.82,
    };
  }

  // adaptive resolution: if frames run slow for a while, step the pixel ratio down
  let slow = 0;
  function adapt(frameDt, sinceStart) {
    if (sinceStart < 2.5) return;
    slow = frameDt > 1 / 40 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 45 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      resize(size.w, size.h);
      slow = 0;
    }
  }

  /* ---------- frame ---------- */
  const tmp = new Vector3();
  const anchorVecs = anchors.map((a) => new Vector3(...a));

  let firstT = -1;
  const idle = (f) => (window.requestIdleCallback ? window.requestIdleCallback(f, { timeout: 250 }) : setTimeout(f, 30));

  function update(S, t, pointer, frameDt = 1 / 60) {
    if (firstT < 0) firstT = t;
    const since = t - firstT;
    adapt(frameDt, since);
    const intro = 1 - Math.pow(1 - clamp(since / 1.6), 3); // the stone eases in on load
    const { explode: e, settle: st, detail: dt, down: dn, buy: by } = S;

    // stone: break-apart motion lives in the shader
    const floatY = Math.sin(t * 0.8) * 0.06;
    rockGroup.position.set(L.heroX, L.heroY + floatY, 0);
    rockGroup.rotation.set(0.15 + Math.sin(t * 0.3) * 0.05, t * 0.12 - (1 - intro) * 0.8, -0.12);
    rockGroup.scale.setScalar(0.86 + 0.14 * intro);
    rockGroup.visible = e < 0.995;
    rockU.uE.value = e;
    rockU.uTime.value = t;
    // ember shows only through the hairline cracks, and is gone before the shards fly
    const crackGlow = Math.sin(Math.PI * clamp(e / 0.14));
    rockU.uGlow.value = crackGlow * crackGlow * 0.5;
    const glow = Math.sin(Math.PI * clamp(e / 0.28));
    ember.material.opacity = glow * 0.8;
    ember.scale.setScalar(1.5 + glow * 2.5);
    dMat.uniforms.uE.value = e;
    dMat.uniforms.uOpacity.value = smooth(0, 0.05, e) * (1 - smooth(0.45, 0.95, e)) * 0.9;
    dust.visible = dMat.uniforms.uOpacity.value > 0.003;

    // flacon: hidden in the stone → revealed tilted → plinth → details → sinks → shop
    bottle.visible = e > 0.03;
    let sc = lerp(0.62, 1, smooth(0, 0.6, e));
    let px = lerp(L.heroX, L.restX, st);
    let py = lerp(L.heroY - 0.15 + floatY * (1 - st), L.restY + 0.15, st);
    let rx = lerp(0.32, 0, st);
    let ry = lerp(Math.sin(t * 0.35) * 0.5 - 0.35, -0.12 + Math.sin(t * 0.25) * 0.06, st);
    const rz = lerp(-0.42, 0, st);
    px = lerp(px, L.detX, dt); py = lerp(py, L.detY, dt); sc = lerp(sc, L.detS, dt);
    ry = lerp(ry, -0.42 + Math.sin(t * 0.3) * 0.14, dt); rx = lerp(rx, 0.06, dt);
    px = lerp(px, 0, dn); py = lerp(py, L.downY, dn); sc = lerp(sc, L.downS, dn);
    ry = lerp(ry, Math.sin(t * 0.2) * 0.12, dn); rx = lerp(rx, 0.16, dn);
    px = lerp(px, L.buyX, by); py = lerp(py, L.buyY + Math.sin(t * 0.8) * 0.04, by); sc = lerp(sc, L.buyS, by);
    ry = lerp(ry, -0.3 + Math.sin(t * 0.35) * 0.3, by); rx = lerp(rx, 0, by);
    bottle.scale.setScalar(sc);
    bottle.position.set(px, py, 0);
    bottle.rotation.set(rx + pointer.y * 0.08, ry + pointer.x * 0.25, rz);
    bottle.updateMatrixWorld();

    // shop: warm rim + halo instead of a point light
    rimR.color.lerpColors(rimCool, rimWarm, by);
    rimR.intensity = 3.2 + by * 2.5;
    if (P) {
      const { halo, slab, mist, sMat, spray } = P;
      halo.visible = by > 0.003;
      halo.position.set(px, py + 0.3, -1.6);
      halo.material.opacity = by * 0.32;

      // plinth rises, then drops away for the details
      slab.visible = st > 0.01 && dt < 0.99;
      slab.position.set(L.restX, lerp(-5.5, L.restY - 0.8, st) - smooth(0, 1, dt) * 6, -0.1);
      slab.rotation.y = -0.18 + Math.sin(t * 0.2) * 0.02;

      const mistAmt = S.mist * (1 - dt);
      for (const m of mist) {
        m.s.visible = mistAmt > 0.003;
        if (!m.s.visible) continue;
        m.s.position.set(L.restX + m.x + Math.sin(t * 0.25 + m.ph) * 0.35, L.restY - 0.85 + m.y + Math.sin(t * 0.4 + m.ph) * 0.05, m.z);
        m.s.material.opacity = mistAmt * 0.24 * m.k * (0.7 + 0.3 * Math.sin(t * 0.6 + m.ph));
      }

      // spray from the atomiser
      sMat.uniforms.uOpacity.value = S.spray * (1 - dt) * 0.5;
      spray.visible = sMat.uniforms.uOpacity.value > 0.004;
      if (spray.visible) sMat.uniforms.uOrigin.value.set(0.36, 1.02, 0).applyMatrix4(bottle.matrixWorld);
    }

    for (const m of pointMats) m.uniforms.uTime.value = t;

    // camera
    camera.position.set(pointer.x * 0.35, lerp(0.35, 0.25, st) - pointer.y * 0.2, lerp(L.camZ0, L.camZ1, st));
    const lookX = lerp(lerp(L.heroX * 0.35, L.restX * 0.25, st), 0, Math.max(dt, by));
    camera.lookAt(lookX, lerp(0.2, -0.05, st), 0);
    camera.updateMatrixWorld();
    top.target.position.copy(bottle.position);

    renderer.render(scene, camera);
    if (since === 0) {
      onReady?.();
      idle(buildProduct);
    }
  }

  /** Screen position (CSS px) of a callout anchor on the flacon, for the last rendered frame. */
  function project(i, out) {
    tmp.copy(anchorVecs[i]).applyMatrix4(bottle.matrixWorld).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * size.w;
    out.y = (-tmp.y * 0.5 + 0.5) * size.h;
    return out;
  }

  function dispose() {
    disposed = true;
    scene.traverse((o) => {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        m.map?.dispose();
        m.dispose();
      }
    });
    emberTex.dispose();
    mistTex.dispose();
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  warmUp();
  return { resize, update, project, dispose };
}
