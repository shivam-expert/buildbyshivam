/**
 * Placement is in the model photo's own pixels (MODEL_W × MODEL_H):
 *   at   = point on the model the bag hangs from
 *   grip = that point on the bag image (0–1 of its width/height)
 *   w    = bag width in model pixels
 *   hand = which hand overlay goes on top (makes it look held)
 */
export const MODEL_W = 476;
export const MODEL_H = 1495;

export const ASSET_BASE = "/bag-swap";
export const src = (name) => `${ASSET_BASE}/${name}.webp`;

export const PRODUCTS = [
  { img: "quilted", ratio: 560 / 426, cat: "Shoulder", name: "The Pillow", price: "1,42,000", colour: "Jet black",
    desc: "Padded lambskin on a gold curb chain. Soft enough to sleep on.", at: [100, 330], grip: [0.5, 0], w: 230 },
  { img: "handle", ratio: 494 / 560, cat: "Top handle", name: "The Ledger", price: "1,18,000", colour: "Cognac",
    desc: "Structured calf with a single rolled handle and a brass catch.", at: [444, 960], grip: [0.505, 0], w: 190, hand: "R" },
  { img: "crescent", ratio: 422 / 560, cat: "Under-arm", name: "The Arc", price: "1,28,000", colour: "Chalk",
    desc: "Glossy leather in a soft curve, on a short strap that tucks in close.", at: [102, 318], grip: [0.5, 0], w: 180 },
  { img: "bucket", ratio: 497 / 560, cat: "Crossbody", name: "The Drum", price: "1,36,000", colour: "Oxblood",
    desc: "Drawstring bucket in grained leather with a long, thin strap.", at: [442, 962], grip: [0.57, 0], w: 200, hand: "R" },
  { img: "hobo", ratio: 418 / 560, cat: "Shoulder", name: "The Lull", price: "1,08,000", colour: "Rust suede",
    desc: "A slouchy suede hobo that relaxes into its own shape over time.", at: [100, 315], grip: [0.495, 0], w: 205 },
  { img: "tote", ratio: 512 / 560, cat: "Tote", name: "The Market", price: "96,000", colour: "Tan",
    desc: "Hand-woven leather tote, roomy enough for the whole day.", at: [444, 955], grip: [0.5, 0], w: 225, hand: "R" },
  { img: "clutch", ratio: 560 / 453, cat: "Clutch", name: "The Stone", price: "88,000", colour: "Mirror silver",
    desc: "A polished metal minaudière with a single pearl clasp.", at: [36, 975], grip: [0.5, 0.55], w: 170, hand: "L" },
];

/** The look the model is wearing when the page first appears. */
export const INITIAL_PRODUCT = 2;
