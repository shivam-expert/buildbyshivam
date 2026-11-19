"use client";

import { useEffect, useRef, useState } from "react";
import "./landing.css"; // scoped under .bbs — see the note at the top of that file

const ACCENT = "#C8FF2E";
const AGENTS = ["b", "r", "y", "k", "b", "r", "y", "k", "b", "r", "y", "k"];
const AGENT_HEX = { b: "#2F5BFF", r: "#FF3B30", y: "#FFC400", k: "#111111" };
const VERBS = ["drafted", "styled", "wired", "shipped", "tuned", "animated", "polished"];

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Build by Shivam — immersive landing page.
 * Scroll motion is pure CSS (scroll timelines in landing.css). This component adds:
 * pointer parallax + custom cursor, scroll-velocity skew, the "agent swarm" that
 * builds each block as it scrolls into view, and its live log.
 */
export default function BuildByShivamLanding({ className = "" }) {
  const rootRef = useRef(null);
  const handlers = useRef({ move: () => {}, leave: () => {} });
  const [logs, setLogs] = useState([]);
  const [shipped, setShipped] = useState(0);
  const [status, setStatus] = useState("Booting swarm…");

  useEffect(() => {
    const root = rootRef.current;
    const calm = prefersReduced();
    const timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));

    /* ---------- pointer + velocity ---------- */
    let tx = 0, ty = 0, cx = 0, cy = 0, px = 0, py = 0, dx = 0, dy = 0, rx = 0, ry = 0;
    let vel = 0, skew = 0, lastY = scrollY, seen = false, hot = null, fast = "off", raf = 0;
    const resetEl = (el) => {
      el.style.setProperty("--nx", "0");
      el.style.setProperty("--ny", "0");
    };
    handlers.current.move = (e) => {
      if (calm) return;
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
      px = e.clientX;
      py = e.clientY;
      if (!seen) {
        seen = true;
        dx = rx = px;
        dy = ry = py;
        root.setAttribute("data-cursor", "on");
      }
      const t = e.target?.closest?.(".skill, .proj, .btn") ?? null;
      if (t !== hot) {
        if (hot) resetEl(hot);
        hot = t;
      }
      if (t) {
        const r = t.getBoundingClientRect();
        t.style.setProperty("--nx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        t.style.setProperty("--ny", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        t.style.setProperty("--sx", `${Math.round(e.clientX - r.left)}px`);
        t.style.setProperty("--sy", `${Math.round(e.clientY - r.top)}px`);
      }
    };
    handlers.current.leave = () => {
      if (hot) resetEl(hot);
      hot = null;
      tx = ty = 0;
      seen = false;
      root.setAttribute("data-cursor", "off");
    };
    const onScroll = () => {
      vel += scrollY - lastY;
      lastY = scrollY;
    };
    addEventListener("scroll", onScroll, { passive: true });

    /* ---------- agent swarm ---------- */
    const nodes = [...root.querySelectorAll(".ag-cur")];
    const use = innerWidth < 700 ? nodes.slice(0, 6) : nodes;
    const cs = use.map((node, i) => ({
      node, el: null, fx: 0.5, fy: 0.5, x: -80 - i * 20, y: 80 + i * 36, idle: undefined,
      hx: 0.08 + Math.random() * 0.84, hy: 0.14 + Math.random() * 0.66, ph: Math.random() * 6.28,
    }));
    const agents = use.map((n) => n.dataset.c);
    const queue = [];
    const left = {};
    let nextCur = 0, active = 0, mins = 0, shippedN = 0, curSec = null, pump = null, logList = [];
    const secOf = (el) => el.closest("[data-build]")?.getAttribute("data-build") ?? "Hero";
    const log = (color, msg, counts) => {
      mins++;
      if (counts) shippedN++;
      const t = `${10 + Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
      logList = [{ id: mins, t, c: color, m: msg }, ...logList].slice(0, 5);
      setLogs(logList);
      setShipped(shippedN);
    };
    function pumpQueue() {
      const el = queue.shift();
      if (!el) {
        pump = null;
        return;
      }
      const ci = nextCur++ % cs.length;
      const c = cs[ci];
      const ag = agents[ci];
      c.el = el;
      c.fx = 0.15 + Math.random() * 0.7;
      c.fy = 0.2 + Math.random() * 0.6;
      active++;
      const code = el.getAttribute("data-code") || "<div>";
      later(480, () => {
        el.style.setProperty("--agc", AGENT_HEX[ag]);
        el.classList.add("drafting");
      });
      later(1150, () => {
        el.classList.add("done");
        log(ag, `${VERBS[code.length % VERBS.length]} ${code}`, true);
        const sec = secOf(el);
        left[sec] = (left[sec] || 1) - 1;
        if (left[sec] === 0) log("k", `reviewed <${sec} /> ✓`, false);
        active--;
        if (!active && !queue.length) {
          curSec = null;
          setStatus("Idle · scroll to the next section");
        }
      });
      later(1650, () => {
        if (c.el === el) c.el = null;
      });
      pump = setTimeout(pumpQueue, queue.length > 6 ? 110 : 190);
    }
    const enqueue = (el) => {
      if (calm || !cs.length) return el.classList.add("done");
      queue.push(el);
      const sec = secOf(el);
      if (sec !== curSec) {
        curSec = sec;
        setStatus(`Swarm building <${sec} />`);
      }
      if (!pump) pumpQueue();
    };
    const blocks = [...root.querySelectorAll(".bt")];
    blocks.forEach((el) => {
      const k = secOf(el);
      left[k] = (left[k] || 0) + 1;
    });
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          enqueue(en.target);
        }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    blocks.forEach((el) => io.observe(el));

    /* ---------- showreel video ---------- */
    const playVideos = () =>
      root.querySelectorAll("video").forEach((v) => {
        v.muted = true;
        if (calm) return v.pause();
        if (v.paused) v.play()?.catch?.(() => {});
      });
    playVideos();
    const vidTimer = setInterval(playVideos, 2000);

    /* ---------- frame loop ---------- */
    const s = root.style;
    function tick() {
      raf = requestAnimationFrame(tick);
      if (calm) return;
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      dx += (px - dx) * 0.35;
      dy += (py - dy) * 0.35;
      rx += (px - rx) * 0.12;
      ry += (py - ry) * 0.12;
      const now = performance.now() / 1000;
      for (const c of cs) {
        let gx, gy;
        if (c.el) {
          const r = c.el.getBoundingClientRect();
          gx = r.left + r.width * c.fx;
          gy = Math.max(16, Math.min(innerHeight - 40, r.top + Math.min(r.height, innerHeight) * c.fy));
        } else {
          gx = c.hx * innerWidth + Math.sin(now * 0.55 + c.ph) * 80;
          gy = c.hy * innerHeight + Math.cos(now * 0.45 + c.ph * 1.3) * 60;
        }
        c.x += (gx - c.x) * (c.el ? 0.11 : 0.04);
        c.y += (gy - c.y) * (c.el ? 0.11 : 0.04);
        c.node.style.transform = `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,0)`;
        const idle = !c.el;
        if (idle !== c.idle) {
          c.idle = idle;
          c.node.classList.toggle("idle", idle);
        }
      }
      const target = Math.max(-9, Math.min(9, vel * 0.3));
      vel *= 0.7;
      skew += (target - skew) * 0.18;
      s.setProperty("--mx", cx.toFixed(3));
      s.setProperty("--my", cy.toFixed(3));
      s.setProperty("--dx", `${dx.toFixed(1)}px`);
      s.setProperty("--dy", `${dy.toFixed(1)}px`);
      s.setProperty("--rx2", `${rx.toFixed(1)}px`);
      s.setProperty("--ry2", `${ry.toFixed(1)}px`);
      s.setProperty("--skew", `${skew.toFixed(2)}deg`);
      const f = Math.abs(skew) > 2.5 ? "on" : "off";
      if (f !== fast) {
        fast = f;
        root.setAttribute("data-fast", f);
      }
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      clearInterval(vidTimer);
      io.disconnect();
      timers.forEach(clearTimeout);
      clearTimeout(pump);
      handlers.current = { move: () => {}, leave: () => {} };
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-swarm="on"
      className={`bbs ${className}`}
      style={{ "--lime": ACCENT }}
      onPointerMove={(e) => handlers.current.move(e)}
      onPointerLeave={() => handlers.current.leave()}
    >
      <div className="progress" aria-hidden="true" />
      <div className="cursor" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
      <div className="swarm" aria-hidden="true">
        {AGENTS.map((c, i) => (
          <div key={i} className={`ag-cur ag-${c}`} data-c={c}>
            <svg viewBox="0 0 24 24">
              <path d="M3 2l17 9-7 2-3 7z" />
            </svg>
          </div>
        ))}
      </div>

      <div className="alog" aria-hidden="true">
        <div className="alog-head">
          <span>Agent log</span>
          <span>
            {AGENTS.length} agents · {shipped} shipped
          </span>
        </div>
        <ol className="alog-list">
          {Array.from({ length: 5 }, (_, i) => {
            const e = logs[i];
            return e ? (
              <li key={e.id}>
                <time>{e.t}</time>
                <b className={`ag-tag ag-${e.c}`} />
                <span>{e.m}</span>
              </li>
            ) : (
              <li key={`empty-${i}`} className="empty" />
            );
          })}
        </ol>
        <div className="alog-foot">
          <i className="alog-dot" />
          {status}
        </div>
      </div>

      <nav className="nav bt" data-code="&lt;nav.top-bar&gt;" aria-label="Main">
        <a href="#top" className="disp" style={{ textDecoration: "none", color: "#000", fontWeight: "800", fontSize: "18px" }}>buildby<span style={{ background: "#000", color: "var(--lime)", padding: "2px 8px", borderRadius: "8px", marginLeft: "2px" }}>shivam</span></a>
        <div className="nav-links">
          <a href="#skills">Skills</a>
          <a href="#process">Process</a>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </div>
        <a href="#contact" className="btn btn-lime" style={{ minHeight: "44px" }}><span className="dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>Start a project</a>
      </nav>

  
      <header className="hero" id="top" data-build="Hero" data-swarm-root="1">
        <div className="boot-grid" aria-hidden="true"></div>
        <div className="blob" style={{ width: "520px", height: "420px", right: "-120px", top: "40px" }}></div>
        <div className="blob" style={{ width: "380px", height: "320px", left: "-160px", bottom: "0px", opacity: ".35" }}></div>
        <div className="hero-inner hero-trio">
          <div className="hero-l">
            <h1 className="disp bt" data-code="&lt;h1.hero-title&gt;">
              <span className="line"><span style={{ "--d": "1.4s" }}>Frontends</span></span>
              <span className="line"><span style={{ "--d": "1.7s" }}>that <span className="hl">move</span></span></span>
              <span className="line"><span style={{ "--d": "2s" }}>people <span className="hl hl-lime">to act.</span></span></span>
            </h1>
          </div>

          <div className="char-stage photo-stage bt bt-px" data-code="&lt;img#shivam&gt;">
            <div className="char-par" style={{ position: "absolute", inset: "0" }}>
              <div className="photo-light" aria-hidden="true"></div>
              <div className="char-ring spin-scroll"></div>
              <div className="photo-floor" aria-hidden="true"></div>
              <img
                className="photo-cut"
                src="/home/shivam-cutout.png"
                width="315"
                height="840"
                fetchPriority="high"
                alt="Shivam standing in a grey suit and burgundy tie, lit from behind by a soft studio light"
              />
              <span className="chip bt" data-code="&lt;chip:react.js&gt;" style={{ left: "-20%", top: "12%", "--d": "3.4s" }}><i></i>React.js</span>
              <span className="chip chip-l bt" data-code="&lt;chip:next.js&gt;" style={{ right: "-16%", top: "6%", "--d": "3.6s" }}><i style={{ background: "#000" }}></i>Next.js</span>
              <span className="chip bt" data-code="&lt;chip:gsap&gt;" style={{ left: "-22%", bottom: "38%", "--d": "3.8s" }}><i></i>GSAP</span>
              <span className="chip chip-l bt" data-code="&lt;chip:shopify&gt;" style={{ right: "-22%", top: "26%", "--d": "4s" }}><i style={{ background: "#000" }}></i>Shopify</span>
              <div className="badge bt" data-code="&lt;badge.status&gt;">
                <svg className="badge-ring" viewBox="0 0 132 132" width="132" height="132" aria-hidden="true">
                  <defs><path id="circ" d="M66 66 m-52 0 a52 52 0 1 1 104 0 a52 52 0 1 1 -104 0"></path></defs>
                  <circle cx="66" cy="66" r="64" fill="#fff" stroke="#000" strokeWidth="2"></circle>
                  <text fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="12.5" letterSpacing="2.4" fill="#000"><textPath href="#circ">OPEN FOR FREELANCE • OPEN FOR FREELANCE •</textPath></text>
                </svg>
                <div className="badge-core"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"></path></svg></div>
              </div>
            </div>
          </div>

          <div className="hero-r">
            <p className="bt" data-code="&lt;p.intro&gt;">I’m Shivam, a freelance frontend developer with 4+ years of building fast, animated websites in React, Next.js and Shopify for healthcare, fintech and events brands.</p>
            <div className="bt" data-code="&lt;div.cta-row&gt;" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <a href="#contact" className="btn"><span className="dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"></path></svg></span>Book a call</a>
              <a href="#work" className="btn" style={{ borderColor: "transparent" }}><span className="dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"></path></svg></span>See the work</a>
            </div>
          </div>
        </div>

        <div className="marquee bt" data-code="&lt;marquee.stack&gt;" aria-hidden="true">
          <div className="marquee-track disp">
            <span>React.js <b>✦</b> Next.js <b>✦</b> Tailwind CSS <b>✦</b> GSAP <b>✦</b> Shopify <b>✦</b> WordPress <b>✦</b> Wix <b>✦</b></span>
            <span>React.js <b>✦</b> Next.js <b>✦</b> Tailwind CSS <b>✦</b> GSAP <b>✦</b> Shopify <b>✦</b> WordPress <b>✦</b> Wix <b>✦</b></span>
          </div>
        </div>
      </header>

  
      <section className="reel" aria-label="Showreel" data-build="Reel">
        <div className="reel-pin">
          <div className="reel-frame bt bt-px" data-code="&lt;video#halo-reel&gt;">
            <video className="reel-video" src="/home/reel.mp4" muted loop playsInline preload="auto" aria-hidden="true"></video>
            <div className="reel-shade"></div>
            <svg className="reel-ring" viewBox="0 0 400 120" aria-hidden="true"><ellipse cx="200" cy="60" rx="190" ry="48" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="8 14"></ellipse></svg>
          </div>
          <div className="reel-copy bt" data-code="&lt;h2.reel-intro&gt;">
            <p className="disp reel-l1">Hi, I’m Shivam.</p>
            <p className="disp reel-l2">I put a <span className="hl hl-lime">glow</span> on interfaces.</p>
          </div>
        </div>
      </section>

  
      <section className="stage" id="skills" data-build="Skills">
        <div className="blob" style={{ width: "420px", height: "300px", right: "-140px", top: "-120px", opacity: ".35" }}></div>
        <div className="bt" data-code="&lt;header.skills&gt;" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "32px", flexWrap: "wrap", position: "relative" }}>
          <div>
            <span className="tag" style={{ color: "#fff" }}><i>↓</i>What I build with</span>
            <h2 className="disp h2">A stack picked<br />for speed and motion</h2>
          </div>
          <p className="lead" style={{ maxWidth: "26em" }}>Every build ships with clean components, sharp performance scores and animation that serves the story.</p>
        </div>
        <div className="skills">
          <article className="skill" style={{ "--rr": "-4deg" }}>
            <div className="skill-ico bt" data-code="&lt;icon&gt;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="4"></ellipse><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"></ellipse><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"></ellipse><circle cx="12" cy="12" r="1.6" fill="currentColor"></circle></svg></div>
            <h3 className="disp skill-t bt" data-code="&lt;h3.skill&gt;">React &amp; Next.js</h3>
            <p className="skill-p bt" data-code="&lt;p.copy&gt;">Component-driven sites and apps with server rendering, routing and SEO baked in.</p>
          </article>
          <article className="skill" style={{ "--rr": "3deg" }}>
            <div className="skill-ico bt" data-code="&lt;icon&gt;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 17c3-6 6-6 9 0s6 6 9 0"></path><path d="M3 9c3-6 6-6 9 0s6 6 9 0" opacity=".5"></path></svg></div>
            <h3 className="disp skill-t bt" data-code="&lt;h3.skill&gt;">GSAP motion</h3>
            <p className="skill-p bt" data-code="&lt;p.copy&gt;">Scroll stories, page transitions and micro-interactions that feel smooth on every device.</p>
          </article>
          <article className="skill" style={{ "--rr": "-3deg" }}>
            <div className="skill-ico bt" data-code="&lt;icon&gt;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M5 8h14l-1.4 12H6.4z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path></svg></div>
            <h3 className="disp skill-t bt" data-code="&lt;h3.skill&gt;">Shopify</h3>
            <p className="skill-p bt" data-code="&lt;p.copy&gt;">Custom Liquid sections and theme work that keep stores fast and easy for owners to edit.</p>
          </article>
          <article className="skill" style={{ "--rr": "4deg" }}>
            <div className="skill-ico bt" data-code="&lt;icon&gt;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"></rect><path d="M3 9h18M8 14h4"></path></svg></div>
            <h3 className="disp skill-t bt" data-code="&lt;h3.skill&gt;">WordPress &amp; Wix</h3>
            <p className="skill-p bt" data-code="&lt;p.copy&gt;">Marketing sites your team can update themselves, styled with Tailwind-grade polish.</p>
          </article>
        </div>
      </section>

  
      <section className="about" id="about" data-build="About">
        <span className="tag"><i>↓</i>About</span>
        <p className="disp statement bt" data-code="&lt;p.statement&gt;">
          <span className="w">I</span> <span className="w">turn</span> <span className="w">designs</span> <span className="w">into</span> <span className="w hl">websites</span> <span className="w">that</span> <span className="w">load</span> <span className="w">fast,</span> <span className="w">scroll</span> <span className="w">smooth</span> <span className="w">and</span> <span className="w">make</span> <span className="w">people</span> <span className="w hl hl-lime">stay.</span>
        </p>
        <figure className="me">
          <div className="me-frame bt bt-px" data-code="&lt;img#portrait&gt;"><img className="me-img" src="/home/portrait.jpg" alt="Shivam in a black-and-white portrait, lit by a ring light around his shoulders" /></div>
          <figcaption className="me-cap bt" data-code="&lt;figcaption&gt;"><span className="disp me-name">That’s me.</span><span>Frontend developer, motion nerd, ring-light owner.</span></figcaption>
        </figure>
        <div className="pills" aria-label="Sectors I work in">
          <span className="pill pill-d bt" data-code="&lt;span.pill&gt;" style={{ left: "4%", top: "30px", "--r": "-7deg", "--x": "-120px" }}>Healthcare</span>
          <span className="pill bt" data-code="&lt;span.pill&gt;" style={{ left: "30%", top: "120px", "--r": "5deg", "--x": "-60px" }}>Fintech</span>
          <span className="pill pill-l bt" data-code="&lt;span.pill&gt;" style={{ left: "54%", top: "20px", "--r": "-4deg", "--x": "80px" }}>Exhibitions &amp; events</span>
          <span className="pill bt" data-code="&lt;span.pill&gt;" style={{ left: "66%", top: "160px", "--r": "9deg", "--x": "140px" }}>E-commerce</span>
          <span className="pill pill-d bt" data-code="&lt;span.pill&gt;" style={{ left: "12%", top: "200px", "--r": "3deg", "--x": "-160px" }}>Product launches</span>
        </div>
      </section>

  
      <section className="proc" id="process" data-build="Process">
        <div className="proc-pin">
          <div className="proc-nums" aria-hidden="true"><span className="pnum disp" style={{ "--a": "0%", "--b": "7%", "--c": "20%", "--d": "27%" }}>01</span><span className="pnum disp" style={{ "--a": "22%", "--b": "30%", "--c": "45%", "--d": "52%" }}>02</span><span className="pnum disp" style={{ "--a": "47%", "--b": "55%", "--c": "70%", "--d": "77%" }}>03</span><span className="pnum disp plast" style={{ "--a": "72%", "--b": "80%", "--c": "100%", "--d": "100%" }}>04</span></div>
          <div className="proc-head bt" data-code="&lt;header.process&gt;">
            <span className="tag" style={{ color: "#fff" }}><i>↓</i>How we’ll work</span>
            <h2 className="disp h2">From first call to launch day</h2>
          </div>
          <div className="proc-cards">
          <article data-code="&lt;article.step&gt;" className="bt pstep" style={{ "--a": "0%", "--b": "7%", "--c": "20%", "--d": "27%" }}>
            <div className="shard shard-top">
            <div className="pcard">
              <div className="disp pcard-n">01</div>
              <div className="pcard-body"><p className="pcard-k">Step 1 of 4</p><h3 className="disp pcard-t">Discover</h3><p className="pcard-p">A short call about your audience, goals and deadline, then a clear scope and quote you can say yes to.</p></div>
            </div>
            </div>
            <div className="shard shard-bot" aria-hidden="true">
            <div className="pcard" aria-hidden="true">
              <div className="disp pcard-n">01</div>
              <div className="pcard-body"><p className="pcard-k">Step 1 of 4</p><p className="disp pcard-t">Discover</p><p className="pcard-p">A short call about your audience, goals and deadline, then a clear scope and quote you can say yes to.</p></div>
            </div>
            </div>
          </article>
          <article data-code="&lt;article.step&gt;" className="bt pstep" style={{ "--a": "22%", "--b": "30%", "--c": "45%", "--d": "52%" }}>
            <div className="shard shard-top">
            <div className="pcard pcard-lime">
              <div className="disp pcard-n">02</div>
              <div className="pcard-body"><p className="pcard-k">Step 2 of 4</p><h3 className="disp pcard-t">Plan the motion</h3><p className="pcard-p">We map which moments deserve animation and which should stay still, so motion supports the message.</p></div>
            </div>
            </div>
            <div className="shard shard-bot" aria-hidden="true">
            <div className="pcard pcard-lime" aria-hidden="true">
              <div className="disp pcard-n">02</div>
              <div className="pcard-body"><p className="pcard-k">Step 2 of 4</p><p className="disp pcard-t">Plan the motion</p><p className="pcard-p">We map which moments deserve animation and which should stay still, so motion supports the message.</p></div>
            </div>
            </div>
          </article>
          <article data-code="&lt;article.step&gt;" className="bt pstep" style={{ "--a": "47%", "--b": "55%", "--c": "70%", "--d": "77%" }}>
            <div className="shard shard-top">
            <div className="pcard">
              <div className="disp pcard-n">03</div>
              <div className="pcard-body"><p className="pcard-k">Step 3 of 4</p><h3 className="disp pcard-t">Build</h3><p className="pcard-p">Pixel-careful development with weekly preview links, so you see real progress, not screenshots.</p></div>
            </div>
            </div>
            <div className="shard shard-bot" aria-hidden="true">
            <div className="pcard" aria-hidden="true">
              <div className="disp pcard-n">03</div>
              <div className="pcard-body"><p className="pcard-k">Step 3 of 4</p><p className="disp pcard-t">Build</p><p className="pcard-p">Pixel-careful development with weekly preview links, so you see real progress, not screenshots.</p></div>
            </div>
            </div>
          </article>
          <article data-code="&lt;article.step&gt;" className="bt pstep plast" style={{ "--a": "72%", "--b": "80%", "--c": "100%", "--d": "100%" }}>
            <div className="shard shard-top">
            <div className="pcard pcard-lime">
              <div className="disp pcard-n">04</div>
              <div className="pcard-body"><p className="pcard-k">Step 4 of 4</p><h3 className="disp pcard-t">Launch &amp; hand over</h3><p className="pcard-p">Performance checks, SEO basics and a walkthrough so your team can run the site with confidence.</p></div>
            </div>
            </div>
            <div className="shard shard-bot" aria-hidden="true">
            <div className="pcard pcard-lime" aria-hidden="true">
              <div className="disp pcard-n">04</div>
              <div className="pcard-body"><p className="pcard-k">Step 4 of 4</p><p className="disp pcard-t">Launch &amp; hand over</p><p className="pcard-p">Performance checks, SEO basics and a walkthrough so your team can run the site with confidence.</p></div>
            </div>
            </div>
          </article>
          </div>
          <div className="proc-rail bt" data-code="&lt;nav.rail&gt;" aria-hidden="true"><div className="rail-seg" style={{ "--a": "0%", "--b": "7%", "--c": "20%", "--d": "27%" }}><span className="rail-fill"></span><span className="rail-l">Discover</span></div><div className="rail-seg" style={{ "--a": "22%", "--b": "30%", "--c": "45%", "--d": "52%" }}><span className="rail-fill"></span><span className="rail-l">Plan the motion</span></div><div className="rail-seg" style={{ "--a": "47%", "--b": "55%", "--c": "70%", "--d": "77%" }}><span className="rail-fill"></span><span className="rail-l">Build</span></div><div className="rail-seg" style={{ "--a": "72%", "--b": "80%", "--c": "100%", "--d": "100%" }}><span className="rail-fill"></span><span className="rail-l">Launch &amp; hand over</span></div></div>
        </div>
      </section>

  
      <section className="inter" data-build="Testimonial">
        <div className="char-stage float2 bt bt-px" data-code="&lt;svg#shivam-points&gt;" style={{ maxWidth: "440px" }}>
          <div className="char-disc"></div>
          <svg className="char" viewBox="0 0 400 420" role="img" aria-label="Illustrated Shivam pointing at the testimonial">
                <defs><filter id="glowB" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="8"></feGaussianBlur></filter></defs>
                <g className="halo">
                  <path className="halo-glow" d="M32 318 A168 40 0 0 1 368 318" stroke="var(--lime)" strokeWidth="30" strokeLinecap="round" fill="none" opacity=".55" filter="url(#glowB)"></path>
                  <path d="M32 318 A168 40 0 0 1 368 318" stroke="#fff" strokeWidth="13" strokeLinecap="round" fill="none"></path>
                </g>
                <path d="M60 430 C60 344 116 300 200 298 C284 300 340 344 340 430 Z" fill="#000"></path>
                <path d="M160 300 C176 318 224 318 240 300" stroke="#2c2c2c" strokeWidth="5" fill="none"></path>
                <g className="head">
                  <circle cx="116" cy="188" r="16" fill="#B98262" stroke="#000" strokeWidth="3"></circle>
                  <circle cx="284" cy="188" r="16" fill="#B98262" stroke="#000" strokeWidth="3"></circle>
                  <rect x="118" y="96" width="164" height="182" rx="80" fill="#B98262" stroke="#000" strokeWidth="3"></rect>
                  <path d="M120 152 C110 98 150 62 202 62 C254 60 292 94 284 152 C276 128 262 112 240 106 C222 98 194 100 174 108 C152 114 134 126 120 152 Z" fill="#000"></path>
                  <path d="M226 70 C248 54 276 66 280 90" stroke="#000" strokeWidth="10" strokeLinecap="round" fill="none"></path>
                  <path d="M150 74 C162 60 182 56 196 60" stroke="#2a2a2a" strokeWidth="4" strokeLinecap="round" fill="none"></path>
                  <path d="M144 160 C156 149 174 149 186 156" stroke="#000" strokeWidth="8" strokeLinecap="round" fill="none"></path>
                  <path d="M214 156 C226 149 244 149 256 160" stroke="#000" strokeWidth="8" strokeLinecap="round" fill="none"></path>
                  <g className="eyes">
                    <ellipse cx="166" cy="178" rx="7" ry="7" fill="#000"></ellipse>
                    <ellipse cx="234" cy="178" rx="7" ry="7" fill="#000"></ellipse>
                    <circle cx="169" cy="175" r="2.2" fill="#fff"></circle>
                    <circle cx="237" cy="175" r="2.2" fill="#fff"></circle>
                  </g>
                  <path d="M200 180 C196 196 192 206 199 210 C204 213 210 211 213 207" stroke="#6E4127" strokeWidth="4" strokeLinecap="round" fill="none"></path>
                  <path d="M120 188 C120 248 150 294 200 296 C250 294 280 248 280 188 C273 214 262 228 248 233 C236 220 222 214 200 214 C178 214 164 220 152 233 C138 228 127 214 120 188 Z" fill="#000"></path>
                  <path d="M182 240 C194 248 208 248 220 238" stroke="#D69A7C" strokeWidth="4.5" strokeLinecap="round" fill="none"></path>
                </g>
                <g className="halo">
                  <path className="halo-glow" d="M32 318 A168 40 0 0 0 368 318" stroke="var(--lime)" strokeWidth="30" strokeLinecap="round" fill="none" opacity=".55" filter="url(#glowB)"></path>
                  <path d="M32 318 A168 40 0 0 0 368 318" stroke="#fff" strokeWidth="13" strokeLinecap="round" fill="none"></path>
                </g>
                <path d="M300 352 C326 338 344 324 356 312" stroke="#000" strokeWidth="38" strokeLinecap="round" fill="none"></path>
                <path d="M356 312 C364 306 370 300 374 296" stroke="#B98262" strokeWidth="24" strokeLinecap="round" fill="none"></path>
                <circle cx="384" cy="290" r="18" fill="#B98262" stroke="#000" strokeWidth="3"></circle>
              </svg>
        </div>
        <div>
          <div className="bubble disp">Psst. Don’t take my word for it — here’s what clients say.</div>
          <figure className="quote-card bt" data-code="&lt;blockquote.review&gt;" style={{ marginLeft: "0", marginRight: "0", marginBottom: "0" }}>
            <blockquote style={{ margin: "0" }}><p>“[Add a client quote here — one or two sentences about the result Shivam delivered.]”</p></blockquote>
            <figcaption className="quote-meta">[CLIENT NAME], [ROLE] at [COMPANY]</figcaption>
          </figure>
        </div>
      </section>

  
      <section className="hwrap" id="work" data-build="Work">
        <div className="hstage">
          <div className="hhead bt" data-code="&lt;header.work&gt;">
            <div>
              <span className="tag" style={{ color: "#fff" }}><i>→</i>Selected work</span>
              <h2 className="disp h2">Keep scrolling,<br />the work slides in</h2>
            </div>
            <p className="lead" style={{ margin: "0", maxWidth: "22em" }}>A few recent builds across e-commerce, healthcare, fintech and events.</p>
          </div>
          <div className="htrack">
            <a className="proj" href="#work" style={{ background: "#E8DCCB", color: "#000" }}>
              <div className="proj-art bt bt-px" data-code="&lt;canvas.cover&gt;" aria-hidden="true">
                <div style={{ position: "absolute", width: "220px", height: "260px", borderRadius: "110px 110px 40px 40px", background: "#B9694A", right: "60px", top: "70px" }}></div>
                <div style={{ position: "absolute", width: "150px", height: "180px", borderRadius: "50%", background: "#6E7B5B", right: "230px", top: "140px" }}></div>
                <div style={{ position: "absolute", width: "90px", height: "120px", borderRadius: "40px", background: "#F4EEE4", border: "2px solid #000", right: "40px", top: "250px" }}></div>
              </div>
              <div className="proj-tags bt" data-code="&lt;ul.tags&gt;"><span>Shopify</span><span>Horizon theme</span><span>Liquid</span></div>
              <div className="proj-info bt" data-code="&lt;div.case-meta&gt;"><div><h3 className="disp proj-t">Terra</h3><p className="proj-s">Ceramics store with custom Liquid sections</p></div><span className="proj-go"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"></path></svg></span></div>
            </a>
            <a className="proj" href="#work" style={{ background: "#0E3B43" }}>
              <div className="proj-art bt bt-px" data-code="&lt;canvas.cover&gt;" aria-hidden="true">
                <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", border: "40px solid #7FE3D0", right: "-60px", top: "-40px" }}></div>
                <div style={{ position: "absolute", width: "70px", height: "220px", borderRadius: "20px", background: "#fff", right: "150px", top: "80px" }}></div>
                <div style={{ position: "absolute", width: "220px", height: "70px", borderRadius: "20px", background: "#fff", right: "75px", top: "155px" }}></div>
              </div>
              <div className="proj-tags bt" data-code="&lt;ul.tags&gt;"><span>Healthcare</span><span>Next.js</span></div>
              <div className="proj-info bt" data-code="&lt;div.case-meta&gt;"><div><h3 className="disp proj-t">[Project name]</h3><p className="proj-s">[One line on the healthcare build]</p></div><span className="proj-go"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"></path></svg></span></div>
            </a>
            <a className="proj" href="#work" style={{ background: "#1B1B2F" }}>
              <div className="proj-art bt bt-px" data-code="&lt;canvas.cover&gt;" aria-hidden="true">
                <div style={{ position: "absolute", left: "40px", right: "40px", top: "90px", height: "190px", display: "flex", alignItems: "end", gap: "14px" }}>
                  <div style={{ flex: "1", height: "30%", background: "#3A3A5A", borderRadius: "10px" }}></div>
                  <div style={{ flex: "1", height: "55%", background: "#3A3A5A", borderRadius: "10px" }}></div>
                  <div style={{ flex: "1", height: "42%", background: "#3A3A5A", borderRadius: "10px" }}></div>
                  <div style={{ flex: "1", height: "78%", background: "#C8FF2E", borderRadius: "10px" }}></div>
                  <div style={{ flex: "1", height: "100%", background: "#C8FF2E", borderRadius: "10px" }}></div>
                </div>
              </div>
              <div className="proj-tags bt" data-code="&lt;ul.tags&gt;"><span>Fintech</span><span>React</span><span>GSAP</span></div>
              <div className="proj-info bt" data-code="&lt;div.case-meta&gt;"><div><h3 className="disp proj-t">[Project name]</h3><p className="proj-s">[One line on the fintech build]</p></div><span className="proj-go"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"></path></svg></span></div>
            </a>
            <a className="proj" href="#work" style={{ background: "#FF5B2E", color: "#000" }}>
              <div className="proj-art bt bt-px" data-code="&lt;canvas.cover&gt;" aria-hidden="true">
                <div className="disp" style={{ position: "absolute", left: "30px", top: "70px", fontSize: "120px", lineHeight: ".85", fontWeight: "800", color: "#000", opacity: ".9" }}>EXPO<br />[YR]</div>
                <div style={{ position: "absolute", width: "120px", height: "120px", borderRadius: "50%", background: "#fff", border: "3px solid #000", right: "40px", top: "70px" }}></div>
              </div>
              <div className="proj-tags bt" data-code="&lt;ul.tags&gt;"><span>Exhibitions</span><span>WordPress</span></div>
              <div className="proj-info bt" data-code="&lt;div.case-meta&gt;"><div><h3 className="disp proj-t">[Project name]</h3><p className="proj-s">[One line on the event microsite]</p></div><span className="proj-go"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"></path></svg></span></div>
            </a>
            <a className="proj" href="#contact" style={{ background: "var(--lime)", color: "#000", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <div className="bt" data-code="&lt;cta.next&gt;"><p className="disp" style={{ fontSize: "40px", lineHeight: "1.05", margin: "0" }}>Your project<br />could be next</p><span className="btn" style={{ marginTop: "28px" }}><span className="dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg></span>Start a project</span></div>
            </a>
          </div>
        </div>
      </section>

  
      <section className="contact stage" id="contact" style={{ background: "var(--lime)", color: "#000" }} data-build="Contact">
        <div className="bt" data-code="&lt;header.contact&gt;" style={{ position: "relative", zIndex: "2" }}>
          <span className="tag"><i>↓</i>Contact</span>
          <h2 className="disp">Got a project?<br /><span className="hl">Let’s make</span><br />it move.</h2>
          <p style={{ fontSize: "18px", lineHeight: "1.6", maxWidth: "26em", margin: "24px 0 0" }}>Tell me what you’re building. I reply within [RESPONSE TIME] with next steps and a rough timeline.</p>
        </div>
        <form className="form bt" data-code="&lt;form#enquiry&gt;" aria-label="Project enquiry">
          <div className="field"><label htmlFor="f-name">Your name</label><input id="f-name" type="text" placeholder="Jane Doe" /></div>
          <div className="field"><label htmlFor="f-email">Email</label><input id="f-email" type="email" placeholder="you@company.com" /></div>
          <div className="field"><label htmlFor="f-msg">What are you building?</label><textarea id="f-msg" rows="3" placeholder="A Shopify store, a launch page, a redesign..."></textarea></div>
          <button type="button" className="btn btn-lime" style={{ alignSelf: "flex-start" }}><span className="dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"></path></svg></span>Send message</button>
        </form>
        <div className="peek" aria-hidden="true">
          <div className="peek-in" style={{ position: "absolute", inset: "0" }}>
            <svg className="char" viewBox="0 0 400 420" aria-hidden="true">
                <defs><filter id="glowC" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="8"></feGaussianBlur></filter></defs>
                <g className="halo">
                  <path className="halo-glow" d="M32 318 A168 40 0 0 1 368 318" stroke="var(--lime)" strokeWidth="30" strokeLinecap="round" fill="none" opacity=".55" filter="url(#glowC)"></path>
                  <path d="M32 318 A168 40 0 0 1 368 318" stroke="#fff" strokeWidth="13" strokeLinecap="round" fill="none"></path>
                </g>
                <path d="M60 430 C60 344 116 300 200 298 C284 300 340 344 340 430 Z" fill="#000"></path>
                <path d="M160 300 C176 318 224 318 240 300" stroke="#2c2c2c" strokeWidth="5" fill="none"></path>
                <g className="head">
                  <circle cx="116" cy="188" r="16" fill="#B98262" stroke="#000" strokeWidth="3"></circle>
                  <circle cx="284" cy="188" r="16" fill="#B98262" stroke="#000" strokeWidth="3"></circle>
                  <rect x="118" y="96" width="164" height="182" rx="80" fill="#B98262" stroke="#000" strokeWidth="3"></rect>
                  <path d="M120 152 C110 98 150 62 202 62 C254 60 292 94 284 152 C276 128 262 112 240 106 C222 98 194 100 174 108 C152 114 134 126 120 152 Z" fill="#000"></path>
                  <path d="M226 70 C248 54 276 66 280 90" stroke="#000" strokeWidth="10" strokeLinecap="round" fill="none"></path>
                  <path d="M150 74 C162 60 182 56 196 60" stroke="#2a2a2a" strokeWidth="4" strokeLinecap="round" fill="none"></path>
                  <path d="M144 160 C156 149 174 149 186 156" stroke="#000" strokeWidth="8" strokeLinecap="round" fill="none"></path>
                  <path d="M214 156 C226 149 244 149 256 160" stroke="#000" strokeWidth="8" strokeLinecap="round" fill="none"></path>
                  <g className="eyes">
                    <ellipse cx="166" cy="178" rx="7" ry="7" fill="#000"></ellipse>
                    <ellipse cx="234" cy="178" rx="7" ry="7" fill="#000"></ellipse>
                    <circle cx="169" cy="175" r="2.2" fill="#fff"></circle>
                    <circle cx="237" cy="175" r="2.2" fill="#fff"></circle>
                  </g>
                  <path d="M200 180 C196 196 192 206 199 210 C204 213 210 211 213 207" stroke="#6E4127" strokeWidth="4" strokeLinecap="round" fill="none"></path>
                  <path d="M120 188 C120 248 150 294 200 296 C250 294 280 248 280 188 C273 214 262 228 248 233 C236 220 222 214 200 214 C178 214 164 220 152 233 C138 228 127 214 120 188 Z" fill="#000"></path>
                  <path d="M182 240 C194 248 208 248 220 238" stroke="#D69A7C" strokeWidth="4.5" strokeLinecap="round" fill="none"></path>
                </g>
                <g className="halo">
                  <path className="halo-glow" d="M32 318 A168 40 0 0 0 368 318" stroke="var(--lime)" strokeWidth="30" strokeLinecap="round" fill="none" opacity=".55" filter="url(#glowC)"></path>
                  <path d="M32 318 A168 40 0 0 0 368 318" stroke="#fff" strokeWidth="13" strokeLinecap="round" fill="none"></path>
                </g>
                <g className="arm">
                  <path d="M298 352 C314 334 324 314 330 294" stroke="#000" strokeWidth="40" strokeLinecap="round" fill="none"></path>
                  <path d="M330 292 C336 276 340 262 341 250" stroke="#B98262" strokeWidth="26" strokeLinecap="round" fill="none"></path>
                  <circle cx="341" cy="234" r="21" fill="#B98262" stroke="#000" strokeWidth="3"></circle>
                  <path d="M330 216 L326 198 M342 212 L342 192 M354 216 L358 199" stroke="#000" strokeWidth="4" strokeLinecap="round"></path>
                </g>
              </svg>
          </div>
        </div>
      </section>

  
      <footer className="foot" data-build="Footer">
        <div className="foot-in">
          <div className="foot-grid bt" data-code="&lt;nav.footer&gt;">
            <div><h3>Say hello</h3><a href="#contact">[YOUR EMAIL]</a><a href="#contact">[YOUR PHONE]</a></div>
            <div><h3>Menu</h3><a href="#skills">Skills</a><a href="#process">Process</a><a href="#work">Work</a><a href="#contact">Contact</a></div>
            <div><h3>Follow</h3><a href="https://instagram.com/buildbyshivam">Instagram @buildbyshivam</a><a href="#contact">LinkedIn [URL]</a></div>
          </div>
          <p className="disp giant bt" data-code="&lt;h2.wordmark&gt;" aria-hidden="true">buildbyshivam</p>
          <p style={{ color: "var(--mute)", fontSize: "14px", margin: "40px 0 0", textAlign: "center" }}>© 2026 Shivam. Built with motion.</p>
        </div>
      </footer>
    </div>
  );
}
