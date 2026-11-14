import { cvPdfPath } from "@/content/cv/routes";
import { CvLocale, CvVariant } from "@/content/cv/types";

/**
 * Every CV version downloads from the committed, content-versioned PDF in
 * public/cv/files: a Drive link makes the visitor sign in to Google first, so
 * no version hands one out. The map stays so a public Drive copy can come
 * back for a version that needs it.
 */
const CV_DRIVE_FILE_IDS: Partial<Record<CvVariant, Record<CvLocale, string>>> = {};

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
