import * as F from "./facts";
import { CvSection, CvVariant, type CvDefinition, type ExperienceEntry, type SkillRow } from "./types";

/*
 * Each variant is a re-ordering and re-emphasis of the facts in ./facts.ts,
 * in the one-page layout Francisco approved on 2026-11-04: profile,
 * experience, projects & awards, education & certifications, tech stack.
 * No variant adds a role, date, metric or skill that is not in his approved
 * CV. Shortened text only trims words, never changes a fact.
 *
 * One page per variant (A4, checked by `pnpm cv:pdf`).
 */

const repuestoShop: ExperienceEntry = {
  role: F.ROLE_AI,
  org: F.REPUESTOSHOP.org,
  place: F.REPUESTOSHOP.place,
  period: F.REPUESTOSHOP.period,
  bullets: [F.B_REPUESTO_SYSTEM, F.B_REPUESTO_AGENT, F.B_REPUESTO_TOOLS, F.B_REPUESTO_BENCH],
};

const studio: ExperienceEntry = {
  role: F.ROLE_PRODUCT,
  org: F.ROLLINGCODE_STUDIO.org,
  period: F.ROLLINGCODE_STUDIO.period,
  bullets: [F.B_STUDIO_FEATURES, F.B_STUDIO_AUTOMATION],
};

const judiciary: ExperienceEntry = {
  role: F.ROLE_INSTRUCTOR,
  org: F.JUDICIARY.org,
  period: F.JUDICIARY.period,
  bullets: [F.B_JUDICIARY],
};

const fla: ExperienceEntry = { role: F.ROLE_FLA, org: F.FLA.org, period: F.FLA.period, bullets: [F.B_FLA] };

const school: ExperienceEntry = { role: F.ROLE_ASSISTANT, org: F.SCHOOL.org, period: F.SCHOOL.period, bullets: [] };

/** Approved experience, in the approved order, shared by every variant. */
const experience = [repuestoShop, studio, judiciary, fla, school];

const sections = [
  CvSection.Summary,
  CvSection.Experience,
  CvSection.Projects,
  CvSection.Education,
  CvSection.Skills,
];

/** Web variants lead the stack with the web groups, AI after them. */
const webSkills: SkillRow[] = [
  F.SKILL_LANGUAGES,
  F.SKILL_FRONTEND,
  F.SKILL_BACKEND,
  F.SKILL_DATA_CLOUD,
  F.SKILL_AI,
  F.SKILL_AUTOMATION,
  F.SKILL_PRACTICES,
];

const aiSkills: SkillRow[] = [
  F.SKILL_AI,
  F.SKILL_LANGUAGES,
  F.SKILL_FRONTEND,
  F.SKILL_BACKEND,
  F.SKILL_DATA_CLOUD,
  F.SKILL_AUTOMATION,
  F.SKILL_PRACTICES,
];

const projectsAiFirst = [F.PROJECT_NASA, F.PROJECT_PROOFY, F.PROJECT_PRESU, F.PROJECT_REELSMITH, F.PROJECT_VORTEX];

const fullstack: CvDefinition = {
  variant: CvVariant.Fullstack,
  label: { en: "Full-Stack", es: "Full-Stack" },
  headline: {
    en: "Full-Stack Developer | React, Next.js, Node.js, TypeScript | AI integrations",
    es: "Desarrollador Full-Stack | React, Next.js, Node.js, TypeScript | Integraciones de IA",
  },
  summary: {
    en: "Full-stack software engineer with almost four years of experience building and shipping web products end to end with React, Next.js, Node.js and PostgreSQL, plus applied AI integrations: LangGraph agents, RAG and n8n automation. Information Systems Engineering student (UTN-FRT, expected graduation Dec 2027). NASA Space Apps 2024 national winner.",
    es: "Ingeniero de software full-stack con casi cuatro años de experiencia construyendo y entregando productos web de punta a punta con React, Next.js, Node.js y PostgreSQL, más integraciones de IA aplicada: agentes con LangGraph, RAG y automatización con n8n. Estudiante de Ingeniería en Sistemas de Información (UTN-FRT, egreso estimado dic 2027). Ganador nacional de NASA Space Apps 2024.",
  },
  sections,
  skills: webSkills,
  experience,
  projects: [F.PROJECT_PRESU, F.PROJECT_NASA, F.PROJECT_PROOFY, F.PROJECT_REELSMITH, F.PROJECT_VORTEX],
  certifications: F.CERT_GROUPS,
};

const backend: CvDefinition = {
  variant: CvVariant.Backend,
  label: { en: "Backend", es: "Backend" },
  headline: {
    en: "Backend / Full-Stack Developer | Node.js, TypeScript, PostgreSQL",
    es: "Desarrollador Backend / Full-Stack | Node.js, TypeScript, PostgreSQL",
  },
  summary: {
    en: "Backend and full-stack developer with almost four years of experience building APIs and web products end to end with Node.js, TypeScript and PostgreSQL, plus applied AI integrations (LangGraph agents, RAG, n8n). Information Systems Engineering student (UTN-FRT, expected graduation Dec 2027). NASA Space Apps 2024 national winner.",
    es: "Desarrollador backend y full-stack con casi cuatro años de experiencia construyendo APIs y productos web de punta a punta con Node.js, TypeScript y PostgreSQL, más integraciones de IA aplicada (agentes con LangGraph, RAG, n8n). Estudiante de Ingeniería en Sistemas de Información (UTN-FRT, egreso estimado dic 2027). Ganador nacional de NASA Space Apps 2024.",
  },
  sections,
  skills: webSkills,
  experience,
  projects: [F.PROJECT_PRESU, F.PROJECT_PROOFY, F.PROJECT_NASA, F.PROJECT_REELSMITH, F.PROJECT_VORTEX],
  certifications: F.CERT_GROUPS,
};

const frontend: CvDefinition = {
  variant: CvVariant.Frontend,
  label: { en: "Frontend", es: "Frontend" },
  headline: {
    en: "Frontend Developer | React, Next.js, TypeScript, Tailwind",
    es: "Desarrollador Frontend | React, Next.js, TypeScript, Tailwind",
  },
  summary: {
    en: "Frontend-focused software developer with almost four years of experience building production web applications: user interfaces in React and Next.js with TypeScript, HTML/CSS and Tailwind, shipped on Vercel and Netlify. I also work across the stack (Node.js APIs, PostgreSQL, Supabase) when the product needs it, and add AI and automation where they solve a real problem (LLM agents, RAG, n8n). Information Systems Engineering student (UTN-FRT, expected graduation Dec 2027). NASA Space Apps 2024 national winner.",
    es: "Desarrollador de software orientado a frontend con casi cuatro años de experiencia construyendo aplicaciones web en producción: interfaces en React y Next.js con TypeScript, HTML/CSS y Tailwind, desplegadas en Vercel y Netlify. También trabajo en todo el stack (APIs en Node.js, PostgreSQL, Supabase) cuando el producto lo necesita, y sumo IA y automatización donde resuelven un problema real (agentes con LLMs, RAG, n8n). Estudiante de Ingeniería en Sistemas de Información (UTN-FRT, egreso estimado dic 2027). Ganador nacional de NASA Space Apps 2024.",
  },
  sections,
  skills: webSkills,
  experience,
  projects: projectsAiFirst,
  certifications: F.CERT_GROUPS,
};

const appliedAi: CvDefinition = {
  variant: CvVariant.AppliedAi,
  label: { en: "Applied AI", es: "IA aplicada" },
  headline: {
    en: "Applied AI Engineer | Multi-agent systems, RAG, workflow automation",
    es: "Applied AI Engineer | Sistemas multiagente, RAG, automatización de flujos",
  },
  summary: {
    en: "Software engineer with almost four years of experience building and shipping web products end to end, now focused on applied AI: multi-agent systems, RAG pipelines, tool calling and workflow automation. Information Systems Engineering student (UTN-FRT, expected graduation Dec 2027). NASA Space Apps 2024 national winner.",
    es: "Ingeniero de software con casi cuatro años de experiencia construyendo y entregando productos web de punta a punta, hoy enfocado en IA aplicada: sistemas multiagente, pipelines RAG, tool calling y automatización de flujos. Estudiante de Ingeniería en Sistemas de Información (UTN-FRT, egreso estimado dic 2027). Ganador nacional de NASA Space Apps 2024.",
  },
  sections,
  skills: aiSkills,
  experience,
  projects: projectsAiFirst,
  certifications: F.CERT_GROUPS,
};

const fde: CvDefinition = {
  variant: CvVariant.Fde,
  label: { en: "Forward Deployed", es: "Forward Deployed" },
  headline: {
    en: "Forward Deployed Software Engineer | Client delivery, integrations, AI agents | Full-stack",
    es: "Forward Deployed Software Engineer | Entrega a clientes, integraciones, agentes de IA | Full-stack",
  },
  summary: {
    en: "Software engineer who ships end to end, working directly with clients and non-technical users: from gathering requirements to production, handover and training. Almost four years building web applications (React, Next.js, Node.js, Python), integrating third-party systems (Google Workspace, Meta APIs, webhooks) and adding AI agents and automation where they solve a real problem (LangGraph, RAG, n8n). Information Systems Engineering student (UTN-FRT, expected graduation Dec 2027). NASA Space Apps 2024 national winner.",
    es: "Ingeniero de software que entrega de punta a punta, trabajando directo con clientes y usuarios no técnicos: desde el relevamiento hasta producción, la entrega y la capacitación. Casi cuatro años construyendo aplicaciones web (React, Next.js, Node.js, Python), integrando sistemas de terceros (Google Workspace, APIs de Meta, webhooks) y sumando agentes de IA y automatización donde resuelven un problema real (LangGraph, RAG, n8n). Estudiante de Ingeniería en Sistemas de Información (UTN-FRT, egreso estimado dic 2027). Ganador nacional de NASA Space Apps 2024.",
  },
  sections,
  skills: [F.SKILL_DELIVERY, ...aiSkills],
  experience,
  projects: projectsAiFirst,
  certifications: F.CERT_GROUPS,
};

/** Variants in the order the index and the switcher list them. */
export const CV_DEFINITIONS: Record<CvVariant, CvDefinition> = {
  [CvVariant.Fde]: fde,
  [CvVariant.Fullstack]: fullstack,
  [CvVariant.Frontend]: frontend,
  [CvVariant.Backend]: backend,
  [CvVariant.AppliedAi]: appliedAi,
};
