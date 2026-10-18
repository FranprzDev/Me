import type { Metadata } from "next";
import { Hero, Experience, Projects, Contact } from "@/components/Sections";
import { StarAura } from "@/components/StarAura";
import { SITE_OPEN_GRAPH } from "@/lib/seo";
import { homeStructuredData } from "@/lib/structuredData";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...SITE_OPEN_GRAPH, url: "/" },
};

/** JSON-LD is static data; `<` is escaped so the payload can never close the script tag. */
const structuredData = JSON.stringify(homeStructuredData()).replace(/</g, "\\u003c");

export default function Home() {
  return (
    <main id="main-content" className="content-layer" tabIndex={-1}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <StarAura />
      <Hero />
      <Experience />
      <Projects />
      <Contact />
    </main>
  );
}
