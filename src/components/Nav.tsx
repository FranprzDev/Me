"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useScrollProgress } from "@/lib/scroll";

export function Nav() {
  const { t, tl, lang, toggle } = useI18n();
  const progress = useScrollProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
      {/* barra de progreso del viaje */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 3,
          width: `${progress * 100}%`,
          zIndex: 60,
          background:
            "linear-gradient(90deg, var(--space), var(--japan), var(--brain))",
          transition: "width 0.1s linear",
        }}
        />
        <nav
        aria-label={tl({ es: "Navegación principal", en: "Main navigation" })}
        className="content-layer site-nav"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.9rem 1.25rem",
        }}
        >
        <Link href="/" className="h-display" style={{ fontSize: "1.15rem", fontWeight: 600 }}>
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
          <button
            onClick={toggle}
            className="chip"
            style={{ cursor: "pointer", color: "var(--fg)", background: "rgba(255,255,255,0.05)" }}
            aria-label={tl({ es: "Cambiar a inglés", en: "Switch to Spanish" })}
          >
            {lang === "es" ? "ES · 🇦🇷" : "EN · 🇬🇧"}
          </button>
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
