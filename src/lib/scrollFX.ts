"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

/** Easing compartido: entradas rápidas con cola larga, nunca rebotones. */
export const EASE = "power3.out";
export const EASE_SOFT = "power2.out";

type Scene = (root: HTMLElement) => void;

/**
 * Contexto de animación por página de planeta. Encapsula el ciclo de vida de
 * GSAP: registra los triggers dentro del nodo, los revierte al desmontar y
 * respeta `prefers-reduced-motion` (en cuyo caso no se anima nada y el
 * contenido queda estático pero visible).
 */
export function useScrollScene(build: Scene) {
  const ref = useRef<HTMLElement | null>(null);
  const buildRef = useRef(build);

  // Se asigna en un efecto (no durante render) para mantener la escena
  // actualizada sin reconstruir los triggers en cada render del consumidor.
  useLayoutEffect(() => {
    buildRef.current = build;
  });

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => buildRef.current(root), root);

    // El contenido bilingüe puede cambiar de alto tras montar; recalculamos.
    const refresh = () => ScrollTrigger.refresh();
    const id = window.setTimeout(refresh, 120);

    return () => {
      window.clearTimeout(id);
      ctx.revert();
    };
  }, []);

  return ref;
}

/**
 * Revela hijos escalonadamente cuando el bloque entra en pantalla.
 * Usa `once` porque el objetivo es la llegada, no un loop.
 */
export function revealStagger(
  targets: gsap.TweenTarget,
  options: {
    trigger: Element;
    y?: number;
    x?: number;
    scale?: number;
    duration?: number;
    stagger?: number;
    start?: string;
    delay?: number;
    ease?: string;
  }
) {
  const {
    trigger,
    y = 26,
    x = 0,
    scale = 1,
    duration = 0.75,
    stagger = 0.07,
    start = "top 82%",
    delay = 0,
    ease = EASE,
  } = options;
  const elements = gsap.utils.toArray<Element>(targets as string);
  if (!elements.length) return;
  gsap.fromTo(
    elements,
    { opacity: 0, y, x, scale },
    {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration,
      stagger,
      delay,
      ease,
      scrollTrigger: { trigger, start, once: true },
    }
  );
}

/**
 * Anima un texto numérico desde 0 hasta su valor final al entrar en pantalla.
 * Respeta el separador de miles del locale activo para que "1.000" noienta.
 */
export function countUp(
  element: Element | null,
  to: number,
  options: {
    trigger: Element;
    duration?: number;
    start?: string;
    suffix?: string;
    pad?: number;
    format?: (value: number) => string;
  }
) {
  if (!element) return;
  const {
    trigger,
    duration = 1.2,
    start = "top 88%",
    suffix = "",
    pad = 0,
    format,
  } = options;
  const state = { value: 0 };
  const render = () => {
    if (format) {
      element.textContent = format(state.value);
      return;
    }
    const text = Math.round(state.value).toLocaleString("es-AR");
    element.textContent = (pad ? text.padStart(pad, "0") : text) + suffix;
  };
  gsap.to(state, {
    value: to,
    duration,
    ease: EASE_SOFT,
    scrollTrigger: { trigger, start, once: true },
    onUpdate: render,
    onStart: () => {
      state.value = 0;
      render();
    },
  });
}

/**
 * Valor numérico ligado al scroll (scrub): interpola de `from` a `to` mientras
 * el lector atraviesa el bloque, en vez de disparar una vez al entrar.
 */
export function scrubNumber(
  element: Element | null,
  from: number,
  to: number,
  options: { trigger: Element; end?: string; format?: (v: number) => string }
) {
  if (!element) return;
  const { trigger, end = "bottom top", format } = options;
  const state = { value: from };
  const render = () => {
    if (format) element.textContent = format(state.value);
    else element.textContent = String(Math.round(state.value));
  };
  render();
  gsap.to(state, {
    value: to,
    ease: "none",
    scrollTrigger: { trigger, end, scrub: 0.5, invalidateOnRefresh: true },
    onUpdate: render,
  });
}

/**
 * Dibuja el trazo de un SVG mientras el elemento se atraviesa con el scroll
 * (scrub): el trazo "crece" al ritmo del lector en vez de por tiempo.
 */
export function drawOnScroll(
  selector: string,
  options: { trigger: Element; from?: string; to?: string; stagger?: number }
) {
  const { trigger, from = "top 85%", to = "bottom 60%", stagger = 0 } = options;
  const paths = gsap.utils.toArray<SVGGeometryElement>(selector);
  if (!paths.length) return;
  paths.forEach((path, i) => {
    const length = path.getTotalLength?.() ?? 0;
    if (!length) return;
    gsap.fromTo(
      path,
      { drawSVG: "0% 0%", opacity: 0.35 },
      {
        drawSVG: "0% 100%",
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger,
          start: from,
          end: to,
          scrub: 0.6,
        },
        delay: i * stagger,
      }
    );
  });
}

/**
 * Revela un trazo dibujándolo una sola vez al entrar (sin scrub): útil para
 * elementos decorativos que deben estar completos apenas se ven.
 */
export function drawOnEnter(selector: string, options: { trigger: Element; duration?: number; stagger?: number; start?: string }) {
  const { trigger, duration = 1.1, stagger = 0.12, start = "top 80%" } = options;
  const paths = gsap.utils.toArray<SVGGeometryElement>(selector);
  if (!paths.length) return;
  gsap.fromTo(
    paths,
    { drawSVG: "0% 0%" },
    {
      drawSVG: "0% 100%",
      duration,
      stagger,
      ease: EASE,
      scrollTrigger: { trigger, start, once: true },
    }
  );
}