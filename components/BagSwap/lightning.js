const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Midpoint-displacement path from a to b, appended to `out`. */
function jag(a, b, disp, depth, out) {
  if (depth === 0) {
    out.push(b);
    return;
  }
  const mx = (a[0] + b[0]) / 2 + (Math.random() - 0.5) * disp;
  const my = (a[1] + b[1]) / 2 + (Math.random() - 0.5) * disp;
  jag(a, [mx, my], disp / 2, depth - 1, out);
  jag([mx, my], b, disp / 2, depth - 1, out);
}

/**
 * Electric arcs drawn on a 2D canvas context. Call `bolt()` to fire one and
 * `draw(now, w, h)` every animation frame.
 */
export function createLightning(ctx) {
  const bolts = [];

  function stroke(pts, w, col, blur) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.lineWidth = w;
    ctx.strokeStyle = col;
    ctx.shadowBlur = blur;
    ctx.shadowColor = "rgba(120,140,255,.95)";
    ctx.stroke();
  }

  function bolt(a, b, dur, strength = 1) {
    bolts.push({ a, b, start: performance.now(), dur, strength, seed: 0, path: null, branches: [] });
  }

  function draw(now, w, h) {
    ctx.clearRect(0, 0, w, h);
    for (let n = bolts.length - 1; n >= 0; n--) {
      const B = bolts[n];
      const k = (now - B.start) / B.dur;
      if (k >= 1) {
        bolts.splice(n, 1);
        continue;
      }
      if (!B.path || now - B.seed > 45) {
        // re-jitter for the crackle
        B.seed = now;
        const d = Math.hypot(B.b[0] - B.a[0], B.b[1] - B.a[1]);
        B.path = [B.a];
        jag(B.a, B.b, d * 0.22, 7, B.path);
        B.branches = [];
        for (let j = 0; j < 3; j++) {
          const s = B.path[Math.floor(B.path.length * (0.25 + Math.random() * 0.6))];
          const e = [s[0] + (Math.random() - 0.5) * d * 0.35, s[1] + (Math.random() - 0.2) * d * 0.3];
          const br = [s];
          jag(s, e, d * 0.08, 4, br);
          B.branches.push(br);
        }
      }
      const reach = clamp(k / 0.35);
      const alpha = (k < 0.35 ? 1 : 1 - (k - 0.35) / 0.65) * B.strength * (0.75 + Math.random() * 0.25);
      const pts = B.path.slice(0, Math.max(2, Math.ceil(B.path.length * reach)));

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      stroke(pts, 6, `rgba(120,140,255,${0.25 * alpha})`, 24);
      stroke(pts, 2.4, `rgba(170,185,255,${0.8 * alpha})`, 12);
      stroke(pts, 1, `rgba(255,255,255,${alpha})`, 4);
      if (reach >= 1) {
        for (const br of B.branches) {
          stroke(br, 1.4, `rgba(180,195,255,${0.6 * alpha})`, 10);
          stroke(br, 0.6, `rgba(255,255,255,${0.8 * alpha})`, 2);
        }
      }
      const tip = pts[pts.length - 1];
      const gr = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 40);
      gr.addColorStop(0, `rgba(255,255,255,${0.7 * alpha})`);
      gr.addColorStop(1, "rgba(140,160,255,0)");
      ctx.fillStyle = gr;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return { bolt, draw };
}
