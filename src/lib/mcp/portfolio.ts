import { CV, type Lang } from "@/data/cv";
import { PROJECTS, type Project } from "@/data/projects";

/**
 * Read-only views of the portfolio data for the MCP server. Everything comes
 * from src/data (the same source the site renders); nothing is generated.
 */

export enum Language {
  Es = "es",
  En = "en",
}

const lang = (language: Language): Lang => language;

/** Absolute URL of a site path, using the request's own origin. */
function absolute(origin: string, path: string) {
  return new URL(path, origin).toString();
}

export function profile(language: Language, origin: string) {
  const l = lang(language);
  return {
    name: CV.name,
    title: CV.title[l],
    location: CV.location[l],
    timezone: CV.timezone,
    summary: CV.summary[l],
    highlights: CV.highlights.map((item) => ({ title: item.title, year: item.year, detail: item.detail[l] })),
    links: {
      site: absolute(origin, "/"),
      cv_pdf: absolute(origin, CV.cvPdf),
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
    organization: item.org,
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
    experience: experience(language),
    education: CV.education.map((item) => ({ institution: item.institution, degree: item.degree[l], period: item.period[l] })),
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
    tagline: project.tagline?.[l] ?? null,
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
