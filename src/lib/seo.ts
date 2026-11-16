import type { Metadata } from "next";

/** Open Graph defaults shared by the root layout and the home page. */
export const SITE_OPEN_GRAPH = {
  title: "Francisco Perez — AI Applied Engineer en Tucumán",
  description: "Desarrollo de agentes de IA, automatización y productos web en Tucumán. Ganador nacional NASA Space Apps 2024.",
  type: "website",
  // Matches the WebSite JSON-LD name: Google weighs og:site_name, the title
  // and headings against the structured data when picking the site name.
  siteName: "Francisco Perez",
  locale: "es_AR",
} satisfies NonNullable<Metadata["openGraph"]>;

/**
 * The site-wide share card (src/app/opengraph-image.png). Routes that set
 * their own `openGraph` replace the inherited one, so they list it again.
 */
export const SITE_OG_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630 };
