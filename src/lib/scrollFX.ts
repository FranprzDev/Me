"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { isLiteMode } from "@/lib/lite";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
// Mobile browsers resize the viewport when the address bar shows or hides
// mid-scroll; refreshing every trigger then causes visible jumps.
ScrollTrigger.config({ ignoreMobileResize: true });

/** Scroll-linked trigger options for a scrubbed tween. */
export interface ScrollLinkOptions {
  trigger: Element;
  start?: string;
  end?: string;
  scrub: number;
}

/**
 * Scrubbed (scroll-linked) on desktop; on phones, touch-first or low-power
 * devices the same tween plays once when it enters, so a fling never drives
 * per-frame tween work and scrolling stays fully native.
 */
export function scrollLinked(options: ScrollLinkOptions): ScrollTrigger.Vars {
  if (!isLiteMode()) return { ...options };
  return { trigger: options.trigger, start: options.start ?? "top 85%", once: true };
}

/** Easing compartido: entradas rápidas con cola larga, nunca rebotones. */
export const EASE = "power3.out";
export const EASE_SOFT = "power2.out";

type Scene = (root: HTMLElement) => void;

/**
 * Builds a scene inside its own GSAP context. Scroll animations are
 * decoration: if GSAP throws while building them (seen on mobile when
 * ScrollTrigger refreshes during a client-side route change), what was
 * created is reverted so the content stays visible instead of the error
 * taking the whole page down.
 */
function buildContext(scene: Scene, root: HTMLElement): gsap.Context | null {
  let failed = false;
  const ctx = gsap.context(() => {
    try {
      scene(root);
    } catch (error) {
      failed = true;
      console.warn("Scroll animations skipped:", error);
    }
  }, root);
  if (!failed) return ctx;
  ctx.revert();
  return null;
}

/**
 * Contexto de animación por página de planeta. Encapsula el ciclo de vida de
 * GSAP: registra los triggers dentro del nodo, los revierte al desmontar y
 * respeta `prefers-reduced-motion` (en cuyo caso no se anima nada y el
 * contenido queda estático pero visible).
 *
 * Two phases, so a jump between worlds paints the new page right away:
 * - `intro` (optional) holds only what is in the first viewport and starts
 *   hidden (hero copy, hero art). It runs before the first paint, as before,
 *   so nothing flashes.
 * - `build` holds everything else. Wiring it is the heaviest main-thread work
 *   of a route change (every trigger measures layout and every tween reads
 *   computed styles), so it runs right after the first paint instead of
 *   inside the commit. Its targets are below the fold at that point.
 */
export function useScrollScene(build: Scene, intro?: Scene) {
  const ref = useRef<HTMLElement | null>(null);
  const buildRef = useRef(build);
  const introRef = useRef(intro);

  // Se asigna en un efecto (no durante render) para mantener la escena
  // actualizada sin reconstruir los triggers en cada render del consumidor.
  useLayoutEffect(() => {
    buildRef.current = build;
    introRef.current = intro;
  });

  useLayoutEffect(() => {
    const root = ref.current;
    const scene = introRef.current;
    if (!root || !scene) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = buildContext(scene, root);
    return () => {
      ctx?.revert();
    };
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let ctx: gsap.Context | null = null;
    let refreshTimer: number | undefined;
    const build = () => {
      ctx = buildContext(buildRef.current, root);
      if (!ctx) return;
      // El contenido bilingüe puede cambiar de alto tras montar; recalculamos.
      refreshTimer = window.setTimeout(() => {
        try {
          ScrollTrigger.refresh();
        } catch (error) {
          console.warn("ScrollTrigger refresh skipped:", error);
        }
      }, 120);
    };
    // requestAnimationFrame runs right before the next paint; the timeout
    // inside it lands right after that paint.
    let buildTimer: number | undefined;
    const raf = window.requestAnimationFrame(() => {
      buildTimer = window.setTimeout(build, 0);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(buildTimer);
      window.clearTimeout(refreshTimer);
      ctx?.revert();
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

/** Entrance of first-viewport content (seconds); revealStagger's default is 0.75. */
const INTRO_DURATION = 0.5;
/** Upper bound for the delay between intro items (seconds). */
const INTRO_STAGGER = 0.06;

/**
 * Intro reveal for content in the first viewport (hero copy, the education
 * orbit). On phones, touch-first and low-power devices it does nothing: the
 * server-rendered content stays visible, so the largest paint happens with the
 * first frame instead of waiting for JavaScript to fade it back in (LCP).
 * Desktop keeps the staggered entrance.
 */
export function revealIntro(targets: gsap.TweenTarget, options: Parameters<typeof revealStagger>[1]) {
  if (isLiteMode()) return;
  // Arrival content: a short entrance, so a jump between worlds reads as
  // instant while keeping the staggered build-up.
  revealStagger(targets, {
    ...options,
    duration: options.duration ?? INTRO_DURATION,
    stagger: Math.min(options.stagger ?? INTRO_STAGGER, INTRO_STAGGER),
  });
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
  const link = scrollLinked({ trigger, end, scrub: 0.5 });
  gsap.to(state, {
    value: to,
    duration: 1.2,
    ease: link.once ? EASE_SOFT : "none",
    scrollTrigger: link.once ? link : { ...link, invalidateOnRefresh: true },
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
        duration: 1,
        ease: "none",
        scrollTrigger: scrollLinked({ trigger, start: from, end: to, scrub: 0.6 }),
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