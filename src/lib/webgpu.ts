/**
 * One WebGPU adapter probe per visit, shared by the layout (to decide whether
 * the 3D chunk is worth downloading at all) and the backdrop itself.
 */
let probe: Promise<boolean> | null = null;

type GpuNavigator = Navigator & { gpu?: { requestAdapter(): Promise<unknown> } };

async function requestAdapter(): Promise<boolean> {
  const gpu = (navigator as GpuNavigator).gpu;
  if (!gpu) return false;
  try {
    return Boolean(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

/** Resolves true only when a real WebGPU adapter is available. */
export function hasWebGPU(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  probe ??= requestAdapter();
  return probe;
}
