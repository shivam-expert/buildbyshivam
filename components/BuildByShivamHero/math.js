export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Progress of `p` through the window [a, b], clamped to 0..1. */
export const range = (p, [a, b]) => clamp((p - a) / (b - a));

export const lerp = (a, b, t) => a + (b - a) * t;

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
