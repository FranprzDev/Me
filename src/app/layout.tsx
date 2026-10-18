import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ScrollProvider } from "@/lib/scroll";
import { SiteChrome } from "@/components/SiteChrome";
import { SITE_URL } from "@/lib/site";
import { SITE_OPEN_GRAPH } from "@/lib/seo";

// Display face for every heading (OFL, self-hosted by next/font, latin subset,
// variable weight axis). Body copy keeps the system UI stack.
const headingFont = Space_Grotesk({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-heading-face",
  display: "swap",
});

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${headingFont.variable}`}
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
