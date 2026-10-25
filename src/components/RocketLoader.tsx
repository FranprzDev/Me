"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SceneStatus, getSceneStatus, subscribeSceneStatus } from "@/lib/sceneStatus";
import { expireLaunchLoader, isLaunchLoaderPending } from "@/lib/launchLoader";

/** Flight along the tangent curve, lower-left to top-right. */
const ASCENT_MS = 1700;
/** Burst + iris reveal once the background is really ready. */
const BURST_MS = 1100;
/** Extra time before the safety timer closes a burst that did not finish drawing. */
const BURST_GRACE_MS = 2500;
/** Graceful exit when the scene failed or is too slow. */
const EXIT_MS = 600;
/** Hard cap: never keep the loader around longer than this. */
const TIMEOUT_MS = 7000;

/** The flight follows y = tan(x) for x in (-X_MAX, X_MAX), short of the ±π/2 asymptotes. */
const X_MAX = 1.35;
const TAN_MAX = Math.tan(X_MAX);

enum Phase {
  Launch = "launch",
  Hover = "hover",
  Burst = "burst",
  Exit = "exit",
  Done = "done",
}

type Point = { x: number; y: number; angle: number };

/**
 * Maps the curve parameter s in [0, 1] to the viewport: x sweeps across the
 * middle 80% of the width, tan(x) across the middle 84% of the height (screen
 * y grows downwards, hence the minus). The heading is the curve's tangent,
 * whose slope is the derivative sec²(x), scaled by the same mapping.
 */
function curvePoint(s: number, w: number, h: number): Point {
  const x = -X_MAX + s * 2 * X_MAX;
  const sx = (0.8 * w) / (2 * X_MAX);
  const sy = (0.42 * h) / TAN_MAX;
  const sec2 = 1 / Math.cos(x) ** 2;
  return {
    x: w * 0.1 + (x + X_MAX) * sx,
    y: h * 0.5 - Math.tan(x) * sy,
    angle: Math.atan2(-sy * sec2, sx),
  };
}

/** Gentle start, strong finish: the rocket gathers speed as the curve steepens. */
const easeFlight = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One-time launch loader for the 3D background (first load of the session only,
 * see lib/launchLoader).
 *
 * A dark veil sits between the WebGPU canvas and the content while a rocket
 * flies a y = tan(x) trajectory: it rises from the lower left, flattens through
 * the inflection point at the centre and shoots up to the top right, always
 * pointing along the curve, with an exhaust trail drawn along its path and warp
 * streaks around it. When the scene reports its first rendered frame the
 * rocket bursts, the screen shakes and the veil opens like an iris from the
 * burst point, revealing the planet. If the scene is slow the rocket hovers at
 * the top; if it fails, or the hard cap is hit, everything fades out and the
 * static CSS background stays.
 *
 * It lives below the content layer (z-index 2 vs 10), ignores pointer events
 * and is aria-hidden, so text is readable and interactive from the first paint.
 * With prefers-reduced-motion it is a plain fade.
 */
function RocketLoaderClient() {
  const [phase, setPhase] = useState<Phase>(() => (isLaunchLoaderPending() ? Phase.Launch : Phase.Done));
  const [reduced] = useState(prefersReducedMotion);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const bursting = phase === Phase.Burst;
  const done = phase === Phase.Done;

  // Drive the phases from the scene status, the flight timer and the hard cap.
  useEffect(() => {
    if (phase === Phase.Done) return;
    let ascended = reduced; // reduced motion: no flight to wait for
    let settled = false;
    const timers: number[] = [];

    const finish = (next: Phase.Burst | Phase.Exit) => {
      if (settled) return;
      settled = true;
      setPhase(next);
      // The burst is closed by its own last frame (see the canvas loop); this
      // timer is only the safety net, longer than the burst so that a main
      // thread busy with shader compilation cannot cut the explosion short.
      timers.push(
        window.setTimeout(() => {
          expireLaunchLoader();
          setPhase(Phase.Done);
        }, next === Phase.Burst ? BURST_MS + BURST_GRACE_MS : EXIT_MS)
      );
    };

    const evaluate = () => {
      const status = getSceneStatus();
      // The rocket always finishes its flight and bursts, whatever is behind
      // the veil (the 3D scene or the static CSS sky). Only reduced motion fades.
      if (status !== SceneStatus.Pending && ascended) return finish(reduced ? Phase.Exit : Phase.Burst);
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
    timers.push(window.setTimeout(() => finish(reduced ? Phase.Exit : Phase.Burst), TIMEOUT_MS));

    const unsubscribe = subscribeSceneStatus(evaluate);
    evaluate();
    return () => {
      unsubscribe();
      timers.forEach((t) => window.clearTimeout(t));
      // Unmounted mid-launch (e.g. navigated to /me): it still counts as shown.
      expireLaunchLoader();
    };
    // Runs once for the lifetime of the loader; phase changes are internal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One canvas loop for the whole show: flight, exhaust, warp streaks, burst.
  useEffect(() => {
    if (reduced || done) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const rocket = rocketRef.current;
    const root = rootRef.current;
    if (!canvas || !ctx || !rocket || !root) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const small = W < 768;
    // Nozzle sits ~40% of the rocket's height behind its centre.
    const nozzleOffset = rocket.offsetHeight * 0.42;
    const end = curvePoint(1, W, H);
    root.style.setProperty("--burst-x", `${end.x}px`);
    root.style.setProperty("--burst-y", `${end.y}px`);

    // Warp streaks: radial speed lines from the centre, faster as the rocket climbs.
    const streaks = Array.from({ length: small ? 26 : 54 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random(),
      v: 0.35 + Math.random() * 0.65,
    }));
    // Exhaust sparks shed from the nozzle, drifting back along the path.
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; warm: boolean };
    const sparks: Spark[] = [];
    const burstCount = small ? 50 : 110;
    const burstSparks = Array.from({ length: burstCount }, (_, i) => ({
      a: (i / burstCount) * Math.PI * 2 + Math.random() * 0.3,
      v: 2.4 + Math.random() * 6,
      size: 0.9 + Math.random() * 2,
      warm: Math.random() < 0.5,
    }));
    const reach = Math.hypot(Math.max(end.x, W - end.x), Math.max(end.y, H - end.y));
    const trailSteps = 90;

    const t0 = performance.now();
    let burstStart = 0;
    let last = t0;
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const current = phaseRef.current;
      ctx.clearRect(0, 0, W, H);

      const flightT = Math.min(1, (now - t0) / ASCENT_MS);
      const s = easeFlight(flightT);
      const speed = current === Phase.Launch ? 0.4 + 0.6 * flightT : 0.25;

      if (current === Phase.Launch || current === Phase.Hover) {
        // Rocket on the curve, rotated to the tangent (the SVG points up, so +90°).
        const bob = current === Phase.Hover ? Math.sin(now / 260) * 4 : 0;
        const p = curvePoint(s, W, H);
        rocket.style.transform = `translate(${p.x}px, ${p.y + bob}px) translate(-50%, -50%) rotate(${p.angle + Math.PI / 2}rad)`;
        rocket.style.opacity = "1";

        // Warp streaks.
        ctx.lineCap = "round";
        for (const st of streaks) {
          st.r += dt * st.v * speed * 1.4;
          if (st.r > 1) st.r -= 1;
          const r0 = st.r * reach * 0.9;
          const len = 18 + speed * 90 * st.v;
          ctx.strokeStyle = `rgba(200, 216, 255, ${0.08 + 0.32 * speed * st.r})`;
          ctx.lineWidth = 1 + st.v;
          ctx.beginPath();
          ctx.moveTo(W / 2 + Math.cos(st.a) * r0, H / 2 + Math.sin(st.a) * r0);
          ctx.lineTo(W / 2 + Math.cos(st.a) * (r0 + len), H / 2 + Math.sin(st.a) * (r0 + len));
          ctx.stroke();
        }

        // Exhaust trail along the travelled part of the curve: a wide soft glow
        // under a hot thin core, fading towards the launch point.
        ctx.globalCompositeOperation = "lighter";
        const steps = Math.max(2, Math.round(trailSteps * s));
        for (const [width, color] of [
          [small ? 14 : 22, "rgba(255, 140, 60, 0.10)"],
          [small ? 6 : 9, "rgba(255, 190, 110, 0.32)"],
          [2.2, "rgba(255, 244, 220, 0.85)"],
        ] as const) {
          ctx.lineWidth = width;
          for (let i = 1; i <= steps; i++) {
            const a = curvePoint((s * (i - 1)) / steps, W, H);
            const b = curvePoint((s * i) / steps, W, H);
            ctx.globalAlpha = Math.pow(i / steps, 1.6);
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;

        // Sparks from the nozzle (behind the rocket along its heading).
        const nozzle = {
          x: p.x - Math.cos(p.angle) * nozzleOffset,
          y: p.y + bob - Math.sin(p.angle) * nozzleOffset,
        };
        for (let i = 0; i < (small ? 2 : 4); i++) {
          const spread = (Math.random() - 0.5) * 0.9;
          const back = p.angle + Math.PI + spread;
          const v = 60 + Math.random() * 140;
          sparks.push({ x: nozzle.x, y: nozzle.y, vx: Math.cos(back) * v, vy: Math.sin(back) * v, life: 1, warm: Math.random() < 0.7 });
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.life -= dt * 1.8;
          if (sp.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          ctx.fillStyle = sp.warm ? `rgba(255, 186, 104, ${sp.life})` : `rgba(210, 225, 255, ${sp.life})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 1.6 * sp.life + 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // Engine glow at the nozzle.
        const glow = ctx.createRadialGradient(nozzle.x, nozzle.y, 0, nozzle.x, nozzle.y, small ? 46 : 70);
        glow.addColorStop(0, "rgba(255, 236, 200, 0.75)");
        glow.addColorStop(0.35, "rgba(255, 150, 70, 0.35)");
        glow.addColorStop(1, "rgba(255, 90, 40, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(nozzle.x, nozzle.y, small ? 46 : 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      } else if (current === Phase.Burst) {
        if (!burstStart) burstStart = now;
        rocket.style.opacity = "0";
        const t = Math.min(1, (now - burstStart) / BURST_MS);
        const cx = end.x;
        const cy = end.y;
        ctx.globalCompositeOperation = "lighter";

        // Flash core.
        const coreR = t < 0.15 ? 14 + t * 620 : Math.max(0, 108 * (1 - (t - 0.15) / 0.45));
        if (coreR > 1) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
          g.addColorStop(0, "rgba(255,255,255,0.95)");
          g.addColorStop(0.35, "rgba(255,214,150,0.65)");
          g.addColorStop(1, "rgba(91,140,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Two shock rings sweeping the screen: the visual hand-off to the planet.
        for (const [delay, color] of [
          [0, "233, 194, 112"],
          [0.12, "143, 179, 255"],
        ] as const) {
          const ringT = Math.min(1, Math.max(0, (t - delay) / 0.75));
          if (ringT <= 0 || ringT >= 1) continue;
          ctx.strokeStyle = `rgba(${color}, ${(1 - ringT) * 0.8})`;
          ctx.lineWidth = 4 * (1 - ringT) + 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, ringT * reach, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Burst sparks.
        const travel = 1 - Math.pow(1 - t, 3);
        const alpha = Math.max(0, 1 - t * 1.1);
        for (const sp of burstSparks) {
          if (alpha <= 0) break;
          const r = travel * sp.v * 80;
          ctx.fillStyle = sp.warm ? `rgba(255, 196, 120, ${alpha})` : `rgba(210, 225, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(sp.a) * r, cy + Math.sin(sp.a) * r, sp.size * (1 - t * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
        if (t >= 1) {
          expireLaunchLoader();
          setPhase(Phase.Done);
          return;
        }
      } else {
        rocket.style.opacity = "0";
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // Phase is read through phaseRef; the loop restarts only for the burst.
  }, [reduced, bursting, done]);

  if (phase === Phase.Done) return null;

  return (
    <div
      ref={rootRef}
      className={`rocket-loader is-${phase} ${reduced ? "is-reduced" : ""}`}
      aria-hidden="true"
      data-rocket-loader=""
    >
      <div className="rocket-loader__veil" />
      <canvas ref={canvasRef} className="rocket-loader__canvas" />
      {!reduced && (
        <div ref={rocketRef} className="rocket-loader__rocket">
          <svg viewBox="0 0 40 84" aria-hidden="true">
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
            <path className="rocket-loader__flame" d="M12 58 Q20 100 28 58 Z" fill="url(#rl-flame)" />
            <path d="M8 46 L2 60 L12 56 Z" fill="#5b8cff" />
            <path d="M32 46 L38 60 L28 56 Z" fill="#5b8cff" />
            <path d="M20 2 C30 12 32 30 30 56 L10 56 C8 30 10 12 20 2 Z" fill="url(#rl-body)" />
            <circle cx="20" cy="26" r="5" fill="#0b1638" stroke="#5b8cff" strokeWidth="1.6" />
            <path d="M12 56 L28 56 L26 60 L14 60 Z" fill="#7d8fc4" />
          </svg>
        </div>
      )}
    </div>
  );
}

const noopSubscribe = () => () => {};

/**
 * Client-only wrapper: the loader depends on matchMedia and on the session
 * gate, so it renders nothing on the server and mounts right after hydration.
 * Until then the scene root's own dark CSS background is what shows, which is
 * visually identical to the veil.
 */
export function RocketLoader() {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return isClient ? <RocketLoaderClient /> : null;
}
