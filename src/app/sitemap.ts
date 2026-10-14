import type { MetadataRoute } from "next";
import { PROJECTS } from "@/data/projects";
import { CV_LOCALES, CV_VARIANTS, cvIndexPath, cvPath } from "@/content/cv/routes";
import { CvLocale, type CvVariant } from "@/content/cv/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

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
        {
          url: `${siteUrl}/me`,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        },
        ...cvEntries(siteUrl),
      ]
    : [];
}
