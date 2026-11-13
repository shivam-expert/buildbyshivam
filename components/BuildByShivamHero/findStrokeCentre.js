const SAMPLE_PX = 300;
const DIAG = Math.SQRT2;

/**
 * Finds where the camera should dive into a glyph.
 *
 * Renders `ch` offscreen and computes a chamfer distance transform of its ink.
 * Returns, in glyph-relative units (x as a fraction of the advance width, y and
 * radius as fractions of the font size above the baseline):
 *  - `centre`: the centre of the glyph's ink bounding box (its visual centre)
 *  - `dive`:   the thick-stroke point nearest that centre, plus the stroke radius there
 * Returns null if the glyph has no ink (e.g. the font failed to load).
 *
 * Results do not depend on viewport size, so call it once per font.
 */
export function findStrokeCentre(ch, applyFont) {
  const F = SAMPLE_PX;
  const canvas = document.createElement("canvas");
  canvas.width = F * 2;
  canvas.height = Math.round(F * 1.4);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  applyFont(ctx, F);
  const originX = F * 0.2;
  const baseline = F * 1.05;
  ctx.fillText(ch, originX, baseline);
  const advance = ctx.measureText(ch).width;
  if (!advance) return null;

  const { width: w, height: h } = canvas;
  const alpha = ctx.getImageData(0, 0, w, h).data;
  const INF = 1e9;
  const dist = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) dist[i] = alpha[i * 4 + 3] > 127 ? INF : 0;

  // Two-pass chamfer distance transform: each ink pixel gets its distance to the nearest edge.
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!dist[i]) continue;
      dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - w] + 1, dist[i - w - 1] + DIAG, dist[i - w + 1] + DIAG);
    }
  }
  for (let y = h - 2; y > 0; y--) {
    for (let x = w - 2; x > 0; x--) {
      const i = y * w + x;
      if (!dist[i]) continue;
      dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + w] + 1, dist[i + w + 1] + DIAG, dist[i + w - 1] + DIAG);
    }
  }

  let minX = w, maxX = 0, minY = h, maxY = 0, maxDist = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = dist[y * w + x];
      if (!v) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (v < INF && v > maxDist) maxDist = v;
    }
  }
  if (!maxDist) return null;

  const centreX = (minX + maxX) / 2;
  const centreY = (minY + maxY) / 2;

  // Dive point: the thick-ink pixel (≥60% of the max stroke radius) closest to the visual centre.
  let best = Infinity, diveX = centreX, diveY = centreY, diveR = maxDist;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const v = dist[y * w + x];
      if (!v || v >= INF || v < maxDist * 0.6) continue;
      const d = Math.hypot(x - centreX, y - centreY);
      if (d < best) {
        best = d;
        diveX = x;
        diveY = y;
        diveR = v;
      }
    }
  }

  return {
    centre: { u: (centreX - originX) / advance, v: (baseline - centreY) / F },
    dive: { u: (diveX - originX) / advance, v: (baseline - diveY) / F, r: diveR / F },
  };
}
