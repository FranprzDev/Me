"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";
import { ME } from "@/data/me";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

// Stage geometry (SVG viewBox 900 x 600).
const CX = 300;
const CY = 300;
const RINGS = [260, 205, 150, 95]; // outer -> core
const RING_FILL = ["#0e2b6e", "#1640a8", "#2457d6", "#e7edf6"];
// Label tops (in % of stage height) and the y where each leader line lands.
const LABEL_TOPS = [2, 27, 52, 77];
const LINE_Y = LABEL_TOPS.map((t) => ((t + 21) / 100) * 600);
const LABEL_X = 0.53 * 900;
// One anchor per layer, inside its own ring band (core first = "Model").
const ANCHORS = [
  { r: 55, deg: 200 },
  { r: 122, deg: 168 },
  { r: 177, deg: 145 },
  { r: 232, deg: 125 },
].map(({ r, deg }) => ({
  x: CX + r * Math.cos((deg * Math.PI) / 180),
  y: CY + r * Math.sin((deg * Math.PI) / 180),
}));

function subscribeMedia(cb: () => void) {
  const a = window.matchMedia("(max-width: 819px)");
  const b = window.matchMedia("(prefers-reduced-motion: reduce)");
  a.addEventListener("change", cb);
  b.addEventListener("change", cb);
  return () => {
    a.removeEventListener("change", cb);
    b.removeEventListener("change", cb);
  };
}
const getStatic = () =>
  window.matchMedia("(max-width: 819px)").matches ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll-pinned section: a sphere wrapped in an orbiting label opens into a
 * cross-section whose rings are the layers of an agent. On small screens or
 * with reduced motion it renders the final, opened state as a static block.
 */
export function MeLayers() {
  const { tl } = useI18n();
  const isStatic = useSyncExternalStore(subscribeMedia, getStatic, () => false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isStatic) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      if (geomDirty) {
        const rect = el.getBoundingClientRect();
        // Absolute document position: -rect.top === window.scrollY - geomTop.
        geomTop = rect.top + window.scrollY;
        geomHeight = el.offsetHeight;
        geomDirty = false;
      }
      const total = geomHeight - window.innerHeight;
      setProgress(clamp((window.scrollY - geomTop) / Math.max(1, total)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    // Section geometry is measured once per invalidation instead of every
    // scroll frame (those per-frame gBR/offsetHeight reads forced sync
    // layouts while scrolling). Size changes are caught by observing the
    // section itself; position shifts caused by siblings are caught by
    // observing body; viewport changes by resize/orientationchange.
    let geomTop = 0;
    let geomHeight = 0;
    let geomDirty = true;
    const invalidateGeom = () => {
      geomDirty = true;
    };
    const onResize = () => {
      invalidateGeom();
      onScroll();
    };
    update();
    const geomObserver = new ResizeObserver(invalidateGeom);
    if (sectionRef.current) geomObserver.observe(sectionRef.current);
    geomObserver.observe(document.body);
    document.fonts?.ready.then(invalidateGeom).catch(() => {});
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      geomObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isStatic]);

  const p = isStatic ? 1 : progress;
  const intro = 1 - ease(clamp((p - 0.06) / 0.16));
  const open = ease(clamp((p - 0.14) / 0.22));
  const labelIn = (i: number) => ease(clamp((p - (0.36 + i * 0.13)) / 0.1));

  const sphereX = lerp(450, CX, open);
  const crossScale = lerp(0.5, 1, open);
  const orbit = tl(ME.layers.orbit);
  const orbitText = Array.from({ length: 6 }, () => `${orbit} ·`).join(" ");

  return (
    <section
      ref={sectionRef}
      className={`me-layers ${isStatic ? "is-static" : ""}`}
      aria-labelledby="me-layers-title"
    >
      <div className="me-layers-sticky">
        <div className="me-grid-bg" aria-hidden />
        <div
          className="me-layers-intro"
          style={isStatic ? undefined : { opacity: intro, transform: `translateY(${(1 - intro) * -40}px)` }}
        >
          <h2 id="me-layers-title" className="me-display me-display-md">
            {tl(ME.layers.title)}
          </h2>
          <p className="me-layers-body">{tl(ME.layers.body)}</p>
        </div>

        <div className="me-layers-stage">
          <svg
            viewBox={isStatic ? "-95 30 540 540" : "0 0 900 600"}
            className="me-layers-svg" role="img" aria-label={tl(ME.layers.title)}>
            <defs>
              <radialGradient id="me-sphere-fill" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#4f8bff" />
                <stop offset="55%" stopColor="#1f5ee8" />
                <stop offset="100%" stopColor="#0c2f8a" />
              </radialGradient>
              <clipPath id="me-left-half">
                <rect x="0" y="0" width={CX} height="600" />
              </clipPath>
              <path id="me-orbit-path" d="M 450 115 a 185 185 0 1 1 -0.1 0" />
            </defs>

            {/* Closed sphere with its orbiting label */}
            {!isStatic && open < 1 ? (
              <g
                style={{
                  opacity: 1 - open,
                  transform: `translate(${sphereX - 450}px, ${lerp(60, 0, open)}px) scale(${lerp(0.82, 1.1, open)})`,
                  transformOrigin: "450px 300px",
                }}
              >
                <g className="me-orbit">
                  <text className="me-orbit-text">
                    <textPath href="#me-orbit-path" startOffset="0">
                      {orbitText}
                    </textPath>
                  </text>
                </g>
                <circle cx="450" cy="300" r="150" fill="url(#me-sphere-fill)" />
                <g fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1">
                  <ellipse cx="450" cy="300" rx="150" ry="42" />
                  <ellipse cx="450" cy="300" rx="62" ry="150" />
                  <ellipse cx="450" cy="300" rx="118" ry="150" />
                  <line x1="300" y1="300" x2="600" y2="300" stroke="rgba(255,255,255,0.45)" />
                </g>
              </g>
            ) : null}

            {/* Opened cross-section */}
            <g
              style={{
                opacity: open,
                transform: `scale(${crossScale})`,
                transformOrigin: `${CX}px ${CY}px`,
              }}
            >
              <g clipPath="url(#me-left-half)">
                {RINGS.map((r, i) => (
                  <circle
                    key={r}
                    cx={CX}
                    cy={CY}
                    r={r}
                    fill={RING_FILL[i]}
                    stroke="rgba(160,190,255,0.35)"
                    strokeWidth="1"
                  />
                ))}
              </g>
              <rect x={CX - 1} y={CY - 260} width="10" height="520" fill="#0a2462" rx="3" />
            </g>

            {/* Leader lines */}
            <g className="me-leaders" stroke="rgba(170,195,255,0.55)" strokeWidth="1" fill="none">
              {ANCHORS.map((a, i) => {
                const t = labelIn(i);
                const len = 900;
                return (
                  <g key={i} style={{ opacity: t > 0 ? 1 : 0 }}>
                    <polyline
                      points={`${a.x},${a.y} ${LABEL_X},${LINE_Y[i]} 880,${LINE_Y[i]}`}
                      strokeDasharray={len}
                      strokeDashoffset={len * (1 - t)}
                    />
                    <circle cx={a.x} cy={a.y} r="3.5" fill="#cfe0ff" stroke="none" />
                  </g>
                );
              })}
            </g>
          </svg>

          <ol className="me-layers-labels">
            {ME.layers.items.map((item, i) => {
              const t = labelIn(i);
              return (
                <li
                  key={item.title.en}
                  className="me-layer-label"
                  style={
                    isStatic
                      ? undefined
                      : {
                          top: `${LABEL_TOPS[i]}%`,
                          opacity: t,
                          transform: `translateY(${(1 - t) * 14}px)`,
                        }
                  }
                >
                  <span className="me-mono me-layer-num">0{i + 1}</span>
                  <h3 className="me-layer-title">{tl(item.title)}</h3>
                  <p className="me-layer-body">{tl(item.body)}</p>
                </li>
              );
            })}
          </ol>
        </div>

        {!isStatic ? (
          <p className="me-mono me-layers-hint" style={{ opacity: intro }}>
            {tl(ME.layers.hint)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
