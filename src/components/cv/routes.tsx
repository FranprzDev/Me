import { notFound } from "next/navigation";
import { CV_VARIANTS, CvLocale, cvHeadline, cvLabel, getCv, isCvVariant, type CvVariant } from "@/content/cv";
import { CV_UI } from "@/content/cv/ui";
import { CvDocument } from "./CvDocument";
import { CvIndex } from "./CvIndex";
import { cvIndexMetadata, cvPageMetadata } from "./metadata";
import { cvOgImage } from "./og";

/*
 * Route modules for /cv/* (English) and /es/cv/* (Spanish) are thin
 * wrappers around these, so both languages render from one implementation.
 */

export type CvRouteParams = { params: Promise<{ variant: string }> };

export function cvStaticParams(): { variant: CvVariant }[] {
  return CV_VARIANTS.map((variant) => ({ variant }));
}

async function variantFrom(params: CvRouteParams["params"]): Promise<CvVariant> {
  const { variant } = await params;
  if (!isCvVariant(variant)) notFound();
  return variant;
}

export function cvVariantRoute(locale: CvLocale) {
  return {
    generateMetadata: async ({ params }: CvRouteParams) => cvPageMetadata(await variantFrom(params), locale),
    Page: async function CvVariantPage({ params }: CvRouteParams) {
      return <CvDocument cv={getCv(await variantFrom(params), locale)} />;
    },
    OgImage: async function CvVariantOgImage({ params }: CvRouteParams) {
      const variant = await variantFrom(params);
      return cvOgImage(`${cvLabel(variant, locale)} · ${CV_UI.cvWord[locale]}`, cvHeadline(variant, locale));
    },
  };
}

export function cvIndexRoute(locale: CvLocale) {
  return {
    metadata: cvIndexMetadata(locale),
    Page: function CvIndexPage() {
      return <CvIndex locale={locale} />;
    },
    OgImage: function CvIndexOgImage() {
      return cvOgImage(CV_UI.indexTitle[locale], CV_UI.indexIntro[locale]);
    },
  };
}
