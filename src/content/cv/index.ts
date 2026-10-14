import { CV_CONTACTS, CV_LOCATION, CV_NAME, EDUCATION, LANGUAGES, SECTION_TITLES } from "./facts";
import { CvSection, type CvLocale, type CvVariant, type ResolvedCv } from "./types";
import { CV_DEFINITIONS } from "./variants";

export { CvLocale, CvSection, CvVariant } from "./types";
export type { ResolvedCv } from "./types";
export { CV_NAME, PORTFOLIO_URL } from "./facts";
export * from "./routes";

export function cvLabel(variant: CvVariant, locale: CvLocale): string {
  return CV_DEFINITIONS[variant].label[locale];
}

export function cvHeadline(variant: CvVariant, locale: CvLocale): string {
  return CV_DEFINITIONS[variant].headline[locale];
}

/** One variant's résumé with every string resolved for `locale`. */
export function getCv(variant: CvVariant, locale: CvLocale): ResolvedCv {
  const def = CV_DEFINITIONS[variant];
  const sectionTitles = {} as Record<CvSection, string>;
  for (const section of Object.values(CvSection)) sectionTitles[section] = SECTION_TITLES[section][locale];
  return {
    variant,
    locale,
    name: CV_NAME,
    label: def.label[locale],
    headline: def.headline[locale],
    location: CV_LOCATION[locale],
    contacts: CV_CONTACTS,
    summary: def.summary[locale],
    sections: def.sections,
    sectionTitles,
    skills: def.skills.map((row) => ({ label: row.label[locale], value: row.value[locale] })),
    experience: def.experience.map((entry) => ({
      role: entry.role[locale],
      org: entry.org,
      meta: entry.place ? `${entry.period[locale]} · ${entry.place[locale]}` : entry.period[locale],
      bullets: entry.bullets.map((bullet) => bullet[locale]),
    })),
    projects: def.projects.map((project) => ({
      name: project.name[locale],
      detail: project.detail[locale],
      href: project.href,
    })),
    education: EDUCATION.map((entry) => ({
      institution: entry.institution,
      degree: entry.degree[locale],
      period: entry.period[locale],
    })),
    certifications: def.certifications.map((cert) => ({
      school: cert.school,
      name: cert.name[locale],
      period: cert.period[locale],
    })),
    languages: LANGUAGES[locale],
  };
}
