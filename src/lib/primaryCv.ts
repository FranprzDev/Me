import { cvPdfFile, cvPdfPath } from "@/content/cv/routes";
import { CvLocale, CvVariant } from "@/content/cv/types";
import type { Lang } from "@/data/cv";

/**
 * The CV the site hands out by default (hero button, /me, MCP profile): the
 * generated Applied AI version in the visitor's language, at its current
 * manifest version. Lives outside src/content/cv so it never changes the CV
 * source hash the committed PDFs are checked against.
 */
export const PRIMARY_CV_VARIANT = CvVariant.AppliedAi;

/** CV locale matching the site language. */
export function cvLocaleForLang(lang: Lang): CvLocale {
  return lang === "es" ? CvLocale.Es : CvLocale.En;
}

/** Versioned URL of the primary CV PDF for a CV locale. */
export function primaryCvPdfPath(locale: CvLocale): string {
  return cvPdfPath(PRIMARY_CV_VARIANT, locale);
}

/** File name the primary CV PDF downloads as. */
export function primaryCvPdfFile(locale: CvLocale): string {
  return cvPdfFile(PRIMARY_CV_VARIANT, locale);
}
