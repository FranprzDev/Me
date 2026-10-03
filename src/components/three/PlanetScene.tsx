/* useFrame muta imperativamente la cámara y los colores del background de
   three.js: es el propósito de este archivo, la inmutabilidad de React no aplica. */
/* eslint-disable react-hooks/immutability */

import "@/lib/silenceR3FClockWarning";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { WebGPURenderer } from "three/webgpu";
import * as THREE from "three";
import { worldFor, type WorldSpec } from "@/data/worlds";
import {
  StarShell,
  WarpField,
  dampingFactor,
  isConstrainedDevice,
  smoother,
  useReducedMotion,
  useRouteMotion,
} from "./shared";
import { WORLD_SET_PIECES } from "./worlds";
import { PlanetMembrane, cameraDistance, insideProgress } from "./interior";

/** El color de fondo por defecto mientras WebGPU no decide: nunca blanco. */
const FALLBACK_BG = "#050817";

/**
 * Si WebGPU no está o falla al inicializar, el canvas no se monta y queda el
 * respaldo CSS. Montarlo a ciegas dejaría un rectángulo vacío encima del texto.
 */
class RendererFallback extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Cámara de la ruta: entra AL planeta en vez de orbitearlo.
 *
 * La distancia al centro cae de `from` hasta la membrana, la cruza, y después
 * sigue bajando lento mientras la cámara deriva girando. El set piece queda en
 * el centro, así que al terminar estás adentro, con la escena a un brazo de
 * distancia y el cuenco de la membrana rodeándote.
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
  const dir = useMemo(() => new THREE.Vector3(...world.camera.dir).normalize(), [world]);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const spinAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, dt) => {
    const p = progress.current;
    const inside = insideProgress(p);
    const d = cameraDistance(p, world.camera.from, world.shell, world.camera.depth);

    // Adentro la cámara no viaja en riel: gira despacio alrededor del centro.
    const spin = reduced ? 0 : inside * 0.85;
    pos.copy(dir).applyAxisAngle(spinAxis, spin).multiplyScalar(d);
    cam.position.lerp(pos, dampingFactor(dt, 4));
    cam.lookAt(0, 0, 0);

    // Abrir el campo al entrar reinforces la sensación de espacio grande.
    const wantFov = world.camera.fov + inside * 12;
    if (Math.abs(cam.fov - wantFov) > 0.01) {
      cam.fov += (wantFov - cam.fov) * dampingFactor(dt, 3);
      cam.updateProjectionMatrix();
    }
  });

  return null;
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
 * ESCENA DE PLANETA. Una por ruta: el set piece y la atmósfera salen del
 * registro de worlds.ts, y todo lo demás (perf, reduced motion, pausa en
 * segundo plano) se comporta igual que el cosmos del home.
 */
export default function PlanetScene({ slug }: { slug: string }) {
  const world = worldFor(slug);
  const reduced = useReducedMotion();
  const [performanceMode, setPerformanceMode] = useState(() => isConstrainedDevice(reduced));
  const [dpr, setDpr] = useState<[number, number]>(() => (isConstrainedDevice(reduced) ? [1, 1] : [1, 1.5]));
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const [webgpuReady, setWebgpuReady] = useState(false);

  useEffect(() => {
    const onVis = () =>
      setFrameloop(document.visibilityState === "hidden" ? "never" : "always");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const apply = () => {
      const constrained = isConstrainedDevice(reduced);
      setPerformanceMode(constrained);
      setDpr(constrained ? [1, 1] : [1, 1.5]);
    };
    apply();
    window.addEventListener("resize", apply, { passive: true });
    return () => window.removeEventListener("resize", apply);
  }, [reduced]);

  useEffect(() => {
    let active = true;
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (!gpu) return;
    void gpu.requestAdapter().then((adapter) => {
      if (active) setWebgpuReady(Boolean(adapter));
    }).catch(() => {
      if (active) setWebgpuReady(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // Posición inicial: sobre el eje de aproximación, a la distancia de partida.
  // Es el estado en p=0, antes de que el rig tome el control.
  const initialPosition = useMemo(
    () => new THREE.Vector3(...world.camera.dir).normalize().multiplyScalar(world.camera.from),
    [world]
  );

  return (
    <div
      aria-hidden
      data-scene-root=""
      data-world={world.kind}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        // Respaldo sólido: si el canvas no llega a pintar, nunca hay flash blanco.
        background: `var(--scene-bg, ${FALLBACK_BG})`,
      }}
    >
      {webgpuReady && (
        <RendererFallback fallback={null}>
          <Canvas
            camera={{ position: initialPosition, fov: world.camera.fov }}
            dpr={dpr}
            frameloop={frameloop}
            resize={{ scroll: false, debounce: { scroll: 0, resize: 50 } }}
            // alpha:false -> canvas OPACO. Sin transparencia no hay flash blanco.
            gl={async (props) => {
              const renderer = new WebGPURenderer({
                ...props,
                antialias: !performanceMode,
                powerPreference: performanceMode ? "low-power" : "high-performance",
                alpha: false,
              } as ConstructorParameters<typeof WebGPURenderer>[0]);
              await renderer.init();
              return renderer;
            }}
            style={{ background: FALLBACK_BG }}
            onCreated={({ gl }) => {
              gl.setClearColor(FALLBACK_BG, 1);
            }}
          >
            <WorldContents world={world} reduced={reduced} performanceMode={performanceMode} />
          </Canvas>
        </RendererFallback>
      )}
    </div>
  );
}

function WorldContents({
  world,
  reduced,
  performanceMode,
}: {
  world: WorldSpec;
  reduced: boolean;
  performanceMode: boolean;
}) {
  const { progress, velocity } = useRouteMotion();
  const SetPiece = WORLD_SET_PIECES[world.kind];

  // El set piece se revela con el progreso INTERIOR: lo que leés está adentro,
  // y lo que se enciende tiene que coincidir con el texto que estás leyendo.
  const inside = useRef(0);
  useFrame(() => {
    inside.current = insideProgress(progress.current);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight color={world.key.color} intensity={world.key.intensity * 6} position={[0, 4, 5]} />

      <WorldRig world={world} progress={progress} reduced={reduced} />
      <WorldAtmosphere world={world} progress={progress} />

      <SetPiece
        progress={progress}
        inside={inside}
        velocity={velocity}
        reduced={reduced}
        performanceMode={performanceMode}
      />

      {/* Atmósfera compartida: cielo y estelas atados al color del planeta. */}
      <StarShell color={world.tint} reduced={reduced} count={performanceMode ? 600 : 1600} />
      <WarpField
        velocity={velocity}
        reduced={reduced}
        performanceMode={performanceMode}
        color={world.tint}
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
    </>
  );
}