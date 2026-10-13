"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface TrajectoryNode {
  /** DOM id of the section or entry this node stands for. */
  id: string;
  label: string;
  meta?: string;
}

/** Path coordinates live in a 100 x 1000 box; the SVG stretches to the rail. */
const BOX_W = 100;
const BOX_H = 1000;
const PAD_Y = 40;
/** Viewport line (fraction of its height) where an entry counts as "reached". */
const ANCHOR = 0.45;

type Point = { x: number; y: number };

function nodePoints(count: number): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    // A gentle orbit-like sway, the same drifting route as the education badge.
    return { x: 50 + Math.sin(i * 1.25 + 0.6) * 26, y: PAD_Y + t * (BOX_H - PAD_Y * 2) };
  });
}

/** Smooth cubic path through every node (Catmull-Rom converted to Béziers). */
function segmentPaths(points: Point[]): string[] {
  const segments: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    segments.push(`C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`);
  }
  return segments;
}

/**
 * Scroll-driven trajectory: the education page's route turned into the
 * storytelling device of every world page. Each entry of the page is a node on
 * a drifting path; as the reader scrolls, the path draws itself, a marker
 * travels from node to node and the node whose entry is in view lights up.
 *
 * Purely decorative (aria-hidden, no pointer events): the entries themselves
 * carry the content and the semantics. With prefers-reduced-motion the path is
 * drawn in full and the marker is hidden; nodes still light up without motion.
 */
export function ScrollTrajectory({ nodes }: { nodes: TrajectoryNode[] }) {
  const points = useMemo(() => nodePoints(nodes.length), [nodes.length]);
  const segments = useMemo(() => segmentPaths(points), [points]);
  const d = points.length ? `M${points[0].x} ${points[0].y}${segments.join("")}` : "";
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const [lit, setLit] = useState(-1);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const path = pathRef.current;
    const glow = glowRef.current;
    if (!path || !glow || nodes.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Arc length at each node, measured once on a scratch path.
    const total = path.getTotalLength();
    const scratch = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const lengths = points.map((p, i) => {
      if (i === 0) return 0;
      scratch.setAttribute("d", `M${points[0].x} ${points[0].y}${segments.slice(0, i).join("")}`);
      return scratch.getTotalLength();
    });
    glow.style.strokeDasharray = `${total}`;

    let shown = reduced ? total : 0;
    let target = 0;
    let raf = 0;
    let last = performance.now();
    let lastLit = -2;
    let lastActive = -2;

    const measure = () => {
      const anchor = window.innerHeight * ANCHOR;
      const tops = nodes.map((node) => document.getElementById(node.id)?.getBoundingClientRect().top ?? Number.NaN);
      // Fractional node index: which pair of entries the anchor line is between.
      let f = -1;
      for (let i = 0; i < tops.length; i++) {
        if (Number.isNaN(tops[i]) || tops[i] > anchor) break;
        const next = tops[i + 1];
        f = i + (next === undefined || Number.isNaN(next) ? 0 : Math.min(1, (anchor - tops[i]) / Math.max(1, next - tops[i])));
      }
      const index = Math.floor(f);
      target = f < 0 ? 0 : index >= nodes.length - 1 ? total : lengths[index] + (lengths[index + 1] - lengths[index]) * (f - index);
      const nextLit = Math.min(nodes.length - 1, index);
      const nextActive = f < 0 ? -1 : Math.min(nodes.length - 1, Math.round(f));
      if (nextLit !== lastLit) setLit((lastLit = nextLit));
      if (nextActive !== lastActive) setActive((lastActive = nextActive));
    };

    const paint = () => {
      glow.style.strokeDashoffset = `${total - shown}`;
      const marker = markerRef.current;
      const rail = marker?.parentElement;
      if (marker && rail) {
        const p = path.getPointAtLength(shown);
        marker.style.transform = `translate(${(p.x / BOX_W) * rail.clientWidth}px, ${(p.y / BOX_H) * rail.clientHeight}px)`;
      }
    };

    // Frame-rate independent easing towards the scroll target; the loop stops
    // as soon as it settles, so an idle page costs nothing.
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      shown += (target - shown) * (1 - Math.exp(-dt * 9));
      if (Math.abs(target - shown) < 0.2) shown = target;
      paint();
      raf = shown === target ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      measure();
      if (reduced) return;
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    measure();
    if (!reduced) shown = target;
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [nodes, points, segments]);

  if (nodes.length === 0) return null;

  return (
    <aside className="trajectory" aria-hidden="true">
      <div className="trajectory__rail">
        <svg viewBox={`0 0 ${BOX_W} ${BOX_H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="trajectory-glow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--planet-2, #f3c779)" />
              <stop offset="1" stopColor="var(--planet, #8f7bff)" />
            </linearGradient>
          </defs>
          <path ref={pathRef} className="trajectory__base" d={d} vectorEffect="non-scaling-stroke" />
          <path ref={glowRef} className="trajectory__glow" d={d} vectorEffect="non-scaling-stroke" />
        </svg>
        {nodes.map((node, i) => (
          <span
            key={node.id}
            className={`trajectory__node${i <= lit ? " is-lit" : ""}${i === active ? " is-active" : ""}`}
            style={{ left: `${points[i].x}%`, top: `${(points[i].y / BOX_H) * 100}%` }}
          >
            <i />
            <span className="trajectory__label">
              {node.meta && <small>{node.meta}</small>}
              {node.label}
            </span>
          </span>
        ))}
        <span ref={markerRef} className="trajectory__marker" />
      </div>
    </aside>
  );
}
