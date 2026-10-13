"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export interface IndexEntry {
  /** DOM id of the section or entry this tick points to. */
  id: string;
  label: string;
  meta?: string;
}

/**
 * Reading zone (as root margins): the upper 45% of the viewport. The entry
 * being read is the lowest one that reaches into it.
 */
const READING_ZONE = "0px 0px -55% 0px";

/**
 * Quiet "on this page" index for world pages: a column of short ticks in the
 * left gutter, one per entry, where the entry being read grows into a longer
 * tick and shows its name. Ticks are real links, so it doubles as a jump list.
 *
 * It replaces the scroll-driven trajectory rail: no path drawing, no marker
 * chasing the scroll, no per-frame measuring. The active entry comes from an
 * IntersectionObserver, so scrolling costs nothing here. It only shows where
 * the gutter is wide enough (see CSS); phones rely on the header progress bar.
 */
export function EntryIndex({ entries }: { entries: IndexEntry[] }) {
  const { tl } = useI18n();
  const [active, setActive] = useState<string | null>(null);
  // Callers rebuild the array on every render; observe again only when the
  // set of ids actually changes.
  const ids = entries.map((entry) => entry.id).join(" ");

  useEffect(() => {
    if (!ids) return;
    const order = ids.split(" ");
    const targets = order
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const inZone = new Set<string>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) inZone.add(record.target.id);
          else inZone.delete(record.target.id);
        }
        // Between entries (e.g. over a section heading) keep the last one lit.
        for (let i = order.length - 1; i >= 0; i--) {
          if (inZone.has(order[i])) {
            setActive(order[i]);
            return;
          }
        }
      },
      { rootMargin: READING_ZONE }
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [ids]);

  if (entries.length === 0) return null;

  return (
    <nav className="entry-index" aria-label={tl({ es: "En esta página", en: "On this page" })}>
      <ol>
        {entries.map((entry) => {
          const isActive = entry.id === active;
          return (
            <li key={entry.id} className={isActive ? "is-active" : undefined}>
              <a
                href={`#${entry.id}`}
                aria-label={entry.meta ? `${entry.label} (${entry.meta})` : entry.label}
                aria-current={isActive ? "location" : undefined}
              >
                <i aria-hidden="true" />
                <span aria-hidden="true">{entry.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
