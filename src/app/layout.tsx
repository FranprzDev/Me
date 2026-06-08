import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ScrollProvider } from "@/lib/scroll";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const jp = Shippori_Mincho({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "Francisco Miguel Perez — Ing. en Sistemas & UTN-FRT-MCP",
  description:
    "Portfolio de Francisco Miguel Perez, Ingeniero en Sistemas de Información. Un viaje en 3D y la presentación del UTN-FRT-MCP: apuntes de la UTN-FRT accesibles desde tu CLI.",
  openGraph: {
    title: "Francisco Miguel Perez — Ing. en Sistemas & UTN-FRT-MCP",
    description:
      "Un viaje en 3D por mi experiencia y la presentación del UTN-FRT-MCP: apuntes de la UTN-FRT en tu CLI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} ${jp.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider>
          <ScrollProvider>{children}</ScrollProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
