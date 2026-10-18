import type { MetadataRoute } from "next";
import { PROJECTS } from "@/data/projects";
import { CV_LOCALES, CV_VARIANTS, cvIndexPath, cvPath } from "@/content/cv/routes";
import { CvLocale, type CvVariant } from "@/content/cv/types";
import { SITE_URL } from "@/lib/site";

/** Every CV route in both languages, each listing its hreflang alternates. */
function cvEntries(base: string): MetadataRoute.Sitemap {
  const pages: ((locale: CvLocale) => string)[] = [
    cvIndexPath,
    ...CV_VARIANTS.map((variant: CvVariant) => (locale: CvLocale) => cvPath(variant, locale)),
  ];
  return pages.flatMap((pathFor) =>
    CV_LOCALES.map((locale) => ({
      url: `${base}${pathFor(locale)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: { en: `${base}${pathFor(CvLocale.En)}`, es: `${base}${pathFor(CvLocale.Es)}` } },
    })),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...PROJECTS.map((project) => ({
      url: `${SITE_URL}/${project.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/me`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/for-agents`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    ...cvEntries(SITE_URL),
  ];
}
