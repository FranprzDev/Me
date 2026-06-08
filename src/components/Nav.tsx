"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useScrollProgress } from "@/lib/scroll";

export function Nav() {
  const { t, lang, toggle } = useI18n();
  const progress = useScrollProgress();
  const [menuOpen, setMenuOpen] = useState(false);

  // Hrefs absolutos: el Nav vive en el layout (todas las rutas). Los anclas a
  // secciones del home llevan "/" delante para funcionar desde /utn-frt-mcp.
  const links: { href: string; key: Parameters<typeof t>[0] }[] = [
    { href: "/#about", key: "nav_about" },
    { href: "/#experience", key: "nav_experience" },
    { href: "/#education", key: "nav_education" },
    { href: "/#projects", key: "nav_projects" },
    { href: "/#contact", key: "nav_contact" },
  ];

  return (
    <>
      {/* barra de progreso del viaje */}
      <div
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
        className="content-layer"
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
            aria-label="Toggle language"
          >
            {lang === "es" ? "ES · 🇦🇷" : "EN · 🇬🇧"}
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="chip"
            style={{ cursor: "pointer", color: "var(--fg)" }}
            aria-label="Menu"
            aria-expanded={menuOpen}
            data-mobile-toggle
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <div
          className="glass content-layer"
          data-mobile-menu
          style={{
            position: "fixed",
            top: "3.6rem",
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
