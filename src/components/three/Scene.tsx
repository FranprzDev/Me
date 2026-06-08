"use client";

/* useFrame muta imperativamente el grafo de three.js (su propósito): el
   análisis de inmutabilidad del compilador de React no aplica a este archivo.
   La siembra aleatoria (Math.random) ocurre una sola vez dentro de useMemo
   para inicializar buffers de partículas/estrellas: es intencional. */
/* eslint-disable react-hooks/immutability, react-hooks/purity */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useMemo, useRef, useState, useEffect, type RefObject } from "react";
import * as THREE from "three";
import { getScrollProgress, sectionCenter, bumpWeight } from "@/lib/scroll";
import { CONSTELLATIONS, type Constellation } from "@/data/constellations";

// Fondo de respaldo: clear-color del WebGL y fallback CSS. Siempre oscuro para
// que NUNCA aparezca un flash blanco (p.ej. al redimensionar).
const FALLBACK_BG = "#050817";

// Familia de color del nebulón: todo dentro del "espacio" (índigos/violetas
// oscuros). No son mundos distintos, sólo un leve cambio de humor por profundidad.
const C_BG_A = new THREE.Color("#050817"); // despegue
const C_BG_B = new THREE.Color("#0a0a22"); // medio (matiz violeta)
const C_BG_C = new THREE.Color("#070b1d"); // fondo profundo
const tmpColor = new THREE.Color();

function dampingFactor(dt: number, speed: number) {
  return 1 - Math.exp(-dt * speed);
}

function smoother(x: number, e0: number, e1: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
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

/** Textura circular suave para que las estrellas se vean redondas y con halo. */
function makeStarTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.9)");
  g.addColorStop(0.5, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * WARP / hiperespacio: campo de estrellas que vuela hacia la cámara. La
 * longitud de las estelas y la velocidad crecen con la velocidad de scroll
 * (velRef), convirtiendo "mirar puntos" en "viajar por el espacio".
 */
function WarpField({ velRef, reduced }: { velRef: RefObject<number>; reduced: boolean }) {
  const { camera } = useThree();
  const N = reduced ? 160 : 380;

  const { geo, mat, positions, stars } = useMemo(() => {
    const positions = new Float32Array(N * 6);
    const stars = Array.from({ length: N }, () => ({
      x: (Math.random() * 2 - 1) * 16,
      y: (Math.random() * 2 - 1) * 10,
      z: -40 + Math.random() * 50,
    }));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#cfe0ff"),
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geo, mat, positions, stars };
  }, [N]);

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((_, dt) => {
    const warp = reduced ? 0 : velRef.current;
    const speed = 2.5 + warp * 70; // unidades/seg: deriva suave + empuje al scrollear
    const streak = Math.min(9, 0.06 + warp * 34); // largo de la estela
    const camZ = camera.position.z;
    const step = speed * Math.min(dt, 0.05);
    for (let i = 0; i < N; i++) {
      const s = stars[i];
      s.z += step;
      if (s.z > camZ + 6) {
        s.z = camZ - 38 - Math.random() * 8;
        s.x = (Math.random() * 2 - 1) * 16;
        s.y = (Math.random() * 2 - 1) * 10;
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
    mat.opacity = 0.55 + Math.min(0.4, warp * 0.7);
  });

  return <lineSegments geometry={geo} material={mat} />;
}

/**
 * Constelación que se ENSAMBLA con partículas: miles de chispas dispersas vuelan
 * y se juntan formando la figura cuando entrás en su sección (peso w → 1), y se
 * dispersan al salir. Las líneas se dibujan una vez ensambladas. Ése es el
 * "momento firma".
 */
function ConstellationGroup({
  data,
  starTex,
  pRef,
  reduced,
}: {
  data: Constellation;
  starTex: THREE.Texture;
  pRef: RefObject<number>;
  reduced: boolean;
}) {
  const center = useMemo(() => sectionCenter(data.sectionIndex), [data.sectionIndex]);
  const ppn = reduced ? 10 : 24;

  const { group, pointsMat, lineMat, geo, home, target, phase, count } = useMemo(() => {
    const count = data.nodes.length * ppn;
    const home = new Float32Array(count * 3); // posición dispersa
    const target = new Float32Array(count * 3); // posición ensamblada (en el nodo)
    const phase = new Float32Array(count);
    const positions = new Float32Array(count * 3);
    for (let n = 0; n < data.nodes.length; n++) {
      const [nx, ny] = data.nodes[n];
      for (let j = 0; j < ppn; j++) {
        const k = n * ppn + j;
        target[k * 3] = nx;
        target[k * 3 + 1] = ny;
        target[k * 3 + 2] = 0;
        const r = 1.1 + Math.random() * 1.7;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        home[k * 3] = nx + r * Math.sin(ph) * Math.cos(th);
        home[k * 3 + 1] = ny + r * Math.sin(ph) * Math.sin(th);
        home[k * 3 + 2] = r * Math.cos(ph) * 0.8;
        phase[k] = Math.random() * Math.PI * 2;
        positions[k * 3] = home[k * 3];
        positions[k * 3 + 1] = home[k * 3 + 1];
        positions[k * 3 + 2] = home[k * 3 + 2];
      }
    }
    const ptsGeo = new THREE.BufferGeometry();
    ptsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const linePos = new Float32Array(data.edges.length * 2 * 3);
    data.edges.forEach((e, i) => {
      const a = data.nodes[e[0]];
      const b = data.nodes[e[1]];
      linePos.set([a[0], a[1], 0, b[0], b[1], 0], i * 6);
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));

    const color = new THREE.Color(data.color);
    const pMat = new THREE.PointsMaterial({
      map: starTex,
      color,
      size: 0.2,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    const lMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });

    const g = new THREE.Group();
    g.position.set(data.world.x, data.world.y, data.world.z);
    g.scale.setScalar(data.world.scale);
    g.add(new THREE.LineSegments(lineGeo, lMat));
    g.add(new THREE.Points(ptsGeo, pMat));
    return { group: g, pointsMat: pMat, lineMat: lMat, geo: ptsGeo, home, target, phase, count };
  }, [data, starTex, ppn]);

  useEffect(() => {
    return () => {
      group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose?.();
      });
      pointsMat.dispose();
      lineMat.dispose();
    };
  }, [group, pointsMat, lineMat]);

  useFrame(() => {
    const w = bumpWeight(pRef.current, center);
    const e = w * w * (3 - 2 * w); // easing del ensamblado
    const t = performance.now() * 0.001;
    const pos = geo.attributes.position.array as Float32Array;
    for (let k = 0; k < count; k++) {
      const ph = phase[k];
      const ox = reduced ? 0 : Math.sin(t * 0.6 + ph) * 0.04;
      const oy = reduced ? 0 : Math.cos(t * 0.5 + ph) * 0.04;
      const tx = target[k * 3] + ox;
      const ty = target[k * 3 + 1] + oy;
      pos[k * 3] = home[k * 3] + (tx - home[k * 3]) * e;
      pos[k * 3 + 1] = home[k * 3 + 1] + (ty - home[k * 3 + 1]) * e;
      pos[k * 3 + 2] = home[k * 3 + 2] + (0 - home[k * 3 + 2]) * e;
    }
    geo.attributes.position.needsUpdate = true;
    // Pico de opacidad bajo: las constelaciones quedan de fondo y no compiten
    // con el texto en primer plano.
    pointsMat.opacity = 0.06 + 0.5 * w;
    pointsMat.size = 0.13 + 0.12 * w;
    lineMat.opacity = 0.32 * e;
  });

  return <primitive object={group} />;
}

function Rig({ reduced, minimal }: { reduced: boolean; minimal: boolean }) {
  const { scene, camera } = useThree();
  const stars = useRef<THREE.Points>(null);
  const fog = useMemo(() => new THREE.FogExp2(C_BG_A.getHex(), 0.018), []);
  const background = useMemo(() => C_BG_A.clone(), []);
  const starTex = useMemo(() => makeStarTexture(), []);
  const lastCssBg = useRef("");
  // Progreso suavizado: desacopla la escena del scroll crudo (la rueda llega en
  // saltos discretos) para que el viaje y los cross-fade se sientan fluidos.
  const pRef = useRef(0);
  // Velocidad de scroll suavizada -> intensidad del warp.
  const velRef = useRef(0);
  const lastRaw = useRef(0);

  useEffect(() => {
    scene.fog = fog;
    scene.background = background;
    if (typeof document !== "undefined") {
      const initialBg = `#${background.getHexString()}`;
      document.documentElement.style.setProperty("--scene-bg", initialBg);
      lastCssBg.current = initialBg;
    }
    return () => starTex.dispose();
  }, [scene, fog, background, starTex]);

  useFrame((_, dt) => {
    const raw = getScrollProgress();
    // Velocidad instantánea de scroll -> suavizada.
    const inst = Math.abs(raw - lastRaw.current) / Math.max(dt, 0.0001);
    lastRaw.current = raw;
    velRef.current += (inst - velRef.current) * dampingFactor(dt, 6);

    // Easing del progreso hacia el objetivo de scroll: viaje "buttery".
    pRef.current += (raw - pRef.current) * dampingFactor(dt, 5);
    const p = pRef.current;
    const blend = dampingFactor(dt, 7);

    // Fondo + niebla dentro de la familia espacial (siempre oscuro).
    tmpColor.copy(C_BG_A).lerp(C_BG_B, smoother(p, 0, 0.5)).lerp(C_BG_C, smoother(p, 0.5, 1));
    const cssBg = `#${tmpColor.getHexString()}`;
    if (lastCssBg.current !== cssBg) {
      lastCssBg.current = cssBg;
      document.documentElement.style.setProperty("--scene-bg", cssBg);
    }
    background.lerp(tmpColor, blend);
    fog.color.lerp(tmpColor, blend);

    if (stars.current && !reduced) stars.current.rotation.y += dt * 0.006;

    // Cámara: viaja hacia el fondo del cosmos (-z) con leve parallax.
    const targetZ = 6 - p * 8; // 6 -> -2
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    const tx = Math.sin(p * Math.PI * 2) * 0.5;
    const ty = 0.25 - p * 0.5;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.position.y += (ty - camera.position.y) * 0.05;
    camera.lookAt(0, 0, camera.position.z - 9);
  });

  const starCount = reduced ? 1500 : 3500;

  return (
    <>
      <ambientLight intensity={0.5} />

      <Stars
        ref={stars as never}
        radius={90}
        depth={50}
        count={starCount}
        factor={4}
        saturation={0}
        fade
        speed={reduced ? 0 : 0.2}
      />

      <WarpField velRef={velRef} reduced={reduced} />

      {/* En modo minimal (p.ej. /utn-frt-mcp) sólo quedan los puntos viajando:
          sin el viaje de constelaciones del portfolio principal. */}
      {!minimal &&
        CONSTELLATIONS.map((c) => (
          <ConstellationGroup key={c.id} data={c} starTex={starTex} pRef={pRef} reduced={reduced} />
        ))}

      {!reduced && (
        <EffectComposer>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.6}
            radius={0.7}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}

export default function Scene({ minimal = false }: { minimal?: boolean }) {
  const reduced = useReducedMotion();
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);

  useEffect(() => {
    // DPR adaptativo: en pantallas chicas bajamos resolución por performance.
    // Reaccionar al resize evita que el canvas quede mal afinado al achicar.
    const apply = () => {
      const small = window.innerWidth < 768;
      setDpr(small ? [1, 1] : [1, 1.5]);
    };
    apply();
    window.addEventListener("resize", apply, { passive: true });
    return () => window.removeEventListener("resize", apply);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        // Fondo sólido oscuro: respaldo si el canvas aún no pintó (nunca blanco).
        background: `var(--scene-bg, ${FALLBACK_BG})`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 6], fov: 60 }}
        dpr={dpr}
        frameloop="always"
        // Debounce del resize: re-mide tras 50ms en lugar de en cada píxel.
        resize={{ scroll: false, debounce: { scroll: 0, resize: 50 } }}
        // alpha:false -> canvas OPACO. Sin transparencia no hay flash blanco.
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        style={{ background: FALLBACK_BG }}
        onCreated={({ gl }) => {
          gl.setClearColor(FALLBACK_BG, 1);
          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
      >
        <Rig reduced={reduced} minimal={minimal} />
      </Canvas>
    </div>
  );
}
