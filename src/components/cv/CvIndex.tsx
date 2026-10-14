import Link from "next/link";
import { CV_NAME, CV_VARIANTS, cvHeadline, cvLabel, cvPath, cvPdfPath, type CvLocale } from "@/content/cv";
import { CV_UI } from "@/content/cv/ui";
import { CvBar } from "./CvBar";
import { cvFontClassName } from "./fonts";
import "./cv.css";

/** /cv and /es/cv: the five versions, each with its page and its PDF. */
export function CvIndex({ locale }: { locale: CvLocale }) {
  return (
    <div className={`cv-root ${cvFontClassName}`} lang={locale}>
      <CvBar locale={locale} />
      <main id="main-content" className="cv-index" tabIndex={-1}>
        <header className="cv-index__head">
          <p className="cv-index__eyebrow">{CV_NAME}</p>
          <h1>{CV_UI.indexTitle[locale]}</h1>
          <p className="cv-index__intro">{CV_UI.indexIntro[locale]}</p>
        </header>
        <ul className="cv-index__list">
          {CV_VARIANTS.map((variant) => (
            <li key={variant} className="cv-card">
              <h2 className="cv-card__title">
                <Link href={cvPath(variant, locale)}>{cvLabel(variant, locale)}</Link>
              </h2>
              <p className="cv-card__headline">{cvHeadline(variant, locale)}</p>
              <p className="cv-card__links">
                <Link href={cvPath(variant, locale)} aria-label={`${CV_UI.read[locale]}: ${cvLabel(variant, locale)}`}>
                  {CV_UI.read[locale]}
                </Link>
                <a href={cvPdfPath(variant, locale)} download aria-label={`${CV_UI.download[locale]}: ${cvLabel(variant, locale)}`}>
                  {CV_UI.pdfShort[locale]}
                </a>
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
