/**
 * Carta estelar del portfolio. Un solo cosmos coherente: cada sección de la
 * página tiene una constelación que se "enciende" al entrar en su zona de
 * scroll. Los nodos son estrellas (coords locales ~[-1.6, 1.6]); las aristas
 * son las líneas que dibujan la figura. `world` ubica la constelación en la
 * escena 3D (la cámara viaja hacia -z a medida que se scrollea).
 *
 * El orden del array DEBE coincidir con el orden de las secciones en la página.
 */

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
    world: { x: 0, y: 1.9, z: -7.5, scale: 0.8 },
  },

  // About — "El Navegante": quién sos.
  {
    id: "navigator",
    sectionIndex: 1,
    color: "#7e9fd8",
    nodes: [
      [0, 1.1],
      [0.45, 0.4],
      [-0.45, 0.35],
      [0.25, -0.35],
      [-0.25, -0.45],
      [0, -1.1],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [4, 5],
    ],
    world: { x: -3.5, y: 1.1, z: -8.5, scale: 0.85 },
  },

  // Experiencia — "Trayectoria": el camino laboral, estrellas encadenadas.
  {
    id: "trajectory",
    sectionIndex: 2,
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
    world: { x: 3.6, y: -0.9, z: -9.5, scale: 0.9 },
  },

  // Educación (UTN) — "Academia": tus estudios de ingeniería, libro abierto.
  {
    id: "academy",
    sectionIndex: 3,
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
    world: { x: -3.7, y: -1.3, z: -10.5, scale: 0.9 },
  },

  // Proyectos — "La Forja": tus proyectos (NASA Space Apps, etc.).
  {
    id: "forge",
    sectionIndex: 4,
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
    world: { x: 3.3, y: 1.7, z: -11.5, scale: 0.9 },
  },

  // Contacto — "Baliza": la señal final que irradia.
  {
    id: "beacon",
    sectionIndex: 5,
    color: "#8aa6dc",
    nodes: [
      [0, 1.1],
      [-0.35, 0.2],
      [0.35, 0.2],
      [0, -0.25],
      [-0.65, -0.8],
      [0.65, -0.8],
    ],
    edges: [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 4],
      [3, 5],
    ],
    world: { x: 0, y: 2.0, z: -12.5, scale: 0.85 },
  },
];
