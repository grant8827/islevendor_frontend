import islevendorIcon from '../../assets/islevendor-icon.png';

// A Jamaican coastline, drawn (no photo): deep blue sky, distant islands, a
// turquoise sea with shallow reefs, a little island carrying the IsleVendor
// bag, and palms in the corner. Fills its
// parent; the left side is darkened so white text reads well over it.
// `fit` is the SVG preserveAspectRatio: a tall card shows the right-hand
// side (palms and sand) with "xMaxYMax slice".

// One palm frond: a curved leaf from the crown, pointing right before rotation.
const FROND = 'M0 0 C 40 -26 92 -24 132 6 C 96 -6 46 -6 0 0 Z';

function Palm({ x, y, scale = 1, lean = 0 }) {
  const angles = [-160, -128, -98, -68, -38, -10, 18];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${lean})`}>
      {/* Trunk, curving up to the crown at (0, -260). */}
      <path d="M-10 0 C -4 -90 -22 -180 -6 -260 L 6 -258 C -8 -178 10 -90 10 0 Z" fill="#123c2c" />
      <g transform="translate(-1 -258)">
        {angles.map((a) => (
          <path key={a} d={FROND} transform={`rotate(${a})`} fill={a < -90 ? '#0f3a25' : '#1a5232'} />
        ))}
        <circle cx="0" cy="4" r="9" fill="#2b2412" />
      </g>
    </g>
  );
}

export default function OceanScene({ fit = 'xMidYMid slice' }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 480"
      preserveAspectRatio={fit}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ocean-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b2a5b" />
          <stop offset="0.7" stopColor="#2f7fc1" />
          <stop offset="1" stopColor="#8fd3f0" />
        </linearGradient>
        <linearGradient id="ocean-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1478b8" />
          <stop offset="0.45" stopColor="#13a3c4" />
          <stop offset="1" stopColor="#2fd0c8" />
        </linearGradient>
        <radialGradient id="ocean-sun" cx="0.82" cy="0.18" r="0.35">
          <stop offset="0" stopColor="#fff6d5" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#ffe9a8" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ocean-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#06204a" stopOpacity="0.92" />
          <stop offset="0.45" stopColor="#06204a" stopOpacity="0.55" />
          <stop offset="0.75" stopColor="#06204a" stopOpacity="0" />
        </linearGradient>
        <filter id="ocean-soft" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* Sky, sun glow and clouds */}
      <rect width="1440" height="200" fill="url(#ocean-sky)" />
      <rect width="1440" height="480" fill="url(#ocean-sun)" />
      <g fill="#ffffff" opacity="0.55" filter="url(#ocean-soft)">
        <ellipse cx="1080" cy="70" rx="120" ry="18" />
        <ellipse cx="1270" cy="110" rx="90" ry="14" />
        <ellipse cx="860" cy="120" rx="80" ry="12" />
      </g>

      {/* Sea */}
      <rect y="180" width="1440" height="300" fill="url(#ocean-sea)" />

      {/* Distant islands on the horizon */}
      <path d="M900 186 C 960 168 1010 170 1060 184 C 1080 188 1100 188 1120 186 Z" fill="#1d5a5e" opacity="0.75" />
      <path d="M1180 188 C 1230 176 1290 176 1340 188 Z" fill="#1d5a5e" opacity="0.6" />

      {/* Shallow reefs: lighter turquoise patches */}
      <g fill="#8ff0e4" opacity="0.35" filter="url(#ocean-soft)">
        <ellipse cx="980" cy="300" rx="190" ry="34" />
        <ellipse cx="1240" cy="360" rx="160" ry="30" />
        <ellipse cx="760" cy="410" rx="220" ry="36" />
      </g>

      {/* Gentle wave lines */}
      <g fill="none" stroke="#e6fffb" strokeWidth="2" strokeLinecap="round" opacity="0.45">
        <path d="M640 250 q 30 -8 60 0 t 60 0" />
        <path d="M980 230 q 30 -8 60 0 t 60 0" />
        <path d="M820 340 q 30 -8 60 0 t 60 0" />
        <path d="M1150 290 q 30 -8 60 0 t 60 0" />
      </g>

      {/* A little island in the bay, with the IsleVendor bag standing on it */}
      <ellipse cx="1130" cy="322" rx="118" ry="14" fill="#8ff0e4" opacity="0.5" filter="url(#ocean-soft)" />
      <ellipse cx="1130" cy="318" rx="104" ry="15" fill="#e9d3a1" />
      <path d="M1046 316 C 1074 288 1186 288 1214 316 Z" fill="#2f7d3a" />
      <path d="M1066 312 C 1090 296 1170 296 1194 312 Z" fill="#3f9a45" />
      <image href={islevendorIcon} x="1088" y="214" width="84" height="84" />

      {/* Sand and palms in the corner */}
      <path d="M1040 480 C 1150 420 1300 400 1440 395 L 1440 480 Z" fill="#e9d3a1" />
      <path d="M1080 480 C 1180 440 1310 425 1440 422 L 1440 480 Z" fill="#d9bd84" />
      <Palm x={1352} y={474} scale={0.78} lean={-6} />
      <Palm x={1418} y={484} scale={0.62} lean={10} />

      {/* Darken the left side for the headline */}
      <rect width="1440" height="480" fill="url(#ocean-shade)" />
    </svg>
  );
}
