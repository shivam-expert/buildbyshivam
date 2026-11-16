export const FILMS = [
  { t: "Salt Road", jp: "塩の道", y: 1979, g: "Western", m: 121, art: "mountains", bg: "#e6d6b8", ink2: "#2a1d12", ac: "#b5562e", spine: "#e2d1b0", spineInk: "#2a1d12",
    syn: "A salt trader and a runaway cartographer cross a desert that their maps insist should not exist." },
  { t: "Night Swimmers", jp: "夜の泳者", y: 1993, g: "Drama", m: 98, art: "waves", bg: "#0d1f3a", ink2: "#dbe8ff", ac: "#59b7e8", spine: "#123a73", spineInk: "#e3eeff",
    syn: "Every August, four friends swim out to the old buoy at midnight. This year only three come back to shore — and the fourth keeps writing." },
  { t: "Paper Cranes", jp: "折り鶴", y: 1984, g: "Romance", m: 112, art: "birds", bg: "#f1ece1", ink2: "#191919", ac: "#c23b2b", spine: "#efe8da", spineInk: "#191919",
    syn: "A widowed printer folds one crane a day for the stranger who leaves letters in his shop's returns slot." },
  { t: "The Quiet Room", jp: "静かな部屋", y: 1990, g: "Psychological", m: 103, art: "portrait", bg: "#1c1c1e", ink2: "#ece6dc", ac: "#d6cbbb", spine: "#232325", spineInk: "#ece6dc",
    syn: "A sound engineer is hired to record absolute silence in an empty house, and keeps hearing a voice in the playback." },
  { t: "Ash Garden", jp: "灰の庭", y: 1982, g: "Drama", m: 126, art: "sun", bg: "#f0dfc6", ink2: "#2b160f", ac: "#e0662b", spine: "#e3612a", spineInk: "#fff2e3",
    syn: "After the fire, a gardener replants the town's orchard tree by tree, though no one remembers who owns the land." },
  { t: "Harbor Light", jp: "港の灯", y: 1987, g: "Drama", m: 104, art: "lighthouse", bg: "#efe4cf", ink2: "#1b1b1b", ac: "#d8412f", spine: "#ece1ca", spineInk: "#1b1b1b",
    syn: "A keeper's daughter tends the last manual lighthouse on the coast during its final week before the lamp goes dark for good." },
  { t: "Low Moon", jp: "低い月", y: 1991, g: "Mystery", m: 97, art: "moon", bg: "#0f2348", ink2: "#e8eefc", ac: "#eef0f6", spine: "#1d4fb8", spineInk: "#eef3ff",
    syn: "Two night-ferry workers find a suitcase that keeps reappearing on the same seat, crossing after crossing." },
  { t: "Night Corridor", jp: "夜の廊下", y: 1989, g: "Thriller", m: 114, art: "corridor", bg: "#1a0505", ink2: "#f3d9cf", ac: "#e3312a", spine: "#5e0f10", spineInk: "#f6dcd2",
    syn: "A hotel night clerk follows a ringing phone down a hallway that grows one door longer every hour until dawn." },
  { t: "Neon Rain", jp: "ネオンの雨", y: 1995, g: "Noir", m: 109, art: "rain", bg: "#140d1f", ink2: "#ffd9f2", ac: "#ff4fae", spine: "#2a1340", spineInk: "#ffd3ef",
    syn: "A taxi driver keeps picking up the same passenger in a different district of the city, always asking to be taken home." },
  { t: "Glass Valley", jp: "硝子の谷", y: 1986, g: "Adventure", m: 132, art: "mountains", bg: "#dfe7dc", ink2: "#11231a", ac: "#2f7a52", spine: "#1f5a3c", spineInk: "#e6f2ea",
    syn: "Surveyors charting a flooded valley find a village beneath the reservoir with its lights still on." },
  { t: "River of Stars", jp: "星の川", y: 1997, g: "Sci-Fi", m: 118, art: "stars", bg: "#140f2b", ink2: "#ece6ff", ac: "#cbbcff", spine: "#3a2a7a", spineInk: "#ece6ff",
    syn: "An observatory janitor decodes a pattern in the night sky that only appears on the nights she is working." },
  { t: "Iron Bloom", jp: "鉄の花", y: 1983, g: "Drama", m: 101, art: "flower", bg: "#ebe7d6", ink2: "#1f2414", ac: "#8a9a35", spine: "#ebe7d6", spineInk: "#1f2414",
    syn: "In a shuttered steel town, a welder builds a metal garden for the daughter who left and never wrote back." },
  { t: "Summer Ends", jp: "夏の終わり", y: 1980, g: "Coming of Age", m: 95, art: "sun", bg: "#f3e6b0", ink2: "#2b2208", ac: "#e3a21a", spine: "#e9b82f", spineInk: "#2b2208",
    syn: "The last week of the season at a seaside cinema, told through the eyes of the boy who changes the marquee letters." },
  { t: "White Static", jp: "白い雑音", y: 1999, g: "Horror", m: 92, art: "waves", bg: "#d9d9d6", ink2: "#141414", ac: "#3a3a3a", spine: "#cfcfcb", spineInk: "#141414",
    syn: "A video-store clerk discovers every rental tape has the same thirty seconds recorded over its final scene." },
];

/** Seeded PRNG so the cover art is identical on server and client. */
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Procedural cover art for a film, as an SVG string. */
function art(f, seed) {
  const { bg, ink2: ink, ac } = f;
  const R = rng(seed * 977 + 13);
  let s = `<rect width="200" height="200" fill="${bg}"/>`;
  const wave = (y, amp, len) => {
    let d = `M-10 ${y}`;
    for (let x = -10; x < 220; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`;
    return d;
  };
  switch (f.art) {
    case "lighthouse": {
      s += `<circle cx="100" cy="66" r="78" fill="${ac}" opacity=".28"/><circle cx="100" cy="66" r="44" fill="${ac}" opacity=".35"/>`;
      for (let k = -3; k <= 3; k++) s += `<polygon points="100,66 ${100 + k * 48 - 9},-10 ${100 + k * 48 + 9},-10" fill="${ac}" opacity=".35"/>`;
      for (let j = 0; j < 6; j++) s += `<path d="${wave(160 + j * 8, 3, 26)}" stroke="${ink}" stroke-width="1.4" fill="none" opacity="${0.35 + j * 0.1}"/>`;
      s += `<path d="M0 200 L0 176 Q25 158 52 168 L74 154 L126 156 Q150 148 172 166 L200 170 L200 200Z" fill="${ink}"/>`;
      const tw = (y) => 7 + ((y - 78) / 77) * 6;
      s += `<polygon points="${100 - tw(155)},155 ${100 + tw(155)},155 ${100 + tw(78)},78 ${100 - tw(78)},78" fill="${bg}" stroke="${ink}" stroke-width="1.5"/>`;
      [[92, 102], [116, 126], [140, 150]].forEach(([a, b]) => (s += `<polygon points="${100 - tw(a)},${a} ${100 + tw(a)},${a} ${100 + tw(b)},${b} ${100 - tw(b)},${b}" fill="${ac}"/>`));
      s += `<rect x="91" y="64" width="18" height="14" fill="${ink}"/><rect x="94" y="67" width="12" height="8" fill="#fff4c4"/><polygon points="88,64 112,64 100,52" fill="${ink}"/>`;
      break;
    }
    case "moon": {
      for (let i = 0; i < 30; i++) s += `<circle cx="${R() * 200}" cy="${R() * 120}" r="${R() * 0.9 + 0.3}" fill="${ac}" opacity="${R() * 0.7 + 0.2}"/>`;
      s += `<circle cx="100" cy="76" r="42" fill="${ac}"/>`;
      for (let i = 0; i < 6; i++) s += `<circle cx="${80 + R() * 40}" cy="${58 + R() * 36}" r="${R() * 6 + 2}" fill="${bg}" opacity=".12"/>`;
      s += `<rect y="128" width="200" height="72" fill="#000" opacity=".35"/>`;
      for (let k = 0; k < 9; k++) s += `<rect x="${100 - (62 - k * 6) / 2}" y="${134 + k * 7}" width="${62 - k * 6}" height="2.4" rx="1.2" fill="${ac}" opacity="${0.8 - k * 0.07}"/>`;
      break;
    }
    case "corridor": {
      s += `<defs><radialGradient id="kmg${seed}" cx="50%" cy="68%" r="40%"><stop offset="0" stop-color="${ac}"/><stop offset="1" stop-color="${ac}" stop-opacity="0"/></radialGradient></defs>`;
      for (let k = 0; k < 9; k++) {
        const w = 190 - k * 19, x1 = 100 - w / 2, x2 = 100 + w / 2, top = 18 + k * 11, r = w / 2;
        s += `<path d="M${x1} 205 L${x1} ${top + r} A${r} ${r} 0 0 1 ${x2} ${top + r} L${x2} 205Z" fill="${k % 2 ? "#2a0807" : "#160403"}" stroke="${ac}" stroke-opacity="${0.15 + k * 0.08}" stroke-width="1.2"/>`;
      }
      s += `<rect width="200" height="200" fill="url(#kmg${seed})" opacity=".85"/>`;
      s += `<path d="M86 205 L86 140 A14 14 0 0 1 114 140 L114 205Z" fill="${ac}"/><path d="M92 205 L92 146 A8 8 0 0 1 108 146 L108 205Z" fill="#ffb59c"/>`;
      s += `<circle cx="100" cy="160" r="4.2" fill="#0a0000"/><path d="M95 168 Q100 164 105 168 L106.5 196 L102 196 L100 182 L98 196 L93.5 196Z" fill="#0a0000"/>`;
      break;
    }
    case "birds": {
      s += `<circle cx="138" cy="64" r="34" fill="${ac}"/>`;
      s += `<path d="M-5 168 Q60 150 110 160 T205 140" stroke="${ink}" stroke-width="3" fill="none"/><path d="M60 156 q10 -14 22 -12" stroke="${ink}" stroke-width="2" fill="none"/>`;
      for (let i = 0; i < 14; i++) {
        const x = 20 + R() * 160, y = 22 + R() * 110, z = 4 + R() * 9;
        s += `<path d="M${x - z} ${y} Q${x - z / 2} ${y - z * 0.7} ${x} ${y} Q${x + z / 2} ${y - z * 0.7} ${x + z} ${y}" stroke="${ink}" stroke-width="${1.2 + z * 0.12}" fill="none" stroke-linecap="round"/>`;
      }
      break;
    }
    case "waves": {
      s += `<circle cx="150" cy="44" r="16" fill="${ac}" opacity=".9"/>`;
      for (let j = 0; j < 11; j++) s += `<path d="${wave(70 + j * 13, 4 + j * 0.6, 30 + j * 2)}" stroke="${ac}" stroke-width="${1.5 + j * 0.25}" fill="none" opacity="${0.3 + j * 0.065}"/>`;
      break;
    }
    case "sun": {
      s += `<circle cx="100" cy="98" r="58" fill="${ac}"/>`;
      for (let k = 0; k < 7; k++) s += `<rect x="30" y="${104 + k * 8.5}" width="140" height="${1.5 + k * 1.1}" fill="${bg}"/>`;
      s += `<polygon points="0,200 0,152 44,122 78,146 118,108 160,140 200,124 200,200" fill="${ink}"/>`;
      s += `<polygon points="0,200 0,172 60,156 120,170 200,152 200,200" fill="${ink}" opacity=".7"/>`;
      break;
    }
    case "portrait": {
      s += `<circle cx="100" cy="82" r="66" fill="${ac}" opacity=".08"/>`;
      s += `<path d="M28 205 Q36 142 100 134 Q164 142 172 205Z" fill="${ac}"/><rect x="88" y="104" width="24" height="36" fill="${ac}"/>`;
      s += `<ellipse cx="100" cy="80" rx="31" ry="38" fill="${ac}"/>`;
      s += `<path d="M66 82 Q62 36 102 38 Q140 38 136 76 Q124 52 98 54 Q76 58 70 96Z" fill="${bg}"/>`;
      s += `<rect x="100" y="0" width="100" height="200" fill="#000" opacity=".38"/>`;
      s += `<path d="M84 80 h10 M106 80 h10" stroke="${bg}" stroke-width="2.2" stroke-linecap="round"/>`;
      break;
    }
    case "rain": {
      for (let i = 0; i < 70; i++) {
        const x = R() * 230 - 20, y = R() * 200, l = 8 + R() * 16;
        s += `<line x1="${x}" y1="${y}" x2="${x - l * 0.35}" y2="${y + l}" stroke="${ac}" stroke-width="1" opacity="${R() * 0.6 + 0.2}"/>`;
      }
      s += `<rect y="176" width="200" height="24" fill="${ac}" opacity=".18"/>`;
      s += `<path d="M64 122 A36 30 0 0 1 136 122 Q118 116 100 122 Q82 116 64 122Z" fill="${ac}"/><line x1="100" y1="122" x2="100" y2="148" stroke="#08050c" stroke-width="2"/>`;
      s += `<circle cx="100" cy="134" r="6" fill="#08050c"/><path d="M92 142 Q100 138 108 142 L111 184 L104 184 L100 166 L96 184 L89 184Z" fill="#08050c"/>`;
      break;
    }
    case "mountains": {
      s += `<circle cx="${60 + R() * 80}" cy="54" r="22" fill="${ac}" opacity=".85"/>`;
      [0.3, 0.55, 1].forEach((o, L) => {
        let p = `0,200 0,${120 + L * 20}`, x = 0;
        while (x < 200) {
          x += 22 + R() * 30;
          p += ` ${x},${70 + L * 30 + R() * 40}`;
        }
        p += ` 200,${130 + L * 20} 200,200`;
        s += `<polygon points="${p}" fill="${L === 2 ? ink : ac}" opacity="${o}"/>`;
      });
      break;
    }
    case "stars": {
      for (let i = 0; i < 90; i++) s += `<circle cx="${R() * 200}" cy="${R() * 170}" r="${R() * 1.4 + 0.3}" fill="${ac}" opacity="${R() * 0.8 + 0.2}"/>`;
      s += `<path d="M-10 120 Q60 70 120 104 T210 60" stroke="${ac}" stroke-width="14" fill="none" opacity=".12"/>`;
      s += `<circle cx="148" cy="52" r="20" fill="${ac}"/><circle cx="157" cy="46" r="18" fill="${bg}"/>`;
      s += `<polygon points="0,200 0,170 40,150 70,166 110,140 150,164 200,150 200,200" fill="#05040c"/>`;
      break;
    }
    case "flower": {
      s += `<path d="M100 200 Q96 150 100 96" stroke="${ink}" stroke-width="3" fill="none"/><path d="M99 150 Q78 136 70 146 Q84 156 99 150Z" fill="${ink}"/>`;
      for (let k = 0; k < 10; k++) s += `<ellipse cx="100" cy="58" rx="11" ry="30" fill="${ac}" opacity=".9" transform="rotate(${k * 36} 100 88)"/>`;
      s += `<circle cx="100" cy="88" r="13" fill="${ink}"/>`;
      for (let k = 0; k < 16; k++) s += `<line x1="0" y1="${12 + k * 12}" x2="200" y2="${12 + k * 12}" stroke="${ink}" stroke-width=".5" opacity=".12"/>`;
      break;
    }
  }
  return `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
}

/** Cover art for each film, built once (deterministic, so server and client match). */
export const ART = FILMS.map((f, i) => art(f, i));
