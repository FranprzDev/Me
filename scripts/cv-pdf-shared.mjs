import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** Variants and locales served under /cv and /es/cv (mirrors src/content/cv/types.ts). */
export const CV_VARIANTS = ["fde", "fullstack", "frontend", "backend", "applied-ai"];
export const CV_LOCALES = ["en", "es"];

export const PDF_DIR = "public/cv/files";
export const MANIFEST = `${PDF_DIR}/manifest.json`;

export function cvRoute(variant, locale) {
  return `${locale === "es" ? "/es" : ""}/cv/${variant}`;
}

/** Mirrors cvPdfPath() in src/content/cv/routes.ts. */
export function cvPdfFile(variant, locale) {
  return `francisco-perez-cv-${variant}-${locale}.pdf`;
}

/** Everything the PDFs are rendered from: résumé content and the résumé components. */
const SOURCE_DIRS = ["src/content/cv", "src/components/cv"];

/** Hash of the CV sources, recorded next to the PDFs so a stale PDF fails the checks. */
export async function cvSourceHash() {
  const hash = createHash("sha256");
  for (const dir of SOURCE_DIRS) {
    const names = (await readdir(dir)).sort();
    for (const name of names) {
      hash.update(`${dir}/${name}\n`);
      hash.update(await readFile(path.join(dir, name)));
    }
  }
  return hash.digest("hex");
}

/** Page count of a Chromium-generated PDF. */
export function pdfPageCount(bytes) {
  return (bytes.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}
