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

/** Résumé sections; each variant picks its own order. */
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
  /** City or work mode shown after the period, when the source CV gives one. */
  place?: Localized;
  period: Localized;
  bullets: Localized[];
};

export type ProjectEntry = {
  name: Localized;
  detail: Localized;
  href?: string;
};

export type EducationEntry = {
  institution: string;
  degree: Localized;
  period: Localized;
};

export type CertificationEntry = {
  school: string;
  name: Localized;
  period: Localized;
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
  certifications: CertificationEntry[];
};

/** A variant resolved to plain strings for one locale. */
export type ResolvedCv = {
  variant: CvVariant;
  locale: CvLocale;
  name: string;
  label: string;
  headline: string;
  location: string;
  contacts: ContactLink[];
  summary: string;
  sections: CvSection[];
  sectionTitles: Record<CvSection, string>;
  skills: { label: string; value: string }[];
  experience: { role: string; org: string; meta: string; bullets: string[] }[];
  projects: { name: string; detail: string; href?: string }[];
  education: { institution: string; degree: string; period: string }[];
  certifications: { school: string; name: string; period: string }[];
  languages: string;
};
