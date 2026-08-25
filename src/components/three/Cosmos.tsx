"use client";

/* useFrame muta imperativamente uniforms/geometrías de three.js (su propósito):
   la inmutabilidad del compilador de React no aplica a este archivo. La siembra
   aleatoria y las mutaciones de uniforms ocurren una sola vez / por frame. */
/* eslint-disable react-hooks/immutability */

/* Shaders de la capa cósmica: nebulosa procedural (fbm en esfera invertida) y
   planeta con atmósfera fresnel. Todo procedural: 0 KB de assets. */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

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
    // Fade-out hacia la sección Contacto: el planeta no debe competir con
    // CHARLEMOS, que es el protagonista del clímax del viaje.
    const t = Math.min(1, Math.max(0, (pRef.current - 0.68) / 0.22));
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
