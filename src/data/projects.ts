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
}

export interface Project {
  /** Slug de la ruta del planeta (p.ej. "hackathons" → /hackathons). */
  slug: string;
  name: string;
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
 * TODO(francisco): confirmar links faltantes.
 */
export const PROJECTS: Project[] = [
  {
    slug: "hackathons",
    name: "Hackathones",
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
          es: "Tecnología al servicio de la apicultura. Nuestra primera participación en Space Apps.",
          en: "Technology for beekeeping. Our first Space Apps participation.",
        },
        year: "2023",
        link: "https://github.com/FranprzDev/BeeAgro-Spanish",
      },
      {
        name: "Hackathon n8n — Vortex IT",
        description: {
          es: "Hackathon enfocado en automatización y workflows con n8n.",
          en: "Hackathon focused on automation and workflows with n8n.",
        },
        year: "2025",
        // TODO(francisco): agregar repo/link cuando esté público
      },
      {
        name: "Youth Hackathon 2025 — UNESCO",
        description: {
          es: "Participación en el hackathon joven de UNESCO 2025.",
          en: "Participation in UNESCO Youth Hackathon 2025.",
        },
        year: "2025",
        // TODO(francisco): agregar repo/link cuando esté público
      },
    ],
  },
  {
    slug: "curso-n8n",
    name: "Curso de Automatización con n8n",
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
  },
  {
    slug: "projects",
    name: "Proyectos Personales",
    tagline: {
      es: "Colección de proyectos, experimentos y herramientas.",
      en: "Collection of projects, experiments and tools.",
    },
    description: {
      es: "Un compendio de proyectos propios y colaborativos: CLIs, automatizaciones y productos web que nacieron como experimentos y se volvieron herramientas diarias.",
      en: "A compendium of personal and collaborative builds: CLIs, automations and web products that started as experiments and became everyday tools.",
    },
    stack: ["CLI", "Developer Tools", "Web"],
    year: "En curso",
    planet: {
      body: "#1f4a66",
      atmoA: "#4fc3f7",
      atmoB: "#c5ecff",
      radius: 0.88,
    },
  },
  {
    slug: "university",
    name: "Educación",
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
      },
      {
        name: "FullStack Developer (MERN)",
        description: {
          es: "RollingCode School — Noviembre 2022 a Septiembre 2023. Alumno Destacado.",
          en: "RollingCode School — November 2022 to September 2023. Outstanding Student.",
        },
        year: "2022 – 2023",
        highlight: { es: "Alumno Destacado ★", en: "Outstanding Student ★" },
      },
      {
        name: "React Avanzado",
        description: {
          es: "RollingCode School — Mayo a Septiembre 2024.",
          en: "RollingCode School — May to September 2024.",
        },
        year: "2024",
      },
      {
        name: "Next.js Avanzado",
        description: {
          es: "RollingCode School — Junio a Noviembre 2025.",
          en: "RollingCode School — June to November 2025.",
        },
        year: "2025",
      },
      {
        name: "Data Engineer",
        description: {
          es: "RollingCode School — Junio a Octubre 2025.",
          en: "RollingCode School — June to October 2025.",
        },
        year: "2025",
      },
    ],
  },
];
