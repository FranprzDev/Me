import pdfManifest from "../../../public/cv/files/manifest.json";
import { CvLocale, CvVariant } from "./types";

/*
 * URL helpers for the CV routes. Kept free of résumé content so client code
 * (the language provider, the site chrome, the nav) can import them cheaply.
 */

/** Every variant, in index / switcher order. */
export const CV_VARIANTS: CvVariant[] = Object.values(CvVariant);

export const CV_LOCALES: CvLocale[] = Object.values(CvLocale);

export function isCvVariant(value: string): value is CvVariant {
  return CV_VARIANTS.some((variant) => variant === value);
}

/** English lives at the root, Spanish under /es. */
function localePrefix(locale: CvLocale): string {
  return locale === CvLocale.Es ? "/es" : "";
}

export function cvIndexPath(locale: CvLocale): string {
  return `${localePrefix(locale)}/cv`;
}

export function cvPath(variant: CvVariant, locale: CvLocale): string {
  return `${cvIndexPath(locale)}/${variant}`;
}

/** File name of the committed PDF; also the name a download is saved under. */
export function cvPdfFile(variant: CvVariant, locale: CvLocale): string {
  return `francisco-perez-cv-${variant}-${locale}.pdf`;
}

type CvPdfManifestEntry = { route: string; file: string; pages: number; version: string };

const PDF_ENTRIES: CvPdfManifestEntry[] = pdfManifest.files;

/**
 * Committed PDF rendered from the page by `pnpm cv:pdf`, versioned with the
 * content hash `pnpm cv:pdf` records for that file in the manifest. Every
 * regeneration changes the URL, so no browser or CDN can hand out an old CV.
 */
export function cvPdfPath(variant: CvVariant, locale: CvLocale): string {
  const file = cvPdfFile(variant, locale);
  const entry = PDF_ENTRIES.find((item) => item.file === file);
  if (!entry) throw new Error(`${file} is missing from public/cv/files/manifest.json: run \`pnpm cv:pdf\``);
  return `/cv/files/${file}?v=${entry.version}`;
}

/** Locale a CV route is written in, or null when the path is not a CV route. */
export function cvLocaleForPath(pathname: string | null): CvLocale | null {
  if (!pathname) return null;
  if (pathname === "/es/cv" || pathname.startsWith("/es/cv/")) return CvLocale.Es;
  if (pathname === "/cv" || pathname.startsWith("/cv/")) return CvLocale.En;
  return null;
}

export function otherLocale(locale: CvLocale): CvLocale {
  return locale === CvLocale.En ? CvLocale.Es : CvLocale.En;
}

/** The same CV page in the other language, or null when the path is not a CV route. */
export function cvCounterpartPath(pathname: string | null): string | null {
  const locale = cvLocaleForPath(pathname);
  if (locale === null || pathname === null) return null;
  return locale === CvLocale.Es ? pathname.replace(/^\/es/, "") : `/es${pathname}`;
}
