"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PROJECTS } from "@/data/projects";
import { WorldVehicleArt } from "@/components/WorldVehicleArt";
import { localePhaseDegrees } from "@/lib/geoPhase";
import {
  WORLD_FLIGHTS,
  WorldVehicle,
  flightPath,
  onWorldEntryLaunch,
  pathSignature,
  type FlightPoint,
  type WorldEntryLaunch,
  type WorldSlug,
} from "@/lib/worldFlight";

/** Flight time along the curve: long enough to read, short enough to never feel like a wait. */
const FLIGHT_MS = 560;
/** Hard cap from the flight's first frame: the overlay is gone by then even if the route has not committed. */
const MAX_MS = 700;
/** Keyframes sampled along the curve (WAAPI interpolates linearly between them). */
const SAMPLES = 28;
/** UFO afterglow: echoes trailing the saucer by these delays. */
const ECHO_DELAYS_MS: readonly number[] = [45, 90, 135];

type Flight = {
  id: number;
  slug: WorldSlug;
  vehicle: WorldVehicle;
  points: FlightPoint[];
  target: { x: number; y: number };
  /** The vehicle art faces right; a flight heading left is mirrored so it never flies upside down. */
  flip: boolean;
  scaleFrom: number;
  scaleTo: number;
  headingFollow: number;
};

/** Inline style carrying a world's colour tokens as CSS custom properties. */
type ToneStyle = CSSProperties & Record<`--${string}`, string>;

/**
 * The visitor's country phase φ in radians, from the browser's preferred
 * languages (lib/geoPhase): no request, computed once per page load.
 */
let visitorPhaseRad: number | null = null;
function visitorPhase(): number {
  if (visitorPhaseRad === null) {
    const degrees = localePhaseDegrees([...navigator.languages, navigator.language]);
    visitorPhaseRad = (degrees * Math.PI) / 180;
  }
  return visitorPhaseRad;
}

/** Bursts in from the edge, then slows as it dives into the world. */
const easeFlight = (x: number) => 1 - (1 - x) ** 2.2;

function keyframesFor(flight: Flight): Keyframe[] {
  const frames: Keyframe[] = [];
  const last = flight.points.length - 1;
  for (let i = 0; i <= last; i++) {
    // Uniform offsets, eased progress: sample the curve at eased u.
    const offset = i / last;
    const index = Math.round(easeFlight(offset) * last);
    const p = flight.points[index];
    const s = flight.scaleFrom + (flight.scaleTo - flight.scaleFrom) * offset ** 1.6;
    // Heading relative to the way the art faces, in (-180°, 180°], then the vehicle's share of it.
    const relative = ((((flight.flip ? p.angle - 180 : p.angle) + 180) % 360) + 360) % 360 - 180;
    const angle = relative * flight.headingFollow;
    const opacity = offset < 0.08 ? offset / 0.08 : offset > 0.86 ? (1 - offset) / 0.14 : 1;
    frames.push({
      offset,
      opacity,
      transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${angle.toFixed(1)}deg) scale(${flight.flip ? -s : s}, ${s})`,
    });
  }
  return frames;
}

/**
 * Overlay that flies the entered world's vehicle (UFO, paper plane, hammer or
 * book) along that world's tangent curve, see lib/worldFlight. Loaded as its
 * own chunk after hydration. It is position: fixed, clipped and
 * pointer-transparent, animates transform/opacity only (WAAPI), runs in
 * parallel with the route change and unmounts once the flight has ended and
 * the target route has committed (capped at MAX_MS).
 */
export default function WorldEntryFlight() {
  const [flight, setFlight] = useState<Flight | null>(null);
  const counter = useRef(0);
  const vehicleRef = useRef<HTMLDivElement>(null);
  const echoRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const burstRef = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      onWorldEntryLaunch((launch: WorldEntryLaunch) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const config = WORLD_FLIGHTS[launch.slug];
        const points = flightPath(config.curve, visitorPhase(), launch.target, { width: window.innerWidth, height: window.innerHeight }, SAMPLES);
        const dx = points[points.length - 1].x - points[0].x;
        counter.current += 1;
        setFlight({
          id: counter.current,
          slug: launch.slug,
          vehicle: config.vehicle,
          points,
          target: launch.target,
          flip: dx < 0,
          scaleFrom: config.curve.scaleFrom,
          scaleTo: config.curve.scaleTo,
          headingFollow: config.headingFollow,
        });
      }),
    [],
  );

  useEffect(() => {
    const vehicle = vehicleRef.current;
    if (!flight || !vehicle) return;
    const targetPath = `/${flight.slug}`;
    const frames = keyframesFor(flight);
    const animations: Animation[] = [vehicle.animate(frames, { duration: FLIGHT_MS, easing: "linear", fill: "both" })];
    for (const [i, echo] of echoRefs.current.entries()) {
      if (!echo) continue;
      animations.push(echo.animate(frames, { duration: FLIGHT_MS, delay: ECHO_DELAYS_MS[i], easing: "linear", fill: "both" }));
    }
    if (burstRef.current) {
      animations.push(
        burstRef.current.animate(
          [
            { opacity: 0, transform: "scale(0.2)" },
            { opacity: 0.9, transform: "scale(0.9)", offset: 0.4 },
            { opacity: 0, transform: "scale(2.6)" },
          ],
          { duration: 300, delay: FLIGHT_MS - 200, easing: "ease-out", fill: "both" },
        ),
      );
    }
    let raf = 0;
    let alive = true;
    // Timed from when the flight is really on screen: the first frame after
    // the click can land after the new route has committed.
    const watch = async () => {
      try {
        await animations[0].ready;
      } catch {
        return; // Cancelled.
      }
      if (!alive) return;
      const started = performance.now();
      const tick = () => {
        const elapsed = performance.now() - started;
        const arrived = window.location.pathname === targetPath;
        if (elapsed >= MAX_MS || (arrived && animations.every((a) => a.playState === "finished"))) {
          setFlight((current) => (current?.id === flight.id ? null : current));
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    void watch();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      for (const a of animations) a.cancel();
    };
  }, [flight]);

  if (!flight) return null;
  const project = PROJECTS.find((p) => p.slug === flight.slug);
  const tone: ToneStyle = project
    ? { "--tone": project.planet.atmoA, "--tone-2": project.planet.atmoB, "--tone-deep": project.planet.body }
    : {};
  const isUfo = flight.vehicle === WorldVehicle.Ufo;
  return (
    <div
      className="world-flight"
      aria-hidden="true"
      data-world-flight={flight.vehicle}
      data-world={flight.slug}
      data-path={pathSignature(flight.points)}
      style={tone}
    >
      {isUfo
        ? ECHO_DELAYS_MS.map((delay, i) => (
            <span
              key={delay}
              className="world-flight__echo"
              ref={(el) => {
                echoRefs.current[i] = el;
              }}
              style={{ "--echo": String(1 - i / ECHO_DELAYS_MS.length) } as ToneStyle}
            />
          ))
        : null}
      {isUfo ? <span ref={burstRef} className="world-flight__burst" style={{ left: flight.target.x, top: flight.target.y }} /> : null}
      <div ref={vehicleRef} className="world-flight__vehicle" data-vehicle={flight.vehicle}>
        <WorldVehicleArt vehicle={flight.vehicle} />
      </div>
    </div>
  );
}
