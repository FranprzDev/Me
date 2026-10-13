"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SceneStatus, getSceneStatus, subscribeSceneStatus } from "@/lib/sceneStatus";

/** Rocket climb from the bottom edge to its parking spot near the top. */
const ASCENT_MS = 1300;
/** Burst + veil fade once the background is really ready. */
const BURST_MS = 900;
/** Graceful exit when the scene failed or is too slow. */
const EXIT_MS = 600;
/** Hard cap: never keep the loader around longer than this. */
const TIMEOUT_MS = 7000;

enum Phase {
  Launch = "launch",
  Hover = "hover",
  Burst = "burst",
  Exit = "exit",
  Done = "done",
}

// Shown once per page load: client-side hops between worlds already have their
// own warp transition.
let shownThisLoad = false;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Launch loader for the 3D background.
 *
 * A dark veil sits between the WebGPU canvas and the content while a small
 * rocket climbs from the bottom of the screen. When the scene reports its first
 * rendered frame, the rocket bursts and the veil fades, revealing the cosmos.
 * If the scene is slow the rocket hovers with a subtle loop; if it fails, or
 * the hard cap is hit, everything fades out and the static CSS background stays.
 *
 * It lives below the content layer (z-index 2 vs 10), ignores pointer events
 * and is aria-hidden, so text is readable and interactive from the first paint
 * and nothing shifts. With prefers-reduced-motion it is a plain fade.
 */
function RocketLoaderClient() {
  const [phase, setPhase] = useState<Phase>(() => (shownThisLoad ? Phase.Done : Phase.Launch));
  const [reduced] = useState(prefersReducedMotion);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drive the phases from the scene status, the ascent timer and the hard cap.
  useEffect(() => {
    if (phase === Phase.Done) return;
    shownThisLoad = true;
    const started = performance.now();
    let ascended = reduced; // reduced motion: no climb to wait for
    let settled = false;
    const timers: number[] = [];

    const finish = (next: Phase.Burst | Phase.Exit) => {
      if (settled) return;
      settled = true;
      setPhase(next);
      timers.push(window.setTimeout(() => setPhase(Phase.Done), next === Phase.Burst ? BURST_MS : EXIT_MS));
    };

    const evaluate = () => {
      const status = getSceneStatus();
      if (status === SceneStatus.Failed) return finish(Phase.Exit);
      if (status === SceneStatus.Ready && ascended) return finish(reduced ? Phase.Exit : Phase.Burst);
    };

    if (!reduced) {
      timers.push(
        window.setTimeout(() => {
          ascended = true;
          if (!settled) setPhase(Phase.Hover);
          evaluate();
        }, ASCENT_MS)
      );
    }
    timers.push(window.setTimeout(() => finish(Phase.Exit), Math.max(0, TIMEOUT_MS - (performance.now() - started))));

    const unsubscribe = subscribeSceneStatus(evaluate);
    evaluate();
    return () => {
      unsubscribe();
      timers.forEach((t) => window.clearTimeout(t));
    };
    // Runs once for the lifetime of the loader; phase changes are internal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Particle burst: a short canvas effect, only during the burst phase.
  useEffect(() => {
    if (phase !== Phase.Burst) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const cx = W / 2;
    const cy = H * 0.16 + 36; // rocket nose parking spot (matches CSS)
    const count = W < 768 ? 46 : 90;
    const sparks = Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      return {
        a,
        v: 2.2 + Math.random() * 5.5,
        size: 0.8 + Math.random() * 1.8,
        warm: Math.random() < 0.45,
      };
    });
    const reach = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / BURST_MS);
      ctx.clearRect(0, 0, W, H);

      // Flash core.
      const coreR = t < 0.18 ? 10 + t * 380 : Math.max(0, 78 * (1 - (t - 0.18) / 0.5));
      if (coreR > 1) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.35, "rgba(255,214,150,0.6)");
        g.addColorStop(1, "rgba(91,140,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shock ring that sweeps the screen: the visual "reveal".
      const ringT = Math.min(1, t / 0.8);
      ctx.strokeStyle = `rgba(233, 194, 112, ${(1 - ringT) * 0.75})`;
      ctx.lineWidth = 3 * (1 - ringT) + 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ringT * reach, 0, Math.PI * 2);
      ctx.stroke();

      // Sparks.
      const travel = 1 - Math.pow(1 - t, 3);
      for (const s of sparks) {
        const r = travel * s.v * 70;
        const alpha = Math.max(0, 1 - t * 1.15);
        if (alpha <= 0) continue;
        ctx.fillStyle = s.warm ? `rgba(255, 196, 120, ${alpha})` : `rgba(210, 225, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(s.a) * r, cy + Math.sin(s.a) * r, s.size * (1 - t * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  if (phase === Phase.Done) return null;

  return (
    <div
      className={`rocket-loader is-${phase} ${reduced ? "is-reduced" : ""}`}
      aria-hidden="true"
      data-rocket-loader=""
    >
      <div className="rocket-loader__veil" />
      {!reduced && (
        <div className="rocket-loader__flight">
          <div className="rocket-loader__trail" />
          <svg className="rocket-loader__rocket" viewBox="0 0 40 84" width="40" height="84">
            <defs>
              <linearGradient id="rl-body" x1="0" x2="1">
                <stop offset="0" stopColor="#c9d6ff" />
                <stop offset="0.5" stopColor="#ffffff" />
                <stop offset="1" stopColor="#9fb2e8" />
              </linearGradient>
              <radialGradient id="rl-flame" cx="50%" cy="10%" r="90%">
                <stop offset="0" stopColor="#fff6d8" />
                <stop offset="0.45" stopColor="#ffbf5c" />
                <stop offset="1" stopColor="#ff6b2c" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path className="rocket-loader__flame" d="M13 58 Q20 92 27 58 Z" fill="url(#rl-flame)" />
            <path d="M8 46 L2 60 L12 56 Z" fill="#5b8cff" />
            <path d="M32 46 L38 60 L28 56 Z" fill="#5b8cff" />
            <path d="M20 2 C30 12 32 30 30 56 L10 56 C8 30 10 12 20 2 Z" fill="url(#rl-body)" />
            <circle cx="20" cy="26" r="5" fill="#0b1638" stroke="#5b8cff" strokeWidth="1.6" />
            <path d="M12 56 L28 56 L26 60 L14 60 Z" fill="#7d8fc4" />
          </svg>
        </div>
      )}
      <canvas ref={canvasRef} className="rocket-loader__burst" />
    </div>
  );
}

const noopSubscribe = () => () => {};

/**
 * Client-only wrapper: the loader depends on matchMedia and on the per-load
 * flag, so it renders nothing on the server and mounts right after hydration.
 * Until then the scene root's own dark CSS background is what shows, which is
 * visually identical to the veil.
 */
export function RocketLoader() {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return isClient ? <RocketLoaderClient /> : null;
}
