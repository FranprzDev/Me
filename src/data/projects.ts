import type { Localized } from "./cv";

export interface Project {
  name: string;
  tagline: Localized<string>;
  description: Localized<string>;
  stack: string[];
  year: string;
  link?: string;
  /** destacado visual */
  featured?: boolean;
}

/**
 * Proyectos y logros. Datos derivados del CV; los `link` quedan pendientes
 * de confirmar (reemplazar `undefined` por la URL real).
 */
export const PROJECTS: Project[] = [
  {
    name: "NASA Space Apps — Proyecto Ganador Nacional",
    tagline: {
      es: "Ganador nacional del hackathon de la NASA.",
      en: "National winner of NASA's hackathon.",
    },
    description: {
      es: "Proyecto ganador a nivel nacional en el NASA Space Apps Challenge (participación virtual desde Buenos Aires). Trabajo en equipo bajo presión, resolviendo un desafío real con datos abiertos.",
      en: "National winning project at the NASA Space Apps Challenge (virtual participation from Buenos Aires). Teamwork under pressure, solving a real challenge with open data.",
    },
    stack: ["Teamwork", "Open Data", "Rapid Prototyping"],
    year: "2024",
    featured: true,
  },
  {
    name: "UTN-FRT-MCP",
    tagline: {
      es: "Servidor MCP de apuntes para estudiantes de la UTN-FRT.",
      en: "MCP notes server for UTN-FRT students.",
    },
    description: {
      es: "Servidor MCP gratuito que expone mis apuntes de Ingeniería en Sistemas para consultarlos desde cualquier CLI compatible. Búsqueda full-text, listado por materia y entrega de contenido directo a la terminal.",
      en: "Free MCP server exposing my Information Systems notes to query from any compatible CLI. Full-text search, listing by subject and delivering content straight to the terminal.",
    },
    stack: ["MCP", "Next.js", "TypeScript", "Vercel"],
    year: "2025",
    featured: true,
  },
  {
    name: "Curso de Automatización con n8n — Poder Judicial de Tucumán",
    tagline: {
      es: "10 clases (20 h) de automatización para el Poder Judicial.",
      en: "10 sessions (20h) of automation for the Judiciary.",
    },
    description: {
      es: "Diseño e impartición de un curso completo de automatización de procesos con n8n: modelado de flujos, integración con APIs y webhooks, pipelines de RAG y automatizaciones Human-in-the-Loop.",
      en: "Designed and delivered a full process-automation course with n8n: flow modeling, API/webhook integration, RAG pipelines and Human-in-the-Loop automations.",
    },
    stack: ["n8n", "APIs", "Webhooks", "RAG"],
    year: "2025",
  },
  {
    name: "Digitalización — Fundación Líderes de Ansenuza",
    tagline: {
      es: "Transformación digital integral de una ONG.",
      en: "End-to-end digital transformation of an NGO.",
    },
    description: {
      es: "Liderazgo del proceso de digitalización: sitio web, presencia online y herramientas internas de gestión, para fortalecer el alcance de la fundación y llegar a nuevos donantes.",
      en: "Led the digital transformation: website, online presence and internal management tools, to strengthen the foundation's reach and attract new donors.",
    },
    stack: ["Web", "Gestión", "Estrategia digital"],
    year: "2025",
  },
];
