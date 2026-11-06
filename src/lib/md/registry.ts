/**
 * Markdown renderer registry: one renderer per public route, all reading the
 * same data modules the HTML pages render from (src/data, src/content/cv via
 * src/lib/mcp/portfolio). Adding a page = adding one entry here; llms-full.txt
 * and the /api/md catalog pick it up automatically.
 *
 * Rules: main content only (no nav/footer/CTAs), absolute links to the HTML
 * URLs, never a fact the HTML does not show.
 */
import { ME } from "@/data/me";
import {
  Language,
  contact,
  cvVersion,
  experience,
  listCvVersions,
  listProjects,
  primaryTitle,
  profile,
  projectBySlug,
  PROJECT_SLUGS,
} from "@/lib/mcp/portfolio";
import { MCP_ENDPOINT_PATH, MCP_TOOLS, MCP_TOOL_SUMMARIES } from "@/lib/mcp/tools";
import { CV_VARIANTS, cvPath } from "@/content/cv/routes";
import { CvLocale, CvSection, CvVariant } from "@/content/cv/types";

export type MarkdownRoute = {
  /** HTML path this markdown mirrors ("/" for home). */
  path: string;
  /** Human label for the catalog. */
  title: string;
  render: (origin: string) => string;
};

function absolute(origin: string, path: string): string {
  return new URL(path, `${origin}/`).toString();
}

function header(title: string, origin: string, path: string): string[] {
  return [`# ${title}`, "", `Canonical: ${absolute(origin, path)}`, ""];
}

function renderHome(origin: string): string {
  const me = profile(Language.En, origin);
  const lines = [
    ...header(me.name, origin, "/"),
    `> ${primaryTitle(Language.En)} in ${me.location}. ${me.summary}`,
    "",
    "## Highlights",
    "",
    ...me.highlights.map((item) => `- **${item.title}** (${item.year}): ${item.detail}`),
    "",
    "## Experience",
    "",
    ...experience(Language.En).map(
      (item) => `- **${item.role}** — ${item.organization}, ${item.period}. ${item.description}`
    ),
    "",
    "## Portfolio worlds",
    "",
    ...listProjects(Language.En, origin).map((project) => `- [${project.title}](${project.url}) (${project.years})`),
    "",
    "## Contact",
    "",
    `- Email: ${contact().email}`,
    `- LinkedIn: ${contact().linkedin}`,
    `- GitHub: ${contact().github}`,
    `- [About and experience](${absolute(origin, "/me")})`,
    "",
  ];
  return lines.join("\n");
}

function renderMe(origin: string): string {
  const lines = [
    ...header("About Francisco Perez", origin, "/me"),
    ME.hero.body.en,
    "",
    `## ${ME.statement.title.en}`,
    "",
    ME.statement.body.en,
    "",
    `## ${ME.layers.title.en}`,
    "",
    ME.layers.body.en,
    "",
    ...ME.layers.items.map((layer) => `### ${layer.title.en}

${layer.body.en}`),
    "",
    `## ${ME.about.title.en}`,
    "",
    ME.about.lead.en,
    "",
    ME.about.body.en,
    "",
    "## Experience",
    "",
    ...ME.about.roles.map(
      (role) => `### ${role.role.en} — ${role.org} (${role.period.en})

${role.body.en}

Stack: ${role.stack.join(", ")}`
    ),
    "",
    `## ${ME.process.title.en}`,
    "",
    ME.process.lead.en,
    "",
    ...ME.process.body.map((paragraph) => paragraph.en),
    "",
    ...ME.process.steps.map((step) => `- **${step.title.en}**: ${step.note.en}`),
    "",
    "## Selected projects",
    "",
    ...ME.projects.map((project) => `- [${project.name}](${project.link.href}) (${project.status.en}): ${project.body.en}`),
    "",
    "## Contact",
    "",
    `- Email: ${ME.email}`,
    `- LinkedIn: ${ME.linkedin}`,
    `- GitHub: ${ME.github}`,
    "",
  ];
  return lines.join("\n");
}

function renderForAgents(origin: string): string {
  const endpoint = absolute(origin, MCP_ENDPOINT_PATH);
  const lines = [
    ...header("For AI agents", origin, "/for-agents"),
    `Public, read-only MCP server (Streamable HTTP, no authentication): ${endpoint}.`,
    "",
    "## Tools",
    "",
    ...MCP_TOOLS.map((tool) => `- ${tool}: ${MCP_TOOL_SUMMARIES[tool]}`),
    "",
    "## Related",
    "",
    `- [llms.txt](${absolute(origin, "/llms.txt")})`,
    `- [llms-full.txt](${absolute(origin, "/llms-full.txt")})`,
    `- [ai.txt](${absolute(origin, "/ai.txt")})`,
    `- [Agent card](${absolute(origin, "/.well-known/agent-card.json")})`,
    "",
  ];
  return lines.join("\n");
}

function renderWorld(slug: string, origin: string): string {
  const project = projectBySlug(slug, Language.En, origin);
  if (!project) throw new Error(`No project data for slug: ${slug}`);
  const lines = [
    ...header(project.title, origin, `/${slug}`),
    project.description,
    "",
    ...(project.stack.length ? [`Stack: ${project.stack.join(", ")}`, ""] : []),
    ...(project.link ? [`Link: ${project.link}`, ""] : []),
    ...(project.entries.length ? ["## Entries", ""] : []),
    ...project.entries.map(
      (entry) =>
        `- **${entry.name}** (${entry.year})${entry.category ? ` — ${entry.category}` : ""}: ${entry.description}` +
        (entry.links.length ? `\n  Links: ${entry.links.join(", ")}` : "")
    ),
    "",
  ];
  return lines.join("\n");
}

function renderCvIndex(origin: string, language: Language, path: string): string {
  const list = listCvVersions(language, origin);
  const lines = [
    ...header("CV — Francisco Perez", origin, path),
    list.about,
    "",
    ...list.versions.map((version) => `- [${version.name} CV](${version.page_url}): ${version.headline}. PDF: ${version.pdf_url}`),
    "",
  ];
  return lines.join("\n");
}

function renderCvVariant(origin: string, variant: CvVariant, language: Language, path: string): string {
  const doc = cvVersion(variant, language, origin);
  const lines = [...header(`${doc.name} — ${doc.headline}`, origin, path), doc.location, ""];
  for (const section of doc.sections) {
    lines.push(`## ${section.title}`, "");
    switch (section.id) {
      case CvSection.Summary:
      case CvSection.Languages:
        lines.push(section.text, "");
        break;
      case CvSection.Skills:
        lines.push(...section.rows.map((row) => `- ${row.label}: ${row.value}`), "");
        break;
      case CvSection.Experience:
        for (const entry of section.entries) {
          lines.push(`### ${entry.role} — ${entry.org}`, "", entry.meta, "", ...entry.bullets.map((bullet) => `- ${bullet}`), "");
        }
        break;
      case CvSection.Projects:
        lines.push(...section.entries.map((entry) => `- **${entry.name}**${entry.qualifier ? ` (${entry.qualifier})` : ""}: ${entry.detail}`), "");
        break;
      case CvSection.Education:
        lines.push(...section.entries.map((entry) => `- **${entry.degree}**, ${entry.institution} (${entry.period})`), "");
        break;
      case CvSection.Certifications:
        lines.push(...section.entries.map((entry) => `- **${entry.school}**: ${entry.items}`), "");
        break;
    }
  }
  lines.push(`PDF: ${doc.version.pdf_url}`, "");
  return lines.join("\n");
}

const cvVariantPaths = CV_VARIANTS.flatMap((variant) => [
  { variant, locale: CvLocale.En, language: Language.En },
  { variant, locale: CvLocale.Es, language: Language.Es },
]);

/** Every public route with a markdown version. */
export const MARKDOWN_ROUTES: MarkdownRoute[] = [
  { path: "/", title: "Home", render: renderHome },
  { path: "/me", title: "About and experience", render: renderMe },
  { path: "/for-agents", title: "For AI agents", render: renderForAgents },
  ...PROJECT_SLUGS.map((slug) => ({
    path: `/${slug}`,
    title: `World: ${slug}`,
    render: (origin: string) => renderWorld(slug, origin),
  })),
  { path: "/cv", title: "CV index (EN)", render: (origin: string) => renderCvIndex(origin, Language.En, "/cv") },
  { path: "/es/cv", title: "CV index (ES)", render: (origin: string) => renderCvIndex(origin, Language.Es, "/es/cv") },
  ...cvVariantPaths.map(({ variant, language }) => ({
    path: cvPath(variant, language === Language.En ? CvLocale.En : CvLocale.Es),
    title: `CV ${variant} (${language})`,
    render: (origin: string) =>
      renderCvVariant(origin, variant, language, cvPath(variant, language === Language.En ? CvLocale.En : CvLocale.Es)),
  })),
];

/** All markdown-addressable HTML paths ("/" is also reachable as /index.md). */
export function listMarkdownRoutes(): string[] {
  return MARKDOWN_ROUTES.map((route) => route.path);
}

/**
 * Resolve a markdown request path (without the .md suffix) to its renderer.
 * "/index" is the homepage alias. Returns null when no renderer exists.
 */
export function resolveMarkdown(path: string): MarkdownRoute | null {
  const normalized = path === "/index" ? "/" : path.replace(/\/$/, "") || "/";
  return MARKDOWN_ROUTES.find((route) => route.path === normalized) ?? null;
}
