import type { MetadataRoute } from "next";
import { PROJECTS } from "@/data/projects";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return siteUrl
    ? [
        {
          url: siteUrl,
          changeFrequency: "monthly",
          priority: 1,
        },
        ...PROJECTS.map((project) => ({
          url: `${siteUrl}/${project.slug}`,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        })),
      ]
    : [];
}
