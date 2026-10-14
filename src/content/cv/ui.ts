import { CvLocale } from "./types";

/** Screen-only chrome around the résumé (never printed). */
export const CV_UI = {
  backHome: { [CvLocale.En]: "← Portfolio", [CvLocale.Es]: "← Portfolio" },
  backHomeLabel: { [CvLocale.En]: "Back to the portfolio", [CvLocale.Es]: "Volver al portfolio" },
  versions: { [CvLocale.En]: "Résumé versions", [CvLocale.Es]: "Versiones del CV" },
  allVersions: { [CvLocale.En]: "All versions", [CvLocale.Es]: "Todas las versiones" },
  download: { [CvLocale.En]: "Download PDF", [CvLocale.Es]: "Descargar PDF" },
  pdfBadge: { [CvLocale.En]: "PDF · A4", [CvLocale.Es]: "PDF · A4" },
  indexTitle: { [CvLocale.En]: "Résumés", [CvLocale.Es]: "Currículums" },
  indexIntro: {
    [CvLocale.En]:
      "The same experience, ordered for five kinds of role. Each one reads on the web, prints cleanly and downloads as a PDF.",
    [CvLocale.Es]:
      "La misma experiencia, ordenada para cinco tipos de puesto. Cada versión se lee en la web, se imprime prolija y se descarga en PDF.",
  },
  read: { [CvLocale.En]: "Read", [CvLocale.Es]: "Ver" },
  pdfShort: { [CvLocale.En]: "PDF", [CvLocale.Es]: "PDF" },
  cvWord: { [CvLocale.En]: "Résumé", [CvLocale.Es]: "CV" },
} satisfies Record<string, Record<CvLocale, string>>;
