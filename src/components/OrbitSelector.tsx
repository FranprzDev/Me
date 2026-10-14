"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { PROJECTS, type Project } from "@/data/projects";
import { useI18n } from "@/lib/i18n";

/** Idle time between automatic steps of the orbit. */
const AUTO_STEP_MS = 6500;
/** After the user moves the orbit, auto-rotation skips this many ticks. */
const USER_PAUSE_TICKS = 2;
/** Horizontal swipe distance (px) that counts as a step. */
const SWIPE_PX = 40;

/**
 * Where an item sits in the system. The centred item is the focused one; the
 * others ride an ellipse around it: one on each side and one at the back.
 * Positions, sizes and depth live in CSS (keyed on `data-slot`).
 */
enum OrbitSlot {
  Center = "center",
  Right = "right",
  Back = "back",
  Left = "left",
}

/** Slot for each offset from the centred item (offset 1 is "next"). */
const SLOT_BY_OFFSET: readonly OrbitSlot[] = [OrbitSlot.Center, OrbitSlot.Right, OrbitSlot.Back, OrbitSlot.Left];

/** Surface texture family each world is painted with (pure CSS layers). */
enum OrbSurface {
  Banded = "banded",
  Cratered = "cratered",
  Oceanic = "oceanic",
  Storm = "storm",
}

/** Texture per world; unknown slugs fall back to the banded giant. */
const SURFACE_BY_SLUG: Readonly<Record<string, OrbSurface>> = {
  hackathons: OrbSurface.Banded,
  teaching: OrbSurface.Cratered,
  projects: OrbSurface.Oceanic,
  education: OrbSurface.Storm,
};

/** Worlds escorted by a small moon on a tilted orbit. */
const MOON_SLUGS: ReadonlySet<string> = new Set(["education", "teaching"]);

/** Inline style carrying a world's colour tokens as CSS custom properties. */
type ToneStyle = CSSProperties & Record<`--${string}`, string>;

enum StepSpeed {
  Auto = "auto",
  User = "user",
}

function wrap(i: number, count: number): number {
  return ((i % count) + count) % count;
}

/**
 * Home sections selector laid out as a small solar system: the focused item
 * is large in the centre, the other three ride a faint tilted ellipse around
 * it (left, right and a smaller, dimmer one at the back).
 *
 * - ← → keys and a horizontal swipe rotate every item one slot along the
 *   ellipse; clicking an outer item brings it to the centre. Keyboard steps
 *   keep focus on the new centred item.
 * - The centred item is a real link: activating it zooms into it while the
 *   world route loads (modified clicks keep the browser's default behaviour).
 * - Slow auto-rotation pauses on hover, focus, interaction, when the section
 *   is off screen or the tab is hidden, and is off with prefers-reduced-motion.
 *
 * Motion is CSS transitions on transforms only: the horizontal and vertical
 * moves use different easings, so a step travels along a curve instead of a
 * straight line. Each world is layered CSS (texture, clouds, shading,
 * atmosphere, optional ring and moon); its slow spin is a transform
 * animation that pauses off screen. No per-frame JS, no canvas and no 3D.
 */
export function OrbitSelector() {
  const { t, tl } = useI18n();
  const router = useRouter();
  const count = PROJECTS.length;
  const [active, setActive] = useState(0);
  const [speed, setSpeed] = useState<StepSpeed>(StepSpeed.User);
  const [entering, setEntering] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipTicks = useRef(0);
  const hovering = useRef(false);
  /** When the section last came on screen (0 while off screen). */
  const visibleSince = useRef(0);
  const swipeX = useRef<number | null>(null);
  /** Set by keyboard steps so focus follows the item that reaches the centre. */
  const focusCenter = useRef(false);
  const centerRef = useRef<HTMLAnchorElement>(null);

  const current = PROJECTS[active];
  const nameOf = (p: Project) => (p.title ? tl(p.title) : p.name);

  const step = (delta: number, by: StepSpeed = StepSpeed.User, keepFocus = false) => {
    focusCenter.current = keepFocus;
    if (by === StepSpeed.User) skipTicks.current = USER_PAUSE_TICKS;
    setSpeed(by);
    setActive((a) => wrap(a + delta, count));
  };

  // The focused element unmounts when its item changes slot (link <-> button),
  // so keyboard steps hand focus to the new centred link.
  useEffect(() => {
    if (!focusCenter.current) return;
    focusCenter.current = false;
    centerRef.current?.focus();
  }, [active]);

  // Slow auto-rotation, only while the section is on screen and idle.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      visibleSince.current = entry.isIntersecting ? Date.now() : 0;
      // Surface spin, clouds and moons pause while the selector is off screen.
      root.toggleAttribute("data-offscreen", !entry.isIntersecting);
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
      setActive((a) => wrap(a + 1, PROJECTS.length));
    }, AUTO_STEP_MS);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1, StepSpeed.User, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1, StepSpeed.User, true);
    }
  };

  // Swipe: horizontal drags rotate the system; vertical scrolling stays
  // native (touch-action: pan-y on the stage).
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
    // Navigate right away instead of after the zoom: the zoom is a compositor
    // transition, so it keeps playing while the (prefetched) world mounts. One
    // frame first, so the zoom has started before the route work begins.
    window.requestAnimationFrame(() => router.push(`/${slug}`));
  };

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
      <div
        className="orbit-select__stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipeX.current = null;
        }}
      >
        <span className="orbit-select__track" aria-hidden="true" />
        {PROJECTS.map((p, i) => {
          const offset = wrap(i - active, count);
          const slot = SLOT_BY_OFFSET[offset];
          const isCenter = slot === OrbitSlot.Center;
          const ring = p.planet.ring;
          const tone: ToneStyle = {
            "--tone": p.planet.atmoA,
            "--tone-2": p.planet.atmoB,
            "--tone-deep": p.planet.body,
            ...(ring ? { "--ring": ring } : {}),
          };
          const name = nameOf(p);
          return (
            <div key={p.slug} className="orbit-select__slot" data-slot={slot} style={tone}>
              <div className={`orbit-select__lift${entering === p.slug ? " is-zooming" : ""}`}>
                {/* The control is an overlay over the world, so the world and
                    its label stay mounted (spin and label size keep going)
                    when the item swaps between link and button. */}
                {isCenter ? (
                  <Link
                    ref={centerRef}
                    id="world-details"
                    href={`/${p.slug}`}
                    className="orbit-select__body is-center"
                    aria-label={tl({ es: `Entrar: ${name}`, en: `Enter: ${name}` })}
                    data-no-warp=""
                    onClick={(event) => enter(event, p.slug)}
                  />
                ) : (
                  <button
                    type="button"
                    className="orbit-select__body"
                    aria-label={tl({ es: `Traer al centro: ${name}`, en: `Bring to centre: ${name}` })}
                    // Offset 3 is one step back; offset 2 (the back slot) goes either way.
                    // A keyboard activation (detail 0) keeps focus on the new centre.
                    onClick={(event) => step(offset > count / 2 ? offset - count : offset, StepSpeed.User, event.detail === 0)}
                  />
                )}
                <span className="orbit-select__orb" data-surface={SURFACE_BY_SLUG[p.slug] ?? OrbSurface.Banded} aria-hidden="true">
                  <span className="orbit-select__halo" />
                  {ring ? <span className="orbit-select__ring is-back" /> : null}
                  <span className="orbit-select__globe">
                    <span className="orbit-select__map" />
                    <span className="orbit-select__clouds" />
                  </span>
                  {ring ? <span className="orbit-select__ring is-front" /> : null}
                  {MOON_SLUGS.has(p.slug) ? (
                    <span className="orbit-select__moon-path">
                      <span className="orbit-select__moon" />
                    </span>
                  ) : null}
                </span>
                <span className="orbit-select__name" aria-hidden="true">
                  {name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Each name shows once, on its own item; the live region only
          announces the change to screen readers. */}
      <div className="orbit-select__detail">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {nameOf(current)}
        </p>
        {current.tagline ? <p className="orbit-select__tagline">{tl(current.tagline)}</p> : null}
      </div>
    </div>
  );
}
