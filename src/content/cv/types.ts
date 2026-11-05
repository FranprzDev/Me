/** Résumé variants hosted under /cv/<variant> and /es/cv/<variant>. */
export enum CvVariant {
  Fde = "fde",
  Fullstack = "fullstack",
  Frontend = "frontend",
  Backend = "backend",
  AppliedAi = "applied-ai",
}

/** Languages each résumé is published in. */
export enum CvLocale {
  En = "en",
  Es = "es",
}

/**
 * Résumé sections, in the approved one-page layout: profile, experience,
 * projects & awards, education & certifications, tech stack. Certifications
 * and languages render inside the education section.
 */
export enum CvSection {
  Summary = "summary",
  Skills = "skills",
  Experience = "experience",
  Projects = "projects",
  Education = "education",
  Certifications = "certifications",
  Languages = "languages",
}

/** A string written once per locale. */
export type Localized = Record<CvLocale, string>;

export type ContactLink = {
  label: string;
  href: string;
};

export type SkillRow = {
  label: Localized;
  value: Localized;
};

export type ExperienceEntry = {
  role: Localized;
  /** Localized so a client described generically (never named) reads naturally in each language. */
  org: Localized;
  /** City or work mode shown before the period, when the source CV gives one. */
  place?: Localized;
  period: Localized;
  bullets: Localized[];
};

export type ProjectEntry = {
  name: Localized;
  /** Parenthetical after the name, e.g. "hackathon Solana 2026, prototipo". */
  qualifier?: Localized;
  detail: Localized;
};

export type EducationEntry = {
  institution: string;
  degree: Localized;
  period: Localized;
};

/** Certifications grouped by school, rendered as one flowing line per school. */
export type CertificationGroup = {
  school: string;
  items: Localized;
};

/** One variant's composition of the shared facts. */
export type CvDefinition = {
  variant: CvVariant;
  /** Short name used in the index, the switcher and file names. */
  label: Localized;
  headline: Localized;
  summary: Localized;
  sections: CvSection[];
  skills: SkillRow[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationGroup[];
};

/** A variant resolved to plain strings for one locale. */
export type ResolvedCv = {
  variant: CvVariant;
  locale: CvLocale;
  name: string;
  label: string;
  headline: string;
  location: string;
  email: string;
  contacts: ContactLink[];
  summary: string;
  sections: CvSection[];
  sectionTitles: Record<CvSection, string>;
  skills: { label: string; value: string }[];
  skillsExtra: { label: string; value: string };
  experience: { role: string; org: string; meta: string; bullets: string[] }[];
  projects: { name: string; qualifier?: string; detail: string }[];
  education: { institution: string; degree: string; period: string }[];
  certifications: { school: string; items: string }[];
  languages: string;
};
