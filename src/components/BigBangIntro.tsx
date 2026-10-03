"use client";

import { useEffect, useRef, useState } from "react";
import { isLiteMode } from "@/lib/lite";

/**
 * Intro "Big Bang": flashazo blanco-azulado en el centro, onda de choque y
 * estrellas saliendo disparadas hacia afuera. Corre una vez por sesión y nunca
 * con reduce —el texto es lo primero que tiene que verse.
 */
export function BigBangIntro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(() => {
    if (typeof window === "undefined") return true;
    if (isLiteMode()) return true;
    try {
      return Boolean(sessionStorage.getItem("bb-seen"));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (done) return;
    try {
      sessionStorage.setItem("bb-seen", "1");
    } catch {
      /* sin storage: mostramos igual */
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      const id = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(id);
    }

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const fit = () => {
      canvas.width = W() * DPR;
      canvas.height = H() * DPR;
      canvas.style.width = `${W()}px`;
      canvas.style.height = `${H()}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    const N = W() < 900 ? 60 : 140;
    const stars = Array.from({ length: N }, () => {
      const a = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      return { a, speed, r: 0, life: 0.5 + Math.random() * 0.5, size: 0.6 + Math.random() * 1.6 };
    });

    const DURATION = 1500;
    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = (now - t0) / DURATION;
      const cx = W() / 2;
      const cy = H() / 2;

      ctx.fillStyle = `rgba(4, 6, 18, ${Math.min(1, t * 6) * (1 - Math.max(0, t - 0.55) / 0.45)})`;
      ctx.fillRect(0, 0, W(), H());

      // Núcleo brillante que colapsa y explota.
      const coreR = t < 0.15 ? 8 + t * 160 : 120 * (1 - (t - 0.15) / 0.6);
      if (coreR > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(coreR, 1));
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.4, "rgba(155,179,255,0.55)");
        g.addColorStop(1, "rgba(91,140,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(coreR, 1), 0, Math.PI * 2);
        ctx.fill();
      }

      // Onda de choque.
      if (t > 0.12) {
        const ringT = (t - 0.12) / 0.7;
        if (ringT < 1) {
          ctx.strokeStyle = `rgba(233, 194, 112, ${(1 - ringT) * 0.7})`;
          ctx.lineWidth = 2.5 * (1 - ringT);
          ctx.beginPath();
          ctx.arc(cx, cy, ringT * Math.max(W(), H()) * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Estrellas radiales.
      for (const s of stars) {
        s.r += s.speed * (1 - t * 0.4);
        const alpha = Math.max(0, (1 - t / (s.life + 0.3)) * 0.9);
        if (alpha <= 0) continue;
        ctx.fillStyle = `rgba(220, 230, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r, s.size * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setDone(true);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [done]);

  if (done) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 90, pointerEvents: "none" }}
    />
  );
}
