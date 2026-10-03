/* useFrame muta imperativamente buffers/materiales de three.js (es su propósito):
   la inmutabilidad del compilador de React no aplica a este archivo. La siembra
   aleatoria (Math.random) ocurre una sola vez dentro de useMemo para inicializar
   buffers: es intencional. */
/* eslint-disable react-hooks/immutability, react-hooks/purity */

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getScrollProgress } from "@/lib/scroll";

/** Suavizado exponencial independiente del framerate: `speed` mayor = más pegado. */
export function dampingFactor(dt: number, speed: number) {
  return 1 - Math.exp(-dt * speed);
}

/** Smoothstep acotado, usado para interpolaciones por progreso de scroll. */
export function smoother(x: number, e0: number, e1: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Perfil barato: móvil, ahorro de datos o pocos núcleos. El sitio conserva la
 * capa 3D pero con menos partículas, sin antialias y a dpr 1.
 */
export function isConstrainedDevice(reduced: boolean): boolean {
  if (typeof window === "undefined") return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean };
  }).connection;
  return (
    window.innerWidth < 768 ||
    reduced ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
    connection?.saveData === true
  );
}

/** Reacciona a cambios del media query de reduced-motion en caliente. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(m.matches);
    const cb = () => setReduced(m.matches);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  }, []);
  return reduced;
}

/**
 * Movimiento de scroll normalizado para cualquier ruta: `progress` (0..1, ya
 * suavizado para que la rueda en saltos no dé tirones) y `velocity` (cuán rápido
 * se está bajando). Es lo que permite que una escena reaccione al gesto y no
 * sólo a la posición.
 */
export function useRouteMotion() {
  const progress = useRef(0);
  const velocity = useRef(0);
  const lastRaw = useRef(0);

  useFrame((_, dt) => {
    const raw = getScrollProgress();
    const inst = Math.abs(raw - lastRaw.current) / Math.max(dt, 0.0001);
    lastRaw.current = raw;
    velocity.current += (inst - velocity.current) * dampingFactor(dt, 6);
    progress.current += (raw - progress.current) * dampingFactor(dt, 5);
  });

  return { progress, velocity };
}

/**
 * WARP: campo de estrellas que vuela hacia la cámara. El largo de las estelas
 * y la velocidad crecen con la velocidad de scroll, así "mirar puntos" se
 * convierte en "viajar por el espacio". Reutilizado por el cosmos y por cada
 * escena de planeta, tintado con el color del mundo.
 */
export function WarpField({
  velocity,
  reduced,
  performanceMode,
  color = "#cfe0ff",
  spread = { x: 16, y: 10, depth: 50 },
}: {
  velocity: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
  color?: string;
  spread?: { x: number; y: number; depth: number };
}) {
  const { camera } = useThree();
  const N = performanceMode ? 70 : reduced ? 110 : 240;
  const spreadKey = `${spread.x}-${spread.y}-${spread.depth}`;

  const { geo, mat, positions, stars } = useMemo(() => {
    const positions = new Float32Array(N * 6);
    const stars = Array.from({ length: N }, () => ({
      x: (Math.random() * 2 - 1) * spread.x,
      y: (Math.random() * 2 - 1) * spread.y,
      z: -40 + Math.random() * spread.depth,
    }));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geo, mat, positions, stars };
    // `color` y `spread` se leen una vez: recrear los buffers en cada render
    // del consumidor sería tirar geometría en cada frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, color, spreadKey]);

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((_, dt) => {
    const warp = reduced ? 0 : velocity.current;
    const speed = 2.5 + warp * 70; // unidades/seg: deriva suave + empuje al scrollear
    const streak = Math.min(9, 0.06 + warp * 34); // largo de la estela
    const camZ = camera.position.z;
    const step = speed * Math.min(dt, 0.05);
    for (let i = 0; i < N; i++) {
      const s = stars[i];
      s.z += step;
      if (s.z > camZ + 6) {
        s.z = camZ - 38 - Math.random() * 8;
        s.x = (Math.random() * 2 - 1) * spread.x;
        s.y = (Math.random() * 2 - 1) * spread.y;
      }
      const o = i * 6;
      positions[o] = s.x;
      positions[o + 1] = s.y;
      positions[o + 2] = s.z;
      positions[o + 3] = s.x;
      positions[o + 4] = s.y;
      positions[o + 5] = s.z - streak;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = 0.7 + Math.min(0.3, warp * 0.7);
  });

  return <lineSegments geometry={geo} material={mat} />;
}

/**
 * Campo de puntos lente alrededor de la cámara, para dar profundidad al punto
 * de vista cuando la cámara se acerca a un objeto.
 */
export function StarShell({
  color = "#dbe7ff",
  count = 1400,
  radius = 90,
  reduced,
  spin = 0.006,
  opacity = 0.8,
}: {
  color?: string;
  count?: number;
  radius?: number;
  reduced: boolean;
  spin?: number;
  opacity?: number;
}) {
  const points = useRef<THREE.Points>(null);
  const total = reduced ? Math.min(count, 700) : count;

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const c = new THREE.Color();
    // Tinte del mundo: las estrellas conservan su variación de tono pero se
    //agen hacia el color del planeta, para que el cielo no se sienta prestado.
    const tint = new THREE.Color(color);
    for (let i = 0; i < total; i++) {
      const r = radius + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.set(
        [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)],
        i * 3
      );
      c.setHSL(Math.random(), 0.12, 0.78 + Math.random() * 0.2).lerp(tint, 0.4);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 1.3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [radius, total, opacity, color]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((_, dt) => {
    if (points.current && !reduced) points.current.rotation.y += dt * spin;
  });

  return <points ref={points} geometry={geometry} material={material} />;
}