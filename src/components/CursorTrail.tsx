"use client";

import { useEffect, useRef } from "react";
import { isLiteMode } from "../lib/lite";

type P = { x: number; y: number; life: number; size: number };

/** After this long without pointer movement, the trail rests (loop parks). */
const IDLE_PARK_MS = 1200;

/** Halo de luz que sigue el cursor y deja una estela de partículas suaves. */
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isLiteMode()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let mx = -100;
    let my = -100;
    let lastMove = 0;
    const pool: P[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (mx >= 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 70);
        g.addColorStop(0, "rgba(150, 190, 255, 0.10)");
        g.addColorStop(1, "rgba(150, 190, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(mx - 70, my - 70, 140, 140);
      }
      for (let i = pool.length - 1; i >= 0; i--) {
        const p = pool[i];
        p.life -= 0.025;
        if (p.life <= 0) {
          pool.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170, 205, 255, ${0.22 * p.life})`;
        ctx.fill();
      }
      // Park the loop once the trail has drained and the pointer rests; the
      // next mousemove (or tab refocus with fresh movement) wakes it again.
      if (pool.length > 0 || performance.now() - lastMove < IDLE_PARK_MS) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const wake = () => {
      if (raf === 0 && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      lastMove = performance.now();
      pool.push({ x: mx, y: my, life: 1, size: 2.2 + Math.random() * 2 });
      pool.push({ x: mx, y: my, life: 1, size: 1.4 + Math.random() * 1.4 });
      if (pool.length > 60) pool.splice(0, pool.length - 60);
      wake();
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (raf !== 0) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else {
        wake();
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        pointerEvents: "none",
      }}
    />
  );
}
