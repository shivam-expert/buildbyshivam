// One timeline for the whole story, in "beats". Scroll progress (0 → 1) maps to t = p * TOTAL.
// Every value here is 0 → 1; the scene reads SceneState, the DOM reads CSS variables.

export const TOTAL = 21.6;
export const LABELS = { start: 0, notes: 8.6, details: 13.3, comp: 17.4, shop: 20.6 };

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (t, at, dur) => clamp((t - at) / dur);
const inOut2 = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const inOut3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const out3 = (x) => 1 - Math.pow(1 - x, 3);

// Letter / item staggers. The CSS module uses the same duration + step to stagger each child,
// so a group var only needs to cover the whole group's span: dur + (n - 1) * step.
export const STAGGER = {
  heroIn: { dur: 1.1, step: 0.035 },
  heroOut: { dur: 0.7, step: 0.025 },
  head: { dur: 0.8, step: 0.03 },
  notes: { dur: 0.7, step: 0.22, n: 3 },
  callouts: { dur: 0.5, step: 0.2, n: 5 },
  stats: { dur: 0.5, step: 0.15, n: 4 },
  shop: { dur: 0.6, step: 0.1, n: 6 },
};
const span = (s, n = s.n) => s.dur + (n - 1) * s.step;

export function sceneState(t) {
  return {
    explode: inOut2(seg(t, 0.4, 3.8)),
    settle: inOut3(seg(t, 4.0, 2.3)),
    mist: seg(t, 5.0, 1.6),
    spray: seg(t, 7.9, 1.0),
    detail: inOut3(seg(t, 10.2, 2.2)),
    down: inOut3(seg(t, 14.3, 2.0)),
    buy: inOut3(seg(t, 18.1, 2.2)),
  };
}

/** CSS variables for the DOM layer. `chars` holds the letter count of each headline. */
export function domVars(t, chars) {
  const h = STAGGER.head;
  return {
    "--p": t / TOTAL,
    "--hint": 1 - seg(t, 0.1, 0.3),
    "--hout": seg(t, 1.9, span(STAGGER.heroOut, chars.hero)),
    "--hmeta": 1 - seg(t, 1.9, 0.6),
    "--s2": seg(t, 5.8, span(h, chars.s2)),
    "--s2m": seg(t, 6.4, 0.6),
    "--notes": seg(t, 6.6, span(STAGGER.notes)),
    "--edp": seg(t, 7.2, 0.5),
    "--s2out": seg(t, 10.1, 0.7),
    "--k3": seg(t, 11.4, 0.5),
    "--s3": seg(t, 11.5, span(h, chars.s3)),
    "--s3m": seg(t, 12.0, 0.6),
    "--co": seg(t, 12.1, span(STAGGER.callouts)),
    "--s3out": seg(t, 14.2, 0.6),
    "--k4": seg(t, 15.2, 0.5),
    "--s4": seg(t, 15.3, span(h, chars.s4)),
    "--s4m": seg(t, 15.8, 0.6),
    "--stats": seg(t, 15.7, span(STAGGER.stats)),
    "--s4out": seg(t, 18.0, 0.6),
    "--shop": seg(t, 19.3, span(STAGGER.shop)),
    "--foot": seg(t, 19.8, 0.5),
  };
}

export const countUp = (t) => out3(seg(t, 15.8, 1.6));

export function sectionAt(t) {
  return t < 5 ? 0 : t < 11 ? 1 : t < 14.8 ? 2 : t < 18.5 ? 3 : 4;
}
