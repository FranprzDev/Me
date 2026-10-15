import { CV_NAME, CV_VARIANTS, cvHeadline, cvLabel, cvPdfFile, cvPdfPath, type CvLocale } from "@/content/cv";
import { CV_UI, cvDownloadLabel } from "@/content/cv/ui";
import { CvBar } from "./CvBar";
import { CvCosmos } from "./CvCosmos";
import { cvFontClassName } from "./fonts";
import { riseStyle } from "./motion";
import "./cv.css";

/**
 * /cv and /es/cv: the five versions as glass tiles. Each tile is a single
 * action that downloads that version's PDF; the /cv/<variant> pages stay
 * available from the version switcher and search.
 */
export function CvIndex({ locale }: { locale: CvLocale }) {
  return (
    <div className={`cv-root ${cvFontClassName}`} lang={locale}>
      <CvCosmos />
      <main id="main-content" className="cv-index" tabIndex={-1}>
        <CvBar locale={locale} />
        <header className="cv-index__head cv-rise" style={riseStyle(1)}>
          <p className="cv-index__eyebrow">{CV_NAME}</p>
          <h1>{CV_UI.indexTitle[locale]}</h1>
          <p className="cv-index__intro">{CV_UI.indexIntro[locale]}</p>
        </header>
        <ul className="cv-index__list">
          {CV_VARIANTS.map((variant, index) => (
            <li key={variant} className="cv-index__item cv-rise" style={riseStyle(index + 2)}>
              <a
                href={cvPdfPath(variant, locale)}
                className="cv-card"
                download={cvPdfFile(variant, locale)}
                data-cv-card-pdf
                aria-label={cvDownloadLabel(cvLabel(variant, locale), locale)}
              >
                <h2 className="cv-card__title">{cvLabel(variant, locale)}</h2>
                <p className="cv-card__headline">{cvHeadline(variant, locale)}</p>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
