"use client";

import { useEffect, useRef } from "react";
import { isLiteMode } from "@/lib/lite";

type P = { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number };

/** Estela de partículas luminosa detrás del cursor. Sólo desktop. */
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isLiteMode()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const fit = () => {
      canvas.width = window.innerWidth * DPR;
      canvas.height = window.innerHeight * DPR;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    const pool: P[] = [];
    let mx = -100;
    let my = -100;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // 2 partículas por evento, con dispersión chica.
      for (let i = 0; i < 2; i++) {
        pool.push({
          x: mx,
          y: my,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          life: 1,
          size: 1 + Math.random() * 2,
          hue: Math.random() < 0.75 ? 0 : 1, // azul estelar / dorado
        });
      }
      if (pool.length > 120) pool.splice(0, pool.length - 120);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = pool.length - 1; i >= 0; i--) {
        const p = pool[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.025;
        if (p.life <= 0) {
          pool.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.hue === 0 ? `rgba(122, 162, 255, ${p.life * 0.8})` : `rgba(233, 194, 112, ${p.life * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      // Halo suave sobre la posición actual.
      if (mx >= 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 26);
        g.addColorStop(0, "rgba(122,162,255,0.18)");
        g.addColorStop(1, "rgba(122,162,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, my, 26, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 80, pointerEvents: "none" }}
    />
  );
}
