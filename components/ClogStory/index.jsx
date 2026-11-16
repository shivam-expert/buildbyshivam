"use client";

import { useEffect, useRef, useState } from "react";
import m from "./ClogStory.module.css"; // scroll-driven motion only
import { ACCENT, BUBBLES, IMG, NAV, SCENES, SIZES, SPOKES, SWATCHES, TILES } from "./data";

const SMOOTH = 0.14; // scroll easing per frame (1 = no easing)
const LETTERS = "squish".split("");

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const out3 = (t) => 1 - Math.pow(1 - t, 3);
const in2 = (t) => t * t;
const smooth = (t) => t * t * (3 - 2 * t);
const range = (p, a, b) => clamp((p - a) / (b - a));
const cx = (...c) => c.filter(Boolean).join(" ");

/* Shared Tailwind recipes */
const DISP = "font-squish font-black tracking-[-0.065em] leading-[0.8]";
const SHOE = "block h-auto w-full select-none [-webkit-user-drag:none]";
const SPRING = "transition-transform duration-[250ms] ease-[cubic-bezier(.3,1.6,.5,1)]";
const PILL = `inline-flex min-h-11 items-center rounded-full border-[1.5px] border-current px-5 text-[13px] font-semibold hover:-translate-y-0.5 hover:scale-[1.03] ${SPRING}`;
const PILL_STYLE = {
  solid: "border-[#141010] bg-[#141010] text-white",
  light: "border-white bg-white text-[#141010]",
};
const SEC = `${m.vars} relative h-[2100px]`;
const PIN = "sticky top-0 isolate grid h-svh min-h-[560px] place-items-center overflow-hidden";
const CLOG = "relative z-[3] mt-[4%] w-[84vw] drop-shadow-[0_40px_40px_rgba(0,0,0,.25)] md:w-[min(700px,58vw)]";
const META = "absolute left-5 top-24 z-[4] max-w-[240px] md:left-12 md:top-[120px] md:max-w-[300px]";
const COUNT = "absolute right-12 top-[120px] z-[4] hidden font-squish text-[13px] font-bold tracking-[.08em] md:block";
const WORD = "absolute inset-x-0 -bottom-[0.04em] z-[1] whitespace-pre-line text-center";
const LINK_UNDERLINE =
  "relative py-1.5 hover:text-[#5a4a40] after:absolute after:inset-x-0 after:bottom-0.5 after:h-[1.5px] after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-[350ms] after:ease-[cubic-bezier(.7,0,.2,1)] hover:after:origin-left hover:after:scale-x-100";

/** Scroll progress for a section, given its rect and the viewport height. */
function progress(kind, rc, vh) {
  if (kind === "story") return clamp(-rc.top / Math.max(1, rc.height - vh));
  if (kind === "foot") return clamp((vh - rc.top) / Math.max(1, rc.height));
  return clamp((-rc.top + 0.45 * vh) / Math.max(1, rc.height - 0.1 * vh));
}

/** The CSS variables each kind of section reads, derived from progress p. */
function varsFor(kind, p) {
  if (kind === "story") {
    return {
      p,
      k: smooth(range(p, 0.01, 0.13)), // card expands to full bleed
      s: out3(range(p, 0.06, 0.22)), // shoe lands
      w: out3(range(p, 0.12, 0.26)), // "classic" rises
      t: out3(range(p, 0.2, 0.28)), // copy in
      to: range(p, 0.38, 0.44), // copy out
      wo: in2(range(p, 0.4, 0.5)), // word out
      z: smooth(range(p, 0.42, 0.6)), // zoom into foam
      mt: out3(range(p, 0.5, 0.58)), // "made of cloudfoam" in
      mo: range(p, 0.66, 0.72), // …and out
      c: smooth(range(p, 0.66, 0.88)), // zoom into the charm
      ct: out3(range(p, 0.84, 0.92)), // charm tag
    };
  }
  if (kind === "foot") return { p };
  return {
    p,
    e: out3(range(p, 0.12, 0.42)),
    x: in2(range(p, 0.66, 0.94)),
    t: out3(range(p, 0.28, 0.48)),
  };
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function Charm() {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="squish charm" className="block size-full">
      <defs>
        <radialGradient id="clogCharmGrad" cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4a423e" />
          <stop offset="0.6" stopColor="#14100e" />
          <stop offset="1" stopColor="#050404" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="url(#clogCharmGrad)" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#f3eee9" strokeWidth="2.6" />
      <path d="M50 24 C64 24 74 35 74 50 C74 65 64 76 50 76 C36 76 26 65 26 50 C26 35 36 24 50 24 Z" fill="#f3eee9" />
      <circle cx="42" cy="46" r="4" fill="#141010" />
      <circle cx="58" cy="46" r="4" fill="#141010" />
      <circle cx="43.4" cy="44.6" r="1.3" fill="#f3eee9" />
      <circle cx="59.4" cy="44.6" r="1.3" fill="#f3eee9" />
      <path d="M40 58 C46 65 54 65 60 58" stroke="#141010" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="38" cy="22" rx="16" ry="6" fill="#ffffff" opacity="0.14" />
    </svg>
  );
}

function Meta({ tag, desc, ink, btn = "solid", allColors = true, className }) {
  return (
    <div className={className} style={{ color: ink }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[.18em]">{tag}</p>
      <p className="mb-5 text-[15px] leading-normal">{desc}</p>
      <div className="flex flex-wrap gap-2.5">
        <a href="#pair" className={cx(PILL, PILL_STYLE[btn])}>Shop now</a>
        {allColors && <a href="#colors" className={PILL}>All colors</a>}
      </div>
    </div>
  );
}

export default function ClogStory({ className = "" }) {
  const rootRef = useRef(null);
  const [pick, setPick] = useState(0);
  const [size, setSize] = useState("M8");
  const chosen = SWATCHES[pick];

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = reduce ? 1 : SMOOTH;
    let raf = 0;
    const sections = [...rootRef.current.querySelectorAll("[data-sec]")].map((el) => ({
      el,
      kind: el.dataset.sec,
      cur: 0,
      last: {},
    }));

    const tick = () => {
      const vh = window.innerHeight || 800;
      for (const it of sections) {
        const rc = it.el.getBoundingClientRect();
        const target = progress(it.kind, rc, vh);
        it.cur += (target - it.cur) * k;
        if (Math.abs(target - it.cur) < 0.0005) it.cur = target;
        const vars = varsFor(it.kind, it.cur);
        for (const name in vars) {
          const v = Math.round(vars[name] * 10000) / 10000;
          if (it.last[name] !== v) {
            it.last[name] = v;
            it.el.style.setProperty(`--${name}`, v);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={rootRef}
      id="top"
      className={cx(
        "relative w-full overflow-x-clip bg-[#e9eef0] font-squish-body text-[#141010] antialiased [color-scheme:light]",
        className,
      )}
    >
      <nav
        aria-label="Main"
        className="sticky top-3.5 z-50 mx-4 mt-3.5 grid h-14 grid-cols-[1fr_auto_1fr] items-center rounded-full bg-white/75 pl-6 pr-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_8px_30px_rgba(0,0,0,.08)] backdrop-blur-[16px] backdrop-saturate-[1.4]"
      >
        <a href="#top" className="font-squish text-2xl font-black tracking-[-0.06em]">squish</a>
        <div className="hidden gap-7 text-[13px] font-medium md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={LINK_UNDERLINE}>{n.label}</a>
          ))}
        </div>
        <div className="col-start-3 flex justify-end gap-1">
          {[["Search", <SearchIcon key="s" />], ["Bag", <BagIcon key="b" />]].map(([label, icon]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className="grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/[.07]"
            >
              {icon}
            </button>
          ))}
        </div>
      </nav>

      {/* CLASSIC STORY: card expands, clog lands on "classic", zoom into foam, then into the charm */}
      <section data-sec="story" id="classic" className={`${m.vars} relative -mt-[70px] h-[6200px]`}>
        <div className={cx(PIN, "bg-[#e9eef0]")}>
          <div
            className={cx(m.stage, "absolute inset-0 z-[1]")}
            style={{ background: `radial-gradient(110% 90% at 50% 35%, #ff7a3d, ${ACCENT} 48%, #c93306)` }}
          />
          <p className={cx(m.introMark, DISP, "absolute inset-x-0 top-[calc(50%-112px)] z-[4] text-center text-[28px] text-white")}>
            squish
          </p>
          <h2 className={cx(m.storyWord, DISP, "absolute inset-x-0 -bottom-[0.05em] z-[2] text-center text-[clamp(120px,22vw,360px)] text-white")}>
            classic
          </h2>
          <div className={cx(m.storyShoe, "absolute left-1/2 top-[54%] z-[3] w-[92vw] md:w-[min(700px,60vw)]")}>
            <div className={m.shoeZoom}>
              <div className={cx(m.shoeCharm, "relative")}>
                <img className={cx(SHOE, m.shoeBlur)} src={IMG.orange} alt="Classic foam clog in orange" />
                <div className={cx(m.charmRing, "absolute left-[23.9%] top-[41.3%] aspect-square w-[9.6%] rounded-full")} />
                <div className={cx(m.charm, "absolute left-[23.9%] top-[41.3%] aspect-square w-[6.4%]")}>
                  <Charm />
                </div>
              </div>
            </div>
          </div>
          <Meta
            className={cx(m.storyMeta, "absolute left-5 top-[120px] z-[4] max-w-[300px] md:left-12")}
            ink="#1a0a04"
            tag="The classic"
            desc="The original foam clog. Light as air, waterproof, and made to be worn everywhere."
          />
          <div className={cx(m.storyCount, COUNT, "text-[#1a0a04]")}>01 / 05</div>
          <h2
            className={cx(
              m.matTxt,
              DISP,
              "absolute bottom-20 left-5 z-[4] whitespace-pre-line text-[clamp(64px,8vw,124px)] text-white [text-shadow:0_10px_40px_rgba(80,20,0,.25)] md:bottom-14 md:left-12",
            )}
          >
            {"made of\ncloudfoam."}
          </h2>
          <div className={cx(m.matChips, "absolute bottom-4 left-5 z-[4] flex flex-wrap justify-start gap-2.5 md:bottom-14 md:left-auto md:right-12 md:justify-end")}>
            {["Ultralight", "Waterproof", "Rinse clean"].map((c) => (
              <span
                key={c}
                className="inline-flex min-h-11 items-center rounded-full border border-white/40 bg-white/15 px-[18px] text-[13px] font-semibold text-white backdrop-blur-[10px]"
              >
                {c}
              </span>
            ))}
          </div>
          <div
            className={cx(
              m.charmTag,
              "absolute right-12 top-1/2 z-[4] -mt-[60px] hidden rounded-2xl border border-white/45 bg-white/15 px-[22px] py-[18px] text-white backdrop-blur-[12px] md:block",
            )}
          >
            <b className="mb-2 block font-squish text-[34px] font-black leading-none tracking-[-0.05em]">pin your mood.</b>
            <span className="text-[13px] font-semibold">Clip-on charms · [YOUR COUNT] styles</span>
          </div>
          <p className={cx(m.storyHint, "absolute inset-x-0 bottom-11 z-[4] text-center text-xs uppercase tracking-[.24em] text-[#4a5458]")}>
            scroll
            <i className={cx(m.hintLine, "mx-auto mt-3 block h-[42px] w-px bg-[#4a5458]")} />
          </p>
        </div>
      </section>

      {/* COLORWAY SCENES */}
      {SCENES.map((s) => (
        <section key={s.id} data-sec="scene" id={s.id} className={SEC} style={{ background: s.base }}>
          <div className={PIN} style={{ background: s.bg }}>
            {s.deco === "bubbles" &&
              BUBBLES.map((b, i) => (
                <div
                  key={i}
                  className={cx(m.bubble, "absolute z-[2] rounded-full")}
                  style={{ "--k": b.k, width: b.s, height: b.s, left: b.left, top: b.top }}
                />
              ))}
            {s.deco === "clouds" && (
              <>
                <div className={cx(m.clouds, "absolute inset-0 z-[2]")}>
                  <Cloud w={520} h={150} left="-6%" top="14%" />
                  <Cloud w={380} h={120} left="62%" top="8%" />
                  <Cloud w={300} h={100} left="4%" top="58%" />
                </div>
                <div className={cx(m.clouds2, "pointer-events-none absolute inset-0 z-[4] opacity-70")}>
                  <Cloud w={700} h={180} left="20%" top="74%" />
                </div>
              </>
            )}
            {s.deco === "rings" && (
              <>
                <div className={cx(m.rings, "absolute inset-0 z-[2]")}>
                  <div className={cx(m.ring, "absolute left-1/2 top-1/2 size-[900px] rounded-full border-2 border-[rgba(160,190,255,.75)]")} />
                  <div
                    className={cx(m.ring, "absolute left-1/2 top-1/2 size-[620px] rounded-full border-2 border-[rgba(160,190,255,.75)]")}
                    style={{ animationDuration: "9s", animationDirection: "reverse" }}
                  />
                </div>
                <div className={cx(m.beam, "absolute -inset-y-[10%] left-[30%] z-[2] w-0.5")} />
                <div className={cx(m.beam, "absolute -inset-y-[10%] left-[64%] z-[2] w-0.5 rotate-[14deg]")} />
              </>
            )}
            <h2
              className={cx(m.word, WORD, DISP, s.align === "left" && "pl-12 text-left")}
              style={{ color: s.wordColor, fontSize: s.fs }}
            >
              {s.word}
            </h2>
            <div className={cx(CLOG, m[s.fly])}>
              <div className={m.bob}>
                <img className={SHOE} src={s.img} alt={s.alt} />
              </div>
            </div>
            <Meta className={cx(META, m.rise)} tag={s.tag} desc={s.desc} ink={s.ink} btn={s.btn} />
            <div className={cx(COUNT, m.rise)} style={{ color: s.ink }}>{s.num} / 05</div>
            <div className="absolute right-12 top-[146px] z-[4] hidden h-0.5 w-[90px] overflow-hidden bg-black/15 md:block" style={{ color: s.ink }}>
              <i className={cx(m.barFill, "block h-full bg-current")} />
            </div>
          </div>
        </section>
      ))}

      {/* SIX COLORS */}
      <section data-sec="scene" id="colors" className={cx(SEC, "bg-[#dff1f6]")}>
        <div className={cx(PIN, "bg-[radial-gradient(90%_90%_at_50%_45%,#f4fbfd,#cfe9f1)]")}>
          <div className={cx(m.wheel, "relative z-[3] size-[360px] md:size-[600px]")}>
            {SPOKES.map((img, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 -ml-[75px] -mt-[43px] w-[150px] drop-shadow-[0_24px_24px_rgba(0,40,60,.22)] md:-ml-[120px] md:-mt-[70px] md:w-[240px]"
                style={{ transform: `rotate(${i * 60}deg) translateX(150px) rotate(90deg)` }}
              >
                <img className={SHOE} src={img} alt="" />
              </div>
            ))}
          </div>
          <p className={cx(m.rise, DISP, "absolute inset-x-0 bottom-14 z-[4] text-center text-[clamp(28px,3vw,40px)]")}>
            six colors. one shoe.
          </p>
        </div>
      </section>

      {/* AFTER DARK */}
      <section data-sec="scene" id="night" className={cx(SEC, "bg-[#cbb48c]")}>
        <div className={cx(PIN, "bg-[radial-gradient(70%_70%_at_50%_45%,#f3ead6,#cbb48c_55%,#3a2a1a)]")}>
          <h2 className={cx(m.word, WORD, DISP, "text-[clamp(110px,17vw,280px)] text-[#1b120b]")}>after dark</h2>
          <div className={cx(CLOG, m.flyR)} style={{ filter: "drop-shadow(0 50px 50px rgba(30,15,0,.5))" }}>
            <div className={m.bob}>
              <img className={SHOE} src={IMG.black} alt="Black gloss foam clog" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
            <div className={cx(m.sweep, "absolute inset-y-0 w-[22%]")} />
          </div>
          <Meta
            className={cx(META, m.rise)}
            tag="Midnight gloss"
            desc="The same cloud-soft foam, in a high-shine black for nights out."
            ink="#1b120b"
            allColors={false}
          />
        </div>
      </section>

      {/* OUT IN THE WILD */}
      <section data-sec="scene" id="wild" className={cx(SEC, "bg-[#e8f1f4]")}>
        <div className={cx(PIN, "bg-[#e8f1f4]")}>
          <h2
            className={cx(
              m.rise,
              DISP,
              "absolute left-5 top-[110px] z-[4] whitespace-pre-line text-[clamp(72px,9vw,140px)] md:left-12 md:top-1/2 md:-mt-[1.2em]",
            )}
          >
            {"out\nin the\nwild."}
          </h2>
          <div className={cx(m.track, "absolute bottom-10 left-5 z-[3] flex gap-[22px] md:bottom-auto md:left-[40%] md:top-1/2 md:-mt-[210px]")}>
            {TILES.map((t) => (
              <div
                key={t.cap}
                className="relative grid h-[300px] flex-[0_0_220px] place-items-center overflow-hidden rounded-[22px] shadow-[0_30px_60px_rgba(0,30,50,.18)] md:h-[420px] md:flex-[0_0_300px]"
                style={{ background: t.bg }}
              >
                <div
                  className="relative z-[3] w-[190px] drop-shadow-[0_22px_22px_rgba(0,0,0,.25)] md:w-[250px]"
                  style={{ transform: `rotate(${t.r}deg)` }}
                >
                  <img className={SHOE} src={t.img} alt="" />
                </div>
                <span className="absolute bottom-4 left-[18px] font-squish text-[15px] font-bold text-white [text-shadow:0_1px_8px_rgba(0,0,0,.35)]">
                  {t.cap}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAIR UP */}
      <section data-sec="scene" id="pair" className={SEC} style={{ background: ACCENT }}>
        <div className={PIN} style={{ background: `radial-gradient(100% 90% at 40% 30%, #ff7a3d, ${ACCENT} 50%, #c22f04)` }}>
          <h2 className={cx(m.word, WORD, DISP, "pl-12 text-left text-[clamp(110px,20vw,320px)] text-white")}>pair up</h2>
          <div className={cx(m.flyL, "absolute left-[2%] top-[14%] z-[3] w-[70vw] md:left-[8%] md:top-[12%] md:w-[min(520px,40vw)]")}>
            <div className={m.bob}>
              <img className={SHOE} src={chosen.img} alt={`${chosen.name} foam clog`} />
            </div>
          </div>
          <div className={cx(m.flyR, "absolute left-[24%] top-[30%] z-[3] w-[70vw] md:left-[28%] md:top-[46%] md:w-[min(520px,40vw)]")}>
            <div className={m.bob} style={{ animationDelay: "-2s" }}>
              <div className="-scale-x-100">
                <img className={SHOE} src={chosen.img} alt={`${chosen.name} foam clog`} />
              </div>
            </div>
          </div>
          <div
            className={cx(
              m.rise,
              "absolute inset-x-4 bottom-[84px] z-[5] rounded-[22px] bg-white/95 p-[18px] shadow-[0_40px_80px_rgba(90,20,0,.35)] md:inset-x-auto md:bottom-auto md:right-12 md:top-1/2 md:-mt-[250px] md:w-[340px] md:p-6",
            )}
          >
            <div className="flex items-baseline justify-between">
              <h3 className={cx(DISP, "text-[26px] md:text-[34px]")}>pick yours</h3>
              <span className="text-sm font-semibold text-[#4a3f3a]">[YOUR PRICE]</span>
            </div>
            <Label>Color — {chosen.name}</Label>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((w, i) => (
                <button
                  key={w.name}
                  type="button"
                  aria-label={w.name}
                  aria-pressed={i === pick}
                  onClick={() => setPick(i)}
                  className={cx("size-11 cursor-pointer rounded-full hover:scale-[1.08]", SPRING)}
                  style={{
                    background: w.hex,
                    boxShadow: i === pick ? "0 0 0 3px #ffffff, 0 0 0 5px #141010" : "inset 0 -4px 8px rgba(0,0,0,.18)",
                  }}
                />
              ))}
            </div>
            <Label>Size</Label>
            <div className="grid grid-cols-4 gap-2">
              {SIZES.map((z) => (
                <button
                  key={z}
                  type="button"
                  aria-pressed={z === size}
                  onClick={() => setSize(z)}
                  className={cx(
                    "min-h-11 cursor-pointer rounded-[10px] border-[1.5px] text-[13px] font-semibold",
                    z === size ? "border-[#141010] bg-[#141010] text-white" : "border-[#d6d0cc] bg-white text-[#141010]",
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={cx("mt-5 min-h-[52px] w-full cursor-pointer rounded-full bg-[#141010] text-[15px] font-semibold text-white hover:scale-[1.02]", SPRING)}
            >
              Add to bag
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer data-sec="foot" className={`${m.vars} overflow-hidden bg-[#0e0b09] px-12 pb-10 pt-[120px] text-[#f3ece6]`}>
        <p className={cx(DISP, "mb-10 flex justify-center overflow-hidden text-[27vw]")} aria-label="squish">
          {LETTERS.map((c, i) => (
            <span key={i} aria-hidden="true" className={cx(m.footLetter, "inline-block")} style={{ "--i": i }}>
              {c}
            </span>
          ))}
        </p>
        <div className="flex flex-wrap justify-between gap-6 text-[13px] text-[#b9aea6]">
          <div className="flex flex-wrap gap-6">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-[#f3ece6] hover:text-[#ff8a57]">{n.label}</a>
            ))}
          </div>
          <span>© squish — concept design</span>
        </div>
      </footer>
    </div>
  );
}

function Cloud({ w, h, left, top }) {
  return <div className="absolute rounded-full bg-white opacity-90 blur-[18px]" style={{ width: w, height: h, left, top }} />;
}

function Label({ children }) {
  return <p className="mb-2.5 mt-[18px] text-xs font-semibold uppercase tracking-[.06em] text-[#5a504b]">{children}</p>;
}
