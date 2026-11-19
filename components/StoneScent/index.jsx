"use client";

import { useEffect, useRef, useState } from "react";
import m from "./StoneScent.module.css"; // scroll-driven motion + effects only
import { BRAND, CALLOUTS, COMPOSITION, DETAILS, HERO, NAV, NOTES, SCENT, SECTIONS, SHOP, STATS } from "./data";
import { LABELS, TOTAL, countUp, domVars, sceneState, sectionAt } from "./timeline";

// Start downloading the Three.js chunk as soon as this module runs in the browser,
// instead of waiting for hydration + the effect below.
const sceneModule = typeof window !== "undefined" ? import("./scene") : null;

const SMOOTH = 6; // scroll easing rate per second (lower = more glide); frame-rate independent
const HERO_INTRO = 1.7; // seconds: 1.1 + 17 letters * 0.035 stagger

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const cx = (...c) => c.filter(Boolean).join(" ");
const count = (lines) => lines.join("").length;
const CHARS = { hero: count(HERO.lines), s2: count(SCENT.lines), s3: count(DETAILS.lines), s4: count(COMPOSITION.lines) };

/* Shared Tailwind recipes */
const PAD_L = "left-5 md:left-10";
const HEAD = "font-medium leading-[0.88] tracking-[-0.045em]";
const SECTION_HEAD = `${HEAD} text-[clamp(44px,5.6vw,96px)]`;
const SERIF = "font-stone-serif font-normal italic tracking-[-0.02em]";
const BODY = "text-[13px] leading-[1.55] text-[#cfcdc8]";
const MUTED = "text-[#8a8884]";
const KICKER = `mb-[18px] flex items-center gap-2.5 text-[11px] uppercase tracking-[.18em] ${MUTED} before:h-px before:w-[18px] before:bg-[#ff5a1f] before:content-['']`;
// solid tints, not backdrop-filter: a blur over a live WebGL canvas re-renders every frame
const LINE_PILL = "rounded-full border border-white/15 bg-[#0d0d0d]/75";
const CTA =
  "pointer-events-auto inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-[#ff5a1f] px-5 py-3 text-[13px] font-semibold text-[#120600] shadow-[0_10px_40px_-10px_rgba(255,90,31,.6)] transition-transform hover:-translate-y-0.5 [&_svg]:transition-transform hover:[&_svg]:translate-x-[3px]";

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M2 7h10M8 3l4 4-4 4" />
  </svg>
);

/** A two-line headline split into letters. Each letter gets --i; the CSS module staggers them. */
function Split({ lines, indent = false }) {
  const offsets = lines.map((_, k) => count(lines.slice(0, k)));
  return lines.map((line, li) => (
    <span key={li} aria-hidden="true" className={cx("block whitespace-nowrap", li === 1 && SERIF, li === 1 && indent && "pl-[1.1em]")}>
      {[...line].map((ch, ci) => (
        <span key={ci} className={m.ch} style={{ "--i": offsets[li] + ci }}>
          {ch}
        </span>
      ))}
    </span>
  ));
}

export default function StoneScent({ className = "" }) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const canvasRef = useRef(null);
  const calloutRefs = useRef([]);
  const numRefs = useRef([]);
  const [section, setSection] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [bag, setBag] = useState(0);
  const [added, setAdded] = useState(false);

  // One rAF loop: smoothed scroll → timeline → CSS variables + Three.js scene.
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const pos = { x: 0, y: 0 };
    const written = {};
    let scene = null;
    let cancelled = false;
    let lastSec = -1;

    const setVar = (k, v) => {
      const s = v.toFixed(3);
      if (written[k] !== s) {
        written[k] = s;
        root.style.setProperty(k, s);
      }
    };
    // track metrics are cached, so the frame loop never forces a layout read
    const metrics = { top: 0, dist: 1 };
    const measure = () => {
      metrics.top = track.getBoundingClientRect().top + window.scrollY;
      metrics.dist = Math.max(1, track.offsetHeight - window.innerHeight);
    };
    measure();
    const target = () => clamp((window.scrollY - metrics.top) / metrics.dist);

    let cur = target();
    let last = performance.now();
    const start = last;
    let raf = 0;

    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      cur += (target() - cur) * (1 - Math.exp(-SMOOTH * dt));
      const t = cur * TOTAL;
      const time = (now - start) / 1000;

      setVar("--hin", reduce ? 1 : clamp((time - 0.2) / HERO_INTRO));
      const vars = domVars(t, CHARS);
      for (const k in vars) setVar(k, vars[k]);

      const c = countUp(t);
      numRefs.current.forEach((el, i) => {
        if (!el) return;
        const txt = (STATS[i].to * c).toFixed(STATS[i].dec || 0);
        if (el.textContent !== txt) el.textContent = txt;
      });

      root.toggleAttribute("data-hero", t < 2.4);
      root.toggleAttribute("data-shop", t > 19.4);
      const sec = sectionAt(t);
      if (sec !== lastSec) {
        lastSec = sec;
        setSection(sec);
      }

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      if (scene) {
        const S = sceneState(t);
        scene.update(S, time, pointer, dt);
        // callouts track their 3D anchors on the flacon
        if (S.detail > 0.01 && S.down < 0.99) {
          calloutRefs.current.forEach((el, i) => {
            if (!el) return;
            scene.project(i, pos);
            el.style.transform =
              CALLOUTS[i].side === "left"
                ? `translate(${pos.x + 4.5}px,${pos.y}px) translate(-100%,-50%)`
                : `translate(${pos.x - 4.5}px,${pos.y}px) translateY(-50%)`;
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      measure();
      scene?.resize(window.innerWidth, window.innerHeight);
    };
    const onMove = (e) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });

    // Three.js only ships to the browser, after first paint.
    (sceneModule ?? import("./scene")).then(({ createStoneScene }) => {
      if (cancelled) return;
      const fontFamily = getComputedStyle(root).getPropertyValue("--font-stone-sans").trim() || '"Inter Tight"';
      scene = createStoneScene(canvasRef.current, {
        brand: BRAND,
        fontFamily,
        anchors: CALLOUTS.map((c) => c.anchor),
        onReady: () => root.setAttribute("data-ready", ""), // fades the canvas in on its first frame
      });
      scene.resize(window.innerWidth, window.innerHeight);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      scene?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(id);
  }, [added]);

  const goTo = (label) => {
    const track = trackRef.current;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const dist = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (dist * LABELS[label]) / TOTAL, behavior: "smooth" });
  };

  const size = SHOP.sizes[sizeIdx];
  const activeNav = [0, 1, 2, 2, 3][section];

  return (
    <div ref={rootRef} className={cx(m.vars, m.root, "relative w-full bg-[#050505] font-stone text-[#eceae6] antialiased", className)}>
      <div aria-hidden="true" className={cx(m.backdrop, "fixed inset-0 z-0")} />
      <canvas ref={canvasRef} aria-hidden="true" className={cx(m.canvas, "fixed inset-0 z-[1] block h-screen w-screen")} />
      <div aria-hidden="true" className={cx(m.vignette, "pointer-events-none fixed inset-0 z-[2]")} />
      <div aria-hidden="true" className={cx(m.grain, "pointer-events-none fixed z-[3]")} />

      <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
        {/* header */}
        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-[22px] md:px-10">
          <button type="button" onClick={() => goTo("start")} aria-label={`${BRAND} — back to top`} className="pointer-events-auto cursor-pointer">
            <svg width="26" height="28" viewBox="0 0 26 28" aria-hidden="true">
              <path d="M13 1 25 7.5v13L13 27 1 20.5v-13Z" fill="#ff5a1f" />
              <path d="M13 7.5 19 11v6l-6 3.5L7 17v-6Z" fill="none" stroke="#120600" strokeWidth="1.6" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <nav aria-label="Story sections" className={cx(LINE_PILL, "pointer-events-auto hidden gap-0.5 p-1 md:flex")}>
              {NAV.map((n, i) => (
                <button
                  key={n.to}
                  type="button"
                  onClick={() => goTo(n.to)}
                  aria-current={i === activeNav ? "step" : undefined}
                  className={cx(
                    "cursor-pointer rounded-full px-3.5 py-[7px] text-xs transition-colors duration-300",
                    i === activeNav ? "bg-[#eceae6] text-[#0a0a0a]" : "opacity-75 hover:opacity-100",
                  )}
                >
                  {n.label}
                </button>
              ))}
            </nav>
            <button type="button" onClick={() => goTo("shop")} className={cx(LINE_PILL, "pointer-events-auto cursor-pointer px-[18px] py-[11px] text-xs font-medium")}>
              Bag <span className="ml-1 text-[#ff5a1f]">{bag}</span>
            </button>
          </div>
        </header>

        {/* 01 — hero */}
        <p className={cx(m.heroMeta, BODY, PAD_L, "absolute top-24 max-w-[200px] md:max-w-[240px]")}>{HERO.eyebrow}</p>
        <h1
          aria-label={HERO.lines.join(" ")}
          className={cx(m.hero, HEAD, PAD_L, "absolute bottom-[max(110px,9vh)] text-[clamp(58px,9.4vw,168px)] md:bottom-[max(40px,7vh)]")}
          style={{ "--n": CHARS.hero }}
        >
          <Split lines={HERO.lines} indent />
        </h1>
        <div className={cx(m.heroMeta, "absolute left-5 top-[150px] max-w-[260px] md:left-auto md:right-10 md:top-auto md:bottom-[max(60px,11vh)]")}>
          <p className={cx(BODY, "mb-4 hidden md:block")}>{HERO.side}</p>
          <button type="button" onClick={() => goTo("shop")} className={cx(CTA, m.heroCta)}>
            {HERO.cta} <Arrow />
          </button>
        </div>
        <div className={cx(m.hint, MUTED, "absolute bottom-[92px] left-[62%] hidden -translate-x-1/2 flex-col items-center gap-2.5 text-[11px] uppercase tracking-[.18em] md:flex")}>
          Scroll to break the stone
          <i className={cx(m.hintLine, "block h-[34px] w-px bg-gradient-to-b from-[#eceae6] to-transparent")} />
        </div>

        {/* 02 — scent + notes */}
        <section aria-label="The scent" className={cx(m.out2, "absolute inset-0")}>
          <div className={cx(PAD_L, "absolute top-24 md:top-[22vh]")}>
            <h2 aria-label={SCENT.lines.join(" ")} className={cx(m.head, m.h2, HEAD, "text-[clamp(46px,6.2vw,110px)]")} style={{ "--n": CHARS.s2 }}>
              <Split lines={SCENT.lines} />
            </h2>
            <p className={cx(m.s2m, BODY, "mt-[22px] max-w-[300px]")}>{SCENT.body}</p>
          </div>
          <ul className="absolute inset-x-3 bottom-[84px] flex gap-2 md:inset-x-auto md:left-10 md:bottom-[max(90px,9vh)] md:gap-3">
            {NOTES.map((n, i) => (
              <li key={n.tier} className={cx(m.note, m.glass, "flex-1 rounded-[14px] border border-white/15 p-3 md:w-[clamp(150px,13vw,200px)] md:flex-none md:px-4 md:pb-4 md:pt-3.5")} style={{ "--i": i }}>
                <b className={cx(MUTED, "mb-3 block text-[11px] font-medium uppercase tracking-[.12em] md:mb-[26px]")}>
                  <span className="text-[#ff5a1f]">0{i + 1}</span> / {n.tier}
                </b>
                <p className="text-[11px] leading-[1.55] md:text-[13px]">
                  {n.items.map((it) => (
                    <span key={it} className="block">
                      {it}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
          <p className={cx(m.edp, MUTED, "absolute bottom-[max(90px,9vh)] right-10 hidden text-xs tracking-[.04em] md:block")}>{SCENT.edp}</p>
        </section>

        {/* 03 — details: callouts pinned to the flacon */}
        <section aria-label="Details" className={cx(m.out3, "absolute inset-0")}>
          <div className={cx(PAD_L, "absolute top-[88px] max-w-[420px] md:top-[15vh]")}>
            <p className={cx(m.k3, KICKER)}>{DETAILS.kicker}</p>
            <h2 aria-label={DETAILS.lines.join(" ")} className={cx(m.head, m.h3, SECTION_HEAD)} style={{ "--n": CHARS.s3 }}>
              <Split lines={DETAILS.lines} />
            </h2>
            <p className={cx(m.s3m, BODY, "mt-5 max-w-[320px]")}>{DETAILS.body}</p>
          </div>
          <ul>
            {CALLOUTS.map((c, i) => {
              const left = c.side === "left";
              return (
                <li
                  key={c.id}
                  ref={(el) => {
                    calloutRefs.current[i] = el;
                  }}
                  className={cx(m.callout, left && m.left, "absolute left-0 top-0 flex items-center", left && "flex-row-reverse")}
                  style={{ "--i": i }}
                >
                  <i className={cx(m.dot, "block size-[9px] flex-none rounded-full bg-[#ff5a1f]")} />
                  <span className={cx(m.line, "block h-px w-3.5 flex-none md:w-[clamp(36px,6vw,96px)]")} />
                  <div className={cx("w-[92px] text-[11px] leading-[1.35] md:w-[clamp(150px,15vw,220px)] md:text-[13px]", left ? "pr-2 text-right md:pr-3" : "pl-2 md:pl-3")}>
                    <b className="mb-[3px] block font-medium">
                      <span className="mr-1.5 text-[11px] text-[#ff5a1f]">0{i + 1}</span>
                      {c.title}
                    </b>
                    <small className={cx(MUTED, "hidden text-xs md:block")}>{c.text}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 04 — composition: the flacon sinks, stats count up above it */}
        <section
          aria-label="Composition"
          className={cx(m.out4, "absolute inset-x-5 top-[84px] grid items-start gap-[22px] md:left-10 md:right-[clamp(20px,7vw,110px)] md:top-[13vh] md:grid-cols-[1fr_1.15fr] md:gap-[clamp(24px,5vw,90px)]")}
        >
          <div>
            <p className={cx(m.k4, KICKER)}>{COMPOSITION.kicker}</p>
            <h2 aria-label={COMPOSITION.lines.join(" ")} className={cx(m.head, m.h4, SECTION_HEAD)} style={{ "--n": CHARS.s4 }}>
              <Split lines={COMPOSITION.lines} />
            </h2>
            <div className={cx(m.s4m, "hidden md:block")}>
              <p className={cx(BODY, "mt-5 max-w-[320px]")}>{COMPOSITION.body}</p>
              <ul className="mt-[26px] flex flex-wrap gap-2.5">
                {COMPOSITION.wear.map((w, i) => (
                  <li key={w} className={cx(m.glass, "rounded-full border border-white/15 px-3 py-2 text-xs text-[#cfcdc8]")}>
                    <b className="mr-1.5 font-medium text-[#ff5a1f]">0{i + 1}</b>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:gap-x-8 md:gap-y-7">
            {STATS.map((s, i) => (
              <div key={s.label} className={cx(m.stat, "border-t border-white/15 pt-3.5")} style={{ "--i": i }}>
                <p className="text-[clamp(40px,4.6vw,76px)] font-medium leading-none tracking-[-0.04em]">
                  {s.prefix}
                  <span
                    ref={(el) => {
                      numRefs.current[i] = el;
                    }}
                  >
                    0
                  </span>
                  <em className={cx(SERIF, "ml-1 text-[.55em] tracking-normal text-[#cfcdc8]")}>{s.unit}</em>
                </p>
                <p className={cx(MUTED, "mt-2 text-xs tracking-[.02em]")}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 05 — shop */}
        <section
          aria-label="Shop"
          className={cx(m.shopPanel, "absolute inset-x-5 bottom-[84px] max-w-[400px] md:inset-x-auto md:left-10 md:bottom-auto md:top-1/2 md:-translate-y-1/2")}
        >
          <p className={cx(m.shopItem, KICKER)} style={{ "--i": 0 }}>
            {SHOP.kicker}
          </p>
          <h2 className={cx(m.shopItem, SECTION_HEAD)} style={{ "--i": 1 }}>
            <span className="block">{SHOP.lines[0]}</span>
            <span className={cx("block", SERIF)}>{SHOP.lines[1]}</span>
          </h2>
          <p className={cx(m.shopItem, "my-3 flex items-baseline gap-3 md:mb-[18px] md:mt-[22px]")} style={{ "--i": 2 }}>
            <strong className="text-[40px] font-medium tracking-[-0.03em]">${size.price}</strong>
            <span className={cx(MUTED, "text-xs")}>{size.ml} ml</span>
          </p>
          <div role="radiogroup" aria-label="Size" className={cx(m.shopItem, "mb-4 flex gap-2")} style={{ "--i": 3 }}>
            {SHOP.sizes.map((s, i) => (
              <button
                key={s.ml}
                type="button"
                role="radio"
                aria-checked={i === sizeIdx}
                onClick={() => setSizeIdx(i)}
                className={cx(
                  "pointer-events-auto cursor-pointer rounded-xl border px-[18px] py-3 text-left text-[13px] font-medium transition-colors duration-200",
                  i === sizeIdx ? "border-[#eceae6] bg-white/[.06]" : "border-white/15 hover:border-white/40",
                )}
              >
                {s.ml} ml
                <small className={cx(MUTED, "mt-0.5 block text-[11px]")}>${s.price}</small>
              </button>
            ))}
          </div>
          <div className={cx(m.shopItem, "flex items-center gap-2.5")} style={{ "--i": 4 }}>
            <button
              type="button"
              onClick={() => {
                setBag((b) => b + 1);
                setAdded(true);
              }}
              className={CTA}
            >
              {added ? "Added to bag ✓" : (
                <>
                  Add to bag <Arrow />
                </>
              )}
            </button>
            <button type="button" className="pointer-events-auto cursor-pointer rounded-full border border-white/15 px-[18px] py-3 text-[13px] font-medium hover:border-white/40">
              Try a sample
            </button>
          </div>
          <ul className={cx(m.shopItem, MUTED, "mt-[22px] hidden gap-2 text-xs md:grid")} style={{ "--i": 5 }}>
            {SHOP.perks.map((p) => (
              <li key={p} className="before:mr-2 before:text-[#ff5a1f] before:content-['—']">
                {p}
              </li>
            ))}
          </ul>
        </section>
        <footer className={cx(m.foot, MUTED, "absolute inset-x-10 bottom-[18px] hidden justify-between text-[11px] tracking-[.04em] md:flex")}>
          <span>© 2026 Basalt Parfums</span>
          <span>Instagram · Journal · Stockists</span>
        </footer>

        {/* progress rail */}
        <div aria-hidden="true" className={cx(MUTED, "absolute right-10 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 text-[10px] uppercase tracking-[.16em] md:flex")}>
          <span>{SECTIONS[section]}</span>
          <div className="relative h-[120px] w-px bg-white/15">
            <i className={cx(m.rail, "absolute inset-0 bg-[#eceae6]")} />
          </div>
        </div>
      </div>

      {/* the scroll track that drives the whole story */}
      <div ref={trackRef} className="relative h-[1500vh]" />
    </div>
  );
}
