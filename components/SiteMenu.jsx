"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PAGES = [
  { href: "/", label: "Home", note: "Silk scroll hero" },
  { href: "/bag-swap", label: "Bag Swap", note: "Tap a bag, watch it swap" },
  { href: "/clog", label: "Clog Story", note: "Scroll-driven product story" },
  { href: "/film-archive", label: "Film Archive", note: "3D shelf of VHS tapes" },
];

export default function SiteMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef(null);
  const firstLinkRef = useRef(null);

  // Escape closes; lock page scroll while open; move focus in and back out.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    firstLinkRef.current?.focus();
    const button = buttonRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      button?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="site-menu"
        className="fixed bottom-5 left-1/2 z-[1001] flex h-12 -translate-x-1/2 cursor-pointer items-center gap-3 rounded-full bg-neutral-950/85 pl-5 pr-4 font-mono text-xs uppercase tracking-[0.2em] text-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,.35)] ring-1 ring-white/15 backdrop-blur-md transition hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {open ? "Close" : "Menu"}
        <span className="relative block h-3 w-4" aria-hidden="true">
          <span
            className={`absolute left-0 top-0 h-[1.5px] w-full bg-current transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`}
          />
          <span
            className={`absolute bottom-0 left-0 h-[1.5px] w-full bg-current transition-transform duration-300 ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
          />
        </span>
      </button>

      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!open}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className={`fixed inset-0 z-[1000] flex items-center justify-center bg-neutral-950/92 px-4 backdrop-blur-xl transition-opacity duration-500 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <nav className="w-full max-w-3xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
            buildbyshivam — pages
          </p>
          <ul className="border-t border-white/10">
            {PAGES.map((p, i) => {
              const active = pathname === p.href;
              return (
                <li
                  key={p.href}
                  className={`border-b border-white/10 transition-all duration-500 ease-out ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
                  style={{ transitionDelay: open ? `${120 + i * 70}ms` : "0ms" }}
                >
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={p.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className="group flex items-baseline justify-between gap-6 py-5 text-neutral-100 outline-none focus-visible:text-white"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-xs text-neutral-500">0{i + 1}</span>
                      <span className="text-4xl font-semibold tracking-tight transition-transform duration-300 group-hover:translate-x-2 group-focus-visible:translate-x-2 sm:text-6xl">
                        {p.label}
                      </span>
                      {active && (
                        <span className="h-2 w-2 translate-y-[-0.4em] rounded-full bg-orange-500" aria-hidden="true" />
                      )}
                    </span>
                    <span className="hidden font-mono text-xs text-neutral-400 sm:block">{p.note}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
