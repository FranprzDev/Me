import { StarAura } from "@/components/StarAura";

/**
 * Screen-only backdrop for the CV pages: the portfolio's night sky (nebula
 * glow and a CSS starfield) plus the same GSAP shooting stars as the home
 * page. Pure decoration, hidden from assistive tech and from print; no WebGPU
 * scene, so a recruiter's first paint stays light.
 */
export function CvCosmos() {
  return (
    <div className="cv-cosmos" aria-hidden="true">
      <div className="cv-cosmos__stars" />
      <StarAura />
    </div>
  );
}
