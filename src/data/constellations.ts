/**
 * Carta estelar del portfolio. Un solo cosmos coherente: cada sección de la
 * página tiene una constelación que se "enciende" al entrar en su zona de
 * scroll. Los nodos son estrellas (coords locales ~[-1.6, 1.6]); las aristas
 * son las líneas que dibujan la figura. `world` ubica la constelación en la
 * escena 3D (la cámara viaja hacia -z a medida que se scrollea).
 *
 * IMPORTANTE: todas viven en la PERIFERIA (|x|, |y| grandes) para no taparse
 * con el texto del centro; son decorado del cielo, no protagonistas. Las
 * marcadas `ambient` ni siquiera se atan a una sección: pueblan las esquinas
 * lejanas siempre encendidas a baja opacidad.
 *
 * Las primeras SECTION_COUNT entradas (no-ambient) DEBEN seguir el orden de las
 * secciones de la página.
 */

import { buildWord } from "@/data/glyphs";
import type { Lang } from "@/data/cv";

export interface Constellation {
  id: string;
  /** Índice de sección (0 = Hero). Define el centro de su zona de scroll. */
  sectionIndex: number;
  /** Color de las estrellas/líneas (familia espacial: azules, violetas, dorado). */
  color: string;
  /** Estrellas: pares [x, y] en espacio local. La primera suele ser la "alfa". */
  nodes: [number, number][];
  /** Aristas como pares de índices de `nodes`. */
  edges: [number, number][];
  /** Posición y escala en el mundo 3D. */
  world: { x: number; y: number; z: number; scale: number };
  /**
   * Decorativa: si es `true`, la constelación NO se ata al scroll de una sección;
   * permanece siempre ensamblada a muy baja opacidad, titilando suave en los
   * bordes lejanos. Son "relleno" ambiental, no protagonistas.
   */
  ambient?: boolean;
  /**
   * Override de partículas por nodo. Útil para constelaciones con MUCHOS nodos
   * (p.ej. la palabra "Charlemos"): bajarlo evita inflar el conteo de puntos.
   */
  particlesPerNode?: number;
  /**
   * Protagonista: se renderiza más brillante y opaca (no es decorado de fondo).
   * Reservado para el clímax del viaje: la palabra "CHARLEMOS" en Contacto.
   */
  hero?: boolean;
}

export const CONSTELLATIONS: Constellation[] = [
  // Hero — "Estrella Polar": el norte del viaje. Pocas estrellas, una domina.
  {
    id: "polaris",
    sectionIndex: 0,
    color: "#8fb0e6",
    nodes: [
      [0, 1.1],
      [-0.5, 0.2],
      [0.5, 0.2],
      [0, -0.5],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    world: { x: -5.4, y: 3.3, z: -9, scale: 0.7 },
  },

  // Experiencia — "Trayectoria": el camino laboral, estrellas encadenadas.
  {
    id: "trajectory",
    sectionIndex: 1,
    color: "#7d93d6",
    nodes: [
      [-1.5, -0.6],
      [-0.85, -0.05],
      [-0.2, 0.35],
      [0.35, 0.05],
      [0.85, 0.55],
      [1.35, 0.2],
      [1.65, 0.8],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
    world: { x: -6.0, y: -2.7, z: -10.5, scale: 0.85 },
  },

  // Educación (UTN) — "Academia": tus estudios de ingeniería, libro abierto.
  {
    id: "academy",
    sectionIndex: 2,
    color: "#9b93d6",
    nodes: [
      [-1.05, 0.45],
      [0, 0.65],
      [1.05, 0.45],
      [-1.05, -0.5],
      [0, -0.3],
      [1.05, -0.5],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [0, 3],
      [2, 5],
      [3, 4],
      [4, 5],
      [1, 4],
    ],
    world: { x: 6.0, y: -2.9, z: -11, scale: 0.85 },
  },

  // Proyectos — "La Forja": tus proyectos (NASA Space Apps, etc.).
  {
    id: "forge",
    sectionIndex: 3,
    color: "#8f86d0",
    nodes: [
      [-1.05, -0.2],
      [-0.5, 0.55],
      [0, -0.1],
      [0.5, 0.6],
      [1.05, -0.2],
      [0, -0.75],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [4, 5],
      [2, 5],
    ],
    world: { x: 5.6, y: 3.2, z: -11.5, scale: 0.85 },
  },

  // Contacto — "CHARLEMOS": el clímax del viaje. Tras encender las constelaciones
  // de cada sección, la última se ENSAMBLA como la palabra escrita en estrellas,
  // justo detrás del CTA. Es la única que va al centro a propósito: es el destino.
  {
    id: "charlemos",
    sectionIndex: 4,
    color: "#b9c4ff",
    hero: true, // protagonista: es el título de la sección, no fondo
    particlesPerNode: 4, // ~50 nodos: bajamos partículas para no inflar el conteo
    ...buildWord("CHARLEMOS", { gap: 0.32 }),
    world: { x: 0, y: 1.15, z: -8.4, scale: 0.66 },
  },

  // ───────────────────────────────────────────────────────────────────────
  // Constelaciones AMBIENTALES: puro decorado en los bordes lejanos. No se
  // atan a ninguna sección, viven siempre encendidas a baja opacidad. Pueblan
  // las esquinas del cielo para que el cosmos se sienta lleno sin robarle
  // protagonismo al texto del centro.
  // ───────────────────────────────────────────────────────────────────────

  // Esquina superior derecha — pequeña "cometa".
  {
    id: "amb-kite",
    sectionIndex: 0,
    ambient: true,
    color: "#6f8fd0",
    nodes: [
      [0, 0.9],
      [-0.5, 0.1],
      [0.5, 0.1],
      [0, -0.9],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ],
    world: { x: 7.2, y: 4.2, z: -15, scale: 0.7 },
  },

  // Esquina inferior izquierda — "arco" tenue.
  {
    id: "amb-arc",
    sectionIndex: 0,
    ambient: true,
    color: "#8a7fcf",
    nodes: [
      [-1.1, -0.3],
      [-0.4, 0.4],
      [0.4, 0.45],
      [1.1, -0.2],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    world: { x: -7.6, y: -4.4, z: -15.5, scale: 0.75 },
  },

  // Lateral derecho profundo — triángulo lejano.
  {
    id: "amb-tri",
    sectionIndex: 0,
    ambient: true,
    color: "#7790cf",
    nodes: [
      [0, 0.8],
      [-0.7, -0.5],
      [0.7, -0.5],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
    world: { x: 8.0, y: -3.6, z: -17, scale: 0.65 },
  },

  // Lateral izquierdo alto — par de estrellas encadenadas.
  {
    id: "amb-pair",
    sectionIndex: 0,
    ambient: true,
    color: "#9486d2",
    nodes: [
      [-0.6, 0.5],
      [0.2, 0],
      [0.7, -0.6],
    ],
    edges: [
      [0, 1],
      [1, 2],
    ],
    world: { x: -8.2, y: 3.6, z: -17.5, scale: 0.65 },
  },

  // Techo central-derecho profundo — pequeña cruz del sur.
  {
    id: "amb-cross",
    sectionIndex: 0,
    ambient: true,
    color: "#7e93cf",
    nodes: [
      [0, 0.9],
      [0, -0.9],
      [-0.7, 0],
      [0.7, 0],
    ],
    edges: [
      [0, 1],
      [2, 3],
    ],
    world: { x: 3.4, y: 5.0, z: -18, scale: 0.6 },
  },

  // Piso central-izquierdo profundo — zig-zag tenue.
  {
    id: "amb-zig",
    sectionIndex: 0,
    ambient: true,
    color: "#8d82d0",
    nodes: [
      [-1, -0.4],
      [-0.3, 0.4],
      [0.3, -0.4],
      [1, 0.4],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    world: { x: -3.2, y: -5.2, z: -18.5, scale: 0.6 },
  },
];

function makeContactConstellation(lang: Lang): Constellation {
  const word = lang === "es" ? "CHARLEMOS" : "LETS TALK";
  const layout =
    lang === "es"
      ? { y: 1.36, scale: 0.6, gap: 0.3 }
      : { y: 1.62, scale: 0.52, gap: 0.22 };
  return {
    id: "charlemos",
    sectionIndex: 4,
    color: "#b9c4ff",
    hero: true,
    particlesPerNode: 4,
    ...buildWord(word, { gap: layout.gap }),
    world: { x: 0, y: layout.y, z: -8.4, scale: layout.scale },
  };
}

export function getConstellations(lang: Lang): Constellation[] {
  const constellations = CONSTELLATIONS.slice();
  constellations[4] = makeContactConstellation(lang);
  return constellations;
}
