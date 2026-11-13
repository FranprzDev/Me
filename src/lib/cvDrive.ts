import { cvPdfPath } from "@/content/cv/routes";
import { CvLocale, CvVariant } from "@/content/cv/types";

/**
 * CVs Francisco keeps as always-public files in his Google Drive (anyone with
 * the link can download). These versions download straight from Drive, so the
 * portfolio always hands out the current copy; every other version keeps the
 * committed, content-versioned PDF.
 *
 * Drive file IDs of the public copies (AI Engineer = the Applied AI version):
 * - Applied AI ES: Francisco_Perez_CV_AI_Engineer.pdf
 * - Applied AI EN: Francisco_Perez_CV_AI_Engineer_EN.pdf
 * - Full-Stack ES: Francisco_Perez_CV_Full_Stack_ES.pdf
 * - Full-Stack EN: Francisco_Perez_CV_Full_Stack_EN.pdf
 */
const CV_DRIVE_FILE_IDS: Partial<Record<CvVariant, Record<CvLocale, string>>> = {
  [CvVariant.AppliedAi]: {
    [CvLocale.Es]: "1PJFz6_0Z-OhBgkXFjEWBrxR6bueJo4rD",
    [CvLocale.En]: "1jB3iZDumz3xgm8SLq9XGe1u5ds8MRFsa",
  },
  [CvVariant.Fullstack]: {
    [CvLocale.Es]: "1yzklUrQuPkEPxcP7bjUkfkFIQHI1rqiB",
    [CvLocale.En]: "1cAeo1cRaOStrygmyNJSvLD0ybMFNyG9n",
  },
};

/**
 * Direct-download URL of the public Drive copy, or null when the version only
 * exists as a committed PDF. Drive answers with Content-Disposition:
 * attachment and the file's own name, so no `download` attribute is needed
 * (the browser ignores it cross-origin anyway).
 */
export function cvDriveDownloadUrl(variant: CvVariant, locale: CvLocale): string | null {
  const id = CV_DRIVE_FILE_IDS[variant]?.[locale];
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
}

/** Where a version's PDF downloads from: the public Drive copy when there is one, else the committed versioned PDF. */
export function cvDownloadUrl(variant: CvVariant, locale: CvLocale): string {
  return cvDriveDownloadUrl(variant, locale) ?? cvPdfPath(variant, locale);
}
