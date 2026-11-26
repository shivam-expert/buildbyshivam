"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./keithston.css";

const IMG = (name) => `/keithston/${name}.webp`;

const PRODUCTS = [
  { name: "Lattice Danish", img: "p-lattice-danish", price: 40 },
  { name: "Berry Danish", img: "p-berry-danish", price: 40 },
  { name: "Seeded Baguette", img: "p-seeded-baguette", price: 40 },
  { name: "Sourdough", img: "p-sourdough", price: 40, alt: "Country Sourdough" },
  { name: "Sunburst Pie", img: "p-sunburst-pie", price: 40 },
  { name: "Kaiser Roll", img: "p-kaiser-roll", price: 40 },
];

const TABS = ["Cake", "Muffins", "Croissant", "Bread", "Tart", "Favorite"];
const PHOTOS = [
  { img: "e-muffin", alt: "Oat muffin with blueberries" },
  { img: "e-cheesecake", alt: "Berry cheesecake" },
  { img: "e-tart", alt: "Berry crumble tart slice" },
  { img: "e-lemon-loaf", alt: "Lemon loaf cake" },
  { img: "e-chocolate-slice", alt: "Chocolate layer slice" },
  { img: "e-cupcake", alt: "Chocolate cream cupcake" },
];
// Each tab shows the six photos in its own order until real per-category photos exist.
const photosFor = (tab) => PHOTOS.map((_, i) => PHOTOS[(i + tab * 2) % PHOTOS.length]);
const PHOTO_SPEED = [9, 14, 7, 12, 6, 11];

const FEATURED = [
  { name: "Puff Pastry", img: "f-puff-pastry", alt: "Puff pastry with nuts", price: 8 },
  { name: "Doughnuts", img: "f-doughnuts", alt: "Chocolate doughnuts", price: 8 },
  { name: "Brownies", img: "f-brownies", alt: "Brownies with raspberries", price: 8 },
];

const GRAINS = [
  { l: "46%", t: "22%", r: 30 }, { l: "49%", t: "34%", r: -20 }, { l: "43%", t: "46%", r: 70 },
  { l: "51%", t: "58%", r: 10 }, { l: "47%", t: "15%", r: -60 }, { l: "40%", t: "68%", r: 45 },
];
const CRUMBS = [
  { l: "38%", s: 7 }, { l: "44%", s: 5 }, { l: "52%", s: 8 }, { l: "58%", s: 4 }, { l: "63%", s: 6 }, { l: "33%", s: 4 },
];
const MARQUEE = ["Freshly Baked", "Sweet Treats", "Perfect Eats"];

// Text split into per-letter spans; screen readers get the whole string once.
function Chars({ text, className = "" }) {
  return (
    <span className={`chars ${className}`}>
      <span className="sr">{text}</span>
      {Array.from(text).map((c, i) => (
        <span className="ch" aria-hidden="true" key={i}>{c}</span>
      ))}
    </span>
  );
}

const Icon = {
  bag: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1.2 12.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
  ),
  facebook: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M15 8h-1.5A2.5 2.5 0 0 0 11 10.5V22M8.5 13.5H15" /></svg>
  ),
  pinterest: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M10.5 21.5 12 14M9.2 13.5c-.6-3.6 1.6-6 4-6 2 0 3.3 1.5 3.3 3.3 0 2.5-1.5 4.4-3.4 4.4-.9 0-1.6-.5-1.8-1.2" /></svg>
  ),
  whatsapp: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 20.5 5 16.3A9 9 0 1 1 8 19z" /><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.3-1.6-2.8-2.8l1-1-1-2z" /></svg>
  ),
  instagram: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" /></svg>
  ),
};

const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => typeof window !== "undefined" && matchMedia("(hover: hover) and (pointer: fine)").matches;

// Columns in a grid right now, so cards can enter from the side of the column they sit in.
const colsOf = (grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
const fromForColumn = (col, cols, dist) => {
  if (cols === 1) return { y: dist };
  if (col === 0) return { x: -dist };
  if (col === cols - 1) return { x: dist };
  return { y: dist };
};

// Slide the underline under tab i (follows the button's own baseline in case the row wraps).
function moveTabBar(root, i, animate = true) {
  const bar = root?.querySelector(".tab-bar");
  const btn = root?.querySelectorAll(".tab")[i];
  if (!bar || !btn) return;
  const props = { x: btn.offsetLeft, y: btn.offsetTop + btn.offsetHeight - bar.parentElement.clientHeight, width: btn.offsetWidth };
  if (animate && !reduced()) gsap.to(bar, { ...props, duration: 0.45, ease: "power3.inOut" });
  else gsap.set(bar, props);
}

export default function Keithston({ className = "" }) {
  const rootRef = useRef(null);
  const [cart, setCart] = useState(0);
  const [tab, setTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const tabRef = useRef(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(root);
    const cleanups = [];

    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    if (reduced()) {
      root.dataset.intro = "done";
      moveTabBar(root, 0, false);
      return () => cleanups.forEach((f) => f());
    }

    const ctx = gsap.context(() => {
      /* ---------------- HERO intro ---------------- */
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from(".hero-tex", { scale: 1.35, duration: 1.8, ease: "power2.out" }, 0)
        .from(".h-board .art", { xPercent: 110, rotate: 8, duration: 1.4 }, 0.2)
        .from(".h-dipper .art", { xPercent: -260, rotate: -25, duration: 1.4 }, 0.35)
        .from(".grain", { scale: 0, opacity: 0, duration: 0.6, ease: "back.out(4)", stagger: { each: 0.06, from: "random" } }, 0.9)
        .from(".h-kicker .ch", { opacity: 0, duration: 0.01, stagger: 0.06 }, 0.7)
        .from(".hero h1 .ch", { yPercent: 115, rotateX: -90, transformOrigin: "50% 100%", duration: 0.9, stagger: 0.035 }, 1.0)
        .from(".h-ctas > *", { y: 30, opacity: 0, duration: 0.7, stagger: 0.12 }, 1.6)
        .from(".k-head > *", { y: -30, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.4)
        .from(".h-scroll", { opacity: 0, duration: 0.6 }, 2);
      root.dataset.intro = "done";

      // Scroll: board right, dipper left, headline lines pull apart and fade.
      const heroScroll = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
      gsap.to(".h-board", { x: 220, y: 60, ease: "none", scrollTrigger: heroScroll });
      gsap.to(".h-dipper", { x: -220, ease: "none", scrollTrigger: heroScroll });
      gsap.to(".hero h1 .line:nth-child(1)", { x: -160, opacity: 0, ease: "none", scrollTrigger: heroScroll });
      gsap.to(".hero h1 .line:nth-child(2)", { x: 160, opacity: 0, ease: "none", scrollTrigger: heroScroll });
      gsap.to([".h-kicker", ".h-ctas", ".h-scroll"], { opacity: 0, y: -40, ease: "none", scrollTrigger: { ...heroScroll, end: "60% top" } });

      /* ---------------- section titles: letter by letter ---------------- */
      q(".sec-title").forEach((t) => {
        gsap.from(t.querySelectorAll(".ch"), {
          yPercent: 80, opacity: 0, rotate: 8, duration: 0.6, ease: "back.out(2)", stagger: 0.03,
          scrollTrigger: { trigger: t, start: "top 85%" },
        });
      });

      /* ---------------- top products ---------------- */
      const pGrid = q(".p-grid")[0];
      const pCols = colsOf(pGrid);
      q(".p-card").forEach((card, i) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 88%" } });
        tl.from(card, { ...fromForColumn(i % pCols, pCols, 140), opacity: 0, duration: 0.9, ease: "power3.out", delay: (i % pCols) * 0.08 })
          .from(card.querySelector(".p-img img"), { y: -160, opacity: 0, duration: 1.1, ease: "bounce.out" }, "-=0.45")
          .add(() => {
            gsap.to(card.querySelector(".p-float"), { y: -10, duration: 1.8 + (i % 3) * 0.3, ease: "sine.inOut", yoyo: true, repeat: -1 });
          });
      });

      /* ---------------- promo ---------------- */
      gsap.from(".promo-l", { xPercent: -110, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".promo", start: "top 75%" } });
      gsap.from(".promo-r", { xPercent: 110, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".promo", start: "top 75%" } });
      const promoScroll = { trigger: ".promo", start: "top bottom", end: "bottom top", scrub: true };
      gsap.fromTo(".promo-l > div", { x: -30, y: 20 }, { x: 40, y: -20, ease: "none", scrollTrigger: promoScroll });
      gsap.fromTo(".promo-r > div", { x: 30, y: -20 }, { x: -40, y: 30, ease: "none", scrollTrigger: promoScroll });
      gsap.from(".crumb", {
        y: -260, rotate: () => gsap.utils.random(-180, 180), duration: 1.2, ease: "bounce.out", stagger: 0.09,
        scrollTrigger: { trigger: ".promo", start: "top 60%" },
      });
      gsap.from(".promo-copy > *", { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".promo", start: "top 70%" } });

      /* ---------------- explore ---------------- */
      const eGrid = q(".e-grid")[0];
      const eCols = colsOf(eGrid);
      q(".e-frame").forEach((f, i) => {
        const col = i % eCols;
        const from = eCols === 1 || (col !== 0 && col !== eCols - 1)
          ? "inset(100% 0% 0% 0%)"
          : col === 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)";
        gsap.fromTo(f, { clipPath: from }, {
          clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power3.inOut", delay: col * 0.1,
          scrollTrigger: { trigger: f, start: "top 88%" },
        });
        const s = PHOTO_SPEED[i % PHOTO_SPEED.length];
        gsap.fromTo(f.querySelector("img"), { yPercent: -s / 2 }, {
          yPercent: s / 2, ease: "none",
          scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      /* ---------------- about ---------------- */
      gsap.from(".about-l", { xPercent: -100, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".about", start: "top 75%" } });
      gsap.from(".about-r", { xPercent: 100, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".about", start: "top 75%" } });
      const aboutScroll = { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true };
      gsap.fromTo(".about-l > div", { y: 40 }, { y: -40, ease: "none", scrollTrigger: aboutScroll });
      gsap.fromTo(".about-r > div", { y: -30 }, { y: 50, ease: "none", scrollTrigger: aboutScroll });
      gsap.from(".about-copy > *", { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ".about", start: "top 70%" } });

      /* ---------------- featured ---------------- */
      const fGrid = q(".f-grid")[0];
      const fCols = getComputedStyle(fGrid).display === "flex" ? 1 : colsOf(fGrid);
      q(".f-card").forEach((card, i) => {
        const col = i % fCols;
        const tl = gsap.timeline({ scrollTrigger: { trigger: fCols === 1 ? fGrid : card, start: "top 85%" }, delay: col * 0.1 });
        const price = card.querySelector(".f-price");
        const n = { v: 0 };
        tl.from(card, { ...(fCols === 1 ? { x: 120 } : fromForColumn(col, fCols, 120)), opacity: 0, duration: 0.9, ease: "power3.out", delay: fCols === 1 ? i * 0.12 : 0 })
          .fromTo(card.querySelector(".f-frame"), { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 1.2, ease: "power2.inOut" }, "<0.1")
          .to(n, { v: FEATURED[i].price, duration: 1.2, ease: "power2.out", onUpdate: () => (price.textContent = `$${Math.round(n.v)}`) }, "<0.5");
      });

      /* ---------------- marquee ---------------- */
      const track = q(".mq-track")[0];
      const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
      loop.totalTime(loop.duration() * 1000); // room to run backwards
      let dir = 1;
      ScrollTrigger.create({
        trigger: ".marquee", start: "top bottom", end: "bottom top",
        onUpdate: (self) => {
          dir = self.direction;
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 6);
          gsap.timeline({ overwrite: true })
            .to(loop, { timeScale: dir * boost, duration: 0.15 })
            .to(loop, { timeScale: dir, duration: 1.2, ease: "power2.out" });
        },
      });

      /* ---------------- footer ---------------- */
      const ft = gsap.timeline({ scrollTrigger: { trigger: ".footer", start: "top 85%" } });
      ft.from(".ft-logo", { scale: 0, rotate: -40, duration: 1.2, ease: "elastic.out(1, 0.5)" })
        .from(".ft-follow > *", { y: 30, scale: 0.4, opacity: 0, duration: 0.6, ease: "back.out(3)", stagger: 0.08 }, "-=0.8")
        .from(".ft-line", { scaleX: 0, duration: 1, ease: "power3.inOut" }, "-=0.4")
        .from(".ft-cols > *", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 }, "-=0.5")
        .from(".ft-copy", { opacity: 0, duration: 0.6 }, "-=0.3");
    }, root);
    cleanups.push(() => ctx.revert());

    /* ---------------- mouse parallax (hero + about) ---------------- */
    if (finePointer()) {
      const depth = (sel, d) => {
        const el = q(sel);
        return { x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }), d };
      };
      const heroLayers = [depth(".hero-tex", 12), depth(".h-grains > div", 34), depth(".h-board > div", 22), depth(".h-dipper > div", 46)];
      const aboutLayers = [depth(".about-l .m", 26), depth(".about-r .m", 18)];
      const bind = (sel, layers) => {
        const el = q(sel)[0];
        const move = (e) => {
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          layers.forEach((l) => { l.x(-nx * l.d); l.y(-ny * l.d); });
        };
        const leave = () => layers.forEach((l) => { l.x(0); l.y(0); });
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      };
      bind(".hero", heroLayers);
      bind(".about", aboutLayers);
    }

    moveTabBar(root, 0, false);
    const onResize = () => moveTabBar(root, tabRef.current, false);
    window.addEventListener("resize", onResize);
    cleanups.push(() => window.removeEventListener("resize", onResize));

    return () => cleanups.forEach((f) => f());
  }, []);

  /* ---------------- explore tabs ---------------- */
  function selectTab(i) {
    if (i === tabRef.current) return;
    tabRef.current = i;
    moveTabBar(rootRef.current, i);
    const frames = rootRef.current.querySelectorAll(".e-frame");
    if (reduced()) { setTab(i); return; }
    gsap.timeline()
      .to(frames, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.45, ease: "power3.in", stagger: 0.05 })
      .add(() => setTab(i))
      .fromTo(frames, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.out", stagger: 0.06 }, "+=0.05");
  }

  function onTabKey(e) {
    const n = TABS.length;
    let next = null;
    if (e.key === "ArrowRight") next = (tabRef.current + 1) % n;
    if (e.key === "ArrowLeft") next = (tabRef.current - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    if (next === null) return;
    e.preventDefault();
    selectTab(next);
    rootRef.current.querySelectorAll(".tab")[next].focus();
  }

  /* ---------------- product card: tilt + glare, add to cart ---------------- */
  function tilt(e) {
    if (e.pointerType !== "mouse" || reduced()) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    gsap.to(el, { rotateY: (nx - 0.5) * 16, rotateX: (0.5 - ny) * 14, scale: 1.02, duration: 0.5, ease: "power2.out" });
    el.style.setProperty("--gx", `${nx * 100}%`);
    el.style.setProperty("--gy", `${ny * 100}%`);
  }
  function untilt(e) {
    gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" });
  }

  function addToCart(e) {
    const root = rootRef.current;
    const cartEl = root.querySelector(".k-cart");
    const badge = cartEl.querySelector("b");
    const bump = () => {
      setCart((c) => c + 1);
      if (!reduced()) gsap.fromTo(badge, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    };
    const src = e.currentTarget.closest(".p-inner").querySelector(".p-img img");
    if (reduced()) return bump();

    const a = src.getBoundingClientRect();
    const b = cartEl.getBoundingClientRect();
    const fly = src.cloneNode();
    fly.alt = "";
    fly.className = "flyer";
    Object.assign(fly.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    root.appendChild(fly);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    gsap.timeline({ onComplete: () => { fly.remove(); bump(); } })
      .to(fly, { x: dx, duration: 0.85, ease: "power1.inOut" }, 0)
      .to(fly, { y: dy, duration: 0.85, ease: "back.in(1.6)" }, 0)
      .to(fly, { scale: 0.12, rotate: 200, duration: 0.85, ease: "power2.in" }, 0);
  }

  const photos = photosFor(tab);

  return (
    <div ref={rootRef} className={`keithston ${className}`} data-intro="pending">
      {/* ================= HEADER ================= */}
      <header className={`k-head${scrolled ? " scrolled" : ""}`}>
        <a className="k-logo intro" href="#top" aria-label="Keithston Coffee Shop home" />
        <nav className="k-nav intro" aria-label="Main">
          <a href="#top" aria-current="page">Home</a>
          <a href="#explore">Blog</a>
          <a href="#footer">Contact Us</a>
          <a href="#about">Services</a>
        </nav>
        <button type="button" className="k-cart intro" aria-label={`Cart, ${cart} item${cart === 1 ? "" : "s"}`}>
          {Icon.bag}
          <b aria-hidden="true">{cart}</b>
        </button>
      </header>

      <main>
        {/* ================= HERO ================= */}
        <section className="hero" id="top">
          <div className="hero-tex tex" />
          <div className="layer h-board"><div><div className="art intro" /></div></div>
          <div className="layer h-dipper"><div><div className="art intro" /></div></div>
          <div className="layer h-grains" aria-hidden="true">
            <div style={{ position: "absolute", inset: 0 }}>
              {GRAINS.map((g, i) => (
                <span key={i} className="grain intro" style={{ left: g.l, top: g.t, rotate: `${g.r}deg` }} />
              ))}
            </div>
          </div>
          <div className="shade" />

          <div className="hero-copy">
            <p className="h-kicker intro"><Chars text="Delicious Cafe" /></p>
            <h1 className="script intro" aria-label="Sweet Treats, Perfect Eats">
              <span className="line" aria-hidden="true"><Chars text="Sweet Treats," /></span>
              <span className="line" aria-hidden="true"><Chars text="Perfect Eats" /></span>
            </h1>
            <div className="h-ctas intro">
              <a className="btn" href="#products">Shop Now</a>
              <a className="more" href="#about">Learn More →</a>
            </div>
          </div>
          <p className="h-scroll intro" aria-hidden="true">SCROLL</p>
        </section>

        {/* ================= TOP PRODUCTS ================= */}
        <section className="products" id="products" aria-labelledby="ks-products">
          <div className="wrap">
            <h2 id="ks-products" className="sec-title script"><Chars text="Top Products" /></h2>
            <div className="p-grid">
              {PRODUCTS.map((p) => (
                <article className="p-card" key={p.name}>
                  <div className="p-inner tex" onPointerMove={tilt} onPointerLeave={untilt}>
                    <div className="p-glare" aria-hidden="true" />
                    <div className="p-img"><div className="p-float"><img src={IMG(p.img)} alt={p.alt ?? p.name} /></div></div>
                    <div className="p-row top">
                      <span className="p-price">${p.price}</span>
                      <button type="button" className="p-info" aria-label={`${p.name} details`}>i</button>
                    </div>
                    <div className="p-row bot">
                      <h3 className="p-name">{p.name}</h3>
                      <button type="button" className="btn p-add" onClick={addToCart} aria-label={`Add ${p.name} to cart`}>Add</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= PROMO ================= */}
        <section className="promo" aria-labelledby="ks-promo">
          <div className="layer promo-l"><div><img src={IMG("promo-left")} alt="" /></div></div>
          <div className="layer promo-r"><div><img src={IMG("promo-right")} alt="" /></div></div>
          {CRUMBS.map((c, i) => (
            <span key={i} className="crumb" aria-hidden="true" style={{ left: c.l, width: c.s, height: c.s * 0.8 }} />
          ))}
          <div className="promo-copy">
            <h2 id="ks-promo" className="script">20% Off Your<br />First Order</h2>
            <p>New here? Take 20% off your first order of fresh bread, pastries and cakes.</p>
            <a className="btn" href="#products">Learn More</a>
          </div>
        </section>

        {/* ================= EXPLORE MORE ================= */}
        <section className="explore" id="explore" aria-labelledby="ks-explore">
          <div className="wrap">
            <h2 id="ks-explore" className="sec-title script"><Chars text="Explore More" /></h2>
            <div className="tabs" role="tablist" aria-label="Categories" onKeyDown={onTabKey}>
              {TABS.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  className="tab"
                  id={`ks-tab-${i}`}
                  aria-selected={tab === i}
                  aria-controls="ks-panel"
                  tabIndex={tab === i ? 0 : -1}
                  onClick={() => selectTab(i)}
                >
                  {t}
                </button>
              ))}
              <span className="tab-bar" aria-hidden="true" />
            </div>
            <div className="e-grid" id="ks-panel" role="tabpanel" aria-labelledby={`ks-tab-${tab}`}>
              {photos.map((p, i) => (
                <div className="e-frame" key={i}>
                  <img src={IMG(p.img)} alt={p.alt} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= ABOUT ================= */}
        <section className="about tex" id="about" aria-labelledby="ks-about">
          <div className="layer about-l"><div><div className="m"><img src={IMG("about-flour")} alt="" /></div></div></div>
          <div className="layer about-r"><div><div className="m"><img src={IMG("about-loaves")} alt="" /></div></div></div>
          <div className="about-copy">
            <h2 id="ks-about" className="script">About us</h2>
            <p>A small-batch bakery and coffee shop. Our dough rests overnight and everything is baked fresh each morning.</p>
            <a className="btn" href="#footer">Read More</a>
          </div>
        </section>

        {/* ================= FEATURED ================= */}
        <section className="featured" id="featured" aria-labelledby="ks-featured">
          <div className="wrap">
            <h2 id="ks-featured" className="sec-title script"><Chars text="Featured Treats" /></h2>
            <div className="f-grid">
              {FEATURED.map((f) => (
                <article className="f-card" key={f.name}>
                  <div className="f-frame"><img src={IMG(f.img)} alt={f.alt} /></div>
                  <div className="f-meta"><h3>{f.name}</h3><span className="f-price">${f.price}</span></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= MARQUEE ================= */}
        <div className="marquee script" aria-hidden="true">
          <div className="mq-track">
            {[0, 1].map((k) =>
              MARQUEE.map((w) => (
                <span key={`${k}-${w}`}>
                  <span className="mq-o">{w}</span>
                  <span className="mq-s">✦</span>
                </span>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="footer tex" id="footer">
        <div className="wrap">
          <div className="ft-top">
            <div className="ft-logo" role="img" aria-label="Keithston" />
            <div className="ft-follow">
              <span>Follow us</span>
              <a href="#" aria-label="Facebook">{Icon.facebook}</a>
              <a href="#" aria-label="Pinterest">{Icon.pinterest}</a>
              <a href="#" aria-label="WhatsApp">{Icon.whatsapp}</a>
              <a href="#" aria-label="Instagram">{Icon.instagram}</a>
            </div>
          </div>
          <div className="ft-line" />
          <div className="ft-cols">
            <div>
              <h4>About Us</h4>
              <p><strong>(456) 789-12301</strong><br />info@modrino.co.uk<br />South 13th street<br />New York, America</p>
            </div>
            <nav aria-label="Footer">
              <h4>Explore</h4>
              <div className="ft-links">
                <a href="#top">Home</a><a href="#explore">Blog</a><a href="#footer">Contact us</a><a href="#about">Services</a>
              </div>
            </nav>
            <div>
              <h4>Recent News</h4>
              <a className="ft-news" href="#featured">
                <img src={IMG("news-1")} alt="" />
                <span><small>June 14, 2024</small>Puff pastry bliss.</span>
              </a>
              <a className="ft-news" href="#featured">
                <img src={IMG("news-2")} alt="" />
                <span><small>June 14, 2024</small>Puff pastry bliss.</span>
              </a>
            </div>
          </div>
          <p className="ft-copy">© 2024 Bake House. All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
