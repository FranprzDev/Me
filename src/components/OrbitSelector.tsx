"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { WORLDS, type WorldEntry } from "@/data/worlds";
import { useI18n } from "@/lib/i18n";
import { IDENTITY, rotateBy, surfaceOf, type Quat } from "@/lib/worldSpin";
import { WorldLanding } from "@/components/WorldLanding";

/** Idle time between automatic steps of the orbit. */
const AUTO_STEP_MS = 6500;
/** After the user moves the orbit, auto-rotation skips this many ticks. */
const USER_PAUSE_TICKS = 2;
/** Horizontal swipe distance (px) that counts as a step. */
const SWIPE_PX = 40;
/** Pointer travel (px) after which a press on a world becomes a drag instead of a click. */
const DRAG_SLOP_PX = 6;
/**
 * Touch: a press held this long (ms) before moving grabs the world in any
 * direction; a quicker vertical move is left to the page scroll.
 */
const TOUCH_HOLD_MS = 160;
/** Inertia after a release: velocity decays with this time constant (ms). */
const INERTIA_TAU_MS = 420;
/** Inertia stops below this speed (px/ms). */
const INERTIA_MIN_SPEED = 0.015;
/** A release this long (ms) after the last move throws nothing. */
const RELEASE_STILL_MS = 90;
/** Reduced motion: the selector fades out for this long (ms) before the jump. */
const FADE_MS = 160;

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

/** Where the jump into a world is: the puppy lands, then the world zooms in. */
enum EntryPhase {
  Idle = "idle",
  Landing = "landing",
  Zooming = "zooming",
  Fading = "fading",
}

enum PointerKind {
  Mouse = "mouse",
  Touch = "touch",
}

/** A press on a world that may turn into a trackball drag. */
type WorldDrag = {
  slug: string;
  pointerId: number;
  kind: string;
  /** The pressed element, which captures the pointer once the drag starts. */
  target: HTMLElement;
  startX: number;
  startY: number;
  startedAt: number;
  lastX: number;
  lastY: number;
  lastAt: number;
  /** Smoothed pointer velocity (px/ms), thrown into the inertia on release. */
  vx: number;
  vy: number;
  radius: number;
  dragging: boolean;
};

/** A world still turning after a release. */
type Inertia = { slug: string; vx: number; vy: number; radius: number; at: number };

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
 * - The centred item is a real link: activating it lands a puppy astronaut
 *   on the world (components/WorldLanding), then zooms into it while the
 *   world route loads (modified clicks keep the browser's default
 *   behaviour). Reduced motion skips the landing for a short fade.
 * - Press and drag any world to turn it freely about any axis (trackball,
 *   lib/worldSpin), with gentle inertia (none under reduced motion). A drag
 *   never navigates or steps; a plain click or tap still does. On touch, a
 *   quick vertical move keeps scrolling the page: a world is grabbed by a
 *   horizontal move or a short hold first.
 * - Slow auto-rotation pauses on hover, focus, interaction, when the section
 *   is off screen or the tab is hidden, and is off with prefers-reduced-motion.
 *
 * Motion is CSS transitions on transforms only: the horizontal and vertical
 * moves use different easings, so a step travels along a curve instead of a
 * straight line. Each world is layered CSS (texture, clouds, shading,
 * atmosphere, optional ring and moon); its slow spin is a transform
 * animation that pauses off screen. Per-frame JS only runs while a world is
 * dragged or coasting; no canvas and no 3D.
 */
export function OrbitSelector() {
  const { t, tl } = useI18n();
  const router = useRouter();
  const count = WORLDS.length;
  const [active, setActive] = useState(0);
  const [speed, setSpeed] = useState<StepSpeed>(StepSpeed.User);
  const [entering, setEntering] = useState<string | null>(null);
  const [phase, setPhase] = useState<EntryPhase>(EntryPhase.Idle);
  const enteringRef = useRef(false);
  /** Each world's orientation, painted onto its layers as CSS variables. */
  const spins = useRef(new Map<string, Quat>());
  const orbRefs = useRef(new Map<string, HTMLSpanElement>());
  const drag = useRef<WorldDrag | null>(null);
  const inertia = useRef<Inertia | null>(null);
  const inertiaFrame = useRef(0);
  /** Set when a drag ends, so the click that follows the release is ignored. */
  const swallowClick = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipTicks = useRef(0);
  const hovering = useRef(false);
  /** When the section last came on screen (0 while off screen). */
  const visibleSince = useRef(0);
  const swipeX = useRef<number | null>(null);
  /** Set by keyboard steps so focus follows the item that reaches the centre. */
  const focusCenter = useRef(false);
  const centerRef = useRef<HTMLAnchorElement>(null);

  const current = WORLDS[active];
  const nameOf = (p: WorldEntry) => (p.title ? tl(p.title) : p.name);

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
      if (!settled || hovering.current || focusInside || document.hidden || enteringRef.current || drag.current?.dragging) return;
      if (skipTicks.current > 0) {
        skipTicks.current -= 1;
        return;
      }
      setSpeed(StepSpeed.Auto);
      setActive((a) => wrap(a + 1, WORLDS.length));
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
    if (event.pointerType === PointerKind.Mouse || drag.current) return;
    swipeX.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (swipeX.current === null) return;
    const dx = event.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
  };

  // ─── Trackball drag ───────────────────────────────────────────────────

  /** Paints a world's orientation onto its layers (roll, band tilt, longitude, ring). */
  const paint = (slug: string) => {
    const orb = orbRefs.current.get(slug);
    if (!orb) return;
    const pose = surfaceOf(spins.current.get(slug) ?? IDENTITY);
    orb.style.setProperty("--spin-roll", `${pose.rollDeg.toFixed(2)}deg`);
    orb.style.setProperty("--spin-tilt", pose.tilt.toFixed(4));
    orb.style.setProperty("--spin-lon", pose.lon.toFixed(4));
    orb.style.setProperty("--ring-open", pose.ringOpen.toFixed(3));
  };

  const turn = (slug: string, dx: number, dy: number, radius: number) => {
    spins.current.set(slug, rotateBy(spins.current.get(slug) ?? IDENTITY, dx, dy, radius));
    paint(slug);
  };

  const stopInertia = () => {
    cancelAnimationFrame(inertiaFrame.current);
    inertia.current = null;
  };

  const coast = (now: number) => {
    const state = inertia.current;
    if (!state) return;
    const dt = Math.min(48, now - state.at);
    state.at = now;
    const decay = Math.exp(-dt / INERTIA_TAU_MS);
    state.vx *= decay;
    state.vy *= decay;
    if (Math.hypot(state.vx, state.vy) < INERTIA_MIN_SPEED) {
      inertia.current = null;
      return;
    }
    turn(state.slug, state.vx * dt, state.vy * dt, state.radius);
    inertiaFrame.current = requestAnimationFrame(coast);
  };

  useEffect(() => () => cancelAnimationFrame(inertiaFrame.current), []);

  // While a world is grabbed by touch, the page must not scroll under the
  // finger. touch-action is fixed at touchstart (pan-y on the stage, so quick
  // vertical swipes keep scrolling), so the grab cancels the touchmoves itself.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onTouchMove = (event: TouchEvent) => {
      if (drag.current?.dragging && event.cancelable) event.preventDefault();
    };
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => root.removeEventListener("touchmove", onTouchMove);
  }, []);

  const onWorldPointerDown = (event: PointerEvent<HTMLElement>, slug: string) => {
    if (enteringRef.current || !event.isPrimary || (event.pointerType === PointerKind.Mouse && event.button !== 0)) return;
    const orb = orbRefs.current.get(slug)?.getBoundingClientRect();
    // Event timestamps share performance.now()'s and requestAnimationFrame's clock.
    const now = event.timeStamp;
    drag.current = {
      slug,
      pointerId: event.pointerId,
      kind: event.pointerType,
      target: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: now,
      lastX: event.clientX,
      lastY: event.clientY,
      lastAt: now,
      vx: 0,
      vy: 0,
      radius: orb ? orb.width / 2 : 120,
      dragging: false,
    };
    swipeX.current = null;
  };

  const onWorldPointerMove = (event: PointerEvent<HTMLElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const now = event.timeStamp;
    if (!state.dragging) {
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (Math.hypot(dx, dy) < DRAG_SLOP_PX) return;
      const held = now - state.startedAt >= TOUCH_HOLD_MS;
      if (state.kind === PointerKind.Touch && !held && Math.abs(dy) > Math.abs(dx)) {
        // A quick vertical swipe: that's the page scrolling, not a grab.
        drag.current = null;
        return;
      }
      state.dragging = true;
      stopInertia();
      skipTicks.current = USER_PAUSE_TICKS;
      rootRef.current?.setAttribute("data-dragging", "");
      try {
        state.target.setPointerCapture(event.pointerId);
      } catch {
        // The pointer is already gone; the drag ends on its own.
      }
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastAt = now;
      return;
    }
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    const dt = Math.max(1, now - state.lastAt);
    state.vx = 0.6 * (dx / dt) + 0.4 * state.vx;
    state.vy = 0.6 * (dy / dt) + 0.4 * state.vy;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.lastAt = now;
    turn(state.slug, dx, dy, state.radius);
  };

  const endDrag = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    drag.current = null;
    if (!state.dragging) return;
    rootRef.current?.removeAttribute("data-dragging");
    if (state.target.hasPointerCapture(event.pointerId)) state.target.releasePointerCapture(event.pointerId);
    // The click that follows a drag's release must not enter or step.
    swallowClick.current = true;
    window.setTimeout(() => {
      swallowClick.current = false;
    }, 0);
    const still = event.timeStamp - state.lastAt > RELEASE_STILL_MS;
    if (cancelled || still || prefersReducedMotion()) return;
    inertia.current = { slug: state.slug, vx: state.vx, vy: state.vy, radius: state.radius, at: event.timeStamp };
    inertiaFrame.current = requestAnimationFrame(coast);
  };

  const worldPointerHandlers = (slug: string) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => onWorldPointerDown(event, slug),
    onPointerMove: onWorldPointerMove,
    onPointerUp: (event: PointerEvent<HTMLElement>) => endDrag(event, false),
    onPointerCancel: (event: PointerEvent<HTMLElement>) => endDrag(event, true),
    // A long press must grab the world, not open the link's context menu or drag the URL.
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if (drag.current?.kind === PointerKind.Touch) event.preventDefault();
    },
    onDragStart: (event: MouseEvent<HTMLElement>) => event.preventDefault(),
  });

  // ─── Entering a world ─────────────────────────────────────────────────

  const goTo = useCallback((slug: string) => router.push(`/${slug}`), [router]);

  const enter = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (swallowClick.current) {
      event.preventDefault();
      return;
    }
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (enteringRef.current) return;
    enteringRef.current = true;
    stopInertia();
    setEntering(slug);
    if (prefersReducedMotion()) {
      setPhase(EntryPhase.Fading);
      window.setTimeout(() => goTo(slug), FADE_MS);
      return;
    }
    // The puppy lands first (≈0.8 s), then the world zooms in and the route
    // changes; the world's route is prefetched meanwhile.
    setPhase(EntryPhase.Landing);
    router.prefetch(`/${slug}`);
  };

  const landed = useCallback(() => {
    if (!entering) return;
    // The zoom is a compositor transition: it keeps playing while the world
    // mounts. The zoom state commits first (urgent update); the route change
    // is a transition, rendered after it.
    setPhase(EntryPhase.Zooming);
    goTo(entering);
  }, [entering, goTo]);

  return (
    <div
      ref={rootRef}
      className={`orbit-select${entering ? " is-entering" : ""}`}
      data-speed={speed}
      data-entry={phase}
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
        {WORLDS.map((p, i) => {
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

          const landing = entering === p.slug && (phase === EntryPhase.Landing || phase === EntryPhase.Zooming);
          return (
            <div key={p.slug} className="orbit-select__slot" data-slot={slot} style={tone}>
              <div className={`orbit-select__lift${entering === p.slug && phase === EntryPhase.Zooming ? " is-zooming" : ""}`}>
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
                    draggable={false}
                    {...worldPointerHandlers(p.slug)}
                    onClick={(event) => enter(event, p.slug)}
                  />
                ) : (
                  <button
                    type="button"
                    className="orbit-select__body"
                    aria-label={tl({ es: `Traer al centro: ${name}`, en: `Bring to centre: ${name}` })}
                    // Offset 3 is one step back; offset 2 (the back slot) goes either way.
                    // A keyboard activation (detail 0) keeps focus on the new centre.
                    {...worldPointerHandlers(p.slug)}
                    onClick={(event) => {
                      if (swallowClick.current || enteringRef.current) return;
                      step(offset > count / 2 ? offset - count : offset, StepSpeed.User, event.detail === 0);
                    }}
                  />
                )}
                <span
                  className="orbit-select__orb"
                  data-surface={SURFACE_BY_SLUG[p.slug] ?? OrbSurface.Banded}
                  aria-hidden="true"
                  ref={(el) => {
                    if (el) orbRefs.current.set(p.slug, el);
                    else orbRefs.current.delete(p.slug);
                  }}
                >
                  <span className="orbit-select__halo" />
                  {ring ? <span className="orbit-select__ring is-back" /> : null}
                  <span className="orbit-select__globe">
                    <span className="orbit-select__surface">
                      <span className="orbit-select__map" />
                      <span className="orbit-select__clouds" />
                    </span>
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
                {landing ? <WorldLanding onLanded={landed} /> : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Each name shows once, on its own item; the live region only
          announces the change to screen readers. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {nameOf(current)}
      </p>
    </div>
  );
}
