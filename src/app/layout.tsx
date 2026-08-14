import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ScrollProvider } from "@/lib/scroll";
import { SiteChrome } from "@/components/SiteChrome";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Francisco Miguel Perez — Ing. en Sistemas",
  description:
    "Portfolio de Francisco Miguel Perez, Ingeniero en Sistemas de Información. Un viaje en 3D por su experiencia, formación y proyectos.",
  keywords: ["Francisco Miguel Perez", "Ingeniero en Sistemas", "portfolio", "desarrollo de software", "AI engineering"],
  alternates: siteUrl ? { canonical: "/" } : undefined,
  openGraph: {
    title: "Francisco Miguel Perez — Ing. en Sistemas",
    description: "Un viaje en 3D por mi experiencia, formación y proyectos.",
    type: "website",
    url: siteUrl || undefined,
  },
  twitter: {
    card: "summary",
    title: "Francisco Miguel Perez — Ing. en Sistemas",
    description: "Portfolio de Francisco Miguel Perez, Ingeniero en Sistemas de Información.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
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
