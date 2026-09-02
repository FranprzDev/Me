"use client";

import { PROJECTS } from "@/data/projects";

/**
 * Fondo temático del planeta: ocupa el viewport detrás del contenido.
 * Cada mundo tiñe el espacio con sus propios colores (sin imágenes, puro CSS).
 */
export function PlanetBackground({ slug }: { slug: string }) {
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return null;

  // Andrómeda: dos nebulosas periféricas (núcleo + brazo) + viñeta,
  // dejando el centro —donde vive el texto— oscuro para legibilidad.
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        background: [
          `radial-gradient(ellipse 72% 58% at 82% 18%, ${p.planet.body}2A 0%, transparent 62%)`,
          `radial-gradient(ellipse 64% 48% at 14% 82%, ${p.planet.atmoA}1E 0%, transparent 60%)`,
          `radial-gradient(ellipse 90% 55% at 50% 100%, ${p.planet.atmoB}14 0%, transparent 55%)`,
        ].join(", "),
      }}
    />
  );
}
