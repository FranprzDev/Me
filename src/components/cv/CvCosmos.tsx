import { StarAura } from "@/components/StarAura";

/**
 * Screen-only backdrop for the CV pages: layered nebula glow, a soft aurora,
 * two starfield depths (a far drifting one and a near twinkling one), a
 * vignette, plus the same GSAP shooting stars as the home page. All CSS, no
 * WebGPU scene, so a recruiter's first paint stays light; motion only runs
 * under `prefers-reduced-motion: no-preference`. Hidden from assistive tech
 * and from print.
 */
export function CvCosmos() {
  return (
    <div className="cv-cosmos" aria-hidden="true">
      <div className="cv-cosmos__nebula" />
      <div className="cv-cosmos__aurora" />
      <div className="cv-cosmos__stars" />
      <div className="cv-cosmos__stars cv-cosmos__stars--near" />
      <div className="cv-cosmos__vignette" />
      <StarAura />
    </div>
  );
}
