"use client";

import { useMemo, type CSSProperties } from "react";
import { buildWord } from "@/data/glyphs";
import { CV } from "@/data/cv";
import { useI18n } from "@/lib/i18n";

/**
 * Contactos como CONSTELACIONES clickeables. En vez de tarjetas de vidrio, cada
 * medio (Email · LinkedIn · WhatsApp) es su palabra escrita en estrellas (la
 * misma "fuente de trazos" que dibuja CHARLEMOS), envuelta en un <a> real:
 * accesible, responsive y sin depender del canvas 3D (que está detrás con
 * pointer-events:none). Al pasar el mouse, la constelación se enciende.
 */

const UNIT = 20; // px por unidad local de la fuente
const PAD = 12; // margen para que el glow no se recorte
const STAR_R = 2.3;

function StarWord({ word, color }: { word: string; color: string }) {
  const { points, edges, w, h } = useMemo(() => {
    const { nodes, edges } = buildWord(word, { gap: 0.42 });
    const xs = nodes.map((n) => n[0]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const w = (maxX - minX) * UNIT + PAD * 2;
    const h = 2 * UNIT + PAD * 2;
    // Mapea coords locales (y∈[-1,1], y-arriba) a píxeles SVG (y-abajo).
    const points = nodes.map(
      ([x, y]) => [(x - minX) * UNIT + PAD, (1 - y) * UNIT + PAD] as [number, number]
    );
    return { points, edges, w, h };
  }, [word]);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ maxWidth: "100%", height: "auto", overflow: "visible", display: "block" }}
      aria-hidden
    >
      <g className="cc-lines" stroke={color} strokeWidth={1} strokeLinecap="round">
        {edges.map(([a, b], i) => (
          <line key={i} x1={points[a][0]} y1={points[a][1]} x2={points[b][0]} y2={points[b][1]} />
        ))}
      </g>
      <g className="cc-stars" fill={color}>
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={STAR_R} />
        ))}
      </g>
    </svg>
  );
}

export function ContactConstellations() {
  const { lang } = useI18n();

  const items = [
    {
      word: "EMAIL",
      color: "#e9c270",
      href: `mailto:${CV.email}`,
      caption: CV.email,
      aria: `Email: ${CV.email}`,
    },
    {
      word: "LINKEDIN",
      color: "#5b8cff",
      href: CV.linkedin,
      caption: "in/franprzdev",
      aria: "LinkedIn: in/franprzdev",
      external: true,
    },
    {
      word: "WHATSAPP",
      color: "#5fd39a",
      href: `https://wa.me/${CV.whatsapp}`,
      caption: lang === "es" ? "Mensaje directo" : "Direct message",
      aria: lang === "es" ? "WhatsApp: mensaje directo" : "WhatsApp: direct message",
      external: true,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "2.2rem 3rem",
        marginTop: "clamp(1.8rem, 4vh, 2.6rem)",
      }}
    >
      {items.map((it) => (
        <a
          key={it.word}
          href={it.href}
          aria-label={it.aria}
          className="cc-link"
          style={{ "--cc": it.color } as CSSProperties}
          {...(it.external ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          <StarWord word={it.word} color={it.color} />
          <span className="cc-caption">{it.caption}</span>
        </a>
      ))}

      <style>{`
        .cc-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.7rem;
          text-decoration: none;
          opacity: 0.6;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .cc-link:hover,
        .cc-link:focus-visible {
          opacity: 1;
          transform: translateY(-4px);
          outline: none;
        }
        .cc-link .cc-lines line {
          opacity: 0.35;
          transition: opacity 0.3s ease;
        }
        .cc-link:hover .cc-lines line,
        .cc-link:focus-visible .cc-lines line {
          opacity: 0.95;
        }
        .cc-link .cc-stars circle {
          filter: drop-shadow(0 0 3px var(--cc));
          transition: filter 0.3s ease;
        }
        .cc-link:hover .cc-stars circle,
        .cc-link:focus-visible .cc-stars circle {
          filter: drop-shadow(0 0 7px var(--cc));
        }
        .cc-caption {
          font-family: var(--font-geist-mono), monospace;
          font-size: 0.82rem;
          letter-spacing: 0.02em;
          color: var(--muted);
          transition: color 0.3s ease;
        }
        .cc-link:hover .cc-caption,
        .cc-link:focus-visible .cc-caption {
          color: var(--cc);
        }
      `}</style>
    </div>
  );
}
