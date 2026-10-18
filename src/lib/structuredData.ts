import { CV } from "@/data/cv";
import { CV_NAME } from "@/content/cv/facts";
import { primaryCvPdfPath } from "@/lib/primaryCv";
import { CvLocale } from "@/content/cv/types";
import { absoluteUrl } from "@/lib/site";

/** Role shown in the hero; the JSON-LD repeats it so search results match the page. */
export const HERO_ROLE = "AI Applied Engineer";

/**
 * schema.org Person + WebSite for the home page. Only facts the page already
 * shows: name, role, location, contact and profile links, education and the
 * NASA Space Apps 2024 national win. No phone number or street address.
 */
export function homeStructuredData() {
  const site = absoluteUrl("/");
  const personId = `${site}#person`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: CV_NAME,
        alternateName: CV.name,
        jobTitle: HERO_ROLE,
        description: CV.summary.en,
        url: site,
        image: absoluteUrl("/me/francisco.webp"),
        email: `mailto:${CV.email}`,
        address: {
          "@type": "PostalAddress",
          addressRegion: "Tucumán",
          addressCountry: "AR",
        },
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Universidad Tecnológica Nacional, Facultad Regional Tucumán (UTN-FRT)",
        },
        award: "NASA Space Apps Challenge 2024 — National winner (Argentina), ExoGames",
        knowsAbout: ["AI agents", "Multi-agent systems", "RAG pipelines", "LangChain", "LangGraph", "n8n", "Next.js", "TypeScript", "Node.js", "Python"],
        knowsLanguage: ["es", "en"],
        sameAs: [CV.github, CV.linkedin],
        subjectOf: {
          "@type": "DigitalDocument",
          name: "CV (PDF)",
          url: absoluteUrl(primaryCvPdfPath(CvLocale.En)),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site}#website`,
        url: site,
        name: "Francisco Perez — Portfolio",
        inLanguage: ["es", "en"],
        publisher: { "@id": personId },
      },
    ],
  };
}
