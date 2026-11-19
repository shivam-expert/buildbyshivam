// Copy and product data for the Stone Scent story. Placeholder brand: swap freely.

export const BRAND = "BASALT";

export const HERO = {
  eyebrow: "Dark mineral notes shaped by smoke, woods and cold spice.",
  lines: ["The scent", "of stones"],
  side: "A mineral fragrance built for presence — quiet, precise and unmistakably grounded.",
  cta: "Discover the scent",
};

export const SCENT = {
  lines: ["Cut from", "the elements."],
  body: "A study in contrast — cold mineral clarity against the warmth of smoked woods, leather and resin.",
  edp: "Eau de Parfum — 100 ml",
};

export const NOTES = [
  { tier: "Top", items: ["Black pepper", "Cardamom", "Bergamot"] },
  { tier: "Heart", items: ["Flint accord", "Vetiver", "Iris"] },
  { tier: "Base", items: ["Smoked cedar", "Labdanum", "Ambergris"] },
];

export const DETAILS = {
  kicker: "The flacon",
  lines: ["Every detail,", "weighed."],
  body: "Designed like a found object — heavy in the hand, cool to the touch, and built to sit on a shelf like a piece of stone.",
};

// anchor: point on the bottle in its local space (see scene.js), side: which way the label reads
export const CALLOUTS = [
  { id: "cap", side: "right", anchor: [0.3, 0.98, 0.12], title: "Magnetic cap", text: "Solid zamak, 62 g. Closes with a soft, weighted click." },
  { id: "pump", side: "right", anchor: [0.2, 0.6, 0.1], title: "Fine-mist atomiser", text: "0.1 ml per spray — an even, quiet veil." },
  { id: "glass", side: "left", anchor: [-0.56, 0.32, 0.18], title: "Lacquered glass", text: "Thick-walled flacon in matte basalt black." },
  { id: "plate", side: "right", anchor: [0.24, -0.2, 0.56], title: "Steel plate", text: "Brushed steel, engraved by hand." },
  { id: "base", side: "left", anchor: [-0.5, -0.72, 0.3], title: "Weighted base", text: "An 8 mm glass foot, so it stands like stone." },
];

export const COMPOSITION = {
  kicker: "The composition",
  lines: ["Quiet, but", "it lingers."],
  body: "A dense extrait-strength blend that opens sharp and cold, then settles into smoke and resin close to the skin.",
  wear: ["Two sprays", "Pulse points", "Let it warm"],
};

export const STATS = [
  { to: 22, unit: "%", label: "Parfum concentration" },
  { to: 12, prefix: "10–", unit: "hrs", label: "Longevity on skin" },
  { to: 0.1, dec: 1, unit: "ml", label: "Per spray" },
  { to: 17, unit: "notes", label: "Raw materials in the blend" },
];

export const SHOP = {
  kicker: `${BRAND[0]}${BRAND.slice(1).toLowerCase()} N° 01 · Eau de Parfum`,
  lines: ["Carry the", "stone."],
  sizes: [
    { ml: 50, price: 108 },
    { ml: 100, price: 148 },
  ],
  perks: ["Complimentary 2 ml discovery vial", "Refillable flacon — keep the stone", "Free shipping over $100"],
};

export const NAV = [
  { label: "The Scent", to: "start" },
  { label: "Notes", to: "notes" },
  { label: "Details", to: "details" },
  { label: "Shop", to: "shop" },
];

export const SECTIONS = ["01 — Stone", "02 — Scent", "03 — Details", "04 — Composition", "05 — Own it"];
