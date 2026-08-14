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

/** Strings de UI (el contenido real vive en data/cv.ts y data/projects.ts). */
const UI = {
  nav_experience: { es: "Experiencia", en: "Experience" },
  nav_education: { es: "Educación", en: "Education" },
  nav_projects: { es: "Proyectos", en: "Projects" },
  nav_contact: { es: "Contacto", en: "Contact" },

  hero_cta_projects: { es: "Ver proyectos", en: "See projects" },

  exp_title: { es: "Experiencia profesional", en: "Professional experience" },
  exp_present: { es: "Presente", en: "Present" },

  edu_title: { es: "Educación", en: "Education" },
  edu_certs: { es: "Certificaciones", en: "Certifications" },
  edu_highlights: { es: "Participaciones destacadas", en: "Highlights" },

  proj_title: { es: "Proyectos & logros", en: "Projects & achievements" },

  contact_title: { es: "Charlemos", en: "Let's chat" },
  contact_subtitle: {
    es: "¿Un proyecto, una propuesta, o alguna duda? Escribime :)",
    en: "A project, a proposal, or a question? Drop me a line :)",
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

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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
