"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { PROJECTS } from "@/data/projects";
import { CursorTrail } from "@/components/CursorTrail";
import { WarpTransition } from "@/components/WarpTransition";

/**
 * Warms every world route (and home) once the first page is idle, so a jump
 * from the selector, the world-to-world nav or the way back home never waits
 * on the network. The routes are static, so each prefetch is a small cached
 * payload; outer selector items are buttons, not links, and would otherwise
 * only be prefetched once centred.
 */
function usePrefetchWorlds() {
  const router = useRouter();
  useEffect(() => {
    const warm = () => {
      router.prefetch("/");
      for (const p of PROJECTS) router.prefetch(`/${p.slug}`);
    };
    // Safari has no requestIdleCallback: a plain delay keeps it off the first paint.
    if (typeof window.requestIdleCallback !== "function") {
      const timer = window.setTimeout(warm, 1200);
      return () => window.clearTimeout(timer);
    }
    const id = window.requestIdleCallback(warm, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }, [router]);
}

export function SiteChrome() {
  const pathname = usePathname();
  usePrefetchWorlds();
  const { tl } = useI18n();
  // /me is a standalone editorial page with its own header; every other route,
  // the CV pages included, wears the portfolio chrome.
  const standalone = pathname?.startsWith("/me") ?? false;
  if (standalone) return null;

  return (
    <>
      <a href="#main-content" className="skip-link">
        {tl({ es: "Saltar al contenido", en: "Skip to content" })}
      </a>
      <Nav />
      <CursorTrail />
      <WarpTransition />
    </>
  );
}
