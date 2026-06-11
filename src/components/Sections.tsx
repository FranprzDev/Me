"use client";

import Link from "next/link";
import { CV } from "@/data/cv";
import { PROJECTS } from "@/data/projects";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "@/components/Reveal";
import { ContactConstellations } from "@/components/ContactConstellations";

export function Hero() {
  const { t, tl } = useI18n();
  return (
    <section id="top" className="section" style={{ alignItems: "center", textAlign: "center" }}>
      <div className="wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.4rem" }}>
        <Reveal>
          <span className="eyebrow">{tl(CV.location)}</span>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="h-display glow-space" style={{ fontSize: "clamp(2.8rem, 9vw, 6.5rem)", margin: 0 }}>
            {CV.name}
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", color: "var(--muted)", margin: 0 }}>
            {tl(CV.title)}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{ maxWidth: 620, color: "var(--muted)", lineHeight: 1.7 }}>
            {tl(CV.summary)}
          </p>
        </Reveal>
        <Reveal delay={0.28}>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/utn-frt-mcp"
              className="glass tilt-card"
              style={{ padding: "0.8rem 1.4rem", color: "var(--fg)", fontWeight: 600 }}
            >
              {t("hero_cta_mcp")} →
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.5}>
          <div className="scroll-cue" aria-hidden style={{ marginTop: "2.4rem" }}>
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
          <h2 className="h-display" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", margin: "0.4rem 0 2rem" }}>
            {t("exp_title")}
          </h2>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {CV.experience.map((e, i) => (
            <Reveal key={e.org + i} delay={i * 0.05}>
              <article className="glass tilt-card" style={{ padding: "1.4rem 1.6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--fg)" }}>{tl(e.role)}</h3>
                  <span className="chip" style={e.current ? { color: "var(--japan)", borderColor: "var(--japan)" } : undefined}>
                    {tl(e.period)}
                  </span>
                </div>
                <p className="accent-japan" style={{ margin: "0.3rem 0 0.7rem", fontWeight: 600 }}>{e.org}</p>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>{tl(e.description)}</p>
              </article>
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
          <h3 className="h-display" style={{ fontSize: "1.6rem", margin: "2.2rem 0 1rem" }}>{t("edu_highlights")}</h3>
        </Reveal>
        <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {CV.highlights.map((h, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="glass-soft tilt-card" style={{ padding: "1.1rem 1.3rem", height: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong style={{ color: "var(--japan-2, #e9b949)" }}>{h.title}</strong>
                  <span className="chip">{h.year}</span>
                </div>
                <p style={{ margin: "0.5rem 0 0", color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>{tl(h.detail)}</p>
              </div>
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
  return (
    <section id="projects" className="section">
      <div className="wrap">
        <Reveal>
          <h2 className="h-display glow-brain" style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", margin: "0.4rem 0 2rem" }}>
            {t("proj_title")}
          </h2>
        </Reveal>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {PROJECTS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <article
                className="glass tilt-card"
                style={{
                  padding: "1.4rem 1.5rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  borderColor: p.featured ? "rgba(57,255,20,0.35)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", lineHeight: 1.3 }}>{p.name}</h3>
                  <span className="chip">{p.year}</span>
                </div>
                <p className="accent-brain" style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>{tl(p.tagline)}</p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6, flex: 1 }}>{tl(p.description)}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {p.stack.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="link-underline accent-brain" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Ver más →
                  </a>
                )}
              </article>
            </Reveal>
          ))}
        </div>
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

          <Reveal>
            <p style={{ color: "var(--muted)", maxWidth: 560, margin: "0 auto", fontSize: "1.05rem" }}>
              {t("contact_subtitle")}
            </p>
          </Reveal>
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
