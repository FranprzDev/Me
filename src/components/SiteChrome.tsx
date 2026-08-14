"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Nav } from "@/components/Nav";

// La escena 3D es client-only (WebGL); se carga sin SSR. Vive en el layout para
// que el cosmos y la navegación sean consistentes en todas las rutas.
const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

export function SiteChrome() {
  const pathname = usePathname();
  const [sceneReady, setSceneReady] = useState(false);
  const sceneBooted = useRef(false);
  const onHome = pathname === "/";
  // La escena 3D es lo más costoso del sitio. La diferimos para dejar que la
  // UI textual pinte primero.
  useEffect(() => {
    if (!onHome || sceneBooted.current) return;

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
  }, [onHome]);

  return (
    <>
      {onHome && sceneReady ? <Scene /> : null}
      <Nav />
    </>
  );
}
