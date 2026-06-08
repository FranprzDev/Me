"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Etapas del viaje, mapeadas al progreso de scroll [0..1].
 * Alineadas con las 7 secciones full-height:
 *   espacio  -> Hero, About
 *   japón    -> Experiencia, Educación, MCP
 *   brainrot -> Proyectos, Contacto
 * Estos rangos definen la ETIQUETA de etapa (Nav). Las transiciones visuales
 * (cross-fade) viven en TRANSITIONS y son la ÚNICA fuente para los pesos.
 */
export const STAGES = {
  space: [0.0, 0.24] as const,
  japan: [0.24, 0.66] as const,
  brainrot: [0.66, 1.0] as const,
};

/** Ventanas de cross-fade entre mundos (fuente única para pesos y color). */
export const TRANSITIONS = {
  spaceJapan: [0.16, 0.3] as const,
  japanBrain: [0.6, 0.74] as const,
};

export type StageName = keyof typeof STAGES;

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export interface StageWeights {
  space: number;
  japan: number;
  brain: number;
}

/** Pesos [0..1] de cada mundo para un progreso dado (suman ~1 con cross-fade). */
export function stageWeights(p: number): StageWeights {
  const toJapan = smoothstep(TRANSITIONS.spaceJapan[0], TRANSITIONS.spaceJapan[1], p);
  const brain = smoothstep(TRANSITIONS.japanBrain[0], TRANSITIONS.japanBrain[1], p);
  return {
    space: 1 - toJapan,
    japan: toJapan * (1 - brain),
    brain,
  };
}

/** Singleton leído por el render loop 3D (evita re-renders en cada scroll). */
const state = { progress: 0 };

export function getScrollProgress(): number {
  return state.progress;
}

/** Devuelve la etapa activa para un progreso dado. */
export function stageForProgress(p: number): StageName {
  if (p < STAGES.space[1]) return "space";
  if (p < STAGES.japan[1]) return "japan";
  return "brainrot";
}

/** Normaliza el progreso dentro de una etapa a [0..1]. */
export function localProgress(p: number, stage: StageName): number {
  const [a, b] = STAGES[stage];
  return Math.min(1, Math.max(0, (p - a) / (b - a)));
}

const ProgressCtx = createContext<number>(0);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      state.progress = p;
      setProgress(p);
      raf.current = null;
    };
    const onScroll = () => {
      if (raf.current == null) raf.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <ProgressCtx.Provider value={progress}>{children}</ProgressCtx.Provider>;
}

/** Hook reactivo (para UI que necesita re-render con el progreso). */
export function useScrollProgress(): number {
  return useContext(ProgressCtx);
}
