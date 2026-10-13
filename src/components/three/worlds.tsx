/* useFrame muta imperativamente buffers/materiales de three.js (es su propósito):
   la inmutabilidad del compilador de React no aplica a este archivo. La siembra
   aleatoria (Math.random) ocurre una sola vez dentro de useMemo para inicializar
   buffers: es intencional. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, type ReactElement, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dampingFactor } from "./shared";

export interface WorldProps {
  /** Progreso de scroll ya suavizado, 0..1 a lo largo de toda la ruta. */
  progress: RefObject<number>;
  /**
   * Progreso normalizado DENTRO del planeta (0 al cruzar la membrana, 1 al
   * final). Es el que debe gobernar lo que se enciende: el texto que estás
   * leyendo vive acá adentro, no durante el acercamiento.
   */
  inside: RefObject<number>;
  /** Velocidad de scroll suavizada: intensidad del gesto, no de la posición. */
  velocity: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
}

/**
 * ARENA / hackathons — radar de arranque.
 *
 * Un disco polar con retícula concéntrica, un sector de barrido y contactos que
 * se encienden sólo cuando el haz los barre. El barrido NO es tiempo: su ángulo
 * lo empuja el scroll, así que rápido es "el radar acelera" y lento es "te
 * detiene a espiar el terreno".
 */
export function ArenaWorld({ inside, velocity, reduced, performanceMode }: WorldProps) {
  const sweep = useRef<THREE.Mesh>(null);
  const disc = useRef<THREE.Group>(null);
  const blipAngle = useRef(0);

  const COUNT = performanceMode ? 14 : 26;

  // Retícula: anillos concéntricos + ejes cruzados, en líneas aditivas.
  const grid = useMemo(() => {
    const group = new THREE.Group();
    const rings = [1.4, 2.8, 4.2, 5.6];
    for (const r of rings) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(
        new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({
            color: new THREE.Color("#39ff14"),
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        )
      );
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * 5.6, 0, Math.sin(a) * 5.6),
        new THREE.Vector3(-Math.cos(a) * 5.6, 0, -Math.sin(a) * 5.6),
      ]);
      group.add(
        new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({
            color: new THREE.Color("#39ff14"),
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        )
      );
    }
    return group;
  }, []);

  // Sector de barrido: una cuña de 0.52 rad sobre el disco. Los vértices se
  // construyen en cos/sen para que, tras el rotateX, el centro de la cuña caiga
  // sobre el ángulo 0 del plano y coincida con los contactos.
  const wedge = useMemo(() => {
    const shape = new THREE.Shape();
    const half = 0.26;
    for (let i = 0; i <= 24; i++) {
      const a = -half + (i / 24) * half * 2;
      if (i === 0) shape.moveTo(0, 0);
      shape.lineTo(Math.cos(a) * 5.6, Math.sin(a) * 5.6);
    }
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#5cff8a"),
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }, []);

  // Contactos: posiciones fijas, brillo calculado por proximity al haz.
  const blips = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const meta: { angle: number; radius: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + Math.sin(i * 2.7) * 0.4;
      const radius = 1.1 + ((i * 7919) % 100) / 100 * 4.2;
      meta.push({ angle, radius });
      positions.set([Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 7,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { points: new THREE.Points(geo, mat), geo, mat, meta };
  }, [COUNT]);

  useEffect(() => () => {
    grid.children.forEach((c) => {
      (c as THREE.Line).geometry.dispose();
      ((c as THREE.Line).material as THREE.Material).dispose();
    });
    wedge.geometry.dispose();
    (wedge.material as THREE.Material).dispose();
    blips.geo.dispose();
    blips.mat.dispose();
  }, [grid, wedge, blips]);

  useFrame((_, dt) => {
    const p = inside.current;

    // El ángulo del haz avanza con el scroll y, si no hay reduced motion, suma
    // una deriva propia: el radar nunca queda congelado del todo.
    const drift = reduced ? 0 : 0.06;
    const target = p * Math.PI * 6 + drift;
    blipAngle.current += (target - blipAngle.current) * dampingFactor(dt, 3.2);
    if (sweep.current) sweep.current.rotation.y = -blipAngle.current;

    // El disco se levanta hacia la cámara a medida que avanzás: se entra al
    // escenario en vez de mirarlo desde arriba del todo.
    if (disc.current) {
      const tilt = -0.95 + p * 0.42;
      disc.current.rotation.x += (tilt - disc.current.rotation.x) * dampingFactor(dt, 4);
    }

    // Brillo por proximidad al haz, con estela: el contacto acaba de ser
    // iluminado cuando el haz pasó por encima.
    const attr = blips.geo.getAttribute("color") as THREE.BufferAttribute;
    const c = new THREE.Color();
    for (let i = 0; i < blips.meta.length; i++) {
      let d = (blips.meta[i].angle - blipAngle.current) % (Math.PI * 2);
      if (d < 0) d += Math.PI * 2;
      const lit = Math.max(0, 1 - d / 0.75);
      const v = 0.05 + lit * 0.95;
      c.setRGB(0.22 * v + 0.02, 1 * v * (0.35 + lit * 0.65), 0.28 * v + 0.05);
      attr.setXYZ(i, c.r, c.g, c.b);
    }
    attr.needsUpdate = true;
    // Los contactos engordan apenas con la velocidad: el barrido rápido "tensa"
    // el radar. Es el gesto del scroll, no la posición, lo que se siente.
    (blips.mat as THREE.PointsMaterial).size =
      6 + (reduced ? 0 : Math.min(5, velocity.current * 0.6));
  });

  return (
    <group ref={disc} rotation={[-0.95, 0, 0]} position={[0, -1.1, 0]}>
      <primitive object={grid} />
      <group ref={sweep}>
        <primitive object={wedge} />
      </group>
      <primitive object={blips.points} />
    </group>
  );
}

/**
 * AULA / curso-n8n — el programa como anillo.
 *
 * Diez segmentos (uno por módulo) en un anillo inclinado. Cada segmento se
 * enciende cuando el scroll alcanza su módulo, así el objeto 3D y el temario
 * del DOM cuentan la misma historia a la vez.
 */
export function ClassroomWorld({ inside, reduced }: WorldProps) {
  const group = useRef<THREE.Group>(null);
  const MODULES = 10;

  const segments = useMemo(
    () =>
      Array.from({ length: MODULES }, (_, i) => {
        const theta = (i / MODULES) * Math.PI * 2;
        const geo = new THREE.RingGeometry(2.5, 2.86, 28, 1, theta + 0.06, Math.PI * 2 / MODULES - 0.12);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#e9b949"),
          transparent: true,
          opacity: 0.06,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        return { geo, mat };
      }),
    [MODULES]
  );

  // Pista guía: aro fino que cierra el anillo.
  const guide = useMemo(() => {
    const geo = new THREE.TorusGeometry(2.68, 0.012, 6, 128);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffe6b0"),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    // TorusGeometry nace en el plano XY; el anillo vive en XZ.
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }, []);

  useEffect(() => () => {
    segments.forEach((s) => {
      s.geo.dispose();
      s.mat.dispose();
    });
    guide.geometry.dispose();
    (guide.material as THREE.Material).dispose();
  }, [segments, guide]);

  useFrame((_, dt) => {
    const p = inside.current;
    segments.forEach((s, i) => {
      // Umbral del módulo i sobre el progreso total de la ruta.
      const t = (i + 0.35) / MODULES;
      const on = Math.min(1, Math.max(0, (p - t) / 0.06));
      const target = 0.06 + on * 0.62;
      s.mat.opacity += (target - s.mat.opacity) * dampingFactor(dt, 6);
    });
    if (group.current && !reduced) group.current.rotation.y += dt * 0.05;
  });

  return (
    <group ref={group} rotation={[-1.15, 0, 0.2]} position={[0, -0.2, 0]}>
      <primitive object={guide} />
      {segments.map((s, i) => (
        <mesh key={i} geometry={s.geo} material={s.mat} rotation={[-Math.PI / 2, 0, 0]} />
      ))}
    </group>
  );
}

/**
 * ATLAS / projects — globo de plano técnico.
 *
 * Malla geodésica en cian con nodos fijos sobre la esfera. Cada nodo se enciende
 * cuando el giro lo trae hacia la cámara, de modo que el scroll va revelando el
 * mapa: los proyectos aparecen a medida que el globo rota.
 */
export function AtlasWorld({ inside, reduced }: WorldProps) {
  const globe = useRef<THREE.Group>(null);
  const COUNT = 22;

  const shell = useMemo(() => {
    const geo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.1, 2));
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#4fc3f7"),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.LineSegments(geo, mat);
  }, []);

  const nodes = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Distribución tipo Fibonacci: reparte parejo sin agrupar en los polos.
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const a = i * 2.39996;
      positions.set([Math.cos(a) * r * 2.14, y * 2.14, Math.sin(a) * r * 2.14], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 6,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { points: new THREE.Points(geo, mat), geo, mat };
  }, [COUNT]);

  // Dos meridianos: dan lectura de esfera girando sin costo de polígonos.
  const meridians = useMemo(() => {
    const group = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const geo = new THREE.TorusGeometry(2.28, 0.01, 6, 96);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#9adcf7"),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = i * 0.9;
      mesh.rotation.x = 0.4 + i * 0.7;
      group.add(mesh);
    }
    return group;
  }, []);

  useEffect(() => () => {
    shell.geometry.dispose();
    shell.material.dispose();
    nodes.geo.dispose();
    nodes.mat.dispose();
    meridians.children.forEach((c) => {
      const m = c as THREE.Mesh;
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
  }, [shell, nodes, meridians]);

  useFrame((_, dt) => {
    const p = inside.current;
    if (globe.current) {
      const target = p * Math.PI * 2.4 + (reduced ? 0 : 0.2);
      globe.current.rotation.y += (target - globe.current.rotation.y) * dampingFactor(dt, 4);
      globe.current.rotation.x += (-0.25 - globe.current.rotation.x) * dampingFactor(dt, 4);
    }

    // Nodo encendido = mira a cámara. Se recalcula en espacio mundo para que
    // dependa del giro acumulado y no de la orientación local.
    const attr = nodes.geo.getAttribute("color") as THREE.BufferAttribute;
    const pos = nodes.geo.getAttribute("position") as THREE.BufferAttribute;
    const c = new THREE.Color();
    const facing = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      facing.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (globe.current) globe.current.localToWorld(facing);
      facing.normalize();
      const lit = Math.max(0, facing.z * 0.5 + 0.5);
      const v = 0.08 + Math.pow(lit, 2.4) * 0.92;
      c.setRGB(0.3 * v, 0.76 * v, 0.97 * v);
      attr.setXYZ(i, c.r, c.g, c.b);
    }
    attr.needsUpdate = true;
  });

  return (
    <group ref={globe} position={[0, 0, 0]}>
      <primitive object={shell} />
      <primitive object={nodes.points} />
      <primitive object={meridians} />
    </group>
  );
}

/**
 * EXPEDICIÓN / university — bitácora orbital.
 *
 * Un planeta con su ruta y cuatro waypoints, y un VIAJANTE que recorre el anillo
 * conforme bajás. Acá la escena no acompaña: sos el punto que avanza por la
 * bitácora, que es literalmente lo que hace la persona al scrollear.
 */
export function ExpeditionWorld({ inside, reduced, performanceMode }: WorldProps) {
  const group = useRef<THREE.Group>(null);
  const traveler = useRef<THREE.Mesh>(null);
  const WAYPOINTS = 4;

  const planet = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.5, 32, 24);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#1a1440") });
    return new THREE.Mesh(geo, mat);
  }, []);

  // Atmósfera: cáscara aditiva apenas mayor que el cuerpo. El degradado radial
  // simula el fresnel sin necesidad de postprocesado.
  const atmosphere = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.72, 24, 18);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#8f7bff"),
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }, []);

  const route = useMemo(() => {
    const geo = new THREE.TorusGeometry(2.6, 0.014, 6, 128);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#d4c9ff"),
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    // TorusGeometry nace en XY; los waypoints y el viajero están en XZ.
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }, []);

  const waypoints = useMemo(
    () =>
      Array.from({ length: WAYPOINTS }, (_, i) => {
        const a = (i / WAYPOINTS) * Math.PI * 2;
        const geo = new THREE.OctahedronGeometry(0.09, 0);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color("#d4c9ff"),
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6);
        return { mesh, mat, angle: a };
      }),
    [WAYPOINTS]
  );

  const dot = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.055, 12, 10);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }, []);

  useEffect(() => () => {
    planet.geometry.dispose();
    (planet.material as THREE.Material).dispose();
    atmosphere.geometry.dispose();
    (atmosphere.material as THREE.Material).dispose();
    route.geometry.dispose();
    (route.material as THREE.Material).dispose();
    waypoints.forEach((w) => {
      w.mesh.geometry.dispose();
      w.mat.dispose();
    });
    dot.geometry.dispose();
    (dot.material as THREE.Material).dispose();
  }, [planet, atmosphere, route, waypoints, dot]);

  useFrame((_, dt) => {
    const p = inside.current;

    if (group.current && !reduced) group.current.rotation.y += dt * 0.07;

    // El viajero es el scroll: recorre el anillo y deja los waypoints atrás.
    const a = p * Math.PI * 2 * WAYPOINTS;
    if (traveler.current) {
      traveler.current.position.set(Math.cos(a) * 2.6, 0, Math.sin(a) * 2.6);
    }

    // Cada waypoint se enciende justo cuando el viajero pasa por él.
    waypoints.forEach((w) => {
      let d = (a - w.angle) % (Math.PI * 2);
      if (d < 0) d += Math.PI * 2;
      const passed = Math.max(0, 1 - d / 1.2);
      const target = 0.28 + passed * 0.72;
      w.mat.opacity += (target - w.mat.opacity) * dampingFactor(dt, 5);
      const s = 1 + passed * 1.4;
      w.mesh.scale.setScalar(s);
      if (!reduced && !performanceMode) w.mesh.rotation.y += dt * 0.9;
    });

    // La atmósfera respira despacio para que el planeta no se vea estático.
    if (!reduced) {
      (atmosphere.material as THREE.MeshBasicMaterial).opacity =
        0.13 + Math.sin(p * Math.PI * 4) * 0.03;
    }
  });

  return (
    <group rotation={[-0.62, 0, 0.18]} position={[0, -0.1, 0]}>
      <group ref={group}>
        <primitive object={planet} />
        <primitive object={atmosphere} />
      </group>
      <primitive object={route} />
      {waypoints.map((w, i) => (
        <primitive key={i} object={w.mesh} />
      ))}
      <primitive ref={traveler} object={dot} />
    </group>
  );
}

/**
 * DOSSIER — escena neutra para un planeta sin set piece propio. No pretende
 * competir con las anteriores: sólo que la ruta nunca tenga un fondo vacío.
 */
export function DossierWorld({ inside, reduced }: WorldProps) {
  const group = useRef<THREE.Group>(null);

  const core = useMemo(() => {
    const geo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.5, 1));
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#cfc4ff"),
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.LineSegments(geo, mat);
  }, []);

  useEffect(() => () => {
    core.geometry.dispose();
    core.material.dispose();
  }, [core]);

  useFrame((_, dt) => {
    if (!group.current) return;
    const p = inside.current;
    const target = p * Math.PI * 2;
    group.current.rotation.y += (target - group.current.rotation.y) * dampingFactor(dt, 4);
    if (!reduced) group.current.rotation.x = Math.sin(p * Math.PI * 2) * 0.35;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={core} />
    </group>
  );
}

export const WORLD_SET_PIECES: Record<string, (props: WorldProps) => ReactElement> = {
  arena: ArenaWorld,
  classroom: ClassroomWorld,
  atlas: AtlasWorld,
  expedition: ExpeditionWorld,
  dossier: DossierWorld,
};