"use client";

/* useFrame muta imperativamente el grafo de three.js (su propósito): el
   análisis de inmutabilidad del compilador de React no aplica a este archivo. */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Sparkles, Float, MeshDistortMaterial } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import {
  getScrollProgress,
  stageWeights,
  smoothstep,
  TRANSITIONS,
  localProgress,
} from "@/lib/scroll";

// Colores de atmósfera por etapa (oscuros para legibilidad del texto encima).
const C_SPACE = new THREE.Color("#05060f");
const C_JAPAN = new THREE.Color("#180a0c");
const C_BRAIN = new THREE.Color("#0b0016");

const tmpColor = new THREE.Color();

function bgColorAt(p: number, target: THREE.Color) {
  const toJapan = smoothstep(TRANSITIONS.spaceJapan[0], TRANSITIONS.spaceJapan[1], p);
  const toBrain = smoothstep(TRANSITIONS.japanBrain[0], TRANSITIONS.japanBrain[1], p);
  target.copy(C_SPACE).lerp(C_JAPAN, toJapan).lerp(C_BRAIN, toBrain);
  return target;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
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

/** Torii japonés construido con cajas. */
function Torii({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const red = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#c1272d",
    roughness: 0.5,
    metalness: 0.1,
    emissive: new THREE.Color("#3a0a0a"),
    emissiveIntensity: 0.4,
  }), []);
  return (
    <group ref={groupRef} position={[0, -0.5, -2]} scale={0}>
      {/* pilares */}
      <mesh material={red} position={[-1.6, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 4, 16]} />
      </mesh>
      <mesh material={red} position={[1.6, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 4, 16]} />
      </mesh>
      {/* kasagi: dintel superior con extremos curvados hacia arriba (sun upswept) */}
      <mesh material={red} position={[0, 2.15, 0]}>
        <boxGeometry args={[3.8, 0.34, 0.42]} />
      </mesh>
      <mesh material={red} position={[-2.35, 2.32, 0]} rotation={[0, 0, 0.22]}>
        <boxGeometry args={[1.1, 0.28, 0.42]} />
      </mesh>
      <mesh material={red} position={[2.35, 2.32, 0]} rotation={[0, 0, -0.22]}>
        <boxGeometry args={[1.1, 0.28, 0.42]} />
      </mesh>
      {/* nuki: travesaño inferior */}
      <mesh material={red} position={[0, 1.5, 0]}>
        <boxGeometry args={[3.6, 0.26, 0.32]} />
      </mesh>
      {/* gakuzuka: tablilla central */}
      <mesh material={red} position={[0, 1.82, 0.05]}>
        <boxGeometry args={[0.34, 0.5, 0.18]} />
      </mesh>
    </group>
  );
}

/** Cúmulo brainrot: icosaedros distorsionados y neón. */
function BrainrotCluster({ groupRef, reduced }: { groupRef: React.RefObject<THREE.Group | null>; reduced: boolean }) {
  const meshes = useRef<THREE.Mesh[]>([]);
  const config = useMemo(
    () => [
      { pos: [-2.6, 1.3, -1] as const, color: "#39ff14", speed: 1.4, size: 0.7 },
      { pos: [2.8, -0.9, -2] as const, color: "#ff2bd6", speed: -1.8, size: 0.9 },
      { pos: [0.3, 1.9, -3] as const, color: "#fff200", speed: 1.0, size: 0.6 },
      { pos: [-1.9, -1.7, -2] as const, color: "#00e5ff", speed: -1.2, size: 0.55 },
      { pos: [1.5, 0.7, -1.5] as const, color: "#ff5e00", speed: 1.6, size: 0.8 },
      { pos: [-3.1, -0.4, -3.5] as const, color: "#b026ff", speed: -1.0, size: 0.65 },
      { pos: [3.2, 1.7, -3] as const, color: "#14f1ff", speed: 1.9, size: 0.5 },
      { pos: [-0.6, -2.0, -1.2] as const, color: "#ff0059", speed: -1.5, size: 0.7 },
      { pos: [0.9, -1.1, -4] as const, color: "#aaff00", speed: 1.3, size: 0.85 },
    ],
    []
  );
  useFrame((_, dt) => {
    if (reduced) return;
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const s = config[i].speed;
      m.rotation.x += dt * s;
      m.rotation.y += dt * s * 1.7;
      m.rotation.z += dt * s * 0.6;
    });
  });
  return (
    <group ref={groupRef} scale={0}>
      {config.map((c, i) => (
        <Float key={i} speed={reduced ? 0 : 3.5} floatIntensity={reduced ? 0 : 2.5} rotationIntensity={0}>
          <mesh
            ref={(el) => {
              if (el) meshes.current[i] = el;
            }}
            position={c.pos}
          >
            <icosahedronGeometry args={[c.size, 1]} />
            <MeshDistortMaterial
              color={c.color}
              emissive={c.color}
              emissiveIntensity={0.7}
              distort={reduced ? 0.2 : 0.6}
              speed={reduced ? 0 : 3.5}
              roughness={0.2}
              metalness={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/** Planeta lejano para la etapa espacial. */
function Planet({ meshRef }: { meshRef: React.RefObject<THREE.Mesh | null> }) {
  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += dt * 0.05;
  });
  return (
    <mesh ref={meshRef} position={[3.2, 1.6, -8]}>
      <sphereGeometry args={[1.6, 48, 48]} />
      <meshStandardMaterial
        color="#3b2f7a"
        emissive="#1b1146"
        emissiveIntensity={0.5}
        roughness={0.7}
        metalness={0.2}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function Rig({ reduced }: { reduced: boolean }) {
  const { scene, camera } = useThree();
  const torii = useRef<THREE.Group>(null);
  const brain = useRef<THREE.Group>(null);
  const planet = useRef<THREE.Mesh>(null);
  const stars = useRef<THREE.Points>(null);
  const sakura = useRef<THREE.Group>(null);
  const fog = useMemo(() => new THREE.FogExp2(C_SPACE.getHex(), 0.04), []);

  useEffect(() => {
    scene.fog = fog;
    scene.background = C_SPACE.clone();
  }, [scene, fog]);

  useFrame((_, dt) => {
    const p = getScrollProgress();

    // Fondo + niebla
    bgColorAt(p, tmpColor);
    (scene.background as THREE.Color).lerp(tmpColor, 0.1);
    fog.color.lerp(tmpColor, 0.1);

    // Pesos por etapa (fuente única en scroll.tsx)
    const { space: wSpace, japan: wJapan, brain: wBrain } = stageWeights(p);

    // Estrellas: fuertes en espacio, tenues luego
    if (stars.current) {
      const mat = stars.current.material as THREE.PointsMaterial;
      mat.opacity = 0.2 + 0.8 * wSpace;
      if (!reduced) stars.current.rotation.y += dt * 0.01;
    }
    if (planet.current) {
      const m = planet.current.material as THREE.MeshStandardMaterial;
      m.opacity = wSpace;
    }

    // Torii: aparece/escala en japón, con leve vaivén dentro de la etapa
    if (torii.current) {
      torii.current.scale.setScalar(0.9 * wJapan);
      if (!reduced) {
        const lp = localProgress(p, "japan");
        torii.current.rotation.y = Math.sin(lp * Math.PI * 2) * 0.14;
      }
    }
    if (sakura.current) sakura.current.visible = wJapan > 0.05;

    // Brainrot
    if (brain.current) {
      brain.current.scale.setScalar(wBrain);
      brain.current.visible = wBrain > 0.02;
    }

    // Cámara: leve parallax
    const tx = Math.sin(p * Math.PI * 2) * 0.4;
    const ty = 0.3 - p * 0.6;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.position.y += (ty - camera.position.y) * 0.05;
    camera.lookAt(0, 0, -2);
  });

  const starCount = reduced ? 1500 : 4000;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.1} />
      <pointLight position={[-4, 2, 2]} intensity={30} color="#ff7a59" distance={20} />
      <pointLight position={[4, -2, 2]} intensity={20} color="#5b8cff" distance={20} />

      <Stars
        ref={stars as never}
        radius={60}
        depth={40}
        count={starCount}
        factor={4}
        saturation={0}
        fade
        speed={reduced ? 0 : 0.5}
      />
      <Planet meshRef={planet} />

      <Torii groupRef={torii} />
      <group ref={sakura}>
        <Sparkles
          count={reduced ? 30 : 90}
          scale={[10, 6, 6]}
          size={4}
          speed={reduced ? 0 : 0.4}
          color="#ffb7c5"
          opacity={0.9}
        />
      </group>

      <BrainrotCluster groupRef={brain} reduced={reduced} />
      <group>{/* ambient brainrot particles, only visible weight handled by cluster */}</group>
    </>
  );
}

export default function Scene() {
  const reduced = useReducedMotion();
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);

  useEffect(() => {
    // En pantallas chicas, bajar DPR para performance
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.innerWidth < 768) setDpr([1, 1]);
  }, []);

  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 6], fov: 60 }}
        dpr={dpr}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Rig reduced={reduced} />
      </Canvas>
    </div>
  );
}
