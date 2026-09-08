"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CV } from "@/data/cv";
import { PROJECTS } from "@/data/projects";
import { useI18n } from "@/lib/i18n";
import { setActiveProject } from "@/lib/projectFocus";
import { Reveal } from "@/components/Reveal";
import { ContactConstellations } from "@/components/ContactConstellations";
import { GsapHeroName } from "@/components/GsapHeroName";
import { Magnetic } from "@/components/Magnetic";

export function Hero() {
  const { t, tl } = useI18n();
  return (
    <section id="top" className="section" style={{ alignItems: "center", textAlign: "center", paddingTop: "5rem" }}>
      <div className="wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.3rem" }}>
        <Reveal>
          <span className="eyebrow" style={{ color: "var(--space)", letterSpacing: "0.3em" }}>
            {tl(CV.location)}
          </span>
        </Reveal>

        <GsapHeroName text={CV.name} />

        <Reveal delay={0.12}>
          <p
            style={{
              fontSize: "clamp(1.2rem, 2.8vw, 1.8rem)",
              color: "#d7e3ff",
              margin: 0,
              fontWeight: 500,
              textShadow: "0 0 25px rgba(122,162,255,0.4)",
            }}
          >
            {tl(CV.title)} · <span style={{ color: "var(--space-2)" }}>AI Engineer</span>
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <p style={{ maxWidth: 680, color: "var(--muted)", lineHeight: 1.75, fontSize: "1.05rem" }}>
            {tl(CV.summary)}
          </p>
        </Reveal>

        <Reveal delay={0.28}>
          <div className="hero-actions-grid">
            <Magnetic strength={0.3}>
              <Link href="/#projects" className="hero-console-btn btn-theme-projects">
                <span className="btn-badge">{tl({ es: "EXPLORAR // 04 MUNDOS", en: "EXPLORE // 04 WORLDS" })}</span>
                <span className="btn-text-row">
                  <span className="btn-icon">✦</span>
                  <span>{t("hero_cta_projects")}</span>
                </span>
              </Link>
            </Magnetic>
            <Magnetic strength={0.3}>
              <a href={CV.cvPdf} download className="hero-console-btn btn-theme-cv">
                <span className="btn-badge">{tl({ es: "CURRICULUM // PDF", en: "RESUME // PDF" })}</span>
                <span className="btn-text-row">
                  <span className="btn-icon">📄</span>
                  <span>{t("hero_cta_cv")}</span>
                </span>
              </a>
            </Magnetic>
            <Magnetic strength={0.3}>
              <a href={CV.github} target="_blank" rel="noreferrer" className="hero-console-btn btn-theme-github">
                <span className="btn-badge">{tl({ es: "REPOSITORIOS // DEV", en: "REPOSITORIES // DEV" })}</span>
                <span className="btn-text-row">
                  <span className="btn-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </span>
                  <span>GitHub ↗</span>
                </span>
              </a>
            </Magnetic>
          </div>
        </Reveal>

        {/* Tech Marquee Chips */}
        <Reveal delay={0.34}>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 680, marginTop: "0.4rem" }}>
            {["LangChain", "LangGraph", "n8n", "Next.js", "TypeScript", "Python", "Docker", "PostgreSQL", "dbt", "Supabase"].map((tech) => (
              <span key={tech} className="chip" style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.04)" }}>
                {tech}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.45}>
          <div className="scroll-cue" aria-hidden style={{ marginTop: "1.8rem" }}>
            <span>⌄</span>
            <span>⌄</span>
            <span>⌄</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Experience() {
  const { t, tl } = useI18n();
  return (
    <section id="experience" className="section">
      <div className="wrap">
        <Reveal>
          <div style={{ marginBottom: "2rem" }}>
            <span className="eyebrow" style={{ color: "var(--space)" }}>{t("career_path")}</span>
            <h2 className="h-display" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", margin: "0.4rem 0 0" }}>
              {t("exp_title")}
            </h2>
          </div>
        </Reveal>
        <div className="timeline-container">
          {CV.experience.map((e, i) => (
            <Reveal key={e.org + i} delay={i * 0.05}>
              <div className="timeline-row">
                <div className="timeline-dot" style={{ borderColor: e.current ? "var(--japan)" : "var(--space)" }}>
                  {i === 0 ? "🤖" : i === 1 ? "🏛️" : i === 2 ? "🌐" : i === 3 ? "💻" : "👨‍🏫"}
                </div>
                <article
                  className="glass tilt-card"
                  style={{
                    padding: "1.4rem 1.6rem",
                    flex: 1,
                    borderLeft: e.current ? "3px solid var(--japan)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem", alignItems: "baseline" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--fg)" }}>{tl(e.role)}</h3>
                    <span className="chip" style={e.current ? { color: "var(--japan)", borderColor: "var(--japan)", background: "rgba(155,123,255,0.1)" } : undefined}>
                      {tl(e.period)}
                    </span>
                  </div>
                  <p className="accent-japan" style={{ margin: "0.3rem 0 0.7rem", fontWeight: 600 }}>{e.org}</p>
                  <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>{tl(e.description)}</p>
                  {e.stack && e.stack.length > 0 && (
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
                      {e.stack.map((st) => (
                        <span key={st} className="chip" style={{ fontSize: "0.7rem", opacity: 0.85 }}>
                          {st}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Education() {
  const { t, tl } = useI18n();
  return (
    <section id="education" className="section">
      <div className="wrap">
        <Reveal>
          <h2 className="h-display" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", margin: "0.4rem 0 2rem" }}>
            {t("edu_title")}
          </h2>
        </Reveal>

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr" }}>
          {CV.education.map((ed, i) => (
            <Reveal key={i}>
              <article className="glass" style={{ padding: "1.4rem 1.6rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{tl(ed.degree)}</h3>
                <p className="accent-japan" style={{ margin: "0.3rem 0", fontWeight: 600 }}>{ed.institution}</p>
                <span className="chip">{tl(ed.period)}</span>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <h3 className="h-display" style={{ fontSize: "1.6rem", margin: "2.2rem 0 1rem" }}>{t("edu_certs")}</h3>
        </Reveal>
        <div style={{ display: "grid", gap: "0.7rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {CV.certifications.map((c, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="glass-soft tilt-card" style={{ padding: "1rem 1.2rem", height: "100%" }}>
                <strong style={{ fontSize: "0.98rem" }}>{tl(c.name)}</strong>
                {c.highlight && (
                  <span className="chip" style={{ marginLeft: "0.4rem", color: "var(--japan-2,#e9b949)" }}>★ {tl(c.highlight)}</span>
                )}
                <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.82rem" }}>{c.school}</p>
                <p style={{ margin: "0.15rem 0 0", color: "var(--muted)", fontSize: "0.78rem", opacity: 0.8 }}>{tl(c.period)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Projects() {
  const { t, tl } = useI18n();
  const [idx, setIdx] = useState(0);
  const total = PROJECTS.length;

  const go = (next: number, dir: number) => {
    setActiveProject((next + total) % total, dir);
    setIdx((next + total) % total);
  };
  useEffect(() => {
    setActiveProject(idx, 1);
  }, [idx]);

  const p = PROJECTS[idx];
  return (
    <section id="projects" className="section" style={{ position: "relative", textAlign: "center" }}>
      <div className="wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.9rem" }}>
        <Reveal>
          <h2 className="h-display glow-brain" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", margin: "0.4rem 0 0.2rem" }}>
            {t("proj_title")}
          </h2>
        </Reveal>
        <Reveal delay={0.06}>
          <p style={{ color: "var(--muted)", margin: "0 auto", maxWidth: 640, textAlign: "center", lineHeight: 1.6 }}>
            {t("proj_instruction")}
          </p>
        </Reveal>

        {/* Planeta actual centrado: HUD protagonista del slider */}
        <Reveal delay={0.1}>
          <div
            className="planet-hud"
            style={{
              "--hud-glow": p.planet.atmoA,
              marginTop: "0.4rem",
            } as React.CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
              <span className="eyebrow" style={{ color: p.planet.atmoA, fontSize: "0.72rem" }}>
                {t("world")} 0{idx + 1} / 0{total}
              </span>
              <span className="chip" style={{ borderColor: p.planet.atmoA, color: p.planet.atmoA }}>
                {p.year}{p.featured ? " ★" : ""}
              </span>
            </div>

            <Link href={`/${p.slug}`} style={{ textDecoration: "none" }}>
              <h3
                className="link-underline"
                style={{
                  margin: 0,
                  fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                  color: p.planet.atmoA,
                  textShadow: `0 0 30px ${p.planet.atmoA}66`,
                }}
              >
                {p.title ? tl(p.title) : p.name}
              </h3>
            </Link>

            <p style={{ margin: 0, color: "var(--fg)", fontSize: "1.05rem", fontWeight: 500, maxWidth: 500, lineHeight: 1.5 }}>
              {tl(p.tagline)}
            </p>

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
              {p.stack.map((s) => (
                <span key={s} className="chip" style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" }}>
                  {s}
                </span>
              ))}
            </div>

            <Magnetic strength={0.25}>
              <Link
                href={`/${p.slug}`}
                className="btn-cosmic-primary"
                style={{
                  marginTop: "0.3rem",
                  background: `linear-gradient(135deg, ${p.planet.body}, ${p.planet.atmoA})`,
                  boxShadow: `0 0 30px ${p.planet.atmoA}55`,
                }}
              >
                {t("proj_explore")}
              </Link>
            </Magnetic>
          </div>
        </Reveal>

        {/* Selector interactivo de mundos directos */}
        <Reveal delay={0.14}>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 660, marginTop: "0.3rem" }}>
            {PROJECTS.map((proj, i) => (
              <button
                key={proj.slug}
                onClick={() => go(i, i > idx ? 1 : -1)}
                className="chip"
                style={{
                  cursor: "pointer",
                  color: i === idx ? "#ffffff" : "var(--muted)",
                  borderColor: i === idx ? proj.planet.atmoA : "rgba(255,255,255,0.12)",
                  background: i === idx ? `color-mix(in srgb, ${proj.planet.atmoA} 25%, rgba(10,14,30,0.8))` : "rgba(255,255,255,0.03)",
                  boxShadow: i === idx ? `0 0 15px ${proj.planet.atmoA}44` : "none",
                  transition: "all 0.25s ease",
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.75rem",
                  fontWeight: i === idx ? 600 : 400,
                }}
              >
                {proj.title ? tl(proj.title) : proj.name}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Flechas a cada lado de la pantalla — más usable y el planeta queda protagonista. */}
      <div
        aria-hidden={false}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(0.7rem, 3vw, 2rem)",
          pointerEvents: "none",
        }}
      >
        <Magnetic strength={0.22}>
          <button
            onClick={() => go(idx - 1, -1)}
            aria-label={tl({ es: "Planeta anterior", en: "Previous planet" })}
            className="glass"
            style={{ borderRadius: "999px", width: 52, height: 52, color: "var(--fg)", fontSize: "1.3rem", cursor: "pointer", pointerEvents: "auto" }}
          >
            ←
          </button>
        </Magnetic>
        <Magnetic strength={0.22}>
          <button
            onClick={() => go(idx + 1, 1)}
            aria-label={tl({ es: "Siguiente planeta", en: "Next planet" })}
            className="glass"
            style={{ borderRadius: "999px", width: 52, height: 52, color: "var(--fg)", fontSize: "1.3rem", cursor: "pointer", pointerEvents: "auto" }}
          >
            →
          </button>
        </Magnetic>
      </div>
    </section>
  );
}

export function Contact() {
  const { t } = useI18n();
  return (
    <section
      id="contact"
      className="section"
      style={{ minHeight: "100svh", justifyContent: "flex-start" }}
    >
      <div
        className="wrap contact-stage"
        style={{
          minHeight: "calc(100svh - 6rem)",
          display: "grid",
          gridTemplateRows: "1fr auto",
          textAlign: "center",
          rowGap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: "clamp(4.5rem, 11vh, 7rem)",
          }}
        >
          {/* El título de la sección es la constelación "CHARLEMOS" que se ensambla
              en el canvas 3D de fondo. Lo declaramos como heading oculto para
              lectores de pantalla y el esquema del documento. */}
          <h2 className="sr-only">{t("contact_title")}</h2>

          {/* Espacio reservado para que la palabra-constelación 3D respire arriba. */}
          <div aria-hidden className="contact-space" style={{ height: "clamp(120px, 18vh, 220px)" }} />

          <Reveal delay={0.1} className="contact-constellations">
            <ContactConstellations />
          </Reveal>
        </div>

        <footer style={{ padding: "2rem 0 0.5rem", textAlign: "center" }}>
          <div className="divider" style={{ maxWidth: 600, margin: "0 auto 1.2rem" }} />
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
            © {new Date().getFullYear()} {CV.name}
          </p>
        </footer>
      </div>
    </section>
  );
}
