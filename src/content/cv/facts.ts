import {
  CvSection,
  type CertificationGroup,
  type ContactLink,
  type EducationEntry,
  type Localized,
  type ProjectEntry,
  type SkillRow,
} from "./types";
import { CANONICAL_SITE_HOST, CANONICAL_SITE_URL } from "@/lib/site";

/**
 * Facts shared by every résumé variant. They follow the CV Francisco
 * approved on 2026-11-04 (the one-page Applied AI CV): variants only reorder
 * and re-emphasise them for their role type. Never invent roles, dates,
 * metrics or skills.
 *
 * Privacy: the web pages and PDFs publish email, GitHub, LinkedIn and the
 * portfolio URL only. Never add a phone number or a home address here.
 */

export const CV_NAME = "Francisco Miguel Perez";

/** Printed on every CV page and PDF; the domain itself lives in src/lib/site.ts. */
export const PORTFOLIO_URL = CANONICAL_SITE_URL;

export const CV_EMAIL = "franciscoperezdeveloper@gmail.com";

export const CV_CONTACTS: ContactLink[] = [
  { label: "linkedin.com/in/franprzdev", href: "https://linkedin.com/in/franprzdev" },
  { label: "github.com/franprzdev", href: "https://github.com/FranprzDev" },
  { label: CANONICAL_SITE_HOST, href: PORTFOLIO_URL },
];

export const CV_LOCATION: Localized = {
  en: "Tucumán, Argentina (GMT-3)",
  es: "Tucumán, Argentina (GMT-3)",
};

export const SECTION_TITLES: Record<CvSection, Localized> = {
  [CvSection.Summary]: { en: "Summary", es: "Perfil" },
  [CvSection.Skills]: { en: "Tech stack", es: "Tecnologías" },
  [CvSection.Experience]: { en: "Experience", es: "Experiencia" },
  [CvSection.Projects]: { en: "Projects & awards", es: "Proyectos y premios" },
  [CvSection.Education]: { en: "Education & certifications", es: "Educación y certificaciones" },
  [CvSection.Certifications]: { en: "Certifications", es: "Certificaciones" },
  [CvSection.Languages]: { en: "Languages", es: "Idiomas" },
};

/** Shown inside the education section, under the "Languages"/"Idiomas" label. */
export const LANGUAGES: Localized = {
  en: "Spanish (native) · English (B1) · Russian (A1)",
  es: "español (nativo) · inglés (B1) · ruso (A1)",
};

export const EDUCATION: EducationEntry[] = [
  {
    institution: "UTN-FRT",
    degree: { en: "B.S. Information Systems Engineering", es: "Ingeniería en Sistemas de Información" },
    period: { en: "2022 - Dec 2027, expected", es: "2022 - dic 2027, estimado" },
  },
];

export const CERTS_ROLLINGCODE: CertificationGroup = {
  school: "RollingCode School",
  items: {
    en: "Full-Stack MERN (Outstanding Student, 2022-2023) · Advanced React (2024) · Advanced Next.js (2025) · Data Engineer (2025)",
    es: "Full-Stack MERN (alumno destacado, 2022-2023) · React avanzado (2024) · Next.js avanzado (2025) · Data Engineer (2025)",
  },
};
export const CERTS_OPENAI: CertificationGroup = {
  school: "OpenAI Academy",
  items: {
    en: "Agents and Workflows (Sep 2026) · Applied AI Foundations (Aug 2026) · AI Foundations (Aug 2026)",
    es: "Agents and Workflows (sep 2026) · Applied AI Foundations (ago 2026) · AI Foundations (ago 2026)",
  },
};
export const CERTS_GOOGLE: CertificationGroup = {
  school: "Google",
  items: {
    en: "AI Essentials (Oct 2025) · Prompting Essentials (Oct 2025)",
    es: "AI Essentials (oct 2025) · Prompting Essentials (oct 2025)",
  },
};
/** Approved order: school first, then the AI academies. */
export const CERT_GROUPS: CertificationGroup[] = [CERTS_ROLLINGCODE, CERTS_OPENAI, CERTS_GOOGLE];

/* Projects & awards, shared by every variant. */

export const PROJECT_NASA: ProjectEntry = {
  name: { en: "NASA Space Apps 2024", es: "NASA Space Apps 2024" },
  detail: {
    en: "National winner (ExoGames); national competitor again in 2025.",
    es: "Ganador nacional (ExoGames); competidor nacional nuevamente en 2025.",
  },
};
export const PROJECT_PROOFY: ProjectEntry = {
  name: { en: "Proofy", es: "Proofy" },
  qualifier: { en: "Solana hackathon 2026, prototype", es: "hackathon Solana 2026, prototipo" },
  detail: {
    en: "AI agent that turns a contract scope into verifiable milestones and releases escrow payments based on CI/CD evidence.",
    es: "agente de IA que convierte el alcance de un contrato en hitos verificables y libera pagos en escrow según evidencia de CI/CD.",
  },
};
export const PROJECT_PRESU: ProjectEntry = {
  name: { en: "Presu", es: "Presu" },
  qualifier: { en: "2026, prototype", es: "2026, prototipo" },
  detail: {
    en: "ChatGPT app (MCP server) that turns a product idea into a clear scope and a PDF quote through guided Q&A; credits and BNB testnet payments. Presented at the BNB Builder Session Tucumán (Oct 2026, participant).",
    es: "app de ChatGPT (servidor MCP) que convierte una idea de producto en un alcance claro y una cotización en PDF mediante preguntas guiadas; créditos y pagos BNB en testnet. Presentado en el BNB Builder Session Tucumán (oct 2026, participante).",
  },
};
export const PROJECT_REELSMITH: ProjectEntry = {
  name: { en: "Reelsmith", es: "Reelsmith" },
  qualifier: { en: "2026", es: "2026" },
  detail: {
    en: "MCP server in Rust that lets an AI assistant render short promo videos from gameplay clips, with automatic QA (loudness, black frames).",
    es: "servidor MCP en Rust que permite a un asistente de IA renderizar videos promocionales cortos a partir de clips de juego, con QA automático (loudness, frames negros).",
  },
};
export const PROJECT_VORTEX: ProjectEntry = {
  name: { en: "Vortex Software n8n Hackathon 2025", es: "Hackathon de n8n de Vortex Software 2025" },
  detail: { en: "competitor (Tucumán).", es: "competidor (Tucumán)." },
};

/* Experience periods and organisations, shared by every variant. */

export const REPUESTOSHOP = {
  org: { en: "RepuestoShop", es: "RepuestoShop" },
  period: { en: "Dec 2025 - Oct 2026", es: "dic 2025 - oct 2026" },
  place: { en: "Remote", es: "Remoto" },
} as const;

export const ROLLINGCODE_STUDIO = {
  org: { en: "RollingCode Studio", es: "RollingCode Studio" },
  period: { en: "Oct 2024 - Dec 2025", es: "oct 2024 - dic 2025" },
} as const;

export const JUDICIARY = {
  org: { en: "Poder Judicial de Tucumán", es: "Poder Judicial de Tucumán" },
  period: { en: "Sep - Oct 2025", es: "sep - oct 2025" },
} as const;

export const FLA = {
  org: { en: "Fundación Líderes de Ansenuza", es: "Fundación Líderes de Ansenuza" },
  period: { en: "Apr 2025 - Present", es: "abr 2025 - Actualidad" },
} as const;

export const SCHOOL = {
  org: { en: "RollingCode School", es: "RollingCode School" },
  period: { en: "Nov 2023 - Aug 2024", es: "nov 2023 - ago 2024" },
} as const;

/* Roles and bullets reused verbatim across variants. */

export const ROLE_AI: Localized = { en: "AI Engineer", es: "AI Engineer" };
export const ROLE_PRODUCT: Localized = { en: "Product Engineer", es: "Product Engineer" };
export const ROLE_INSTRUCTOR: Localized = {
  en: "Instructor, Process Automation with n8n",
  es: "Docente de Automatización con n8n",
};
export const ROLE_FLA: Localized = { en: "Full-Stack Developer (Volunteer)", es: "Desarrollador Full-Stack (voluntario)" };
export const ROLE_ASSISTANT: Localized = { en: "Teaching Assistant, Web & Backend", es: "Ayudante docente Web y Backend" };

export const B_REPUESTO_SYSTEM: Localized = {
  en: "Built the whole system end to end: an AI that processed over 50 leads a day with their likely purchase case, and a CRM built from scratch that displayed that information.",
  es: "Construí todo el sistema de punta a punta: una IA que procesaba más de 50 leads por día con su posible caso de compra y un CRM desde cero que mostraba esa información.",
};
export const B_REPUESTO_AGENT: Localized = {
  en: "Designed and deployed a multi-agent assistant (LangGraph) with tool calling and retrieval over scraped catalog data via SQL full-text search to answer customer questions.",
  es: "Diseñé y desplegué un asistente multiagente (LangGraph) con tool calling y retrieval sobre catálogo scrapeado mediante búsqueda full-text en SQL para responder consultas de clientes.",
};
export const B_REPUESTO_TOOLS: Localized = {
  en: "Built internal tools and automations for other parts of the business, integrating Meta APIs and scraping pipelines that feed the agents with data.",
  es: "Construí herramientas internas y automatizaciones para otras áreas del negocio, integrando APIs de Meta y pipelines de scraping que alimentan a los agentes con datos.",
};
export const B_REPUESTO_BENCH: Localized = {
  en: "Benchmarked LLM providers for the best cost/quality trade-off in production; used Codex and Claude Code to ship POCs fast.",
  es: "Comparé proveedores de LLM para elegir la mejor relación costo/calidad en producción; usé Codex y Claude Code para entregar POCs rápido.",
};

export const B_STUDIO_FEATURES: Localized = {
  en: "Built frontend and backend features for client web products (React, Next.js, Node.js); automated internal tasks with n8n; Scrum, Git Flow and code review.",
  es: "Desarrollé funcionalidades frontend y backend para productos web de clientes (React, Next.js, Node.js); automaticé tareas internas con n8n; Scrum, Git Flow y code review.",
};
export const B_STUDIO_AUTOMATION: Localized = {
  en: "Reduced, together with the team, the time of a bureaucratic procedure by 90%: from over 12 months to under a month. Another certificate process went from one month to one week.",
  es: "Reduje, junto al equipo, un 90% el tiempo de un trámite burocrático: de más de 12 meses a menos de un mes. Otro trámite de certificado pasó de un mes a una semana.",
};

export const B_JUDICIARY: Localized = {
  en: "Designed and taught a 20-hour course on n8n, APIs/webhooks and RAG workflows; presented the automation strategy to the Judiciary leadership.",
  es: "Diseñé y dicté un curso de 20 horas sobre n8n, APIs/webhooks y flujos RAG; presenté la estrategia de automatización a las autoridades.",
};

export const B_FLA: Localized = {
  en: "Rebuilt the foundation's web platform and internal tools (Next.js, Prisma, PostgreSQL).",
  es: "Rehice la plataforma web y las herramientas internas de la fundación (Next.js, Prisma, PostgreSQL).",
};

/* Skill groups reused across variants; each variant picks its own order. */

export const SKILL_AI: SkillRow = {
  label: { en: "AI", es: "IA" },
  value: {
    en: "LangGraph, multi-agent systems, MCP (Model Context Protocol) servers, tool calling / function calling, RAG, LLM APIs (OpenAI, Anthropic, Gemini)",
    es: "LangGraph, sistemas multiagente, servidores MCP (Model Context Protocol), tool calling / function calling, RAG, APIs de LLM (OpenAI, Anthropic, Gemini)",
  },
};
export const SKILL_LANGUAGES: SkillRow = {
  label: { en: "Languages", es: "Lenguajes" },
  value: { en: "TypeScript, JavaScript, Python, SQL", es: "TypeScript, JavaScript, Python, SQL" },
};
export const SKILL_FRONTEND: SkillRow = {
  label: { en: "Frontend", es: "Frontend" },
  value: { en: "React, Next.js, Tailwind", es: "React, Next.js, Tailwind" },
};
export const SKILL_BACKEND: SkillRow = {
  label: { en: "Backend", es: "Backend" },
  value: { en: "Node.js, Express, REST, webhooks", es: "Node.js, Express, REST, webhooks" },
};
export const SKILL_DATA_CLOUD: SkillRow = {
  label: { en: "Data/Cloud", es: "Datos/Cloud" },
  value: { en: "PostgreSQL, MongoDB, Supabase, AWS, Vercel, Netlify", es: "PostgreSQL, MongoDB, Supabase, AWS, Vercel, Netlify" },
};
export const SKILL_AUTOMATION: SkillRow = {
  label: { en: "Automation", es: "Automatización" },
  value: { en: "n8n, Google Workspace APIs, Meta APIs", es: "n8n, APIs de Google Workspace y Meta" },
};
export const SKILL_PRACTICES: SkillRow = {
  label: { en: "Practices", es: "Prácticas" },
  value: { en: "Git, Git Flow, CI/CD, Scrum, code review", es: "Git, Git Flow, CI/CD, Scrum, code review" },
};
/** FDE leads with client-facing delivery. */
export const SKILL_DELIVERY: SkillRow = {
  label: { en: "Client delivery", es: "Entrega a clientes" },
  value: {
    en: "requirements gathering, handover documentation, user training, working with non-technical users",
    es: "relevamiento, documentación de entrega, capacitación y trabajo con usuarios no técnicos",
  },
};

/** Low-prominence closing keywords, same on every variant. */
export const SKILL_EXTRA: SkillRow = {
  label: { en: "Also", es: "Además" },
  value: {
    en: "Vector search / embeddings (working knowledge) · SQL · ISO 9001 and ISO 27001 (university coursework) · Cybersecurity (university coursework) · Data analytics · Logical thinking",
    es: "Búsqueda vectorial / embeddings (conocimiento) · SQL · ISO 9001 e ISO 27001 (formación universitaria) · Ciberseguridad (formación universitaria) · Data analytics · Pensamiento lógico",
  },
};
