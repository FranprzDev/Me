"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Carta estelar: el viaje es un único cosmos. La página tiene SECTION_COUNT
 * secciones full-height; cada una ocupa una "zona" del progreso de scroll
 * [0..1] y enciende su constelación al pasar por su centro.
 *
 * Orden de secciones (debe coincidir con page.tsx y con CONSTELLATIONS):
 *   0 Hero · 1 Experiencia · 2 Educación · 3 Proyectos · 4 Contacto
 * (El MCP vive en su propia ruta /utn-frt-mcp, fuera de este viaje.)
 */
export const SECTION_COUNT = 5;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Centro de la zona de scroll de una sección. */
export function sectionCenter(index: number): number {
  return (index + 0.5) / SECTION_COUNT;
}

/**
 * Peso [0..1] de una constelación: 1 en el centro de su sección, cae a 0 a
 * ±halfWidth. Con halfWidth ~ 1/SECTION_COUNT las constelaciones contiguas se
 * funden suavemente (cross-fade), por eso el viaje se siente continuo.
 */
export function bumpWeight(p: number, center: number, halfWidth = 0.16): number {
  const d = Math.abs(p - center) / halfWidth;
  const t = Math.max(0, 1 - d);
  return t * t * (3 - 2 * t);
}

/** Singleton leído por el render loop 3D (evita re-renders en cada scroll). */
const state = { progress: 0 };

export function getScrollProgress(): number {
  return state.progress;
}

const ProgressCtx = createContext<number>(0);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      state.progress = p;
      setProgress(p);
      raf.current = null;
    };
    const onScroll = () => {
      if (raf.current == null) raf.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <ProgressCtx.Provider value={progress}>{children}</ProgressCtx.Provider>;
}

/** Hook reactivo (para UI que necesita re-render con el progreso). */
export function useScrollProgress(): number {
  return useContext(ProgressCtx);
}
