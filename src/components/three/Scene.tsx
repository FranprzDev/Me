"use client";

/* useFrame muta imperativamente el grafo de three.js (su propósito): el
   análisis de inmutabilidad del compilador de React no aplica a este archivo.
   La siembra aleatoria (Math.random) ocurre una sola vez dentro de useMemo
   para inicializar buffers de partículas/estrellas: es intencional. */
/* eslint-disable react-hooks/immutability, react-hooks/purity */

// Debe ir ANTES de @react-three/fiber: parchea console.warn para silenciar el
// warning de THREE.Clock deprecado que R3F dispara al crear su clock interno.
import "@/lib/silenceR3FClockWarning";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect, type RefObject } from "react";
import * as THREE from "three";
import { getScrollProgress, measuredSectionCenter, bumpWeight } from "@/lib/scroll";
import { getConstellations, type Constellation } from "@/data/constellations";
import { useI18n } from "@/lib/i18n";
import { Nebula, Planet } from "./Cosmos";
import { DecorSide, StarShell, WarpField, clearOfContentX, dampingFactor, smoother } from "./shared";

// Familia de color del nebulón: todo dentro del "espacio" (índigos/violetas
// oscuros). No son mundos distintos, sólo un leve cambio de humor por profundidad.
const C_BG_A = new THREE.Color("#050817"); // despegue
const C_BG_B = new THREE.Color("#0a0a22"); // medio (matiz violeta)
const C_BG_C = new THREE.Color("#070b1d"); // fondo profundo
const tmpColor = new THREE.Color();

/**
 * Constelación que se ENSAMBLA con partículas: miles de chispas dispersas vuelan
 * y se juntan formando la figura cuando entrás en su sección (peso w → 1), y se
 * dispersan al salir. Las líneas se dibujan una vez ensambladas. Ése es el
 * "momento firma".
 */
function ConstellationGroup({
  data,
  pRef,
  reduced,
  performanceMode,
}: {
  data: Constellation;
  pRef: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const center = useMemo(() => measuredSectionCenter(data.sectionIndex), [data.sectionIndex]);
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

  const { group, pointsMat, lineMat, haloMat, geo, home, target, phase, count, extent } = useMemo(() => {
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
    // Horizontal half-extent in world units, including the scattered sparks.
    let maxNodeX = 0;
    for (const [nx] of data.nodes) maxNodeX = Math.max(maxNodeX, Math.abs(nx));
    const extent = (maxNodeX + 0.6) * data.world.scale;
    return { group: g, pointsMat: pMat, lineMat: lMat, haloMat: hMat, geo: ptsGeo, home, target, phase, count, extent };
  }, [data, ppn, hero]);

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

  useFrame((state) => {
    // Side decor stays beside the centred copy on any aspect ratio; the
    // centred "CHARLEMOS" title keeps its own placement.
    if (!hero) {
      group.position.x = clearOfContentX(
        state.camera as THREE.PerspectiveCamera,
        state.size.width,
        data.world.z,
        data.world.x < 0 ? DecorSide.Left : DecorSide.Right,
        extent,
        data.world.x
      );
    }
    // Ambientales: siempre ensambladas (w = 1). El hero ("CHARLEMOS") tiene
    // curva propia: sube de a poco y QUEDA encendida al final del viaje (no se
    // apaga al pasar su centro como las demás). Resto: peso según scroll.
    const pNow = pRef.current;
    const w = ambient
      ? 1
      : hero
        ? // Arranca tarde (apenas antes de su sección): no debe invadir la
          // cola de Proyectos, donde viven los planetas del slider.
          smoother(pNow, center - 0.12, Math.min(1, center + 0.04))
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
  const fog = useMemo(() => new THREE.FogExp2(C_BG_A.getHex(), 0.018), []);
  const background = useMemo(() => C_BG_A.clone(), []);
  const starCount = reduced ? 900 : 2200;
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
  }, [scene, fog, background]);

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

    // Cámara: viaja hacia el fondo del cosmos (-z) con leve parallax.
    const targetZ = 6 - p * 8; // 6 -> -2
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    const tx = Math.sin(p * Math.PI * 2) * 0.5;
    const ty = 0.25 - p * 0.5;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.position.y += (ty - camera.position.y) * 0.05;
    camera.lookAt(0, 0, camera.position.z - 9);
  });

  return (
    <>
      <ambientLight intensity={0.5} />

      <Nebula pRef={pRef} reduced={reduced} performanceMode={performanceMode} />
      {!performanceMode && <Planet pRef={pRef} />}

      <StarShell count={starCount} reduced={reduced} spin={0.006} opacity={0.85} />

      <WarpField velocity={velRef} reduced={reduced} performanceMode={performanceMode} />

      {/* En modo minimal sólo quedan los puntos viajando, sin constelaciones. */}
      {!minimal &&
        getConstellations(lang).map((c) => (
          <ConstellationGroup
            key={c.id}
            data={c}
            pRef={pRef}
            reduced={reduced}
            performanceMode={performanceMode}
          />
        ))}

    </>
  );
}

/**
 * Home cosmos contents, rendered inside the persistent backdrop canvas. On
 * mount it re-frames the shared camera (a world page may have moved it), so
 * returning home never sweeps across the scene.
 */
export function CosmosContents({
  reduced,
  minimal,
  performanceMode,
}: {
  reduced: boolean;
  minimal: boolean;
  performanceMode: boolean;
}) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    camera.position.set(0, 0.3, 6);
    camera.fov = 60;
    camera.updateProjectionMatrix();
  }, [camera]);
  return <Rig reduced={reduced} minimal={minimal} performanceMode={performanceMode} />;
}
