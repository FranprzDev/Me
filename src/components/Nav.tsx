"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { subscribeScroll } from "@/lib/scroll";
import { cvCounterpartPath } from "@/content/cv/routes";

/** Scroll offset (px) after which the header gets its solid band. */
const BAND_AFTER = 8;

export function Nav() {
  const { t, tl, lang, toggle } = useI18n();
  // A CV page is written in one language: its switch is a link to the same
  // page in the other language instead of the stored-preference toggle.
  const cvSwitchHref = cvCounterpartPath(usePathname());
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Progress bar and header band are written straight to the DOM from the
  // shared scroll frame: no React render per scroll event, compositor-only
  // transform for the bar, and the attribute only flips when it changes.
  useEffect(() => {
    let banded = false;
    return subscribeScroll(({ progress, y }) => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      const next = y > BAND_AFTER;
      if (next !== banded && navRef.current) {
        banded = next;
        navRef.current.toggleAttribute("data-scrolled", next);
      }
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector("a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !toggleRef.current?.contains(target)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  // Hrefs absolutos: el Nav vive en el layout (todas las rutas).
  const links: { href: string; key: Parameters<typeof t>[0] }[] = [
    { href: "/#experience", key: "nav_experience" },
    { href: "/#projects", key: "nav_projects" },
    { href: "/#contact", key: "nav_contact" },
  ];

  return (
    <>
      {/* Reading progress: one compositor-only transform, no layout. */}
      <div ref={barRef} aria-hidden="true" className="site-progress" />
      <nav
        ref={navRef}
        aria-label={tl({ es: "Navegación principal", en: "Main navigation" })}
        className="content-layer site-nav"
      >
        <Link
          href="/"
          className="h-display"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "1.15rem", fontWeight: 600 }}
        >
          <Image src="/brand/logo.svg" alt="" width={26} height={26} unoptimized />
          FP.
        </Link>

        <div className="glass-soft" style={{ display: "none", gap: "1.1rem", padding: "0.5rem 1.1rem" }} data-desktop-nav>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="link-underline" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              {t(l.key)}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {cvSwitchHref ? (
            <Link
              href={cvSwitchHref}
              hrefLang={lang === "es" ? "en" : "es"}
              className="chip chip--control"
              style={{ color: "var(--fg)", background: "rgba(255,255,255,0.05)" }}
              aria-label={tl({ es: "ES: cambiar a inglés", en: "EN: switch to Spanish" })}
              data-lang-switch
            >
              {lang === "es" ? "ES" : "EN"}
            </Link>
          ) : (
            <button
              onClick={toggle}
              className="chip"
              style={{ cursor: "pointer", color: "var(--fg)", background: "rgba(255,255,255,0.05)" }}
              aria-label={tl({ es: "ES: cambiar a inglés", en: "EN: switch to Spanish" })}
            >
              {lang === "es" ? "ES" : "EN"}
            </button>
          )}
          <button
            ref={toggleRef}
            onClick={() => setMenuOpen((v) => !v)}
            className="chip"
            style={{ cursor: "pointer", color: "var(--fg)" }}
            aria-label={menuOpen ? tl({ es: "Cerrar menú", en: "Close menu" }) : tl({ es: "Abrir menú", en: "Open menu" })}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            data-mobile-toggle
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="glass content-layer"
          data-mobile-menu
          style={{
            position: "fixed",
            top: "5rem",
            right: "1rem",
            left: "1rem",
            zIndex: 55,
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{ padding: "0.6rem 0.4rem", color: "var(--fg)", fontSize: "0.95rem" }}
            >
              {t(l.key)}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          [data-desktop-nav] { display: flex !important; }
          [data-mobile-toggle] { display: none !important; }
          [data-mobile-menu] { display: none !important; }
        }
      `}</style>
    </>
  );
}
