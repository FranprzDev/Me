"use client";

import { useEffect, useRef } from "react";
import { CV } from "@/data/cv";
import { useI18n } from "@/lib/i18n";
import "./experience-trail.css";

type StarPoint = { x: number; y: number };

/** Length of the straight lead-in drawn above the first star. */
const LEAD_IN_PX = 56;
/** Sideways bulge of each segment (px): wide layouts meander, phones keep a near-straight rail. */
const BULGE_WIDE_PX = 56;
const BULGE_NARROW_PX = 9;
/** Breakpoint where the cards alternate around a central line (matches experience-trail.css). */
const WIDE_QUERY = "(min-width: 900px)";

/** Cubic segment between two stars; desktop bulges sideways so the line meanders. */
function segment(from: StarPoint, to: StarPoint, index: number, bulge: number): string {
  const dy = to.y - from.y;
  const side = index % 2 === 0 ? 1 : -1;
  const c1x = from.x + side * bulge;
  const c2x = to.x + side * bulge;
  return ` C ${c1x} ${from.y + dy * 0.45} ${c2x} ${to.y - dy * 0.45} ${to.x} ${to.y}`;
}

/**
 * Work experience as a static constellation: one lit star per role joined by a
 * fully drawn line. Nothing is tied to the scroll position; the line is only
 * re-measured when the list resizes, so every card is readable at all times.
 */
export function ExperienceTrail() {
  const { t, tl } = useI18n();
  const trailRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const list = trailRef.current;
    const svg = svgRef.current;
    const glow = glowRef.current;
    const line = lineRef.current;
    if (!list || !svg || !glow || !line) return;

    const items = Array.from(list.querySelectorAll<HTMLLIElement>("[data-entry]"));
    if (items.length === 0) return;
    const wideQuery = window.matchMedia(WIDE_QUERY);

    const draw = () => {
      const box = list.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      const centers = items.map((item) => {
        const star = item.querySelector<HTMLElement>("[data-star]");
        const rect = (star ?? item).getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top };
      });
      // A short lead-in above the first star, so the line arrives at it.
      const stars = [{ x: centers[0].x, y: Math.max(0, centers[0].y - LEAD_IN_PX) }, ...centers];
      const bulge = wideQuery.matches ? BULGE_WIDE_PX : BULGE_NARROW_PX;
      let d = `M ${stars[0].x} ${stars[0].y}`;
      for (let i = 1; i < stars.length; i += 1) {
        d += i === 1 ? ` L ${stars[1].x} ${stars[1].y}` : segment(stars[i - 1], stars[i], i, bulge);
      }
      glow.setAttribute("d", d);
      line.setAttribute("d", d);
    };

    draw();
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(list);
    wideQuery.addEventListener("change", draw);
    return () => {
      resizeObserver.disconnect();
      wideQuery.removeEventListener("change", draw);
    };
  }, []);

  return (
    <div ref={trailRef} className="xp-trail">
      <svg ref={svgRef} className="xp-trail__sky" aria-hidden="true" focusable="false" preserveAspectRatio="none">
        <defs>
          <linearGradient id="xp-trail-ink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fb8ff" />
            <stop offset="55%" stopColor="#b79bff" />
            <stop offset="100%" stopColor="#e9c270" />
          </linearGradient>
        </defs>
        <path ref={glowRef} className="xp-trail__glow" />
        <path ref={lineRef} className="xp-trail__line" />
      </svg>
      <ol className="xp-trail__list" aria-label={t("exp_title")}>
        {CV.experience.map((entry, index) => (
          <li
            key={entry.start + entry.org.en}
            className="xp-entry"
            data-entry=""
            data-side={index % 2 === 0 ? "start" : "end"}
            data-current={entry.current}
          >
            <span className="xp-star" data-star="" aria-hidden="true" />
            <article className="glass xp-card">
              <div className="xp-card__head">
                <h3 className="xp-card__role">{tl(entry.role)}</h3>
                <span className="experience-period" data-current={entry.current}>
                  {tl(entry.period)}
                </span>
              </div>
              <p className="xp-card__org accent-japan">{tl(entry.org)}</p>
              <p className="xp-card__body">{tl(entry.description)}</p>
              {entry.stack && entry.stack.length > 0 && <p className="stack-note">{entry.stack.join(" · ")}</p>}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
