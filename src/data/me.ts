/**
 * Content for the /me route (editorial "about me" page).
 * Bilingual ES/EN, same Localized shape as data/cv.ts.
 * Every fact here must stay true: edit with care.
 */
import { CV, type Localized } from "@/data/cv";

export interface MeLayer {
  title: Localized<string>;
  body: Localized<string>;
}

export interface MeRole {
  org: string;
  role: Localized<string>;
  period: Localized<string>;
  body: Localized<string>;
  stack: string[];
}

export interface MeStep {
  title: Localized<string>;
  note: Localized<string>;
}

export interface MeProject {
  name: string;
  image: string;
  status: Localized<string>;
  body: Localized<string>;
  link: { label: Localized<string>; href: string };
}

export const ME = {
  name: "Francisco Perez",
  email: CV.email,
  linkedin: CV.linkedin,
  github: CV.github,

  hero: {
    title: {
      es: "Agentes de IA que hacen trabajo real.",
      en: "AI agents that do real work.",
    },
    body: {
      es: "Soy Francisco Perez, AI engineer y desarrollador full-stack en Tucumán, Argentina. Diseño sistemas multi-agente, pipelines RAG y automatizaciones que le sacan trabajo repetitivo de encima a los equipos, y los llevo a producción.",
      en: "I'm Francisco Perez, an AI engineer and full-stack developer based in Tucumán, Argentina. I design multi-agent systems, RAG pipelines and automations that take repetitive work off teams' plates, and I ship them to production.",
    },
    cta: { es: "Escribime", en: "Get in touch" },
  },

  statement: {
    title: {
      es: "Una demo impresiona. Un sistema en producción ahorra horas.",
      en: "A demo impresses. A system in production saves hours.",
    },
    body: {
      es: "Arranco cerca de quien va a usar el sistema: qué se hace a mano hoy, qué no se puede romper y cómo vamos a medir si funciona. Recién después construyo, con criterio de producto y código revisado.",
      en: "I start next to the people who will use the system: what is done by hand today, what must not break and how we will know it works. Only then do I build, with product sense and reviewed code.",
    },
    cta: { es: "Ver mi CV", en: "See my resume" },
  },

  layers: {
    title: { es: "Cómo armo un agente.", en: "How I build an agent." },
    body: {
      es: "El modelo es solo el centro. Lo que lo vuelve útil, y confiable, son las capas que lo rodean.",
      en: "The model is only the core. What makes it useful, and trustworthy, are the layers around it.",
    },
    orbit: { es: "AGENTE", en: "AGENT" },
    hint: { es: "SCROLLEÁ PARA ABRIR", en: "SCROLL TO OPEN" },
    items: [
      {
        title: { es: "Modelo", en: "Model" },
        body: {
          es: "Razona y propone. Elijo el modelo comparándolo contra el caso real, no contra un benchmark genérico.",
          en: "Reasons and proposes. I pick the model by testing it on the real case, not on a generic benchmark.",
        },
      },
      {
        title: { es: "Herramientas", en: "Tools" },
        body: {
          es: "Tool calling y servidores MCP: el agente solo puede hacer lo que está expuesto, con entradas tipadas.",
          en: "Tool calling and MCP servers: the agent can only do what is exposed, with typed inputs.",
        },
      },
      {
        title: { es: "Contexto", en: "Context" },
        body: {
          es: "RAG, scraping y datos propios para que responda con información real. Controlo qué entra a la ventana y qué no.",
          en: "RAG, scraping and first-party data so it answers with real information. I control what enters the context window.",
        },
      },
      {
        title: { es: "Humano en el loop", en: "Human in the loop" },
        body: {
          es: "Lo que importa lo aprueba una persona. Cada paso queda registrado para poder revisarlo después.",
          en: "What matters gets approved by a person. Every step is logged so it can be reviewed later.",
        },
      },
    ] satisfies MeLayer[],
  },

  about: {
    title: { es: "Quién soy", en: "Who I am" },
    lead: {
      es: "Francisco Miguel Perez, estudiante avanzado de Ingeniería en Sistemas de Información en la UTN-FRT. Casi tres años en la industria, de full-stack a IA aplicada.",
      en: "Francisco Miguel Perez, final-year Information Systems Engineering student at UTN-FRT. Nearly three years in industry, from full-stack to applied AI.",
    },
    body: {
      es: "Hoy trabajo con LangChain, LangGraph, tool calling y RAG. También enseño: diseñé y di un curso de 20 horas de automatización con n8n para el Poder Judicial de Tucumán. Español nativo, inglés fluido.",
      en: "Today I work with LangChain, LangGraph, tool calling and RAG. I also teach: I designed and delivered a 20-hour n8n automation course for the Tucumán Judiciary. Native Spanish, fluent English.",
    },
    photoAlt: {
      es: "Francisco Perez sonriendo en una oficina, sentado frente a una mesa con laptops",
      en: "Francisco Perez smiling in an office, sitting at a desk with laptops",
    },
    roles: [
      {
        org: "RepuestoShop",
        role: { es: "AI Engineer · part-time", en: "AI Engineer · part-time" },
        period: { es: "Dic 2025 – oct 2026", en: "Dec 2025 – Oct 2026" },
        body: {
          es: "Diseño y despliego sistemas multi-agente y pipelines RAG a medida, con foco en agent harness, tool calling y control de contexto. Construyo herramientas internas con Meta APIs y pipelines de scraping para grounding de datos.",
          en: "I design and deploy multi-agent systems and custom RAG pipelines, focused on agent harness engineering, tool calling and context control. I build internal tools with Meta APIs and scraping pipelines for data grounding.",
        },
        stack: ["LangChain", "LangGraph", "Multi-Agent", "RAG", "Meta APIs"],
      },
      {
        org: "Freelance",
        role: {
          es: "Sistema de automatización para un estudio contable",
          en: "Automation system for an accounting firm",
        },
        period: { es: "2026", en: "2026" },
        body: {
          es: "Calendario de vencimientos impositivos para un estudio contable de Buenos Aires: aprobaciones, historial de cambios e integración con Google Calendar y Gmail. Del relevamiento a la entrega, con documentación técnica y guías de uso.",
          en: "A tax due-date calendar for an accounting firm in Buenos Aires: approvals, change history and Google Calendar and Gmail integration. From discovery to handover, with technical documentation and user guides.",
        },
        stack: ["Automation", "Google Workspace APIs", "Approvals"],
      },
      {
        org: "Poder Judicial de Tucumán",
        role: { es: "Docente · Curso de n8n", en: "Instructor · n8n course" },
        period: { es: "Sep – Oct 2025", en: "Sep – Oct 2025" },
        body: {
          es: "Curso de 10 clases (20 horas) de automatización de procesos con n8n: modelado de flujos, APIs y webhooks, pipelines RAG y automatizaciones con humano en el loop. Material propio y demos en vivo.",
          en: "A 10-session (20-hour) course on process automation with n8n: flow modeling, APIs and webhooks, RAG pipelines and human-in-the-loop automations. My own material and live demos.",
        },
        stack: ["n8n", "RAG", "Webhooks", "Human-in-the-Loop"],
      },
      {
        org: "RollingCode Studio",
        role: { es: "Product Engineer", en: "Product Engineer" },
        period: { es: "Oct 2024 – Dic 2025", en: "Oct 2024 – Dec 2025" },
        body: {
          es: "Proyectos web completos, del frontend a la integración con backend, con Scrum y Git Flow. Ayudé a incorporar n8n al equipo y desarrollé POCs con herramientas de IA para el trabajo diario.",
          en: "End-to-end web projects, from frontend to backend integration, with Scrum and Git Flow. Helped bring n8n into the team and built AI-tooling POCs for day-to-day work.",
        },
        stack: ["React", "Node.js", "Scrum", "Git Flow", "n8n"],
      },
    ] satisfies MeRole[],
  },

  process: {
    title: { es: "Cómo trabajo", en: "How I work" },
    lead: {
      es: "Especificación primero, código revisado siempre.",
      en: "Spec first, reviewed code always.",
    },
    body: [
      {
        es: "Empiezo por el problema: quién lo sufre, cuánto cuesta hoy y qué no se puede romper. Lo escribo como criterios de aceptación antes de tocar el código.",
        en: "I start with the problem: who suffers it, what it costs today and what must not break. I write it down as acceptance criteria before touching any code.",
      },
      {
        es: "Construyo en ramas cortas, con agentes de IA como copilotos, y cada cambio pasa por un pull request con tests, lint y build. En producción observo, y lo que aprendo vuelve a la especificación.",
        en: "I build in short-lived branches, with AI agents as copilots, and every change goes through a pull request with tests, lint and build. In production I observe, and what I learn flows back into the spec.",
      },
    ],
    loop: { es: "LO QUE APRENDO VUELVE", en: "WHAT I LEARN LOOPS BACK" },
    steps: [
      {
        title: { es: "Problema", en: "Problem" },
        note: { es: "quién lo usa, cuánto cuesta hoy", en: "who uses it, what it costs today" },
      },
      {
        title: { es: "Especificación", en: "Specification" },
        note: { es: "criterios antes que código", en: "criteria before code" },
      },
      {
        title: { es: "Construcción", en: "Build" },
        note: { es: "ramas cortas, agentes como copilotos", en: "short branches, agents as copilots" },
      },
      {
        title: { es: "Pull request", en: "Pull request" },
        note: { es: "tests, lint y build en verde", en: "tests, lint and build green" },
      },
      {
        title: { es: "Producción observada", en: "Observed in production" },
        note: { es: "logs, métricas, feedback", en: "logs, metrics, feedback" },
      },
    ] satisfies MeStep[],
  },

  projects: [
    {
      name: "ScopeProfit",
      image: "/me/tile-scopeprofit.webp",
      status: { es: "En desarrollo", en: "In development" },
      body: {
        es: "Copiloto de alcance para freelancers, MCP-first: de una idea desordenada del cliente a un brief versionado y un documento listo. 15 herramientas MCP para que lo use cualquier agente.",
        en: "An MCP-first scope copilot for freelancers: from a client's messy idea to a versioned brief and a ready-to-send document. 15 MCP tools so any agent can use it.",
      },
      link: { label: { es: "Ver repo", en: "View repo" }, href: "https://github.com/FranprzDev/ScopeProfit" },
    },
    {
      name: "Proofy",
      image: "/me/tile-proofy.webp",
      status: { es: "Prototipo · devnet", en: "Prototype · devnet" },
      body: {
        es: "Del alcance acordado a evidencia verificable, y de la evidencia a pagos por hito en Solana. Un agente convierte requisitos en escenarios de prueba y evalúa entregas contra CI/CD.",
        en: "From agreed scope to verifiable evidence, and from evidence to milestone payments on Solana. An agent turns requirements into test scenarios and evaluates deliveries against CI/CD.",
      },
      link: { label: { es: "Ver sitio", en: "Visit site" }, href: "https://proofyai.vercel.app/" },
    },
    {
      name: "ExoGames",
      image: "/me/tile-exogames.webp",
      status: { es: "Ganador nacional · NASA Space Apps 2024", en: "National winner · NASA Space Apps 2024" },
      body: {
        es: "Juegos educativos para explorar exoplanetas. Proyecto ganador a nivel nacional del NASA Space Apps Challenge 2024.",
        en: "Educational games to explore exoplanets. National winning project of the NASA Space Apps Challenge 2024.",
      },
      link: { label: { es: "Jugar", en: "Play" }, href: "https://exogames.vercel.app" },
    },
  ] satisfies MeProject[],

  cta: {
    title: {
      es: "¿Hay un proceso que se come tu semana? Automaticémoslo.",
      en: "Is there a process eating your week? Let's automate it.",
    },
    body: {
      es: "Contame qué se hace a mano hoy y te digo qué construiría primero.",
      en: "Tell me what's done by hand today and I'll tell you what I'd build first.",
    },
    button: { es: "Escribime", en: "Email me" },
  },

  footer: {
    tagline: { es: "IA aplicada, desde Tucumán.", en: "Applied AI, from Tucumán." },
  },
};
