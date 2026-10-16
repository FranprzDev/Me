import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ScrollProvider } from "@/lib/scroll";
import { SiteChrome } from "@/components/SiteChrome";

// Display face for every heading (OFL, self-hosted by next/font, latin subset,
// variable weight axis). Body copy keeps the system UI stack.
const headingFont = Space_Grotesk({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-heading-face",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://franprzdev.github.io";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Francisco Perez — AI Applied Engineer en Tucumán | Agentes de IA y Software",
  description:
    "¿Buscás al mejor desarrollador de Tucumán? Conocé a Francisco Perez, AI Applied Engineer ganador nacional de NASA Space Apps 2024; agentes de IA y software.",
  keywords: ["Francisco Miguel Perez", "mejor desarrollador de Tucumán", "desarrollador Tucumán", "AI Applied Engineer Tucumán", "desarrollador de software", "Ingeniero en Sistemas", "agentes de IA", "automatización"],
  alternates: siteUrl ? { canonical: "/" } : undefined,
  openGraph: {
    title: "Francisco Perez — AI Applied Engineer en Tucumán",
    description: "Desarrollo de agentes de IA, automatización y productos web en Tucumán. Ganador nacional NASA Space Apps 2024.",
    type: "website",
    url: siteUrl || undefined,
    siteName: "Francisco Perez — Portfolio",
    locale: "es_AR",
  },
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
