import { WorldVehicle } from "@/lib/worldFlight";

/**
 * Inline SVG vehicles for the world-entry flights, drawn facing right (+x)
 * around the origin so the overlay can rotate them to the path's tangent.
 * Colours come from the world's --tone (bright), --tone-2 (pale) and
 * --tone-deep (dark). Their idle motion (wobble, flapping, spin) is CSS
 * transform/opacity animation in globals.css (.world-flight rules).
 */
export function WorldVehicleArt({ vehicle }: { vehicle: WorldVehicle }) {
  switch (vehicle) {
    case WorldVehicle.Ufo:
      return <UfoArt />;
    case WorldVehicle.Book:
      return <BookArt />;
    case WorldVehicle.Hammer:
      return <HammerArt />;
    case WorldVehicle.PaperPlane:
      return <PaperPlaneArt />;
  }
}

const UFO_LIGHTS: readonly number[] = [-32, -16, 0, 16, 32];

function UfoArt() {
  return (
    <svg className="vehicle-art vehicle-art--ufo" viewBox="-64 -46 128 120" width="128" height="120">
      <defs>
        <radialGradient id="ufo-glow">
          <stop offset="0" stopColor="var(--tone)" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="var(--tone)" stopOpacity="0.25" />
          <stop offset="1" stopColor="var(--tone)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ufo-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--tone-2)" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="var(--tone)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--tone)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ufo-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f1ff" />
          <stop offset="0.45" stopColor="#8a97b3" />
          <stop offset="1" stopColor="#2a3046" />
        </linearGradient>
        <linearGradient id="ufo-dome" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="var(--tone-2)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--tone)" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <ellipse className="ufo__glow" cx="0" cy="0" rx="62" ry="40" fill="url(#ufo-glow)" />
      <path className="ufo__beam" d="M-12 8 L12 8 L38 72 L-38 72 Z" fill="url(#ufo-beam)" />
      <g className="ufo__beam-rings" fill="none" stroke="var(--tone-2)" strokeOpacity="0.55">
        <ellipse cx="0" cy="30" rx="20" ry="3.5" />
        <ellipse cx="0" cy="52" rx="29" ry="4.5" />
      </g>
      <g className="ufo__body">
        <path d="M-19 -3 C-19 -27 19 -27 19 -3 Z" fill="url(#ufo-dome)" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
        <path d="M-9 -19 C-6 -22 -1 -23 3 -22" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        <ellipse cx="0" cy="0" rx="46" ry="11" fill="url(#ufo-hull)" />
        <ellipse cx="0" cy="-1.5" rx="45" ry="8" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1" />
        <ellipse cx="0" cy="7" rx="21" ry="5" fill="var(--tone-deep)" stroke="var(--tone)" strokeOpacity="0.8" />
        {UFO_LIGHTS.map((x, i) => (
          <circle key={x} className="ufo__light" cx={x} cy="3" r="2.8" fill="var(--tone)" style={{ animationDelay: `${i * 70}ms` }} />
        ))}
      </g>
    </svg>
  );
}

function BookArt() {
  return (
    <svg className="vehicle-art vehicle-art--book" viewBox="-50 -44 100 88" width="100" height="88">
      <defs>
        <linearGradient id="book-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--tone)" />
          <stop offset="1" stopColor="var(--tone-deep)" />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="0" rx="46" ry="30" fill="var(--tone)" opacity="0.18" />
      {/* Upper wing: cover + fanned pages, hinged on the spine (y = 0). */}
      <g className="book__wing book__wing--up">
        <path d="M-30 0 L-22 -34 L32 -30 L30 0 Z" fill="url(#book-cover)" stroke="var(--tone-2)" strokeWidth="1.2" />
        <path d="M-26 -1 L-19 -28 L28 -25 L26 -1 Z" fill="#f6f1e4" />
        <path d="M-18 -8 L22 -7 M-17 -14 L23 -13 M-15 -20 L24 -19" stroke="var(--tone-deep)" strokeOpacity="0.45" strokeWidth="1.4" />
      </g>
      <g className="book__wing book__wing--down">
        <path d="M-30 0 L-22 34 L32 30 L30 0 Z" fill="url(#book-cover)" stroke="var(--tone-2)" strokeWidth="1.2" />
        <path d="M-26 1 L-19 28 L28 25 L26 1 Z" fill="#ece5d3" />
        <path d="M-18 8 L22 7 M-17 14 L23 13 M-15 20 L24 19" stroke="var(--tone-deep)" strokeOpacity="0.45" strokeWidth="1.4" />
      </g>
      <rect x="-32" y="-2.5" width="64" height="5" rx="2.5" fill="var(--tone-2)" />
      <circle cx="36" cy="0" r="2.5" fill="var(--tone-2)" className="book__spark" />
    </svg>
  );
}

function HammerArt() {
  return (
    <svg className="vehicle-art vehicle-art--hammer" viewBox="-48 -48 96 96" width="96" height="96">
      <defs>
        <linearGradient id="hammer-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f6ff" />
          <stop offset="0.5" stopColor="#9aa6bf" />
          <stop offset="1" stopColor="#465068" />
        </linearGradient>
        <linearGradient id="hammer-grip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--tone-deep)" />
          <stop offset="0.5" stopColor="var(--tone)" />
          <stop offset="1" stopColor="var(--tone-deep)" />
        </linearGradient>
      </defs>
      <circle className="hammer__swirl" cx="0" cy="0" r="40" fill="none" stroke="var(--tone)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="34 18 8 18" />
      <g className="hammer__spin">
        <rect x="-4.5" y="-14" width="9" height="50" rx="4" fill="url(#hammer-grip)" />
        <rect x="-4.5" y="22" width="9" height="12" rx="3" fill="var(--tone-2)" opacity="0.8" />
        <path d="M-24 -30 L18 -30 L24 -24 L24 -12 L18 -6 L-24 -6 L-28 -12 L-28 -24 Z" fill="url(#hammer-head)" stroke="#ffffff" strokeOpacity="0.5" />
        <path d="M24 -26 L30 -26 L30 -10 L24 -10 Z" fill="var(--tone)" />
        <path d="M-22 -26 L14 -26" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function PaperPlaneArt() {
  return (
    <svg className="vehicle-art vehicle-art--plane" viewBox="-56 -34 104 68" width="104" height="68">
      <path className="plane__trail" d="M-54 4 C-44 0 -40 8 -30 4" fill="none" stroke="var(--tone)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 5" />
      <g className="plane__body">
        <path d="M44 0 L-34 -26 L-14 2 Z" fill="#fbf7ee" stroke="var(--tone-deep)" strokeOpacity="0.4" strokeWidth="1" strokeLinejoin="round" />
        <path d="M44 0 L-14 2 L-24 18 Z" fill="var(--tone-2)" stroke="var(--tone-deep)" strokeOpacity="0.4" strokeWidth="1" strokeLinejoin="round" />
        <path d="M44 0 L-14 2 L-34 24 Z" fill="var(--tone)" opacity="0.85" strokeLinejoin="round" />
        <path d="M44 0 L-14 2" stroke="var(--tone-deep)" strokeOpacity="0.6" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
