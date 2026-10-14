import { CvSection, type ResolvedCv } from "@/content/cv";
import { CvBar } from "./CvBar";
import { cvFontClassName } from "./fonts";
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
        <dl className="cv-skills">
          {cv.skills.map((row) => (
            <div key={row.label} className="cv-skills__row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      );
    case CvSection.Experience:
      return (
        <ol className="cv-list">
          {cv.experience.map((entry) => (
            <li key={`${entry.org}-${entry.role}`} className="cv-entry">
              <div className="cv-entry__head">
                <h3>
                  {entry.role} <span className="cv-entry__org">— {entry.org}</span>
                </h3>
                <p className="cv-entry__meta">{entry.meta}</p>
              </div>
              <ul className="cv-bullets">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      );
    case CvSection.Projects:
      return (
        <ul className="cv-list">
          {cv.projects.map((project) => (
            <li key={project.name} className="cv-entry cv-entry--compact">
              <h3>{project.name}</h3>
              <p>
                {project.detail}
                {project.href ? (
                  <>
                    {" "}
                    <a href={project.href}>{project.href.replace(/^https:\/\//, "")}</a>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      );
    case CvSection.Education:
      return (
        <ul className="cv-list">
          {cv.education.map((entry) => (
            <li key={entry.institution} className="cv-entry cv-entry--compact">
              <div className="cv-entry__head">
                <h3>
                  {entry.degree} <span className="cv-entry__org">— {entry.institution}</span>
                </h3>
                <p className="cv-entry__meta">{entry.period}</p>
              </div>
            </li>
          ))}
        </ul>
      );
    case CvSection.Certifications:
      return (
        <ul className="cv-certs">
          {cv.certifications.map((cert) => (
            <li key={cert.name}>
              <span className="cv-certs__name">{cert.name}</span> · {cert.school} · <span className="cv-certs__period">{cert.period}</span>
            </li>
          ))}
        </ul>
      );
    case CvSection.Languages:
      return <p>{cv.languages}</p>;
  }
}

/** The résumé itself: real text, semantic headings, one A4 sheet on screen and on paper. */
export function CvDocument({ cv }: { cv: ResolvedCv }) {
  return (
    <div className={`cv-root ${cvFontClassName}`} lang={cv.locale} data-cv-variant={cv.variant}>
      <CvBar locale={cv.locale} variant={cv.variant} />
      <main id="main-content" className="cv-sheet" tabIndex={-1}>
        <article className="cv-doc">
          <header className="cv-head">
            <h1>{cv.name}</h1>
            <p className="cv-head__headline">{cv.headline}</p>
            <p className="cv-head__location">{cv.location}</p>
            <ul className="cv-head__contacts">
              {cv.contacts.map((contact) => (
                <li key={contact.href}>
                  <a href={contact.href}>{contact.label}</a>
                </li>
              ))}
            </ul>
          </header>
          {cv.sections.map((section) => (
            <section key={section} className={`cv-section cv-section--${section}`} aria-labelledby={sectionId(section)}>
              <h2 id={sectionId(section)}>{cv.sectionTitles[section]}</h2>
              <SectionBody cv={cv} section={section} />
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
