import { CvLocale } from "@/content/cv";
import { cvIndexRoute } from "@/components/cv/routes";

const route = cvIndexRoute(CvLocale.En);

export const metadata = route.metadata;

export default route.Page;
