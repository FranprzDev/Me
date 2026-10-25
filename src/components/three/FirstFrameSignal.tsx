"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { SceneStatus, setSceneStatus } from "@/lib/sceneStatus";

/**
 * Reports the scene as ready after its first frames were actually rendered.
 * useFrame runs right before a frame is drawn, so we wait two animation frames
 * past the first tick: by then the renderer has compiled its pipelines and
 * presented real pixels.
 */
export function FirstFrameSignal() {
  const sent = useRef(false);
  useFrame(() => {
    if (sent.current) return;
    sent.current = true;
    requestAnimationFrame(() => requestAnimationFrame(() => setSceneStatus(SceneStatus.Ready)));
  });
  return null;
}
