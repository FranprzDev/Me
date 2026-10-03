"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import { PROJECTS } from "@/data/projects";
import { CursorTrail } from "@/components/CursorTrail";
import { WarpTransition } from "@/components/WarpTransition";

// Las escenas 3D son client-only (WebGPU); se cargan sin SSR. El cosmos vive en
// el layout para que la navegación sea consistente en todas las rutas.
const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });
const PlanetScene = dynamic(() => import("@/components/three/PlanetScene"), { ssr: false });

export function SiteChrome() {
  const pathname = usePathname();
  const [sceneReady, setSceneReady] = useState(false);
  const sceneBooted = useRef(false);
  const onHome = pathname === "/";
  // Cada planeta tiene su propia escena, así que la ruta decide cuál se monta.
  // Sólo para proyectos reales: un 404 no merece un canvas.
  const slug = onHome ? null : pathname.replace(/^\/|\/$/g, "");
  const worldSlug = slug && PROJECTS.some((p) => p.slug === slug) ? slug : null;

  // La escena 3D es lo más costoso del sitio. La diferimos para dejar que la
  // UI textual pinte primero. Arranca una sola vez: navegar entre mundos después
  // no vuelve a esperar, sólo cambia la escena montada.
  useEffect(() => {
    if (sceneBooted.current) return;

    sceneBooted.current = true;
    let timer: number | undefined;
    let idleId: number | undefined;
    const start = () => {
      timer = window.setTimeout(() => setSceneReady(true), 450);
    };

    // Dejamos que la UI textual y el primer frame tengan prioridad. En
    // navegadores compatibles usamos idle callback para no competir con el
    // render inicial; el timeout garantiza que nunca quede esperando.
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(start, { timeout: 900 });
    } else {
      start();
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {sceneReady && onHome ? <Scene /> : null}
      {sceneReady && worldSlug ? <PlanetScene slug={worldSlug} /> : null}
      <Nav />
      <CursorTrail />
      <WarpTransition />
    </>
  );
}