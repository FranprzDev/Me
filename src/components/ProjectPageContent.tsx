"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { CV } from "@/data/cv";
import { PROJECTS, type Project, type ProjectItem } from "@/data/projects";
import { useI18n } from "@/lib/i18n";
import gsap from "gsap";
import { countUp, drawOnEnter, drawOnScroll, revealStagger, scrubNumber, useScrollScene } from "@/lib/scrollFX";

/** Rango de años que cubren los sub-proyectos de un planeta. */
function seasonOf(items: ProjectItem[]) {
  const years = items
    .map((item) => Number(item.year.slice(0, 4)))
    .filter((year) => Number.isFinite(year));
  if (!years.length) return "";
  const from = Math.min(...years);
  const to = Math.max(...years);
  return from === to ? String(from) : `${from} — ${to}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Contenido de la página de un planeta. Cada mundo tiene su propio lenguaje
 * visual (partida, aula, atlas, bitácora) pero comparten navegación, i18n y
 * el mismo contexto de scroll del sitio.
 */
export function ProjectPageContent({ slug }: { slug: string }) {
  const project = PROJECTS.find((x) => x.slug === slug);
  if (!project) notFound();
  if (slug === "hackathons") return <HackathonJourney project={project} />;
  if (slug === "curso-n8n") return <MentorshipJourney project={project} />;
  if (slug === "projects") return <ProjectAtlas project={project} />;
  if (slug === "university") return <UniversityJourney project={project} />;
  return <DossierJourney project={project} />;
}

function StoryBack() {
  const { t } = useI18n();
  return <Link href="/#projects" className="story-back">{t("proj_back")}</Link>;
}

function ExternalLink({ href }: { href: string }) {
  const { tl } = useI18n();
  const isRepo = href.includes("github.com");
  return (
    <a className="story-link" href={href} target="_blank" rel="noreferrer">
      {isRepo
        ? tl({ es: "Abrir repositorio", en: "Open repository" })
        : tl({ es: "Ver en vivo", en: "View live" })}{" "}↗
    </a>
  );
}

/** Salto al planeta hermano: mantiene el recorrido entre mundos. */
function PlanetNav({ slug }: { slug: string }) {
  const { tl } = useI18n();
  const total = PROJECTS.length;
  const index = PROJECTS.findIndex((p) => p.slug === slug);
  const prev = PROJECTS[(index - 1 + total) % total];
  const next = PROJECTS[(index + 1) % total];
  const nameOf = (p: Project) => (p.title ? tl(p.title) : p.name);

  return (
    <nav className="planet-nav" aria-label={tl({ es: "Otros mundos", en: "Other worlds" })}>
      <Link className="planet-nav__side planet-nav__side--prev" href={`/${prev.slug}`}>
        <span aria-hidden="true">←</span>
        <div>
          <small>{tl({ es: "Mundo anterior", en: "Previous world" })}</small>
          <b>{nameOf(prev)}</b>
        </div>
      </Link>

      <span className="planet-nav__orbit" aria-hidden="true">
        {PROJECTS.map((p) => (
          <i
            key={p.slug}
            style={{
              background: p.planet.atmoA,
              opacity: p.slug === slug ? 1 : 0.25,
              boxShadow: p.slug === slug ? `0 0 10px ${p.planet.atmoA}` : "none",
            }}
          />
        ))}
      </span>

      <Link className="planet-nav__side planet-nav__side--next" href={`/${next.slug}`}>
        <div>
          <small>{tl({ es: "Mundo siguiente", en: "Next world" })}</small>
          <b>{nameOf(next)}</b>
        </div>
        <span aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}

/* ─────────────────────────────  /hackathons  ───────────────────────────── */

/** Partida de HH:MM:SS a partir de segundos (con负 cero opcional). */
function clock(seconds: number) {
  const total = Math.max(0, seconds);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(total % 60)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Control de lanzamiento: HUD de sprint, radar de misiones, trofeo nacional y
 * un riel cronológico de Challenges. Verde night-vision + ámbar de victoria.
 *
 * coreografía: el barrido del radar y el T-minus están atados al scroll, el riel
 * se dibuja de arriba hacia abajo y cada misión entra cuando su nodo aparece.
 */
function HackathonJourney({ project }: { project: Project }) {
  const { tl } = useI18n();
  const items = project.items ?? [];
  const winner = items.find((item) => item.highlight);
  const missions = items.filter((item) => item !== winner);
  const wins = items.filter((item) => item.highlight).length;
  const season = seasonOf(items);
  const [seasonFrom, seasonTo] = season.includes("—")
    ? season.split("—").map((v) => Number(v.trim()))
    : [Number(season), Number(season)];

  const ref = useScrollScene((root) => {
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);

    // Hero: entra por partes, como si el HUD encendiera al armar la consola.
    revealStagger(".arena-hero__copy > *", {
      trigger: q(".arena-hero")!,
      y: 22,
      stagger: 0.08,
      start: "top 92%",
    });
    const radar = q(".arena-radar");
    if (radar) {
      gsap.from(radar, {
        opacity: 0,
        scale: 0.86,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: q(".arena-hero")!, start: "top 92%", once: true },
      });
    }

    // Radar: el barrido gira con el scroll (en vez de un loop infinito), así
    // el mismo gesto que baja la página es lo que "barre" el sector.
    const sweep = q<SVGGElement>(".arena-sweep");
    if (sweep) {
      gsap.to(sweep, {
        rotate: "+=540",
        ease: "none",
        scrollTrigger: {
          trigger: q(".arena-hero")!,
          start: "top top",
          end: "bottom top",
          scrub: 0.7,
        },
      });
    }

    // T-minus: cuenta hacia cero mientras el lector recorre el bloque.
    scrubNumber(q(".arena-radar__t-minus b"), 48 * 3600, 0, {
      trigger: q(".arena-hero")!,
      end: "bottom 30%",
      format: clock,
    });

    // Stats: contadores al entrar.
    const stats = q(".hud-stats");
    if (stats) {
      countUp(q(".hud-stats dd:nth-child(1)"), items.length, { trigger: stats, pad: 2 });
      countUp(q(".hud-stats dd:nth-child(2)"), seasonTo, {
        trigger: stats,
        format: (v) => `${seasonFrom} — ${Math.round(v)}`,
      });
      countUp(q(".hud-stats dd:nth-child(3)"), wins, { trigger: stats, pad: 2 });
    }

    // Trofeo: entra de lado, como una placa que se descuenta.
    const trophy = q(".arena-trophy");
    if (trophy) {
      revealStagger(".arena-trophy__badge, .arena-trophy__copy > *", {
        trigger: trophy,
        x: -26,
        y: 0,
        stagger: 0.09,
      });
    }

    // Riel: la línea se dibuja de arriba hacia abajo al ritmo del scroll.
    const rail = q(".mission-rail");
    if (rail) {
      gsap.fromTo(
        rail,
        { "--rail-progress": "0%" },
        {
          "--rail-progress": "100%",
          ease: "none",
          scrollTrigger: { trigger: rail, start: "top 72%", end: "bottom 65%", scrub: 0.6 },
        }
      );
    }
    revealStagger(".mission", { trigger: q(".arena-missions")!, y: 30, stagger: 0.12, start: "top 78%" });

    // Nodos: cada punto hace "ping" al entrar en el riel.
    root.querySelectorAll(".mission").forEach((mission) => {
      const node = mission.querySelector(".mission__node i");
      const code = mission.querySelector(".mission__code");
      if (!node) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: mission, start: "top 85%", once: true },
      });
      tl.fromTo(node, { scale: 0.4 }, { scale: 1, duration: 0.45, ease: "back.out(2.6)" })
        .to(node, { boxShadow: "0 0 26px currentColor", duration: 0.6, ease: "power2.out" }, "-=0.2");
      if (code) {
        tl.fromTo(code, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out" }, "<0.1");
      }
    });

    // Cierre: el outro y la navegación entre mundos se asientan al final.
    revealStagger(".arena-outro, .planet-nav__side, .planet-nav__orbit", {
      trigger: q(".planet-nav")!,
      y: 18,
      stagger: 0.08,
      start: "top 95%",
    });
  });

  return (
    <article
      ref={ref}
      className="arena-page"
      style={
        { "--planet": project.planet.atmoA, "--planet-2": project.planet.atmoB } as React.CSSProperties
      }
    >
      <StoryBack />

      <header className="arena-hero">
        <div className="arena-hero__copy">
          <p className="hud-kicker">
            {tl({ es: "HACKATHONS · TRABAJO EN EQUIPO · TUCUMÁN", en: "HACKATHONS · TEAMWORK · TUCUMÁN" })}
          </p>
          <h1>{tl({ es: "Ideas contra el reloj.", en: "Ideas against the clock." })}</h1>
          <p className="arena-hero__lede">{tl(project.tagline)}</p>
          <p className="arena-hero__body">{tl(project.description)}</p>
          <dl className="hud-stats">
            <div><dd>{pad(items.length)}</dd><dt>{tl({ es: "Misiones", en: "Missions" })}</dt></div>
            <div><dd>{seasonOf(items)}</dd><dt>{tl({ es: "Temporada", en: "Season" })}</dt></div>
            <div><dd>{pad(wins)}</dd><dt>{tl({ es: "Victoria nacional", en: "National win" })}</dt></div>
          </dl>
        </div>

        <div className="arena-radar">
          <svg viewBox="0 0 240 240" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="arena-sweep" x1="120" y1="120" x2="120" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor={project.planet.atmoA} stopOpacity=".45" />
                <stop offset="1" stopColor={project.planet.atmoA} stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke={project.planet.atmoA} strokeOpacity=".22">
              <circle cx="120" cy="120" r="94" />
              <circle cx="120" cy="120" r="68" strokeDasharray="3 7" />
              <circle cx="120" cy="120" r="42" strokeOpacity=".4" />
              <path d="M120 16v208M16 120h208" strokeOpacity=".14" />
            </g>
            <g className="arena-sweep">
              <path d="M120 120V26a94 94 0 0 1 81.4 47Z" fill="url(#arena-sweep)" />
              <path d="M120 26a94 94 0 0 1 81.4 47" stroke={project.planet.atmoA} strokeOpacity=".55" />
            </g>
            <g fill={project.planet.atmoB}>
              <circle cx="176" cy="82" r="4" />
              <circle cx="70" cy="158" r="3" />
              <circle cx="150" cy="186" r="3" />
            </g>
            <circle cx="120" cy="120" r="2" fill={project.planet.atmoB} />
          </svg>
          <p className="arena-radar__t-minus">
            <span>T−</span><b>48:00:00</b>
            <i aria-hidden="true" />
          </p>
          <p className="arena-radar__legend">
            {tl({ es: "Radar de Challenges · señal activa", en: "Challenge radar · signal active" })}
          </p>
        </div>
      </header>

      {winner && (
        <section className="arena-trophy" aria-labelledby="arena-trophy-title">
          <div className="arena-trophy__badge" aria-hidden="true">
            <svg viewBox="0 0 132 132" fill="none">
              <circle cx="66" cy="66" r="62" stroke="currentColor" strokeOpacity=".3" strokeDasharray="2 6" />
              <circle cx="66" cy="66" r="47" stroke="currentColor" strokeOpacity=".65" />
              <path
                d="m66 32 6.6 16.6L90 46.2l-11.4 13.5L92 76l-17.6-5.6L66 88l-8.4-17.6L40 76l13.4-16.3L42 46.3l17.4 2.3z"
                fill="currentColor"
                fillOpacity=".9"
              />
            </svg>
            <span>NASA</span>
            <b>SPACE APPS</b>
            <i>{winner.year}</i>
          </div>
          <div className="arena-trophy__copy">
            <p className="hud-kicker">
              {tl({ es: "HITO DESTACADO · GANADOR NACIONAL", en: "FEATURED MILESTONE · NATIONAL WINNER" })}
            </p>
            <h2 id="arena-trophy-title">{winner.name}</h2>
            <p>{tl(winner.description)}</p>
            {winner.link && <ExternalLink href={winner.link} />}
          </div>
          <span className="arena-trophy__ribbon" aria-hidden="true">
            {tl({ es: "N°1 nacional", en: "N°1 national" })}
          </span>
        </section>
      )}

      <section className="arena-missions" aria-labelledby="arena-missions-title">
        <header className="hud-title">
          <span>{tl({ es: "REGISTRO DE MISIONES", en: "MISSION LOG" })}</span>
          <h2 id="arena-missions-title">
            {tl({ es: "Cada edición, un problema distinto", en: "Every edition, a different problem" })}
          </h2>
        </header>
        <ol className="mission-rail">
          {missions.map((item, i) => (
            <li className="mission" key={item.name}>
              <span className="mission__node" aria-hidden="true">
                <i />
                {pad(i + 1)}
              </span>
              <div className="mission__body">
                <div className="mission__meta">
                  <span>{item.year}</span>
                </div>
                <h3>{item.name}</h3>
                <p>{tl(item.description)}</p>
                {item.link && <ExternalLink href={item.link} />}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="arena-outro">
        <span aria-hidden="true">▲</span>
        {tl({ es: "Sin ideas cerradas: siempre hay una misión en curso.", en: "No finished ideas: a mission is always running." })}
      </footer>

      <PlanetNav slug="hackathons" />
    </article>
  );
}

/* ─────────────────────────────  /curso-n8n  ───────────────────────────── */

const COURSE_TOPICS = ["n8n", "APIs & Webhooks", "RAG", "Human-in-the-Loop"];
const DIAL_RADIUS = 54;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

/**
 * El aula: dial de encuentros, programa numerado del curso destacado y una
 * estantería de recursos abiertos. Ámbar cálido y tipografía editorial.
 *
 * coreografía: el dial se llena segmento a segmento con el scroll y el número
 * central cuenta los encuentros; el programa entra en cascada como una lista
 * que se pasa en clase.
 */
function MentorshipJourney({ project }: { project: Project }) {
  const { tl } = useI18n();
  const course = project.items?.find((item) => item.category?.es === "Curso destacado");
  const materials = project.items?.filter((item) => item.category?.es === "Materiales del curso") ?? [];

  const ref = useScrollScene((root) => {
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);

    revealStagger(".aula-hero__copy > *", { trigger: q(".aula-hero")!, y: 22, stagger: 0.08 });

    const dial = q(".aula-dial");
    if (dial) {
      gsap.from(dial, {
        opacity: 0,
        scale: 0.9,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: dial, start: "top 92%", once: true },
      });
      // El dial se "marca" a medida que el lector recorre el bloque: cada
      // segmento se enciende uno tras otro, como una clase que avanza.
      const segments = root.querySelectorAll(".aula-dial__segment");
      gsap.set(segments, { opacity: 0.14 });
      gsap.to(segments, {
        opacity: 1,
        duration: 0.35,
        stagger: 0.09,
        ease: "power2.out",
        scrollTrigger: { trigger: dial, start: "top 78%", end: "bottom 55%", scrub: 0.8 },
      });
      countUp(q(".aula-dial__core span"), 10, { trigger: dial, start: "top 80%" });
    }

    // Facts: los números de la ficha también cuentan.
    const facts = q(".aula-facts");
    if (facts) {
      countUp(q(".aula-facts div:nth-child(1) dd"), 10, { trigger: facts, start: "top 90%" });
      countUp(q(".aula-facts div:nth-child(2) dd"), 20, { trigger: facts, start: "top 90%" });
    }

    // Programa: entra como una lista que se lee, con el título primero.
    const courseBlock = q(".aula-course");
    if (courseBlock) {
      revealStagger(".aula-course__label, .aula-course h2, .aula-course > p", {
        trigger: courseBlock,
        y: 20,
        stagger: 0.08,
      });
      revealStagger(".aula-syllabus li", {
        trigger: q(".aula-syllabus")!,
        x: -18,
        y: 0,
        stagger: 0.1,
        start: "top 88%",
      });
    }

    // Biblioteca: los libros se deslizan como se sacan del estante.
    revealStagger(".aula-book", { trigger: q(".aula-shelf")!, x: 24, y: 0, stagger: 0.12 });

    revealStagger(".aula-outro, .planet-nav__side, .planet-nav__orbit", {
      trigger: q(".planet-nav")!,
      y: 18,
      stagger: 0.08,
      start: "top 95%",
    });
  });

  return (
    <article
      ref={ref}
      className="aula-page"
      style={
        { "--planet": project.planet.atmoA, "--planet-2": project.planet.atmoB } as React.CSSProperties
      }
    >
      <StoryBack />

      <header className="aula-hero">
        <div className="aula-hero__copy">
          <p className="aula-kicker">
            {tl({ es: "ENSEÑAR · ACOMPAÑAR · COMPARTIR", en: "TEACH · GUIDE · SHARE" })}
          </p>
          <h1>{tl({ es: "Mentorías", en: "Teaching & Mentorship" })}</h1>
          <p className="aula-hero__lede">{tl(project.tagline)}</p>
          <p className="aula-hero__body">{tl(project.description)}</p>
          <dl className="aula-facts">
            <div><dt>{tl({ es: "Encuentros", en: "Sessions" })}</dt><dd>10</dd></div>
            <div><dt>{tl({ es: "Horas de clase", en: "Class hours" })}</dt><dd>20</dd></div>
            <div>
              <dt>{tl({ es: "Destinatarios", en: "Audience" })}</dt>
              <dd>{tl({ es: "Poder Judicial de Tucumán", en: "Tucumán Judiciary" })}</dd>
            </div>
          </dl>
        </div>

        <div className="aula-dial">
          <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              {Array.from({ length: 10 }, (_, i) => (
                <circle
                  key={i}
                  className="aula-dial__segment"
                  cx="80"
                  cy="80"
                  r={DIAL_RADIUS}
                  strokeDasharray={`24 ${DIAL_CIRCUMFERENCE / 10 - 24}`}
                  strokeDashoffset={-(DIAL_CIRCUMFERENCE / 10) * i}
                  transform={`rotate(${-90 + 36 * i} 80 80)`}
                />
              ))}
            </g>
            <path d="M80 12l5 9H75z" fill="currentColor" />
          </svg>
          <div className="aula-dial__core">
            <span>10</span>
            <b>{tl({ es: "ENCUENTROS", en: "SESSIONS" })}</b>
            <i>2025</i>
          </div>
        </div>
      </header>

      {course && (
        <section className="aula-course" aria-labelledby="aula-course-title">
          <header className="aula-course__label">
            <span>{tl({ es: "PROGRAMA · CURSO DESTACADO", en: "SYLLABUS · FEATURED COURSE" })}</span>
            <span>{course.year}</span>
          </header>
          <h2 id="aula-course-title">{course.name}</h2>
          <p>{tl(course.description)}</p>
          <ol className="aula-syllabus">
            {COURSE_TOPICS.map((topic, i) => (
              <li key={topic}>
                <span>{pad(i + 1)}</span>
                <b>{topic}</b>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="aula-library" aria-labelledby="aula-library-title">
        <header className="aula-heading">
          <span>{tl({ es: "RECURSOS ABIERTOS", en: "OPEN RESOURCES" })}</span>
          <h2 id="aula-library-title">
            {tl({ es: "Materiales que usamos en clase", en: "Materials used in class" })}
          </h2>
          <p>
            {tl({
              es: "Repositorios que quedan abiertos para que el grupo practique, reutilice y mejore lo que vimos.",
              en: "Repositories left open so the group can practise, reuse and improve what we covered.",
            })}
          </p>
        </header>
        <ul className="aula-shelf">
          {materials.map((item, i) => (
            <li className="aula-book" key={item.name}>
              <span className="aula-book__index">{pad(i + 1)}</span>
              <div className="aula-book__copy">
                <h3>{item.name}</h3>
                <p>{tl(item.description)}</p>
              </div>
              {item.link && <ExternalLink href={item.link} />}
            </li>
          ))}
        </ul>
      </section>

      <footer className="aula-outro">
        <span aria-hidden="true">✦</span>
        {tl({ es: "El aula sigue abierta para quien quiera aprender.", en: "The classroom stays open for anyone who wants to learn." })}
      </footer>

      <PlanetNav slug="curso-n8n" />
    </article>
  );
}

/* ─────────────────────────────  /projects  ───────────────────────────── */

/**
 * El atlas: cartografía de herramientas. Blueprint isométrico, ficha técnica y
 * un catálogo por categorías donde cada proyecto es una fila, no una tarjeta.
 *
 * coreografía: el plano se dibuja trazo a trazo mientras se recorre el hero
 * (como si se trazara la cartografía), la ficha cuenta y las filas del
 * catálogo entran por bloques de categoría.
 */
function ProjectAtlas({ project }: { project: Project }) {
  const { tl } = useI18n();
  const items = project.items ?? [];
  const categories = [...new Set(items.map((item) => item.category?.es ?? "Otros"))];
  const highlights = items.filter((item) => item.highlight).length;

  const ref = useScrollScene((root) => {
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);

    revealStagger(".atlas-hero__copy > *", { trigger: q(".atlas-hero")!, y: 24, stagger: 0.09 });

    // El plano se dibuja con el scroll: el lector "trazando" la cartografía.
    drawOnScroll(".atlas-blueprint svg rect, .atlas-blueprint svg circle", {
      trigger: q(".atlas-hero")!,
      from: "top 80%",
      to: "bottom 55%",
    });
    drawOnEnter(".atlas-blueprint svg path", {
      trigger: q(".atlas-blueprint")!,
      duration: 1,
      stagger: 0.14,
    });
    const blueprint = q(".atlas-blueprint");
    if (blueprint) {
      gsap.from(blueprint.querySelectorAll("g[fill] circle"), {
        opacity: 0,
        scale: 0,
        transformOrigin: "center",
        duration: 0.55,
        stagger: 0.13,
        ease: "back.out(2.2)",
        scrollTrigger: { trigger: blueprint, start: "top 78%", once: true },
      });
    }

    // Ficha técnica: cada celda cuenta su valor.
    const specs = q(".atlas-specs");
    if (specs) {
      countUp(q(".atlas-specs div:nth-child(1) dd"), items.length, { trigger: specs, pad: 2 });
      countUp(q(".atlas-specs div:nth-child(2) dd"), categories.length, { trigger: specs, pad: 2 });
      countUp(q(".atlas-specs div:nth-child(4) dd"), highlights, { trigger: specs, pad: 2 });
      revealStagger(".atlas-specs div", { trigger: specs, y: 14, stagger: 0.06, start: "top 92%" });
    }

    // Catálogo: cada categoría entra como un bloque y sus filas en cascada.
    root.querySelectorAll(".atlas-category").forEach((category) => {
      revealStagger(".atlas-category__head > *", { trigger: category, y: 14, stagger: 0.07 });
      revealStagger(".atlas-row", { trigger: category, x: 22, y: 0, stagger: 0.08 });
      // La fila se ilumina de izquierda a derecha al enfocar/hover.
      category.querySelectorAll(".atlas-row").forEach((row) => {
        gsap.fromTo(
          row,
          { "--row-wipe": "0%" },
          { "--row-wipe": "100%", ease: "none", scrollTrigger: { trigger: row, start: "top 92%", end: "top 55%", scrub: 0.8 } }
        );
      });
    });

    revealStagger(".atlas-outro > *, .planet-nav__side, .planet-nav__orbit", {
      trigger: q(".planet-nav")!,
      y: 16,
      stagger: 0.06,
      start: "top 95%",
    });
  });

  return (
    <article
      ref={ref}
      className="atlas-page"
      style={
        { "--planet": project.planet.atmoA, "--planet-2": project.planet.atmoB } as React.CSSProperties
      }
    >
      <StoryBack />

      <header className="atlas-hero">
        <div className="atlas-hero__copy">
          <p className="atlas-kicker">
            {tl({ es: "LABORATORIO PERSONAL · HERRAMIENTAS SELECCIONADAS", en: "PERSONAL LAB · SELECTED TOOLS" })}
          </p>
          <h1>{tl({ es: "Construyo para resolver cosas reales.", en: "I build to solve real things." })}</h1>
          <p className="atlas-hero__lede">{tl(project.tagline)}</p>
          <p className="atlas-hero__body">{tl(project.description)}</p>
          {project.link && <ExternalLink href={project.link} />}
        </div>

        <figure className="atlas-blueprint">
          <svg viewBox="0 0 260 260" fill="none" aria-hidden="true">
            <g stroke="currentColor" strokeOpacity=".26" strokeWidth="1">
              <rect x="69" y="69" width="122" height="122" transform="rotate(45 130 130)" />
              <rect x="86" y="86" width="88" height="88" transform="rotate(45 130 130)" />
              <rect x="103" y="103" width="54" height="54" transform="rotate(45 130 130)" />
              <circle cx="130" cy="130" r="88" strokeDasharray="2 8" />
              <path d="M130 8v244M8 130h244" strokeDasharray="4 9" strokeOpacity=".16" />
            </g>
            <g stroke="currentColor" strokeOpacity=".7" strokeWidth="1.4">
              <path d="M130 42 214 189" strokeOpacity=".28" />
              <path d="M130 42 46 189" strokeOpacity=".28" />
            </g>
            <g fill="currentColor">
              <circle cx="130" cy="42" r="4.5" fillOpacity=".95" />
              <circle cx="214" cy="189" r="3.5" fillOpacity=".7" />
              <circle cx="46" cy="189" r="3.5" fillOpacity=".7" />
            </g>
          </svg>
          <figcaption>
            {tl({ es: "CARTOGRAFÍA DE HERRAMIENTAS", en: "TOOL CARTOGRAPHY" })} · {pad(items.length)}{" "}
            {tl({ es: "FICHAS", en: "FILES" })}
          </figcaption>
        </figure>
      </header>

      <dl className="atlas-specs">
        <div><dt>{tl({ es: "Herramientas", en: "Tools" })}</dt><dd>{pad(items.length)}</dd></div>
        <div><dt>{tl({ es: "Categorías", en: "Categories" })}</dt><dd>{pad(categories.length)}</dd></div>
        <div><dt>{tl({ es: "Periodo", en: "Period" })}</dt><dd>{project.year}</dd></div>
        <div><dt>{tl({ es: "Destacados", en: "Highlights" })}</dt><dd>{pad(highlights)}</dd></div>
      </dl>

      <div className="atlas-catalog">
        {categories.map((category, index) => {
          const group = items.filter((item) => (item.category?.es ?? "Otros") === category);
          const label = group[0].category ?? { es: category, en: category };
          return (
            <section className="atlas-category" key={category} aria-labelledby={`atlas-category-${index}`}>
              <header className="atlas-category__head">
                <span>{pad(index + 1)}</span>
                <h2 id={`atlas-category-${index}`}>{tl(label)}</h2>
                <i>{tl({ es: `${group.length} ${group.length === 1 ? "proyecto" : "proyectos"}`, en: `${group.length} ${group.length === 1 ? "project" : "projects"}` })}</i>
              </header>
              <ul className="atlas-rows">
                {group.map((item) => (
                  <li className="atlas-row" key={item.name}>
                    <div className="atlas-row__main">
                      <h3>{item.name}</h3>
                      <p>{tl(item.description)}</p>
                    </div>
                    <div className="atlas-row__aside">
                      <span className="atlas-row__year">{item.year}</span>
                      {item.highlight && <span className="atlas-row__flag">★ {tl(item.highlight)}</span>}
                      {item.link && <ExternalLink href={item.link} />}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <footer className="atlas-outro">
        <span>{tl({ es: "STACK", en: "STACK" })}</span>
        <p className="stack-note">{project.stack.join(" · ")}</p>
        {project.link && <ExternalLink href={project.link} />}
      </footer>

      <PlanetNav slug="projects" />
    </article>
  );
}

/* ─────────────────────────────  /university  ───────────────────────────── */

/** Bitácora de exploración: la carrera, las certificaciones y los proyectos.
 *
 * coreografía: la ruta de la órbita se dibuja al bajar, los waypoints se
 * encienden en orden cronológico y los certificados caen en cascada.
 */
function UniversityJourney({ project }: { project: Project }) {
  const { t, tl } = useI18n();
  const degree = CV.education[0];
  const academicProjects = project.items?.filter((item) => item.category?.es === "Proyectos Académicos UTN-FRT") ?? [];

  const ref = useScrollScene((root) => {
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);

    revealStagger(".edu-hero__copy > *", { trigger: q(".edu-hero")!, y: 24, stagger: 0.09 });

    // La órbita: la ruta se dibuja y el planeta gira levemente al bajar.
    drawOnScroll(".edu-orbit svg path[stroke^='url']", {
      trigger: q(".edu-orbit")!,
      from: "top 85%",
      to: "bottom 45%",
    });
    const orbit = q(".edu-orbit");
    if (orbit) {
      gsap.from(orbit, {
        opacity: 0,
        y: 30,
        duration: 0.95,
        ease: "power3.out",
        scrollTrigger: { trigger: orbit, start: "top 92%", once: true },
      });
      // Waypoints: cada punto de la ruta se ilumina en orden.
      gsap.utils.toArray<SVGCircleElement>(".edu-orbit svg circle[stroke]").forEach((dot) => {
        gsap.fromTo(
          dot,
          { scale: 0.2, transformOrigin: "center", opacity: 0.3 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(2.4)",
            scrollTrigger: { trigger: orbit, start: "top 78%", end: "bottom 50%", scrub: 1 },
          }
        );
      });
    }
    revealStagger(".edu-orbit__tag, .edu-orbit__legend", {
      trigger: q(".edu-orbit")!,
      y: 12,
      stagger: 0.14,
      start: "top 62%",
    });

    // Chapters: la barra de etapas entra como un índice.
    revealStagger(".edu-chapters a", { trigger: q(".edu-chapters")!, y: 16, stagger: 0.09 });

    // Secciones: encabezado + contenido de cada etapa.
    root.querySelectorAll(".edu-section").forEach((section) => {
      revealStagger(".edu-section__heading > *", { trigger: section, y: 18, stagger: 0.08 });
    });

    const degreeBlock = q(".edu-degree");
    if (degreeBlock) {
      revealStagger(".edu-degree__mark, .edu-degree__copy > *, .edu-degree__status", {
        trigger: degreeBlock,
        x: -20,
        y: 0,
        stagger: 0.09,
      });
    }
    revealStagger(".edu-certificate", { trigger: q(".edu-certificates")!, y: 22, stagger: 0.07 });
    revealStagger(".edu-project", { trigger: q(".edu-projects")!, y: 20, stagger: 0.07 });

    revealStagger(".edu-outro, .planet-nav__side, .planet-nav__orbit", {
      trigger: q(".planet-nav")!,
      y: 16,
      stagger: 0.08,
      start: "top 95%",
    });
  });

  return (
    <article ref={ref} className="edu-page" style={{ "--planet": project.planet.atmoA } as React.CSSProperties}>
      <Link href="/#projects" className="edu-back">{t("proj_back")}</Link>

      <header className="edu-hero">
        <div className="edu-hero__copy">
          <p className="edu-kicker">{tl({ es: "BITÁCORA DE EXPLORACIÓN · TUCUMÁN", en: "EXPLORER'S LOG · TUCUMÁN" })}</p>
          <h1>{tl({ es: "El camino hacia un nuevo mundo", en: "The path to a new world" })}</h1>
          <p className="edu-hero__intro">{tl({
            es: "Estudio Ingeniería en Sistemas en la UTN-FRT. Cada materia, curso y desafío me acerca a una forma nueva de resolver problemas.",
            en: "I study Information Systems Engineering at UTN-FRT. Every class, course and challenge brings a new way to solve problems.",
          })}</p>
          <span className="edu-hero__coordinates">26°49′S&nbsp; 65°12′W <i /> {tl({ es: "RUTA ACTIVA", en: "ACTIVE ROUTE" })}</span>
        </div>

        <div className="edu-orbit" aria-hidden="true">
          <svg viewBox="0 0 440 360" fill="none">
            <defs>
              <radialGradient id="edu-core" cx="0" cy="0" r="1" gradientTransform="matrix(0 123 -123 0 250 166)" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3C779" />
                <stop offset=".27" stopColor="#B78DFF" />
                <stop offset="1" stopColor="#5140A8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="edu-route" x1="60" x2="370" y1="296" y2="57" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F3C779" />
                <stop offset=".56" stopColor="#B78DFF" />
                <stop offset="1" stopColor="#73D9F4" />
              </linearGradient>
            </defs>
            <ellipse cx="234" cy="181" stroke="#B9A7FF" strokeOpacity=".27" rx="190" ry="83" transform="rotate(-31 234 181)" />
            <ellipse cx="234" cy="181" stroke="#B9A7FF" strokeOpacity=".16" rx="153" ry="119" transform="rotate(34 234 181)" />
            <path d="M51 295C121 282 113 227 182 223s77 30 104-38S333 121 382 63" stroke="url(#edu-route)" strokeDasharray="5 8" strokeLinecap="round" strokeWidth="2" />
            <circle cx="51" cy="295" r="7" fill="#F3C779" stroke="#FFF1D4" strokeWidth="3" />
            <circle cx="182" cy="223" r="6" fill="#B78DFF" stroke="#E7DCFF" strokeWidth="3" />
            <circle cx="286" cy="185" r="6" fill="#B78DFF" stroke="#E7DCFF" strokeWidth="3" />
            <circle cx="382" cy="63" r="8" fill="#73D9F4" stroke="#D8FAFF" strokeWidth="3" />
            <circle cx="234" cy="181" r="92" fill="url(#edu-core)" fillOpacity=".72" />
            <circle cx="234" cy="181" r="48" fill="#18132E" stroke="#D4C1FF" strokeOpacity=".65" />
            <path d="M209 190c10-21 18-30 25-30 8 0 15 9 25 30M216 197h36" stroke="#F8EBCB" strokeLinecap="round" strokeWidth="3" />
            <path d="m119 72 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8ZM350 260l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#FFF1C9" />
            <circle cx="88" cy="137" r="2" fill="#fff" /><circle cx="328" cy="296" r="2" fill="#fff" />
          </svg>
          <div className="edu-orbit__tag edu-orbit__tag--start"><span>{tl({ es: "INICIO", en: "START" })}</span><b>UTN · 2022</b></div>
          <div className="edu-orbit__tag edu-orbit__tag--end"><span>{tl({ es: "DESTINO ABIERTO", en: "OPEN DESTINATION" })}</span><b>{tl({ es: "En formación", en: "Still learning" })}</b></div>
          <div className="edu-orbit__legend"><i /> {tl({ es: "CONOCIMIENTO EN MOVIMIENTO", en: "KNOWLEDGE IN MOTION" })}</div>
        </div>
      </header>

      <nav className="edu-chapters" aria-label={tl({ es: "Etapas del recorrido", en: "Journey stages" })}>
        <a href="#education-degree"><span>01</span>{tl({ es: "La carrera", en: "The degree" })}<b>↓</b></a>
        <a href="#education-certifications"><span>02</span>{tl({ es: "Certificaciones", en: "Certifications" })}<b>↓</b></a>
        <a href="#education-projects"><span>03</span>{tl({ es: "Proyectos de aula", en: "Academic projects" })}<b>↓</b></a>
      </nav>

      <section className="edu-section" id="education-degree" aria-labelledby="education-degree-title">
        <div className="edu-section__heading">
          <span>01 / ORIGEN</span>
          <h2 id="education-degree-title">{tl({ es: "La base de la travesía", en: "Where the journey begins" })}</h2>
        </div>
        <div className="edu-degree">
          <div className="edu-degree__mark" aria-hidden="true">UTN<span>FRT</span></div>
          <div className="edu-degree__copy">
            <p>{tl({ es: "FORMACIÓN DE GRADO", en: "UNDERGRADUATE DEGREE" })}</p>
            <h3>{tl(degree.degree)}</h3>
            <span>{degree.institution}</span>
          </div>
          <div className="edu-degree__status"><i />{tl(degree.period)}</div>
        </div>
      </section>

      <section className="edu-section" id="education-certifications" aria-labelledby="education-certifications-title">
        <div className="edu-section__heading">
          <span>02 / NUEVAS HERRAMIENTAS</span>
          <h2 id="education-certifications-title">{tl({ es: "Hitos que ampliaron el mapa", en: "Milestones that expanded the map" })}</h2>
        </div>
        <div className="edu-certificates">
          {CV.certifications.map((certification, index) => (
            <article className="edu-certificate" key={certification.name.es}>
              <span className="edu-certificate__index">0{index + 1}</span>
              <div>
                <span className="edu-certificate__period">{tl(certification.period)}</span>
                <h3>{tl(certification.name)}</h3>
                <p>{certification.school}</p>
              </div>
              {certification.highlight && <span className="edu-certificate__highlight">✦ {tl(certification.highlight)}</span>}
            </article>
          ))}
        </div>
      </section>

      {academicProjects.length > 0 && (
        <section className="edu-section edu-section--projects" id="education-projects" aria-labelledby="education-projects-title">
          <div className="edu-section__heading">
            <span>03 / EN EL CAMINO</span>
            <h2 id="education-projects-title">{tl({ es: "Ideas que probé en la práctica", en: "Ideas I put into practice" })}</h2>
            <p>{tl({ es: "Algunos trabajos de la carrera, puestos al servicio de aprender haciendo.", en: "A few degree projects, built to learn by doing." })}</p>
          </div>
          <div className="edu-projects">
            {academicProjects.map((item) => (
              <article className="edu-project" key={item.name}>
                <span>{item.year} · UTN-FRT</span>
                <h3>{item.name}</h3>
                <p>{tl(item.description)}</p>
                {item.link && <a href={item.link} target="_blank" rel="noreferrer">{tl({ es: "Ver proyecto", en: "View project" })} ↗</a>}
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="edu-outro"><span>✦</span>{tl({ es: "La exploración sigue.", en: "The exploration continues." })}</footer>

      <PlanetNav slug="university" />
    </article>
  );
}

/* ───────────────────────  fallback genérico  ─────────────────────── */

/** Expediente planetario por defecto para mundos nuevos sin diseño propio. */
function DossierJourney({ project }: { project: Project }) {
  const { tl } = useI18n();
  const items = project.items ?? [];
  const categories = [...new Set(items.map((item) => item.category?.es ?? "Otros"))];

  const ref = useScrollScene((root) => {
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
    revealStagger(".dossier-hero > *", { trigger: q(".dossier-hero")!, y: 22, stagger: 0.08 });
    revealStagger(".dossier-group .hud-title > *, .dossier-row", {
      trigger: q(".dossier-catalog")!,
      y: 20,
      stagger: 0.07,
    });
    revealStagger(".dossier-outro > *, .planet-nav__side, .planet-nav__orbit", {
      trigger: q(".planet-nav")!,
      y: 16,
      stagger: 0.07,
      start: "top 95%",
    });
  });

  return (
    <article
      ref={ref}
      className="dossier-page"
      style={
        { "--planet": project.planet.atmoA, "--planet-2": project.planet.atmoB } as React.CSSProperties
      }
    >
      <StoryBack />
      <header className="dossier-hero">
        <p className="hud-kicker">
          {project.year}{project.featured ? ` ★ ${tl({ es: "MUNDO DESTACADO", en: "FEATURED WORLD" })}` : ""}
        </p>
        <h1>{project.title ? tl(project.title) : project.name}</h1>
        <p className="dossier-hero__lede">{tl(project.tagline)}</p>
        <p className="dossier-hero__body">{tl(project.description)}</p>
        {project.link && <ExternalLink href={project.link} />}
      </header>

      {items.length > 0 && (
        <div className="dossier-catalog">
          {categories.map((category, index) => {
            const group = items.filter((item) => (item.category?.es ?? "Otros") === category);
            const label = group[0].category ?? { es: category, en: category };
            return (
              <section className="dossier-group" key={category} aria-labelledby={`dossier-group-${index}`}>
                <header className="hud-title">
                  <span>{pad(index + 1)} / {pad(group.length)}</span>
                  <h2 id={`dossier-group-${index}`}>{tl(label)}</h2>
                </header>
                <ul className="dossier-rows">
                  {group.map((item) => (
                    <li className="dossier-row" key={item.name}>
                      <div>
                        <h3>{item.name}</h3>
                        <p>{tl(item.description)}</p>
                      </div>
                      <div className="dossier-row__aside">
                        <span>{item.year}</span>
                        {item.link && <ExternalLink href={item.link} />}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <footer className="dossier-outro">
        <span>{tl({ es: "STACK", en: "STACK" })}</span>
        <p className="stack-note">{project.stack.join(" · ")}</p>
      </footer>

      <PlanetNav slug={project.slug} />
    </article>
  );
}
