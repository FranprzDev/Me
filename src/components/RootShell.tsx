import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import localFont from "next/font/local";
import { I18nProvider } from "@/lib/i18n";
import { ScrollProvider } from "@/lib/scroll";
import { SiteChrome } from "@/components/SiteChrome";
import { SITE_URL } from "@/lib/site";
import { SITE_OPEN_GRAPH } from "@/lib/seo";

// Display face for every heading (OFL, self-hosted, variable wght clamped to
// 500..700). Core is preloaded; the extended file only downloads per missing
// glyph, after the core family and before the automatic fallback metrics.
const headingCore = localFont({
  src: "../../public/fonts/oxanium-core-v1.woff2",
  weight: "500 700",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
});

const headingExtended = localFont({
  src: "../../public/fonts/oxanium-ext-v1.woff2",
  weight: "500 700",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const [headingCoreFamily, headingFallbackFamily] = headingCore.style.fontFamily
  .split(",")
  .map((family) => family.trim());
const headingExtendedFamily = headingExtended.style.fontFamily.split(",")[0].trim();
const headingVars = {
  "--font-heading-core": headingCoreFamily,
  "--font-heading-ext": headingExtendedFamily,
  "--font-heading-fallback": headingFallbackFamily ?? "sans-serif",
} as CSSProperties;

// Browser chrome / status bar matches the dark sky at the top of the page
// (/me overrides this with its paper tone).
export const rootViewport: Viewport = {
  themeColor: "#040612",
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Francisco Perez — AI Applied Engineer en Tucumán | Agentes de IA y Software",
  description:
    "¿Buscás al mejor desarrollador de Tucumán? Conocé a Francisco Perez, AI Applied Engineer ganador nacional de NASA Space Apps 2024; agentes de IA y software.",
  keywords: ["Francisco Miguel Perez", "mejor desarrollador de Tucumán", "desarrollador Tucumán", "AI Applied Engineer Tucumán", "desarrollador de software", "Ingeniero en Sistemas", "agentes de IA", "automatización"],
  // Each route sets its own canonical and og:url (a layout-level one would
  // leak the home URL into every page that forgets to override it).
  openGraph: SITE_OPEN_GRAPH,
  twitter: {
    card: "summary_large_image",
    title: "Francisco Perez — AI Applied Engineer en Tucumán",
    description: "Desarrollo de agentes de IA, automatización y productos web en Tucumán.",
  },
};

export function RootShell({
  lang,
  children,
}: {
  lang: "en" | "es";
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      className="h-full antialiased"
      style={headingVars}
    >
      <body className="min-h-full">
        <I18nProvider>
          <ScrollProvider>
            <SiteChrome />
            {children}
          </ScrollProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
