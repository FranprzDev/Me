import type { Localized } from "./cv";
import { WORLDS, type PlanetSpec } from "./worlds";

export type { PlanetSpec } from "./worlds";

/** Sub-proyecto dentro de un planeta (p.ej. cada Space Apps). */
export interface ProjectItem {
  name: string;
  description: Localized<string>;
  year: string;
  link?: string;
  /** Enlaces secundarios (repo, página del concurso) además de `link`. */
  extraLinks?: string[];
  highlight?: Localized<string>;
  category?: Localized<string>;
  /** One-line pitch shown on dense pages; `description` keeps the full copy. */
  pitch?: Localized<string>;
  /** Stack tags taken from the item's own copy or repository metadata. */
  stack?: string[];
  /** YouTube URL (watch or youtu.be) embedded lazily inside the entry. */
  video?: string;
}

export interface Project {
  /** Slug de la ruta del planeta (p.ej. "hackathons" → /hackathons). */
  slug: string;
  name: string;
  title?: Localized<string>;
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

type ProjectDetail = Omit<Project, "slug" | "name" | "title" | "planet">;

const DETAILS: Record<string, ProjectDetail> = {
  hackathons: {
    description: {
      es: "Espacios donde el tiempo, el equipo y el problema real mandan: desde NASA Space Apps (BeeAgro y ExoGames, ganador nacional 2024) hasta el hackathon n8n de Vortex IT y el Youth Hackathon 2025 de UNESCO.",
      en: "Spaces where time, team and a real problem matter: from NASA Space Apps (BeeAgro and national winner ExoGames 2024) to Vortex IT's n8n hackathon and UNESCO's Youth Hackathon 2025.",
    },
    stack: ["Teamwork", "Open Data", "Rapid Prototyping", "n8n"],
    year: "2023 – 2026",
    featured: true,
    items: [
      {
        name: "ExoGames — Marshall Arg",
        description: {
          es: "Proyecto ganador a nivel nacional del NASA Space Apps Challenge 2024.",
          en: "National winning project of the NASA Space Apps Challenge 2024.",
        },
        year: "2024",
        link: "https://github.com/FranprzDev/NASASpaceApp-Marshall-Arg",
        extraLinks: [
          "https://exogames.vercel.app",
          "https://www.cac.com.ar/noticias/la-hackaton-nasa-space-apps-challenge-2024-ya-tiene-sus-ganadores-y-menciones",
        ],
        highlight: { es: "Ganador Nacional", en: "National Winner" },
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
      {
        name: "Proofy — Superteam Argentina × Colosseum (Solana)",
        description: {
          es: "Octubre 2026, junto a Dylan como co-creador. Proofy convierte contratos de software en pagos por hito verificables en Solana: un agente de IA transforma el alcance acordado en escenarios de prueba y revisa cada entrega contra la evidencia de CI/CD, y un escrow en Anchor libera SOL por hito solo cuando esa evidencia se sostiene. Prototipo funcional en devnet, sin auditar.",
          en: "October 2026, with Dylan as co-creator. Proofy turns software contracts into verifiable milestone payments on Solana: an AI agent converts the agreed scope into test scenarios and checks each delivery against CI/CD evidence, and an Anchor escrow releases SOL per milestone only when that evidence holds. Working prototype on devnet, not audited.",
        },
        year: "2026",
        link: "https://proofyai.vercel.app",
        extraLinks: ["https://github.com/FranprzDev/Proofy", "https://colosseum.com/arena/projects/proofy-1"],
      },
      {
        name: "Contar con Datos 2026 — UdeSA × SSCyT Tucumán",
        description: {
          es: "Octubre 2026. Participación en la categoría Historia visual del concurso de visualización de datos: un video de 60 segundos sobre los incendios en Argentina hecho solo con datos abiertos (focos de calor VIIRS de NASA FIRMS, área quemada MODIS y Copernicus Sentinel-2), renderizado íntegramente en código. Sin resultado todavía.",
          en: "October 2026. Entry in the Visual Story category of the data-visualization contest: a 60-second data video on wildfires in Argentina built from open data only (NASA FIRMS VIIRS hotspots, MODIS burned area and Copernicus Sentinel-2), rendered entirely in code. No outcome yet.",
        },
        year: "2026",
        link: "https://github.com/FranprzDev/donde-arde-argentina",
        video: "https://youtu.be/MwW7YKrSNBU",
      },
    ],
  },
  teaching: {
    description: {
      es: "Espacios de formación práctica en desarrollo y automatización. El curso de n8n para el Poder Judicial de Tucumán es una de esas experiencias.",
      en: "Hands-on learning experiences in development and automation. The n8n course for the Tucumán Judiciary is one of them.",
    },
    stack: ["Mentorías", "Docencia", "n8n", "Automatización"],
    year: "2025",
    items: [
      {
        name: "Curso de Automatización de Procesos con n8n — Poder Judicial de Tucumán",
        description: {
          es: "Diseño e impartición de un curso de 10 clases (20 horas) para personal del Poder Judicial de Tucumán, con modelado de flujos, APIs y webhooks, automatización de tareas, RAG y Human-in-the-Loop.",
          en: "Designed and taught a 10-session (20-hour) course for Tucumán Judiciary staff, covering workflow modeling, APIs and webhooks, task automation, RAG and Human-in-the-Loop.",
        },
        year: "2025",
        category: { es: "Curso destacado", en: "Featured course" },
      },
      {
        name: "n8n-workflows-course",
        description: {
          es: "Workflows de las sesiones 2 a 10 del curso: el material práctico que construimos en vivo con el grupo.",
          en: "Session 2–10 workflows from the course: the hands-on material we built live with the group.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/n8n-workflows-course",
        category: { es: "Materiales del curso", en: "Course materials" },
      },
      {
        name: "n8n-curso-vivo",
        description: {
          es: "Repo vivo del curso con la sesión 9 y material de apoyo de las clases.",
          en: "Live course repo with session 9 and class support material.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/n8n-curso-vivo",
        category: { es: "Materiales del curso", en: "Course materials" },
      },
      {
        name: "platzi-hydratation-demo",
        description: {
          es: "Prueba técnica para Platzi: demo práctica de cómo funciona la hydration en React con Next.js (SSR, un error de hydration reproducible con contenido no determinista y su solución).",
          en: "Technical test for Platzi: a hands-on demo of how hydration works in React with Next.js (SSR, a reproducible hydration error with non-deterministic content, and its fix).",
        },
        year: "2026",
        link: "https://github.com/FranprzDev/platzi-hydratation-demo",
        category: { es: "Demos técnicas", en: "Technical demos" },
        stack: ["React", "Next.js", "SSR"],
      },
    ],
  },
  projects: {
    description: {
      es: "Una selección de herramientas que construí para resolver problemas concretos: automatización, agentes de IA, utilidades para desarrollo y productos web.",
      en: "A selection of tools I built to solve concrete problems: automation, AI agents, developer utilities and web products.",
    },
    stack: ["TypeScript", "IA", "Web", "Open Source"],
    year: "2023 – en curso",
    link: "https://github.com/FranprzDev?tab=repositories",
    items: [
      {
        name: "vibe-latex",
        description: {
          es: "Plugin de Obsidian que convierte dictado en español en Markdown y LaTeX: narrás una resolución paso a paso y queda escrita con sus ecuaciones, sin dictar un solo comando. Corre local y gratis (whisper.cpp con un modelo local que el plugin instala solo) o contra la API de OpenAI, y la corrección por voz trabaja sobre la selección o toda la última sesión de dictado.",
          en: "Obsidian plugin that turns Spanish dictation into Markdown and LaTeX: narrate a step-by-step solution and it lands written with its equations, without speaking a single command. Runs locally and free (whisper.cpp with a local model the plugin installs itself) or against the OpenAI API, and voice correction works over the selection or the whole last dictation session.",
        },
        year: "2026",
        link: "https://github.com/FranprzDev/vibe-latex",
        pitch: {
          es: "Plugin de Obsidian: dictás en español y escribe la resolución en Markdown y LaTeX, local y gratis o con OpenAI.",
          en: "Obsidian plugin: dictate in Spanish and it writes the solution in Markdown and LaTeX, local and free or via OpenAI.",
        },
        stack: ["TypeScript", "Obsidian", "whisper.cpp", "LLM"],
        category: { es: "IA y Automatización", en: "AI & Automation" },
      },
      {
        name: "ScopeProfit",
        description: {
          es: "Copiloto de alcance para freelancear, expuesto como servidor MCP: convierte la idea suelta de un cliente en un documento de alcance formal y versionado, con requisitos citados textualmente, preguntas bloqueantes, riesgos con semáforo y estimación en horas, exportable a Markdown, PDF y DOCX. Cualquier agente (ChatGPT, Claude, Cursor) lo maneja por MCP.",
          en: "Scope copilot for freelancing, exposed as an MCP server: turns a client's loose idea into a formal, versioned scope document with verbatim-quoted requirements, blocking questions, traffic-light risks and an hour estimate, exportable to Markdown, PDF and DOCX. Any agent (ChatGPT, Claude, Cursor) drives it over MCP.",
        },
        year: "2026",
        link: "https://github.com/FranprzDev/ScopeProfit",
        extraLinks: ["https://scope-profit-web.vercel.app"],
        pitch: {
          es: "Servidor MCP que convierte la idea suelta de un cliente en un documento de alcance formal, con estimación en horas y export a PDF/DOCX.",
          en: "MCP server that turns a client's loose idea into a formal scope document, with hour estimates and PDF/DOCX export.",
        },
        stack: ["NestJS", "MCP", "LangGraph", "PostgreSQL"],
        category: { es: "IA y Automatización", en: "AI & Automation" },
      },
      {
        name: "GeoArg",
        description: {
          es: "Servidor MCP de geodatos públicos de Argentina: descubre capas WFS, WMS y ArcGIS REST, consulta datos y geocodifica, con HTTP público y stdio local, solo lectura. Nació como GeoTucumán en la cursada de Sistemas de Información Geográfica.",
          en: "MCP server for Argentina's public geodata: discovers WFS, WMS and ArcGIS REST layers, queries data and geocodes, over public HTTP and local stdio, read-only. Born as GeoTucumán during the GIS course.",
        },
        year: "2026",
        link: "https://github.com/FranprzDev/geotucuman",
        extraLinks: ["https://franprzdev.github.io/geotucuman/"],
        pitch: {
          es: "MCP de geodatos públicos de Argentina: descubre capas WFS/WMS/ArcGIS REST, consulta y geocodifica, solo lectura.",
          en: "MCP for Argentina's public geodata: discovers WFS/WMS/ArcGIS REST layers, queries and geocodes, read-only.",
        },
        stack: ["TypeScript", "MCP", "GIS"],
        category: { es: "IA y Automatización", en: "AI & Automation" },
      },
      {
        name: "Reelsmith",
        description: {
          es: "Servidor MCP en un binario Rust local que convierte una carpeta de clips de gameplay en videos promo para Reels, TikTok o Shorts: tu asistente de IA escribe el brief, renderiza preview 360p, borrador 720p y final 1080p, y valida cada render (duración, loudness -14 LUFS, true peak, frames negros).",
          en: "MCP server in a single local Rust binary that turns a folder of gameplay clips into promo videos for Reels, TikTok or Shorts: your AI assistant writes the brief, renders a 360p preview, a 720p draft and the 1080p final, and QA-checks each render (duration, -14 LUFS loudness, true peak, black frames).",
        },
        year: "2026",
        link: "https://github.com/FranprzDev/reelsmith",
        pitch: {
          es: "MCP en Rust que renderiza videos promo a partir de clips, con QA automático de audio y frames.",
          en: "Rust MCP that renders promo videos from clips, with automatic audio and frame QA.",
        },
        stack: ["Rust", "MCP", "FFmpeg"],
        category: { es: "Developer Tools", en: "Developer Tools" },
      },
      {
        name: "Intérprete",
        description: {
          es: "Traductor simultáneo español ↔ inglés para Windows, gratis y 100% local (Rust): hablás en español y sale la traducción al inglés en pantalla y en voz, y lo que suena en inglés se lee en español en tiempo real. Pensado para llamadas en Zoom o Meet; el audio nunca sale de la PC.",
          en: "Simultaneous Spanish ↔ English translator for Windows, free and 100% local (Rust): speak Spanish and the English translation shows on screen and in voice; English audio reads back in Spanish in real time. Built for Zoom or Meet calls; audio never leaves the PC.",
        },
        year: "2026",
        link: "https://github.com/FranprzDev/interprete",
        pitch: {
          es: "Traductor simultáneo español ↔ inglés, local y gratis, para llamadas: el audio nunca sale de la PC.",
          en: "Simultaneous Spanish ↔ English translator, local and free, for calls: audio never leaves the PC.",
        },
        stack: ["Rust", "Desktop"],
        category: { es: "Developer Tools", en: "Developer Tools" },
      },
      {
        name: "apuntes-cli",
        description: {
          es: "CLI y servidor MCP para buscar en mis apuntes de la carrera (FranNotes) y generar FAQs y apuntes finales compactos por materia.",
          en: "CLI and MCP server to search my degree notes (FranNotes) and generate compact FAQs and final notes by subject.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/apuntes-cli",
        pitch: {
          es: "CLI/MCP que busca en mis apuntes (FranNotes) y genera FAQs y apuntes finales compactos por materia.",
          en: "CLI/MCP that searches my notes (FranNotes) and generates compact FAQs and final notes by subject.",
        },
        stack: ["Go", "CLI", "MCP"],
        category: { es: "Developer Tools", en: "Developer Tools" },
      },
      {
        name: "mac-brainroot-cli",
        description: {
          es: "CLI de macOS que levanta con un solo comando el entorno para programar con agentes de IA: abre el agente que elijas (Claude Code o Codex) junto al contenido de fondo que uses para trabajar.",
          en: "macOS CLI that spins up your AI-agent coding setup with one command: opens your agent of choice (Claude Code or Codex) plus the background content you like while working.",
        },
        year: "2025",
        link: "https://github.com/FranprzDev/mac-brainroot-cli",
        pitch: {
          es: "CLI de macOS que abre con un comando tu agente de IA (Claude Code o Codex) y el entorno para programar.",
          en: "macOS CLI that opens your AI agent (Claude Code or Codex) and coding setup with one command.",
        },
        stack: ["Python", "CLI", "macOS"],
        category: { es: "Developer Tools", en: "Developer Tools" },
      },
      {
        // Not Francisco's own package: the node and its npm release belong to
        // IAntropo; Francisco worked with its author to improve the buffer.
        name: "n8n-nodes-timed-buffer (contribución)",
        description: {
          es: "Contribución al nodo comunitario de n8n de IAntropo, que agrupa mensajes por tiempo usando Redis antes de emitirlos. Trabajé con su autor para mejorar el buffer.",
          en: "Contribution to IAntropo's community n8n node, which batches messages over time with Redis before emitting them. I worked with its author to improve the buffer.",
        },
        year: "2025",
        link: "https://www.npmjs.com/package/n8n-nodes-timed-buffer",
        pitch: {
          es: "Contribución al nodo comunitario de n8n de IAntropo que agrupa mensajes por tiempo con Redis.",
          en: "Contribution to IAntropo's community n8n node that batches messages over time with Redis.",
        },
        stack: ["JavaScript", "n8n", "Redis"],
        category: { es: "Contribuciones", en: "Contributions" },
      },
      {
        name: "Scrapping-Repuestos-UY-API",
        description: {
          es: "API en NestJS para scraping de catálogos de repuestos con arquitectura híbrida por dominio: HTTP + parseo HTML/JSON-LD primero, Playwright solo como fallback. Quality gate central, migraciones versionadas y deploy en Railway.",
          en: "NestJS API for spare-parts catalog scraping with per-domain hybrid architecture: HTTP + HTML/JSON-LD parsing first, Playwright only as fallback. Central quality gate, versioned migrations, Railway deploy.",
        },
        year: "2025 – en curso",
        link: "https://github.com/FranprzDev/Scrapping-Repuestos-UY-API",
        pitch: {
          es: "API de scraping de catálogos de repuestos: HTTP + HTML/JSON-LD primero, Playwright solo como fallback.",
          en: "Spare-parts catalog scraping API: HTTP + HTML/JSON-LD first, Playwright only as fallback.",
        },
        stack: ["NestJS", "TypeScript", "Playwright", "Railway"],
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
        pitch: {
          es: "Modern Open Source Data Stack integrado sobre PostgreSQL.",
          en: "Modern Open Source Data Stack integrated over PostgreSQL.",
        },
        stack: ["Airflow", "dbt", "Great Expectations", "Superset", "PostgreSQL"],
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
        highlight: { es: "Seleccionado No Country", en: "Selected No Country" },
        pitch: {
          es: "Plataforma de matching y salud mental hecha en equipo, seleccionada por No Country.",
          en: "Team-built mental health and matching platform, selected by No Country.",
        },
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
        pitch: {
          es: "Juego 2D educativo que compara tu plan de inversión en una red de agua con un óptimo de Programación Lineal.",
          en: "Educational 2D game that compares your water-network investment plan with a Linear Programming optimum.",
        },
        stack: ["Linear Programming"],
        category: { es: "Productos Web", en: "Web Products" },
      },
    ],
  },
  education: {
    description: {
      es: "Mi base académica: Ingeniería en Sistemas de Información en la UTN-FRT (2022 – en curso) más certificaciones que complementan el perfil full-stack, data e IA.",
      en: "My academic base: Information Systems Engineering at UTN-FRT (2022 – in progress) plus certifications that round out my full-stack, data and AI profile.",
    },
    stack: ["UTN-FRT", "Ingeniería", "2022 – en curso"],
    year: "2022 – en curso",
    featured: true,
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
        highlight: { es: "Alumno Destacado", en: "Outstanding Student" },
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
        name: "Google AI Essentials · Google Prompting Essentials",
        description: {
          es: "Google, vía Coursera — Septiembre a Octubre 2025. Certificados e insignias de Google.",
          en: "Google, via Coursera — September to October 2025. Certificates and Google badges.",
        },
        year: "2025",
        category: { es: "Certificaciones", en: "Certifications" },
      },
      {
        name: "OpenAI Academy — AI Foundations · Applied AI Foundations · Agents and Workflows",
        description: {
          es: "OpenAI Academy — Agosto a Septiembre 2026. Tres certificados.",
          en: "OpenAI Academy — August to September 2026. Three certificates.",
        },
        year: "2026",
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
        name: "CoNaIISI 2026 — Congreso Nacional de Ingeniería",
        description: {
          es: "Trabajo aceptado en CoNaIISI 2026 (Congreso Nacional de Ingeniería en Informática y Sistemas de Información, UTN Resistencia), categoría Trabajo de Cátedra: \"Planificar para abastecer: priorización de inversiones hídricas en Delfín Gallo\". Salimos al campo con la gente del CAPS y la SAT, proyectamos la demanda con validación RMSE y usamos optimización MILP con análisis de sensibilidad para decidir dónde invertir en la red de agua potable.",
          en: "Paper accepted at CoNaIISI 2026 (National Congress on Computer Science and Information Systems Engineering, UTN Resistencia), Undergraduate Course Work category: \"Planificar para abastecer: prioritizing water investment in Delfín Gallo\". Fieldwork with the local water cooperative and utility, RMSE-validated demand projection and MILP optimization with sensitivity analysis to decide where to invest in the drinking-water network.",
        },
        year: "2026",
        category: { es: "Proyectos Académicos UTN-FRT", en: "UTN-FRT Academic Projects" },
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
};

/**
 * Los planetas del portfolio: cada uno ES un proyecto y al clickearlo se
 * visita su ruta /{slug} con la información completa.
 */
export const PROJECTS: Project[] = WORLDS.map((world) => ({ ...world, ...DETAILS[world.slug] }));
