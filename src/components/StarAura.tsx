"use client";

import { useLayoutEffect, useRef } from "react";

/** Space kept between a streak and the copy it must steer around, in px. */
const CLEAR_MARGIN_PX = 28;
/** Random trajectories tried before a shooter waits for the next slot. */
const MAX_TRIES = 8;
/** Points sampled along a trajectory when testing it against the copy. */
const PATH_SAMPLES = 12;
const KEYFRAME_OFFSETS = [0, 0.1, 0.2, 0.35, 0.5, 0.6, 0.75, 0.9, 1];

type Box = { left: number; top: number; right: number; bottom: number };

/** On-screen boxes of the content marked `data-sky-clear` (the hero copy). */
function clearZones(): Box[] {
  const zones: Box[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("[data-sky-clear]")) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    zones.push({
      left: r.left - CLEAR_MARGIN_PX,
      top: r.top - CLEAR_MARGIN_PX,
      right: r.right + CLEAR_MARGIN_PX,
      bottom: r.bottom + CLEAR_MARGIN_PX,
    });
  }
  return zones;
}

/** True when the segment (x0,y0)->(x1,y1) passes through any zone. */
function crossesZones(x0: number, y0: number, x1: number, y1: number, zones: Box[]): boolean {
  for (let i = 0; i <= PATH_SAMPLES; i++) {
    const t = i / PATH_SAMPLES;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    for (const z of zones) {
      if (x >= z.left && x <= z.right && y >= z.top && y <= z.bottom) return true;
    }
  }
  return false;
}

/**
 * Effective envelope of the GSAP tween this replaces: GSAP's keyframes plus
 * top-level duration keep the streak dark for the first stretch of the tween,
 * then fade in, hold and fade out linearly. Segments measured from the
 * original build across the 0.9-1.7s duration range.
 */
function envelopeCuts(durMs: number): [number, number, number] {
  const dark = 261 + 0.3375 * durMs;
  const fadeIn = Math.max(40, 0.18 * durMs - 82);
  const hold = 0.281 * durMs - 126;
  return [dark / durMs, (dark + fadeIn) / durMs, (dark + fadeIn + hold) / durMs];
}

function envelope(o: number, durMs: number): number {
  const [f0, f1, f2] = envelopeCuts(durMs);
  if (o <= f0) return 0;
  if (o <= f1) return 0.9 * ((o - f0) / (f1 - f0));
  if (o <= f2) return 0.9;
  return 0.9 * (1 - (o - f2) / (1 - f2));
}

export function StarAura() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // Shooting stars — infinite randomized loop
    const POOL = 7;
    const shooters: HTMLSpanElement[] = [];
    for (let i = 0; i < POOL; i++) {
      const s = document.createElement("span");
      s.className = "star-aura-shooter";
      root.appendChild(s);
      shooters.push(s);
    }

    let alive = true;
    const animations = new Set<Animation>();
    const timeouts = new Set<number>();

    function schedule(el: HTMLSpanElement, delayMs: number) {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        launch(el);
      }, delayMs);
      timeouts.add(id);
    }

    function launch(el: HTMLSpanElement) {
      if (!alive) return;
      // Streaks travel around the copy, never across it: pick a random
      // path that misses every clear zone, or wait and try again later.
      const zones = clearZones();
      for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        const startX = Math.random() * W() * 1.2 - W() * 0.1;
        const startY = Math.random() * H() * 0.35;
        const angle = Math.PI * (0.18 + Math.random() * 0.12);
        const dist = Math.min(W(), H()) * (0.5 + Math.random() * 0.6);
        const scaleX = 0.5 + Math.random() * 1.2;
        // The streak trails ahead of its anchor by its own drawn length.
        const reach = dist + el.offsetWidth * scaleX;
        const endX = startX + Math.cos(angle) * reach;
        const endY = startY + Math.sin(angle) * reach;
        if (crossesZones(startX, startY, endX, endY, zones)) continue;

        const dur = 0.9 + Math.random() * 0.8;
        const rot = (angle * 180) / Math.PI;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;

        el.style.transform = `translate(${startX}px, ${startY}px) rotate(${rot}deg) scaleX(${scaleX})`;
        el.style.opacity = "0";

        const durMs = dur * 1000;
        const offsets = [...new Set([...KEYFRAME_OFFSETS, ...envelopeCuts(durMs)])].sort((a, b) => a - b);
        const keyframes: Keyframe[] = offsets.map((o) => ({
          offset: o,
          transform: `translate(${startX + dx * o * o}px, ${startY + dy * o * o}px) rotate(${rot}deg) scaleX(${scaleX})`,
          opacity: envelope(o, durMs),
          easing: "linear",
        }));

        const animation = el.animate(keyframes, { duration: dur * 1000, fill: "none" });
        animations.add(animation);
        animation.addEventListener("finish", () => {
          animations.delete(animation);
          launch(el);
        });
        return;
      }
      schedule(el, (0.8 + Math.random() * 0.8) * 1000);
    }

    shooters.forEach((el, i) => schedule(el, (i * 0.9 + Math.random() * 0.8) * 1000));

    return () => {
      alive = false;
      for (const id of timeouts) window.clearTimeout(id);
      timeouts.clear();
      for (const animation of animations) animation.cancel();
      animations.clear();
      shooters.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div ref={rootRef} className="star-aura-layer" aria-hidden="true" />
  );
}
