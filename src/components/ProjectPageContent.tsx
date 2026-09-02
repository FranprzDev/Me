"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { PROJECTS } from "@/data/projects";
import { useI18n } from "@/lib/i18n";

/**
 * Contenido de la página de un planeta: toda la información del proyecto,
 * bilingüe vía el mismo contexto i18n que el resto del sitio.
 */
export function ProjectPageContent({ slug }: { slug: string }) {
  const { t, tl } = useI18n();
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) notFound();

  return (
    <article
      style={
        {
          "--planet": p.planet.atmoA,
          "--planet-rim": p.planet.atmoB,
          maxWidth: 760,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        } as React.CSSProperties
      }
    >
      <Link href="/#projects" className="chip" style={{ alignSelf: "flex-start" }}>
        {t("proj_back")}
      </Link>
      <span
        className="eyebrow"
        style={{ color: "var(--planet)", letterSpacing: "0.22em", fontSize: "0.75rem" }}
      >
        {p.year}
        {p.featured ? " ★" : ""}
      </span>
      <h1
        className="h-display"
        style={{
          margin: 0,
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          lineHeight: 1.15,
          textShadow: `0 0 40px color-mix(in srgb, var(--planet) 45%, transparent)`,
        }}
      >
        {p.name}
      </h1>
      <p style={{ margin: 0, color: "var(--planet-rim)", fontWeight: 600, fontSize: "1.1rem" }}>
        {tl(p.tagline)}
      </p>
      <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>{tl(p.description)}</p>

      {p.items && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem", marginTop: "0.6rem" }}>
          {[...new Map(p.items.map((it) => [it.category?.es ?? "Highlights", it])).keys()].map((category) => {
            const categoryItems = p.items!.filter((it) => (it.category?.es ?? "Highlights") === category);
            const label = categoryItems[0].category ?? { es: "Destacados", en: "Highlights" };
            return (
              <section key={category} aria-labelledby={`project-category-${category}`}>
                <h2
                  id={`project-category-${category}`}
                  className="eyebrow"
                  style={{ color: "var(--planet-rim)", margin: "0 0 0.7rem", fontSize: "0.78rem" }}
                >
                  {tl(label)}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {categoryItems.map((it) => (
                    <div
                      key={it.name}
                      className="glass-soft"
                      style={{ padding: "1.1rem 1.4rem", borderLeft: `3px solid var(--planet)` }}
                    >
                      <strong style={{ fontSize: "1.05rem" }}>
                        {it.name}{" "}
                        <span className="chip" style={{ marginLeft: "0.3rem" }}>{it.year}</span>
                        {it.highlight && (
                          <span
                            className="chip"
                            style={{ marginLeft: "0.3rem", color: "var(--planet)", borderColor: "var(--planet)" }}
                          >
                            {tl(it.highlight)}
                          </span>
                        )}
                      </strong>
                      <p style={{ margin: "0.4rem 0 0.4rem", color: "var(--muted)", lineHeight: 1.7 }}>
                        {tl(it.description)}
                      </p>
                      {it.link && (
                        <a
                          href={it.link}
                          target="_blank"
                          rel="noreferrer"
                          className="link-underline"
                          style={{ color: "var(--planet)", fontWeight: 600 }}
                        >
                          {it.link.includes("github.com") ? "GitHub →" : "Ver proyecto →"}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
        {p.stack.map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
      </div>
    </article>
  );
}
