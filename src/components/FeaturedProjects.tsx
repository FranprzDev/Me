"use client";

import { FEATURED_PROJECTS, FeaturedLinkKind, type FeaturedProject } from "@/data/featured";
import type { Localized } from "@/data/cv";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "@/components/Reveal";
import "./featured-projects.css";

const LINK_LABEL: Record<FeaturedLinkKind, Localized<string>> = {
  [FeaturedLinkKind.Demo]: { es: "Ver demo", en: "Live demo" },
  [FeaturedLinkKind.Code]: { es: "Código en GitHub", en: "Code on GitHub" },
  [FeaturedLinkKind.Contest]: { es: "Ficha en Colosseum", en: "Colosseum entry" },
};

const FIELD_LABEL = {
  problem: { es: "Problema", en: "Problem" },
  built: { es: "Qué construí", en: "What I built" },
  stack: { es: "Stack", en: "Stack" },
  outcome: { es: "Resultado", en: "Outcome" },
} satisfies Record<string, Localized<string>>;

const NEW_TAB: Localized<string> = { es: "(se abre en una pestaña nueva)", en: "(opens in a new tab)" };

function FeaturedCard({ project }: { project: FeaturedProject }) {
  const { tl } = useI18n();
  const titleId = `project-${project.id}-title`;
  return (
    <article id={`project-${project.id}`} className="featured-card glass" aria-labelledby={titleId}>
      <header>
        <p className="featured-card__context">{tl(project.context)}</p>
        <h4 id={titleId} className="featured-card__title">{project.name}</h4>
      </header>
      <dl className="featured-card__facts">
        <div>
          <dt>{tl(FIELD_LABEL.problem)}</dt>
          <dd>{tl(project.problem)}</dd>
        </div>
        <div>
          <dt>{tl(FIELD_LABEL.built)}</dt>
          <dd>{tl(project.built)}</dd>
        </div>
        {project.outcome ? (
          <div className="featured-card__outcome">
            <dt>{tl(FIELD_LABEL.outcome)}</dt>
            <dd>{tl(project.outcome)}</dd>
          </div>
        ) : null}
        <div>
          <dt>{tl(FIELD_LABEL.stack)}</dt>
          <dd>
            <ul className="featured-card__stack">
              {project.stack.map((tag) => (
                <li key={tag} className="chip">{tag}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <ul className="featured-card__links">
        {project.links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="featured-card__link"
              data-kind={link.kind}
              aria-label={`${tl(LINK_LABEL[link.kind])}: ${project.name} ${tl(NEW_TAB)}`}
            >
              {tl(LINK_LABEL[link.kind])} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

/**
 * Four project case studies under the worlds selector. They are plain
 * server-rendered markup (no canvas, no client-only data), so recruiters,
 * crawlers and visitors without JavaScript read the same content; the
 * ES/EN switch re-renders them like every other section.
 */
export function FeaturedProjects() {
  const { tl } = useI18n();
  return (
    <section className="featured" aria-labelledby="featured-title">
      <Reveal>
        <h3 id="featured-title" className="featured__title h-display">
          {tl({ es: "Proyectos destacados", en: "Featured projects" })}
        </h3>
        <p className="featured__intro">
          {tl({
            es: "Cuatro casos con el problema, lo que construí y en qué quedó. Cada mundo de arriba tiene el resto.",
            en: "Four cases with the problem, what I built and where it ended up. Each world above holds the rest.",
          })}
        </p>
      </Reveal>
      <div className="featured__grid">
        {FEATURED_PROJECTS.map((project) => (
          <FeaturedCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
