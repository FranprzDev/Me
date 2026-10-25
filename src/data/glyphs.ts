/**
 * Fuente de TRAZOS para escribir palabras con estrellas. Cada letra es una lista
 * de "trazos" (polilíneas) en una celda x∈[0,1], y∈[0,2] (0 = abajo). La usan
 * tanto la constelación 3D "CHARLEMOS" (data/constellations.ts) como los enlaces
 * de contacto en SVG (components/ContactConstellations.tsx), por eso vive aparte.
 */
export type Stroke = [number, number][];

export const GLYPHS: Record<string, Stroke[]> = {
  A: [[[0, 0], [0.5, 2], [1, 0]], [[0.22, 0.85], [0.78, 0.85]]],
  C: [[[0.9, 1.7], [0.25, 1.85], [0, 1.0], [0.25, 0.15], [0.9, 0.3]]],
  D: [[[0, 0], [0, 2], [0.7, 2], [1, 1.4], [1, 0.6], [0.7, 0], [0, 0]]],
  E: [[[1, 2], [0, 2], [0, 0], [1, 0]], [[0, 1], [0.8, 1]]],
  H: [[[0, 2], [0, 0]], [[1, 2], [1, 0]], [[0, 1], [1, 1]]],
  I: [[[0.2, 2], [0.8, 2]], [[0.5, 2], [0.5, 0]], [[0.2, 0], [0.8, 0]]],
  K: [[[0, 2], [0, 0]], [[1, 2], [0, 1], [1, 0]]],
  L: [[[0, 2], [0, 0], [0.9, 0]]],
  M: [[[0, 0], [0, 2], [0.5, 0.9], [1, 2], [1, 0]]],
  N: [[[0, 0], [0, 2], [1, 0], [1, 2]]],
  O: [[[0.5, 2], [0.95, 1.4], [0.95, 0.6], [0.5, 0], [0.05, 0.6], [0.05, 1.4], [0.5, 2]]],
  P: [[[0, 0], [0, 2], [0.8, 2], [1, 1.6], [0.8, 1.1], [0, 1.1]]],
  R: [[[0, 0], [0, 2], [0.85, 2], [1, 1.55], [0.8, 1.1], [0, 1.1]], [[0.45, 1.1], [1, 0]]],
  S: [[[0.95, 1.75], [0.5, 2], [0.1, 1.65], [0.45, 1.05], [0.85, 0.7], [0.5, 0.05], [0.05, 0.3]]],
  T: [[[0, 2], [1, 2]], [[0.5, 2], [0.5, 0]]],
  W: [[[0, 2], [0.25, 0], [0.5, 1.2], [0.75, 0], [1, 2]]],
};

/**
 * Encadena las letras de `word` en línea, centra el resultado en el origen y
 * devuelve nodos (estrellas, y∈[-1,1]) + aristas (líneas) listos para dibujar.
 */
export function buildWord(
  word: string,
  opts: { letterWidth?: number; gap?: number } = {}
): { nodes: [number, number][]; edges: [number, number][] } {
  const lw = opts.letterWidth ?? 1;
  const gap = opts.gap ?? 0.45;
  const pitch = lw + gap;
  const totalW = word.length * pitch - gap;
  const x0 = -totalW / 2;
  const nodes: [number, number][] = [];
  const edges: [number, number][] = [];
  for (let i = 0; i < word.length; i++) {
    const glyph = GLYPHS[word[i].toUpperCase()];
    if (!glyph) continue;
    const ox = x0 + i * pitch;
    for (const stroke of glyph) {
      let prev = -1;
      for (const [px, py] of stroke) {
        const idx = nodes.length;
        nodes.push([ox + px * lw, py - 1]); // centra vertical: y∈[0,2] -> [-1,1]
        if (prev >= 0) edges.push([prev, idx]);
        prev = idx;
      }
    }
  }
  return { nodes, edges };
}
