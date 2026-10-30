import { CvLocale } from "@/content/cv";
import { cvStaticParams, cvVariantRoute } from "@/components/cv/routes";

const route = cvVariantRoute(CvLocale.Es);

export const dynamicParams = false;

export const generateStaticParams = cvStaticParams;

export const generateMetadata = route.generateMetadata;

export default route.Page;
