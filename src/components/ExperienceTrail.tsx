"use client";

import { useEffect, useRef } from "react";
import { CV } from "@/data/cv";
import { useI18n } from "@/lib/i18n";
import "./experience-trail.css";

/** Where an entry sits relative to the tip of the trace. */
enum EntryState {
  Upcoming = "upcoming",
  Active = "active",
  Past = "past",
}

/** How the trail is driven: static until measured (and for reduced motion), live while scrolling. */
enum TrailMode {
  Static = "static",
  Live = "live",
}

type StarPoint = { x: number; y: number };

/** Viewport height fraction where the tip of the trace sits while scrolling. */
const TIP_VIEWPORT_FRACTION = 0.62;
/** Share of the gap the drawn length closes per frame (eases wheel steps). */
const FOLLOW = 0.2;
/** Length of the straight lead-in drawn above the first star. */
const LEAD_IN_PX = 56;
/** Lengths this close (px) count as settled, and the rAF loop stops. */
const SETTLE_PX = 0.4;

/** Cubic segment between two stars; desktop bulges sideways so the line meanders. */
function segment(from: StarPoint, to: StarPoint, index: number, bulge: number): string {
  const dy = to.y - from.y;
  const side = index % 2 === 0 ? 1 : -1;
  const c1x = from.x + side * bulge;
  const c2x = to.x + side * bulge;
  return ` C ${c1x} ${from.y + dy * 0.45} ${c2x} ${to.y - dy * 0.45} ${to.x} ${to.y}`;
}

/**
 * Work experience as a constellation traced on scroll: a line draws itself
 * star by star, each entry's star ignites as the tip reaches it and its card
 * comes up; past entries stay lit, upcoming ones wait dimmed. Reduced motion
 * (and the server render) show the whole constellation lit.
 */
export function ExperienceTrail() {
  const { t, tl } = useI18n();
  const trailRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const baseRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const list = trailRef.current;
    const svg = svgRef.current;
    const base = baseRef.current;
    const glow = glowRef.current;
    const line = lineRef.current;
    const tip = tipRef.current;
    if (!list || !svg || !base || !glow || !line || !tip) return;

    const items = Array.from(list.querySelectorAll<HTMLLIElement>("[data-entry]"));
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let stars: StarPoint[] = [];
    let starLengths: number[] = [];
    let total = 0;
    let drawn = 0;
    let target = 0;
    let frame = 0;
    let listTop = 0;

    const setStates = (length: number) => {
      let active = -1;
      // starLengths[0] is the lead-in start; entry i sits at point i + 1.
      for (let i = 0; i < items.length; i += 1) {
        if (length >= starLengths[i + 1] - 0.5) active = i;
      }
      for (let i = 0; i < items.length; i += 1) {
        const state = i < active ? EntryState.Past : i === active ? EntryState.Active : EntryState.Upcoming;
        if (items[i].dataset.state !== state) items[i].dataset.state = state;
      }
    };

    const paint = (length: number) => {
      const offset = `${Math.max(0, total - length)}`;
      line.style.strokeDashoffset = offset;
      glow.style.strokeDashoffset = offset;
      if (length <= 0.5 || length >= total - 0.5) {
        tip.style.opacity = "0";
      } else {
        const point = line.getPointAtLength(length);
        tip.style.opacity = "1";
        tip.style.transform = `translate(${point.x}px, ${point.y}px)`;
      }
      setStates(length);
    };

    /** Path length the tip should be at for the current scroll position. */
    const targetLength = () => {
      if (stars.length === 0) return 0;
      const tipY = window.scrollY + window.innerHeight * TIP_VIEWPORT_FRACTION - listTop;
      if (tipY <= stars[0].y) return 0;
      const last = stars.length - 1;
      if (tipY >= stars[last].y) return total;
      let k = 0;
      while (k < last - 1 && tipY >= stars[k + 1].y) k += 1;
      const span = stars[k + 1].y - stars[k].y;
      const share = span > 0 ? (tipY - stars[k].y) / span : 1;
      return starLengths[k] + (starLengths[k + 1] - starLengths[k]) * share;
    };

    const tick = () => {
      frame = 0;
      drawn += (target - drawn) * FOLLOW;
      if (Math.abs(target - drawn) < SETTLE_PX) drawn = target;
      paint(drawn);
      if (drawn !== target) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = targetLength();
      if (!frame && target !== drawn) frame = requestAnimationFrame(tick);
    };

    const measure = () => {
      const box = list.getBoundingClientRect();
      listTop = box.top + window.scrollY;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      const centers = items.map((item) => {
        const star = item.querySelector<HTMLElement>("[data-star]");
        const rect = (star ?? item).getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top };
      });
      // A short lead-in above the first star, so the trace arrives at it.
      stars = [{ x: centers[0].x, y: Math.max(0, centers[0].y - LEAD_IN_PX) }, ...centers];
      const wide = window.matchMedia("(min-width: 900px)").matches;
      const bulge = wide ? 56 : 9;
      let d = `M ${stars[0].x} ${stars[0].y}`;
      starLengths = [0];
      for (let i = 1; i < stars.length; i += 1) {
        d += i === 1 ? ` L ${stars[1].x} ${stars[1].y}` : segment(stars[i - 1], stars[i], i, bulge);
        // Cumulative length up to this point: measure the prefix on the base path.
        base.setAttribute("d", d);
        starLengths.push(base.getTotalLength());
      }
      for (const path of [base, glow, line]) path.setAttribute("d", d);
      total = starLengths[starLengths.length - 1] ?? 0;
      line.style.strokeDasharray = `${total}`;
      glow.style.strokeDasharray = `${total}`;
    };

    const apply = () => {
      measure();
      if (motionQuery.matches) {
        list.dataset.mode = TrailMode.Static;
        cancelAnimationFrame(frame);
        frame = 0;
        drawn = target = total;
        paint(total);
        for (const item of items) item.dataset.state = EntryState.Past;
        return;
      }
      list.dataset.mode = TrailMode.Live;
      target = targetLength();
      drawn = target;
      paint(drawn);
    };

    apply();
    const resizeObserver = new ResizeObserver(() => apply());
    resizeObserver.observe(list);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", apply);
    motionQuery.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", apply);
      motionQuery.removeEventListener("change", apply);
    };
  }, []);

  return (
    <div ref={trailRef} className="xp-trail" data-mode={TrailMode.Static}>
      <svg ref={svgRef} className="xp-trail__sky" aria-hidden="true" focusable="false" preserveAspectRatio="none">
        <defs>
          <linearGradient id="xp-trail-ink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9fb8ff" />
            <stop offset="55%" stopColor="#b79bff" />
            <stop offset="100%" stopColor="#e9c270" />
          </linearGradient>
        </defs>
        <path ref={baseRef} className="xp-trail__base" />
        <path ref={glowRef} className="xp-trail__glow" />
        <path ref={lineRef} className="xp-trail__line" />
        <circle ref={tipRef} className="xp-trail__tip" r="4" cx="0" cy="0" />
      </svg>
      <ol className="xp-trail__list" aria-label={t("exp_title")}>
      {CV.experience.map((entry, index) => (
        <li
          key={entry.start + entry.org.en}
          className="xp-entry"
          data-entry=""
          data-side={index % 2 === 0 ? "start" : "end"}
          data-state={EntryState.Past}
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
