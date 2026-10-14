"use client";

/* Idle warm-up for the persistent backdrop.

   The first time a scene is drawn, the WebGPU renderer turns every material into
   WGSL (node build) and creates a render pipeline for it. That work is what
   stalled the first visit to each world. The renderer caches both by material
   configuration, not by instance, but drops a cache entry as soon as the last
   material using it is disposed, which is what every scene does on unmount.

   So, during idle time after the first load, this module:
   - mounts each world off-screen (an R3F portal into a scene that is never
     rendered) just long enough to copy its materials;
   - keeps one lightweight copy of every material (and of the visible scene,
     home included) on a tiny stand-in geometry with the same vertex layout,
     compiled with `compileAsync` under the shared world lights;
   - never disposes those copies, so the shader and pipeline caches stay warm.

   A later visit builds fresh materials with the same configuration and finds
   both caches already filled: no shader build and no pipeline creation on the
   jump. */

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { WebGPURenderer } from "three/webgpu";
import { WORLDS, type WorldSpec } from "@/data/worlds";
import { SceneStatus, getSceneStatus, subscribeSceneStatus } from "@/lib/sceneStatus";
import type { BackdropView } from "./Backdrop";
import { WORLD_AMBIENT_LIGHT, WORLD_KEY_LIGHT, WorldBody } from "./PlanetScene";
import { saveDataEnabled } from "./shared";

/** Material configurations differ between the full and the constrained profile. */
enum RenderProfile {
  Full = "full",
  Constrained = "constrained",
}

/** Quiet time after a route change before any warm-up work resumes. */
const SETTLE_MS = 1200;
/** Longest wait for an idle slot before a warm-up step runs anyway. */
const IDLE_TIMEOUT_MS = 3000;
/** Fallback delay where requestIdleCallback is missing (Safari). */
const IDLE_FALLBACK_MS = 1200;

/** Compiled stand-in scenes, kept for the whole visit so the caches never drop. */
const retained = new Map<string, THREE.Scene>();

type Renderable = THREE.Mesh | THREE.Line | THREE.Points;

function isRenderable(object: THREE.Object3D): object is Renderable {
  return object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points;
}

/**
 * Three vertices with the same attributes (names, item sizes, normalisation,
 * array types) and index presence as `source`: the same pipeline, almost no
 * memory.
 */
function standInGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(source.attributes)) {
    if (!(attribute instanceof THREE.BufferAttribute)) return source.clone();
    geometry.setAttribute(
      name,
      new THREE.BufferAttribute(attribute.array.slice(0, attribute.itemSize * 3), attribute.itemSize, attribute.normalized)
    );
  }
  if (source.index) geometry.setIndex(new THREE.BufferAttribute(source.index.array.slice(0, 3).fill(0), 1));
  return geometry;
}

/** Identity fields that must stay unique per material; everything else is copied. */
const IDENTITY_KEYS = new Set(["uuid", "id", "name", "version"]);

/**
 * `clone()` does not carry every flag (node materials drop `fog`, for one), and
 * the renderer keys its caches on those flags: copy every plain value across so
 * the stand-in compiles to exactly the same shader as the original.
 */
function cloneOne(source: THREE.Material): THREE.Material {
  const copy = source.clone();
  const from = source as unknown as Record<string, unknown>;
  const to = copy as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(from)) {
    if (key.startsWith("_") || IDENTITY_KEYS.has(key)) continue;
    const plain = typeof value === "boolean" || typeof value === "number" || typeof value === "string";
    if (plain && to[key] !== value) to[key] = value;
  }
  return copy;
}

function cloneMaterial(material: THREE.Material | THREE.Material[]): THREE.Material | THREE.Material[] {
  return Array.isArray(material) ? material.map(cloneOne) : cloneOne(material);
}

/** Holds the shared world lights while no world is on screen. */
const lightHolder = new THREE.Scene();

/** The scene that currently holds the shared world lights. */
function worldLightScene(): THREE.Scene {
  const parent = WORLD_KEY_LIGHT.parent;
  if (parent instanceof THREE.Scene && WORLD_AMBIENT_LIGHT.parent === parent) return parent;
  lightHolder.add(WORLD_AMBIENT_LIGHT, WORLD_KEY_LIGHT);
  return lightHolder;
}

/**
 * Copies the fog and every material of `source` into a stand-in scene, then
 * compiles it lit by the lights of `lights` (lit materials are compiled per
 * light instance, so they must be the very lights the live scene uses) and
 * keeps it under `key`.
 */
async function retainScene(
  renderer: WebGPURenderer,
  camera: THREE.Camera,
  source: THREE.Scene,
  lights: THREE.Scene,
  key: string
) {
  if (retained.has(key)) return;
  const standIn = new THREE.Scene();
  standIn.fog = source.fog ? source.fog.clone() : null;
  if (source.background instanceof THREE.Color) standIn.background = source.background.clone();
  source.traverse((object) => {
    if (!isRenderable(object)) return;
    const copy = object.clone(false);
    copy.geometry = standInGeometry(object.geometry);
    copy.material = cloneMaterial(object.material);
    // The stand-in is never drawn: culling would only skip compiling it.
    copy.frustumCulled = false;
    copy.visible = true;
    standIn.add(copy);
  });
  retained.set(key, standIn);
  await renderer.compileAsync(standIn, camera, lights);
}

function viewKey(view: BackdropView, profile: RenderProfile): string {
  return `${view.kind === "world" ? `world:${view.slug}` : view.kind}|${profile}`;
}

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback !== "function") {
      window.setTimeout(resolve, IDLE_FALLBACK_MS);
      return;
    }
    window.requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
  });
}

function pageLoaded(): Promise<void> {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
}

function sceneReady(): Promise<void> {
  if (getSceneStatus() === SceneStatus.Ready) return Promise.resolve();
  return new Promise((resolve) => {
    const stop = subscribeSceneStatus((status) => {
      if (status !== SceneStatus.Ready) return;
      stop();
      resolve();
    });
  });
}

/** Worlds in visiting order, starting after the one on screen (its neighbours first). */
function worldQueue(current: BackdropView): [string, WorldSpec][] {
  const entries = Object.entries(WORLDS);
  const at = current.kind === "world" ? entries.findIndex(([slug]) => slug === current.slug) : -1;
  return at < 0 ? entries : [...entries.slice(at + 1), ...entries.slice(0, at)];
}

type Warming = { slug: string; world: WorldSpec; scene: THREE.Scene; key: string; done: () => void };

/** One world mounted off-screen until its materials have been copied and compiled. */
function WarmWorld({ warming, performanceMode, reduced }: { warming: Warming; performanceMode: boolean; reduced: boolean }) {
  const renderer = useThree((state) => state.gl) as unknown as WebGPURenderer;
  const camera = useThree((state) => state.camera);
  const progress: RefObject<number> = useRef(0);
  const velocity: RefObject<number> = useRef(0);

  useEffect(() => {
    const { scene, key, done } = warming;
    const run = async () => {
      // One frame so R3F has attached every object to the portal scene.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      try {
        await retainScene(renderer, camera, scene, worldLightScene(), key);
      } catch {
        // A failed warm-up only means this world compiles on its first visit.
        retained.delete(key);
      } finally {
        done();
      }
    };
    void run();
  }, [warming, renderer, camera]);

  return (
    <WorldBody
      world={warming.world}
      progress={progress}
      velocity={velocity}
      reduced={reduced}
      performanceMode={performanceMode}
    />
  );
}

/**
 * Lives inside the backdrop canvas. After the page has loaded, the first frame
 * is on screen and the browser is idle, it keeps the scene on screen and then
 * every other world compiled, one step per idle slot, pausing while a jump is
 * settling. Skipped when the visitor asked to save data.
 */
export function SceneWarmup({ view, performanceMode, reduced }: { view: BackdropView; performanceMode: boolean; reduced: boolean }) {
  const renderer = useThree((state) => state.gl) as unknown as WebGPURenderer;
  const camera = useThree((state) => state.camera);
  const mainScene = useThree((state) => state.scene);
  const [warming, setWarming] = useState<Warming | null>(null);
  const busy = useRef<Promise<void> | null>(null);
  const profile = performanceMode ? RenderProfile.Constrained : RenderProfile.Full;
  const currentKey = view.kind === "world" ? view.slug : view.kind;

  useEffect(() => {
    if (saveDataEnabled()) return;
    let alive = true;

    const warmWorld = (slug: string, world: WorldSpec, key: string) => {
      // Same fog type as the live world, so the compiled shaders match.
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(new THREE.Color(world.fog.color).getHex(), world.fog.density);
      scene.background = new THREE.Color(world.bg[0]);
      const job = new Promise<void>((resolve) => {
        setWarming({ slug, world, scene, key, done: resolve });
      });
      busy.current = job;
      return job;
    };

    const run = async () => {
      await pageLoaded();
      await sceneReady();
      // A route change restarts this effect: let the jump settle first.
      await delay(SETTLE_MS);
      if (busy.current) await busy.current;
      if (!alive) return;

      if (view.kind !== "none") {
        await idle();
        if (!alive) return;
        const key = viewKey(view, profile);
        try {
          await retainScene(renderer, camera, mainScene, mainScene, key);
        } catch {
          retained.delete(key);
        }
      }

      for (const [slug, world] of worldQueue(view)) {
        const key = viewKey({ kind: "world", slug }, profile);
        if (retained.has(key)) continue;
        await idle();
        if (!alive) return;
        await warmWorld(slug, world, key);
        busy.current = null;
        setWarming(null);
      }
    };
    void run();
    return () => {
      alive = false;
    };
    // `view` is read through `currentKey`; a new object with the same route must not restart the warm-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, profile, renderer, camera, mainScene]);

  if (!warming) return null;
  return createPortal(
    <WarmWorld key={warming.slug} warming={warming} performanceMode={performanceMode} reduced={reduced} />,
    warming.scene
  );
}
