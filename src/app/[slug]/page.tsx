import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
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
      <main className="section" style={{ paddingTop: "8rem", justifyContent: "flex-start" }}>
        <div className="wrap">
          <Link href="/#projects" className="chip" style={{ display: "inline-block", marginBottom: "1.5rem" }}>
            ← Volver al cosmos
          </Link>
          <ProjectPageContent slug={slug} />
        </div>
      </main>
    </>
  );
}
