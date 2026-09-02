"use client";

/* useFrame muta imperativamente uniforms/geometrías de three.js (su propósito):
   la inmutabilidad del compilador de React no aplica a este archivo. La siembra
   aleatoria y las mutaciones de uniforms ocurren una sola vez / por frame. */
/* eslint-disable react-hooks/immutability */

/* Shaders de la capa cósmica: nebulosa procedural (fbm en esfera invertida) y
   planeta con atmósfera fresnel. Todo procedural: 0 KB de assets. */
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { PROJECTS, type PlanetSpec } from "@/data/projects";
import { bumpWeight, measuredSectionCenter } from "@/lib/scroll";
import { getActiveProject, getSlideDirection } from "@/lib/projectFocus";
import { useRouter } from "next/navigation";

const NOISE_GLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`;

const NEBULA_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function nebulaFrag(octaves: number) {
  return /* glsl */ `
    precision mediump float;
    #define OCTAVES ${octaves}
    varying vec3 vDir;
    uniform float uTime;
    uniform float uScroll;
    uniform float uIntensity;
    ${NOISE_GLSL}

    void main() {
      vec3 dir = normalize(vDir);
      // Deriva temporal lentísima + empuje por scroll.
      vec3 q = dir * 3.2;
      q.y += uScroll * 1.4;
      q += vec3(uTime * 0.008, uTime * 0.005, 0.0);
      float n = fbm(q);
      float n2 = fbm(q * 2.1 + vec3(4.7));
      float clouds = smoothstep(0.42, 0.85, n * 0.72 + n2 * 0.38);

      vec3 deep   = vec3(0.02, 0.03, 0.09);
      vec3 blue   = vec3(0.10, 0.20, 0.62);   // --space
      vec3 violet = vec3(0.24, 0.16, 0.55);   // --space-2
      vec3 gold   = vec3(0.91, 0.76, 0.44);   // --star

      vec3 col = mix(deep, blue, smoothstep(0.15, 0.7, n));
      col = mix(col, violet, clouds * 0.75);
      col += gold * pow(clouds, 6.0) * 0.22; // núcleos cálidos muy raros
      gl_FragColor = vec4(col * uIntensity, 1.0);
    }
  `;
}

export function Nebula({
  pRef,
  reduced,
  performanceMode,
}: {
  pRef: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERT,
        fragmentShader: nebulaFrag(performanceMode ? 3 : 5),
        uniforms: {
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uIntensity: { value: reduced ? 0.35 : 0.55 },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [reduced, performanceMode]
  );

  const geo = useMemo(() => new THREE.SphereGeometry(70, 32, 24), []);

  useFrame((_, dt) => {
    mat.uniforms.uScroll.value = pRef.current;
    if (!reduced) mat.uniforms.uTime.value += dt;
  });

  useMemo(() => () => {
    mat.dispose();
    geo.dispose();
  }, [mat, geo]);

  return <mesh geometry={geo} material={mat} renderOrder={-10} frustumCulled={false} />;
}

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const ATMO_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vNormal;
  varying vec3 vView;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;
void main() {
  float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.4);
  vec3 col = mix(uColorA, uColorB, rim);
  gl_FragColor = vec4(col, rim * 0.85 * uOpacity);
}
`;

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

  const { bodyMat, atmoMat, ringMat, geo, atmoGeo, ringGeo } = useMemo(() => {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#131f3d"),
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
    });
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: {
        uColorA: { value: new THREE.Color("#5b8cff") },
        uColorB: { value: new THREE.Color("#c9b6ff") },
        uOpacity: { value: 1 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
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
      ringMat,
      geo: new THREE.SphereGeometry(1, 48, 32),
      atmoGeo: new THREE.SphereGeometry(1.18, 48, 32),
      ringGeo: new THREE.RingGeometry(1.45, 2.15, 96),
    };
  }, []);

  useMemo(
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
    atmoMat.uniforms.uOpacity.value = f;
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
  const { camera } = useThree();
  const router = useRouter();
  // Slide: 0 = fuera de escena, 1 = en el centro del escenario.
  const slideRef = useRef(0);
  // Hover: el planeta "respira" un poco más grande bajo el puntero.
  const hoverRef = useRef(0);
  const hoverTarget = useRef(0);

  const { bodyMat, atmoMat, ringMat, geo, atmoGeo, ringGeo, hitGeo, hitMat } = useMemo(() => {
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
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: {
        uColorA: { value: new THREE.Color(spec.atmoA) },
        uColorB: { value: new THREE.Color(spec.atmoB) },
        uOpacity: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
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

  useMemo(
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
    group.current.scale.setScalar(spec.radius * 1.82 * (1 + 0.06 * hoverRef.current));

    const f = inSection * s;
    bodyMat.opacity = f;
    atmoMat.uniforms.uOpacity.value = f * (0.85 + 0.15 * hoverRef.current);
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
