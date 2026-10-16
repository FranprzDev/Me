import * as F from "./facts";
import { CvSection, CvVariant, type CvDefinition, type ExperienceEntry, type Localized } from "./types";

/*
 * Each variant is a re-ordering and re-emphasis of the facts in ./facts.ts.
 * Full-stack, backend and frontend follow Francisco's own CVs of those names;
 * applied-ai follows his AI Engineer CV; fde puts client-facing delivery,
 * integrations and AI agents first. No variant adds a role, date, metric or
 * skill that is not in his source CVs.
 *
 * One page per variant (A4, checked by `pnpm cv:pdf`): each variant keeps the
 * roles, bullets and projects most relevant to its role type and drops the
 * rest. Shortened text only trims words, never changes a fact.
 */

const freelanceProjects: ExperienceEntry = {
  role: F.ROLE_FREELANCE,
  org: F.FREELANCE_PROJECTS.org,
  period: F.FREELANCE_PROJECTS.period,
  bullets: [F.B_ACCOUNTING_PLATFORM],
};

/** FDE keeps the handover: client delivery is the point of that variant. */
const freelanceProjectsWithHandover: ExperienceEntry = {
  ...freelanceProjects,
  bullets: [F.B_ACCOUNTING_PLATFORM, F.B_ACCOUNTING_HANDOVER],
};

const fla: ExperienceEntry = { role: F.ROLE_FLA, org: F.FLA.org, period: F.FLA.period, bullets: [F.B_FLA] };

const judiciary: ExperienceEntry = {
  role: F.ROLE_INSTRUCTOR,
  org: F.JUDICIARY.org,
  period: F.JUDICIARY.period,
  bullets: [F.B_JUDICIARY],
};

const repuestoGeneral: ExperienceEntry = {
  role: F.ROLE_SOFTWARE_AI,
  org: F.REPUESTOSHOP.org,
  place: F.REPUESTOSHOP.place,
  period: F.REPUESTOSHOP.period,
  bullets: [F.B_REPUESTO_TOOLS, F.B_REPUESTO_AGENT],
};

function studio(first: Localized): ExperienceEntry {
  return {
    role: F.ROLE_PRODUCT,
    org: F.ROLLINGCODE_STUDIO.org,
    period: F.ROLLINGCODE_STUDIO.period,
    bullets: [first],
  };
}

const generalSections = [
  CvSection.Summary,
  CvSection.Skills,
  CvSection.Experience,
  CvSection.Projects,
  CvSection.Education,
  CvSection.Certifications,
  CvSection.Languages,
];

const webCertifications = [F.CERT_MERN, F.CERT_REACT, F.CERT_NEXT];

/** Web variants: one compact AI + integrations row instead of two. */
const SKILL_AI_INTEGRATIONS = {
  label: { en: "AI & Integrations", es: "IA e integraciones" },
  value: {
    en: "LLM APIs (OpenAI, Anthropic, Gemini), LangChain, LangGraph, RAG, n8n, Google Workspace APIs, Meta APIs",
    es: "APIs de LLM (OpenAI, Anthropic, Gemini), LangChain, LangGraph, RAG, n8n, APIs de Google Workspace, APIs de Meta",
  },
};

/** The two highlight projects (the n8n hackathon is dropped for space). */
const highlightProjects = [F.PROJECT_NASA, F.PROJECT_PROOFY];

const fullstack: CvDefinition = {
  variant: CvVariant.Fullstack,
  label: { en: "Full-Stack", es: "Full-Stack" },
  headline: {
    en: "Full-Stack Software Developer | TypeScript, React, Next.js, Node.js, Python | AI integrations",
    es: "Desarrollador de Software Full-Stack | TypeScript, React, Next.js, Node.js, Python | Integraciones con IA",
  },
  summary: {
    en: "Software developer with 3 years building production web applications end to end: frontends in React and Next.js, APIs in Node.js and Python, databases, deployments and third-party integrations. I add AI and automation where they solve a real problem (LLM agents, RAG, n8n) and work directly with clients, from requirements to handover. NASA Space Apps 2024 national winner.",
    es: "Desarrollador de software con 3 años construyendo aplicaciones web en producción de punta a punta: frontend en React y Next.js, APIs en Node.js y Python, bases de datos, despliegues e integraciones con terceros. Sumo IA y automatización donde resuelven un problema real (agentes con LLMs, RAG, n8n) y trabajo directo con clientes, del relevamiento a la entrega. Ganador nacional de NASA Space Apps 2024.",
  },
  sections: generalSections,
  skills: [
    F.SKILL_LANGUAGES,
    { label: { en: "Frontend", es: "Frontend" }, value: { en: "React, Next.js, HTML/CSS, Tailwind", es: "React, Next.js, HTML/CSS, Tailwind" } },
    { label: { en: "Backend", es: "Backend" }, value: { en: "Node.js, Express, REST APIs, webhooks", es: "Node.js, Express, APIs REST, webhooks" } },
    F.SKILL_DATA_CLOUD,
    SKILL_AI_INTEGRATIONS,
    F.SKILL_PRACTICES,
  ],
  experience: [
    repuestoGeneral,
    freelanceProjects,
    studio({
      en: "Shipped frontend and backend features for client web projects in React, Next.js and Node.js.",
      es: "Desarrollé funcionalidades de frontend y backend para proyectos web de clientes en React, Next.js y Node.js.",
    }),
    fla,
    judiciary,
  ],
  projects: highlightProjects,
  certifications: webCertifications,
};

const backend: CvDefinition = {
  variant: CvVariant.Backend,
  label: { en: "Backend", es: "Backend" },
  headline: {
    en: "Backend Developer | Node.js, TypeScript, Python | REST APIs, PostgreSQL, MongoDB, AWS",
    es: "Desarrollador Backend | Node.js, TypeScript, Python | APIs REST, PostgreSQL, MongoDB, AWS",
  },
  summary: {
    en: "Backend-focused software developer with 3 years building production systems: REST APIs and services in Node.js and Python, data modeling in PostgreSQL and MongoDB, third-party APIs and webhooks, and deployments on AWS and Vercel. I also work on the frontend (React, Next.js) when the product needs it, and add AI and automation where they solve a real problem (LLM agents, RAG, n8n). NASA Space Apps 2024 national winner.",
    es: "Desarrollador de software orientado a backend, con 3 años construyendo sistemas en producción: APIs REST y servicios en Node.js y Python, modelado de datos en PostgreSQL y MongoDB, APIs de terceros y webhooks, y despliegues en AWS y Vercel. También trabajo en frontend (React, Next.js) cuando el producto lo necesita, y sumo IA y automatización donde resuelven un problema real (agentes con LLMs, RAG, n8n). Ganador nacional de NASA Space Apps 2024.",
  },
  sections: generalSections,
  skills: [
    F.SKILL_LANGUAGES,
    {
      label: { en: "Backend", es: "Backend" },
      value: {
        en: "Node.js, Express, REST APIs, webhooks, authentication, background jobs",
        es: "Node.js, Express, APIs REST, webhooks, autenticación, tareas en segundo plano",
      },
    },
    { label: { en: "Frontend", es: "Frontend" }, value: { en: "React, Next.js", es: "React, Next.js" } },
    F.SKILL_DATA_CLOUD,
    SKILL_AI_INTEGRATIONS,
    F.SKILL_PRACTICES,
  ],
  experience: [
    repuestoGeneral,
    freelanceProjects,
    studio({
      en: "Built backend features and APIs in Node.js for client web projects, plus the matching React/Next.js frontends.",
      es: "Desarrollé funcionalidades de backend y APIs en Node.js para proyectos web de clientes, junto con sus frontends en React/Next.js.",
    }),
    fla,
    judiciary,
  ],
  projects: highlightProjects,
  certifications: webCertifications,
};

const frontend: CvDefinition = {
  variant: CvVariant.Frontend,
  label: { en: "Frontend", es: "Frontend" },
  headline: {
    en: "Frontend Engineer | React, Next.js, TypeScript | HTML/CSS, Tailwind, Vercel",
    es: "Desarrollador Frontend | React, Next.js, TypeScript | HTML/CSS, Tailwind, Vercel",
  },
  summary: {
    en: "Frontend-focused software developer with 3 years building production web applications: user interfaces in React and Next.js with TypeScript, HTML/CSS and Tailwind, shipped on Vercel and Netlify. I also work across the stack (Node.js APIs, PostgreSQL, Supabase) when the product needs it, and add AI and automation where they solve a real problem (LLM agents, RAG, n8n). NASA Space Apps 2024 national winner.",
    es: "Desarrollador de software orientado a frontend, con 3 años construyendo aplicaciones web en producción: interfaces en React y Next.js con TypeScript, HTML/CSS y Tailwind, desplegadas en Vercel y Netlify. También trabajo en todo el stack (APIs en Node.js, PostgreSQL, Supabase) cuando el producto lo necesita, y sumo IA y automatización donde resuelven un problema real (agentes con LLMs, RAG, n8n). Ganador nacional de NASA Space Apps 2024.",
  },
  sections: generalSections,
  skills: [
    {
      label: { en: "Frontend", es: "Frontend" },
      value: { en: "React, Next.js, TypeScript, HTML/CSS, Tailwind", es: "React, Next.js, TypeScript, HTML/CSS, Tailwind" },
    },
    F.SKILL_LANGUAGES,
    {
      label: { en: "Deploy & Cloud", es: "Despliegue y cloud" },
      value: { en: "Vercel, Netlify, Supabase, AWS", es: "Vercel, Netlify, Supabase, AWS" },
    },
    {
      label: { en: "Backend", es: "Backend" },
      value: {
        en: "Node.js, Express, REST APIs, webhooks, PostgreSQL, MongoDB",
        es: "Node.js, Express, APIs REST, webhooks, PostgreSQL, MongoDB",
      },
    },
    SKILL_AI_INTEGRATIONS,
    F.SKILL_PRACTICES,
  ],
  // UI work first: the React/Next.js roles lead, the rest follows by date.
  experience: [
    studio({
      en: "Built React and Next.js frontends and UI features for client web projects, plus the Node.js backends behind them.",
      es: "Desarrollé frontends y funcionalidades de interfaz en React y Next.js para proyectos web de clientes, junto con sus backends en Node.js.",
    }),
    fla,
    repuestoGeneral,
    freelanceProjects,
    judiciary,
  ],
  projects: [F.PROJECT_PROOFY, F.PROJECT_NASA],
  certifications: [F.CERT_REACT, F.CERT_NEXT, F.CERT_MERN],
};

const appliedAi: CvDefinition = {
  variant: CvVariant.AppliedAi,
  label: { en: "Applied AI", es: "IA aplicada" },
  headline: {
    en: "Applied AI Engineer | Multi-agent systems, RAG pipelines, LangChain/LangGraph | Workflow automation",
    es: "AI Engineer (IA aplicada) | Sistemas multiagente, pipelines RAG, LangChain/LangGraph | Automatización",
  },
  summary: {
    en: "Nearly three years of industry experience building clean and scalable systems. I evolved from full-stack engineering into designing applied AI solutions and workflow automations: multi-agent systems, RAG pipelines, tool calling and context control. I bring product sense to build systems that drive business value, plus experience leading technical courses and workshops. NASA Space Apps 2024 national winner.",
    es: "Casi tres años de experiencia en la industria construyendo sistemas limpios y escalables. Evolucioné del desarrollo full-stack al diseño de soluciones de IA aplicada y automatizaciones: sistemas multiagente, pipelines RAG, tool calling y control de contexto. Aporto criterio de producto para construir sistemas que generan valor, además de experiencia dictando cursos y talleres técnicos. Ganador nacional de NASA Space Apps 2024.",
  },
  sections: [
    CvSection.Summary,
    CvSection.Experience,
    CvSection.Skills,
    CvSection.Projects,
    CvSection.Education,
    CvSection.Certifications,
    CvSection.Languages,
  ],
  skills: [
    {
      label: { en: "AI & agents", es: "IA y agentes" },
      value: {
        en: "LangChain, LangGraph, multi-agent systems, RAG, tool calling, context control, LLM APIs (OpenAI, Anthropic, Gemini)",
        es: "LangChain, LangGraph, sistemas multiagente, RAG, tool calling, control de contexto, APIs de LLM (OpenAI, Anthropic, Gemini)",
      },
    },
    {
      label: { en: "Automation & data", es: "Automatización y datos" },
      value: {
        en: "n8n, APIs and webhooks, Human-in-the-Loop workflows, web scraping pipelines, Meta APIs, Google Workspace APIs",
        es: "n8n, APIs y webhooks, flujos Human-in-the-Loop, pipelines de web scraping, APIs de Meta, APIs de Google Workspace",
      },
    },
    F.SKILL_LANGUAGES,
    {
      label: { en: "Web & Cloud", es: "Web y cloud" },
      value: {
        en: "React, Next.js, Node.js, Express, PostgreSQL, MongoDB, Supabase, AWS, Vercel",
        es: "React, Next.js, Node.js, Express, PostgreSQL, MongoDB, Supabase, AWS, Vercel",
      },
    },
    {
      label: { en: "Tooling & practices", es: "Herramientas y prácticas" },
      value: {
        en: "Codex, Claude Code, Git, Git Flow, CI/CD, Scrum",
        es: "Codex, Claude Code, Git, Git Flow, CI/CD, Scrum",
      },
    },
  ],
  experience: [
    {
      role: F.ROLE_AI,
      org: F.REPUESTOSHOP.org,
      place: F.REPUESTOSHOP.place,
      period: F.REPUESTOSHOP.period,
      bullets: [
        {
          en: "Architect and deploy multi-agent systems and custom RAG pipelines with LangChain and LangGraph, focused on agent harness engineering, tool calling and context control.",
          es: "Diseño y despliego sistemas multiagente y pipelines RAG a medida con LangChain y LangGraph, con foco en agent harness, tool calling y control de contexto.",
        },
        F.B_REPUESTO_AGENT,
        {
          en: "Benchmark LLM providers for the best cost/quality trade-off in production; use Codex and Claude Code to deliver production-ready POCs fast.",
          es: "Comparo proveedores de LLM por relación costo/calidad en producción; uso Codex y Claude Code para entregar POCs listos para producción.",
        },
      ],
    },
    freelanceProjects,
    judiciary,
    studio({
      en: "Built frontend and backend features for client web projects; introduced n8n automations and explored practical AI tools through working POCs.",
      es: "Desarrollé funcionalidades de frontend y backend para proyectos web de clientes; impulsé automatizaciones con n8n y exploré herramientas de IA mediante POCs funcionales.",
    }),
  ],
  projects: highlightProjects,
  certifications: [F.CERT_MERN, F.CERT_REACT, F.CERT_NEXT, F.CERT_DATA],
};

const fde: CvDefinition = {
  variant: CvVariant.Fde,
  label: { en: "Forward Deployed", es: "Forward Deployed" },
  headline: {
    en: "Forward Deployed Software Engineer | Client delivery, integrations, AI agents | Full-stack",
    es: "Forward Deployed Software Engineer | Entrega a clientes, integraciones, agentes de IA | Full-stack",
  },
  summary: {
    en: "Software engineer who ships end to end, working directly with clients and non-technical users: from gathering requirements to production, handover and training. 3 years building web applications (React, Next.js, Node.js, Python), integrating third-party systems (Google Workspace, Meta APIs, webhooks) and adding AI agents and automation where they solve a real problem (LangGraph, RAG, n8n). NASA Space Apps 2024 national winner.",
    es: "Ingeniero de software que entrega de punta a punta, trabajando directo con clientes y usuarios no técnicos: desde el relevamiento hasta producción, la entrega y la capacitación. 3 años construyendo aplicaciones web (React, Next.js, Node.js, Python), integrando sistemas de terceros (Google Workspace, APIs de Meta, webhooks) y sumando agentes de IA y automatización donde resuelven un problema real (LangGraph, RAG, n8n). Ganador nacional de NASA Space Apps 2024.",
  },
  sections: [
    CvSection.Summary,
    CvSection.Experience,
    CvSection.Skills,
    CvSection.Projects,
    CvSection.Education,
    CvSection.Certifications,
    CvSection.Languages,
  ],
  skills: [
    {
      label: { en: "Client delivery", es: "Entrega a clientes" },
      value: {
        en: "Requirements gathering, handover documentation, user training, working with non-technical users",
        es: "Relevamiento de requisitos, documentación de entrega, capacitación de usuarios, trabajo con usuarios no técnicos",
      },
    },
    {
      label: { en: "Integrations", es: "Integraciones" },
      value: {
        en: "Google Workspace APIs (Calendar, Gmail), Meta APIs, REST APIs, webhooks, web scraping",
        es: "APIs de Google Workspace (Calendar, Gmail), APIs de Meta, APIs REST, webhooks, web scraping",
      },
    },
    {
      label: { en: "AI & automation", es: "IA y automatización" },
      value: {
        en: "LangChain, LangGraph, RAG, LLM APIs (OpenAI, Anthropic, Gemini), n8n",
        es: "LangChain, LangGraph, RAG, APIs de LLM (OpenAI, Anthropic, Gemini), n8n",
      },
    },
    {
      label: { en: "Full-stack", es: "Full-stack" },
      value: {
        en: "TypeScript, JavaScript, Python, SQL, React, Next.js, Node.js, Express",
        es: "TypeScript, JavaScript, Python, SQL, React, Next.js, Node.js, Express",
      },
    },
    F.SKILL_DATA_CLOUD,
    F.SKILL_PRACTICES,
  ],
  // Client-facing delivery first, then the rest by date.
  experience: [
    freelanceProjectsWithHandover,
    {
      role: F.ROLE_AI,
      org: F.REPUESTOSHOP.org,
      place: F.REPUESTOSHOP.place,
      period: F.REPUESTOSHOP.period,
      bullets: [F.B_REPUESTO_TOOLS, F.B_REPUESTO_AGENT],
    },
    judiciary,
    studio({
      en: "Shipped frontend and backend features for client web projects in React, Next.js and Node.js.",
      es: "Desarrollé funcionalidades de frontend y backend para proyectos web de clientes en React, Next.js y Node.js.",
    }),
    fla,
  ],
  projects: [F.PROJECT_PROOFY, F.PROJECT_NASA],
  certifications: webCertifications,
};

/** Variants in the order the index and the switcher list them. */
export const CV_DEFINITIONS: Record<CvVariant, CvDefinition> = {
  [CvVariant.Fde]: fde,
  [CvVariant.Fullstack]: fullstack,
  [CvVariant.Frontend]: frontend,
  [CvVariant.Backend]: backend,
  [CvVariant.AppliedAi]: appliedAi,
};
