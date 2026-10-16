import {
  CV_VARIANTS,
  CvLocale,
  CvSection,
  CvVariant,
  cvHeadline,
  cvPath,
  cvPdfPath,
  getCv,
  type ResolvedCv,
} from "@/content/cv";
import { EDUCATION } from "@/content/cv/facts";
import { CV_UI } from "@/content/cv/ui";
import { PRIMARY_CV_VARIANT, primaryCvPdfPath } from "@/lib/primaryCv";
import { CV, type Lang } from "@/data/cv";
import { PROJECTS, type Project } from "@/data/projects";

/**
 * Read-only views of the portfolio data for the MCP server. Everything comes
 * from src/data (the same source the site renders) and src/content/cv (the
 * CV pages and PDFs: versions, title, education); nothing is generated.
 */

export enum Language {
  Es = "es",
  En = "en",
}

const lang = (language: Language): Lang => language;

/** CV pages are published in the same two languages the MCP answers in. */
function cvLocale(language: Language): CvLocale {
  switch (language) {
    case Language.En:
      return CvLocale.En;
    case Language.Es:
      return CvLocale.Es;
  }
}

/** Absolute URL of a site path, using the request's own origin. */
function absolute(origin: string, path: string) {
  return new URL(path, origin).toString();
}

/** Separator between the role and the focus areas in a CV headline. */
const HEADLINE_SEPARATOR = " | ";

/**
 * Professional title: the role part of the primary CV's headline in
 * src/content/cv, so the MCP never claims a title the published CV does not.
 */
export function primaryTitle(language: Language): string {
  return cvHeadline(PRIMARY_CV_VARIANT, cvLocale(language)).split(HEADLINE_SEPARATOR)[0];
}

export function profile(language: Language, origin: string) {
  const l = lang(language);
  return {
    name: CV.name,
    title: primaryTitle(language),
    location: CV.location[l],
    timezone: CV.timezone,
    summary: CV.summary[l],
    highlights: CV.highlights.map((item) => ({ title: item.title, year: item.year, detail: item.detail[l] })),
    links: {
      site: absolute(origin, "/"),
      cv_pdf: absolute(origin, primaryCvPdfPath(cvLocale(language))),
      github: CV.github,
      linkedin: CV.linkedin,
    },
  };
}

export function contact() {
  return {
    email: CV.email,
    linkedin: CV.linkedin,
    github: CV.github,
    whatsapp: `https://wa.me/${CV.whatsapp}`,
    timezone: CV.timezone,
  };
}

export function experience(language: Language) {
  const l = lang(language);
  return CV.experience.map((item) => ({
    role: item.role[l],
    organization: item.org[l],
    period: item.period[l],
    start: item.start,
    current: item.current,
    description: item.description[l],
    stack: item.stack ?? [],
  }));
}

export function cv(language: Language, origin: string) {
  const l = lang(language);
  return {
    ...profile(language, origin),
    versions: listCvVersions(language, origin).versions,
    experience: experience(language),
    // Education comes from the CV source, which carries the expected graduation date.
    education: EDUCATION.map((item) => ({
      institution: item.institution,
      degree: item.degree[cvLocale(language)],
      period: item.period[cvLocale(language)],
    })),
    certifications: CV.certifications.map((item) => ({
      name: item.name[l],
      school: item.school,
      period: item.period[l],
      highlight: item.highlight?.[l] ?? null,
    })),
  };
}

function summarizeProject(project: Project, language: Language, origin: string) {
  const l = lang(language);
  return {
    slug: project.slug,
    title: project.title?.[l] ?? project.name,
    years: project.year,
    url: absolute(origin, `/${project.slug}`),
  };
}

export function listProjects(language: Language, origin: string) {
  return PROJECTS.map((project) => summarizeProject(project, language, origin));
}

export const PROJECT_SLUGS = PROJECTS.map((project) => project.slug);

export function projectBySlug(slug: string, language: Language, origin: string) {
  const project = PROJECTS.find((item) => item.slug === slug);
  if (!project) return null;
  const l = lang(language);
  return {
    ...summarizeProject(project, language, origin),
    description: project.description[l],
    stack: project.stack,
    link: project.link ?? null,
    entries: (project.items ?? []).map((item) => ({
      name: item.name,
      year: item.year,
      description: item.description[l],
      category: item.category?.[l] ?? null,
      highlight: item.highlight?.[l] ?? null,
      stack: item.stack ?? [],
      links: [item.link, ...(item.extraLinks ?? [])].filter((href): href is string => Boolean(href)),
    })),
  };
}

/*
 * CV versions. Everything below is read from src/content/cv, the typed source
 * the /cv pages and their committed PDFs are rendered from, so a variant added
 * to or removed from CvVariant shows up here without touching the MCP.
 */

export type CvVersionSummary = {
  id: CvVariant;
  /** Short name of the version, which is the kind of role it is ordered for. */
  name: string;
  headline: string;
  page_url: string;
  pdf_url: string;
};

export type CvVersionList = {
  language: Language;
  about: string;
  versions: CvVersionSummary[];
};

function summarizeCvVersion(resolved: ResolvedCv, origin: string): CvVersionSummary {
  return {
    id: resolved.variant,
    name: resolved.label,
    headline: resolved.headline,
    page_url: absolute(origin, cvPath(resolved.variant, resolved.locale)),
    pdf_url: absolute(origin, cvPdfPath(resolved.variant, resolved.locale)),
  };
}

export function listCvVersions(language: Language, origin: string): CvVersionList {
  const locale = cvLocale(language);
  const versions = CV_VARIANTS.map((variant) => summarizeCvVersion(getCv(variant, locale), origin));
  return { language, about: CV_UI.indexIntro[locale], versions };
}

type CvSectionBase<S extends CvSection> = { id: S; title: string };

/** One CV section as the CV page renders it, in that version's order. */
export type CvSectionView =
  | (CvSectionBase<CvSection.Summary> & { text: string })
  | (CvSectionBase<CvSection.Skills> & { rows: ResolvedCv["skills"] })
  | (CvSectionBase<CvSection.Experience> & { entries: ResolvedCv["experience"] })
  | (CvSectionBase<CvSection.Projects> & { entries: ResolvedCv["projects"] })
  | (CvSectionBase<CvSection.Education> & { entries: ResolvedCv["education"] })
  | (CvSectionBase<CvSection.Certifications> & { entries: ResolvedCv["certifications"] })
  | (CvSectionBase<CvSection.Languages> & { text: string });

function sectionView(resolved: ResolvedCv, section: CvSection): CvSectionView {
  const title = resolved.sectionTitles[section];
  switch (section) {
    case CvSection.Summary:
      return { id: section, title, text: resolved.summary };
    case CvSection.Skills:
      return { id: section, title, rows: resolved.skills };
    case CvSection.Experience:
      return { id: section, title, entries: resolved.experience };
    case CvSection.Projects:
      return { id: section, title, entries: resolved.projects };
    case CvSection.Education:
      return { id: section, title, entries: resolved.education };
    case CvSection.Certifications:
      return { id: section, title, entries: resolved.certifications };
    case CvSection.Languages:
      return { id: section, title, text: resolved.languages };
  }
}

export type CvVersionDocument = {
  language: Language;
  version: CvVersionSummary;
  name: string;
  headline: string;
  location: string;
  contacts: ResolvedCv["contacts"];
  sections: CvSectionView[];
};

/** One CV version with the same content, order and links as its page and PDF. */
export function cvVersion(variant: CvVariant, language: Language, origin: string): CvVersionDocument {
  const resolved = getCv(variant, cvLocale(language));
  return {
    language,
    version: summarizeCvVersion(resolved, origin),
    name: resolved.name,
    headline: resolved.headline,
    location: resolved.location,
    contacts: resolved.contacts,
    sections: resolved.sections.map((section) => sectionView(resolved, section)),
  };
}
