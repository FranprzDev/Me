"use client";

/* useFrame muta imperativamente el grafo de three.js (su propósito): el
   análisis de inmutabilidad del compilador de React no aplica a este archivo.
   La siembra aleatoria (Math.random) ocurre una sola vez dentro de useMemo
   para inicializar buffers de partículas/estrellas: es intencional. */
/* eslint-disable react-hooks/immutability, react-hooks/purity */

// Debe ir ANTES de @react-three/fiber: parchea console.warn para silenciar el
// warning de THREE.Clock deprecado que R3F dispara al crear su clock interno.
import "@/lib/silenceR3FClockWarning";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect, type RefObject } from "react";
import * as THREE from "three";
import { getScrollProgress, sectionCenter, bumpWeight } from "@/lib/scroll";
import { getConstellations, type Constellation } from "@/data/constellations";
import { useI18n } from "@/lib/i18n";
import { Nebula, Planet } from "./Cosmos";

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

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isConstrainedDevice(reduced: boolean): boolean {
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

function smoother(x: number, e0: number, e1: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function useReducedMotion() {
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

/** Textura circular suave para que las estrellas se vean redondas y con halo. */
function makeStarTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // Núcleo blanco compacto + halo ancho: reemplaza el glow que dejaba el Bloom.
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.55)");
  g.addColorStop(0.65, "rgba(255,255,255,0.18)");
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
function WarpField({
  velRef,
  reduced,
  performanceMode,
}: {
  velRef: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const { camera } = useThree();
  const N = performanceMode ? 80 : reduced ? 120 : 260;

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
    mat.opacity = 0.7 + Math.min(0.3, warp * 0.7);
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
  performanceMode,
}: {
  data: Constellation;
  starTex: THREE.Texture;
  pRef: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const center = useMemo(() => sectionCenter(data.sectionIndex), [data.sectionIndex]);
  const ambient = data.ambient ?? false;
  const hero = data.hero ?? false;
  // Las ambientales son decorado lejano: menos partículas por nodo (más baratas).
  // `particlesPerNode` permite bajarlo en constelaciones con muchos nodos (palabra).
  const ppn = data.particlesPerNode ?? (
    ambient
      ? performanceMode
        ? 4
        : reduced
          ? 5
          : 10
      : performanceMode
        ? 7
        : reduced
          ? 10
          : 24
  );

  const { group, pointsMat, lineMat, haloMat, geo, home, target, phase, count } = useMemo(() => {
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
      // El hero (CHARLEMOS) dibuja por encima de nebulosa/planeta: es el
      // título de la sección, no decorado de fondo.
      depthTest: !hero,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    const lMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      depthTest: !hero,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    // Halo del hero: segunda capa de puntos más grandes y tenues detrás de las
    // estrellas. Da profundidad y "glow" barato sin Bloom ni engrosar el trazo.
    const hMat = hero
      ? new THREE.PointsMaterial({
          map: starTex,
          color,
          size: 0.55,
          sizeAttenuation: true,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0,
        })
      : null;

    const g = new THREE.Group();
    g.position.set(data.world.x, data.world.y, data.world.z);
    g.scale.setScalar(data.world.scale);
    const lines = new THREE.LineSegments(lineGeo, lMat);
    const points = new THREE.Points(ptsGeo, pMat);
    if (hero && hMat) {
      lines.renderOrder = 20;
      const halo = new THREE.Points(ptsGeo, hMat);
      halo.renderOrder = 19;
      points.renderOrder = 21;
      g.add(halo);
    }
    g.add(lines);
    g.add(points);
    return { group: g, pointsMat: pMat, lineMat: lMat, haloMat: hMat, geo: ptsGeo, home, target, phase, count };
  }, [data, starTex, ppn, hero]);

  useEffect(() => {
    return () => {
      group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose?.();
      });
      pointsMat.dispose();
      lineMat.dispose();
      haloMat?.dispose();
    };
  }, [group, pointsMat, lineMat, haloMat]);

  // Estado dormido: cuando una constelación de sección está lejos de su zona no
  // hace falta tocar sus partículas. Evita ese trabajo una vez apagada.
  const sleeping = useRef(false);

  useFrame(() => {
    // Ambientales: siempre ensambladas (w = 1). El hero ("CHARLEMOS") tiene
    // curva propia: sube de a poco y QUEDA encendida al final del viaje (no se
    // apaga al pasar su centro como las demás). Resto: peso según scroll.
    const pNow = pRef.current;
    const w = ambient
      ? 1
      : hero
        ? smoother(pNow, center - 0.22, Math.min(1, center + 0.06))
        : bumpWeight(pNow, center);

    // Early-out: dormida y ya invisible -> no animamos sus partículas. Con más
    // constelaciones en escena esto recorta CPU del render loop notablemente.
    if (!ambient && !hero && w < 0.002) {
      if (!sleeping.current) {
        pointsMat.opacity = 0;
        lineMat.opacity = 0;
        sleeping.current = true;
      }
      return;
    }
    sleeping.current = false;

    const e = ambient ? 1 : w * w * (3 - 2 * w); // easing del ensamblado
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

    if (ambient) {
      // Decorado lejano: muy tenue y constante, con un leve latido para que no
      // se sienta estático. Nunca compite por la atención.
      const pulse = reduced ? 0 : Math.sin(t * 0.4 + phase[0]) * 0.02;
      pointsMat.opacity = 0.14 + pulse;
      pointsMat.size = 0.14;
      lineMat.opacity = 0.14 + pulse;
    } else if (hero) {
      // Protagonista (la palabra "CHARLEMOS"): brilla como título de la sección,
      // pero con puntos finos para que la palabra se lea, no se empaste.
      // Respiración lenta + halo pulsante: viva sin ser ruidosa.
      const breathe = reduced ? 0 : Math.sin(t * 0.9) * 0.5 + 0.5;
      pointsMat.opacity = 0.14 + (0.52 + 0.1 * breathe) * w;
      pointsMat.size = 0.15 + 0.09 * w;
      lineMat.opacity = 0.9 * e;
      if (haloMat) {
        haloMat.opacity = (0.06 + 0.07 * breathe) * w;
        haloMat.size = 0.5 + 0.08 * breathe;
      }
    } else {
      // Pico de opacidad bajo: quedan de fondo y no compiten con el texto.
      pointsMat.opacity = 0.08 + 0.44 * w;
      pointsMat.size = 0.16 + 0.14 * w;
      lineMat.opacity = 0.32 * e;
    }
  });

  return <primitive object={group} />;
}

function Rig({
  reduced,
  minimal,
  performanceMode,
}: {
  reduced: boolean;
  minimal: boolean;
  performanceMode: boolean;
}) {
  const { scene, camera } = useThree();
  const { lang } = useI18n();
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
    // El canvas es opaco y cubre el viewport: escribir --scene-bg cada frame
    // forzaría un recálculo de estilo de toda la página (fuente de parpadeo
    // junto al backdrop-filter de las tarjetas). El fondo vivo vive sólo acá.
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

  const starCount = reduced ? 900 : 2200;

  return (
    <>
      <ambientLight intensity={0.5} />

      <Nebula pRef={pRef} reduced={reduced} performanceMode={performanceMode} />
      {!performanceMode && <Planet reduced={reduced} pRef={pRef} />}

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

      <WarpField velRef={velRef} reduced={reduced} performanceMode={performanceMode} />

      {/* En modo minimal sólo quedan los puntos viajando, sin constelaciones. */}
      {!minimal &&
        getConstellations(lang).map((c) => (
          <ConstellationGroup
            key={c.id}
            data={c}
            starTex={starTex}
            pRef={pRef}
            reduced={reduced}
            performanceMode={performanceMode}
          />
        ))}

    </>
  );
}

export default function Scene({ minimal = false }: { minimal?: boolean }) {
  const reduced = useReducedMotion();
  const [performanceMode, setPerformanceMode] = useState(() => isConstrainedDevice(reduced));
  const [dpr, setDpr] = useState<[number, number]>(() => (isConstrainedDevice(reduced) ? [1, 1] : [1, 1.5]));
  // Pausamos el loop cuando la pestaña queda oculta: no tiene sentido animar
  // estrellas que nadie ve (ahorra GPU/CPU y batería en segundo plano).
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const onVis = () =>
      setFrameloop(document.visibilityState === "hidden" ? "never" : "always");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    // Los móviles, conexiones con ahorro de datos y equipos con pocos núcleos
    // conservan el fondo 3D, pero usan un perfil más barato de renderizado.
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean };
    }).connection;
    const lowPowerDevice =
      (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
      connection?.saveData === true;

    const apply = () => {
      const small = window.innerWidth < 768;
      const constrained = small || lowPowerDevice || reduced;
      setPerformanceMode(constrained);
      setDpr(constrained ? [1, 1] : [1, 1.5]);
    };
    apply();
    window.addEventListener("resize", apply, { passive: true });
    return () => window.removeEventListener("resize", apply);
  }, [reduced]);

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
        frameloop={frameloop}
        // Debounce del resize: re-mide tras 50ms en lugar de en cada píxel.
        resize={{ scroll: false, debounce: { scroll: 0, resize: 50 } }}
        // alpha:false -> canvas OPACO. Sin transparencia no hay flash blanco.
        gl={{
          antialias: !performanceMode,
          powerPreference: performanceMode ? "low-power" : "high-performance",
          alpha: false,
        }}
        style={{ background: FALLBACK_BG }}
        onCreated={({ gl }) => {
          gl.setClearColor(FALLBACK_BG, 1);
          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        }}
      >
        <Rig
          reduced={reduced}
          minimal={minimal || performanceMode}
          performanceMode={performanceMode}
        />
      </Canvas>
    </div>
  );
}
