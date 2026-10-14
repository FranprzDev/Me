import type { Metadata } from "next";
import {
  CV_NAME,
  CvLocale,
  cvHeadline,
  cvIndexPath,
  cvLabel,
  cvPath,
  type CvVariant,
} from "@/content/cv";
import { CV_UI } from "@/content/cv/ui";

const OG_LOCALE: Record<CvLocale, string> = {
  [CvLocale.En]: "en_US",
  [CvLocale.Es]: "es_AR",
};

/** Canonical + hreflang alternates for a CV route; English is the x-default. */
function alternates(pathFor: (locale: CvLocale) => string, locale: CvLocale): Metadata["alternates"] {
  return {
    canonical: pathFor(locale),
    languages: {
      en: pathFor(CvLocale.En),
      es: pathFor(CvLocale.Es),
      "x-default": pathFor(CvLocale.En),
    },
  };
}

export function cvPageMetadata(variant: CvVariant, locale: CvLocale): Metadata {
  const title = `${CV_NAME} — ${cvLabel(variant, locale)} ${CV_UI.cvWord[locale]}`;
  const description = cvHeadline(variant, locale).replaceAll(" | ", " · ");
  const url = cvPath(variant, locale);
  return {
    title,
    description,
    alternates: alternates((l) => cvPath(variant, l), locale),
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      locale: OG_LOCALE[locale],
      siteName: "Francisco Perez — Portfolio",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function cvIndexMetadata(locale: CvLocale): Metadata {
  const title = `${CV_NAME} — ${CV_UI.indexTitle[locale]}`;
  const description = CV_UI.indexIntro[locale];
  return {
    title,
    description,
    alternates: alternates(cvIndexPath, locale),
    openGraph: {
      title,
      description,
      url: cvIndexPath(locale),
      type: "website",
      locale: OG_LOCALE[locale],
      siteName: "Francisco Perez — Portfolio",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
