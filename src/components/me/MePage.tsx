"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";
import { ME } from "@/data/me";
import { MeReveal } from "@/components/me/MeReveal";
import { MeLayers } from "@/components/me/MeLayers";

const FALLBACK_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://me-pink-ten.vercel.app";

const noopSubscribe = () => () => {};
const useOrigin = () =>
  useSyncExternalStore(noopSubscribe, () => window.location.origin, () => FALLBACK_ORIGIN);

function Header() {
  const { lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`me-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="me-wrap me-header-inner">
        <Link href="/" className="me-wordmark" aria-label="Francisco Perez — portfolio">
          {ME.name}
        </Link>
        <div className="me-lang" role="group" aria-label="Language">
          {(["es", "en"] as const).map((l, i) => (
            <span key={l} className="me-lang-item">
              {i > 0 ? <span className="me-lang-sep" aria-hidden>|</span> : null}
              <button
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={lang === l ? "is-active" : ""}
              >
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { tl } = useI18n();
  return (
    <section className="me-hero" aria-labelledby="me-hero-title">
      <Image
        src="/me/hero.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="me-hero-img"
      />
      <div className="me-hero-shade" aria-hidden />
      <div className="me-wrap me-hero-inner">
        <MeReveal>
          <h1 id="me-hero-title" className="me-display me-display-xl">
            {tl(ME.hero.title)}
          </h1>
        </MeReveal>
        <MeReveal delay={120}>
          <p className="me-hero-body">{tl(ME.hero.body)}</p>
        </MeReveal>
        <MeReveal delay={220}>
          <a className="me-pill me-pill-light" href={`mailto:${ME.email}`}>
            {tl(ME.hero.cta)}
          </a>
        </MeReveal>
      </div>
    </section>
  );
}

function Statement() {
  const { tl } = useI18n();
  return (
    <section className="me-paper me-section">
      <div className="me-wrap me-split">
        <div className="me-split-text">
          <MeReveal>
            <h2 className="me-display me-display-lg me-ink">{tl(ME.statement.title)}</h2>
          </MeReveal>
          <MeReveal delay={100}>
            <p className="me-copy">{tl(ME.statement.body)}</p>
          </MeReveal>
          <MeReveal delay={180}>
            <a className="me-pill me-pill-dark" href={ME.cvPdf} target="_blank" rel="noopener noreferrer">
              {tl(ME.statement.cta)}
            </a>
          </MeReveal>
        </div>
        <MeReveal delay={120} className="me-split-media">
          <div className="me-frame">
            <Image src="/me/statement.webp" alt="" fill sizes="(max-width: 819px) 100vw, 45vw" />
          </div>
        </MeReveal>
      </div>
    </section>
  );
}

function About() {
  const { tl } = useI18n();
  const [open, setOpen] = useState(0);
  return (
    <section className="me-paper me-section" aria-labelledby="me-about-title">
      <div className="me-wrap me-about">
        <MeReveal className="me-about-photo">
          <div className="me-portrait">
            <Image
              src="/me/francisco.webp"
              alt={tl(ME.about.photoAlt)}
              fill
              sizes="(max-width: 819px) 100vw, 30vw"
            />
          </div>
        </MeReveal>
        <div className="me-about-text">
          <MeReveal>
            <h2 id="me-about-title" className="me-display me-display-md me-ink">
              {tl(ME.about.title)}
            </h2>
          </MeReveal>
          <MeReveal delay={80}>
            <p className="me-lead">{tl(ME.about.lead)}</p>
            <p className="me-copy">{tl(ME.about.body)}</p>
            <a className="me-mono me-small-link" href={ME.github} target="_blank" rel="noopener noreferrer">
              github.com/franprzdev ↗
            </a>
          </MeReveal>
          <MeReveal delay={140}>
            <ul className="me-accordion">
              {ME.about.roles.map((role, i) => {
                const isOpen = open === i;
                const panelId = `me-role-${i}`;
                return (
                  <li key={role.org} className={`me-acc-item ${isOpen ? "is-open" : ""}`}>
                    <button
                      type="button"
                      className="me-acc-head"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                    >
                      <span className="me-mono me-acc-num">0{i + 1}</span>
                      <span className="me-acc-title">
                        {role.org}
                        <span className="me-acc-role">{tl(role.role)}</span>
                      </span>
                      <span className="me-acc-icon" aria-hidden>
                        +
                      </span>
                    </button>
                    <div id={panelId} className="me-acc-panel" role="region">
                      <div className="me-acc-panel-inner">
                        <p className="me-mono me-acc-period">{tl(role.period)}</p>
                        <p className="me-copy">{tl(role.body)}</p>
                        <ul className="me-tags">
                          {role.stack.map((s) => (
                            <li key={s} className="me-mono">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </MeReveal>
        </div>
      </div>
    </section>
  );
}

function Process() {
  const { tl } = useI18n();
  const steps = ME.process.steps;
  return (
    <section className="me-paper me-section" aria-labelledby="me-process-title">
      <div className="me-wrap me-split me-split-center">
        <div className="me-split-text">
          <MeReveal>
            <h2 id="me-process-title" className="me-display me-display-lg me-ink">
              {tl(ME.process.title)}
            </h2>
          </MeReveal>
          <MeReveal delay={80}>
            <p className="me-lead">{tl(ME.process.lead)}</p>
            {ME.process.body.map((b) => (
              <p key={b.en} className="me-copy">
                {tl(b)}
              </p>
            ))}
          </MeReveal>
        </div>
        <MeReveal delay={120} className="me-flow-wrap">
          <div className="me-flow">
            <div className="me-flow-loop" aria-hidden>
              <span className="me-mono">{tl(ME.process.loop)}</span>
            </div>
            <ol className="me-flow-steps">
              {steps.map((s, i) => (
                <li key={s.title.en} className={`me-flow-step ${i === 1 ? "is-accent" : ""}`}>
                  <span className={`me-flow-dot ${i === 0 ? "is-hollow" : ""}`} aria-hidden />
                  <span className="me-flow-title">{tl(s.title)}</span>
                  <span className="me-mono me-flow-note">{tl(s.note)}</span>
                </li>
              ))}
            </ol>
          </div>
        </MeReveal>
      </div>
    </section>
  );
}

function Projects() {
  const { tl } = useI18n();
  return (
    <section className="me-tiles" aria-label="Projects">
      {ME.projects.map((p, i) => (
        <MeReveal key={p.name} delay={i * 90} className="me-tile">
          <Image src={p.image} alt="" fill sizes="(max-width: 819px) 100vw, 34vw" className="me-tile-img" />
          <div className="me-tile-shade" aria-hidden />
          <div className="me-tile-body">
            <p className="me-mono me-tile-status">{tl(p.status)}</p>
            <h3 className="me-display me-tile-title">{p.name}</h3>
            <p className="me-tile-copy">{tl(p.body)}</p>
            <a className="me-pill me-pill-ghost" href={p.link.href} target="_blank" rel="noopener noreferrer">
              {tl(p.link.label)} ↗
            </a>
          </div>
        </MeReveal>
      ))}
    </section>
  );
}

function AskYourAgent() {
  const { tl } = useI18n();
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);
  const prompt = tl(ME.agent.prompt)
    .replace("{cv}", `${origin}${ME.cvPdf}`)
    .replace("{page}", `${origin}/me`);
  const q = encodeURIComponent(prompt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="me-paper me-section" aria-labelledby="me-agent-title">
      <div className="me-wrap me-split me-split-top">
        <div className="me-split-text">
          <MeReveal>
            <h2 id="me-agent-title" className="me-display me-display-lg me-ink">
              {tl(ME.agent.title)}
            </h2>
          </MeReveal>
          <MeReveal delay={80}>
            <p className="me-lead">{tl(ME.agent.lead)}</p>
            <p className="me-copy">{tl(ME.agent.body)}</p>
          </MeReveal>
          <MeReveal delay={140}>
            <div className="me-btn-row">
              <a className="me-pill me-pill-dark" href={`https://claude.ai/new?q=${q}`} target="_blank" rel="noopener noreferrer">
                {tl(ME.agent.openClaude)} ↗
              </a>
              <a className="me-pill me-pill-outline" href={`https://chatgpt.com/?q=${q}`} target="_blank" rel="noopener noreferrer">
                {tl(ME.agent.openChatGPT)} ↗
              </a>
            </div>
            <p className="me-mono me-prompt">
              <span aria-hidden>› </span>
              {prompt}
            </p>
            <div className="me-prompt-actions">
              <button type="button" className="me-mono" onClick={copy}>
                {copied ? tl(ME.agent.copied) : tl(ME.agent.copy)}
              </button>
              <a className="me-mono" href={ME.cvPdf} download>
                {tl(ME.agent.download)} ↓
              </a>
            </div>
          </MeReveal>
        </div>
        <MeReveal delay={120} className="me-index-wrap">
          <div className="me-index-head me-mono">
            <span>{tl(ME.agent.indexLabel)}</span>
            <span>0{ME.agent.index.length}</span>
          </div>
          <ol className="me-index">
            {ME.agent.index.map((item, i) => (
              <li key={item.title.en}>
                <span className="me-mono me-index-num">0{i + 1}</span>
                <span className="me-index-title">
                  {tl(item.title)}
                  <span className="me-mono me-index-meta">{item.meta}</span>
                </span>
                <span className="me-mono me-index-year">{item.year}</span>
              </li>
            ))}
          </ol>
        </MeReveal>
      </div>
    </section>
  );
}

function ClosingCta() {
  const { tl } = useI18n();
  return (
    <section className="me-cta" aria-labelledby="me-cta-title">
      <Image src="/me/cta.webp" alt="" fill sizes="100vw" className="me-cta-img" />
      <div className="me-cta-shade" aria-hidden />
      <div className="me-wrap me-cta-inner">
        <MeReveal>
          <h2 id="me-cta-title" className="me-display me-display-xl">
            {tl(ME.cta.title)}
          </h2>
        </MeReveal>
        <MeReveal delay={100}>
          <p className="me-hero-body">{tl(ME.cta.body)}</p>
        </MeReveal>
        <MeReveal delay={180}>
          <a className="me-pill me-pill-light" href={`mailto:${ME.email}`}>
            {tl(ME.cta.button)}
          </a>
        </MeReveal>
      </div>
      <footer className="me-wrap me-footer">
        <div className="me-footer-row">
          <span className="me-wordmark">{ME.name}</span>
          <span className="me-footer-tag">{tl(ME.footer.tagline)}</span>
        </div>
        <div className="me-footer-row me-footer-meta me-mono">
          <span>© {new Date().getFullYear()} Francisco Perez</span>
          <span className="me-footer-links">
            <a href={ME.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a href={ME.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a href={`mailto:${ME.email}`}>Email ↗</a>
          </span>
        </div>
      </footer>
    </section>
  );
}

export function MePage({ fontClassName }: { fontClassName: string }) {
  return (
    <div className={`me-root ${fontClassName}`}>
      <Header />
      <main id="main-content">
        <Hero />
        <Statement />
        <MeLayers />
        <About />
        <Process />
        <Projects />
        <AskYourAgent />
        <ClosingCta />
      </main>
    </div>
  );
}
