import type { Localized } from "./cv";

export interface PlanetSpec {
  /** Color base del cuerpo del planeta. */
  body: string;
  /** Color interior de la atmósfera fresnel. */
  atmoA: string;
  /** Color del borde (rim) de la atmósfera. */
  atmoB: string;
  /** Radio relativo del planeta. */
  radius: number;
  /** Anillo tenue (reservado para el proyecto destacado). */
  ring?: string;
}

export interface WorldEntry {
  slug: string;
  name: string;
  title?: Localized<string>;
  planet: PlanetSpec;
}

export const WORLDS: WorldEntry[] = [
  {
    slug: "hackathons",
    name: "Hackathones",
    title: { es: "Hackathones", en: "Hackathons" },
    planet: { body: "#2e5c38", atmoA: "#39ff14", atmoB: "#baffd0", radius: 1.15, ring: "#7ddc8f" },
  },
  {
    slug: "teaching",
    name: "Mentorías",
    title: { es: "Mentorías", en: "Teaching & Mentorship" },
    planet: { body: "#6b4a1d", atmoA: "#e9b949", atmoB: "#ffe6b0", radius: 0.95 },
  },
  {
    slug: "projects",
    name: "Proyectos Personales",
    title: { es: "Proyectos Personales", en: "Personal Projects" },
    planet: { body: "#1f4a66", atmoA: "#4fc3f7", atmoB: "#c5ecff", radius: 0.88 },
  },
  {
    slug: "education",
    name: "Educación",
    title: { es: "Educación & Formación", en: "Education & Degree" },
    planet: { body: "#3b2d6e", atmoA: "#8f7bff", atmoB: "#d4c9ff", radius: 1.02 },
  },
];

/**
 * Cada ruta de proyecto tiene SU PROPIA escena 3D. Este archivo es el registro
 * que decide, por slug, qué set piece se monta y con qué atmósfera. Es dato
 * puro (sin React) para poder ajustarlo sin tocar el render.
 */
export type WorldKind = "arena" | "classroom" | "atlas" | "expedition" | "dossier";

export interface WorldSpec {
  /** Qué objeto protagonista vive en el centro de la escena. */
  kind: WorldKind;
  /** Fondo del canvas: [inicio, final] del viaje de scroll. */
  bg: [string, string];
  /** Niebla: cuánto se desvanece el fondo y de qué color. */
  fog: { color: string; density: number };
  /** Luz clave que modela al objeto protagonista. */
  key: { color: string; intensity: number };
  /** Tinte de estrellas y estelas de warp: ata el cielo al planeta. */
  tint: string;
  /**
   * Radio de la membrana: la esfera cuya superficie se cruza al scrollear. Es el
   * mismo número para afuera (el planeta) y para adentro (el cuenco).
   */
  shell: number;
  /**
   * Encuadre de la cámara por distancia al centro del planeta, no por posición
   * absoluta: `dir` es la dirección de la aproximación, `from` la distancia
   * inicial (fuera del planeta) y `depth` cuán adentro se queda al final.
   */
  camera: { dir: [number, number, number]; from: number; depth: number; fov: number };
}

/** Paleta del planeta tomada de WORLDS, para que 3D y DOM sean el mismo mundo. */
function palette(slug: string) {
  const planet = WORLDS.find((w) => w.slug === slug)?.planet;
  return {
    atmoA: planet?.atmoA ?? "#8f7bff",
    atmoB: planet?.atmoB ?? "#d4c9ff",
  };
}

const hackathons = palette("hackathons");
const teaching = palette("teaching");
const projects = palette("projects");
const education = palette("education");

export const WORLD_SPECS: Record<string, WorldSpec> = {
  /* Consola de lanzamiento: se entra al planeta por arriba, como quien se asoma
     sobre una mesa de radar. Verde fosforescente. */
  "hackathons": {
    kind: "arena",
    bg: ["#04140b", "#010805"],
    fog: { color: "#061c10", density: 0.02 },
    key: { color: hackathons.atmoB, intensity: 1.1 },
    tint: hackathons.atmoA,
    shell: 11,
    camera: { dir: [0, 0.46, 0.89], from: 30, depth: 5.2, fov: 52 },
  },

  /* Aula: se entra de costado, a la altura del anillo, como sentarse en la
     primera fila. Ámbar cálido. */
  teaching: {
    kind: "classroom",
    bg: ["#150e06", "#0a0703"],
    fog: { color: "#1d1409", density: 0.022 },
    key: { color: teaching.atmoB, intensity: 1.2 },
    tint: teaching.atmoA,
    shell: 12,
    camera: { dir: [0.12, 0.28, 0.95], from: 32, depth: 5, fov: 55 },
  },

  /* Atlas: entrada frontal y simétrica: es el mundo más técnico de la galería,
     conviene llegar de frente. Cian de plano. */
  projects: {
    kind: "atlas",
    bg: ["#04141f", "#020a11"],
    fog: { color: "#06202c", density: 0.016 },
    key: { color: projects.atmoB, intensity: 1 },
    tint: projects.atmoA,
    shell: 11,
    camera: { dir: [0, 0.1, 0.99], from: 30, depth: 5, fov: 50 },
  },

  /* Bitácora orbital: se entra en diagonal, mirando el planeta de canto, que
     es como se lee una órbita. Violeta. */
  education: {
    kind: "expedition",
    bg: ["#0d0a1e", "#040310"],
    fog: { color: "#150f2e", density: 0.015 },
    key: { color: education.atmoB, intensity: 1.15 },
    tint: education.atmoA,
    shell: 12,
    camera: { dir: [0.16, 0.34, 0.93], from: 33, depth: 5.4, fov: 52 },
  },
};

/** Planeta sin escena propia: escena neutra para que nunca quede un fondo vacío. */
export const DOSSIER_WORLD: WorldSpec = {
  kind: "dossier",
  bg: ["#0a0a16", "#04040c"],
  fog: { color: "#101024", density: 0.018 },
  key: { color: "#cfc4ff", intensity: 0.9 },
  tint: "#cfc4ff",
  shell: 12,
  camera: { dir: [0, 0.22, 0.97], from: 30, depth: 5, fov: 55 },
};

export function worldFor(slug: string): WorldSpec {
  return WORLD_SPECS[slug] ?? DOSSIER_WORLD;
}
