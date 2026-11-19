/* Card art: each card is a mini "website" drawn on a 1280×800 canvas. */
import { F } from "./fonts";

export const CW = 1280;
export const CH = 800;

export function mk(w = CW, h = CH) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function rand(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647), (s - 1) / 2147483646);
}
function nav(ctx, brand, color, items, pill) {
  ctx.fillStyle = color; ctx.font = `600 24px ${F.sans}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillText(brand, 56, 62);
  ctx.font = `500 19px ${F.sans}`; ctx.globalAlpha = 0.7;
  let x = CW - 56; ctx.textAlign = "right";
  if (pill) {
    ctx.globalAlpha = 1; ctx.font = `600 18px ${F.sans}`;
    const w = ctx.measureText(pill.t).width + 44;
    rr(ctx, x - w, 40, w, 44, 22);
    if (pill.fill) { ctx.fillStyle = pill.fill; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.fillStyle = pill.color || color; ctx.textAlign = "center"; ctx.fillText(pill.t, x - w / 2, 63); ctx.textAlign = "right";
    x -= w + 34; ctx.globalAlpha = 0.7; ctx.font = `500 19px ${F.sans}`; ctx.fillStyle = color;
  }
  for (let i = items.length - 1; i >= 0; i--) { ctx.fillText(items[i], x, 62); x -= ctx.measureText(items[i]).width + 34; }
  ctx.globalAlpha = 1; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}

function drawTerra(ctx) {
  ctx.fillStyle = "#ece2d4"; ctx.fillRect(0, 0, CW, CH);
  nav(ctx, "terra.", "#33241b", ["Shop", "Studio", "Journal"], { t: "Cart (2)" });
  ctx.fillStyle = "#2b1d15"; ctx.font = `124px ${F.serif}`; ctx.fillText("Made slow,", 64, 320);
  ctx.font = `italic 124px ${F.serif}`; ctx.fillText("by hand.", 64, 440);
  ctx.font = `400 23px ${F.sans}`; ctx.fillStyle = "rgba(43,29,21,.7)";
  ctx.fillText("Small-batch stoneware, thrown and glazed", 66, 520); ctx.fillText("in our Jaipur studio.", 66, 552);
  rr(ctx, 64, 610, 250, 66, 33); ctx.fillStyle = "#b4532e"; ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = `600 22px ${F.sans}`; ctx.fillText("Shop the kiln  →", 94, 651);
  ctx.fillStyle = "#dcc6ab"; ctx.beginPath(); ctx.moveTo(760, CH); ctx.lineTo(760, 360); ctx.arc(970, 360, 210, Math.PI, 0); ctx.lineTo(1180, CH); ctx.fill();
  ctx.fillStyle = "rgba(60,30,15,.22)"; ctx.beginPath(); ctx.ellipse(985, 700, 150, 22, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(830, 0, 1110, 0); g.addColorStop(0, "#d98157"); g.addColorStop(0.45, "#c0613a"); g.addColorStop(1, "#7e3519");
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(935, 290); ctx.lineTo(1005, 290);
  ctx.bezierCurveTo(1000, 360, 1110, 420, 1105, 540); ctx.bezierCurveTo(1100, 640, 1050, 690, 1040, 700);
  ctx.lineTo(900, 700); ctx.bezierCurveTo(890, 690, 840, 640, 835, 540); ctx.bezierCurveTo(830, 420, 940, 360, 935, 290); ctx.fill();
  ctx.fillStyle = "#8a3c1d"; ctx.beginPath(); ctx.ellipse(970, 290, 36, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,230,200,.25)"; ctx.beginPath(); ctx.ellipse(900, 500, 18, 90, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(60,20,5,.25)"; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(970, 470 + i * 26, 128 - i * 2, 10, 0, 0, Math.PI); ctx.stroke(); }
}

function drawOrbit(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#9fbdf0"); g.addColorStop(0.48, "#f7d9b4"); g.addColorStop(0.62, "#c9c3a0"); g.addColorStop(0.63, "#7f9a52"); g.addColorStop(1, "#33471f");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  ctx.strokeStyle = "rgba(30,50,15,.35)"; ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) { const y = 510 + i * i * 1.6; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }
  nav(ctx, "ORBIT ATLAS", "#fff", ["Destinations", "Fleet", "Journal"], { t: "Book a seat", fill: "#fff", color: "#1b2440" });
  ctx.save(); rr(ctx, 390, 120, 520, 480, 40); ctx.clip();
  ctx.fillStyle = "#06070c"; ctx.fillRect(390, 120, 520, 480);
  const r = rand(7);
  for (let i = 0; i < 220; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; ctx.beginPath(); ctx.arc(390 + r() * 520, 120 + r() * 480, r() * 1.8 + 0.3, 0, 7); ctx.fill(); }
  const pg = ctx.createRadialGradient(560, 560, 30, 650, 690, 330); pg.addColorStop(0, "#f2c79a"); pg.addColorStop(0.55, "#c27b4b"); pg.addColorStop(1, "#5a2c17");
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(650, 700, 320, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(90,40,20,.35)";
  [[560, 470, 40, 20], [720, 520, 60, 26], [640, 600, 30, 14], [780, 430, 22, 10], [500, 560, 26, 12]].forEach((c) => { ctx.beginPath(); ctx.ellipse(...c, 0, 0, 7); ctx.fill(); });
  ctx.strokeStyle = "rgba(255,210,170,.5)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(650, 700, 322, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#fff"; ctx.font = `64px ${F.serif}`; ctx.fillText("Travel beyond", 60, 250); ctx.font = `italic 64px ${F.serif}`; ctx.fillText("the horizon.", 60, 318);
  ctx.font = `500 20px ${F.sans}`; ctx.fillText("Next departure — Mars, 2031", 60, 380);
  ctx.textAlign = "right"; ctx.fillText("Seats left  · 042", CW - 60, 380); ctx.textAlign = "left";
}

function drawKernel(ctx) {
  ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, CW, CH);
  nav(ctx, "KernelCode", "#f2f2ea", ["Work", "Services", "Team"], { t: "Start a project" });
  ctx.fillStyle = "#f2f2ea"; ctx.font = `600 62px ${F.sans}`; ctx.fillText("We ship a", 64, 200); ctx.fillText("modern stack.", 64, 270);
  const o = mk(), oc = o.getContext("2d");
  oc.fillStyle = "#000"; oc.font = `400 330px ${F.black}`; oc.textAlign = "center"; oc.fillText("</>", 700, 650);
  const d = oc.getImageData(0, 0, CW, CH).data, r = rand(3);
  for (let y = 300; y < 720; y += 9)
    for (let x = 200; x < 1220; x += 9) {
      if (d[(y * CW + x) * 4 + 3] > 120) {
        ctx.fillStyle = `rgba(236,236,224,${0.45 + r() * 0.55})`; ctx.beginPath();
        ctx.arc(x + (r() - 0.5) * 2, y + (r() - 0.5) * 2, 1.6 + r() * 2.2, 0, 7); ctx.fill();
      }
    }
  ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(64, 705, CW - 128, 1);
  ctx.fillStyle = "rgba(242,242,234,.6)"; ctx.font = `400 18px ${F.mono}`; ctx.fillText("React · Next.js · Tailwind · GSAP", 64, 745);
  ctx.textAlign = "right"; ctx.fillText("(scroll)", CW - 64, 745); ctx.textAlign = "left";
}

function drawGridlock(ctx) {
  ctx.fillStyle = "#0b0b0b"; ctx.fillRect(0, 0, CW, CH);
  nav(ctx, "GRIDLOCK", "#fff", ["Lineup", "Tickets", "Archive"]);
  const g = ctx.createLinearGradient(0, 150, 0, 720); g.addColorStop(0, "#ffb21a"); g.addColorStop(1, "#ff3d00");
  ctx.fillStyle = g; ctx.fillRect(1010, 140, 210, 580);
  ctx.fillStyle = "#fff"; ctx.font = `238px ${F.anton}`; ctx.fillText("GRIDLOCK", 48, 380); ctx.fillText("HYPNOTICS", 48, 640);
  ctx.font = `400 18px ${F.mono}`; ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.fillText("LIVE AT THE WAREHOUSE — 22.11 / 23:00", 52, 722);
}

function drawHalcyon(ctx) {
  const g = ctx.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, "#e3f4ee"); g.addColorStop(1, "#cddff8"); ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  const o = ctx.createRadialGradient(930, 410, 10, 930, 410, 300); o.addColorStop(0, "#ffffff"); o.addColorStop(0.45, "#a7e3d3"); o.addColorStop(1, "rgba(167,227,211,0)");
  ctx.fillStyle = o; ctx.beginPath(); ctx.arc(930, 410, 300, 0, 7); ctx.fill();
  nav(ctx, "halcyon", "#0f3d36", ["Clinics", "Doctors", "Insurance"], { t: "Book a visit", fill: "#0f3d36", color: "#fff" });
  ctx.fillStyle = "#0f3d36"; ctx.font = `120px ${F.serif}`; ctx.fillText("Care that", 64, 320); ctx.font = `italic 120px ${F.serif}`; ctx.fillText("feels human.", 64, 436);
  ctx.font = `400 23px ${F.sans}`; ctx.fillStyle = "rgba(15,61,54,.7)"; ctx.fillText("Same-day appointments across 14 clinics.", 66, 510);
  [["4.9 ★", "patient rating"], ["24/7", "tele-consults"]].forEach((s, i) => {
    const x = 64 + i * 270; rr(ctx, x, 580, 240, 110, 22); ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.fill();
    ctx.fillStyle = "#0f3d36"; ctx.font = `600 34px ${F.sans}`; ctx.fillText(s[0], x + 24, 628);
    ctx.font = `400 18px ${F.sans}`; ctx.fillStyle = "rgba(15,61,54,.65)"; ctx.fillText(s[1], x + 24, 664);
  });
}

function drawLedger(ctx) {
  ctx.fillStyle = "#0a0e19"; ctx.fillRect(0, 0, CW, CH);
  nav(ctx, "Ledger", "#e9ecff", ["Accounts", "Invest", "Cards"], { t: "Open app", fill: "#7c8cff", color: "#0a0e19" });
  ctx.fillStyle = "rgba(233,236,255,.5)"; ctx.font = `400 18px ${F.mono}`; ctx.fillText("PORTFOLIO VALUE", 64, 170);
  ctx.fillStyle = "#fff"; ctx.font = `600 96px ${F.sans}`; ctx.fillText("₹48,21,900", 60, 270);
  ctx.fillStyle = "#5cf0a6"; ctx.font = `500 24px ${F.sans}`; ctx.fillText("▲ 12.4%  this quarter", 64, 320);
  ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
  for (let y = 400; y <= 740; y += 68) { ctx.beginPath(); ctx.moveTo(64, y); ctx.lineTo(CW - 64, y); ctx.stroke(); }
  const r = rand(11), pts = [];
  let v = 640;
  for (let i = 0; i <= 40; i++) { v += (r() - 0.62) * 34; v = Math.max(420, Math.min(720, v)); pts.push([64 + (i * (CW - 128)) / 40, v]); }
  const fill = ctx.createLinearGradient(0, 400, 0, 760); fill.addColorStop(0, "rgba(124,140,255,.35)"); fill.addColorStop(1, "rgba(124,140,255,0)");
  ctx.beginPath(); ctx.moveTo(pts[0][0], 760); pts.forEach((p) => ctx.lineTo(...p)); ctx.lineTo(pts[40][0], 760); ctx.fillStyle = fill; ctx.fill();
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.strokeStyle = "#8f9cff"; ctx.lineWidth = 4; ctx.shadowColor = "#7c8cff"; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0;
  const L = pts[40]; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(L[0], L[1], 8, 0, 7); ctx.fill();
}

function drawExpo(ctx) {
  ctx.fillStyle = "#f2f0ea"; ctx.fillRect(0, 0, CW, CH);
  ctx.strokeStyle = "#dcd7cb"; ctx.lineWidth = 1;
  for (let x = 0; x < CW; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
  for (let y = 0; y < CH; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }
  nav(ctx, "EXPO/26", "#111", ["Programme", "Exhibitors", "Visit"], { t: "Get passes", fill: "#111", color: "#f2f0ea" });
  ctx.fillStyle = "#111"; ctx.font = `560px ${F.black}`; ctx.textAlign = "right"; ctx.fillText("26", CW - 40, 740); ctx.textAlign = "left";
  ctx.fillStyle = "#ff3b2f"; ctx.beginPath(); ctx.arc(300, 560, 64, 0, 7); ctx.fill();
  ctx.fillStyle = "#111"; ctx.font = `76px ${F.black}`; ctx.fillText("DESIGN", 60, 250); ctx.fillText("WEEK", 60, 334);
  ctx.font = `500 24px ${F.sans}`; ctx.fillText("Mumbai — 12–15 Feb", 62, 392);
}

function drawQuiet(ctx) {
  ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, CW, CH);
  nav(ctx, "quiet", "#eee", ["Phone", "Tech", "Story"]);
  ctx.fillStyle = "#f1f1f1"; ctx.font = `700 150px ${F.mono}`; ctx.fillText("Less", 56, 300); ctx.fillText("noise.", 56, 450);
  ctx.strokeStyle = "#888"; ctx.lineWidth = 4; rr(ctx, 470, 195, 64, 104, 18); ctx.stroke(); ctx.beginPath(); ctx.arc(502, 225, 11, 0, 7); ctx.stroke();
  ctx.fillStyle = "rgba(241,241,241,.55)"; ctx.font = `400 19px ${F.mono}`;
  ["A phone that does fewer things,", "beautifully. One screen, no feeds,", "a battery that lasts the week."].forEach((t, i) => ctx.fillText(t, 62, 530 + i * 30));
  rr(ctx, 62, 650, 200, 58, 29); ctx.fillStyle = "#ff5a3c"; ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = `700 19px ${F.mono}`; ctx.fillText("Pre-order", 100, 686);
  ctx.save(); ctx.translate(1040, 410); ctx.rotate(0.12); rr(ctx, -140, -290, 280, 580, 48);
  const pg = ctx.createLinearGradient(-140, 0, 140, 0); pg.addColorStop(0, "#1d1d1d"); pg.addColorStop(1, "#2c2c2c");
  ctx.fillStyle = pg; ctx.fill(); ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#0c0c0c"; ctx.beginPath(); ctx.arc(-60, -200, 42, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(30, -200, 30, 0, 7); ctx.fill();
  ctx.fillStyle = "#ddd";
  for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) { if ((i + j) % 2) continue; ctx.beginPath(); ctx.arc(-70 + i * 18, 40 + j * 18, 4, 0, 7); ctx.fill(); }
  ctx.restore();
}

function drawGeometry(ctx) {
  ctx.fillStyle = "#121214"; ctx.fillRect(0, 0, CW, CH);
  ctx.save(); ctx.translate(900, 420); ctx.lineWidth = 1.4;
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + 0.12 * Math.sin((i / 40) * Math.PI)})`;
    ctx.beginPath(); ctx.ellipse(0, 0, 320, 110, (i * Math.PI) / 40, 0, 7); ctx.stroke();
  }
  ctx.restore();
  nav(ctx, "Soft Geometry", "#fff", ["Work", "Studio", "Contact"]);
  ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = `400 18px ${F.mono}`; ctx.fillText("IDENTITY SYSTEM / 2026", 62, 200);
  ctx.fillStyle = "#fff"; ctx.font = `124px ${F.black}`; ctx.fillText("SOFT", 56, 360); ctx.fillText("GEOMETRY", 56, 490);
  ctx.font = `400 22px ${F.sans}`; ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.fillText("Typography, motion and form for a Berlin design studio.", 60, 580);
}

function drawAurora(ctx) {
  ctx.fillStyle = "#0c0a1c"; ctx.fillRect(0, 0, CW, CH);
  ctx.globalCompositeOperation = "lighter";
  ["124,92,255", "255,111,177", "61,224,208", "255,179,92"].forEach((c, k) => {
    for (let x = -100; x < CW + 100; x += 22) {
      const y = 330 + Math.sin(x * 0.006 + k * 1.4) * 110 + k * 34;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 130); g.addColorStop(0, `rgba(${c},.10)`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - 130, y - 130, 260, 260);
    }
  });
  ctx.globalCompositeOperation = "source-over";
  nav(ctx, "aurora", "#fff", ["Speakers", "Sound", "Stores"], { t: "Listen" });
  ctx.fillStyle = "#fff"; ctx.font = `124px ${F.serif}`; ctx.fillText("Sound you", 60, 610); ctx.font = `italic 124px ${F.serif}`; ctx.fillText("can see.", 60, 720);
  ctx.textAlign = "right"; ctx.font = `400 18px ${F.mono}`; ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.fillText("AURORA ONE — SPATIAL SPEAKER", CW - 60, 720); ctx.textAlign = "left";
}

export function drawLabel(p) {
  const c = mk(CW, 96), ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.textBaseline = "middle";
  ctx.font = `500 42px ${F.sans}`; ctx.fillText(p.name, 6, 48);
  const w = ctx.measureText(p.name).width;
  ctx.globalAlpha = 0.42; ctx.font = `400 30px ${F.sans}`; ctx.fillText(p.meta, w + 26, 50);
  return c;
}

export const PROJECTS = [
  { name: "Terra", meta: "Shopify · E‑commerce", draw: drawTerra },
  { name: "Orbit Atlas", meta: "Travel · WebGL", draw: drawOrbit },
  { name: "KernelCode", meta: "Dev studio · Next.js", draw: drawKernel },
  { name: "Gridlock", meta: "Music · Event site", draw: drawGridlock },
  { name: "Halcyon", meta: "Healthcare · Clinics", draw: drawHalcyon },
  { name: "Ledger", meta: "Fintech · Dashboard", draw: drawLedger },
  { name: "Expo 26", meta: "Exhibitions · Events", draw: drawExpo },
  { name: "Quiet Phone", meta: "Product · Launch page", draw: drawQuiet },
  { name: "Soft Geometry", meta: "Studio · Identity", draw: drawGeometry },
  { name: "Aurora", meta: "Audio · GSAP motion", draw: drawAurora },
];

/** Strings for document.fonts.load so the canvas art never draws with fallback fonts. */
export const FONT_LOADS = [
  `600 24px ${F.sans}`, `500 42px ${F.sans}`, `400 23px ${F.sans}`,
  `124px ${F.serif}`, `italic 124px ${F.serif}`,
  `100px ${F.black}`, `100px ${F.anton}`,
  `400 18px ${F.mono}`, `700 18px ${F.mono}`,
];
