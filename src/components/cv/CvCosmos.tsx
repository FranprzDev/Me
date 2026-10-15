/**
 * Screen-only backdrop for the CV pages: layered nebula glow, a soft aurora,
 * two starfield depths and a vignette. All CSS and fully static, so the glass
 * panels above it are blurred once instead of on every frame and an idle page
 * costs nothing to keep on screen. No WebGPU scene, so a recruiter's first
 * paint stays light. Hidden from assistive tech and from print.
 */
export function CvCosmos() {
  return (
    <div className="cv-cosmos" aria-hidden="true">
      <div className="cv-cosmos__nebula" />
      <div className="cv-cosmos__aurora" />
      <div className="cv-cosmos__stars" />
      <div className="cv-cosmos__stars cv-cosmos__stars--near" />
      <div className="cv-cosmos__vignette" />
    </div>
  );
}
