"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { PROJECTS } from "@/data/projects";
import { CursorTrail } from "@/components/CursorTrail";
import { WarpTransition } from "@/components/WarpTransition";
import { RocketLoader } from "@/components/RocketLoader";
import { expireLaunchLoader } from "@/lib/launchLoader";
import { hasWebGPU } from "@/lib/webgpu";
import { SceneStatus, setSceneStatus } from "@/lib/sceneStatus";
import type { BackdropView } from "@/components/three/Backdrop";
import { cvLocaleForPath } from "@/content/cv/routes";

// The world-entry vehicles (SVG art + flight overlay) are their own chunk,
// fetched after hydration; a click before it lands just skips the flight.
const WorldEntryFlight = dynamic(() => import("@/components/WorldEntryFlight"), { ssr: false });

// One client-only chunk holds the whole 3D layer (home cosmos + every world),
// so after the first load no route change fetches or initialises it again.
const loadBackdrop = () => import("@/components/three/Backdrop");
const Backdrop = dynamic(loadBackdrop, { ssr: false });

function viewFor(pathname: string | null): BackdropView {
  if (pathname === "/") return { kind: "home" };
  // Each world has its own scene, only for real projects: a 404 or /me gets none.
  const slug = pathname?.replace(/^\/|\/$/g, "") ?? "";
  return PROJECTS.some((p) => p.slug === slug) ? { kind: "world", slug } : { kind: "none" };
}

/**
 * Warms every world route (and home) once the first page is idle, so a jump
 * from the selector, the world-to-world nav or the way back home never waits
 * on the network. The routes are static, so each prefetch is a small cached
 * payload; outer selector items are buttons, not links, and would otherwise
 * only be prefetched once centred.
 */
function usePrefetchWorlds() {
  const router = useRouter();
  useEffect(() => {
    const warm = () => {
      router.prefetch("/");
      for (const p of PROJECTS) router.prefetch(`/${p.slug}`);
    };
    // Safari has no requestIdleCallback: a plain delay keeps it off the first paint.
    if (typeof window.requestIdleCallback !== "function") {
      const timer = window.setTimeout(warm, 1200);
      return () => window.clearTimeout(timer);
    }
    const id = window.requestIdleCallback(warm, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }, [router]);
}

export function SiteChrome() {
  const pathname = usePathname();
  usePrefetchWorlds();
  const { tl } = useI18n();
  const [sceneReady, setSceneReady] = useState(false);
  const view = viewFor(pathname);
  const onSceneRoute = view.kind !== "none";
  // /me and the CV pages are standalone editorial pages with their own header.
  const standalone = (pathname?.startsWith("/me") ?? false) || cvLocaleForPath(pathname) !== null;
  // The backdrop is created the first time a scene route is shown (never for a
  // visit that stays on /me) and then kept for the rest of the visit.
  const [visitedScene, setVisitedScene] = useState(onSceneRoute);
  if (onSceneRoute && !visitedScene) setVisitedScene(true);

  // The launch loader belongs to the very first load only. When the visit
  // starts on a route without a scene, it is spent right away so it never
  // shows up later on a client-side navigation.
  useEffect(() => {
    if (!onSceneRoute) expireLaunchLoader();
    // Only the route the visit started on matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The 3D layer is the heaviest thing on the site (~420 KB gzipped): let the
  // text UI paint first, then on idle probe for a WebGPU adapter, and only
  // download and mount the chunk when one exists. Devices without WebGPU never
  // fetch or parse it and keep the CSS background. Once mounted it is never
  // unmounted, so navigating home <-> worlds reuses the same renderer.
  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    let idleId: number | undefined;
    const start = async () => {
      const supported = await hasWebGPU();
      if (!alive) return;
      if (!supported) {
        setSceneStatus(SceneStatus.Failed);
        return;
      }
      if (onSceneRoute) void loadBackdrop();
      timer = window.setTimeout(() => setSceneReady(true), 450);
    };
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => void start(), { timeout: 900 });
    } else {
      void start();
    }
    return () => {
      alive = false;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timer !== undefined) window.clearTimeout(timer);
    };
    // Scheduled once for the visit; later routes reuse the mounted backdrop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Mounted for every route (paused and hidden where there is no scene),
          so the WebGPU renderer survives a detour through /me or a 404. */}
      {sceneReady && visitedScene ? <Backdrop view={view} /> : null}
      {/* Standalone editorial pages (/me, /cv) bring their own header. */}
      {standalone ? null : (
        <>
          <a href="#main-content" className="skip-link">
            {tl({ es: "Saltar al contenido", en: "Skip to content" })}
          </a>
          {/* Launch loader: first load only, covers the canvas until its first real frame. */}
          {onSceneRoute ? <RocketLoader /> : null}
          <Nav />
          <CursorTrail />
          <WarpTransition />
          <WorldEntryFlight />
        </>
      )}
    </>
  );
}
