/* useFrame muta imperativamente uniforms/materiales de three.js: es su propósito.
   La mutación ocurre sólo dentro del bucle de render o una vez al crear buffers. */
/* eslint-disable react-hooks/immutability, react-hooks/purity */

import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import type { Node } from "three/webgpu";
import { normalView, positionViewDirection, uniform } from "three/tsl";
import { tslExports } from "vgpu/three";
import planetShader from "./shaders/nebula.wgsl";
import { dampingFactor } from "./shared";

type AtmosphereInputs = {
  atmosphereColor: { normal: Node; viewDirection: Node; colorA: Node; colorB: Node };
  atmosphereOpacity: { normal: Node; viewDirection: Node; opacity: Node };
};

/* El mismo fresnel del cosmos, reutilizado: brilla en los ángulos rasantes, que
   desde adentro de una esfera es exactamente el borde del "cuenco" interior. */
const { atmosphereColor, atmosphereOpacity } =
  tslExports<AtmosphereInputs>(planetShader)("atmosphereColor", "atmosphereOpacity");

/**
 * Momento del recorrido en que se cruza la membrana. Antes: acercamiento desde
 * el exterior. Después: interior.
 */
export const CROSSING = 0.3;

/** Progreso normalizado DENTRO del planeta: 0 al cruzar, 1 al final del recorrido. */
export function insideProgress(p: number): number {
  return Math.min(1, Math.max(0, (p - CROSSING) / (1 - CROSSING)));
}

/**
 * Distancia de la cámara al centro del planeta a lo largo del recorrido.
 *
 * Antes del cruce la distancia cae rápido (el planeta crece y se viene encima);
 * después el descenso es lento y continuo, que es lo que se siente "estar
 * dentro": flotando, sin destino, no cayendo.
 */
export function cameraDistance(p: number, from: number, shell: number, depth: number): number {
  if (p < CROSSING) return from + (shell - from) * (p / CROSSING);
  const t = (p - CROSSING) / (1 - CROSSING);
  // La segunda mitad es una curva suave: entra rápido al interior y después
  // se va asentando, que es el ritmo de la lectura.
  return shell + (depth - shell) * (t * (2 - t));
}

/** Pico de luz al atravesar la membrana: 0 fuera, 1 en el cruce, 0 adentro. */
export function crossingFlash(p: number): number {
  return Math.max(0, 1 - Math.abs(p - CROSSING) / 0.075);
}

/**
 * La membrana del planeta: la esfera cuya superficie se cruza.
 *
 * Es BackSide, así que desde afuera es un planeta opaco y desde adentro es el
 * cuenco que te rodea. Misma geometría para las dos caras: no hay truco de
 *ecut, la cámara realmente pasa al otro lado de la superficie.
 */
export function PlanetMembrane({
  shell,
  colorA,
  colorB,
  progress,
  reduced,
  performanceMode,
}: {
  shell: number;
  colorA: string;
  colorB: string;
  progress: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const p = progress.current;
  const inside = insideProgress(p);

  const { material, opacity } = useMemo(() => {
    // Los uniforms se nombr distinto del prop porque el prop es el string de
    // origen: si se llamaran igual, la declaración se pisaría a sí misma.
    const uA = uniform(new THREE.Color(colorA));
    const uB = uniform(new THREE.Color(colorB));
    const opacity = uniform(0);
    const material = new MeshBasicNodeMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const inputs = { normal: normalView, viewDirection: positionViewDirection };
    material.colorNode = atmosphereColor({ ...inputs, colorA: uA, colorB: uB });
    material.opacityNode = atmosphereOpacity({ ...inputs, opacity });
    return { material, opacity };
  }, [colorA, colorB]);

  const geo = useMemo(() => new THREE.SphereGeometry(shell, 40, 28), [shell]);

  /**
   * El cuerpo del planeta, FrontSide: es lo que se ve desde afuera y lo que se
   * usa para el acercamiento. Al ser FrontSide, al cruzar la membrana queda de
   * espaldas y desaparece solo; el fundido evita que el salto se note.
   */
  const body = useMemo(() => {
    const geo = new THREE.SphereGeometry(shell * 0.995, 40, 28);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorA).multiplyScalar(0.22),
      transparent: true,
      opacity: 1,
      depthWrite: false,
      fog: false,
    });
    return new THREE.Mesh(geo, mat);
  }, [shell, colorA]);

  /**
   * La pared del interior. El fresnel de arriba sólo brilla en los bordes
   * rasantes, así que sin esto el interior queda negro en el medio: se está
   * dentro de un vacío. Esta cáscara BackSide le da cuerpo y color al espacio
   * que te rodea, y es la que hace que "adentro" se lea como adentro.
   */
  const wall = useMemo(() => {
    const geo = new THREE.SphereGeometry(shell * 0.92, 32, 22);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorA).multiplyScalar(0.5),
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    return new THREE.Mesh(geo, mat);
  }, [shell, colorA]);

  const iris = useMemo(() => {
    const geo = new THREE.SphereGeometry(shell * 0.97, 32, 22);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorB),
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }, [shell, colorB]);

  // Motas suspendidas en el interior: el parallax al derivar es lo que vende
  // que hay espacio alrededor tuyo y no un fondo pintado.
  const MOTES = performanceMode ? 0 : reduced ? 180 : 520;
  const motes = useMemo(() => {
    if (MOTES === 0) return null;
    const positions = new Float32Array(MOTES * 3);
    for (let i = 0; i < MOTES; i++) {
      // Distribución en volumen (no en la corteza): se ven al pasar al lado.
      const r = shell * (0.25 + Math.random() * 0.62);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.set(
        [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)],
        i * 3
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(colorB),
      size: 1.6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }, [MOTES, shell, colorB]);

  useEffect(() => () => {
    material.dispose();
    geo.dispose();
    body.geometry.dispose();
    (body.material as THREE.Material).dispose();
    wall.geometry.dispose();
    (wall.material as THREE.Material).dispose();
    iris.geometry.dispose();
    (iris.material as THREE.Material).dispose();
    if (motes) {
      motes.geometry.dispose();
      (motes.material as THREE.Material).dispose();
    }
  }, [material, geo, body, wall, iris, motes]);

  useFrame((_, dt) => {
    // La membrana no aparece de golpe: se funde con el espacio de afuera.
    const want = 0.18 + inside * 0.5;
    opacity.value += (want - opacity.value) * dampingFactor(dt, 3.5);

    // El cuerpo se funde justo antes del cruce: el planeta se disuelve en vez
    // de desaparecer de golpe al atravesarlo.
    const bodyMat = body.material as THREE.MeshBasicMaterial;
    const bodyWant = Math.max(0, 1 - p / (CROSSING * 0.92));
    bodyMat.opacity += (bodyWant - bodyMat.opacity) * dampingFactor(dt, 4);

    const flash = reduced || performanceMode ? 0 : crossingFlash(p);
    (iris.material as THREE.MeshBasicMaterial).opacity = flash * 0.5;

    // La pared aparece al cruzar y se asienta: el interior tiene que quedar
    // iluminado y con cuerpo, no vacío.
    const wallWant = inside * 0.34;
    (wall.material as THREE.MeshBasicMaterial).opacity +=
      (wallWant - (wall.material as THREE.MeshBasicMaterial).opacity) * dampingFactor(dt, 3);

    if (motes) {
      (motes.material as THREE.PointsMaterial).opacity = inside * 0.5;
      if (!reduced) motes.rotation.y += dt * 0.012;
    }
  });

  return (
    <>
      <primitive object={body} renderOrder={-11} />
      <primitive object={wall} renderOrder={-10} />
      <mesh geometry={geo} material={material} renderOrder={-9} frustumCulled={false} />
      {/* Iris: se ve desde AFUERA y se enciende justo cuando la cámara lo
          alcanza. Es el aviso de que se está cruzando. */}
      <primitive object={iris} />
      {motes ? <primitive object={motes} /> : null}
    </>
  );
}