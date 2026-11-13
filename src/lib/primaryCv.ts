import { cvPdfFile } from "@/content/cv/routes";
import { CvLocale, CvVariant } from "@/content/cv/types";
import type { Lang } from "@/data/cv";
import { cvDownloadUrl, cvDriveDownloadUrl } from "@/lib/cvDrive";

/**
 * The CV the site hands out by default (hero button, /me, MCP profile): the
 * Applied AI version in the visitor's language, from its always-public Google
 * Drive copy (the other versions keep the committed, content-versioned PDFs).
 * Lives outside src/content/cv so it never changes the CV source hash the
 * committed PDFs are checked against.
 */
export const PRIMARY_CV_VARIANT = CvVariant.AppliedAi;

/** CV locale matching the site language. */
export function cvLocaleForLang(lang: Lang): CvLocale {
  return lang === "es" ? CvLocale.Es : CvLocale.En;
}

/** URL the primary CV PDF downloads from for a CV locale (Drive copy when there is one). */
export function primaryCvPdfPath(locale: CvLocale): string {
  return cvDownloadUrl(PRIMARY_CV_VARIANT, locale);
}

/** File name the primary CV PDF downloads as, or null when Drive serves it (the browser ignores a cross-origin download name). */
export function primaryCvPdfFile(locale: CvLocale): string | null {
  return cvDriveDownloadUrl(PRIMARY_CV_VARIANT, locale) === null ? cvPdfFile(PRIMARY_CV_VARIANT, locale) : null;
}
