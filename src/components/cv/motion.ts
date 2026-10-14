import type { CSSProperties } from "react";

/** Position of a block in the entrance stagger (read by `.cv-rise` in cv.css). */
export function riseStyle(index: number): CSSProperties {
  return { "--cv-rise-index": index } as CSSProperties;
}
