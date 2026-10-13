import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { MePage } from "@/components/me/MePage";
import "./me.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--me-font-display",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--me-font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--me-font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Francisco Perez — AI Engineer",
  description:
    "Francisco Perez, AI engineer and full-stack developer from Tucumán, Argentina. Multi-agent systems, RAG pipelines and automations shipped to production.",
  alternates: { canonical: "/me" },
  openGraph: {
    title: "Francisco Perez — AI Engineer",
    description: "AI agents that do real work. Multi-agent systems, RAG and automation from Tucumán, Argentina.",
    type: "profile",
    url: "/me",
    images: [{ url: "/me/hero.webp", width: 1920, height: 1071 }],
  },
};

export default function MeRoute() {
  return <MePage fontClassName={`${display.variable} ${sans.variable} ${mono.variable}`} />;
}
