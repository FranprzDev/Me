"use client";

/* The persistent 3D background: ONE canvas and ONE WebGPU renderer for the
   whole visit. It lives in the layout (SiteChrome) and is never unmounted by a
   route change; only the scene contents inside it are swapped. */

import "@/lib/silenceR3FClockWarning";
import { Component, useEffect, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import { SceneStatus, setSceneStatus } from "@/lib/sceneStatus";
import { hasWebGPU } from "@/lib/webgpu";
import { worldFor } from "@/data/worlds";
import { FirstFrameSignal } from "./FirstFrameSignal";
import { OrbitClock, isConstrainedDevice, useReducedMotion } from "./shared";
import { CosmosContents } from "./Scene";
import { WorldContents } from "./PlanetScene";

/** Solid dark fallback: clear colour and CSS background, never a white flash. */
const FALLBACK_BG = "#050817";

/**
 * If WebGPU is missing or the renderer throws, the canvas is dropped and the
 * CSS background stays. Mounting it blindly would leave an empty box.
 */
class RendererFallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    setSceneStatus(SceneStatus.Failed);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Frame rate of the cheaper profile (phones, low-power, data saver). */
const CONSTRAINED_FPS = 30;

/**
 * Drives an on-demand canvas at a fixed rate. Scene motion is delta-based, so
 * halving the frame rate halves GPU work without slowing anything down; on a
 * phone that headroom goes to smooth scrolling instead of the background.
 */
function FrameCap({ fps }: { fps: number }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const step = 1000 / fps;
    let last = 0;
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < step - 1) return;
      last = now;
      invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);
  return null;
}

/** Scene shown by the backdrop: the home cosmos, a world, or nothing (paused). */
export type BackdropView = { kind: "home" } | { kind: "world"; slug: string } | { kind: "none" };

export default function Backdrop({ view }: { view: BackdropView }) {
  const reduced = useReducedMotion();
  const [performanceMode, setPerformanceMode] = useState(() => isConstrainedDevice(reduced));
  const [dpr, setDpr] = useState<[number, number]>(() => (isConstrainedDevice(reduced) ? [1, 1] : [1, 1.5]));
  const [hidden, setHidden] = useState(false);
  const [webgpuReady, setWebgpuReady] = useState(false);
  const active = view.kind !== "none";

  // Hidden tab: stop the render loop (no GPU work nobody sees).
  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Phones, data saver, few cores or reduced motion keep the 3D layer on a
  // cheaper profile (fewer particles, no antialias, dpr 1).
  useEffect(() => {
    const apply = () => {
      const constrained = isConstrainedDevice(reduced);
      setPerformanceMode(constrained);
      setDpr(constrained ? [1, 1] : [1, 1.5]);
    };
    apply();
    window.addEventListener("resize", apply, { passive: true });
    return () => window.removeEventListener("resize", apply);
  }, [reduced]);

  // The layout only mounts the backdrop after the shared probe found an
  // adapter; reading the same cached answer here keeps a single probe.
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const supported = await hasWebGPU();
      if (!supported) setSceneStatus(SceneStatus.Failed);
      if (alive) setWebgpuReady(supported);
    };
    void check();
    return () => {
      alive = false;
    };
  }, []);

  const world = view.kind === "world" ? worldFor(view.slug) : null;

  return (
    <div
      aria-hidden
      data-scene-root=""
      data-world={world?.kind}
      data-contact-heading={view.kind === "home" && !performanceMode}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        // Kept mounted but invisible on routes without a scene, so the renderer
        // and its compiled pipelines survive until the next scene route.
        visibility: active ? "visible" : "hidden",
        background: `var(--scene-bg, ${FALLBACK_BG})`,
      }}
    >
      {webgpuReady && (
        <RendererFallback>
          <Canvas
            camera={{ position: [0, 0.3, 6], fov: 60 }}
            dpr={dpr}
            frameloop={active && !hidden ? (performanceMode ? "demand" : "always") : "never"}
            resize={{ scroll: false, debounce: { scroll: 0, resize: 50 } }}
            // alpha:false -> opaque canvas, so there is never a white flash.
            gl={async (props) => {
              const renderer = new WebGPURenderer({
                ...props,
                antialias: !performanceMode,
                powerPreference: performanceMode ? "low-power" : "high-performance",
                alpha: false,
              } as ConstructorParameters<typeof WebGPURenderer>[0]);
              await renderer.init();
              return renderer;
            }}
            style={{ background: FALLBACK_BG }}
            onCreated={({ gl }) => {
              gl.setClearColor(FALLBACK_BG, 1);
            }}
          >
            {performanceMode && active && !hidden ? <FrameCap fps={CONSTRAINED_FPS} /> : null}
            <FirstFrameSignal />
            <OrbitClock reduced={reduced} />
            {view.kind === "home" && (
              <CosmosContents reduced={reduced} minimal={performanceMode} performanceMode={performanceMode} />
            )}
            {world && (
              <WorldContents key={view.kind === "world" ? view.slug : ""} world={world} reduced={reduced} performanceMode={performanceMode} />
            )}
          </Canvas>
        </RendererFallback>
      )}
    </div>
  );
}
