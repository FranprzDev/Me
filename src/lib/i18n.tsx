"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "@/data/cv";

type Dict = Record<Lang, string>;

/** Strings de UI (el contenido real vive en data/cv.ts y notes-index.json). */
const UI = {
  nav_about: { es: "Sobre mí", en: "About" },
  nav_experience: { es: "Experiencia", en: "Experience" },
  nav_education: { es: "Educación", en: "Education" },
  nav_mcp: { es: "UTN-FRT-MCP", en: "UTN-FRT-MCP" },
  nav_projects: { es: "Proyectos", en: "Projects" },
  nav_contact: { es: "Contacto", en: "Contact" },

  hero_cta_mcp: { es: "Conecta mi cerebro", en: "Connect my brain" },

  about_title: { es: "Sobre mí", en: "About me" },

  exp_title: { es: "Experiencia profesional", en: "Professional experience" },
  exp_present: { es: "Presente", en: "Present" },

  edu_title: { es: "Educación", en: "Education" },
  edu_certs: { es: "Certificaciones", en: "Certifications" },
  edu_highlights: { es: "Participaciones destacadas", en: "Highlights" },

  mcp_title: { es: "Presentando el UTN-FRT-MCP", en: "Introducing the UTN-FRT-MCP" },
  mcp_subtitle: {
    es: "Mis apuntes de la UTN-FRT, accesibles desde tu propia CLI. Sin descargas, sin vueltas.",
    en: "My UTN-FRT notes, accessible from your own CLI. No downloads, no hassle.",
  },
  mcp_desc: {
    es: "Un servidor MCP gratuito que cualquier estudiante de Ingeniería en Sistemas puede conectar a su asistente (Claude Code, Cursor, etc.) para consultar apuntes al instante: buscar por tema, listar materias y traer el contenido directo a la terminal.",
    en: "A free MCP server any Information Systems student can connect to their assistant (Claude Code, Cursor, etc.) to query notes instantly: search by topic, list subjects and pull content straight to the terminal.",
  },
  mcp_how: { es: "Cómo conectarlo", en: "How to connect" },
  mcp_tools: { es: "Herramientas disponibles", en: "Available tools" },
  mcp_browse: { es: "Explorar materias", en: "Browse subjects" },
  mcp_stat_levels: { es: "Niveles", en: "Levels" },
  mcp_stat_subjects: { es: "Materias", en: "Subjects" },
  mcp_stat_notes: { es: "Apuntes", en: "Notes" },

  proj_title: { es: "Proyectos & logros", en: "Projects & achievements" },

  contact_title: { es: "Hablemos", en: "Let's talk" },
  contact_subtitle: {
    es: "Un proyecto, una charla o simplemente saludar? Estoy a un mensaje.",
    en: "A project, a talk, or just to say hi? I'm one message away.",
  },

  footer_built: { es: "Hecho con", en: "Built with" },
  footer_journey: { es: "Un viaje de tres mundos", en: "A journey of three worlds" },
} satisfies Record<string, Dict>;

type UiKey = keyof typeof UI;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: UiKey) => string;
  tl: <T>(value: Record<Lang, T>) => T;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = window.localStorage.getItem("lang") as Lang | null;
    if (saved === "es" || saved === "en") {
      // Restaurar idioma guardado tras montar (no disponible en SSR).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("lang", l);
  };

  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "es" ? "en" : "es"),
      t: (key) => UI[key][lang],
      tl: (value) => value[lang],
    }),
    [lang]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
