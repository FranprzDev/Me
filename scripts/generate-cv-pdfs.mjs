import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { CV_LOCALES, CV_VARIANTS, MANIFEST, PDF_DIR, cvPdfFile, cvRoute, cvSourceHash, pdfPageCount } from "./cv-pdf-shared.mjs";

/**
 * Renders every /cv page to the PDF behind its "Download PDF" button.
 *
 * Run against a production server after changing anything in src/content/cv
 * or src/components/cv, then commit public/cv/files:
 *
 *   pnpm build && pnpm start &
 *   PORTFOLIO_URL=http://localhost:3000 pnpm cv:pdf
 *
 * The PDFs are committed instead of generated during `next build` because
 * the build (Vercel) has no browser; check:portfolio fails when the recorded
 * source hash no longer matches, so a stale PDF cannot ship unnoticed.
 */
const baseURL = (process.env.PORTFOLIO_URL || "http://localhost:3000").replace(/\/$/, "");
/** Every résumé is one A4 page (Francisco's rule): a longer render fails the run. */
const MAX_PAGES = 1;

async function main() {
  await mkdir(PDF_DIR, { recursive: true });
  const browser = await chromium.launch();
  const files = [];
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    for (const locale of CV_LOCALES) {
      for (const variant of CV_VARIANTS) {
        const route = cvRoute(variant, locale);
        const response = await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
        assert.equal(response?.status(), 200, route);
        await page.emulateMedia({ media: "print" });
        // The print families are not preloaded (screen never uses them): load
        // every declared face before rendering so the PDF never falls back.
        await page.evaluate(async () => {
          // allSettled: the local() fallback faces next/font declares may not exist here.
          await Promise.allSettled(Array.from(document.fonts, (face) => face.load()));
          await document.fonts.ready;
        });
        const file = cvPdfFile(variant, locale);
        await page.pdf({ path: `${PDF_DIR}/${file}`, format: "A4", printBackground: true, preferCSSPageSize: true });
        await page.emulateMedia({ media: "screen" });
        const pages = pdfPageCount(await readFile(`${PDF_DIR}/${file}`));
        assert.ok(pages >= 1 && pages <= MAX_PAGES, `${route}: ${pages} pages (max ${MAX_PAGES})`);
        files.push({ route, file, pages });
        console.log(`PDF ${route} -> ${PDF_DIR}/${file} (${pages} page${pages === 1 ? "" : "s"})`);
      }
    }
  } finally {
    await browser.close();
  }
  await writeFile(MANIFEST, `${JSON.stringify({ sourceHash: await cvSourceHash(), files }, null, 2)}\n`);
  console.log(`Wrote ${MANIFEST}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
