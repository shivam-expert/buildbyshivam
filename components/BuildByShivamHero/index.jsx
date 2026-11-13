"use client";

import { useEffect, useRef } from "react";
import styles from "./BuildByShivamHero.module.css";
import { createSilkRenderer } from "./silkRenderer";
import { findStrokeCentre } from "./findStrokeCentre";
import { clamp, easeInOutCubic as ease, easeOutCubic, lerp, range } from "./math";

const WORD = "PORTFOLIO";
const DIVE_GLYPH = "P";
const TITLE_LEAD = "buildby";
const TITLE_ACCENT = "shivam";

const SCRAMBLE_CHARS = "01<>/{}[]#$%&*+=_;:ABCDEFabcdef";
const SCRAMBLE_MS = 900;
const SCROLL_SMOOTHING = 0.09;
const MASK_DOT_COLOR = "rgba(237,230,218,.06)";
const MASK_DOT_SPACING = 22;
const FALLBACK_BACKGROUND = "radial-gradient(circle at 35% 35%, #2A2622, #050506 70%)";

/** Scroll timeline. Each window is [start, end] of overall scroll progress (0..1). */
const TIMELINE = {
  preZoom: [0, 0.12], // slight push-in before the dive
  chromeFade: [0.03, 0.12], // top/bottom bars fade out
  glide: [0.02, 0.3], // the S slides to the centre of the screen
  dive: [0.1, 0.66], // zoom through the S
  settle: [0.35, 0.8], // (within the dive) drift from the S centre onto solid ink
  maskFade: [0.64, 0.7], // black sheet fades away
  scrim: [0.68, 0.84], // bottom gradient for text legibility
  heroLive: 0.74, // final section appears
};

const randomChars = (n) =>
  Array.from({ length: n }, () => SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0]).join("");

export default function BuildByShivamHero({
  primaryHref = "https://instagram.com/buildbyshivam",
  secondaryHref = "#work",
}) {
  const scrollerRef = useRef(null);
  const stageRef = useRef(null);
  const artRef = useRef(null);
  const maskRef = useRef(null);
  const scrimRef = useRef(null);
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const heroRef = useRef(null);
  const titleLeadRef = useRef(null);
  const titleAccentRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const stage = stageRef.current;
    const art = artRef.current;
    const mask = maskRef.current;
    const scrim = scrimRef.current;
    const topBar = topRef.current;
    const bottomBar = bottomRef.current;
    const hero = heroRef.current;
    const titleLead = titleLeadRef.current;
    const titleAccent = titleAccentRef.current;

    const maskCtx = mask.getContext("2d");
    if (!maskCtx) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // next/font registers the family under its own name, so read it back from CSS.
    const fontFamily = getComputedStyle(stage).fontFamily;
    const glyphFont = (px) => `900 ultra-expanded ${px}px ${fontFamily}`;
    const applyGlyphFont = (ctx, px) => {
      ctx.font = glyphFont(px);
      if ("fontStretch" in ctx) ctx.fontStretch = "ultra-expanded";
    };

    const silk = createSilkRenderer(art);
    if (!silk) art.style.background = FALLBACK_BACKGROUND;

    /* ---------- state ---------- */
    const view = { w: 0, h: 0, dpr: 0, top: 0 };
    const geo = { fontSize: 100, textX: 0, baseline: 0, centreX: 0, centreY: 0, diveX: 0, diveY: 0, maxScale: 60 };
    const pointer = { x: 0.62, y: 0.55, targetX: 0.62, targetY: 0.55, velocity: 0, seen: false };
    let glyph; // stroke-centre analysis, computed once (independent of viewport size)
    let maskFill = "#0A0A0B";
    let dotPattern = null;
    let lastMaskKey = "";
    let maskHidden = false;

    let target = 0;
    let progress = 0;
    let hover = 0;
    let live = false;
    let scrambleRun = 0;

    let rafId = 0;
    let running = false;
    let visible = true;
    let ready = false;
    let disposed = false;
    let needsMeasure = true;
    let needsApply = true;
    const startTime = performance.now();

    /* ---------- layout ---------- */
    function measure() {
      needsMeasure = false;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (w === view.w && h === view.h && dpr === view.dpr) return;
      Object.assign(view, { w, h, dpr });

      mask.width = Math.round(w * dpr);
      mask.height = Math.round(h * dpr);
      maskFill = getComputedStyle(scroller).getPropertyValue("--mask-bg").trim() || maskFill;
      dotPattern = createDotPattern(maskCtx, dpr);

      applyGlyphFont(maskCtx, 100);
      const wordWidthAt100 = maskCtx.measureText(WORD).width || 1;
      const fontSize = Math.min((100 * w * 0.9) / wordWidthAt100, h * 0.42);
      const textX = (w - (wordWidthAt100 * fontSize) / 100) / 2;
      const baseline = h / 2 + fontSize * 0.36;
      applyGlyphFont(maskCtx, fontSize);
      const advance = maskCtx.measureText(DIVE_GLYPH).width;

      if (glyph === undefined) glyph = findStrokeCentre(DIVE_GLYPH, applyGlyphFont);
      if (glyph) {
        Object.assign(geo, {
          centreX: textX + glyph.centre.u * advance,
          centreY: baseline - glyph.centre.v * fontSize,
          diveX: textX + glyph.dive.u * advance,
          diveY: baseline - glyph.dive.v * fontSize,
          // zoom until the stroke at the dive point covers the whole screen
          maxScale: (Math.hypot(w, h) / (2 * glyph.dive.r * fontSize)) * 1.2,
        });
      } else {
        const x = textX + advance / 2;
        const y = baseline - fontSize * 0.36;
        Object.assign(geo, { centreX: x, centreY: y, diveX: x, diveY: y, maxScale: Math.hypot(w, h) / (fontSize * 0.09) });
      }
      Object.assign(geo, { fontSize, textX, baseline });

      // The shader is soft; render it below device resolution to save fill rate.
      const renderScale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.8;
      silk?.resize(w * renderScale, h * renderScale);

      lastMaskKey = "";
      needsApply = true;
    }

    function createDotPattern(ctx, dpr) {
      const tile = document.createElement("canvas");
      const size = Math.round(MASK_DOT_SPACING * dpr);
      tile.width = tile.height = size;
      const tc = tile.getContext("2d");
      tc.fillStyle = MASK_DOT_COLOR;
      tc.beginPath();
      tc.arc(size / 2, size / 2, 1.1 * dpr, 0, Math.PI * 2);
      tc.fill();
      return ctx.createPattern(tile, "repeat");
    }

    /* ---------- mask: black sheet with the word cut out ---------- */
    function drawMask(scale, focusX, focusY) {
      const key = `${scale.toFixed(4)}|${focusX.toFixed(2)}|${focusY.toFixed(2)}`;
      if (key === lastMaskKey) return;
      lastMaskKey = key;

      const { w, h, dpr } = view;
      maskCtx.setTransform(1, 0, 0, 1, 0, 0);
      maskCtx.globalCompositeOperation = "source-over";
      maskCtx.fillStyle = maskFill;
      maskCtx.fillRect(0, 0, mask.width, mask.height);
      maskCtx.fillStyle = dotPattern;
      maskCtx.fillRect(0, 0, mask.width, mask.height);

      // Scale around the focus point so it stays pinned to the screen centre.
      maskCtx.globalCompositeOperation = "destination-out";
      const k = scale * dpr;
      maskCtx.setTransform(k, 0, 0, k, dpr * (w / 2 - focusX * scale), dpr * (h / 2 - focusY * scale));
      applyGlyphFont(maskCtx, geo.fontSize);
      maskCtx.fillStyle = "#000";
      maskCtx.fillText(WORD, geo.textX, geo.baseline);
    }

    /* ---------- title scramble ---------- */
    function setTitle(lead, accent) {
      titleLead.textContent = lead;
      titleAccent.textContent = accent;
    }

    function scramble() {
      if (reduceMotion) return;
      const run = ++scrambleRun;
      const total = TITLE_LEAD.length + TITLE_ACCENT.length;
      const t0 = performance.now();
      const step = (now) => {
        if (run !== scrambleRun || disposed) return;
        const k = clamp((now - t0) / SCRAMBLE_MS);
        const revealed = Math.floor(k * total);
        const leadShown = Math.min(revealed, TITLE_LEAD.length);
        const accentShown = Math.max(0, revealed - TITLE_LEAD.length);
        setTitle(
          TITLE_LEAD.slice(0, leadShown) + randomChars(TITLE_LEAD.length - leadShown),
          TITLE_ACCENT.slice(0, accentShown) + randomChars(TITLE_ACCENT.length - accentShown),
        );
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function setLive(next) {
      if (next === live) return;
      live = next;
      hero.classList.toggle(styles.live, live);
      if (live) {
        scramble();
      } else {
        scrambleRun++; // cancel an in-flight scramble
        setTitle(TITLE_LEAD, TITLE_ACCENT);
      }
    }

    /* ---------- scroll choreography ---------- */
    function applyProgress(p) {
      const dive = range(p, TIMELINE.dive);
      const pre = 1 + 0.06 * ease(range(p, TIMELINE.preZoom));
      const scale = pre * Math.pow(geo.maxScale / pre, ease(dive));
      const glide = easeOutCubic(range(p, TIMELINE.glide));
      const settle = ease(range(dive, TIMELINE.settle));
      const focusX = lerp(view.w / 2, lerp(geo.centreX, geo.diveX, settle), glide);
      const focusY = lerp(view.h / 2, lerp(geo.centreY, geo.diveY, settle), glide);

      const maskFade = range(p, TIMELINE.maskFade);
      const hideMask = maskFade >= 1;
      if (hideMask !== maskHidden) {
        maskHidden = hideMask;
        mask.style.visibility = hideMask ? "hidden" : "visible";
      }
      if (!hideMask) drawMask(scale, focusX, focusY);
      mask.style.opacity = String(1 - maskFade);

      art.style.transform = `scale(${lerp(1.6, 1, ease(dive))})`;
      art.style.transformOrigin = `${(focusX / view.w) * 100}% ${(focusY / view.h) * 100}%`;

      const chrome = String(1 - range(p, TIMELINE.chromeFade));
      topBar.style.opacity = chrome;
      bottomBar.style.opacity = chrome;
      scrim.style.opacity = String(range(p, TIMELINE.scrim));

      setLive(p > TIMELINE.heroLive);
    }

    function readScroll() {
      const rect = scroller.getBoundingClientRect();
      const travel = rect.height - view.h;
      target = clamp(-rect.top / (travel || 1));
      // Where the sticky stage sits in the viewport (used to map pointer coordinates).
      view.top = rect.top > 0 ? rect.top : Math.min(0, rect.bottom - view.h);
    }

    /* ---------- frame loop (only runs while the hero is on screen) ---------- */
    function frame(now) {
      if (disposed) return;
      if (needsMeasure) {
        measure();
        readScroll();
      }

      const prev = progress;
      progress = reduceMotion ? target : progress + (target - progress) * SCROLL_SMOOTHING;
      if (Math.abs(target - progress) < 0.0005) progress = target;
      if (progress !== prev || needsApply) {
        needsApply = false;
        applyProgress(progress);
      }

      pointer.x += (pointer.targetX - pointer.x) * 0.1;
      pointer.y += (pointer.targetY - pointer.y) * 0.1;
      pointer.velocity *= 0.93;
      hover += ((pointer.seen && live ? 1 : 0) - hover) * 0.06;
      silk?.draw({
        time: reduceMotion ? 6 : (now - startTime) / 1000,
        mouseX: pointer.x,
        mouseY: pointer.y,
        velocity: pointer.velocity,
        hover,
      });

      // The shader animates on its own; otherwise (reduced motion, or no WebGL)
      // sleep once everything has settled. Scroll/pointer/resize call wake().
      const settled =
        progress === target &&
        Math.abs((pointer.seen && live ? 1 : 0) - hover) < 0.001 &&
        Math.abs(pointer.targetX - pointer.x) < 1e-4 &&
        Math.abs(pointer.targetY - pointer.y) < 1e-4;
      const idle = settled && (reduceMotion || !silk);
      running = visible && !idle;
      if (running) rafId = requestAnimationFrame(frame);
    }

    function wake() {
      if (!ready || running || !visible || disposed) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }

    /* ---------- events ---------- */
    const onScroll = () => {
      readScroll();
      wake();
    };
    const onResize = () => {
      needsMeasure = true;
      wake();
    };
    const onPointerMove = (e) => {
      if (!view.w || !view.h) return;
      const x = e.clientX / view.w;
      const y = 1 - (e.clientY - view.top) / view.h;
      pointer.velocity = Math.min(1, pointer.velocity + Math.hypot(x - pointer.targetX, y - pointer.targetY) * 5);
      if (!pointer.seen) {
        pointer.x = x;
        pointer.y = y;
        pointer.seen = true;
      }
      pointer.targetX = x;
      pointer.targetY = y;
      wake();
    };
    // Keyboard users can tab into the final section before it has faded in: jump there.
    const onHeroFocus = () => {
      if (live) return;
      const rect = scroller.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.bottom - view.h,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    observer.observe(scroller);

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    addEventListener("pointermove", onPointerMove, { passive: true });
    hero.addEventListener("focusin", onHeroFocus);

    // The expanded Archivo must be loaded before the letters are measured.
    const fontsReady = document.fonts
      ? Promise.all([document.fonts.load(glyphFont(100), WORD), document.fonts.ready]).catch(() => {})
      : Promise.resolve();
    fontsReady.then(() => {
      if (disposed) return;
      measure();
      readScroll();
      progress = target;
      needsApply = true;
      ready = true;
      wake();
    });

    return () => {
      disposed = true;
      scrambleRun++;
      cancelAnimationFrame(rafId);
      observer.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("focusin", onHeroFocus);
      silk?.dispose();
    };
  }, []);

  return (
    <div className={styles.scroller} ref={scrollerRef}>
      <div className={styles.stage} ref={stageRef}>
        <canvas className={styles.art} ref={artRef} aria-hidden="true" />
        <div className={styles.scrim} ref={scrimRef} />
        <canvas className={styles.mask} ref={maskRef} role="img" aria-label="PORTFOLIO" />

        <div className={`${styles.chrome} ${styles.top}`} ref={topRef}>
          <span className={styles.wordmark}>
            buildbyshivam<span className={styles.caret} aria-hidden="true" />
          </span>
          <span className={styles.status}>
            <i aria-hidden="true" />
            available for new projects
          </span>
        </div>
        <div className={`${styles.chrome} ${styles.bottom}`} ref={bottomRef} aria-hidden="true">
          <span className={styles.hint}>
            {"// scroll to compile"}
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 4l4 4 4-4" />
            </svg>
          </span>
          <span className={styles.ver}>v4.0 — react · next · shopify · gsap</span>
        </div>

        <section className={styles.hero} ref={heroRef} aria-label="About buildbyshivam">
          <div className={`${styles.kicker} ${styles.r}`} style={{ "--d": "0ms" }} aria-hidden="true">
            &gt; npm run build --portfolio
          </div>
          <h1 className={`${styles.title} ${styles.r}`} style={{ "--d": "60ms" }} aria-label={TITLE_LEAD + TITLE_ACCENT}>
            <span ref={titleLeadRef} aria-hidden="true">
              {TITLE_LEAD}
            </span>
            <span ref={titleAccentRef} className={styles.accent} aria-hidden="true">
              {TITLE_ACCENT}
            </span>
          </h1>
          <p className={`${styles.lead} ${styles.r}`} style={{ "--d": "160ms" }}>
            Frontend developer shipping fast, animated websites in React, Next.js, Shopify and GSAP. Clean code in,
            memorable sites out.
          </p>
          <div className={`${styles.actions} ${styles.r}`} style={{ "--d": "260ms" }}>
            <a className={`${styles.btn} ${styles.primary}`} href={primaryHref} target="_blank" rel="noopener noreferrer">
              Start a project →
            </a>
            <a className={`${styles.btn} ${styles.ghost}`} href={secondaryHref}>
              See my work
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
