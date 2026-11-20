"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./kalpa.css";

// Start downloading the Three.js chunk as soon as this module runs in the browser.
const sceneModule = typeof window !== "undefined" ? import("./scene") : null;

const KEEP = "KEEP SIPPING".split("");
const RAYS = Array.from({ length: 24 }, (_, i) => i * 15);
const PILL_WORDS = ["PURE", "CLEAN", "CRISP", "COOL"];

const CARDS = [
  { title: "ORIGINAL", text: "Pure tender coconut water.", bg: "#EEF0C8", alt: "Kalpa Original can" },
  { title: "LIME + MINT", text: "With a squeeze of lime and fresh mint.", bg: "#E2EDC2", alt: "Kalpa Lime and Mint can" },
  { title: "PINK GUAVA", text: "With a splash of ripe pink guava.", bg: "#F5DDD3", alt: "Kalpa Pink Guava can" },
];
const POLAS = [
  { left: "2%", top: "18%", bg: "#8CC8E8", alt: "Cracked coconut half", cap: "fresh cracked" },
  { left: "34%", top: "4%", bg: "#4E7A4C", alt: "Kalpa can", cap: "ice-cold" },
  { left: "64%", top: "22%", bg: "#F2A44A", alt: "Whole coconut", cap: "from the tree" },
];

const IceCube = ({ className, style, extra }) => (
  <svg className={`sketch ${className}`} viewBox="0 0 120 120" style={style} aria-hidden="true">
    <path d="M20 40 L60 20 L100 38 L100 84 L60 104 L20 86 Z" />
    <path d="M20 40 L60 58 L100 38" />
    <path d="M60 58 L60 104" />
    {extra}
  </svg>
);

export default function Kalpa({ className = "" }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const q = gsap.utils.selector(root);
    const loader = q(".loader")[0];
    const done = () => loader.classList.add("done");
    const failsafe = setTimeout(done, 7000);
    let scene = null;
    let ctx = null;
    let cancelled = false;

    // rotating word in the lime pill
    const pw = q(".pillword")[0];
    let wi = 0;
    const pillTimer = setInterval(() => {
      gsap.to(pw, {
        yPercent: -110, duration: 0.3, ease: "power2.in",
        onComplete: () => {
          wi = (wi + 1) % PILL_WORDS.length;
          pw.textContent = PILL_WORDS[wi];
          gsap.fromTo(pw, { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: "power3.out" });
        },
      });
    }, 1800);

    const onResize = () => scene?.resize();
    window.addEventListener("resize", onResize);

    (async () => {
      const { createKalpaScene, fontsReady } = await (sceneModule ?? import("./scene"));
      const css = getComputedStyle(root);
      const fam = (v, f) => css.getPropertyValue(v).trim() || f;
      const fonts = {
        disp: fam("--font-kalpa-disp", '"Big Shoulders"'),
        body: fam("--font-kalpa-body", "Inter"),
        hand: fam("--font-kalpa-hand", "Caveat"),
      };
      await fontsReady(fonts);
      if (cancelled) return;

      scene = createKalpaScene(q(".gl")[0], fonts);
      const { S, images } = scene;
      images.cans.forEach((u, i) => (q(".card img")[i].src = u));
      const pimgs = q(".pola img");
      pimgs[0].src = images.half;
      pimgs[1].src = images.cans[0];
      pimgs[2].src = images.whole;
      scene.start();

      gsap.registerPlugin(ScrollTrigger);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

      ctx = gsap.context(() => {
        // ---------- intro ----------
        if (!reduce) {
          const ap = q(".arrow-path")[0];
          const L = ap.getTotalLength();
          gsap.set(ap, { strokeDasharray: L, strokeDashoffset: L });
          gsap.timeline({ delay: 0.35, defaults: { ease: "expo.out" } })
            .from(".hero-h .ln", { xPercent: -30, "--s": 1, opacity: 0, duration: 1.3, stagger: 0.08 })
            .from(S, { cs: 0.4, cry: -2.5, cy: -0.4, duration: 1.8 }, 0)
            .from(".frond", { rotate: -30, scale: 0.6, opacity: 0, duration: 1.6, transformOrigin: "80% 20%" }, 0)
            .from([".hero-notes ul", ".hero-copy", ".scrollhint"], { opacity: 0, y: 24, duration: 1, stagger: 0.08 }, 0.5)
            .to(ap, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 0.7);
        }
        done();

        // ---------- pinned scroll story ----------
        const story = q(".story")[0];
        const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, scrollTrigger: { trigger: story, start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true } });
        // 1. hero → "NOTHING ADDED."
        tl.to(".hero-h .ln", { xPercent: (i) => (i === 2 ? 90 : -90), "--s": 1, opacity: 0, duration: 1, stagger: 0.06 }, 0)
          .to([".hero-notes", ".hero-copy", ".scrollhint"], { opacity: 0, y: -40, duration: 0.5 }, 0)
          .to(".frond", { opacity: 0, scale: 1.25, rotate: 20, duration: 1 }, 0)
          .to(S, { cx: 0, cy: 0.02, crx: 0.28, crz: 0.12, cry: "+=1.8", cs: 1.04, duration: 1.3 }, 0)
          .fromTo(".s2-l", { xPercent: -110, "--s": 1, opacity: 0 }, { xPercent: 0, "--s": 0, opacity: 1, duration: 0.9 }, 0.45)
          .fromTo(".s2-r", { xPercent: 110, "--s": 1, opacity: 0 }, { xPercent: 0, "--s": 0, opacity: 1, duration: 0.9 }, 0.45)
          .fromTo(".s2-r2", { xPercent: 80, "--s": 1, opacity: 0 }, { xPercent: 0, "--s": 0, opacity: 1, duration: 0.9 }, 0.6)
          .fromTo(".s2-copy", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 0.8)
          // 2. crack open, top flies, coins
          .to(".s2-l", { xPercent: -110, "--s": 1, opacity: 0, duration: 0.8 }, 1.75)
          .to([".s2-r", ".s2-r2"], { xPercent: 110, "--s": 1, opacity: 0, duration: 0.8 }, 1.75)
          .to(".s2-copy", { opacity: 0, y: -30, duration: 0.4 }, 1.75)
          .to(S, { gap: 0.05, duration: 0.15, ease: "power1.in" }, 1.85)
          .to(S, { topY: 5.5, topX: 1.6, topRZ: -1.1, topRX: -0.9, duration: 1.1, ease: "power2.in" }, 2.0)
          .to(S, { crx: 1.12, crz: 0, cs: 1.18, cy: -0.06, cx: 0, duration: 1.1 }, 2.0)
          .to(S, { coins: 1, duration: 2, ease: "none" }, 2.35)
          .to(S, { coinsOut: 1, duration: 0.6, ease: "power2.in" }, 4.2)
          // 3. close back up → whole coconut
          .to(S, { topY: 0, topX: 0, topRZ: 0, topRX: 0, gap: 0, crx: 0.3, crz: -0.12, cs: 1.02, cy: 0, duration: 1.1 }, 4.45)
          .to(".counter", { opacity: 1, duration: 0.3 }, 5.1)
          // 4. shaking + crack
          .to(S, { shake: 1, duration: 0.3 }, 5.6)
          .to(S, { gap: 0.035, duration: 0.4 }, 5.9)
          // 5. cracked open → can pops out
          .to(S, { shake: 0, crx: 0.05, crz: 0, duration: 0.25 }, 6.45)
          .to(S, { topY: 1.35, topRZ: -0.3, topX: 0.15, botY: -1.35, gap: 0, duration: 0.6, ease: "power3.out" }, 6.55)
          .to(S, { canS: 1, duration: 0.75, ease: "back.out(1.5)" }, 6.6)
          .to(S, { topY: 6, botY: -6, duration: 0.6, ease: "power2.in" }, 7.15)
          .set(S, { cocoVis: 0 }, 7.8)
          .to(S, { canRZ: 0.2, duration: 0.6 }, 7.1)
          // 6. canned
          .fromTo(".c-title", { xPercent: -50, "--s": 1, opacity: 0 }, { xPercent: 0, "--s": 0, opacity: 1, duration: 0.7 }, 7.3)
          .fromTo([".c-copy", ".c-right"], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 }, 7.5)
          // 7. spin to the back + KEEP SIPPING
          .to([".c-title", ".c-copy", ".c-right"], { opacity: 0, y: -30, duration: 0.5 }, 8.6)
          .to(S, { canRY: Math.PI, canRZ: -0.05, duration: 1.1 }, 8.7)
          .fromTo(".keep .ch", { opacity: 0, yPercent: 50, filter: "blur(14px)" }, { opacity: 1, yPercent: 0, filter: "blur(0px)", stagger: 0.05, duration: 0.6 }, 8.9)
          .to(S, { canRY: Math.PI * 2, duration: 1.1 }, 9.8)
          .to(".counter", { opacity: 0, duration: 0.3 }, 9.9)
          .fromTo(".arches", { y: () => innerHeight + 40 }, { y: () => -innerWidth * 0.17, duration: 1.3, ease: "power2.in" }, 10.0)
          .to({}, { duration: 0.2 });

        const lbl = q(".clbl")[0], num = q(".cnum")[0], bar = q(".cbar")[0];
        tl.eventCallback("onUpdate", () => {
          const t = tl.time();
          const p = gsap.utils.clamp(0, 1, (t - 4.9) / (7.6 - 4.9));
          num.textContent = String(Math.round(p * 100)).padStart(3, "0");
          bar.style.transform = `scaleX(${p})`;
          lbl.textContent = t < 5.6 ? "WHOLE COCONUT" : t < 6.5 ? "SHAKING" : t < 7.25 ? "CRACKED OPEN" : "CANNED";
          if (t < 7.8 && S.cocoVis === 0) S.cocoVis = 1;
        });

        // nav colour over the dark sections
        const darkzone = q(".dark")[0];
        ScrollTrigger.create({ trigger: darkzone, start: "top 40px", end: "bottom 40px", toggleClass: { targets: root, className: "on-dark" } });
        ScrollTrigger.create({ trigger: story, start: "92% top", end: "bottom top", toggleClass: { targets: root, className: "on-dark" } });

        // statement
        const statement = q(".statement")[0];
        const scrubIn = (trigger) => ({ trigger, start: "top bottom", end: "bottom top", scrub: true });
        gsap.from(".statement h2 .ln", { yPercent: 60, opacity: 0, filter: "blur(12px)", stagger: 0.12, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: statement, start: "top 65%" } });
        gsap.to(".smiley", { rotate: 360, ease: "none", scrollTrigger: scrubIn(statement) });
        gsap.to(".ice1", { y: -140, rotate: 30, ease: "none", scrollTrigger: scrubIn(statement) });
        gsap.to(".ice2", { y: 120, rotate: -20, ease: "none", scrollTrigger: scrubIn(statement) });
        gsap.to(".ice3", { y: -80, rotate: 40, ease: "none", scrollTrigger: scrubIn(statement) });
        gsap.from(".handnote", { opacity: 0, rotate: -20, y: 30, duration: 1, ease: "expo.out", scrollTrigger: { trigger: q(".handnote")[0], start: "top 85%" } });
        // explore
        const explore = q(".explore")[0], cards = q(".cards")[0];
        gsap.fromTo(".ex-l", { xPercent: -40, "--s": 1 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: explore, start: "top bottom", end: "top 30%", scrub: true } });
        gsap.fromTo(".ex-r", { xPercent: 40 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: explore, start: "top bottom", end: "top 30%", scrub: true } });
        gsap.from(".card", { y: 140, opacity: 0, rotate: 3, stagger: 0.12, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: cards, start: "top 85%" } });
        gsap.from(".card img", { rotate: -25, y: 80, stagger: 0.12, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: cards, start: "top 80%" } });
        // deserve
        const dz = q(".dz")[0];
        gsap.from(".scallops span", { yPercent: -60, stagger: 0.05, duration: 1, ease: "expo.out", scrollTrigger: { trigger: q(".deserve")[0], start: "top 90%" } });
        gsap.fromTo(".dz h2 .ln", { xPercent: (i) => (i ? 40 : -40), "--s": 1, opacity: 0 }, { xPercent: 0, "--s": 0, opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: dz, start: "top 85%", end: "top 30%", scrub: true } });
        q(".pola").forEach((p, i) => {
          gsap.fromTo(p, { y: 260 + i * 60, rotate: [-14, 6, 16][i] + (i - 1) * 14, opacity: 0 }, { y: 0, rotate: [-9, 3, 11][i], opacity: 1, ease: "none", scrollTrigger: { trigger: dz, start: "top 90%", end: "top 10%", scrub: true } });
        });
        gsap.from(".foot .big", { yPercent: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: q(".foot")[0], start: "top 85%" } });
      }, root);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      clearInterval(pillTimer);
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf(pw);
      ctx?.revert();
      root.classList.remove("on-dark");
      scene?.dispose();
    };
  }, []);

  return (
    <div ref={rootRef} className={`kalpa ${className}`}>
      <div className="loader" aria-hidden="true">
        <b>KALPA</b>
        <i />
      </div>

      <header className="nav">
        <a className="logo" href="#top" aria-label="Kalpa home">
          <svg aria-hidden="true" viewBox="0 0 40 40" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M20 38 C21 28 21 20 20 14" />
            <path d="M20 14 C14 8 8 8 3 11" />
            <path d="M20 14 C16 6 18 3 22 2" />
            <path d="M20 14 C26 7 32 7 37 11" />
            <path d="M20 14 C12 14 8 18 6 23" />
            <path d="M20 14 C28 14 32 18 34 23" />
          </svg>
          <span>KALPA</span>
        </a>
        <div className="nav-r">
          <button type="button" className="btn icon" aria-label="Cart">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8h14l-1.5 12h-11z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </button>
          <button type="button" className="btn">MENU</button>
        </div>
      </header>

      <main id="top">
        <section className="story" aria-label="Kalpa story">
          <div className="stage">
            <div className="layer" aria-hidden="true">
              <svg className="frond" viewBox="0 0 400 400">
                <g fill="#EDE85A">
                  <path d="M200 200 C150 120 80 90 10 100 C80 120 140 150 200 200Z" />
                  <path d="M200 200 C190 110 220 40 290 10 C240 70 220 130 200 200Z" />
                  <path d="M200 200 C270 140 340 140 395 170 C330 170 270 180 200 200Z" />
                  <path d="M200 200 C280 230 330 290 340 380 C300 300 250 250 200 200Z" />
                  <path d="M200 200 C150 260 90 280 20 270 C90 250 150 230 200 200Z" />
                </g>
              </svg>
            </div>
            <div className="layer behind" aria-hidden="true">
              <h2 className="disp keep">
                {KEEP.map((ch, i) => (ch === " " ? <span key={i} className="sp" /> : <span key={i} className="ch">{ch}</span>))}
              </h2>
            </div>
            <canvas className="gl" aria-label="3D coconut and can" />
            <div className="layer front">
              <h1 className="disp hero-h">
                <span className="ln sm">STRAIGHT</span>
                <span className="ln sm">FROM THE</span>
                <span className="ln sm" style={{ "--d": -1 }}>PALM.</span>
              </h1>
              <div className="hero-notes">
                <svg aria-hidden="true" viewBox="0 0 120 120" width="96" height="96" fill="none" stroke="#2A1A12" strokeWidth="2.4" strokeLinecap="round">
                  <path className="arrow-path" d="M112 10 C62 4 22 40 28 100" />
                  <path d="M16 86 L28 102 L42 88" />
                </svg>
                <ul>
                  <li>Tender coconuts only</li>
                  <li>No added sugar</li>
                </ul>
              </div>
              <div className="hero-copy">
                <p className="copy">Cracked fresh, packed cold. Every can is the water of young green coconuts — nothing blended in, nothing boiled off.</p>
                <a className="cta" href="#flavours">Discover flavours</a>
              </div>
              <div className="scrollhint">SCROLL<i /></div>

              <p className="disp s2 s2-l sm" aria-hidden="true">NOTHING</p>
              <p className="disp s2 s2-r sm" aria-hidden="true">ADDED.</p>
              <p className="disp s2 s2-r2 sm" aria-hidden="true">NOTHING TAKEN.</p>
              <p className="copy s2-copy">Just the clear, faintly sweet water inside a young coconut. No concentrate, no syrups, no shortcuts.</p>

              <h2 className="disp c-title sm">ORIGINAL</h2>
              <p className="copy c-copy">One tender coconut, cracked and canned cold the same day. Nothing else goes in.</p>
              <div className="c-right">
                <p className="copy">Three flavours, each poured on a pure coconut-water base. Pick your pour.</p>
                <a className="cta" href="#flavours">Explore flavours</a>
              </div>

              <div className="counter" aria-hidden="true">
                <span className="lbl clbl">WHOLE COCONUT</span>
                <span className="bar"><i className="cbar" /></span>
                <span className="cnum">000</span>
              </div>
            </div>
            <div className="arches" aria-hidden="true">
              <div className="row">{Array.from({ length: 7 }, (_, i) => <span key={i} />)}</div>
              <div className="fill" />
            </div>
          </div>
        </section>

        <div className="dark">
          <section className="statement" aria-label="Why Kalpa">
            <svg className="smiley" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="#E3E85A" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="#2A1A12" strokeWidth="2.5" />
              <circle cx="36" cy="40" r="5" fill="#2A1A12" />
              <circle cx="64" cy="40" r="5" fill="#2A1A12" />
              <path d="M30 58 C38 74 62 74 70 58" fill="none" stroke="#2A1A12" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <IceCube className="ice1" style={{ left: "4vw", bottom: "14vh", width: "clamp(90px,10vw,150px)" }} extra={<><path d="M34 46 L52 54" /><path d="M70 30 L86 37" /></>} />
            <IceCube className="ice2" style={{ right: "6vw", top: "12vh", width: "clamp(80px,9vw,140px)", transform: "rotate(18deg)" }} extra={<path d="M76 66 L90 60" />} />
            <IceCube className="ice3" style={{ left: "22vw", top: "8vh", width: "clamp(60px,6vw,90px)", transform: "rotate(-24deg)" }} />
            <h2>
              <span className="ln">PURE COCONUT WATER:</span>
              <span className="ln">NATURALLY HYDRATING,</span>
              <span className="ln">
                REFRESHINGLY <span className="pill"><b className="pillword">{PILL_WORDS[0]}</b></span>, STRAIGHT
              </span>
              <span className="ln">FROM THE PALM.</span>
            </h2>
            <p className="handnote">that&apos;s why people<br />love to drink it! ↺</p>
          </section>

          <section className="explore" id="flavours" aria-labelledby="kalpa-ex-title">
            <div className="ex-head">
              <h2 className="ex-l" id="kalpa-ex-title">EXPLORE ALL</h2>
              <svg className="burst" viewBox="0 0 100 100" aria-hidden="true">
                <g fill="#E3C25A">
                  {RAYS.map((r) => <path key={r} d="M50 4 L53 30 L47 30 Z" transform={`rotate(${r} 50 50)`} />)}
                </g>
                <circle cx="50" cy="50" r="15" fill="#E3C25A" />
              </svg>
              <h2 className="ex-r" aria-hidden="true">FLAVOURS</h2>
            </div>
            <div className="cards">
              {CARDS.map((c) => (
                <a key={c.title} className="card" href="#flavours" style={{ background: c.bg }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- src is a runtime WebGL snapshot */}
                  <div className="imgw"><img alt={c.alt} /></div>
                  <div className="meta">
                    <div><h3>{c.title}</h3><p>{c.text}</p></div>
                    <span className="arrow" aria-hidden="true">→</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>

        <section className="deserve" aria-label="You deserve the best">
          <div className="scallops" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <span key={i} />)}</div>
          <div className="dz">
            <h2 className="disp">
              <span className="ln sm">YOU DESERVE</span>
              <span className="ln sm" style={{ "--d": -1 }}>THE REAL THING.</span>
            </h2>
            <p className="copy">For long runs, slow Sundays and hot afternoons — the coconut did the hard part.</p>
            <div className="polas">
              {POLAS.map((p) => (
                <figure key={p.cap} className="pola" style={{ left: p.left, top: p.top }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- src is a runtime WebGL snapshot */}
                  <div className="ph" style={{ background: p.bg }}><img alt={p.alt} /></div>
                  <figcaption>{p.cap}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <footer className="foot">
          <p className="big">KALPA</p>
          <div className="row"><span>TENDER COCONUT WATER · CONCEPT</span><a href="#top">BACK TO TOP ↑</a></div>
        </footer>
      </main>
    </div>
  );
}
