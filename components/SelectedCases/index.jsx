"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import s from "./SelectedCases.module.css";
import { CW, FONT_LOADS, PROJECTS, drawLabel, mk } from "./art";
import { fontVars } from "./fonts";

const N = PROJECTS.length;
const R = 4.4, W = 2.15, H = 1.344, STEP = (Math.PI * 2) / N, CARD_Y = 0.22;
const FLOOR = CARD_Y - H / 2 - 0.36;
const pad = (n) => String(n).padStart(2, "0");
// Shader colours are used as-is (no colour management), so build them without sRGB→linear conversion.
const col = (hex) => new THREE.Color().setHex(parseInt(hex.slice(1), 16), THREE.LinearSRGBColorSpace);

const vert = /* glsl */ `
uniform float uTheta,uRot,uR,uVel,uTime,uIntro,uHover,uY,uMirror,uFloor,uW;
varying vec2 vUv; varying float vFade;
void main(){
  vUv=uv;
  vec3 p=position;
  p.xy*=1.0+uHover*.03;
  float a=uTheta+uRot+p.x/uR;
  float y=uY+p.y;
  y+=sin(a*2.0-uTime*.9)*uVel*.38;            // velocity-driven ribbon wave
  float b=p.x/(uW*.5); y+=b*b*abs(uVel)*.10;    // and bow
  y+=(1.0-uIntro)*-.5;
  if(uMirror>.5) y=2.0*uFloor-y;
  float wa=atan(sin(a),cos(a));
  vFade=smoothstep(1.95,1.45,abs(wa));          // hide cards curving behind the camera
  float r=uR-uHover*.14;
  vec3 w=vec3(sin(a)*r,y,-cos(a)*r);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(w,1.0);
}`;

const frag = /* glsl */ `
uniform sampler2D uTex; uniform vec2 uRes; uniform float uVel,uRadius,uW,uH,uMirror,uIntro,uHover,uLabel,uOpacity; uniform vec3 uTint,uFog;
varying vec2 vUv; varying float vFade;
float sdR(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){
  float sx=gl_FragCoord.x/uRes.x; float edge=smoothstep(0.,.2,min(sx,1.-sx));
  vec2 uv=vUv;
  float px=smoothstep(.45,1.3,abs(uVel))*.045;  // pixelation at high speed
  if(px>.001){vec2 cells=vec2(uW,uH)/px;uv=(floor(uv*cells)+.5)/cells;}
  vec4 c;
  if(uMirror>.5){
    c=vec4(0.);
    for(int i=-2;i<=2;i++)for(int j=-2;j<=2;j++)c+=texture2D(uTex,uv+vec2(float(i),float(j))*.007);
    c/=25.;
  }else{
    float s=uVel*.008;                           // chromatic split
    vec4 g=texture2D(uTex,uv);
    c=vec4(texture2D(uTex,uv+vec2(s,0.)).r,g.g,texture2D(uTex,uv-vec2(s,0.)).b,g.a);
  }
  if(uLabel>.5){ gl_FragColor=vec4(uTint,c.a*uOpacity*uIntro*vFade*edge); return; }
  vec2 p=(vUv-.5)*vec2(uW,uH);
  float d=sdR(p,vec2(uW,uH)*.5,uRadius);
  float aa=fwidth(d)*1.2;
  float al=1.0-smoothstep(-aa,aa,d);
  c.rgb*=1.0+uHover*.07;
  if(uMirror>.5){ al*=pow(1.0-vUv.y,2.6)*.34; c.rgb=mix(c.rgb,uFog,.3); }
  gl_FragColor=vec4(c.rgb,al*uIntro*vFade*edge);
}`;

export default function SelectedCases({ className = "" }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const loaderRef = useRef(null);
  const countRef = useRef(null);
  const titleRef = useRef(null);
  const metaRef = useRef(null);
  const barRef = useRef(null);
  const themeLabelRef = useRef(null);
  const api = useRef({ toggleTheme: () => {} });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const curEl = cursorRef.current;
    const elCount = countRef.current, elTitle = titleRef.current, elMeta = metaRef.current, bar = barRef.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let disposed = false;
    const disposables = [];
    const track = (x) => (disposables.push(x), x);

    /* ---------- three ---------- */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0.08, 0);

    const shared = {
      uRot: { value: 0 }, uVel: { value: 0 }, uTime: { value: 0 }, uR: { value: R }, uFloor: { value: FLOOR },
      uTint: { value: col("#16151a") }, uRes: { value: new THREE.Vector2(1, 1) }, uFog: { value: col("#ebe8f1") },
    };
    const cards = [];
    const geoCard = track(new THREE.PlaneGeometry(W, H, 48, 12));
    const LH = (W * 96) / CW;
    const geoLabel = track(new THREE.PlaneGeometry(W, LH, 32, 1));

    function tex(c) {
      const t = track(new THREE.CanvasTexture(c));
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      t.minFilter = THREE.LinearMipmapLinearFilter;
      return t;
    }
    function mat(t, o) {
      return track(
        new THREE.ShaderMaterial({
          uniforms: {
            ...shared, uTex: { value: t }, uTheta: { value: o.theta }, uIntro: { value: 0 }, uHover: { value: 0 },
            uY: { value: o.y }, uMirror: { value: o.mirror ? 1 : 0 }, uW: { value: o.w }, uH: { value: o.h },
            uRadius: { value: o.radius || 0 }, uLabel: { value: o.label ? 1 : 0 }, uOpacity: { value: o.opacity ?? 1 },
          },
          vertexShader: vert, fragmentShader: frag, transparent: true, side: THREE.DoubleSide,
          depthWrite: !o.mirror && !o.label,
        }),
      );
    }
    function build() {
      PROJECTS.forEach((p, i) => {
        const c = mk(); p.draw(c.getContext("2d")); const t = tex(c);
        const theta = i * STEP;
        const card = new THREE.Mesh(geoCard, mat(t, { theta, y: CARD_Y, w: W, h: H, radius: 0.11 }));
        const refl = new THREE.Mesh(geoCard, mat(t, { theta, y: CARD_Y, w: W, h: H, radius: 0.11, mirror: true }));
        const lab = new THREE.Mesh(geoLabel, mat(tex(drawLabel(p)), { theta, y: CARD_Y - H / 2 - 0.07 - LH / 2, w: W, h: LH, label: true, opacity: 0.62 }));
        refl.renderOrder = 0; lab.renderOrder = 1; card.renderOrder = 2;
        [card, refl, lab].forEach((m) => { m.frustumCulled = false; scene.add(m); });
        cards.push({ card, refl, lab, hover: 0 });
      });
    }

    /* dust / stars */
    const PC = 900, pos = new Float32Array(PC * 3), seed = new Float32Array(PC);
    for (let i = 0; i < PC; i++) {
      const a = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 7, y = (Math.random() - 0.4) * 5;
      pos.set([Math.sin(a) * r, y, -Math.cos(a) * r], i * 3); seed[i] = Math.random();
    }
    const pg = track(new THREE.BufferGeometry());
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pg.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const pmat = track(
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uTime: shared.uTime, uPR: { value: renderer.getPixelRatio() }, uColor: { value: col("#ffffff") }, uAlpha: { value: 0.75 } },
        vertexShader: `attribute float aSeed;uniform float uTime,uPR;varying float vS;void main(){vS=aSeed;vec3 p=position;p.y+=sin(uTime*.25+aSeed*6.28)*.15;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(1.5+aSeed*3.0)*uPR*(4.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `uniform float uTime,uAlpha;uniform vec3 uColor;varying float vS;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*(.35+.65*(.5+.5*sin(uTime*1.3+vS*40.)));gl_FragColor=vec4(uColor,a*uAlpha);}`,
      }),
    );
    const dust = new THREE.Points(pg, pmat);
    scene.add(dust);

    /* ---------- interaction ---------- */
    let rot = reduced ? 0 : 0.9, target = 0, velS = 0, prevRot = rot;
    let dragging = false, moved = 0, lastX = 0, dragV = 0, idle = 0, hoverIdx = -1;
    const mouse = { x: 0, y: 0, inside: false };
    const cur = { x: 0, y: 0, tx: 0, ty: 0 };
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const snap = () => { target = Math.round(target / STEP) * STEP; };

    function onWheel(e) {
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      target -= d * 0.0009; idle = 0;
    }
    function onDown(e) {
      dragging = true; moved = 0; lastX = e.clientX; dragV = 0;
      canvas.classList.add(s.grabbing); canvas.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      const rect = root.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.inside = true;
      cur.tx = e.clientX - rect.left; cur.ty = e.clientY - rect.top;
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      const k = (innerWidth < 720 ? 2.2 : 1.6) / innerWidth;
      target += dx * k; dragV = dx * k; idle = 0;
    }
    function onUp() {
      if (!dragging) return;
      dragging = false; canvas.classList.remove(s.grabbing);
      if (moved < 6 && hoverIdx >= 0) target = rot + wrap(-hoverIdx * STEP - rot); // click → bring card to centre
      else target += dragV * 6;
    }
    const onLeave = () => { mouse.inside = false; };
    function onKey(e) {
      if (e.key === "ArrowRight") target = Math.round(target / STEP) * STEP - STEP;
      else if (e.key === "ArrowLeft") target = Math.round(target / STEP) * STEP + STEP;
    }

    /* ---------- theme ---------- */
    let dark = false, themeT = 0;
    const tintL = col("#16151a"), tintD = col("#f3f1ee"), fogL = col("#ebe8f1"), fogD = col("#07070b");
    api.current.toggleTheme = () => {
      dark = !dark;
      root.classList.toggle(s.dark, dark);
      themeLabelRef.current.textContent = dark ? "Day" : "Night";
    };

    /* ---------- HUD ---------- */
    let shown = -1, hudRaf = 0;
    function hud(i) {
      if (i === shown) return;
      const dir = shown < 0 || (i - shown + N) % N < N / 2 ? 1 : -1;
      shown = i;
      elCount.textContent = `${pad(i + 1)} / ${pad(N)}`;
      elTitle.style.transition = "none"; elTitle.style.transform = `translateY(${dir * 100}%)`; elTitle.style.opacity = 0;
      elTitle.textContent = PROJECTS[i].name; elMeta.textContent = PROJECTS[i].meta;
      cancelAnimationFrame(hudRaf);
      hudRaf = requestAnimationFrame(() => { elTitle.style.transition = ""; elTitle.style.transform = "translateY(0)"; elTitle.style.opacity = 1; });
      bar.style.transform = `translateX(${i * 100}%)`;
    }

    function resize() {
      const w = root.clientWidth, h = root.clientHeight, asp = w / h;
      renderer.setSize(w, h, false);
      renderer.getDrawingBufferSize(shared.uRes.value);
      // camera sits behind the ring's centre → cards read smaller, whole set fits the hero
      const mob = asp < 1;
      camera.position.set(0, 0.08, R * (mob ? 0.8 : 0.78));
      const half = mob ? 0.36 : 0.6;
      camera.aspect = asp;
      camera.fov = (2 * Math.atan(Math.tan(half) / asp) * 180) / Math.PI;
      camera.fov = Math.max(40, Math.min(camera.fov, mob ? 84 : 58));
      camera.lookAt(0, 0.08, camera.position.z - 1);
      camera.updateProjectionMatrix();
    }

    /* ---------- loop ---------- */
    const clock = new THREE.Clock();
    let intro = reduced ? 1 : 0, last = 0;
    function frame() {
      const t = clock.getElapsedTime(), dt = Math.min(t - last, 0.05); last = t;
      intro = Math.min(1, intro + dt / 3.2);
      idle += dt; if (!dragging && idle > 0.35) snap();
      rot += (target - rot) * (reduced ? 1 : Math.min(1, dt * 3.2));
      const v = (rot - prevRot) / Math.max(dt, 1e-3); prevRot = rot;
      velS += (v - velS) * Math.min(1, dt * 8);
      shared.uRot.value = rot; shared.uTime.value = t;
      shared.uVel.value = reduced ? 0 : Math.max(-1.5, Math.min(1.5, velS * 0.42));

      // hover detection via angle (geometry is displaced in the shader, so no raycast)
      hoverIdx = -1;
      if (mouse.inside && Math.abs(shared.uVel.value) < 0.25) {
        const tv = Math.tan((camera.fov * Math.PI) / 360), th = tv * camera.aspect;
        const dx = mouse.x * th, dy = mouse.y * tv, dz = -1, oz = camera.position.z;
        // ray ∩ cylinder x²+z²=R² (far root, we're inside)
        const A = dx * dx + dz * dz, B = 2 * oz * dz, C = oz * oz - R * R, tt = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
        const px = dx * tt, pz = oz + dz * tt, py = camera.position.y + dy * tt;
        const ax = Math.atan2(px, -pz);
        for (let i = 0; i < N; i++) {
          if (Math.abs(wrap(ax - (i * STEP + rot))) < W / 2 / R && Math.abs(py - CARD_Y) < H / 2) { hoverIdx = i; break; }
        }
      }
      cards.forEach((c, i) => {
        c.hover += ((i === hoverIdx ? 1 : 0) - c.hover) * Math.min(1, dt * 8);
        const ii = Math.min(1, Math.max(0, (intro - i * 0.035) / 0.55)), e = 1 - Math.pow(1 - ii, 3);
        [c.card, c.refl, c.lab].forEach((m) => { m.material.uniforms.uHover.value = c.hover; m.material.uniforms.uIntro.value = e; });
      });
      canvas.classList.toggle(s.pointing, hoverIdx >= 0 && !dragging);
      curEl.textContent = hoverIdx >= 0 ? "View" : "Drag";
      curEl.classList.toggle(s.on, mouse.inside && (dragging || hoverIdx >= 0));
      cur.x += (cur.tx - cur.x) * 0.2; cur.y += (cur.ty - cur.y) * 0.2;
      curEl.style.left = `${cur.x}px`; curEl.style.top = `${cur.y}px`;

      themeT += ((dark ? 1 : 0) - themeT) * Math.min(1, dt * 3);
      shared.uTint.value.copy(tintL).lerp(tintD, themeT);
      shared.uFog.value.copy(fogL).lerp(fogD, themeT);
      pmat.uniforms.uAlpha.value = 0.55 + 0.4 * themeT;

      dust.rotation.y = -rot * 0.25 + t * 0.01;
      camera.rotation.z = -shared.uVel.value * 0.012;

      hud(((-Math.round(rot / STEP)) % N + N) % N);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    resize();
    addEventListener("resize", resize);
    root.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onUp);
    root.addEventListener("pointerleave", onLeave);
    addEventListener("keydown", onKey);

    Promise.race([Promise.all(FONT_LOADS.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]).then(() => {
      if (disposed) return;
      build();
      loaderRef.current?.classList.add(s.done);
      clock.start();
      frame();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(hudRaf);
      removeEventListener("resize", resize);
      root.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onUp);
      root.removeEventListener("pointerleave", onLeave);
      removeEventListener("keydown", onKey);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <main ref={rootRef} className={[s.root, fontVars, className].filter(Boolean).join(" ")}>
      <div className={s.sky} aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className={s.night} aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className={s.gl}
        aria-label="Selected cases on a curved ring. Drag, scroll or use the arrow keys to turn it."
        role="img"
      />
      <div className={s.grain} aria-hidden="true" />

      <header className={s.header}>
        <Link href="/" className={s.brand}>
          <b>Shivam</b> <span>— Selected Cases</span>
        </Link>
        <nav className={s.nav}>
          <Link href="/#work">Index</Link>
          <Link href="/#about">About</Link>
          <Link href="/#contact">Contact</Link>
          <button type="button" className={s.theme} onClick={() => api.current.toggleTheme()}>
            <span className={s.dot} />
            <span ref={themeLabelRef}>Night</span>
          </button>
        </nav>
      </header>

      <footer className={s.footer}>
        <div className={s.now} aria-live="polite">
          <span className={s.count} ref={countRef}>01 / {pad(N)}</span>
          <div className={s.title}><span ref={titleRef}>{PROJECTS[0].name}</span></div>
          <span className={s.meta} ref={metaRef}>{PROJECTS[0].meta}</span>
        </div>
        <div className={s.progress} aria-hidden="true"><i ref={barRef} /></div>
        <div className={s.hint}>
          <span>Scroll or drag</span>
          <span className={s.k}><kbd>←</kbd> <kbd>→</kbd></span>
        </div>
      </footer>

      <div className={s.cursor} ref={cursorRef} aria-hidden="true">Drag</div>
      <div className={s.loader} ref={loaderRef}>loading cases…</div>
    </main>
  );
}
