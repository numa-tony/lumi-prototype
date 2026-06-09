"use client";

import { useEffect, useRef } from "react";

// ── Shaders ────────────────────────────────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Halftone dot-grid: blue-purple squares on pink, dot size driven by slow FBM blobs.
const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2  u_res;
uniform float u_dpr;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p = p * 2.0 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 fc = gl_FragCoord.xy;

  // CELL is ~12 CSS pixels regardless of device pixel ratio
  float CELL = 12.0 * u_dpr;

  vec2 cellIdx = floor(fc / CELL);
  vec2 cellUV  = fract(fc / CELL);          // 0-1 within the cell

  // Normalised grid position (0-1 across canvas)
  vec2 gridSize = floor(u_res / CELL);
  vec2 p = cellIdx / max(gridSize, vec2(1.0));

  // Two slow-drifting FBM layers — drive overall "blob" density
  float t  = u_time * 0.030;
  float t2 = u_time * 0.018;
  float n  = fbm(p * 3.2 + vec2(t,  t  * 0.65));
  n       += 0.45 * fbm(p * 6.5 + vec2(-t2 * 1.2, t2 * 0.9));
  n = clamp(n * 1.15 - 0.05, 0.0, 1.0);

  // Dot half-extent: 0.07 (almost invisible) → 0.44 (almost fills cell)
  float halfSize = mix(0.07, 0.44, n);

  // Square dot centred in cell
  vec2 fromCenter = abs(cellUV - 0.5);
  float inDot = step(fromCenter.x, halfSize) * step(fromCenter.y, halfSize);

  // Pink background  #ffc9d2  |  blue-purple dots  ~#6060EE
  vec3 pink = vec3(1.0,  0.788, 0.824);
  vec3 blue = vec3(0.38, 0.38,  0.93);

  gl_FragColor = vec4(mix(pink, blue, inDot), 1.0);
}
`;

// ── WebGL bootstrap ────────────────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function PixelBeams({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes  = gl.getUniformLocation(prog, "u_res");
    const uDpr  = gl.getUniformLocation(prog, "u_dpr");

    let raf = 0;
    const start = performance.now();
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width  = width  * dpr;
      canvas.height = height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const render = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block" }}
    />
  );
}
