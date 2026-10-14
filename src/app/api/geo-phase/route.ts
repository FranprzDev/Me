import { countryPhaseDegrees } from "@/lib/geoPhase";

/**
 * Tiny edge endpoint fetched once per session at idle, so every page stays
 * static: it answers only the flight phase derived from the visitor's
 * country (see lib/geoPhase). The IP is never read, logged or returned.
 */
export const runtime = "edge";

/** Name of the request header Vercel fills with the visitor's ISO 3166-1 alpha-2 country. */
const COUNTRY_HEADER = "x-vercel-ip-country";

export function GET(request: Request): Response {
  const phaseDeg = countryPhaseDegrees(request.headers.get(COUNTRY_HEADER));
  return Response.json({ phaseDeg }, { headers: { "Cache-Control": "private, no-store" } });
}
