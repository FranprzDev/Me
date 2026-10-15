"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

/** Space kept between a streak and the copy it must steer around, in px. */
const CLEAR_MARGIN_PX = 28;
/** Random trajectories tried before a shooter waits for the next slot. */
const MAX_TRIES = 8;
/** Points sampled along a trajectory when testing it against the copy. */
const PATH_SAMPLES = 12;

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

export function StarAura() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
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
      const launch = (el: HTMLSpanElement) => {
        // Relaunches are scheduled from tween callbacks, outside the context:
        // stop the loop once the layer is torn down.
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
          gsap.set(el, {
            x: startX,
            y: startY,
            rotation: (angle * 180) / Math.PI,
            scaleX,
            opacity: 0,
          });
          gsap.to(el, {
            x: `+=${Math.cos(angle) * dist}`,
            y: `+=${Math.sin(angle) * dist}`,
            keyframes: [
              { opacity: 0 },
              { opacity: 0.9, duration: dur * 0.2 },
              { opacity: 0.9, duration: dur * 0.4 },
              { opacity: 0, duration: dur * 0.4 },
            ],
            duration: dur,
            ease: "power1.in",
            onComplete: () => launch(el),
          });
          return;
        }
        gsap.delayedCall(0.8 + Math.random() * 0.8, () => launch(el));
      };

      shooters.forEach((el, i) =>
        gsap.delayedCall(i * 0.9 + Math.random() * 0.8, () => launch(el))
      );

      return () => {
        alive = false;
        shooters.forEach((el) => {
          gsap.killTweensOf(el);
          el.remove();
        });
      };
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="star-aura-layer" aria-hidden="true" />
  );
}
