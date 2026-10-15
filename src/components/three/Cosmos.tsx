"use client";

/* useFrame muta imperativamente uniforms/geometrías de three.js (su propósito):
   la inmutabilidad del compilador de React no aplica a este archivo. La siembra
   aleatoria y las mutaciones de uniforms ocurren una sola vez / por frame. */
/* eslint-disable react-hooks/immutability */

/* Shaders de la capa cósmica: nebulosa procedural (fbm en esfera invertida) y
   planeta con atmósfera fresnel. Todo procedural: 0 KB de assets. */
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import type { Node } from "three/webgpu";
import { normalView, positionLocal, positionViewDirection, uniform } from "three/tsl";
import { tslExports } from "vgpu/three";
import cosmosShader from "./shaders/nebula.wgsl";
import { DecorSide, clearOfContentX, orbitTime } from "./shared";

type CosmosShaderInputs = {
  nebulaColor: { position: Node; time: Node; scroll: Node; intensity: Node; octaves: Node };
  atmosphereColor: { normal: Node; viewDirection: Node; colorA: Node; colorB: Node };
  atmosphereOpacity: { normal: Node; viewDirection: Node; opacity: Node };
};

const { nebulaColor, atmosphereColor, atmosphereOpacity } =
  tslExports<CosmosShaderInputs>(cosmosShader)("nebulaColor", "atmosphereColor", "atmosphereOpacity");

export function Nebula({
  pRef,
  reduced,
  performanceMode,
}: {
  pRef: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const time = useMemo(() => uniform(0), []);
  const scroll = useMemo(() => uniform(0), []);
  const intensity = useMemo(() => uniform(reduced ? 0.56 : 0.88), [reduced]);
  const octaves = useMemo(() => uniform(performanceMode ? 3 : 5), [performanceMode]);
  const mat = useMemo(() => {
    const material = new MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
    material.colorNode = nebulaColor({ position: positionLocal, time, scroll, intensity, octaves });
    return material;
  }, [intensity, octaves, scroll, time]);

  const geo = useMemo(() => new THREE.SphereGeometry(70, 32, 24), []);

  useFrame((_, dt) => {
    scroll.value = pRef.current;
    if (!reduced) time.value += dt;
  });

  useEffect(() => () => {
    mat.dispose();
    geo.dispose();
  }, [mat, geo]);

  return <mesh geometry={geo} material={mat} renderOrder={-10} frustumCulled={false} />;
}

function createAtmosphereMaterial(colorA: THREE.Color, colorB: THREE.Color, opacity: number) {
  const opacityUniform = uniform(opacity);
  const colorAUniform = uniform(colorA);
  const colorBUniform = uniform(colorB);
  const inputs = { normal: normalView, viewDirection: positionViewDirection };
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });
  material.colorNode = atmosphereColor({ ...inputs, colorA: colorAUniform, colorB: colorBUniform });
  material.opacityNode = atmosphereOpacity({ ...inputs, opacity: opacityUniform });
  return { material, opacity: opacityUniform };
}

/**
 * Planeta lejano con atmósfera fresnel y anillo tenue: ancla visual que da
 * escala al cosmos. Rota lentísimo; la cámara pasa cerca durante el viaje.
 */
/** Centre of the anchor planet's orbit and its ellipse (semi-axes, tilt). */
const ANCHOR_ORBIT = { x: -4.6, y: 1.9, z: -11, a: 0.9, b: 0.55, speed: 0.07, tilt: 0.35 };
/** Horizontal half-extent of the anchor system: moon orbit (2.6 + its radius) plus the orbit wobble. */
const ANCHOR_EXTENT = 2.8 + ANCHOR_ORBIT.a;

export function Planet({ pRef }: { pRef: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const moon = useRef<THREE.Mesh>(null);

  const { bodyMat, atmoMat, atmoOpacity, ringMat, geo, atmoGeo, ringGeo, moonGeo, moonMat } = useMemo(() => {
    // A faint blue self-glow keeps the night side reading as a sphere (a
    // flat black disc looked like a hole in the sky).
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#22335f"),
      emissive: new THREE.Color("#16244f"),
      emissiveIntensity: 0.6,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
    });
    const { material: atmoMat, opacity: atmoOpacity } = createAtmosphereMaterial(
      new THREE.Color("#5b8cff"),
      new THREE.Color("#c9b6ff"),
      1
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#8fa7ff"),
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return {
      bodyMat,
      atmoMat,
      atmoOpacity,
      ringMat,
      geo: new THREE.SphereGeometry(1, 48, 32),
      atmoGeo: new THREE.SphereGeometry(1.18, 48, 32),
      ringGeo: new THREE.RingGeometry(1.45, 2.15, 96),
      moonGeo: new THREE.SphereGeometry(0.16, 20, 14),
      moonMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#8e9cc4"),
        emissive: new THREE.Color("#5b6fa8"),
        emissiveIntensity: 0.3,
        roughness: 0.9,
        transparent: true,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      bodyMat.dispose();
      atmoMat.dispose();
      ringMat.dispose();
      geo.dispose();
      atmoGeo.dispose();
      ringGeo.dispose();
      moonGeo.dispose();
      moonMat.dispose();
    },
    [bodyMat, atmoMat, ringMat, geo, atmoGeo, ringGeo, moonGeo, moonMat]
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = orbitTime();
    // Inclined elliptical orbit around a point in the upper left of the view,
    // pushed out beside the hero copy on wide screens, plus its own axial spin.
    const o = ANCHOR_ORBIT;
    const a = t * o.speed;
    const centreX = clearOfContentX(
      state.camera as THREE.PerspectiveCamera,
      state.size.width,
      o.z,
      DecorSide.Left,
      ANCHOR_EXTENT,
      o.x
    );
    group.current.position.set(
      centreX + Math.cos(a) * o.a,
      o.y + Math.sin(a) * o.b * Math.cos(o.tilt),
      o.z + Math.sin(a) * o.b * Math.sin(o.tilt) * 2
    );
    if (body.current) body.current.rotation.y = t * 0.12;
    if (moon.current) {
      const m = t * 0.45;
      moon.current.position.set(Math.cos(m) * 2.6, Math.sin(m) * 0.55, Math.sin(m) * 2.1);
      moonMat.opacity = bodyMat.opacity;
    }
    // El ancla no entra en Sobre Mi: se desvanece antes de la sección
    // (antes era 0.68→0.90 y se pisaba con el slider).
    const fade = Math.min(1, Math.max(0, (pRef.current - 0.42) / 0.16));
    const f = 1 - fade * fade * (3 - 2 * fade);
    bodyMat.opacity = f;
    atmoOpacity.value = f;
    ringMat.opacity = 0.16 * f;
    group.current.visible = f > 0.01;
  });

  return (
    <group ref={group} position={[ANCHOR_ORBIT.x, ANCHOR_ORBIT.y, ANCHOR_ORBIT.z]} rotation={[0.28, 0, -0.14]}>
      <group ref={body}>
        <mesh geometry={geo} material={bodyMat} />
      </group>
      <mesh ref={moon} geometry={moonGeo} material={moonMat} />
      {/* Luz clave desde arriba-derecha: coherente con el bloom del hero */}
      <pointLight position={[4, 5, 3]} intensity={48} color="#bcd0ff" />
      <mesh geometry={atmoGeo} material={atmoMat} scale={1} />
      <mesh geometry={ringGeo} material={ringMat} rotation={[Math.PI / 2.25, 0.2, 0]} />
    </group>
  );
}
