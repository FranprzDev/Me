"use client";

/* useFrame muta imperativamente uniforms/geometrías de three.js (su propósito):
   la inmutabilidad del compilador de React no aplica a este archivo. La siembra
   aleatoria y las mutaciones de uniforms ocurren una sola vez / por frame. */
/* eslint-disable react-hooks/immutability */

/* Shaders de la capa cósmica: nebulosa procedural (fbm en esfera invertida) y
   planeta con atmósfera fresnel. Todo procedural: 0 KB de assets. */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import type { Node } from "three/webgpu";
import { normalView, positionLocal, positionViewDirection, uniform } from "three/tsl";
import { tslExports } from "vgpu/three";
import cosmosShader from "./shaders/nebula.wgsl";
import { PROJECTS, type PlanetSpec } from "@/data/projects";
import { bumpWeight, measuredSectionCenter } from "@/lib/scroll";
import { getActiveProject, getSlideDirection } from "@/lib/projectFocus";
import { useRouter } from "next/navigation";

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
  const intensity = useMemo(() => uniform(reduced ? 0.35 : 0.55), [reduced]);
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
export function Planet({
  reduced,
  pRef,
}: {
  reduced: boolean;
  pRef: RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);

  const { bodyMat, atmoMat, atmoOpacity, ringMat, geo, atmoGeo, ringGeo } = useMemo(() => {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#131f3d"),
      roughness: 0.95,
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
    },
    [bodyMat, atmoMat, ringMat, geo, atmoGeo, ringGeo]
  );

  useFrame((_, dt) => {
    if (!group.current) return;
    if (!reduced) group.current.rotation.y += dt * 0.02;
    // El ancla no entra en Sobre Mi: se desvanece antes de la sección
    // (antes era 0.68→0.90 y se pisaba con el slider).
    const t = Math.min(1, Math.max(0, (pRef.current - 0.42) / 0.16));
    const f = 1 - t * t * (3 - 2 * t);
    bodyMat.opacity = f;
    atmoOpacity.value = f;
    ringMat.opacity = 0.16 * f;
    group.current.visible = f > 0.01;
  });

  return (
    <group ref={group} position={[-4.6, 1.9, -11]} rotation={[0.28, 0, -0.14]}>
      <mesh geometry={geo} material={bodyMat} />
      {/* Luz clave desde arriba-derecha: coherente con el bloom del hero */}
      <pointLight position={[4, 5, 3]} intensity={12} color="#bcd0ff" />
      <mesh geometry={atmoGeo} material={atmoMat} scale={1} />
      <mesh geometry={ringGeo} material={ringMat} rotation={[Math.PI / 2.25, 0.2, 0]} />
    </group>
  );
}

/**
 * Los proyectos como planetas del slider: UNO a la vez, al frente y al centro
 * de la escena (protagonista absoluto). Las flechas ← → del DOM cambian el
 * slide; el planeta activo entra deslizándose y el anterior sale por el lado
 * contrario. No son decorado de fondo: el único planeta de fondo es el ancla
 * original del inicio del viaje.
 */
const PLANET_FRONT = { x: 0, y: 0.15, z: -5.4 };

export function ProjectPlanets({
  reduced,
  pRef,
}: {
  reduced: boolean;
  pRef: RefObject<number>;
}) {
  return (
    <>
      {PROJECTS.map((p, i) => (
        <ProjectPlanet
          key={p.name}
          spec={p.planet}
          index={i}
          seed={i}
          reduced={reduced}
          pRef={pRef}
        />
      ))}
    </>
  );
}

function ProjectPlanet({
  spec,
  index,
  seed,
  reduced,
  pRef,
}: {
  spec: PlanetSpec;
  index: number;
  seed: number;
  reduced: boolean;
  pRef: RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const router = useRouter();
  // Slide: 0 = fuera de escena, 1 = en el centro del escenario.
  const slideRef = useRef(0);
  // Hover: el planeta "respira" un poco más grande bajo el puntero.
  const hoverRef = useRef(0);
  const hoverTarget = useRef(0);

  const { bodyMat, atmoMat, atmoOpacity, ringMat, geo, atmoGeo, ringGeo, hitGeo, hitMat } = useMemo(() => {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(spec.body),
      // Emisión tenue del mismo tono: garantiza que el cuerpo se vea aunque
      // la iluminación de la escena varíe (nunca una silueta negra).
      emissive: new THREE.Color(spec.body),
      emissiveIntensity: 0.35,
      roughness: 0.92,
      metalness: 0.08,
      transparent: true,
      opacity: 0,
    });
    const { material: atmoMat, opacity: atmoOpacity } = createAtmosphereMaterial(
      new THREE.Color(spec.atmoA),
      new THREE.Color(spec.atmoB),
      0
    );
    const ringMat = spec.ring
      ? new THREE.MeshBasicMaterial({
          color: new THREE.Color(spec.ring),
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      : null;
    return {
      bodyMat,
      atmoMat,
      atmoOpacity,
      ringMat,
      geo: new THREE.SphereGeometry(1, 40, 28),
      atmoGeo: new THREE.SphereGeometry(1.18, 40, 28),
      ringGeo: new THREE.RingGeometry(1.32, 1.78, 88),
      hitGeo: new THREE.SphereGeometry(1.3, 16, 12),
      hitMat: new THREE.MeshBasicMaterial({
        visible: false, // invisible pero raycasteable: hitbox generosa del planeta
      }),
    };
  }, [spec]);

  useEffect(
    () => () => {
      bodyMat.dispose();
      atmoMat.dispose();
      ringMat?.dispose();
      geo.dispose();
      atmoGeo.dispose();
      ringGeo.dispose();
      hitGeo.dispose();
      hitMat.dispose();
    },
    [bodyMat, atmoMat, ringMat, geo, atmoGeo, ringGeo, hitGeo, hitMat]
  );

  useFrame((_, dt) => {
    if (!group.current) return;
    if (!reduced) group.current.rotation.y += 0.006 + seed * 0.002;

    // Ventana CORTA medida del DOM real: los planetas viven sólo en plena
    // sección Proyectos y se apagan antes de que empiece a armarse CHARLEMOS.
    const inSection = bumpWeight(pRef.current, measuredSectionCenter(2), 0.09);

    // Slide del activo: entra/sale deslizándose horizontalmente.
    const goal = getActiveProject() === index ? 1 : 0;
    slideRef.current += (goal - slideRef.current) * (1 - Math.exp(-dt * 4));
    const s = slideRef.current;
    hoverRef.current += (hoverTarget.current - hoverRef.current) * (1 - Math.exp(-dt * 8));

    // Posición: centro del escenario, desplazado fuera de pantalla según el
    // lado del que viene/va la transición.
    const camZ = camera.position.z;
    const off = (1 - s) * getSlideDirection() * 8;
    group.current.position.set(PLANET_FRONT.x + off, PLANET_FRONT.y, camZ + PLANET_FRONT.z);
    const viewportScale = Math.min(1, Math.max(0.48, size.width / 1200));
    group.current.scale.setScalar(spec.radius * 1.82 * viewportScale * (1 + 0.06 * hoverRef.current));

    const f = inSection * s;
    bodyMat.opacity = f;
    atmoOpacity.value = f * (0.85 + 0.15 * hoverRef.current);
    if (ringMat) ringMat.opacity = 0.26 * f;
    group.current.visible = f > 0.01;
  });

  // El planeta entero es el botón: click → su ruta. Hover → cursor de mano.
  const handlers = {
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      hoverTarget.current = 1;
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      hoverTarget.current = 0;
      document.body.style.cursor = "";
    },
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      router.push(`/${PROJECTS[index].slug}`);
    },
  };

  return (
    <group
      ref={group}
      position={[0, PLANET_FRONT.y, PLANET_FRONT.z]}
      scale={spec.radius}
      rotation={[0.24 + seed * 0.08, 0, -0.12]}
      visible={false}
    >
      <mesh geometry={geo} material={bodyMat} {...handlers} />
      {/* Hitbox invisible generosa: el click no depende de puntería fina. */}
      <mesh geometry={hitGeo} material={hitMat} {...handlers} />
      {/* Luz clave + relleno: los cuerpos son oscuros y sin esto se ven como
          siluetas negras contra el cielo. */}
      <pointLight position={[5, 4, 6]} intensity={350} color="#dff0ff" />
      <pointLight position={[-6, -2, 4]} intensity={80} color="#8f7bff" />
      <mesh geometry={atmoGeo} material={atmoMat} {...handlers} />
      {ringMat && <mesh geometry={ringGeo} material={ringMat} rotation={[Math.PI / 2.25, 0.25, 0]} {...handlers} />}
    </group>
  );
}
