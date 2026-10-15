import Link from "next/link";
import { CV_VARIANTS, CvLocale, cvIndexPath, cvLabel, cvPath, cvPdfFile, cvPdfPath, type CvVariant } from "@/content/cv";
import { CV_UI } from "@/content/cv/ui";
import { riseStyle } from "./motion";

type CvBarProps = {
  locale: CvLocale;
  /** The variant on screen; the index page has none. */
  variant?: CvVariant;
};

/** Small rocket used by the portfolio's "back" pill. */
function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M5 19c1.2-3.6 3.4-6.6 6.6-9.1L14 7.5c1.8-1.8 4.2-2.6 6-2.5.1 1.8-.7 4.2-2.5 6l-2.4 2.4C12.6 16.6 9.6 18.8 6 20Z"
        fill="currentColor"
        fillOpacity=".9"
      />
      <circle cx="15.6" cy="8.4" r="1.6" fill="#0b1020" />
      <path d="M4 20.5 7 17.5" stroke="#ffbf5c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Screen-only controls above the résumé: way back to the portfolio, the PDF
 * download and the version switcher. The language switch lives in the site
 * nav. Hidden in print.
 */
export function CvBar({ locale, variant }: CvBarProps) {
  return (
    <div className="cv-bar cv-rise" style={riseStyle(0)}>
      <div className="cv-bar__top">
        <Link href="/" className="story-back cv-bar__home" aria-label={CV_UI.backHomeLabel[locale]}>
          <span className="story-back__icon" aria-hidden="true">
            <RocketIcon />
          </span>
          <span>{CV_UI.backHome[locale]}</span>
        </Link>
        {variant ? (
          <a href={cvPdfPath(variant, locale)} className="cv-bar__pdf" download={cvPdfFile(variant, locale)} data-cv-pdf>
            <span className="cv-bar__pdf-badge" aria-hidden="true">
              {CV_UI.pdfBadge[locale]}
            </span>
            <span className="cv-bar__pdf-text">
              <span aria-hidden="true">↓</span> {CV_UI.download[locale]}
            </span>
          </a>
        ) : null}
      </div>
      {variant ? (
        <nav aria-label={CV_UI.versions[locale]} className="cv-bar__versions">
          <ul>
            <li>
              <Link href={cvIndexPath(locale)}>{CV_UI.allVersions[locale]}</Link>
            </li>
            {CV_VARIANTS.map((item) => (
              <li key={item}>
                <Link href={cvPath(item, locale)} aria-current={item === variant ? "page" : undefined}>
                  {cvLabel(item, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
