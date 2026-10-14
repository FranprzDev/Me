/**
 * World-entry flights: entering a world from the home selector sends that
 * world's vehicle along a tangent curve into it, as a pointer-transparent
 * overlay that runs in parallel with the route change (it never delays it).
 *
 * This module is tiny on purpose (it ships with the selector): the per-world
 * config, the curve maths, the visitor's country phase and a one-listener
 * channel to the lazily loaded overlay (components/WorldEntryFlight).
 */

/** Worlds reachable from the home selector (route slugs). */
export enum WorldSlug {
  Hackathons = "hackathons",
  Teaching = "teaching",
  Projects = "projects",
  Education = "education",
}

/** Vehicle each world sends the visitor in with. */
export enum WorldVehicle {
  Ufo = "ufo",
  Book = "book",
  Hammer = "hammer",
  PaperPlane = "paper-plane",
}

/**
 * One world's tangent trajectory, y(t) = A·tan(k·t + φ) for t in [tStart, tEnd].
 *
 * - amplitude (A): how far the curve swings off the straight line into the
 *   world, as a fraction of that line's length.
 * - frequency (k) and the t-range: which stretch of the tan branch is flown
 *   (span k·(tEnd − tStart), always shorter than π so the flight never
 *   crosses an asymptote).
 * - entryDeg: screen heading of the straight line from the entry point to the
 *   world (0° = flying right, 90° = flying down), i.e. the side it comes from.
 * - mirror: bends the swoosh to the other side of that line.
 * - scaleFrom / scaleTo: the vehicle shrinks as it dives into the world.
 */
export type FlightCurve = {
  amplitude: number;
  frequency: number;
  tStart: number;
  tEnd: number;
  entryDeg: number;
  mirror: boolean;
  scaleFrom: number;
  scaleTo: number;
};

/**
 * headingFollow: how much of the tangent heading the vehicle turns by (1 =
 * nose along the path). The saucer only banks into it, so its tractor beam
 * keeps pointing down at the world.
 */
export type WorldFlightConfig = { vehicle: WorldVehicle; curve: FlightCurve; headingFollow: number };

export const WORLD_FLIGHTS: Readonly<Record<WorldSlug, WorldFlightConfig>> = {
  // The UFO comes in wide from the lower left on a deep S-swoop.
  [WorldSlug.Hackathons]: {
    vehicle: WorldVehicle.Ufo,
    curve: { amplitude: 0.42, frequency: 1.1, tStart: -1.15, tEnd: 1.2, entryDeg: -35, mirror: false, scaleFrom: 1.3, scaleTo: 0.3 },
    headingFollow: 0.35,
  },
  // The paper plane glides down from the upper right, a shallow arc.
  [WorldSlug.Teaching]: {
    vehicle: WorldVehicle.PaperPlane,
    curve: { amplitude: 0.26, frequency: 0.9, tStart: -0.6, tEnd: 1.55, entryDeg: 150, mirror: true, scaleFrom: 1.1, scaleTo: 0.35 },
    headingFollow: 1,
  },
  // The hammer is hurled up from the bottom, a tight, steep curve.
  [WorldSlug.Projects]: {
    vehicle: WorldVehicle.Hammer,
    curve: { amplitude: 0.34, frequency: 1.6, tStart: -0.85, tEnd: 0.75, entryDeg: -95, mirror: false, scaleFrom: 1.15, scaleTo: 0.3 },
    headingFollow: 1,
  },
  // The book flutters in from the left on a long, lazy wave.
  [WorldSlug.Education]: {
    vehicle: WorldVehicle.Book,
    curve: { amplitude: 0.3, frequency: 0.75, tStart: -1.7, tEnd: 1.0, entryDeg: 15, mirror: true, scaleFrom: 1.2, scaleTo: 0.35 },
    headingFollow: 1,
  },
};

export function isWorldSlug(slug: string): slug is WorldSlug {
  return (Object.values(WorldSlug) as string[]).includes(slug);
}

/** Margin kept from the ±π/2 asymptotes, so tan stays a swoosh and never a spike. */
const ASYMPTOTE_MARGIN = 0.16;
/** How much of φ turns the whole curve (φ = 180° turns it by ±45°). */
const PHASE_TURN = 0.25;
/** The entry point sits just past the viewport edge, this far out (px), so the vehicle flies in from off screen. */
const ENTRY_MARGIN = 70;
/** Shortest flight (px), for a world sitting close to the edge it is entered from. */
const MIN_DISTANCE = 260;

/** Distance from `target` to the viewport edge, walking backwards along `heading`. */
function distanceToEdge(target: Target, heading: number, viewport: Viewport): number {
  const dx = -Math.cos(heading);
  const dy = -Math.sin(heading);
  const tx = dx > 1e-6 ? (viewport.width - target.x) / dx : dx < -1e-6 ? -target.x / dx : Infinity;
  const ty = dy > 1e-6 ? (viewport.height - target.y) / dy : dy < -1e-6 ? -target.y / dy : Infinity;
  return Math.max(0, Math.min(tx, ty));
}

export type FlightPoint = {
  /** Position in viewport px. */
  x: number;
  y: number;
  /** Heading in degrees, the path's tangent direction atan2(dy, dx). */
  angle: number;
  /** Progress along the curve, 0..1. */
  u: number;
};

export type Viewport = { width: number; height: number };
export type Target = { x: number; y: number };

/** Folds a value into [-limit, limit] by reflection (a triangle wave): continuous, never clamped flat. */
function reflectInto(value: number, limit: number): number {
  if (limit <= 0) return 0;
  const period = 4 * limit;
  const m = (((value + limit) % period) + period) % period;
  return m <= 2 * limit ? m - limit : 3 * limit - m;
}

/** φ wrapped to [-π, π). */
function wrapPi(phase: number): number {
  return phase - 2 * Math.PI * Math.floor((phase + Math.PI) / (2 * Math.PI));
}

/**
 * Samples a world's flight: `samples + 1` points from the entry point to the
 * target, with the tangent heading at each.
 *
 * Maths. Local curve: X(u) = u, Y(u) = ±A·tan(θ(u)) / T for u in [0, 1], with
 * θ(u) = k·t(u) + φ and t(u) = tStart + u·(tEnd − tStart); T = the largest
 * |tan| flown, so A alone sets the swing. tan has period π, so φ only matters
 * mod π for the shape: it slides the flown window along the branch (a window
 * that would cross an asymptote is folded back by reflection, keeping a margin
 * from ±π/2). On top of that, φ turns the whole curve by PHASE_TURN·φ (φ in
 * [-π, π)), changing the side the vehicle comes from. Both make a visible
 * difference: AR (32°) and US (120°) fly different swooshes into the same world.
 *
 * The local chord (X, Y)(0) → (X, Y)(1) is then mapped by a similarity
 * (rotation + uniform scale) onto the screen line from the entry point to the
 * target. Heading: dY/dX = A·k·(tEnd − tStart)·sec²(θ) / T in local space,
 * rotated by the same similarity, i.e. angle = atan(dy/dx) on screen.
 */
export function flightPath(curve: FlightCurve, phaseRad: number, target: Target, viewport: Viewport, samples: number): FlightPoint[] {
  const span = curve.frequency * (curve.tEnd - curve.tStart);
  const halfRoom = Math.PI / 2 - ASYMPTOTE_MARGIN - span / 2;
  const centre = reflectInto(curve.frequency * ((curve.tStart + curve.tEnd) / 2) + phaseRad, halfRoom);
  const thetaStart = centre - span / 2;
  const sign = curve.mirror ? -1 : 1;
  const norm = Math.max(Math.abs(Math.tan(thetaStart)), Math.abs(Math.tan(thetaStart + span)), 1e-3);
  const localY = (u: number) => (sign * curve.amplitude * Math.tan(thetaStart + u * span)) / norm;
  const localSlope = (u: number) => (sign * curve.amplitude * span) / (norm * Math.cos(thetaStart + u * span) ** 2);

  // Screen line from the entry point to the target, turned by the phase.
  const heading = (curve.entryDeg * Math.PI) / 180 + PHASE_TURN * wrapPi(phaseRad);
  const distance = Math.max(MIN_DISTANCE, distanceToEdge(target, heading, viewport) + ENTRY_MARGIN);
  const startX = target.x - Math.cos(heading) * distance;
  const startY = target.y - Math.sin(heading) * distance;

  // Similarity taking the local chord onto that line.
  const chordY = localY(1) - localY(0);
  const chordLength = Math.hypot(1, chordY);
  const scale = distance / chordLength;
  const rotation = heading - Math.atan2(chordY, 1);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const y0 = localY(0);

  const points: FlightPoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const lx = u;
    const ly = localY(u) - y0;
    const slope = localSlope(u);
    points.push({
      x: startX + scale * (lx * cos - ly * sin),
      y: startY + scale * (lx * sin + ly * cos),
      angle: ((Math.atan(slope) + rotation) * 180) / Math.PI,
      u,
    });
  }
  return points;
}

/** Short fingerprint of a path (start, middle, end), exposed for the browser checks. */
export function pathSignature(points: readonly FlightPoint[]): string {
  const pick = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]];
  return pick.map((p) => `${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.angle)}`).join(" ");
}

// ─── Country phase ───────────────────────────────────────────────────────

const PHASE_ENDPOINT = "/api/geo-phase";
const PHASE_STORAGE_KEY = "world-flight-phase";

let phaseRad = 0;
let phaseRequested = false;

/** The visitor's country phase φ in radians (0 until loaded, or when unknown). */
export function flightPhase(): number {
  return phaseRad;
}

function setPhaseDegrees(degrees: number) {
  phaseRad = (degrees * Math.PI) / 180;
}

/**
 * Loads φ once per session: the edge route turns the visitor's country into
 * degrees (lib/geoPhase), cached in sessionStorage so later visits in the
 * session skip the request. Called at idle, never on the critical path.
 */
export async function loadFlightPhase(): Promise<void> {
  if (phaseRequested) return;
  phaseRequested = true;
  try {
    const cached = sessionStorage.getItem(PHASE_STORAGE_KEY);
    if (cached !== null && Number.isFinite(Number(cached))) {
      setPhaseDegrees(Number(cached));
      return;
    }
  } catch {
    // Storage blocked: just ask the endpoint.
  }
  try {
    const response = await fetch(PHASE_ENDPOINT);
    if (!response.ok) return;
    const body: unknown = await response.json();
    const degrees = typeof body === "object" && body !== null && "phaseDeg" in body ? Number(body.phaseDeg) : NaN;
    if (!Number.isFinite(degrees)) return;
    setPhaseDegrees(degrees);
    try {
      sessionStorage.setItem(PHASE_STORAGE_KEY, String(degrees));
    } catch {
      // Storage blocked: the phase still applies for this page.
    }
  } catch {
    // Offline or blocked: φ stays 0.
  }
}

// ─── Launch channel ──────────────────────────────────────────────────────

export type WorldEntryLaunch = { slug: WorldSlug; target: Target };

type LaunchListener = (launch: WorldEntryLaunch) => void;
let launchListener: LaunchListener | null = null;

/** The overlay registers here once its chunk is loaded. */
export function onWorldEntryLaunch(listener: LaunchListener): () => void {
  launchListener = listener;
  return () => {
    if (launchListener === listener) launchListener = null;
  };
}

/** Starts a flight if the overlay is ready; a no-op otherwise (navigation never waits for it). */
export function launchWorldEntry(launch: WorldEntryLaunch): void {
  launchListener?.(launch);
}
