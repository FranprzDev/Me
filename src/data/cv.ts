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
  summary: Localized<string>;
  highlights: Highlight[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

export const CV: CV = {
  name: "Francisco Miguel Perez",
  title: {
    es: "Ing. en Sistemas de Información",
    en: "Information Systems Engineer",
  },
  location: {
    es: "Cruz Alta — Tucumán, Argentina",
    en: "Cruz Alta — Tucumán, Argentina",
  },
  timezone: "GMT-3",
  email: "franciscoperezdeveloper@gmail.com",
  linkedin: "https://linkedin.com/in/franprzdev",

  summary: {
    es: "Estudiante de Ingeniería en Sistemas de Información, con 3 años de experiencia en la industria y enfoque en el desarrollo de código limpio, robusto y escalable.",
    en: "Information Systems Engineering student with 3 years of industry experience and a focus on clean, robust and scalable code.",
  },

  highlights: [
    {
      title: "NASA Space Apps",
      detail: {
        es: "Proyecto Ganador Nacional — Hackathon en Buenos Aires (participación virtual).",
        en: "National Winning Project — Hackathon in Buenos Aires (virtual participation).",
      },
      year: "2024",
    },
    {
      title: "Hackathon n8n",
      detail: {
        es: "Presencial en Tucumán.",
        en: "On-site in Tucumán.",
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
        es: "Desempeño funciones de ingeniería de IA para una casa de repuestos digital en Uruguay, diseñando soluciones con modelos de lenguaje y flujos de agentes utilizando LangGraph para optimizar la atención a clientes y procesos internos. También realizo tareas de research y POC con nuevas herramientas de IA para mejorar continuamente los sistemas existentes.",
        en: "I perform AI engineering for a digital auto-parts company in Uruguay, designing solutions with language models and agent flows using LangGraph to optimize customer support and internal processes. I also do research and POCs with new AI tools to continuously improve existing systems.",
      },
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
    },
    {
      role: {
        es: "FullStack Developer / Analista Funcional",
        en: "FullStack Developer / Functional Analyst",
      },
      org: "RollingCode Studio",
      period: { es: "Octubre 2024 – Diciembre 2025", en: "October 2024 – December 2025" },
      start: "2024-10",
      current: false,
      description: {
        es: "Participé en el desarrollo de proyectos web completos, abordando frontend e integración con backend, aplicando metodologías ágiles con Scrum y Git Flow, y enfocándome en buenas prácticas para asegurar soluciones funcionales y escalables. Además, colaboré en la incorporación de n8n y en la investigación de automatizaciones dentro de los flujos de trabajo, así como en tareas de research y desarrollo de POC con herramientas de IA aplicadas al trabajo diario del equipo.",
        en: "Took part in building complete web projects, handling frontend and backend integration, applying agile methodologies with Scrum and Git Flow, and focusing on best practices to ensure functional and scalable solutions. I also helped introduce n8n and research automations within workflows, as well as research and POC development with AI tools applied to the team's daily work.",
      },
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
