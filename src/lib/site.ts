/**
 * Public origin of the portfolio: the one place that names the production
 * domain. Canonical URLs, Open Graph images (`metadataBase`), robots, the
 * sitemap, the Person JSON-LD, the agent prompts and the URL printed on the CV
 * all read it, so moving to another domain (e.g. https://franprz.tech once it
 * serves the site) is a one-line change here plus `pnpm cv:pdf`.
 *
 * Kept as a code constant on purpose (not only an env var): the CV PDFs are
 * committed and print this URL, so it must not depend on the build host. A
 * preview or a fork can still point its metadata elsewhere with
 * `NEXT_PUBLIC_SITE_URL` (see `SITE_URL`).
 */
export const CANONICAL_SITE_URL = "https://franprz.vercel.app";

/**
 * Origin for metadata, robots and the sitemap: `NEXT_PUBLIC_SITE_URL` when the
 * build sets it explicitly, otherwise the canonical production origin. Never
 * ends in a slash.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_SITE_URL).replace(/\/$/, "");

/** Host of the canonical origin, for labels such as the CV contact line. */
export const CANONICAL_SITE_HOST = new URL(CANONICAL_SITE_URL).host;

/** Host of `SITE_URL`, the fallback when a request carries no Host header. */
export const SITE_HOST = new URL(SITE_URL).host;

/** Absolute URL of a site path on `SITE_URL`. */
export function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
