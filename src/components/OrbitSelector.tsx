"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { PROJECTS, type Project } from "@/data/projects";
import { useI18n } from "@/lib/i18n";
import { setActiveProject } from "@/lib/projectFocus";

/** Idle time between automatic steps of the orbit. */
const AUTO_STEP_MS = 6500;
/** After the user moves the orbit, auto-rotation skips this many ticks. */
const USER_PAUSE_TICKS = 2;
/** Duration of the zoom into the focused item before navigating. */
const ENTER_MS = 420;
/** Horizontal swipe distance (px) that counts as a step. */
const SWIPE_PX = 40;
/** Vertical squash of the ring: how tilted the orbit looks. */
const RING_TILT = 0.42;

enum StepSpeed {
  Auto = "auto",
  User = "user",
}

/** Angle of item `i` on the ring, in degrees; 90 is the front (bottom). */
function angleOf(i: number, rotation: number, count: number): number {
  return 90 + (i - rotation) * (360 / count);
}

function wrap(i: number, count: number): number {
  return ((i % count) + count) % count;
}

/**
 * Orbital selector for the home sections. Items sit on a tilted ring and
 * rotate around a glowing core: the item at the front is the focused one.
 *
 * - Prev / next buttons, ← → keys and a horizontal swipe step the ring; a
 *   back item can be clicked to bring it forward.
 * - The front item is a real link: activating it zooms into it and then
 *   navigates (modified clicks keep the browser's default behaviour).
 * - Slow auto-rotation (one step every few seconds) pauses on hover, focus,
 *   interaction, when the section is off screen or the tab is hidden, and is
 *   off with prefers-reduced-motion.
 *
 * Motion is CSS transitions on transforms only: the ring is squashed with
 * scaleY, each arm rotates, each body counter-rotates and un-squashes, so the
 * transition travels along the arc and items stay upright. No per-frame JS.
 */
export function OrbitSelector() {
  const { t, tl } = useI18n();
  const router = useRouter();
  const count = PROJECTS.length;
  // Cumulative rotation in steps (never wrapped) so transitions always take
  // the short way round instead of spinning back across 360 degrees.
  const [rotation, setRotation] = useState(0);
  const [speed, setSpeed] = useState<StepSpeed>(StepSpeed.User);
  const [entering, setEntering] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipTicks = useRef(0);
  const hovering = useRef(false);
  /** When the section last came on screen (0 while off screen). */
  const visibleSince = useRef(0);
  const swipeX = useRef<number | null>(null);

  const active = wrap(rotation, count);
  const current = PROJECTS[active];
  const nameOf = (p: Project) => (p.title ? tl(p.title) : p.name);

  useEffect(() => {
    setActiveProject(active, 1);
  }, [active]);

  const step = (delta: number, by: StepSpeed = StepSpeed.User) => {
    if (by === StepSpeed.User) skipTicks.current = USER_PAUSE_TICKS;
    setSpeed(by);
    setRotation((r) => r + delta);
  };

  const bringForward = (i: number) => {
    // Shortest signed distance from the front to item i.
    let delta = wrap(i - active, count);
    if (delta > count / 2) delta -= count;
    if (delta !== 0) step(delta);
  };

  // Slow auto-rotation, only while the section is on screen and idle.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      visibleSince.current = entry.isIntersecting ? Date.now() : 0;
    });
    observer.observe(root);
    const timer = window.setInterval(() => {
      const focusInside = root.contains(document.activeElement);
      // Never step right as the reader arrives: wait one full idle period.
      const settled = visibleSince.current > 0 && Date.now() - visibleSince.current >= AUTO_STEP_MS;
      if (!settled || hovering.current || focusInside || document.hidden) return;
      if (skipTicks.current > 0) {
        skipTicks.current -= 1;
        return;
      }
      setSpeed(StepSpeed.Auto);
      setRotation((r) => r + 1);
    }, AUTO_STEP_MS);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  // Swipe: horizontal drags step the ring; vertical scrolling stays native
  // (touch-action: pan-y on the stage).
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    swipeX.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (swipeX.current === null) return;
    const dx = event.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
  };

  const enter = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(`/${slug}`);
      return;
    }
    setEntering(slug);
    window.setTimeout(() => router.push(`/${slug}`), ENTER_MS);
  };

  const prev = PROJECTS[wrap(active - 1, count)];
  const next = PROJECTS[wrap(active + 1, count)];

  return (
    <div
      ref={rootRef}
      className={`orbit-select${entering ? " is-entering" : ""}`}
      data-speed={speed}
      role="group"
      aria-roledescription={tl({ es: "selector orbital", en: "orbital selector" })}
      aria-label={t("proj_title")}
      onKeyDown={onKeyDown}
      onMouseEnter={() => {
        hovering.current = true;
      }}
      onMouseLeave={() => {
        hovering.current = false;
      }}
    >
      <div className="orbit-select__stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => {
          swipeX.current = null;
        }}>
        <span className="orbit-select__core" aria-hidden="true" style={{ "--tone": current.planet.atmoA } as CSSProperties} />
        <div className="orbit-select__ring" style={{ transform: `scaleY(${RING_TILT})` }}>
          <span className="orbit-select__track" aria-hidden="true" />
          {PROJECTS.map((p, i) => {
            const angle = angleOf(i, rotation, count);
            const depth = Math.sin((angle * Math.PI) / 180); // 1 = front, -1 = back
            const isFront = i === active;
            const armStyle = { transform: `rotate(${angle}deg)`, zIndex: Math.round((depth + 1) * 10) } as CSSProperties;
            const bodyStyle = {
              transform: `translateX(var(--orbit-r)) rotate(${-angle}deg) scaleY(${(1 / RING_TILT).toFixed(4)}) scale(${(0.58 + 0.42 * ((depth + 1) / 2)).toFixed(3)})`,
              opacity: (0.5 + 0.5 * ((depth + 1) / 2)).toFixed(3),
              "--tone": p.planet.atmoA,
              "--tone-2": p.planet.atmoB,
            } as CSSProperties;
            const name = nameOf(p);
            return (
              <div key={p.slug} className="orbit-select__arm" style={armStyle}>
                {isFront ? (
                  <Link
                    id="world-details"
                    href={`/${p.slug}`}
                    className={`orbit-select__body is-front${entering === p.slug ? " is-zooming" : ""}`}
                    style={bodyStyle}
                    aria-label={tl({ es: `Entrar: ${name}`, en: `Enter: ${name}` })}
                    data-no-warp=""
                    onClick={(event) => enter(event, p.slug)}
                  >
                    <span className="orbit-select__orb" aria-hidden="true" />
                    <span className="orbit-select__name">{name}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="orbit-select__body"
                    style={bodyStyle}
                    aria-label={tl({ es: `Traer al frente: ${name}`, en: `Bring to front: ${name}` })}
                    onClick={() => bringForward(i)}
                  >
                    <span className="orbit-select__orb" aria-hidden="true" />
                    <span className="orbit-select__name">{name}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Each name shows once, on its orbit item; the live region only
          announces the change to screen readers. */}
      <div className="orbit-select__detail">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {nameOf(current)}
        </p>
        <span className="orbit-select__count" style={{ color: current.planet.atmoA }}>
          {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")} · {current.year}
        </span>
        {current.tagline ? <p className="orbit-select__tagline">{tl(current.tagline)}</p> : null}
      </div>

      <div className="orbit-select__controls">
        <button type="button" className="orbit-select__step" onClick={() => step(-1)} aria-label={tl({ es: `Anterior: ${nameOf(prev)}`, en: `Previous: ${nameOf(prev)}` })}>
          <span aria-hidden="true">←</span>
        </button>
        <Link
          href={`/${current.slug}`}
          className="orbit-select__enter"
          data-no-warp=""
          onClick={(event) => enter(event, current.slug)}
        >
          {tl({ es: "Entrar", en: "Enter" })}
          <span aria-hidden="true">→</span>
        </Link>
        <button type="button" className="orbit-select__step" onClick={() => step(1)} aria-label={tl({ es: `Siguiente: ${nameOf(next)}`, en: `Next: ${nameOf(next)}` })}>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
