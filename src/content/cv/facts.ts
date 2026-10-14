import {
  CvSection,
  type CertificationEntry,
  type ContactLink,
  type EducationEntry,
  type Localized,
  type ProjectEntry,
} from "./types";

/**
 * Facts shared by every résumé variant. Everything here comes from
 * Francisco's own CVs (full-stack, backend, frontend, AI engineer and
 * software engineer PDFs); variants only reorder and re-emphasise them.
 *
 * Privacy: the web pages and PDFs publish email, GitHub, LinkedIn and the
 * portfolio URL only. Never add a phone number or a home address here.
 */

export const CV_NAME = "Francisco Miguel Perez";

export const PORTFOLIO_URL = "https://me-pink-ten.vercel.app";

export const CV_CONTACTS: ContactLink[] = [
  { label: "franciscoperezdeveloper@gmail.com", href: "mailto:franciscoperezdeveloper@gmail.com" },
  { label: "linkedin.com/in/franprzdev", href: "https://linkedin.com/in/franprzdev" },
  { label: "github.com/franprzdev", href: "https://github.com/franprzdev" },
  { label: "me-pink-ten.vercel.app", href: PORTFOLIO_URL },
];

export const CV_LOCATION: Localized = {
  en: "Tucumán, Argentina (GMT-3) · On-site, hybrid or remote",
  es: "Tucumán, Argentina (GMT-3) · Presencial, híbrido o remoto",
};

export const SECTION_TITLES: Record<CvSection, Localized> = {
  [CvSection.Summary]: { en: "Summary", es: "Perfil" },
  [CvSection.Skills]: { en: "Tech stack", es: "Tecnologías" },
  [CvSection.Experience]: { en: "Experience", es: "Experiencia" },
  [CvSection.Projects]: { en: "Projects & awards", es: "Proyectos y premios" },
  [CvSection.Education]: { en: "Education", es: "Educación" },
  [CvSection.Certifications]: { en: "Certifications", es: "Certificaciones" },
  [CvSection.Languages]: { en: "Languages", es: "Idiomas" },
};

export const LANGUAGES: Localized = {
  en: "Spanish (native) · English (fluent) · Russian (basic)",
  es: "Español (nativo) · Inglés (fluido) · Ruso (básico)",
};

export const EDUCATION: EducationEntry[] = [
  {
    institution: "Universidad Tecnológica Nacional (UTN-FRT)",
    degree: { en: "B.S. Information Systems Engineering", es: "Ingeniería en Sistemas de Información" },
    period: { en: "Feb 2022 – Dec 2027 (expected)", es: "feb 2022 – dic 2027 (estimado)" },
  },
];

export const CERT_MERN: CertificationEntry = {
  school: "RollingCode School",
  name: { en: "Full-Stack Developer (MERN) — Outstanding Student", es: "Desarrollador Full-Stack (MERN) — Alumno destacado" },
  period: { en: "Nov 2022 – Sep 2023", es: "nov 2022 – sep 2023" },
};
export const CERT_REACT: CertificationEntry = {
  school: "RollingCode School",
  name: { en: "Advanced React", es: "React avanzado" },
  period: { en: "May 2024 – Sep 2024", es: "may 2024 – sep 2024" },
};
export const CERT_NEXT: CertificationEntry = {
  school: "RollingCode School",
  name: { en: "Advanced Next.js", es: "Next.js avanzado" },
  period: { en: "Jun 2025 – Nov 2025", es: "jun 2025 – nov 2025" },
};
export const CERT_DATA: CertificationEntry = {
  school: "RollingCode School",
  name: { en: "Data Engineer", es: "Data Engineer" },
  period: { en: "Jun 2025 – Oct 2025", es: "jun 2025 – oct 2025" },
};

export const PROJECT_NASA: ProjectEntry = {
  name: { en: "NASA Space Apps 2024 — National Winner", es: "NASA Space Apps 2024 — Ganador nacional" },
  detail: {
    en: "ExoGames, national winning project (Buenos Aires hackathon, virtual). National competitor again in 2025.",
    es: "ExoGames, proyecto ganador nacional (hackathon de Buenos Aires, virtual). Competidor nacional nuevamente en 2025.",
  },
};
export const PROJECT_PROOFY: ProjectEntry = {
  name: { en: "Proofy — Solana hackathon, 2026", es: "Proofy — hackathon Solana, 2026" },
  detail: {
    en: "Web app with an AI agent that turns a contract's scope into verifiable milestones and releases escrow payments on CI/CD evidence.",
    es: "App web con un agente de IA que convierte el alcance de un contrato en hitos verificables y libera pagos en escrow según evidencia de CI/CD.",
  },
  href: "https://proofyai.vercel.app",
};
export const PROJECT_VORTEX: ProjectEntry = {
  name: { en: "Vortex Software n8n Hackathon 2025", es: "Hackathon de n8n de Vortex Software 2025" },
  detail: { en: "On-site competitor in Tucumán.", es: "Competidor presencial en Tucumán." },
};

/* Experience periods and organisations, shared by every variant. */

export const REPUESTOSHOP = {
  org: "RepuestoShop",
  period: { en: "Dec 2025 – Present", es: "dic 2025 – actualidad" },
  place: { en: "Remote", es: "Remoto" },
} as const;

export const LA_VISTA_CASAL = {
  org: "La Vista Casal",
  period: { en: "Nov 2025 – Aug 2026", es: "nov 2025 – ago 2026" },
  place: { en: "Buenos Aires", es: "CABA" },
} as const;

export const ROLLINGCODE_STUDIO = {
  org: "RollingCode Studio",
  period: { en: "Oct 2024 – Dec 2025", es: "oct 2024 – dic 2025" },
} as const;

export const FLA = {
  org: "Fundación Líderes de Ansenuza",
  period: { en: "Apr 2025 – Present", es: "abr 2025 – actualidad" },
} as const;

export const JUDICIARY = {
  org: "Poder Judicial de Tucumán",
  period: { en: "Sep 2025 – Oct 2025", es: "sep 2025 – oct 2025" },
} as const;

export const ROLLINGCODE_SCHOOL = {
  org: "RollingCode School",
  period: { en: "Nov 2023 – Aug 2024", es: "nov 2023 – ago 2024" },
} as const;

/* Roles and bullets reused verbatim across variants. */

export const ROLE_SOFTWARE_AI: Localized = { en: "Software / AI Engineer", es: "Desarrollador de Software / IA" };
export const ROLE_AI: Localized = { en: "AI Engineer", es: "AI Engineer" };
export const ROLE_FREELANCE: Localized = { en: "Freelance Full-Stack Developer", es: "Desarrollador Full-Stack Freelance" };
export const ROLE_PRODUCT: Localized = { en: "Product Engineer", es: "Product Engineer" };
export const ROLE_FLA: Localized = { en: "Full-Stack Developer (Volunteer)", es: "Desarrollador Full-Stack (voluntario)" };
export const ROLE_INSTRUCTOR: Localized = {
  en: "Instructor, Process Automation with n8n",
  es: "Capacitador en Automatización con n8n",
};
export const ROLE_TA: Localized = { en: "Teaching Assistant, Web & Backend", es: "Ayudante docente Web y Backend" };

export const B_REPUESTO_TOOLS: Localized = {
  en: "Build and maintain internal tools and customer-facing automation for an auto-parts e-commerce, integrating Meta APIs and the product catalog.",
  es: "Desarrollo y mantengo herramientas internas y automatizaciones de atención para un e-commerce de repuestos, integrando APIs de Meta y el catálogo de productos.",
};
export const B_REPUESTO_AGENT: Localized = {
  en: "Designed a multi-agent assistant (LangGraph) with RAG over scraped catalog data to answer customer questions.",
  es: "Diseñé un asistente multiagente (LangGraph) con RAG sobre el catálogo para responder consultas de clientes.",
};
export const B_REPUESTO_LLM: Localized = {
  en: "Compared several LLM providers to choose the best cost/quality trade-off for production.",
  es: "Comparé varios proveedores de LLM para elegir la mejor relación costo/calidad en producción.",
};

export const B_LVC_PLATFORM: Localized = {
  en: "Co-built a tax-deadline management platform for an accounting firm: approval flows, change history and Google Calendar/Gmail integration. Running in production.",
  es: "Co-desarrollé una plataforma de gestión de vencimientos impositivos para un estudio contable: flujos de aprobación, historial de cambios e integración con Google Calendar y Gmail. En producción.",
};
export const B_LVC_HANDOVER: Localized = {
  en: "Delivered full handover: technical report, executive summary and user guide.",
  es: "Entregué documentación completa: informe técnico, resumen ejecutivo y guía de usuario.",
};

export const B_STUDIO_N8N: Localized = {
  en: "Automated internal tasks with n8n; worked in Scrum teams with Git Flow and code review.",
  es: "Automaticé tareas internas con n8n; trabajé en equipos Scrum con Git Flow y code review.",
};

export const B_FLA: Localized = {
  en: "Leading the foundation's digital transformation: rebuilt its web platform (Next.js, Prisma, PostgreSQL) and internal tools.",
  es: "Lidero la transformación digital de la fundación: rehice su plataforma web (Next.js, Prisma, PostgreSQL) y herramientas internas.",
};

export const B_JUDICIARY: Localized = {
  en: "Designed and taught a 20-hour course on n8n, APIs and automation workflows for court staff; presented the automation strategy to leadership.",
  es: "Diseñé y dicté un curso de 20 horas sobre n8n, APIs y flujos de automatización para personal judicial; presenté la estrategia de automatización a las autoridades.",
};

export const B_TA: Localized = {
  en: "Mentored students in web and backend development.",
  es: "Acompañé a estudiantes en desarrollo web y backend.",
};

/* Skill rows reused across variants. */

export const SKILL_LANGUAGES = {
  label: { en: "Languages", es: "Lenguajes" },
  value: { en: "TypeScript, JavaScript, Python, SQL", es: "TypeScript, JavaScript, Python, SQL" },
};
export const SKILL_DATA_CLOUD = {
  label: { en: "Databases & Cloud", es: "Bases de datos y cloud" },
  value: { en: "PostgreSQL, MongoDB, Supabase, AWS, Vercel, Netlify", es: "PostgreSQL, MongoDB, Supabase, AWS, Vercel, Netlify" },
};
export const SKILL_INTEGRATIONS = {
  label: { en: "Integrations & Automation", es: "Integraciones y automatización" },
  value: {
    en: "n8n, Google Workspace APIs, Meta APIs, web scraping",
    es: "n8n, APIs de Google Workspace, APIs de Meta, web scraping",
  },
};
export const SKILL_AI = {
  label: { en: "AI", es: "IA" },
  value: {
    en: "LLM APIs (OpenAI, Anthropic, Gemini), LangChain, LangGraph, RAG",
    es: "APIs de LLM (OpenAI, Anthropic, Gemini), LangChain, LangGraph, RAG",
  },
};
export const SKILL_PRACTICES = {
  label: { en: "Practices", es: "Prácticas" },
  value: {
    en: "Git, Git Flow, code review, CI/CD, Scrum, clean code",
    es: "Git, Git Flow, code review, CI/CD, Scrum, clean code",
  },
};
