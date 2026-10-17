"use client";

import { useEffect, useRef } from "react";

type RGB = [number, number, number];
type Pt = [number, number, number, number]; // screen x, screen y, depth, scale

interface Particle { x: number; y: number; z: number; p: number; c: number }
interface Cube { x: number; y: number; z: number; s: number; rx: number; ry: number; vx: number; vy: number; c: number }

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

/** A slowly moving 3D scene (rolling grid terrain, spinning cubes, floating dots) drawn on a canvas behind the page. */
export function Wallpaper() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const cx = cv?.getContext("2d");
    if (!cv || !cx) return;
    const root = document.documentElement;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, f = 600, t = 0, last = 0, mx = 0, my = 0, tx = 0, ty = 0, small = false, raf = 0, dark = false;
    let cols: RGB[] = [[79, 70, 229], [56, 189, 248], [192, 132, 252], [34, 211, 238]];
    let P: Particle[] = [];
    let B: Cube[] = [];
    let cyaw = 1, syaw = 0, cpit = 1, spit = 0;

    const readCols = () => {
      dark = root.classList.contains("dark");
      const a = getComputedStyle(root).getPropertyValue("--accent").trim().split(/\s+/).map(Number);
      const accent: RGB = a.length === 3 && a.every((n) => !Number.isNaN(n)) ? [a[0], a[1], a[2]] : [79, 70, 229];
      cols = [accent, [56, 189, 248], [192, 132, 252], [34, 211, 238]];
    };

    const size = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      small = W < 640;
      f = Math.min(W * 1.1, H * 1.3);
      P = Array.from({ length: small ? 36 : 70 }, (_, i) => ({ x: rnd(-1100, 1100), y: rnd(-60, 520), z: rnd(120, 1500), p: rnd(0, 6.28), c: i % 4 }));
      B = Array.from({ length: small ? 4 : 7 }, (_, i) => ({
        x: rnd(-800, 800), y: rnd(90, 420), z: rnd(380, 1250), s: rnd(26, 52), rx: rnd(0, 6), ry: rnd(0, 6),
        vx: rnd(0.2, 0.6) * (i % 2 ? 1 : -1), vy: rnd(0.25, 0.7), c: i % 4
      }));
    };

    const pr = (x: number, y: number, z: number): Pt | null => {
      const x1 = x * cyaw - z * syaw;
      const z1 = x * syaw + z * cyaw;
      const y2 = y * cpit - z1 * spit;
      const z2 = y * spit + z1 * cpit;
      if (z2 < 30) return null;
      const k = f / z2;
      return [W / 2 + x1 * k, H * 0.46 - y2 * k, z2, k];
    };

    const frame = (dt: number) => {
      t += dt;
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      const yaw = mx * 0.24 + Math.sin(t * 0.25) * 0.05;
      const pit = -0.2 + my * 0.06;
      cyaw = Math.cos(yaw); syaw = Math.sin(yaw); cpit = Math.cos(pit); spit = Math.sin(pit);
      cx.clearRect(0, 0, W, H);

      const hz = pr(0, 0, 1600);
      const hy = hz ? hz[1] : H * 0.4;
      const g = cx.createRadialGradient(W / 2 + mx * 60, hy, 0, W / 2 + mx * 60, hy, Math.max(W, H) * 0.7);
      g.addColorStop(0, rgba(cols[0], dark ? 0.26 : 0.18));
      g.addColorStop(1, rgba(cols[0], 0));
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);

      const R = small ? 16 : 24, N = small ? 24 : 34, dz = small ? 95 : 68, span = 1500;
      const off = t * 110, frac = off % dz, base = -130;
      const G: (Pt | null)[][] = [];
      cx.lineWidth = 1.2;
      for (let j = 0; j < R; j++) {
        const row: (Pt | null)[] = [];
        const z = 70 + j * dz - frac, za = z + off;
        for (let i = 0; i < N; i++) {
          const x = (i / (N - 1) - 0.5) * 2000;
          const h = 36 * Math.sin(x * 0.0075 + za * 0.0042 + t * 0.6) + 22 * Math.sin(x * 0.012 - za * 0.0065 + t * 0.4) + 14 * Math.sin(x * 0.02 + za * 0.01);
          row.push(pr(x, base + h, z));
        }
        G.push(row);
      }
      const A = dark ? 0.6 : 0.42;
      for (let j = 0; j < R; j++) {
        const rw = G[j];
        const mid = rw[Math.floor(N / 2)];
        if (!mid) continue;
        const fd = Math.pow(Math.max(0, 1 - mid[2] / span), 1.3);
        cx.strokeStyle = rgba(cols[j % 2 ? 1 : 0], A * fd);
        cx.beginPath();
        let started = false;
        for (let i = 0; i < N; i++) {
          const p = rw[i];
          if (!p) { started = false; continue; }
          if (!started) { cx.moveTo(p[0], p[1]); started = true; } else cx.lineTo(p[0], p[1]);
        }
        cx.stroke();
      }
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < R - 1; j++) {
          const a = G[j][i], b = G[j + 1][i];
          if (!a || !b) continue;
          const fd2 = Math.pow(Math.max(0, 1 - (a[2] + b[2]) / 2 / span), 1.3);
          cx.strokeStyle = rgba(cols[i % 3 === 0 ? 2 : 0], A * 0.8 * fd2);
          cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.stroke();
        }
      }

      for (const q of P) {
        if (!still) {
          q.z -= 45 * dt;
          if (q.z < 60) { q.z = 1500; q.x = rnd(-1100, 1100); q.y = rnd(-60, 520); }
        }
        const pp = pr(q.x + Math.sin(t * 0.5 + q.p) * 20, q.y + Math.sin(t * 0.7 + q.p) * 14, q.z);
        if (!pp) continue;
        const al = (dark ? 0.8 : 0.5) * Math.min(1, pp[2] < 200 ? (pp[2] - 60) / 140 : 1) * Math.max(0, 1 - pp[2] / 1700) * (0.55 + 0.45 * Math.sin(t * 2 + q.p));
        const r = Math.max(0.7, 3.6 * pp[3]);
        cx.fillStyle = rgba(cols[q.c], al * 0.28); cx.beginPath(); cx.arc(pp[0], pp[1], r * 3, 0, 6.283); cx.fill();
        cx.fillStyle = rgba(cols[q.c], al); cx.beginPath(); cx.arc(pp[0], pp[1], r, 0, 6.283); cx.fill();
      }

      cx.lineWidth = 1.4;
      B.forEach((o, bi) => {
        if (!still) { o.rx += o.vx * dt; o.ry += o.vy * dt; }
        const cX = Math.cos(o.rx), sX = Math.sin(o.rx), cY = Math.cos(o.ry), sY = Math.sin(o.ry);
        const oy = o.y + Math.sin(t * 0.6 + bi) * 26;
        const PV: Pt[] = [];
        for (const v of V) {
          const vx = v[0] * o.s, vy = v[1] * o.s, vz = v[2] * o.s;
          const y1 = vy * cX - vz * sX, z1 = vy * sX + vz * cX;
          const x2 = vx * cY + z1 * sY, z2 = -vx * sY + z1 * cY;
          const q2 = pr(o.x + x2, oy + y1, o.z + z2);
          if (!q2) return;
          PV.push(q2);
        }
        const fd3 = Math.max(0, 1 - o.z / 1500);
        cx.strokeStyle = rgba(cols[o.c], (dark ? 0.85 : 0.6) * (0.35 + 0.65 * fd3));
        cx.beginPath();
        for (const e of E) { cx.moveTo(PV[e[0]][0], PV[e[0]][1]); cx.lineTo(PV[e[1]][0], PV[e[1]][1]); }
        cx.stroke();
      });
    };

    const loop = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.06);
      last = ts;
      frame(dt);
      raf = requestAnimationFrame(loop);
    };

    readCols();
    size();
    if (still) { t = 2; frame(0); } else raf = requestAnimationFrame((ts) => { last = ts; raf = requestAnimationFrame(loop); });

    const onResize = () => { size(); if (still) frame(0); };
    const onMove = (e: PointerEvent) => { tx = (e.clientX / W - 0.5) * 2; ty = (e.clientY / H - 0.5) * 2; };
    const mo = new MutationObserver(() => { readCols(); if (still) frame(0); });
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 block h-full w-full" />;
}
