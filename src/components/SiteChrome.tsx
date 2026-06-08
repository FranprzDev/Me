"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";

// La escena 3D es client-only (WebGL); se carga sin SSR. Vive en el layout para
// que el cosmos y la navegación sean consistentes en todas las rutas.
const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

export function SiteChrome() {
  const pathname = usePathname();
  // El MCP usa un cosmos minimal: sólo los puntos viajando, sin constelaciones.
  const minimal = pathname?.startsWith("/utn-frt-mcp") ?? false;
  return (
    <>
      <Scene minimal={minimal} />
      <Nav />
    </>
  );
}
