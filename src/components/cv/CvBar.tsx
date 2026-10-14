import Link from "next/link";
import {
  CV_VARIANTS,
  CvLocale,
  cvIndexPath,
  cvLabel,
  cvPath,
  cvPdfPath,
  otherLocale,
  type CvVariant,
} from "@/content/cv";
import { CV_UI } from "@/content/cv/ui";

type CvBarProps = {
  locale: CvLocale;
  /** The variant on screen; the index page has none. */
  variant?: CvVariant;
};

/** Screen-only toolbar: back link, version switcher, EN/ES toggle and PDF. Hidden in print. */
export function CvBar({ locale, variant }: CvBarProps) {
  const target = otherLocale(locale);
  const switchHref = variant ? cvPath(variant, target) : cvIndexPath(target);
  return (
    <header className="cv-bar">
      <div className="cv-bar__inner">
        <Link href="/" className="cv-bar__home" aria-label={CV_UI.backHomeLabel[locale]}>
          {CV_UI.backHome[locale]}
        </Link>
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
        <div className="cv-bar__actions">
          <Link
            href={switchHref}
            hrefLang={target}
            lang={target}
            className="cv-bar__lang"
            aria-label={CV_UI.switchLabel[locale]}
          >
            <span aria-hidden="true">
              <span className="cv-bar__lang-on">{CV_UI.current[locale]}</span>
              {" / "}
              {CV_UI.switchShort[locale]}
            </span>
          </Link>
          {variant ? (
            <a href={cvPdfPath(variant, locale)} className="cv-bar__pdf" download data-cv-pdf>
              {CV_UI.download[locale]}
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
