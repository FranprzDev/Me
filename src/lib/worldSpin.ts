/**
 * Trackball maths for the home selector's worlds: dragging a world rotates it
 * freely about any axis. Pure functions (no DOM), so the selector only turns
 * pointer deltas into a quaternion and paints the result as CSS variables.
 *
 * View space: x to the right, y up, z towards the viewer. A world's own axis
 * (its poles) is +y in world space; its orientation is the unit quaternion
 * taking world space to view space.
 */

export type Quat = { w: number; x: number; y: number; z: number };

/** What the CSS world layers can show of an orientation (see `surfaceOf`). */
export type SurfacePose = {
  /** Rotation of the surface about the view axis, in degrees (clockwise on screen). */
  rollDeg: number;
  /** Vertical shift of the surface bands, as a fraction of the world's diameter. */
  tilt: number;
  /** Spin about the world's own axis, as a fraction of one texture tile, in [0, 1). */
  lon: number;
  /** Ring openness relative to the resting view (1 = as designed). */
  ringOpen: number;
};

export const IDENTITY: Quat = { w: 1, x: 0, y: 0, z: 0 };

/** One texture tile is half a turn, so the surface keeps up with the pointer. */
const TILE_RADIANS = Math.PI;
/** Largest band shift, so a pole never slides past the limb. */
const MAX_TILT = 0.24;
/** The ring's resting elevation (its designed ellipse is 0.42 / 1.8 ≈ sin 13.5°). */
const RING_REST = Math.asin(0.42 / 1.8);
const RING_MIN = 0.12;

function normalize(q: Quat): Quat {
  const length = Math.hypot(q.w, q.x, q.y, q.z) || 1;
  return { w: q.w / length, x: q.x / length, y: q.y / length, z: q.z / length };
}

/** Hamilton product: `a` applied after `b`. */
export function multiply(a: Quat, b: Quat): Quat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

/**
 * Rotation for a pointer move of (dx, dy) screen px over a world of `radius`
 * px: the surface under the pointer follows it, like rolling a ball. Moving
 * right turns about +y, moving down (screen y grows) about +x, and the angle is
 * the arc length over the radius.
 */
export function dragRotation(dx: number, dy: number, radius: number): Quat {
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || radius <= 0) return IDENTITY;
  const angle = distance / radius;
  const s = Math.sin(angle / 2) / distance;
  return { w: Math.cos(angle / 2), x: dy * s, y: dx * s, z: 0 };
}

/** Applies a screen-space drag to an orientation. */
export function rotateBy(q: Quat, dx: number, dy: number, radius: number): Quat {
  return normalize(multiply(dragRotation(dx, dy, radius), q));
}

/** Rotates a vector by a unit quaternion. */
function apply(q: Quat, v: [number, number, number]): [number, number, number] {
  const [vx, vy, vz] = v;
  // t = 2 · (q.xyz × v); v' = v + w·t + q.xyz × t
  const tx = 2 * (q.y * vz - q.z * vy);
  const ty = 2 * (q.z * vx - q.x * vz);
  const tz = 2 * (q.x * vy - q.y * vx);
  return [
    vx + q.w * tx + (q.y * tz - q.z * ty),
    vy + q.w * ty + (q.z * tx - q.x * tz),
    vz + q.w * tz + (q.x * ty - q.y * tx),
  ];
}

/**
 * Projects an orientation onto what the layered CSS world can draw: the pole
 * direction gives the roll (its angle on screen) and the tilt (how far it
 * leans towards the viewer); the twist about the world's own axis gives the
 * longitude the texture strip scrolls to (swing-twist decomposition).
 */
export function surfaceOf(q: Quat): SurfacePose {
  const [px, py, pz] = apply(q, [0, 1, 0]);
  const rollDeg = (Math.atan2(px, py) * 180) / Math.PI;
  const elevation = Math.asin(Math.max(-1, Math.min(1, pz)));
  const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, Math.sin(elevation) * 0.5));
  const twist = 2 * Math.atan2(q.y, q.w);
  const turns = twist / TILE_RADIANS;
  const lon = turns - Math.floor(turns);
  const ringOpen = Math.max(RING_MIN, Math.abs(Math.sin(RING_REST + elevation))) / Math.sin(RING_REST);
  return { rollDeg, tilt, lon, ringOpen };
}
