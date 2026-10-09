import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PROJECTS } from "@/data/projects";
import { PlanetBackground } from "@/components/PlanetBackground";
import { ProjectPageContent } from "@/components/ProjectPageContent";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: `${p.name} — Francisco Miguel Perez`,
    description: p.description.es,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: `${p.name} — Francisco Perez`,
      description: p.description.es,
      url: `/${slug}`,
      type: "website",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = PROJECTS.find((x) => x.slug === slug);
  if (!project) notFound();

  return (
    <>
      <PlanetBackground slug={slug} />
      {/* content-layer: el DOM va por encima del canvas 3D (z-index 0). */}
      <main id="main-content" tabIndex={-1} className="section content-layer" style={{ paddingTop: "8rem", justifyContent: "flex-start" }}>
        <div className="wrap">
          <ProjectPageContent slug={slug} />
        </div>
      </main>
    </>
  );
}
