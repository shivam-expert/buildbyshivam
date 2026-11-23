"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./north.css";

// Start downloading the Three.js chunk as soon as this module runs in the browser.
const sceneModule = typeof window !== "undefined" ? import("./scene") : null;

/* ---------- hero compass geometry (pure, so server and client agree) ---------- */
const pol = (r, d) => {
  const a = (d * Math.PI) / 180;
  return [(260 + r * Math.sin(a)).toFixed(1), (260 - r * Math.cos(a)).toFixed(1)];
};
const TICKS = (() => {
  let minor = "", major = "";
  for (let i = 0; i < 120; i++) {
    const big = i % 10 === 0, a = pol(big ? 192 : 200, i * 3), b = pol(214, i * 3);
    const s = `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
    if (big) major += s; else minor += s;
  }
  return { minor, major };
})();
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const HOME_HEADING = 57;

const RAIL = [
  { label: "Compass", icon: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" /></> },
  { label: "Heart rate", icon: <path d="M3 12h4l2-5 4 10 2-5h6" /> },
  { label: "Altitude", icon: <path d="M3 19 10 7l4 6 2-3 5 9z" /> },
  { label: "Waypoints", icon: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="3" /></> },
];
const CHIPS = [
  { ed: "move", label: "Move", swatch: "#FF6A1A" },
  { ed: "roam", label: "Roam", swatch: "linear-gradient(90deg,#E9DCC4 50%,#1E2B4A 50%)" },
  { ed: "play", label: "Play", swatch: "#F2F2F2" },
];
const ZONES = [["Lisbon", "Europe/Lisbon"], ["Tokyo", "Asia/Tokyo"], ["New York", "America/New_York"]];
const SPECS = [
  ["Case", "44 mm steel"], ["Battery", "Up to 7 days"], ["Water resistance", "10 ATM"],
  ["Display", "Always-on AMOLED"], ["Sensors", "Compass, altimeter, HR"], ["Works with", "iOS and Android"],
];
const PARTS = ["Case", "Bezel", "Dial", "Hands", "Crystal", "Strap"];

const Giant = ({ word }) => (
  <div className="giant" aria-hidden="true">
    {[...word].map((ch, i) => <span key={i}>{ch}</span>)}
  </div>
);

export default function NorthWatch({ className = "" }) {
  const rootRef = useRef(null);
  const editionRef = useRef("move");
  const [rail, setRail] = useState(0);
  const [edition, setEdition] = useState("move");
  const [clock, setClock] = useState(ZONES.map(() => "--:--"));
  const [sent, setSent] = useState(false);

  const pickEdition = (ed) => {
    editionRef.current = ed;
    setEdition(ed);
  };

  // world clock (client only, so the server render never disagrees)
  useEffect(() => {
    const draw = () =>
      setClock(ZONES.map(([, z]) => {
        try { return new Date().toLocaleTimeString("en-GB", { timeZone: z, hour: "2-digit", minute: "2-digit" }); } catch { return "--:--"; }
      }));
    draw();
    const id = setInterval(draw, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const q = gsap.utils.selector(root);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scene = null, ctx = null, cancelled = false;

    /* ---------- hero compass ---------- */
    const [gauge, needle, hdg, card, dial, hero] = [".gauge", ".needle", ".hdg", ".card-dir", ".dial", ".hero-top"].map((s) => q(s)[0]);
    const setHeading = (h) => {
      const a = pol(176, -60), b = pol(176, h);
      gauge.setAttribute("d", `M${a[0]} ${a[1]}A176 176 0 ${h + 60 > 180 ? 1 : 0} 1 ${b[0]} ${b[1]}`);
      needle.setAttribute("transform", `rotate(${h} 260 260)`);
      hdg.textContent = Math.round(h) + "°";
      card.textContent = DIRS[Math.round((((h % 360) + 360) % 360) / 45) % 8];
    };
    const hd = { v: reduce ? HOME_HEADING : 0 };
    setHeading(hd.v);
    const intro = reduce ? null : gsap.to(hd, { v: HOME_HEADING, duration: 2.2, ease: "power3.out", delay: 0.3, onUpdate: () => setHeading(hd.v) });
    const onHeroMove = (e) => {
      if (reduce) return;
      intro?.kill();
      const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      dial.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
      setHeading(HOME_HEADING + x * 40);
    };
    hero.addEventListener("pointermove", onHeroMove);

    /* ---------- 3D watch ---------- */
    const remeasure = () => scene?.measure();
    addEventListener("resize", remeasure);
    const ro = new ResizeObserver(remeasure); // fonts/images landing change section offsets
    ro.observe(root);

    (sceneModule ?? import("./scene")).then(({ createNorthScene }) => {
      if (cancelled) return;
      const css = getComputedStyle(root);
      const fam = (v, f) => css.getPropertyValue(v).trim() || f;
      scene = createNorthScene({
        root,
        canvas: q(".gl")[0],
        reduce,
        getEdition: () => editionRef.current,
        fonts: { disp: fam("--font-archivo", "Archivo"), body: fam("--font-north-body", "Inter"), mono: fam("--font-north-mono", '"JetBrains Mono"') },
      });
      document.fonts?.ready.then(() => { if (!cancelled) { scene.redrawFace(); scene.measure(); } });
    });

    /* ---------- GSAP text reveals ---------- */
    if (!reduce) {
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        q(".giant").forEach((g) => {
          const s = g.closest("section");
          gsap.from(g.children, { yPercent: 70, opacity: 0, stagger: 0.08, ease: "none", scrollTrigger: { trigger: s, start: "top 85%", end: "top 5%", scrub: true } });
          gsap.to(g.children, { yPercent: -30, opacity: 0, stagger: 0.05, ease: "none", scrollTrigger: { trigger: s, start: "bottom 140%", end: "bottom 90%", scrub: true } });
        });
        q(".chapter .cap, .chapter .card, .chapter .chap").forEach((el) => {
          gsap.from(el, { y: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: el.closest("section"), start: "top 45%", end: "top 0%", scrub: true } });
        });
        gsap.from(q(".asm .front .wrap > div"), { y: 50, opacity: 0, ease: "none", scrollTrigger: { trigger: q("#assembly")[0], start: "top 70%", end: "top 10%", scrub: true } });
        gsap.from(q(".rings .front > div:first-child"), { y: 50, opacity: 0, ease: "none", scrollTrigger: { trigger: q("#rings")[0], start: "top 60%", end: "top 0%", scrub: true } });
      }, root);
      ScrollTrigger.refresh();
    }

    return () => {
      cancelled = true;
      intro?.kill();
      hero.removeEventListener("pointermove", onHeroMove);
      removeEventListener("resize", remeasure);
      ro.disconnect();
      ctx?.revert();
      scene?.dispose();
      root.style.background = "";
    };
  }, []);

  const edLabel = CHIPS.find((c) => c.ed === edition).label;

  return (
    <div ref={rootRef} className={`north ${className}`}>
      <canvas className="gl" aria-hidden="true" />

      <header className="nav">
        <a href="#top" className="logo">NORTH°</a>
        <nav aria-label="Primary">
          <a href="#move" className="hide-sm">Chapters</a>
          <a href="#rings">Rings</a>
          <a href="#specs" className="hide-sm">Specs</a>
          <a href="#reserve" className="btn or" style={{ minHeight: 40, padding: "0 18px", fontSize: 14 }}>Reserve</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero hero-top" id="hero">
          <div className="bk" style={{ left: "8%", top: "18%", width: 90, height: 90, background: "#F5A54A", opacity: 0.45 }} />
          <div className="bk" style={{ left: "22%", top: "64%", width: 140, height: 140, background: "#FFC978", opacity: 0.3 }} />
          <div className="bk" style={{ left: "47%", top: "10%", width: 60, height: 60, background: "#FFD9A0", opacity: 0.5 }} />
          <div className="bk" style={{ left: "80%", top: "72%", width: 120, height: 120, background: "#F2994A", opacity: 0.35 }} />
          <div className="bk" style={{ left: "88%", top: "16%", width: 70, height: 70, background: "#7FB0FF", opacity: 0.3 }} />
          <div className="wrap hero-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <span className="mono" style={{ color: "#FFB27A" }}>Navigation instrument</span>
              <h1 className="disp"><span className="thin">Find your</span><span className="wide">HEADING.</span></h1>
              <p className="lead">Compass, altitude and a heading that holds — on a watch you&apos;ll actually want to wear every day.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <a href="#reserve" className="btn or">Reserve yours</a>
                <a href="#assembly" className="btn" style={{ color: "#F4F5F7", border: "1px solid rgba(255,255,255,.4)" }}>See how it&apos;s built</a>
              </div>
            </div>
            <div className="dialwrap">
              <svg className="dial" viewBox="0 0 520 520" role="img" aria-label="Compass dial showing your heading">
                <circle cx="260" cy="260" r="250" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.5" />
                <circle cx="260" cy="260" r="242" fill="none" stroke="#9FD4FF" strokeOpacity=".18" strokeWidth="6" />
                <path d={TICKS.minor} stroke="#fff" strokeOpacity=".45" strokeWidth="1.2" />
                <path d={TICKS.major} stroke="#fff" strokeWidth="2.4" />
                <g style={{ fontFamily: "var(--n-mono)" }} fontSize="13" fill="#C5CCD6" textAnchor="middle">
                  <text x="260" y="40" fill="#FF8A3D" fontWeight="700">N</text>
                  <text x="484" y="265">E</text>
                  <text x="260" y="490">S</text>
                  <text x="36" y="265">W</text>
                </g>
                <circle cx="260" cy="260" r="176" fill="none" stroke="#fff" strokeOpacity=".06" strokeWidth="30" />
                <path className="gauge" fill="none" stroke="#FF8A3D" strokeWidth="30" strokeDasharray="5 3" />
                <circle cx="260" cy="260" r="128" fill="#0E1319" stroke="#2C3440" strokeWidth="2" />
                <path className="needle" d="M260 140 L268 156 L252 156 Z" fill="#FF8A3D" />
                <text x="260" y="236" textAnchor="middle" fontSize="12" letterSpacing="3" fill="#AEB6C2" style={{ fontFamily: "var(--n-mono)" }}>HEADING</text>
                <text className="hdg" x="260" y="300" textAnchor="middle" fontSize="72" fontWeight="800" fill="#F4F5F7" style={{ fontFamily: "var(--n-disp)", fontStretch: "85%" }}>0°</text>
                <text className="card-dir" x="260" y="326" textAnchor="middle" fontSize="12" letterSpacing="2" fill="#FFB27A" style={{ fontFamily: "var(--n-mono)" }}>N</text>
              </svg>
            </div>
            <div className="rail" role="group" aria-label="Dial mode">
              {RAIL.map((r, i) => (
                <button key={r.label} type="button" aria-pressed={rail === i} aria-label={r.label} onClick={() => setRail(i)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{r.icon}</svg>
                </button>
              ))}
            </div>
          </div>
          <a href="#assembly" className="cue mono">
            Scroll to assemble
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 4v16M5 13l7 7 7-7" /></svg>
          </a>
        </section>

        <section className="pin asm" id="assembly" style={{ height: "280vh" }}>
          <div className="back" />
          <div className="front">
            <div className="wrap" style={{ width: "100%" }}>
              <div style={{ maxWidth: 420 }}>
                <span className="mono" style={{ color: "#FFB27A" }}>00 · Assembly</span>
                <h2 className="disp"><span className="thin">Five layers.</span><span className="wide">ONE INSTRUMENT.</span></h2>
                <p style={{ margin: 0, color: "var(--muted)" }}>Keep scrolling — every part snaps into place.</p>
                <ol className="parts mono">{PARTS.map((p) => <li key={p}><i />{p}</li>)}</ol>
              </div>
            </div>
          </div>
        </section>

        <section className="pin chapter" id="move" data-bg="#EFE7DC" style={{ height: "180vh", color: "#2A241D" }}>
          <div className="back">
            <div className="win" style={{ left: "6%", width: "18%" }} />
            <div className="win" style={{ left: "26%", width: "18%" }} />
            <div className="floor" />
            <Giant word="MOVE" />
          </div>
          <div className="front">
            <span className="mono chap" style={{ color: "#5A4F42" }}>01 · Move</span>
            <div className="cap">
              <span className="mono" style={{ color: "#5A4F42" }}>#01</span>
              <h2>Every rep,<strong style={{ color: "#C2410C" }}>ONE GLANCE.</strong></h2>
              <p>Workouts, rings and recovery on the dial — no phone in the middle of a set.</p>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 11, color: "#4A4F57", marginBottom: 10 }}>Today</div>
              {[["Move", "72%", "#FF6A1A"], ["Roam", "45%", "#2F5BFF"], ["Play", "88%", "#E8457A"]].map(([n, w, c], i) => (
                <div key={n} style={i ? { marginTop: 8 } : undefined}>{n}<div className="bar"><i style={{ width: w, background: c }} /></div></div>
              ))}
            </div>
          </div>
        </section>

        <section className="pin chapter" id="roam" data-bg="#DCE6F0" style={{ height: "180vh", color: "#18202C" }}>
          <div className="back">
            <div className="win" style={{ left: 0, width: "100%", bottom: "32%" }} />
            <div className="floor" />
            <Giant word="ROAM" />
          </div>
          <div className="front">
            <span className="mono chap" style={{ color: "#3D4A5C" }}>02 · Roam</span>
            <div className="cap">
              <span className="mono" style={{ color: "#3D4A5C" }}>#02</span>
              <h2>Every timezone,<strong style={{ color: "#1D3FD1" }}>ONE GLANCE.</strong></h2>
              <p>Home time and local time side by side, with the date always in view.</p>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 11, color: "#4A4F57", marginBottom: 10 }}>World clock</div>
              {ZONES.map(([n], i) => <div key={n} className="row">{n}<b>{clock[i]}</b></div>)}
            </div>
          </div>
        </section>

        <section className="pin chapter" id="play" data-bg="#F7DCE4" style={{ height: "180vh", color: "#2C1820" }}>
          <div className="back">
            <div className="win" style={{ left: "58%", width: "30%" }} />
            <div className="floor" />
            <Giant word="PLAY" />
          </div>
          <div className="front">
            <span className="mono chap" style={{ color: "#6B3446" }}>03 · Play</span>
            <div className="cap">
              <span className="mono" style={{ color: "#6B3446" }}>#03</span>
              <h2>Every mood,<strong style={{ color: "#B4235A" }}>ONE FACE.</strong></h2>
              <p>Turn any photo into a watch face. Swap it as often as you swap your strap.</p>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 11, color: "#4A4F57", marginBottom: 10 }}>Faces</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 44, height: 44, borderRadius: "50%", background: "#EE8FAE", border: "2px solid #121417" }} />
                <span style={{ width: 44, height: 44, borderRadius: "50%", background: "#F7F8F9", border: "1px solid #C9CCD1" }} />
                <span style={{ width: 44, height: 44, borderRadius: "50%", background: "#F4F1EA", border: "1px solid #C9CCD1" }} />
              </div>
              Your photo, your face.
            </div>
          </div>
        </section>

        <section className="pin rings" id="rings" data-bg="#E9EAEC" style={{ height: "170vh" }}>
          <div className="back"><div className="plinth" /></div>
          <div className="front">
            <div>
              <span className="mono" style={{ color: "#4A4F57" }}>04 · Rings</span>
              <h2 className="disp"><span className="thin">Three rings.</span><span className="wide">ONE YOU.</span></h2>
              <p style={{ margin: 0, maxWidth: 420, fontSize: 17, color: "#3A3F47" }}>Move, Roam and Play — one watch that changes strap and face to match the day. Pick yours.</p>
              <div className="chips" role="group" aria-label="Choose an edition">
                {CHIPS.map((c) => (
                  <button key={c.ed} type="button" className="chip" aria-pressed={edition === c.ed} onClick={() => pickEdition(c.ed)}>
                    <span style={{ background: c.swatch }} />{c.label}
                  </button>
                ))}
              </div>
              <div className="price">
                <div>
                  <div className="mono" style={{ color: "#4A4F57" }}>{edLabel} edition</div>
                  <div className="disp" style={{ fontSize: 32, fontWeight: 800, fontStretch: "110%" }}>$349</div>
                </div>
                <a href="#reserve" className="btn" style={{ background: "#121417", color: "#fff" }}>Reserve&nbsp;{edLabel}</a>
              </div>
              <p className="note">Sample price — replace with the client&apos;s.</p>
            </div>
            <div />
          </div>
        </section>

        <section className="solid specs" id="specs">
          <div className="wrap">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
              <h2 className="disp wide" style={{ margin: 0, fontSize: "clamp(36px,4vw,56px)", lineHeight: 0.95 }}>SPECS.</h2>
              <span className="mono" style={{ color: "#4A4F57" }}>05 · Tech</span>
            </div>
            <div className="sgrid">
              {SPECS.map(([k, v]) => <div key={k} className="spec"><span className="mono" style={{ color: "#4A4F57" }}>{k}</span><b>{v}</b></div>)}
            </div>
            <p className="note">Sample specs — replace with the client&apos;s real figures.</p>
          </div>
        </section>

        <section className="solid hero reserve" id="reserve" style={{ minHeight: 0 }}>
          <div className="wrap">
            <span className="mono" style={{ color: "#FFB27A" }}>06 · Reserve</span>
            <h2 className="disp" style={{ margin: "20px 0 0", lineHeight: 0.9 }}>
              <span className="thin" style={{ display: "block", fontSize: "clamp(52px,6vw,92px)" }}>Wear your</span>
              <span className="wide" style={{ display: "block", fontSize: "clamp(48px,6vw,92px)" }}>NORTH°</span>
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <div style={{ flex: "1 1 260px" }}>
                <label htmlFor="north-email" className="mono">Email</label>
                <input id="north-email" type="email" required placeholder="you@example.com" autoComplete="email" />
              </div>
              <button type="submit" className="btn or" style={{ minHeight: 48 }}>Reserve</button>
            </form>
            <p role="status" style={{ margin: "18px 0 0", fontSize: 14, color: "var(--muted)" }}>
              {sent ? "Thanks — this concept form doesn't send anything yet." : "Refundable deposit. Ships when ready."}
            </p>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
          <span className="logo" style={{ color: "#F4F5F7" }}>NORTH°</span>
          <span>Concept site · 3D watch rendered live in your browser</span>
        </div>
      </footer>
    </div>
  );
}
