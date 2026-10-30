"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Carta estelar: el viaje es un único cosmos. La página tiene SECTION_COUNT
 * secciones full-height; cada una ocupa una "zona" del progreso de scroll
 * [0..1] y enciende su constelación al pasar por su centro.
 *
 * Orden de secciones (debe coincidir con page.tsx y con CONSTELLATIONS):
 *   0 Hero · 1 Experiencia · 2 Sobre Mi · 3 Contacto
 * El viaje principal vive en la home; las demás rutas quedan fuera de este cálculo.
 */
export const SECTION_COUNT = 4;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Centro de la zona de scroll de una sección. */
export function sectionCenter(index: number): number {
  return (index + 0.5) / SECTION_COUNT;
}

/**
 * Centros de sección medidos desde el DOM real (las secciones NO ocupan lo
 * mismo: Proyectos es más alta por el slider). Se cachea por altura de
 * documento; cae al modelo de zonas iguales si aún no hay DOM (SSR).
 */
const SECTION_IDS = ["top", "experience", "projects", "contact"];
let centersCacheKey = -1;
let centersCache: number[] = [];

export function measuredSectionCenter(index: number): number {
  if (typeof document === "undefined") return sectionCenter(index);
  const doc = document.documentElement;
  const key = doc.scrollHeight;
  if (key !== centersCacheKey) {
    const max = key - window.innerHeight;
    centersCache = SECTION_IDS.map((id) => {
      const el = document.getElementById(id);
      if (!el || max <= 0) return (SECTION_IDS.indexOf(id) + 0.5) / SECTION_COUNT;
      const centerPx = el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2;
      return Math.min(1, Math.max(0, centerPx / max));
    });
    centersCacheKey = key;
  }
  return centersCache[index] ?? sectionCenter(index);
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

/** Singleton read by the 3D render loop (no React re-render on scroll). */
const state = { progress: 0, y: 0 };

export function getScrollProgress(): number {
  return state.progress;
}

export interface ScrollSnapshot {
  /** Page scroll progress, 0..1. */
  progress: number;
  /** window.scrollY in px. */
  y: number;
}

type ScrollListener = (snapshot: ScrollSnapshot) => void;
const listeners = new Set<ScrollListener>();

/**
 * Subscribe to the site's single scroll listener. Callbacks run inside one
 * requestAnimationFrame per frame, after the only layout read, so subscribers
 * should only write (transform, attributes) and never measure.
 */
export function subscribeScroll(listener: ScrollListener): () => void {
  listeners.add(listener);
  listener({ progress: state.progress, y: state.y });
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Owns the one passive scroll/resize listener of the site. It never stores
 * scroll state in React: re-rendering on every scroll frame is what made the
 * page feel heavy on phones.
 */
export function ScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let raf = 0;
    // Document height is read once per invalidation, never per scroll frame:
    // a forced layout flush inside the shared scroll rAF was charging every
    // subscriber's frame. ResizeObserver covers the real mutators of document
    // height (content-visibility sections materializing, lazy media, i18n
    // text swaps, expanded cards); resize/orientation cover viewport changes.
    let docHeight = -1;
    let dirty = true;
    const measure = () => {
      docHeight = document.documentElement.scrollHeight;
      dirty = false;
    };
    const invalidate = () => {
      dirty = true;
    };
    const update = () => {
      raf = 0;
      if (dirty) measure();
      const max = docHeight - window.innerHeight;
      const y = window.scrollY;
      state.y = y;
      state.progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      for (const listener of listeners) listener({ progress: state.progress, y });
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    const onResize = () => {
      invalidate();
      onScroll();
    };
    update();
    const observer = new ResizeObserver(invalidate);
    observer.observe(document.body);
    observer.observe(document.documentElement);
    document.fonts?.ready.then(invalidate).catch(() => {});
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <>{children}</>;
}
