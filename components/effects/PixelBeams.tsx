"use client";

import { useEffect, useRef } from "react";
import type { TvShaderParams } from "@/lib/store";
import { DEFAULT_TV_SHADER } from "@/lib/store";

// ── Shaders ────────────────────────────────────────────────────────────────────
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// Halftone dot-grid: dot color squares on bg color, dot size driven by slow FBM.
// All visual params are uniforms so the Settings panel can drive them live.
const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2  u_res;
uniform float u_dpr;
uniform vec3  u_bg;
uniform vec3  u_dot;
uniform float u_cell;
uniform float u_minDot;
uniform float u_maxDot;
uniform float u_density;
uniform float u_contrast;
uniform float u_secMix;
uniform float u_speed;

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

  float CELL = u_cell * u_dpr;

  vec2 cellIdx = floor(fc / CELL);
  vec2 cellUV  = fract(fc / CELL);

  vec2 gridSize = floor(u_res / CELL);
  vec2 p = cellIdx / max(gridSize, vec2(1.0));

  float t  = u_time * u_speed;
  float t2 = u_time * u_speed * 0.6;
  float n  = fbm(p * u_density + vec2(t, t * 0.65));
  n       += u_secMix * fbm(p * u_density * 2.0 + vec2(-t2 * 1.2, t2 * 0.9));
  n = clamp(n * u_contrast - 0.05, 0.0, 1.0);

  float halfSize = mix(u_minDot, u_maxDot, n);

  vec2 fromCenter = abs(cellUV - 0.5);
  float inDot = step(fromCenter.x, halfSize) * step(fromCenter.y, halfSize);

  gl_FragColor = vec4(mix(u_bg, u_dot, inDot), 1.0);
}
`;

// ── Helpers ────────────────────────────────────────────────────────────────────
function hexToVec3(hex: string): [number, number, number] {
  const c = hex.replace(/^#/, "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

// ── Component ──────────────────────────────────────────────────────────────────
interface Props {
  className?: string;
  params?: TvShaderParams;
}

export function PixelBeams({ className, params = DEFAULT_TV_SHADER }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params; // always current without re-mounting

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

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime    = gl.getUniformLocation(prog, "u_time");
    const uRes     = gl.getUniformLocation(prog, "u_res");
    const uDpr     = gl.getUniformLocation(prog, "u_dpr");
    const uBg      = gl.getUniformLocation(prog, "u_bg");
    const uDot     = gl.getUniformLocation(prog, "u_dot");
    const uCell    = gl.getUniformLocation(prog, "u_cell");
    const uMinDot  = gl.getUniformLocation(prog, "u_minDot");
    const uMaxDot  = gl.getUniformLocation(prog, "u_maxDot");
    const uDensity = gl.getUniformLocation(prog, "u_density");
    const uContrast= gl.getUniformLocation(prog, "u_contrast");
    const uSecMix  = gl.getUniformLocation(prog, "u_secMix");
    const uSpeed   = gl.getUniformLocation(prog, "u_speed");

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
      const p = paramsRef.current;
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      const [br, bg, bb] = hexToVec3(p.bgColor);
      const [dr, dg, db] = hexToVec3(p.dotColor);
      gl.uniform3f(uBg,  br, bg, bb);
      gl.uniform3f(uDot, dr, dg, db);
      gl.uniform1f(uCell,     p.cellSize);
      gl.uniform1f(uMinDot,   p.minDot);
      gl.uniform1f(uMaxDot,   p.maxDot);
      gl.uniform1f(uDensity,  p.density);
      gl.uniform1f(uContrast, p.contrast);
      gl.uniform1f(uSecMix,   p.secMix);
      gl.uniform1f(uSpeed,    p.speed);
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
