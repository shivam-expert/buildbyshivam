"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./BagSwap.module.css";
import { createLightning } from "./lightning";
import { INITIAL_PRODUCT, MODEL_H, MODEL_W, PRODUCTS, src } from "./products";

const P = PRODUCTS.length;
const N = P * 2; // the ribbon shows the range twice
const NAV = ["New in", "Totes", "Top handle", "Shoulder", "Crossbody", "Clutches"];

// Loader timeline (seconds)
const COUNT_END = 3.0;
const UNROLL = 3.35;
const UNROLL_DUR = 1.35;
const ANG = Math.atan2(0.32, 1); // ribbon slope

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const outExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const pct = (v, of) => `${(v / of) * 100}%`;
const pad = (n) => String(n).padStart(2, "0");

/** Box the bag occupies, in model pixels. */
function boxFor(p) {
  const h = p.w / p.ratio;
  return { x: p.at[0] - p.grip[0] * p.w, y: p.at[1] - p.grip[1] * h, w: p.w, h };
}

export default function BagSwap({ className = "" }) {
  const rootRef = useRef(null);
  const brandRef = useRef(null);
  const numRef = useRef(null);
  const cardRefs = useRef([]);
  const modelRef = useRef(null);
  const bagLayerRef = useRef(null);
  const handLRef = useRef(null);
  const handRRef = useRef(null);
  const flashRef = useRef(null);
  const zapRef = useRef(null);
  const wearingRef = useRef(null);
  const bagCountRef = useRef(null);
  const selectRef = useRef(null);
  const stepRef = useRef(null);

  const [phase, setPhase] = useState("loading"); // loading → done → ready
  const [shown, setShown] = useState(INITIAL_PRODUCT);
  const [rolling, setRolling] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const brand = brandRef.current;
    const num = numRef.current;
    const cards = cardRefs.current;
    const modelEl = modelRef.current;
    const bagLayer = bagLayerRef.current;
    const handL = handLRef.current;
    const handR = handRRef.current;
    const flash = flashRef.current;
    const zap = zapRef.current;
    const zx = zap.getContext("2d");
    const lightning = createLightning(zx);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    /* ---------- layout ---------- */
    let W, H, cw, R, gap, L;
    function layout() {
      W = innerWidth;
      H = innerHeight;
      cw = Math.max(54, Math.min(100, W * 0.064));
      root.style.setProperty("--cw", `${cw}px`);
      R = Math.min(W * 0.25, 340, H * 0.62);
      gap = Math.max(cw * 1.3, (W * 1.35) / N / Math.cos(ANG));
      L = gap * N;
      const fs = parseFloat(getComputedStyle(brand).fontSize);
      root.style.setProperty("--brandScale", (Math.min(30, Math.max(22, W * 0.02)) / fs).toFixed(3));
      const dpr = Math.min(2, devicePixelRatio || 1);
      zap.width = W * dpr;
      zap.height = H * dpr;
      zap.style.width = `${W}px`;
      zap.style.height = `${H}px`;
      zx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener("resize", layout);
    layout();

    /* ---------- loader ring → ribbon ---------- */
    function ringPos(i, t) {
      const e = outExpo(clamp((t - i * 0.06) / 1.0));
      const th = (i / N) * Math.PI * 2 + t * 0.55 - 1.2 - (1 - e) * 1.4;
      const r = R * (0.3 + 0.7 * e);
      const z = Math.sin(th);
      const d = (z + 1) / 2;
      return { x: W * 0.5 + Math.cos(th) * r, y: H * 0.53 + z * r * 0.4, s: 0.6 + d * 0.45, o: e * (0.28 + 0.72 * d), z: Math.round(d * 100) };
    }
    let drift = 0;
    let lastT = 0;
    function ribbonPos(i) {
      const u = (((i * gap + drift) % L) + L) % L;
      return {
        x: -cw * 1.6 + u * Math.cos(ANG),
        y: H * 0.34 + u * Math.sin(ANG) + Math.sin((u / L) * Math.PI * 2) * cw * 0.25,
        s: 1.12,
        o: 1,
        z: 200 + Math.round((u / L) * 100),
      };
    }

    const t0 = performance.now() - (reduce ? 6000 : 0);
    let finished = false;
    let isReady = false;
    let raf = 0;
    function frame(now) {
      const t = (now - t0) / 1000;
      const dt = Math.min(0.05, t - lastT);
      lastT = t;
      if (t > UNROLL && !reduce) drift += dt * cw * 0.38;
      const p = clamp(t / COUNT_END);
      num.textContent = clamp(Math.floor(100 * (1 - Math.pow(1 - p, 2.4)) - Math.sin(p * Math.PI * 3) * 2 * (1 - p)), 0, 100);
      if (t >= UNROLL && !finished) {
        finished = true;
        setPhase("done");
        later(() => {
          isReady = true;
          setPhase("ready");
        }, 1600);
      }
      for (let i = 0; i < N; i++) {
        const a = ringPos(i, t);
        const k = inOutCubic(clamp((t - UNROLL - (i / N) * 0.5) / UNROLL_DUR));
        let { x, y, s, o, z } = a;
        if (k > 0) {
          const b = ribbonPos(i);
          x = lerp(a.x, b.x, k);
          y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * cw * 0.9;
          s = lerp(a.s, b.s, k);
          o = lerp(a.o, b.o, k);
          z = k > 0.5 ? b.z : a.z;
        }
        const c = cards[i];
        c.style.transform = `translate3d(${x - cw / 2}px,${y - cw * 0.62}px,0) scale(${s})`;
        c.style.opacity = o.toFixed(3);
        c.style.zIndex = z;
      }
      lightning.draw(now, W, H);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    /* ---------- putting a bag on the model ---------- */
    // hand overlays are crops of the model photo at x 0–90 / 386–476, y 880–1060
    Object.assign(handL.style, { left: "0%", top: pct(880, MODEL_H), width: pct(90, MODEL_W) });
    Object.assign(handR.style, { left: pct(386, MODEL_W), top: pct(880, MODEL_H), width: pct(90, MODEL_W) });

    let current = -1;
    let worn = null;
    let busy = false;

    function wornImg(i) {
      const p = PRODUCTS[i];
      const b = boxFor(p);
      const img = new Image();
      img.src = src(p.img);
      img.alt = p.name;
      img.className = `${styles.worn} ${styles.pre}`;
      Object.assign(img.style, {
        left: pct(b.x, MODEL_W),
        top: pct(b.y, MODEL_H),
        width: pct(b.w, MODEL_W),
        transformOrigin: `${p.grip[0] * 100}% ${p.grip[1] * 100}%`,
      });
      return img;
    }
    function bagCentre(i) {
      const b = boxFor(PRODUCTS[i]);
      const r = modelEl.getBoundingClientRect();
      const k = r.width / MODEL_W;
      return [r.left + (b.x + b.w / 2) * k, r.top + (b.y + b.h * 0.55) * k];
    }
    function setHands(i) {
      const h = PRODUCTS[i].hand;
      handL.classList.toggle(styles.on, h === "L");
      handR.classList.toggle(styles.on, h === "R");
    }
    function updatePanel(i) {
      setRolling(true);
      later(() => {
        setShown(i);
        setRolling(false);
      }, 260);
    }

    function select(i, fromEl) {
      if (!isReady || i === current || busy) return;
      busy = true;
      const target = bagCentre(i);
      const r = (fromEl ?? wearingRef.current).getBoundingClientRect();
      const from = [r.left + r.width / 2, r.top + r.height * (fromEl ? 0.5 : 0.45)];

      // 1. electric arc from the card to where the bag will sit
      if (!reduce) lightning.bolt(from, target, 420);
      // 2. old bag dissolves, hands let go
      if (worn) {
        const old = worn;
        old.classList.remove(styles.swing);
        old.classList.add(styles.out);
        later(() => old.remove(), 500);
      }
      handL.classList.remove(styles.on);
      handR.classList.remove(styles.on);
      // 3. new bag materialises with a flash, then settles with a swing
      const img = wornImg(i);
      bagLayer.appendChild(img);
      worn = img;
      later(() => {
        img.getBoundingClientRect();
        img.classList.remove(styles.pre);
        img.classList.add(styles.swing);
        setHands(i);
        const b = boxFor(PRODUCTS[i]);
        const s = Math.max(b.w, b.h) * 1.1;
        Object.assign(flash.style, {
          left: pct(b.x + b.w / 2 - s / 2, MODEL_W),
          top: pct(b.y + b.h * 0.55 - s / 2, MODEL_H),
          width: pct(s, MODEL_W),
          aspectRatio: "1",
        });
        flash.animate(
          [
            { opacity: 0, transform: "scale(.4)" },
            { opacity: 1, transform: "scale(1)", offset: 0.25 },
            { opacity: 0, transform: "scale(1.6)" },
          ],
          { duration: 700, easing: "cubic-bezier(.16,1,.3,1)" },
        );
        if (!reduce) {
          lightning.bolt(target, [target[0] + (Math.random() - 0.5) * 60, target[1] - 120 - Math.random() * 60], 260, 0.7);
        }
      }, reduce ? 0 : 240);
      current = i;
      updatePanel(i);
      later(() => (busy = false), reduce ? 50 : 520);
    }

    /** The copy of product i nearest the middle of the screen. */
    function cardFor(i) {
      let best = null;
      let bd = Infinity;
      cards.forEach((c, j) => {
        if (j % P !== i) return;
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - W / 2);
        if (d < bd) {
          bd = d;
          best = c;
        }
      });
      return best;
    }

    selectRef.current = select;
    stepRef.current = (dir, fromCard) => {
      const i = (current + dir + P) % P;
      select(i, fromCard ? cardFor(i) : null);
    };

    function onKey(e) {
      if (e.key === "ArrowRight") stepRef.current(1, true);
      if (e.key === "ArrowLeft") stepRef.current(-1, true);
    }
    addEventListener("keydown", onKey);

    // first look, applied quietly as the model fades in
    const first = wornImg(INITIAL_PRODUCT);
    first.classList.remove(styles.pre);
    bagLayer.appendChild(first);
    worn = first;
    current = INITIAL_PRODUCT;
    setHands(INITIAL_PRODUCT);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      removeEventListener("resize", layout);
      removeEventListener("keydown", onKey);
      bagLayer.replaceChildren();
      selectRef.current = null;
      stepRef.current = null;
    };
  }, []);

  function addToBag() {
    setCount((c) => c + 1);
    const b = bagCountRef.current;
    b.classList.remove(styles.bump);
    void b.offsetWidth;
    b.classList.add(styles.bump);
  }

  const p = PRODUCTS[shown];
  const rootClass = [styles.root, phase !== "loading" && styles.done, phase === "ready" && styles.ready, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={rootClass}>
      <div ref={brandRef} className={styles.brand}>
        Shivam.
      </div>

      <nav className={styles.nav}>
        {NAV.map((label, i) => (
          <a key={label} href="#" className={i === 0 ? styles.on : undefined}>
            {label}
          </a>
        ))}
        <span className={styles.bag}>
          Bag <b ref={bagCountRef}>{count}</b>
        </span>
      </nav>

      <h1 className={styles.headline}>
        <span className={styles.line}>
          <i>Carried well.</i>
        </span>
        <span className={styles.line}>
          <i>Every day.</i>
        </span>
      </h1>

      <div className={styles.stage}>
        {Array.from({ length: N }, (_, i) => {
          const item = PRODUCTS[i % P];
          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`${styles.card} ${i % P === shown ? styles.active : ""}`}
              onClick={(e) => selectRef.current?.(i % P, e.currentTarget)}
            >
              <div className={styles.cardInner}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(item.img)} alt={item.name} />
                <span>{item.cat}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={modelRef} className={styles.model}>
        <div className={styles.shadow} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src("model")} alt="Model" className={styles.modelImg} />
        <div ref={bagLayerRef} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={handLRef} className={styles.hand} src={src("hand-l")} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={handRRef} className={styles.hand} src={src("hand-r")} alt="" />
        <div ref={flashRef} className={styles.flash} />
      </div>

      <canvas ref={zapRef} className={styles.zap} />

      <div className={`${styles.info} ${rolling ? styles.rolling : ""}`}>
        <div className={`${styles.meta} ${styles.roll}`}>
          <span>
            {pad(shown + 1)} / {pad(P)}
          </span>
          <span className={styles.cat}>{p.cat}</span>
        </div>
        <h2 className={styles.roll}>{p.name}</h2>
        <p className={styles.roll}>{p.desc}</p>
        <div className={`${styles.price} ${styles.roll}`}>
          <b>₹{p.price}</b>
          <span>{p.colour}</span>
        </div>
        <div className={styles.ctas}>
          <button type="button" className={styles.add} onClick={addToBag}>
            Add to bag
          </button>
          <button type="button" onClick={() => stepRef.current?.(1, false)}>
            Next →
          </button>
        </div>
      </div>

      <div ref={wearingRef} className={styles.wearing}>
        <small>Now wearing</small>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(p.img)} alt="" />
        <div className={styles.wearingRow}>
          <em>{p.name}</em>
          <span>₹{p.price}</span>
        </div>
      </div>
      <div className={styles.hint}>Tap any bag, or use ← → to restyle the same look.</div>

      <div className={styles.counter}>
        <small>Curating the edit</small>
        <div className={styles.counterRow}>
          <span ref={numRef} className={styles.num}>
            0
          </span>
          <span className={styles.pct}>%</span>
        </div>
      </div>
    </div>
  );
}
