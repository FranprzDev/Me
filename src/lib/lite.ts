/** The visitor asked the browser to save data (Data Saver / Lite mode). */
function saveData(): boolean {
  return (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
}

/**
 * Modo ligero para efectos extra (partículas de cursor, intro, warp): móvil,
 * táctil, pocos núcleos o prefers-reduced-motion. El sitio sigue siendo
 * navegable y bonito, pero sin trabajo extra de CPU/GPU.
 */
export function isLiteMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(hover: none)").matches ||
    window.innerWidth < 768 ||
    saveData() ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
  );
}

/**
 * Whether to skip the WebGPU backdrop entirely (never download its ~420 KB
 * chunk) and keep the static CSS sky: the visitor asked for less motion or
 * less data, or is on a phone-sized touch screen, where the 3D layer is the
 * largest cost of the page for a background the CSS sky already paints.
 */
export function shouldSkipScene(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    saveData() ||
    (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768)
  );
}
