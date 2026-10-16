"use client";

import { useEffect, useId, useRef } from "react";

/** Whole touchdown, from the first frame to the settled squash. */
export const LANDING_MS = 820;
/** Share of the landing at which the footpads touch the surface. */
const TOUCHDOWN = 0.84;

/**
 * Keyframe for the craft: one transform list everywhere so every step
 * interpolates, and an explicit opacity (a keyframe without one would ease
 * back to the stylesheet's opacity: 0).
 */
function pose(offset: number, y: number, rotate: number, sx: number, sy: number, extra: Keyframe = {}): Keyframe {
  return { offset, opacity: 1, transform: `translate(0px, ${y.toFixed(1)}px) rotate(${rotate}deg) scale(${sx}, ${sy})`, ...extra };
}

type WorldLandingProps = {
  /** Called once the craft has settled (or after a hard cap, so the jump never hangs). */
  onLanded: () => void;
};

/**
 * A puppy astronaut in a small lander touching down on top of the world the
 * visitor entered: a fast drop, a retro-thrust burn that slows it to a hover,
 * a soft touchdown with a dust puff and a squash, then `onLanded` hands over to
 * the zoom into the world. Decorative (aria-hidden, pointer-transparent); the
 * art is inline SVG tinted with the world's --tone / --tone-2, and the motion
 * is WAAPI on transform and opacity only. Lives inside the world's lift, so
 * the zoom that follows carries it along.
 */
export function WorldLanding({ onLanded }: WorldLandingProps) {
  const id = useId().replace(/:/g, "");
  const craftRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<SVGGElement>(null);
  const earsRef = useRef<(SVGPathElement | null)[]>([]);
  const shadowRef = useRef<HTMLSpanElement>(null);
  const dustRef = useRef<(HTMLSpanElement | null)[]>([]);
  const landedRef = useRef(onLanded);

  useEffect(() => {
    landedRef.current = onLanded;
  }, [onLanded]);

  useEffect(() => {
    const craft = craftRef.current;
    if (!craft) return;
    // The craft is sized from the world (CSS), so the drop scales with it.
    const size = craft.offsetWidth;
    const timing: KeyframeAnimationOptions = { duration: LANDING_MS, fill: "both", easing: "linear" };
    const animations: Animation[] = [];
    const flight = craft.animate(
      [
        pose(0, -size * 5.2, -14, 0.86, 0.86, { opacity: 0, easing: "cubic-bezier(0.3, 0.1, 0.6, 1)" }),
        pose(0.1, -size * 4.2, -11, 0.92, 0.92, { opacity: 1, easing: "cubic-bezier(0.2, 0.6, 0.35, 1)" }),
        // Retro-thrust burn: the fall turns into a slow, nearly level hover.
        pose(0.5, -size, 5, 1, 1, { easing: "cubic-bezier(0.3, 0.3, 0.5, 1)" }),
        pose(0.76, -size * 0.12, -1.5, 1, 1, { easing: "ease-in" }),
        pose(TOUCHDOWN, 0, 0, 1, 1, { easing: "ease-out" }),
        // Touchdown: the legs give a little, then spring back.
        pose(0.9, size * 0.02, 0, 1.12, 0.84, { easing: "ease-in-out" }),
        pose(0.96, 0, 0, 0.97, 1.04, { easing: "ease-out" }),
        pose(1, 0, 0, 1, 1),
      ],
      timing,
    );
    animations.push(flight);
    const flame = flameRef.current;
    if (flame) {
      animations.push(
        flame.animate(
          [
            { offset: 0, transform: "scale(0.8, 0.9)", opacity: 0.85 },
            { offset: 0.42, transform: "scale(0.9, 1)", opacity: 1 },
            { offset: 0.52, transform: "scale(1.15, 1.7)", opacity: 1 },
            { offset: 0.76, transform: "scale(1, 1.15)", opacity: 1 },
            { offset: TOUCHDOWN - 0.01, transform: "scale(0.6, 0.25)", opacity: 0.8 },
            { offset: TOUCHDOWN + 0.03, transform: "scale(0.3, 0)", opacity: 0 },
            { offset: 1, transform: "scale(0.3, 0)", opacity: 0 },
          ],
          timing,
        ),
      );
    }
    for (const [i, ear] of earsRef.current.entries()) {
      if (!ear) continue;
      const side = i === 0 ? -1 : 1;
      animations.push(
        ear.animate(
          [
            { offset: 0, transform: `rotate(${side * -10}deg)` },
            { offset: TOUCHDOWN, transform: `rotate(${side * -6}deg)` },
            { offset: 0.91, transform: `rotate(${side * 16}deg)` },
            { offset: 1, transform: "rotate(0deg)" },
          ],
          { ...timing, easing: "ease-out" },
        ),
      );
    }
    if (shadowRef.current) {
      animations.push(
        shadowRef.current.animate(
          [
            { offset: 0, transform: "scale(0.2)", opacity: 0 },
            { offset: 0.5, transform: "scale(0.55)", opacity: 0.25 },
            { offset: TOUCHDOWN, transform: "scale(1)", opacity: 0.6 },
            { offset: 1, transform: "scale(1)", opacity: 0.55 },
          ],
          timing,
        ),
      );
    }
    for (const [i, puff] of dustRef.current.entries()) {
      if (!puff) continue;
      const side = i === 0 ? -1 : 1;
      animations.push(
        puff.animate(
          [
            { offset: 0, transform: "translateX(0%) scale(0.3)", opacity: 0 },
            { offset: TOUCHDOWN - 0.04, transform: "translateX(0%) scale(0.3)", opacity: 0 },
            { offset: TOUCHDOWN + 0.04, transform: `translateX(${side * 30}%) scale(0.9)`, opacity: 0.85 },
            { offset: 1, transform: `translateX(${side * 95}%) scale(1.5)`, opacity: 0 },
          ],
          timing,
        ),
      );
    }

    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      landedRef.current();
    };
    // Hard cap: a throttled tab or a cancelled animation must never hold the jump.
    const cap = window.setTimeout(land, LANDING_MS + 120);
    const settle = async () => {
      try {
        await flight.finished;
      } catch {
        return; // Cancelled on unmount.
      }
      land();
    };
    void settle();
    return () => {
      done = true;
      window.clearTimeout(cap);
      for (const animation of animations) animation.cancel();
    };
  }, []);

  return (
    <span className="world-landing" aria-hidden="true" data-world-landing="">
      <span ref={shadowRef} className="world-landing__shadow" />
      <span
        ref={(el) => {
          dustRef.current[0] = el;
        }}
        className="world-landing__dust is-left"
      />
      <span
        ref={(el) => {
          dustRef.current[1] = el;
        }}
        className="world-landing__dust is-right"
      />
      <div ref={craftRef} className="world-landing__craft">
        <svg className="world-landing__art" viewBox="0 0 120 150" focusable="false">
          <defs>
            <linearGradient id={`${id}-pod`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f7f9fe" />
              <stop offset="0.55" stopColor="#dfe4ef" />
              <stop offset="1" stopColor="#aab3c8" />
            </linearGradient>
            <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff7d6" />
              <stop offset="0.3" stopColor="#ffc35a" />
              <stop offset="0.68" stopColor="#ff6b3d" />
              <stop offset="1" stopColor="#ff4d3d" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-core`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#fff0b0" />
              <stop offset="1" stopColor="#ffe08a" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`${id}-glass`} cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#d6e8ff" stopOpacity="0.32" />
              <stop offset="1" stopColor="#4a6aa8" stopOpacity="0.38" />
            </radialGradient>
          </defs>

          {/* Retro-thrust flame, under the nozzle. */}
          <g ref={flameRef} className="world-landing__flame">
            <g className="world-landing__flicker">
              <path d="M51 104 Q48 120 60 146 Q72 120 69 104 Z" fill={`url(#${id}-flame)`} />
              <path d="M55 104 Q54.5 116 60 131 Q65.5 116 65 104 Z" fill={`url(#${id}-core)`} />
            </g>
          </g>

          {/* Landing legs with struts and footpads. */}
          <g fill="none" stroke="#c4cde0" strokeLinecap="round">
            <path d="M42 90 L27 118" strokeWidth="3.4" />
            <path d="M78 90 L93 118" strokeWidth="3.4" />
            <path d="M46 97 L31 111" strokeWidth="1.8" />
            <path d="M74 97 L89 111" strokeWidth="1.8" />
          </g>
          <ellipse cx="26" cy="120.5" rx="7.5" ry="2.8" fill="#eef2fa" stroke="#8892a8" strokeWidth="1" />
          <ellipse cx="94" cy="120.5" rx="7.5" ry="2.8" fill="#eef2fa" stroke="#8892a8" strokeWidth="1" />

          {/* Nozzle and pod. */}
          <path d="M50 95 L70 95 L73.5 105 L46.5 105 Z" fill="#5c6377" stroke="#3c4152" strokeWidth="1" strokeLinejoin="round" />
          <path d="M48.5 103.6 L71.5 103.6" stroke="#9aa2b8" strokeWidth="1.2" />
          <path
            d="M29 74 Q29 67.5 35.5 67.5 L84.5 67.5 Q91 67.5 91 74 L87 93.5 Q86 99 80.5 99 L39.5 99 Q34 99 33 93.5 Z"
            fill={`url(#${id}-pod)`}
            stroke="#8e98af"
            strokeWidth="1.1"
          />
          <path className="world-landing__tone" d="M31.4 81 L88.6 81 L87.5 87 L32.5 87 Z" />
          <path d="M31.4 81 L88.6 81" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.8" />
          <circle className="world-landing__lamp" cx="44" cy="92.6" r="1.7" />
          <circle className="world-landing__lamp is-late" cx="60" cy="93.2" r="1.7" />
          <circle className="world-landing__lamp" cx="76" cy="92.6" r="1.7" />

          {/* Helmet interior, then the pup inside it. */}
          <circle cx="60" cy="44" r="28" fill={`url(#${id}-glass)`} />
          <path
            ref={(el) => {
              earsRef.current[0] = el;
            }}
            className="world-landing__ear is-left"
            d="M44 34 C34 34 30.5 47 34.5 57.5 C36.5 62.5 42.5 61 43.5 55 C44.5 48 46 41 44 34 Z"
            fill="#98603a"
          />
          <path
            ref={(el) => {
              earsRef.current[1] = el;
            }}
            className="world-landing__ear is-right"
            d="M76 34 C86 34 89.5 47 85.5 57.5 C83.5 62.5 77.5 61 76.5 55 C75.5 48 74 41 76 34 Z"
            fill="#98603a"
          />
          <path className="world-landing__tone" d="M47.5 59.5 Q60 66.5 72.5 59.5 L70.8 64.4 Q60 70 49.2 64.4 Z" />
          <ellipse cx="60" cy="46" rx="17.5" ry="16" fill="#e8b27a" />
          <path d="M60 30.4 C57 35.5 56.2 41 57.2 46 L62.8 46 C63.8 41 63 35.5 60 30.4 Z" fill="#fbe8d0" opacity="0.92" />
          <ellipse cx="67.6" cy="43.6" rx="5.6" ry="5" fill="#c88a52" />
          <ellipse cx="60" cy="53" rx="9.6" ry="7" fill="#fbe8d0" />
          <ellipse cx="48.6" cy="51" rx="2.6" ry="1.6" fill="#f39aa8" opacity="0.6" />
          <ellipse cx="71.4" cy="51" rx="2.6" ry="1.6" fill="#f39aa8" opacity="0.6" />
          <ellipse cx="52.5" cy="43.8" rx="2.5" ry="2.9" fill="#24160f" />
          <ellipse cx="67.5" cy="43.8" rx="2.5" ry="2.9" fill="#24160f" />
          <circle cx="53.4" cy="42.6" r="0.95" fill="#ffffff" />
          <circle cx="68.4" cy="42.6" r="0.95" fill="#ffffff" />
          <path d="M56.6 49.4 Q60 47.6 63.4 49.4 Q63 52.5 60 53.3 Q57 52.5 56.6 49.4 Z" fill="#2b1b14" />
          <ellipse cx="59" cy="49.5" rx="1.2" ry="0.55" fill="#ffffff" opacity="0.7" />
          <path d="M58.5 56.2 Q60 61 61.5 56.2 Z" fill="#ef7d93" />
          <path d="M60 53.3 L60 55.1 M56.3 54.9 Q58.2 57.4 60 55.1 Q61.8 57.4 63.7 54.9" fill="none" stroke="#2b1b14" strokeWidth="1" strokeLinecap="round" />

          {/* Collar ring, the paws resting on it, then the glass. */}
          <ellipse cx="60" cy="69.5" rx="26" ry="3.6" fill="#e6ebf5" stroke="#919db6" strokeWidth="1" />
          <ellipse cx="49" cy="66.4" rx="4.6" ry="3.3" fill="#e8b27a" stroke="#b47640" strokeWidth="0.8" />
          <ellipse cx="71" cy="66.4" rx="4.6" ry="3.3" fill="#e8b27a" stroke="#b47640" strokeWidth="0.8" />
          <path d="M47.6 65 L47.6 67.2 M50.4 65 L50.4 67.2 M69.6 65 L69.6 67.2 M72.4 65 L72.4 67.2" stroke="#b47640" strokeWidth="0.7" strokeLinecap="round" />
          <circle cx="60" cy="44" r="28" fill="none" stroke="#e3f0ff" strokeOpacity="0.9" strokeWidth="2" />
          <path d="M39.5 31 A24 24 0 0 1 57 19.6" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="37.4" cy="36.6" r="1.4" fill="#ffffff" opacity="0.75" />
          <path d="M80 54 A22 22 0 0 1 72 64" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />

          {/* Antenna with a beacon in the world's colour. */}
          <path d="M60 16 L60 8.5" stroke="#c4cde0" strokeWidth="1.6" strokeLinecap="round" />
          <circle className="world-landing__beacon" cx="60" cy="7" r="2.6" />
        </svg>
      </div>
    </span>
  );
}
