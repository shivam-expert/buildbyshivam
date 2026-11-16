"use client";

import { useEffect, useRef, useState } from "react";
import m from "./FilmArchive.module.css"; // 3D tape faces only
import { ART, FILMS } from "./films";

const N = FILMS.length;
const START = 5;
const cx = (...c) => c.filter(Boolean).join(" ");
const pad = (n) => String(n).padStart(2, "0");
const clampIdx = (v) => Math.max(0, Math.min(N - 1, v));
const BLUE = "#2440e6";

/** Two-line cover title: "Night Swimmers" → "Night" / "Swimmers". */
function coverTitle(t) {
  const w = t.split(" ");
  if (w.length < 2) return [t];
  const k = Math.ceil(w.length / 2);
  return [w.slice(0, k).join(" "), w.slice(k).join(" ")];
}

// Detail panel children fade up in sequence once a tape is open.
const DELAYS = ["delay-[550ms]", "delay-[620ms]", "delay-[720ms]", "delay-[800ms]", "delay-[880ms]", "delay-[960ms]"];
const reveal = (open, n) =>
  open
    ? `translate-y-0 opacity-100 [transition:opacity_.8s_ease,translate_.9s_cubic-bezier(.2,.7,.2,1)] ${DELAYS[n]}`
    : "translate-y-[26px] opacity-0 [transition:opacity_.5s_ease,translate_.5s_ease]";

const BTN =
  "inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-current px-5 py-[13px] text-[11px] font-medium uppercase tracking-[.14em] transition-colors duration-[250ms]";

export default function FilmArchive({ className = "" }) {
  const rootRef = useRef(null);
  const sceneRef = useRef(null);
  const captionRef = useRef(null);
  const tapeRefs = useRef([]);
  const api = useRef({ open: () => {}, close: () => {} });

  const [isDetail, setIsDetail] = useState(false);
  const [shown, setShown] = useState(START); // tape under the caption
  const [openIdx, setOpenIdx] = useState(START); // tape in the detail panel

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;
    const caption = captionRef.current;
    const tapes = tapeRefs.current;
    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    /* ---------- layout ---------- */
    let W, H, S, mobile;
    function measure() {
      mobile = innerWidth < 760;
      W = Math.round(Math.max(118, Math.min(230, innerWidth * 0.145, innerHeight * 0.3)));
      H = Math.round(W * 1.62);
      S = W * 0.27;
      root.style.setProperty("--W", `${W}px`);
      root.style.setProperty("--H", `${H}px`);
      root.style.setProperty("--D", `${Math.round(W * 0.22)}px`);
      caption.style.top = `${innerHeight * 0.48 + H * 0.5 * 1.08 + 26}px`;
    }

    /** Shelf position for tape i when tape p is centred. */
    function browseT(i, p) {
      const d = i - p, ad = Math.abs(d), sg = Math.sign(d), t = Math.min(ad, 1);
      const A = W / 2 + W * 0.1 + S / 2;
      const x = ad <= 1 ? sg * ad * A : sg * (A + S * (ad - 1 - 0.017 * (ad * ad - 1)));
      const s = Math.max(0.5, 1 - 0.032 * Math.max(0, ad - 1)) * (1 + 0.08 * (1 - t));
      const z = -ad * 22 + (1 - t) * 40;
      return `translate3d(${x}px,0px,${z}px) scale(${s}) rotateY(${sg * t * 86}deg) rotateX(0deg)`;
    }
    /** The opened tape, spun round and tilted by the pointer. */
    function detailT(px, py) {
      const x = mobile ? 0 : innerWidth * 0.2;
      const y = mobile ? -innerHeight * 0.2 : 0;
      const s = mobile ? 0.95 : 1.24;
      return `translate3d(${x}px,${y}px,80px) scale(${s}) rotateY(${-378 + px * 14}deg) rotateX(${4 - py * 8}deg)`;
    }

    /* ---------- state + loop ---------- */
    let pos = START, target = START, mode = "browse", animating = false, open = -1;
    let mx = 0, my = 0, mxT = 0, myT = 0, lastShown = START;
    let hoverLock = false, lockX = 0, lastMouseX = 0, raf = 0;

    function tick() {
      if (!animating) {
        if (mode === "browse") {
          pos += (target - pos) * 0.085;
          for (let i = 0; i < N; i++) if (tapes[i]) tapes[i].style.transform = browseT(i, pos);
          const i = clampIdx(Math.round(pos));
          if (i !== lastShown) {
            lastShown = i;
            setShown(i);
          }
        } else if (tapes[open]) {
          mx += (mxT - mx) * 0.06;
          my += (myT - my) * 0.06;
          tapes[open].style.transform = detailT(mx, my);
        }
      }
      raf = requestAnimationFrame(tick);
    }

    /* ---------- open / close ---------- */
    function runTransition(ms) {
      animating = true;
      scene.classList.add(m.animating);
      later(() => {
        scene.classList.remove(m.animating);
        tapes.forEach((t) => t && (t.style.transitionDelay = ""));
        animating = false;
      }, ms);
    }
    function openNow(i) {
      if (mode !== "browse" || animating) return;
      mode = "detail";
      open = i;
      pos = target = i;
      mx = my = mxT = myT = 0;
      setOpenIdx(i);
      setIsDetail(true);
      runTransition(1250);
      tapes.forEach((t, j) => {
        if (!t) return;
        if (j === i) {
          t.style.transform = detailT(0, 0);
          t.style.opacity = 1;
          return;
        }
        const d = j - i, sg = Math.sign(d), ad = Math.abs(d);
        t.style.transitionDelay = `${ad * 22}ms`;
        t.style.transform = browseT(j, i).replace(/translate3d\(([-\d.]+)px/, (_, x) => `translate3d(${+x * 1.5 + sg * innerWidth * 0.55}px`);
        t.style.opacity = 0;
      });
    }
    function openTape(i) {
      if (mode !== "browse" || animating) return;
      if (Math.abs(pos - i) > 0.05) {
        target = i; // slide it to the centre first
        later(() => openNow(i), 380);
        return;
      }
      openNow(i);
    }
    function close() {
      if (mode !== "detail" || animating) return;
      mode = "browse";
      pos = target = open;
      hoverLock = true;
      lockX = lastMouseX;
      setIsDetail(false);
      runTransition(1250);
      tapes.forEach((t, j) => {
        if (!t) return;
        t.style.transitionDelay = j === open ? "0ms" : `${120 + (N - Math.abs(j - open)) * 18}ms`;
        t.style.transform = browseT(j, open);
        t.style.opacity = 1;
      });
    }
    api.current = { open: openTape, close, isDetail: () => mode === "detail" };

    /* ---------- input ---------- */
    let wheelTimer = 0, touchX = null, touchStart = 0;
    const onMouseMove = (e) => {
      lastMouseX = e.clientX;
      if (mode === "detail") {
        mxT = e.clientX / innerWidth - 0.5;
        myT = e.clientY / innerHeight - 0.5;
        return;
      }
      if (animating) return;
      if (hoverLock) {
        if (Math.abs(e.clientX - lockX) < 60) return;
        hoverLock = false;
      }
      const r = (e.clientX - innerWidth * 0.12) / (innerWidth * 0.76);
      target = clampIdx(Math.round(r * (N - 1)));
    };
    const onWheel = (e) => {
      if (mode !== "browse" || animating) return;
      target = clampIdx(target + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.006);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => (target = Math.round(target)), 140);
    };
    const onKey = (e) => {
      if (e.key === "Escape") return close();
      if (mode !== "browse") return;
      if (e.key === "ArrowRight") target = clampIdx(Math.round(target) + 1);
      if (e.key === "ArrowLeft") target = clampIdx(Math.round(target) - 1);
      if (e.key === "Enter" && e.target === document.body) openTape(Math.round(target));
    };
    const onTouchStart = (e) => {
      touchX = e.touches[0].clientX;
      touchStart = target;
    };
    const onTouchMove = (e) => {
      if (touchX == null || mode !== "browse") return;
      target = clampIdx(touchStart - (e.touches[0].clientX - touchX) / (S * 1.2));
    };
    const onTouchEnd = () => {
      touchX = null;
      target = Math.round(target);
    };
    const onResize = () => {
      measure();
      if (mode === "detail" && tapes[open]) tapes[open].style.transform = detailT(mx, my);
    };

    addEventListener("mousemove", onMouseMove);
    addEventListener("wheel", onWheel, { passive: true });
    addEventListener("keydown", onKey);
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: true });
    addEventListener("touchend", onTouchEnd);
    addEventListener("resize", onResize);

    measure();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(wheelTimer);
      timers.forEach(clearTimeout);
      removeEventListener("mousemove", onMouseMove);
      removeEventListener("wheel", onWheel);
      removeEventListener("keydown", onKey);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("touchend", onTouchEnd);
      removeEventListener("resize", onResize);
    };
  }, []);

  const cur = FILMS[shown];
  const film = FILMS[openIdx];

  return (
    <div
      ref={rootRef}
      style={{ "--glow": film.ac }}
      className={cx(
        m.root,
        "fixed inset-0 select-none overflow-hidden bg-[#ecebe7] font-kaito text-[#121212] antialiased [color-scheme:light]",
        className,
      )}
    >
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-[3.2vw] py-[26px] text-[11px] uppercase tracking-[.14em]">
        <div className="flex items-center gap-3.5 font-semibold">
          <span>Kaito Mori</span>
          <i className="h-px w-[46px] bg-current opacity-50" />
          <span className="font-medium opacity-70">Film Archive</span>
        </div>
        <nav className="hidden gap-7 opacity-75 md:flex">
          {["Films", "About", "Journal", "Contact"].map((l) => (
            <a key={l} href="#" className="hover:text-[#2440e6]">{l}</a>
          ))}
        </nav>
      </header>

      {[
        ["映画", "left-[3vw]", "-translate-x-10"],
        ["の記憶", "right-[3vw]", "translate-x-10"],
      ].map(([text, side, away]) => (
        <div
          key={text}
          aria-hidden="true"
          className={cx(
            "pointer-events-none fixed top-1/2 z-0 -translate-y-[52%] whitespace-nowrap font-kaito-jp text-[22vw] font-semibold leading-none text-[#c6cedd] [writing-mode:vertical-rl] [transition:opacity_.9s_ease,translate_1.1s_cubic-bezier(.7,0,.2,1)] md:text-[min(11vw,17vh)]",
            side,
            isDetail ? cx("opacity-0", away) : "opacity-40 md:opacity-60",
          )}
        >
          {text}
        </div>
      ))}
      <div
        className={cx(
          "pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(38vmax_30vmax_at_70%_52%,var(--glow),transparent_70%)] mix-blend-multiply transition-opacity duration-[1.2s]",
          isDetail ? "opacity-[.22]" : "opacity-0",
        )}
      />

      <div
        ref={sceneRef}
        className="fixed inset-0 z-[5] [perspective-origin:50%_45%] [perspective:1700px]"
        onClick={() => api.current.isDetail?.() && api.current.close()}
      >
        <div className="absolute left-1/2 top-[48%] [transform-style:preserve-3d]">
          {FILMS.map((f, i) => {
            const spine = (
              <>
                <div className={m.spArt} dangerouslySetInnerHTML={{ __html: ART[i] }} />
                <div className={m.spTitle}>{f.t}</div>
                <div className={m.spStudio}>MORI</div>
                <span className={m.vhs}>VHS</span>
              </>
            );
            return (
              <div
                key={f.t}
                ref={(el) => {
                  tapeRefs.current[i] = el;
                }}
                className={m.tape}
                style={{ "--bg": f.bg, "--ink2": f.ink2, "--spine": f.spine, "--spineInk": f.spineInk }}
                role="button"
                tabIndex={0}
                aria-label={`${f.t}, ${f.y}. Open details`}
                onClick={(e) => {
                  e.stopPropagation();
                  api.current.open(i);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    api.current.open(i);
                  }
                }}
              >
                <div className={cx(m.face, m.front)}>
                  <div className={m.cvTop}>A Kaito Mori Film</div>
                  <div className={m.cvTitle}>
                    {coverTitle(f.t).map((line, k) => (
                      <div key={k}>{line}</div>
                    ))}
                  </div>
                  <div className={m.cvArt} dangerouslySetInnerHTML={{ __html: ART[i] }} />
                  <span className={m.vhs}>VHS</span>
                  <div className={m.grain} />
                  <div className={m.sheen} />
                </div>
                <div className={cx(m.face, m.back)}>
                  <div className={m.backHead}>
                    {f.jp} · {f.y}
                  </div>
                  <div>{f.syn}</div>
                  <div className={m.bars} />
                </div>
                <div className={cx(m.face, m.side, m.sideL)}>{spine}</div>
                <div className={cx(m.face, m.side, m.sideR)}>{spine}</div>
                <div className={cx(m.face, m.cap, m.capT)} />
                <div className={cx(m.face, m.cap, m.capB)} />
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={captionRef}
        className={cx("fixed left-1/2 z-[6] -translate-x-1/2 text-center transition-opacity duration-500", isDetail && "opacity-0")}
      >
        <h2 key={`t${shown}`} className={cx(m.swap, "m-0 text-[clamp(16px,1.5vw,22px)] font-semibold tracking-[-.01em]")} style={{ color: BLUE }}>
          {cur.t}
        </h2>
        <p key={`m${shown}`} className={cx(m.swap, "mt-1.5 text-[10px] uppercase tracking-[.16em] opacity-55")}>
          {cur.y} · {cur.g} · {cur.m} min
        </p>
      </div>
      <div
        className={cx(
          "fixed inset-x-[3.2vw] bottom-6 z-[6] flex justify-between text-[10px] uppercase tracking-[.16em] transition-opacity duration-500",
          isDetail ? "opacity-0" : "opacity-55",
        )}
      >
        <span>
          {pad(shown + 1)} / {pad(N)}
        </span>
        <span className="hidden sm:inline">Scroll · Hover · Click a tape</span>
      </div>

      <section
        aria-live="polite"
        inert={!isDetail}
        className={cx(
          "fixed inset-x-[6vw] bottom-[max(7vh,96px)] z-10 md:bottom-auto md:left-[7vw] md:right-auto md:top-1/2 md:w-[min(460px,38vw)] md:-translate-y-[46%]",
          isDetail ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div className={cx("text-[11px] uppercase tracking-[.16em] text-black/60", reveal(isDetail, 0))}>
          {film.t} / {film.jp}
        </div>
        <h1
          className={cx(
            "mb-3.5 mt-2.5 text-[clamp(44px,6.4vw,104px)] font-semibold leading-[.92] tracking-[-.035em]",
            reveal(isDetail, 1),
          )}
          style={{ color: BLUE }}
        >
          {film.t}
        </h1>
        <div className={cx("text-[11px] uppercase tracking-[.16em] text-black/60", reveal(isDetail, 2))}>
          {film.y} / {film.g} / {film.m} min
        </div>
        <p className={cx("mb-2 mt-3.5 font-kaito-serif text-[clamp(17px,1.35vw,21px)] leading-[1.4] md:mb-3.5 md:mt-[22px]", reveal(isDetail, 3))}>
          {film.syn}
        </p>
        <div className={cx("font-kaito-serif text-base italic text-black/60", reveal(isDetail, 4))}>
          Written and directed by Kaito Mori. 監督作品
        </div>
        <div className={cx("mt-5 flex items-center gap-3.5 md:mt-[34px]", reveal(isDetail, 5))}>
          <button type="button" className={cx(BTN, "border-[#2440e6] bg-[#2440e6] text-white hover:border-[#121212] hover:bg-[#121212]")}>
            ▶&nbsp; Play trailer
          </button>
          <button
            type="button"
            className={cx(BTN, "bg-transparent text-[#121212] hover:bg-[#121212] hover:text-[#ecebe7]")}
            onClick={() => api.current.close()}
          >
            ← Archive
          </button>
        </div>
      </section>
    </div>
  );
}
