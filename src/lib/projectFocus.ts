/**
 * Planeta activo del slider de Proyectos + dirección de la transición.
 * Singleton leído por el render loop 3D (mismo patrón que lib/scroll):
 * evita re-renders de la escena en cada cambio de slide.
 */
const state = { index: 0, dir: 1 };

export function getActiveProject(): number {
  return state.index;
}

export function getSlideDirection(): number {
  return state.dir;
}

export function setActiveProject(i: number, dir: number): void {
  state.index = i;
  state.dir = dir;
}
