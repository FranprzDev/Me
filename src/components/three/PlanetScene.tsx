/* useFrame muta imperativamente la cámara y los colores del background de
   three.js: es el propósito de este archivo, la inmutabilidad de React no aplica. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { WorldSpec } from "@/data/worlds";
import { StarShell, WarpField, dampingFactor, orbitTime, smoother, useRouteMotion } from "./shared";
import { WORLD_SET_PIECES } from "./worlds";
import { PlanetMembrane, cameraDistance, insideProgress } from "./interior";

/** Camera orbit around the planet: rad per orbit-clock second, and its tilt. */
const CAMERA_ORBIT_SPEED = 0.045;
const ORBIT_AXIS = new THREE.Vector3(0.22, 1, 0.08).normalize();
const SPIN_AXIS = new THREE.Vector3(0, 1, 0);
const tmpDir = new THREE.Vector3();

/**
 * One ambient and one key light shared by every world. The renderer compiles a
 * lit material per light instance, so reusing the same two lights is what lets
 * the idle warm-up (warmup.tsx) compile the moon exactly as a visit draws it.
 * Colour and intensity are uniforms: changing them per world costs nothing.
 */
export const WORLD_AMBIENT_LIGHT = new THREE.AmbientLight(0xffffff, 0.5);
export const WORLD_KEY_LIGHT = new THREE.PointLight();

/**
 * Where the camera sits at scroll progress `p`: on the approach axis, swung
 * around the planet by the shared orbit clock (a slow, slightly inclined
 * orbit), then drifting around the centre once inside.
 */
function worldCameraPosition(world: WorldSpec, p: number, reduced: boolean, out = new THREE.Vector3()) {
  const inside = insideProgress(p);
  const d = cameraDistance(p, world.camera.from, world.shell, world.camera.depth);
  const spin = reduced ? 0 : inside * 0.85;
  tmpDir.set(...world.camera.dir).normalize().applyAxisAngle(ORBIT_AXIS, orbitTime() * CAMERA_ORBIT_SPEED);
  return out.copy(tmpDir).applyAxisAngle(SPIN_AXIS, spin).multiplyScalar(d);
}

/**
 * Cámara de la ruta: entra AL planeta mientras lo orbita.
 *
 * La distancia al centro cae de `from` hasta la membrana, la cruza, y después
 * sigue bajando lento mientras la cámara deriva girando. El set piece queda en
 * el centro, así que el planeta siempre queda encuadrado mientras orbita.
 */
function WorldRig({
  world,
  progress,
  reduced,
}: {
  world: WorldSpec;
  progress: RefObject<number>;
  reduced: boolean;
}) {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const p = progress.current;
    const inside = insideProgress(p);
    worldCameraPosition(world, p, reduced, pos);
    cam.position.lerp(pos, dampingFactor(dt, 4));
    cam.lookAt(0, 0, 0);

    // Abrir el campo al entrar refuerza la sensación de espacio grande.
    const wantFov = world.camera.fov + inside * 12;
    if (Math.abs(cam.fov - wantFov) > 0.01) {
      cam.fov += (wantFov - cam.fov) * dampingFactor(dt, 3);
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * The planet turns on its own axis (the membrane and the set piece inside it)
 * and carries a small moon on an inclined, slightly elliptical orbit. Both run
 * on the shared orbit clock, so they are frame-rate independent and continue
 * where they were after a route change.
 */
function PlanetSpin({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y = orbitTime() * 0.05;
  });
  return <group ref={group}>{children}</group>;
}

function WorldMoon({ world }: { world: WorldSpec }) {
  const moon = useRef<THREE.Mesh>(null);
  const { geo, mat } = useMemo(
    () => ({
      geo: new THREE.SphereGeometry(world.shell * 0.09, 24, 16),
      mat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(world.tint).multiplyScalar(0.55),
        emissive: new THREE.Color(world.tint),
        emissiveIntensity: 0.25,
        roughness: 0.9,
      }),
    }),
    [world]
  );
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  useFrame(() => {
    if (!moon.current) return;
    const a = orbitTime() * 0.32;
    const r = world.shell * 1.55;
    // Ellipse (a = 1.55 shell, b = 1.25 shell) tilted ~17° off the equator.
    moon.current.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.3, Math.sin(a) * r * 0.8);
    moon.current.rotation.y = orbitTime() * 0.4;
  });
  return <mesh ref={moon} geometry={geo} material={mat} />;
}

/**
 * Fondo, niebla y parallax de color: el viaje de la página va cambiando el tono
 * del vacío, igual que en el cosmos del home pero dentro de la familia del
 * planeta.
 */
function WorldAtmosphere({
  world,
  progress,
}: {
  world: WorldSpec;
  progress: RefObject<number>;
}) {
  const { scene } = useThree();
  const a = useMemo(() => new THREE.Color(world.bg[0]), [world]);
  const b = useMemo(() => new THREE.Color(world.bg[1]), [world]);
  const tmp = useMemo(() => new THREE.Color(), []);
  const background = useMemo(() => new THREE.Color(world.bg[0]), [world]);
  const fog = useMemo(
    () => new THREE.FogExp2(new THREE.Color(world.fog.color).getHex(), world.fog.density),
    [world]
  );

  useEffect(() => {
    scene.fog = fog;
    scene.background = background;
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--scene-bg", `#${background.getHexString()}`);
    }
  }, [scene, fog, background]);

  useFrame((_, dt) => {
    tmp.copy(a).lerp(b, smoother(progress.current, 0, 1));
    background.lerp(tmp, dampingFactor(dt, 5));
  });

  return null;
}

/**
 * The visible parts of a world: set piece, membrane, moon and sky. The
 * live route scene and the idle warm-up (warmup.tsx) render the same body, so
 * the warm-up compiles exactly the materials a visit will draw.
 */
export function WorldBody({
  world,
  progress,
  velocity,
  reduced,
  performanceMode,
}: {
  world: WorldSpec;
  progress: RefObject<number>;
  velocity: RefObject<number>;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const SetPiece = WORLD_SET_PIECES[world.kind];

  // El set piece se revela con el progreso INTERIOR: lo que leés está adentro,
  // y lo que se enciende tiene que coincidir con el texto que estás leyendo.
  const inside = useRef(0);
  useFrame(() => {
    inside.current = insideProgress(progress.current);
  });

  return (
    <>
      <PlanetSpin>
        <SetPiece
          progress={progress}
          inside={inside}
          velocity={velocity}
          reduced={reduced}
          performanceMode={performanceMode}
        />

        {/* La membrana: la superficie que se cruza al entrar al planeta. */}
        <PlanetMembrane
          shell={world.shell}
          colorA={world.tint}
          colorB={world.key.color}
          progress={progress}
          reduced={reduced}
          performanceMode={performanceMode}
        />
      </PlanetSpin>
      <WorldMoon world={world} />

      {/* Atmósfera compartida: cielo y estelas atados al color del planeta. */}
      <StarShell color={world.tint} reduced={reduced} count={performanceMode ? 600 : 1600} />
      <WarpField
        velocity={velocity}
        reduced={reduced}
        performanceMode={performanceMode}
        color={world.tint}
      />
    </>
  );
}

/**
 * ESCENA DE PLANETA, rendered inside the persistent backdrop canvas: the set
 * piece and atmosphere come from worlds.ts. On mount it snaps the shared camera
 * to this world's approach (where the home cosmos left it is meaningless here).
 */
export function WorldContents({
  world,
  reduced,
  performanceMode,
}: {
  world: WorldSpec;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const { progress, velocity } = useRouteMotion();
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    camera.position.copy(worldCameraPosition(world, 0, reduced));
    camera.fov = world.camera.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
  }, [camera, world, reduced]);

  return (
    <>
      <primitive object={WORLD_AMBIENT_LIGHT} />
      <primitive
        object={WORLD_KEY_LIGHT}
        color={world.key.color}
        intensity={world.key.intensity * 6}
        position={[0, 4, 5]}
      />
      <WorldRig world={world} progress={progress} reduced={reduced} />
      <WorldAtmosphere world={world} progress={progress} />
      <WorldBody
        world={world}
        progress={progress}
        velocity={velocity}
        reduced={reduced}
        performanceMode={performanceMode}
      />
    </>
  );
}
