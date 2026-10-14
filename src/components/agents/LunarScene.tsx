/**
 * Decorative landing scene for /for-agents: starfield, Earth rising over a
 * cratered lunar horizon, a lunar module on the surface, drifting dust and a
 * descent telemetry readout. Pure SVG/CSS (no JS, no canvas); the descent
 * animation lives in for-agents.css and is skipped with reduced motion.
 */
export function LunarScene() {
  return (
    <div className="moon-scene" aria-hidden="true">
      <div className="moon-scene__stars moon-scene__stars--far" />
      <div className="moon-scene__stars moon-scene__stars--near" />

      <svg className="moon-earth" viewBox="0 0 200 200" focusable="false">
        <defs>
          <radialGradient id="earth-ocean" cx="38%" cy="34%" r="75%">
            <stop offset="0" stopColor="#7cc4ff" />
            <stop offset="0.45" stopColor="#2f7fd8" />
            <stop offset="1" stopColor="#0b2a63" />
          </radialGradient>
          <linearGradient id="earth-night" x1="0" y1="0" x2="1" y2="0.35">
            <stop offset="0.48" stopColor="#02040c" stopOpacity="0" />
            <stop offset="0.78" stopColor="#02040c" stopOpacity="0.82" />
            <stop offset="1" stopColor="#02040c" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="earth-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0.72" stopColor="#5b8cff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#5b8cff" stopOpacity="0" />
          </radialGradient>
          <clipPath id="earth-clip">
            <circle cx="100" cy="100" r="70" />
          </clipPath>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#earth-glow)" />
        <circle cx="100" cy="100" r="70" fill="url(#earth-ocean)" />
        <g clipPath="url(#earth-clip)">
          <g className="moon-earth__land" fill="#4f9a5c" opacity="0.85">
            <path d="M52 62c10-8 26-6 32 4 5 8-2 14 4 22 5 7 2 18-8 20-9 2-12-8-20-10-9-2-16-10-14-20 1-7 2-12 6-16z" />
            <path d="M104 46c9-3 20 1 24 8 3 6-4 9-2 15 2 5 10 6 10 13 0 8-10 10-15 6-6-4-5-12-12-15-6-3-12-6-12-13 0-6 2-12 7-14z" />
            <path d="M92 124c8-4 18 0 20 8 2 7-3 12-1 19 2 6-4 12-11 10-7-2-6-10-11-15-5-5-8-17 3-22z" />
          </g>
          <g fill="#f4f8ff" opacity="0.7">
            <path d="M40 92c14-6 30-4 44 2-14 2-30 4-44-2z" />
            <path d="M96 84c16-5 34-3 50 4-16 1-34 1-50-4z" />
            <path d="M66 140c12-5 26-4 38 1-12 2-26 3-38-1z" />
          </g>
          <rect x="0" y="0" width="200" height="200" fill="url(#earth-night)" />
        </g>
        <circle cx="100" cy="100" r="70" fill="none" stroke="#9cc8ff" strokeOpacity="0.45" strokeWidth="1.2" />
      </svg>

      <div className="moon-scene__ground">
        <svg className="moon-horizon" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" focusable="false">
          <defs>
            <linearGradient id="regolith" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8f93a3" />
              <stop offset="0.18" stopColor="#5c6070" />
              <stop offset="0.6" stopColor="#2a2d3a" />
              <stop offset="1" stopColor="#0d0f18" />
            </linearGradient>
            <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#555a6c" />
              <stop offset="1" stopColor="#1a1c27" />
            </linearGradient>
            <radialGradient id="crater" cx="50%" cy="40%" r="60%">
              <stop offset="0" stopColor="#0f111b" />
              <stop offset="0.7" stopColor="#262a37" />
              <stop offset="1" stopColor="#3c4050" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f5d37a" />
              <stop offset="0.5" stopColor="#c58f2c" />
              <stop offset="1" stopColor="#7a5418" />
            </linearGradient>
          </defs>
          {/* Distant ridge, then the near surface. */}
          <path d="M0 150 C120 128 220 140 330 122 C440 104 520 132 640 118 C760 104 860 126 980 112 C1100 98 1220 124 1320 110 C1380 102 1420 108 1440 104 L1440 360 L0 360 Z" fill="url(#ridge)" />
          <path d="M0 196 C160 176 300 190 460 178 C620 166 760 186 920 174 C1080 162 1240 182 1440 168 L1440 360 L0 360 Z" fill="url(#regolith)" />
          {/* Craters: dark bowl + lit rim. */}
          <g>
            <ellipse cx="210" cy="262" rx="120" ry="22" fill="url(#crater)" />
            <path d="M92 262 a118 22 0 0 0 236 0" fill="none" stroke="#a5a9b8" strokeOpacity="0.35" strokeWidth="2" />
            <ellipse cx="760" cy="318" rx="190" ry="30" fill="url(#crater)" />
            <path d="M572 318 a188 30 0 0 0 376 0" fill="none" stroke="#a5a9b8" strokeOpacity="0.3" strokeWidth="2.5" />
            <ellipse cx="1180" cy="236" rx="70" ry="12" fill="url(#crater)" />
            <path d="M1111 236 a69 12 0 0 0 138 0" fill="none" stroke="#a5a9b8" strokeOpacity="0.35" strokeWidth="1.5" />
            <ellipse cx="520" cy="224" rx="44" ry="7" fill="url(#crater)" />
            <ellipse cx="1340" cy="290" rx="96" ry="16" fill="url(#crater)" />
            <ellipse cx="420" cy="300" rx="26" ry="5" fill="url(#crater)" />
          </g>
          {/* Lunar module (descent stage + ascent stage) on the surface. */}
          <g className="moon-lander" transform="translate(1010 150)">
            <ellipse cx="40" cy="72" rx="62" ry="7" fill="#05060c" opacity="0.55" />
            <path d="M6 70 L18 40 M74 70 L62 40 M24 72 L30 44 M56 72 L50 44" stroke="#b9bccb" strokeWidth="2.4" />
            <path d="M0 70 h12 M68 70 h12 M20 72 h10 M50 72 h10" stroke="#d9dbe6" strokeWidth="2.4" />
            <path d="M14 30 h52 l4 14 h-60 z" fill="url(#foil)" />
            <path d="M22 8 h30 l8 10 v12 h-44 v-12 z" fill="#c9ccd8" />
            <path d="M28 14 h8 v6 h-8 z" fill="#1a1d2a" />
            <path d="M44 0 v8" stroke="#c9ccd8" strokeWidth="1.6" />
          </g>
        </svg>
        <span className="moon-scene__dust" />
      </div>

      <div className="moon-hud">
        <span className="moon-hud__row">
          <span className="moon-hud__label">ALT</span>
          <span className="moon-hud__value moon-hud__value--alt" />
          <span className="moon-hud__unit">m</span>
        </span>
        <span className="moon-hud__row">
          <span className="moon-hud__label">V/S</span>
          <span className="moon-hud__value moon-hud__value--vs" />
          <span className="moon-hud__unit">m/s ↓</span>
        </span>
        <span className="moon-hud__status">Contact light</span>
      </div>
    </div>
  );
}
