import { CvLocale } from "@/content/cv";
import { cvIndexRoute } from "@/components/cv/routes";
import { CV_OG_SIZE } from "@/components/cv/og";

export const size = CV_OG_SIZE;
export const contentType = "image/png";
export const alt = "Francisco Miguel Perez — CV";

export default cvIndexRoute(CvLocale.En).OgImage;
