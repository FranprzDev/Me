import { CvLocale } from "./types";

/** Screen-only chrome around the CV (never printed). */
export const CV_UI = {
  backHome: { [CvLocale.En]: "← Portfolio", [CvLocale.Es]: "← Portfolio" },
  backHomeLabel: { [CvLocale.En]: "Back to the portfolio", [CvLocale.Es]: "Volver al portfolio" },
  versions: { [CvLocale.En]: "CV versions", [CvLocale.Es]: "Versiones del CV" },
  allVersions: { [CvLocale.En]: "All versions", [CvLocale.Es]: "Todas las versiones" },
  download: { [CvLocale.En]: "Download PDF", [CvLocale.Es]: "Descargar PDF" },
  pdfBadge: { [CvLocale.En]: "PDF · A4", [CvLocale.Es]: "PDF · A4" },
  indexTitle: { [CvLocale.En]: "Curriculum Vitae", [CvLocale.Es]: "Currículums" },
  indexIntro: {
    [CvLocale.En]:
      "The same experience, ordered for five kinds of role. Pick a version to download its one-page PDF.",
    [CvLocale.Es]:
      "La misma experiencia, ordenada para cinco tipos de puesto. Elegí una versión para descargar su PDF de una página.",
  },
  cvWord: { [CvLocale.En]: "CV", [CvLocale.Es]: "CV" },
} satisfies Record<string, Record<CvLocale, string>>;

/** Accessible name of an index card, which downloads that version's PDF. */
export function cvDownloadLabel(label: string, locale: CvLocale): string {
  switch (locale) {
    case CvLocale.En:
      return `Download ${label} CV (PDF)`;
    case CvLocale.Es:
      return `Descargar el CV ${label} (PDF)`;
  }
}
