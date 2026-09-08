/**
 * CV de Francisco Miguel Perez — fuente de verdad ("constante gigante").
 * Bilingüe ES/EN. El sitio carga TODO el contenido del portfolio desde acá.
 * Idioma principal: español (es). Inglés (en) como alternativa.
 */

export type Lang = "es" | "en";

export type Localized<T> = Record<Lang, T>;

export interface ExperienceItem {
  role: Localized<string>;
  org: string;
  period: Localized<string>;
  /** ISO de inicio para ordenar */
  start: string;
  current: boolean;
  description: Localized<string>;
  stack?: string[];
}

export interface EducationItem {
  institution: string;
  degree: Localized<string>;
  period: Localized<string>;
}

export interface CertificationItem {
  school: string;
  name: Localized<string>;
  period: Localized<string>;
  highlight?: Localized<string>;
}

export interface Highlight {
  title: string;
  detail: Localized<string>;
  year: string;
}

export interface CV {
  name: string;
  title: Localized<string>;
  location: Localized<string>;
  timezone: string;
  email: string;
  linkedin: string;
  github: string;
  /** Número de WhatsApp en formato internacional sin signos (para wa.me). */
  whatsapp: string;
  /** Ruta pública del CV descargable. */
  cvPdf: string;
  summary: Localized<string>;
  highlights: Highlight[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

export const CV: CV = {
    name: "Francisco Perez",
  title: {
    es: "Ing. en Sistemas de Información",
    en: "Information Systems Engineer",
  },
  location: {
    es: "Tucumán, Argentina",
    en: "Tucumán, Argentina",
  },
  timezone: "GMT-3",
  email: "franciscoperezdeveloper@gmail.com",
  linkedin: "https://linkedin.com/in/franprzdev",
  github: "https://github.com/FranprzDev",
  whatsapp: "5493815412480",
  cvPdf: "/cv/FranciscoPerez-AIEngineer.pdf",

  summary: {
    es: "Estudiante avanzado de Ingeniería en Sistemas de Información con casi 3 años de experiencia en industria. Evolucioné de full-stack a diseñar soluciones de IA aplicada y automatizaciones: sistemas multi-agente, pipelines RAG y workflows que eliminan trabajo repetitivo. Aporto criterio de producto y pensamiento estratégico, además de experiencia liderando cursos técnicos.",
    en: "Final-year Information Systems Engineering student with nearly three years of industry experience building clean, scalable systems. Evolved from full-stack into applied AI: multi-agent systems, RAG pipelines and workflow automation. Strong product sense and strategic thinking, plus proven experience leading technical courses.",
  },

  highlights: [
    {
      title: "NASA Space Apps",
      detail: {
        es: "Proyecto Ganador Nacional 2024 — Hackathon en Buenos Aires (participación virtual). Competidor nacional 2025.",
        en: "National Winning Project 2024 — Hackathon in Buenos Aires (virtual). National competitor 2025.",
      },
      year: "2024 – 2025",
    },
    {
      title: "Hackathon n8n — Vortex",
      detail: {
        es: "Competidor presencial en Tucumán.",
        en: "On-site competitor in Tucumán.",
      },
      year: "2025",
    },
  ],

  experience: [
    {
      role: { es: "AI Engineer", en: "AI Engineer" },
      org: "RepuestoShop",
      period: { es: "Diciembre 2025 – Presente", en: "December 2025 – Present" },
      start: "2025-12",
      current: true,
      description: {
        es: "Diseño y despliego sistemas multi-agente y pipelines RAG a medida con LangChain, LangGraph y otras herramientas, con foco en agent harness, tool calling y control de contexto. Construyo herramientas internas con Meta APIs y pipelines de scraping para grounding de datos. Muy hands-on: investigo tech nuevo, comparo modelos y entrego POCs sólidos listos para producción.",
        en: "Architect and deploy multi-agent systems and custom RAG pipelines with LangChain, LangGraph and other tools, focused on agent harness engineering, tool calling and context control. Build internal tools with Meta APIs and scraping pipelines for data grounding. Hands-on: research unfamiliar tech, benchmark models and ship production-ready POCs fast.",
      },
      stack: ["LangChain", "LangGraph", "Multi-Agent", "RAG", "Web Scraping", "Meta APIs"],
    },
    {
      role: {
        es: "Docente — Curso de Automatización de Procesos con n8n (Poder Judicial de Tucumán)",
        en: "Instructor — Process Automation Course with n8n (Tucumán Judiciary)",
      },
      org: "Poder Judicial de Tucumán",
      period: { es: "Septiembre 2025 – Octubre 2025", en: "September 2025 – October 2025" },
      start: "2025-09",
      current: false,
      description: {
        es: "Diseño e impartición de un curso de 10 clases (20 horas) sobre automatización de procesos con n8n para personal del Poder Judicial de Tucumán, utilizando materiales propios, demostraciones en vivo y clases de consulta, con foco en modelado de flujos, integración mediante APIs y webhooks, reducción de tareas rutinarias, buenas prácticas de automatización, pipelines de RAG y automatizaciones del tipo Human in the Loop.",
        en: "Designed and delivered a 10-session (20-hour) course on process automation with n8n for staff of the Tucumán Judiciary, using my own materials, live demos and Q&A sessions, focusing on flow modeling, API and webhook integration, routine-task reduction, automation best practices, RAG pipelines and Human-in-the-Loop automations.",
      },
      stack: ["n8n", "RAG Pipelines", "APIs & Webhooks", "Automation", "Human-in-the-Loop"],
    },
    {
      role: { es: "FullStack Developer", en: "FullStack Developer" },
      org: "Fundación Líderes de Ansenuza",
      period: { es: "Abril 2025 – Presente", en: "April 2025 – Present" },
      start: "2025-04",
      current: true,
      description: {
        es: "Voluntario en la Fundación, donde lidero el proceso de digitalización integral de la organización, abarcando sitio web, presencia online y herramientas internas de gestión. Este trabajo busca fortalecer la presencia de FLA, optimizar sus canales digitales para llegar a nuevos donantes y aumentar el impacto de sus acciones en todo el territorio argentino y a nivel internacional.",
        en: "Volunteer at the Foundation, where I lead the organization's full digital transformation, covering website, online presence and internal management tools. This work aims to strengthen FLA's presence, optimize its digital channels to reach new donors and increase the impact of its actions across Argentina and internationally.",
      },
      stack: ["Next.js", "FullStack", "Web Development", "Cloud Architecture"],
    },
    {
      role: {
        es: "Product Engineer",
        en: "Product Engineer",
      },
      org: "RollingCode Studio",
      period: { es: "Octubre 2024 – Diciembre 2025", en: "October 2024 – December 2025" },
      start: "2024-10",
      current: false,
      description: {
        es: "Participé en el desarrollo de proyectos web completos, abordando frontend e integración con backend, aplicando metodologías ágiles con Scrum y Git Flow, y enfocándome en buenas prácticas para asegurar soluciones funcionales y escalables. Además, colaboré en la incorporación de n8n y en la investigación de automatizaciones dentro de los flujos de trabajo, así como en tareas de research y desarrollo de POC con herramientas de IA aplicadas al trabajo diario del equipo.",
        en: "Took part in building complete web projects, handling frontend and backend integration, applying agile methodologies with Scrum and Git Flow, and focusing on best practices to ensure functional and scalable solutions. I also helped introduce n8n and research automations within workflows, as well as research and POC development with AI tools applied to the team's daily work.",
      },
      stack: ["Scrum", "Git Flow", "n8n", "AI PoCs", "React", "Node.js"],
    },
    {
      role: {
        es: "Tutor Desarrollo Web & BackEnd Avanzado",
        en: "Web & Advanced BackEnd Development Tutor",
      },
      org: "Rolling Code School",
      period: { es: "Noviembre 2023 – Agosto 2024", en: "November 2023 – August 2024" },
      start: "2023-11",
      current: false,
      description: {
        es: "Durante las clases acompañé a los mentores, compartiendo experiencias y promoviendo el aprendizaje activo de los alumnos, con foco en la participación, el desarrollo práctico y la construcción de un entorno de trabajo colaborativo.",
        en: "During classes I supported the mentors, sharing experiences and promoting students' active learning, focusing on participation, hands-on development and building a collaborative work environment.",
      },
      stack: ["Mentorship", "JavaScript", "MERN Stack", "Backend Architecture"],
    },
  ],

  education: [
    {
      institution: "Universidad Tecnológica Nacional (UTN-FRT)",
      degree: {
        es: "Ingeniería en Sistemas de Información",
        en: "Information Systems Engineering",
      },
      period: { es: "2022 – En curso", en: "2022 – In progress" },
    },
  ],

  certifications: [
    {
      school: "RollingCode School",
      name: { es: "FullStack Developer (MERN)", en: "FullStack Developer (MERN)" },
      period: { es: "Noviembre 2022 – Septiembre 2023", en: "November 2022 – September 2023" },
      highlight: { es: "Alumno Destacado", en: "Outstanding Student" },
    },
    {
      school: "RollingCode School",
      name: { es: "React Avanzado", en: "Advanced React" },
      period: { es: "Mayo 2024 – Septiembre 2024", en: "May 2024 – September 2024" },
    },
    {
      school: "RollingCode School",
      name: { es: "Next.js Avanzado", en: "Advanced Next.js" },
      period: { es: "Junio 2025 – Noviembre 2025", en: "June 2025 – November 2025" },
    },
    {
      school: "RollingCode School",
      name: { es: "Data Engineer", en: "Data Engineer" },
      period: { es: "Junio 2025 – Octubre 2025", en: "June 2025 – October 2025" },
    },
  ],
};
