"use client";

import { useEffect, type ReactNode } from "react";

/** Latest scroll reading, shared by every subscriber (no React re-render on scroll). */
const state = { progress: 0, y: 0 };

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
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      state.y = y;
      state.progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      for (const listener of listeners) listener({ progress: state.progress, y });
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <>{children}</>;
}
