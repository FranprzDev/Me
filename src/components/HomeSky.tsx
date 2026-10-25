/**
 * CSS night sky behind the home page: layered nebula glow (blue upper right,
 * violet lower left, a warm gold haze low), a soft aurora ribbon, three star depths and a vignette,
 * matching the /cv backdrop. It is server-rendered, so it is what the first
 * paint shows and what devices without WebGPU keep; once the WebGPU canvas
 * mounts on top of it, globals.css drops it (`display: none`) so it costs
 * nothing while the 3D sky runs.
 */
export function HomeSky() {
  return (
    <div className="home-sky" aria-hidden="true">
      <div className="home-sky__nebula" />
      <div className="home-sky__aurora" />
      <div className="home-sky__stars" />
      <div className="home-sky__stars home-sky__stars--far" />
      <div className="home-sky__stars home-sky__stars--near" />
      <div className="home-sky__vignette" />
    </div>
  );
}
