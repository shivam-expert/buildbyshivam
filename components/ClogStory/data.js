export const ACCENT = "#f0520f";

export const IMG = {
  orange: "/clog/orange.webp",
  pink: "/clog/pink.webp",
  lime: "/clog/lime.webp",
  blue: "/clog/blue.webp",
  violet: "/clog/violet.webp",
  black: "/clog/black.webp",
  white: "/clog/white.webp",
};

export const NAV = [
  { href: "#classic", label: "Clogs" },
  { href: "#colors", label: "Colors" },
  { href: "#night", label: "After Dark" },
  { href: "#wild", label: "Lookbook" },
];

/** Colourway scenes 02–05: word drops in behind, clog flies in from one side. */
export const SCENES = [
  {
    id: "bubblegum", num: "02", img: IMG.pink, alt: "Bubblegum pink foam clog",
    word: "bubblegum", fs: "clamp(96px, 16vw, 260px)", wordColor: "#d0186c", align: "",
    base: "#f6d6e5", bg: "radial-gradient(90% 90% at 50% 40%, #fff6fa, #f6d6e5)",
    ink: "#5b0a31", btn: "solid", deco: "bubbles", fly: "flyL",
    tag: "Bubblegum", desc: "A loud, glossy pink that pops on every step.",
  },
  {
    id: "lime", num: "03", img: IMG.lime, alt: "Lime green foam clog",
    word: "lime\npunch", fs: "clamp(100px, 15vw, 240px)", wordColor: "#8db86f", align: "left",
    base: "#dfe9d9", bg: "radial-gradient(90% 90% at 60% 40%, #f7faf4, #dfe9d9)",
    ink: "#1d3510", btn: "solid", deco: null, fly: "flyR",
    tag: "Lime punch", desc: "Electric citrus for sunny days and summer plans.",
  },
  {
    id: "sky", num: "04", img: IMG.blue, alt: "Electric blue foam clog",
    word: "sky high", fs: "clamp(110px, 17vw, 280px)", wordColor: "#ffffff", align: "",
    base: "#a9cdff", bg: "linear-gradient(180deg, #5e9dff, #a9cdff 60%, #e2efff)",
    ink: "#0b1c4d", btn: "solid", deco: "clouds", fly: "flyL",
    tag: "Electric blue", desc: "Cloud-light foam in a sky-bright blue.",
  },
  {
    id: "violet", num: "05", img: IMG.violet, alt: "Digital violet foam clog",
    word: "digital\nviolet", fs: "clamp(100px, 15vw, 240px)", wordColor: "#ffffff", align: "left",
    base: "#1406b8", bg: "radial-gradient(80% 80% at 55% 45%, #3a22ff, #1406b8 45%, #05023f)",
    ink: "#ffffff", btn: "light", deco: "rings", fly: "flyR",
    tag: "Digital violet", desc: "Neon-lit and future-proof. Built for after-hours.",
  },
];

export const BUBBLES = [
  { k: 260, s: 120, left: "22%", top: "12%" },
  { k: 520, s: 210, left: "54%", top: "4%" },
  { k: 380, s: 54, left: "72%", top: "24%" },
  { k: 700, s: 34, left: "40%", top: "30%" },
  { k: 160, s: 80, left: "12%", top: "46%" },
];

export const SPOKES = [IMG.blue, IMG.pink, IMG.lime, IMG.violet, IMG.orange, IMG.white];

export const TILES = [
  { cap: "City", img: IMG.white, r: -8, bg: "linear-gradient(160deg, #7fb6ff, #d9ecff)" },
  { cap: "Beach", img: IMG.pink, r: 6, bg: "linear-gradient(160deg, #ffd9a8, #ff9a6b)" },
  { cap: "Garden", img: IMG.lime, r: -4, bg: "linear-gradient(160deg, #2f6b3a, #9fd08a)" },
  { cap: "Studio", img: IMG.black, r: 8, bg: "linear-gradient(160deg, #f4ede4, #cdbba5)" },
  { cap: "Night", img: IMG.violet, r: -6, bg: "linear-gradient(160deg, #0b0640, #3a22ff)" },
  { cap: "Pool", img: IMG.orange, r: 5, bg: "linear-gradient(160deg, #5fd3e6, #c9f3f8)" },
];

export const SWATCHES = [
  { name: "Classic", hex: "#f0520f", img: IMG.orange },
  { name: "Bubblegum", hex: "#ff4fa3", img: IMG.pink },
  { name: "Lime punch", hex: "#9be22b", img: IMG.lime },
  { name: "Electric blue", hex: "#1f5bff", img: IMG.blue },
  { name: "Digital violet", hex: "#5a3bff", img: IMG.violet },
  { name: "Midnight", hex: "#1c1714", img: IMG.black },
];

export const SIZES = ["M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11"];
