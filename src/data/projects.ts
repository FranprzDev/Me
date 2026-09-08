import type { Localized } from "./cv";

export interface PlanetSpec {
  /** Color base del cuerpo del planeta. */
  body: string;
  /** Color interior de la atmósfera fresnel. */
  atmoA: string;
  /** Color del borde (rim) de la atmósfera. */
  atmoB: string;
  /** Radio relativo del planeta. */
  radius: number;
  /** Anillo tenue (reservado para el proyecto destacado). */
  ring?: string;
}

/** Sub-proyecto dentro de un planeta (p.ej. cada Space Apps). */
export interface ProjectItem {
  name: string;
  description: Localized<string>;
  year: string;
  link?: string;
  highlight?: Localized<string>;
  category?: Localized<string>;
}

export interface Project {
  /** Slug de la ruta del planeta (p.ej. "hackathons" → /hackathons). */
  slug: string;
  name: string;
  title?: Localized<string>;
  tagline: Localized<string>;
  description: Localized<string>;
  stack: string[];
  year: string;
  link?: string;
  featured?: boolean;
  /** Cómo se ve este proyecto como planeta en el cosmos 3D. */
  planet: PlanetSpec;
  /** Mundos internos del planeta (p.ej. las dos participaciones en Space Apps). */
  items?: ProjectItem[];
}

/**
 * Los planetas del portfolio: cada uno ES un proyecto y al clickearlo se
 * visita su ruta /{slug} con la información completa.
 */
export const PROJECTS: Project[] = [
  {
    slug: "hackathons",
    name: "Hackathones",
    title: { es: "Hackathones", en: "Hackathons" },
    tagline: {
      es: "Hackathones bajo presión: NASA, n8n y UNESCO.",
      en: "Hackathons under pressure: NASA, n8n and UNESCO.",
    },
    description: {
      es: "Espacios donde el tiempo, el equipo y el problema real mandan: desde NASA Space Apps (BeeAgro y ExoGames, ganador nacional 2024) hasta el hackathon n8n de Vortex IT y el Youth Hackathon 2025 de UNESCO.",
      en: "Spaces where time, team and a real problem matter: from NASA Space Apps (BeeAgro and national winner ExoGames 2024) to Vortex IT's n8n hackathon and UNESCO's Youth Hackathon 2025.",
    },
    stack: ["Teamwork", "Open Data", "Rapid Prototyping", "n8n"],
    year: "2023 – 2025",
    featured: true,
    planet: {
      body: "#2e5c38",
      atmoA: "#39ff14",
      atmoB: "#baffd0",
      radius: 1.15,
      ring: "#7ddc8f",
    },
    items: [
      {
        name: "ExoGames — Marshall Arg",
        description: {
          es: "Proyecto ganador a nivel nacional del NASA Space Apps Challenge 2024.",
          en: "National winning project of the NASA Space Apps Challenge 2024.",
        },
        year: "2024",
        link: "https://github.com/FranprzDev/NASASpaceApp-Marshall-Arg",
        highlight: { es: "Ganador Nacional ★", en: "National Winner ★" },
      },
      {
        name: "BeeAgro",
        description: {
          es: "Tecnología al servicio de la apicultura. Nuestra participación en Space Apps 2025.",
          en: "Technology for beekeeping. Our Space Apps 2025 participation.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/BeeAgro-Spanish",
      },
      {
        name: "Hackathon n8n — Vortex IT",
        description: {
          es: "Competidor presencial en Tucumán. Automatización y workflows con n8n bajo presión.",
          en: "On-site competitor in Tucumán. Automation and n8n workflows under pressure.",
        },
        year: "2025",
      },
      {
        name: "Youth Hackathon 2025 — UNESCO",
        description: {
          es: "Participación en el hackathon joven de UNESCO 2025.",
          en: "Participation in UNESCO Youth Hackathon 2025.",
        },
        year: "2025",
      },
    ],
  },
  {
    slug: "curso-n8n",
    name: "Curso de Automatización con n8n",
    title: { es: "Curso de Automatización con n8n", en: "n8n Automation Course" },
    tagline: {
      es: "10 clases (20 h) de automatización para el Poder Judicial de Tucumán.",
      en: "10 sessions (20h) of automation for the Tucumán Judiciary.",
    },
    description: {
      es: "Diseño e impartición de un curso completo de automatización de procesos con n8n para personal del Poder Judicial: modelado de flujos, integración con APIs y webhooks, pipelines de RAG y automatizaciones Human-in-the-Loop.",
      en: "Designed and delivered a full process-automation course with n8n for Judiciary staff: flow modeling, API/webhook integration, RAG pipelines and Human-in-the-Loop automations.",
    },
    stack: ["n8n", "APIs", "Webhooks", "RAG"],
    year: "2025",
    planet: {
      body: "#6b4a1d",
      atmoA: "#e9b949",
      atmoB: "#ffe6b0",
      radius: 0.95,
    },
    items: [
      {
        name: "n8n-workflows-course",
        description: {
          es: "Workflows de las sesiones 2 a 10 del curso: el material práctico que construimos en vivo con el grupo.",
          en: "Session 2–10 workflows from the course: the hands-on material we built live with the group.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/n8n-workflows-course",
        category: { es: "Material del curso", en: "Course material" },
      },
      {
        name: "n8n-curso-vivo",
        description: {
          es: "Repo vivo del curso con la sesión 9 y material de apoyo de las clases.",
          en: "Live course repo with session 9 and class support material.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/n8n-curso-vivo",
        category: { es: "Material del curso", en: "Course material" },
      },
    ],
  },
  {
    slug: "projects",
    name: "Proyectos Personales",
    title: { es: "Proyectos Personales", en: "Personal Projects" },
    tagline: {
      es: "Herramientas reales: developer tools, IA y productos web.",
      en: "Real tools: developer tools, AI and web products.",
    },
    description: {
      es: "Una selección de herramientas que construí para resolver problemas concretos: automatización, agentes de IA, utilidades para desarrollo y productos web.",
      en: "A selection of tools I built to solve concrete problems: automation, AI agents, developer utilities and web products.",
    },
    stack: ["TypeScript", "IA", "Web", "Open Source"],
    year: "2023 – en curso",
    link: "https://github.com/FranprzDev?tab=repositories",
    planet: {
      body: "#1f4a66",
      atmoA: "#4fc3f7",
      atmoB: "#c5ecff",
      radius: 0.88,
    },
    items: [
      {
        name: "apuntes-cli",
        description: {
          es: "CLI/plugin para generar FAQs y apuntes finales compactos por materia.",
          en: "CLI/plugin for generating compact FAQs and final notes by subject.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/apuntes-cli",
        category: { es: "Developer Tools", en: "Developer Tools" },
      },
      {
        name: "mac-brainroot-cli",
        description: {
          es: "CLI para abrir rápidamente flujos de trabajo con herramientas de IA desde macOS.",
          en: "CLI for quickly launching AI tool workflows from macOS.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/mac-brainroot-cli",
        category: { es: "Developer Tools", en: "Developer Tools" },
      },
      {
        name: "n8n-nodes-timed-buffer",
        description: {
          es: "Nodo comunitario de n8n que agrupa mensajes por tiempo usando Redis antes de emitirlos.",
          en: "Community n8n node that batches messages over time with Redis before emitting them.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/n8n-nodes-timed-buffer",
        category: { es: "Developer Tools", en: "Developer Tools" },
      },
      {
        name: "Scrapping-Repuestos-UY-API",
        description: {
          es: "API en NestJS para scraping de catálogos de repuestos con arquitectura híbrida por dominio: HTTP + parseo HTML/JSON-LD primero, Playwright solo como fallback. Quality gate central, migraciones versionadas y deploy en Railway.",
          en: "NestJS API for spare-parts catalog scraping with per-domain hybrid architecture: HTTP + HTML/JSON-LD parsing first, Playwright only as fallback. Central quality gate, versioned migrations, Railway deploy.",
        },
        year: "2025 – en curso",
        link: "https://github.com/FranprzDev/Scrapping-Repuestos-UY-API",
        category: { es: "IA y Automatización", en: "AI & Automation" },
      },
      {
        name: "FinalProject-DataEng",
        description: {
          es: "Modern Open Source Data Stack: arquitectura e integración de Apache Airflow, dbt, Great Expectations y Apache Superset sobre PostgreSQL.",
          en: "Modern Open Source Data Stack: architecture and integration of Apache Airflow, dbt, Great Expectations, and Apache Superset over PostgreSQL.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/FinalProject-DataEng",
        category: { es: "Data Engineering", en: "Data Engineering" },
      },
      {
        name: "Psichomatch",
        description: {
          es: "Proyecto seleccionado por el equipo de No Country para la siguiente etapa. Plataforma interactiva de matching y salud mental desarrollada en equipo multidisciplinario.",
          en: "Project selected by No Country staff for the next stage. Collaborative mental health and matching platform built in a multidisciplinary team.",
        },
        year: "2024",
        link: "https://github.com/FranprzDev/Psichomatch-No-Country-",
        highlight: { es: "Seleccionado No Country ★", en: "Selected No Country ★" },
        category: { es: "Prácticas y Simulación", en: "Practice & Simulation" },
      },
      {
        name: "GPozos",
        description: {
          es: "Juego 2D educativo e interactivo sobre planificación de inversiones en una red de agua potable (Delfín Gallo): asumís el rol de gerente de obras, elegís 3 tramos de tubería y el juego compara tu plan con el óptimo de un modelo de Programación Lineal.",
          en: "Educational 2D game about investment planning on a drinking-water network (Delfín Gallo): you play the works manager, pick 3 pipe segments, and the game compares your plan against a Linear Programming optimum.",
        },
        year: "2025",
        link: "https://pozos-delfingallo.vercel.app",
        category: { es: "Productos Web", en: "Web Products" },
      },
    ],
  },
  {
    slug: "university",
    name: "Educación",
    title: { es: "Educación & Formación", en: "Education & Degree" },
    tagline: {
      es: "Ingeniería en Sistemas — UTN-FRT y formación continua.",
      en: "Systems Engineering — UTN-FRT and continuous training.",
    },
    description: {
      es: "Mi base académica: Ingeniería en Sistemas de Información en la UTN-FRT (2022 – en curso) más certificaciones que complementan el perfil full-stack y data.",
      en: "My academic base: Information Systems Engineering at UTN-FRT (2022 – in progress) plus certifications that round out my full-stack and data profile.",
    },
    stack: ["UTN-FRT", "Ingeniería", "2022 – en curso"],
    year: "2022 – en curso",
    featured: true,
    planet: {
      body: "#3b2d6e",
      atmoA: "#8f7bff",
      atmoB: "#d4c9ff",
      radius: 1.02,
    },
    items: [
      {
        name: "Ingeniería en Sistemas de Información — UTN-FRT",
        description: {
          es: "Carrera de grado en la Universidad Tecnológica Nacional, Facultad Regional Tucumán. En curso desde 2022.",
          en: "Degree at Universidad Tecnológica Nacional, Tucumán. In progress since 2022.",
        },
        year: "2022 – en curso",
        category: { es: "Formación de Grado", en: "Degree Program" },
      },
      {
        name: "FullStack Developer (MERN)",
        description: {
          es: "RollingCode School — Noviembre 2022 a Septiembre 2023. Alumno Destacado.",
          en: "RollingCode School — November 2022 to September 2023. Outstanding Student.",
        },
        year: "2022 – 2023",
        highlight: { es: "Alumno Destacado ★", en: "Outstanding Student ★" },
        category: { es: "Certificaciones", en: "Certifications" },
      },
      {
        name: "React Avanzado",
        description: {
          es: "RollingCode School — Mayo a Septiembre 2024.",
          en: "RollingCode School — May to September 2024.",
        },
        year: "2024",
        category: { es: "Certificaciones", en: "Certifications" },
      },
      {
        name: "Next.js Avanzado",
        description: {
          es: "RollingCode School — Junio a Noviembre 2025.",
          en: "RollingCode School — June to November 2025.",
        },
        year: "2025",
        category: { es: "Certificaciones", en: "Certifications" },
      },
      {
        name: "Data Engineer",
        description: {
          es: "RollingCode School — Junio a Octubre 2025.",
          en: "RollingCode School — June to October 2025.",
        },
        year: "2025",
        category: { es: "Certificaciones", en: "Certifications" },
      },
      {
        name: "LaburandoAndo (MERN)",
        description: {
          es: "Portal de empleo full-stack con autenticación JWT, Passport, MongoDB y validación estricta de datos. Proyecto final integral de la carrera FullStack.",
          en: "Full-stack job portal with JWT authentication, Passport, MongoDB, and strict data validation. Capstone project of FullStack program.",
        },
        year: "2023",
        link: "https://github.com/FranprzDev/LaburandoAndo-Back",
        category: { es: "Proyectos RollingCode School", en: "RollingCode School Projects" },
      },
      {
        name: "FIRMS Fire Station Planner",
        description: {
          es: "Pipeline ETL y Data Engineering para procesamiento y análisis de datos de focos de incendios satelitales (MODIS, Airflow, dbt, PostgreSQL).",
          en: "ETL and Data Engineering pipeline for processing and analyzing satellite fire detection data (MODIS, Airflow, dbt, PostgreSQL).",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/firms-fire-station-planner",
        category: { es: "Proyectos RollingCode School", en: "RollingCode School Projects" },
      },
      {
        name: "DueMovie",
        description: {
          es: "Plataforma web interactiva para catálogo de películas y series con panel de administración CRUD.",
          en: "Interactive web platform for movie and series catalog with CRUD administration panel.",
        },
        year: "2023",
        link: "https://github.com/FranprzDev/DueMovie",
        category: { es: "Proyectos RollingCode School", en: "RollingCode School Projects" },
      },
      {
        name: "React Advanced Lab",
        description: {
          es: "Colección de desafíos técnicos y trabajos prácticos avanzados con React, componentes modulares y manipulación de datos tabulares.",
          en: "Technical challenges and advanced hands-on assignments with React, modular components, and tabular data manipulation.",
        },
        year: "2024",
        link: "https://github.com/FranprzDev/ReactAdvanced---Rolling",
        category: { es: "Proyectos RollingCode School", en: "RollingCode School Projects" },
      },
      {
        name: "AdHorarium",
        description: {
          es: "Planificador académico integral para carreras de UTN: gestión inteligente de correlativas, diagramación de horarios y cálculo de GPA.",
          en: "Comprehensive academic planner for UTN degrees: smart prerequisite tracking, schedule diagramming, and GPA calculation.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/AdHorarium",
        category: { es: "Proyectos Académicos UTN-FRT", en: "UTN-FRT Academic Projects" },
      },
      {
        name: "Simulador EcoATM Kiosk",
        description: {
          es: "Simulador de factibilidad económica y operativa de kioscos EcoATM con motor de simulación Monte Carlo propio. TFI Simulación.",
          en: "Operational and economic feasibility simulator for EcoATM kiosks with custom Monte Carlo engine. Simulation final project.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/Simulacion-TFI-Kiosk-EcoATM",
        category: { es: "Proyectos Académicos UTN-FRT", en: "UTN-FRT Academic Projects" },
      },
      {
        name: "SysPersonal Recursos Humanos",
        description: {
          es: "Sistema de gestión de personal y RRHH desarrollado con Next.js y Supabase. TFI Administración de Recursos.",
          en: "HR and personnel management system built with Next.js and Supabase. Resource Administration capstone.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/SysPersonal-AdmDeRecursos-4to-Anio-UTN",
        category: { es: "Proyectos Académicos UTN-FRT", en: "UTN-FRT Academic Projects" },
      },
      {
        name: "Hamming Step-by-Step",
        description: {
          es: "Simulador interactivo para el aprendizaje y visualización paso a paso de la codificación y corrección de errores con código Hamming. Comunicaciones.",
          en: "Interactive simulator for step-by-step learning and visualization of Hamming code error detection and correction. Communications.",
        },
        year: "2024",
        link: "https://github.com/FranprzDev/HammingStepByStep",
        category: { es: "Proyectos Académicos UTN-FRT", en: "UTN-FRT Academic Projects" },
      },
    ],
  },
];
