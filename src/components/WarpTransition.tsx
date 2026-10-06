"use client";

import { useEffect, useRef } from "react";
import { isLiteMode } from "@/lib/lite";

export function WarpTransition() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lock = useRef(false);
  const raf = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  const runWarp = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      lock.current = false;
      return;
    }

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2;
    const N = 130;
    const stars = Array.from({ length: N }, () => {
      const a = Math.random() * Math.PI * 2;
      return { a, r: Math.random() * 40, speed: 3 + Math.random() * 6 };
    });

    const DURATION = 480;
    const t0 = performance.now();

    canvas.style.transition = "none";
    canvas.style.opacity = "1";

    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      ctx.fillStyle = `rgba(4, 6, 18, ${0.25 + t * 0.75})`;
      ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        const v = s.speed * (1 + t * 8);
        const prevR = s.r;
        s.r += v;
        ctx.strokeStyle = `rgba(200, 218, 255, ${0.25 + t * 0.75})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.a) * prevR, cy + Math.sin(s.a) * prevR);
        ctx.lineTo(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r);
        ctx.stroke();
        if (s.r > Math.max(W, H)) {
          s.r = Math.random() * 30;
          s.a = Math.random() * Math.PI * 2;
        }
      }
      if (t < 1) {
        raf.current = requestAnimationFrame(frame);
      } else {
        // Fundimos el overlay revelando la nueva escena ya montada.
        canvas.style.transition = "opacity 320ms ease";
        canvas.style.opacity = "0";
        timer.current = window.setTimeout(() => {
          lock.current = false;
          const c = canvasRef.current?.getContext("2d");
          if (c && canvasRef.current) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }, 360);
      }
    };
    raf.current = requestAnimationFrame(frame);
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (isLiteMode()) return;
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      const target = new URL(a.href);
      if (target.origin !== window.location.origin || target.pathname === window.location.pathname) return;
      // El efecto decora el enlace; nunca intercepta ni bloquea la navegación.
      if (lock.current) return;
      lock.current = true;
      runWarp();
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      cancelAnimationFrame(raf.current);
      window.clearTimeout(timer.current);
      lock.current = false;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 85,
        pointerEvents: "none",
        opacity: 0,
      }}
    />
  );
}
