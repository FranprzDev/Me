/**
 * Tiny shared signal for the 3D background lifecycle.
 *
 * The scenes report "ready" once a real frame has been rendered (renderer
 * initialised, shaders compiled, first frame submitted) and "failed" when
 * WebGPU is unavailable or the renderer throws. The launch loader listens to
 * it instead of guessing with a fixed timer.
 */
export enum SceneStatus {
  Pending = "pending",
  Ready = "ready",
  Failed = "failed",
}

let status: SceneStatus = SceneStatus.Pending;
const listeners = new Set<(s: SceneStatus) => void>();

export function getSceneStatus(): SceneStatus {
  return status;
}

export function setSceneStatus(next: SceneStatus) {
  // Once a scene has painted, a later failure report (e.g. from a sibling
  // scene) must not undo the reveal.
  if (status === next || status === SceneStatus.Ready) return;
  status = next;
  listeners.forEach((fn) => fn(status));
}

export function subscribeSceneStatus(fn: (s: SceneStatus) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
