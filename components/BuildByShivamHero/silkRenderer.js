const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `
  precision highp float;
  uniform vec2  u_res;
  uniform float u_time;
  uniform vec2  u_mouse;
  uniform float u_vel;
  uniform float u_hover;

  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm3(vec2 p){
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 3; i++) { v += a * noise(p); p = r * p * 2.0; a *= 0.5; }
    return v;
  }
  // Flowing silk: broad, slow folds (low frequency so it reads as fabric, not texture).
  float silk(vec2 p, float t){
    vec2 q = vec2(fbm3(p * 0.45 + vec2(0.0, t * 0.05)), fbm3(p * 0.45 + vec2(4.3, -t * 0.04)));
    float f = fbm3(p * vec2(0.35, 0.7) + 1.6 * q + vec2(t * 0.025, 0.0));
    return sin(f * 11.0 + p.x * 1.1 + p.y * 0.5 - t * 0.22) * 0.5 + 0.5;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / u_res;
    float asp = u_res.x / u_res.y;
    vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 2.0;
    vec2 m = (u_mouse - 0.5) * vec2(asp, 1.0) * 2.0;
    float t = u_time;

    // The cursor gently presses into the fabric.
    vec2 dm = p - m;
    float d = length(dm);
    float press = exp(-d * d * 3.0) * u_hover;
    p += normalize(dm + 1e-4) * press * (0.12 + u_vel * 0.25) * smoothstep(0.0, 0.3, d);

    // Height + normal by finite differences, so light can rake across the folds.
    float e = 0.01;
    float h  = silk(p, t);
    float hx = silk(p + vec2(e, 0.0), t);
    float hy = silk(p + vec2(0.0, e), t);
    vec3 n = normalize(vec3((h - hx) / e * 0.11, (h - hy) / e * 0.11, 1.0));

    // Key light from the upper left, plus a soft light that follows the pointer.
    vec3 L1 = normalize(vec3(-0.5, 0.6, 0.65));
    vec3 L2 = normalize(vec3(m, 0.9) - vec3(p, 0.0));
    vec3 V = vec3(0.0, 0.0, 1.0);
    float diff  = max(dot(n, L1), 0.0);
    float spec1 = pow(max(dot(reflect(-L1, n), V), 0.0), 26.0);
    float spec2 = pow(max(dot(reflect(-L2, n), V), 0.0), 24.0) * exp(-d * d * 1.2) * u_hover;

    vec3 black = vec3(0.010, 0.010, 0.012);
    vec3 graph = vec3(0.10, 0.095, 0.09);
    vec3 ivory = vec3(0.96, 0.92, 0.86);
    vec3 champ = vec3(0.86, 0.72, 0.52);

    vec3 col = mix(black, graph * 3.6, pow(diff, 1.6));
    col += mix(graph, ivory, 0.35) * smoothstep(0.55, 1.0, h) * 0.25;
    col += ivory * spec1 * 1.1;
    col += champ * spec1 * 0.25 * smoothstep(0.4, 1.0, h);
    col += mix(champ, ivory, 0.4) * spec2 * 0.6;
    col += champ * press * 0.05;

    // Brighter, pearl-like while seen through the letters; settles darker for the final section.
    col = mix(col * 2.1 + vec3(0.05, 0.045, 0.04), col, u_hover);
    // Vignette + fine film grain.
    col *= 1.0 - 0.6 * dot(uv - 0.5, uv - 0.5) * 1.6;
    col += (h21(gl_FragCoord.xy + fract(t) * 97.0) - 0.5) * 0.025;
    gl_FragColor = vec4(col, 1.0);
  }`;

const UNIFORMS = ["u_res", "u_time", "u_mouse", "u_vel", "u_hover"];

/**
 * Full-screen WebGL "silk" background.
 * Returns null when WebGL is unavailable or the shader fails, so callers can fall back to CSS.
 * Survives GPU context loss (common on mobile) by rebuilding its resources on restore.
 */
export function createSilkRenderer(canvas) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return null;

  let program = null;
  let buffer = null;
  let uniforms = {};
  let lost = false;

  const compile = (type, src) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Silk shader failed to compile: ${log}`);
    }
    return shader;
  };

  const init = () => {
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    // Shaders can be flagged for deletion once linked; the program keeps them alive.
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Silk shader failed to link: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);

    // One oversized triangle covers the viewport with fewer vertices than a quad.
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uniforms = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const onLost = (e) => {
    e.preventDefault(); // tells the browser we want a "restored" event
    lost = true;
  };
  const onRestored = () => {
    try {
      init();
      lost = false;
    } catch (err) {
      console.warn(err);
    }
  };

  try {
    init();
  } catch (err) {
    console.warn(err);
    return null;
  }
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return {
    resize(width, height) {
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      if (!lost) gl.viewport(0, 0, canvas.width, canvas.height);
    },

    draw({ time, mouseX, mouseY, velocity, hover }) {
      if (lost) return;
      gl.uniform2f(uniforms.u_res, canvas.width, canvas.height);
      gl.uniform1f(uniforms.u_time, time);
      gl.uniform2f(uniforms.u_mouse, mouseX, mouseY);
      gl.uniform1f(uniforms.u_vel, velocity);
      gl.uniform1f(uniforms.u_hover, hover);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    // Free GPU resources but keep the context usable: React strict mode remounts
    // effects in development and gets the same context back from getContext().
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (lost) return;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
