"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Transición "warp" entre páginas: al hacer click en un link interno el
 * cosmos se acelera (estrellas alargadas desde el centro), y recién ahí se
 * navega. En móvil/reduce el warp se acorta o se saltea para no frenar.
 */
export function WarpTransition() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const lock = useRef(false);

  const runWarp = (href: string) => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      lock.current = false;
      return;
    }

    const mobile = window.innerWidth < 768;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      router.push(href);
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
    const N = mobile ? 60 : 130;
    const stars = Array.from({ length: N }, () => {
      const a = Math.random() * Math.PI * 2;
      return { a, r: Math.random() * 40, speed: 3 + Math.random() * 6 };
    });

    const DURATION = mobile ? 300 : 480;
    const t0 = performance.now();

    // Navegamos YA: el warp tapa el swap de escena en lugar de precederlo,
    // así el "delay" percibido es sólo el efecto, no efecto + carga.
    canvas.style.transition = "none";
    canvas.style.opacity = "1";
    router.push(href);

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
        requestAnimationFrame(frame);
      } else {
        // Fundimos el overlay revelando la nueva escena ya montada.
        canvas.style.transition = "opacity 320ms ease";
        canvas.style.opacity = "0";
        window.setTimeout(() => {
          lock.current = false;
          const c = canvasRef.current?.getContext("2d");
          if (c && canvasRef.current) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }, 360);
      }
    };
    requestAnimationFrame(frame);
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      const [path, hash] = href.split("#");
      // Navegación dentro de la misma página (anclas): warp cortito opcional.
      if (path === pathname && hash) return;
      if (path === pathname) return;
      e.preventDefault();
      if (lock.current) return;
      lock.current = true;
      runWarp(path + (hash ? `#${hash}` : ""));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 85,
        pointerEvents: "none",
        opacity: 1,
      }}
    />
  );
}
