"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

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

      const launch = (el: HTMLSpanElement) => {
        const startX = Math.random() * W() * 1.2 - W() * 0.1;
        const startY = Math.random() * H() * 0.35;
        const angle = Math.PI * (0.18 + Math.random() * 0.12);
        const dist = Math.min(W(), H()) * (0.5 + Math.random() * 0.6);
        const dur = 0.9 + Math.random() * 0.8;

        gsap.set(el, {
          x: startX,
          y: startY,
          rotation: (angle * 180) / Math.PI,
          scaleX: 0.5 + Math.random() * 1.2,
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
      };

      shooters.forEach((el, i) =>
        gsap.delayedCall(i * 0.9 + Math.random() * 0.8, () => launch(el))
      );

      return () => {
        shooters.forEach((el) => el.remove());
      };
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="star-aura-layer" aria-hidden="true" />
  );
}
