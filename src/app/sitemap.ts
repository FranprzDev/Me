import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return siteUrl
    ? [
        {
          url: siteUrl,
          changeFrequency: "monthly",
          priority: 1,
        },
      ]
    : [];
}
