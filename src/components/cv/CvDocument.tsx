import { Fragment } from "react";
import { CvSection, type ResolvedCv } from "@/content/cv";
import { CvBar } from "./CvBar";
import { CvCosmos } from "./CvCosmos";
import { riseStyle } from "./motion";
import "./cv.css";

function sectionId(section: CvSection): string {
  return `cv-${section}`;
}

function SectionBody({ cv, section }: { cv: ResolvedCv; section: CvSection }) {
  switch (section) {
    case CvSection.Summary:
      return <p className="cv-summary">{cv.summary}</p>;
    case CvSection.Skills:
      return (
        <div className="cv-stack">
          <p>
            {cv.skills.map((row, index) => (
              <Fragment key={row.label}>
                {index > 0 ? " · " : null}
                <strong>{row.label}:</strong> {row.value}
              </Fragment>
            ))}
          </p>
          <p>
            <strong>{cv.skillsExtra.label}:</strong> {cv.skillsExtra.value}
          </p>
        </div>
      );
    case CvSection.Experience:
      return (
        <ol className="cv-list">
          {cv.experience.map((entry) => (
            <li key={`${entry.org}-${entry.role}`} className="cv-entry">
              <h3>
                {entry.role} - {entry.org}
                <span className="cv-entry__meta"> | {entry.meta}</span>
              </h3>
              {entry.bullets.length > 0 ? (
                <ul className="cv-bullets">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      );
    case CvSection.Projects:
      return (
        <ul className="cv-list cv-projects">
          {cv.projects.map((project) => (
            <li key={project.name} className="cv-project">
              <p>
                <strong>{project.name}</strong>
                {project.qualifier ? ` (${project.qualifier})` : ""}
                {" "}
                <span className="cv-project__sep">- </span>
                {project.detail}
              </p>
            </li>
          ))}
        </ul>
      );
    case CvSection.Education:
      return (
        <div className="cv-edu">
          {cv.education.map((entry) => (
            <p key={entry.institution} className="cv-edu__degree">
              {entry.degree}, {entry.institution} ({entry.period})
            </p>
          ))}
          {cv.certifications.map((group) => (
            <p key={group.school} className="cv-edu__certs">
              {group.school}: {group.items}
            </p>
          ))}
          <p className="cv-edu__langs">
            <strong>{cv.sectionTitles[CvSection.Languages]}:</strong> {cv.languages}
          </p>
        </div>
      );
    case CvSection.Certifications:
    case CvSection.Languages:
      return null;
  }
}

/**
 * The résumé itself: real text and semantic headings. On screen it wears the
 * portfolio's night-sky look (cv.css, `@media screen`); on paper it is the
 * approved one-page A4 layout (`@media print`) the PDFs are rendered from.
 */
export function CvDocument({ cv }: { cv: ResolvedCv }) {
  return (
    <div className="cv-root" lang={cv.locale} data-cv-variant={cv.variant}>
      <CvCosmos />
      <main id="main-content" className="cv-sheet" tabIndex={-1}>
        <CvBar locale={cv.locale} variant={cv.variant} />
        <article className="cv-doc">
          <header className="cv-head cv-rise" style={riseStyle(1)}>
            <h1>{cv.name}</h1>
            <p className="cv-head__headline">{cv.headline}</p>
            <p className="cv-head__location">
              {cv.location} · <a href={`mailto:${cv.email}`}>{cv.email}</a>
            </p>
            <ul className="cv-head__contacts">
              {cv.contacts.map((contact) => (
                <li key={contact.href}>
                  <a href={contact.href}>{contact.label}</a>
                </li>
              ))}
            </ul>
          </header>
          {cv.sections.map((section, index) => (
            <section
              key={section}
              className={`cv-section cv-section--${section} cv-rise`}
              style={riseStyle(index + 2)}
              aria-labelledby={sectionId(section)}
            >
              <h2 id={sectionId(section)}>{cv.sectionTitles[section]}</h2>
              <SectionBody cv={cv} section={section} />
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
