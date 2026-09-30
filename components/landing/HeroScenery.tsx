/**
 * Decorative artwork for the landing hero.
 *
 * Everything is inline SVG so the page stays offline-friendly (no photos to
 * download, no external hosts). All of it is aria-hidden: it carries no
 * information that is not also written in text.
 */

/**
 * Full-bleed hero backdrop: a hazy Sahyadri valley at the start of Kharif.
 * Pale mist at the top keeps headline and form text readable; the sunlit
 * paddy fields anchor the bottom edge of the hero.
 */
export function HeroBackdrop({ className = "" }: { className?: string }) {
  // Perspective bunds fan out from a vanishing point above the field edge.
  const furrows = Array.from({ length: 27 }, (_, i) => `M760 336 L${-620 + i * 120} 620`);
  // Deterministic jitter keeps the tree line from looking like a bead necklace.
  const treeline = Array.from({ length: 60 }, (_, i) => ({
    cx: 6 + i * 25,
    cy: 353 - ((i * 7) % 5),
    r: 5 + ((i * 13) % 4),
  }));
  // A handful of village rooftops tucked against the tree line.
  const roofs = [
    { x: 236, w: 46 },
    { x: 292, w: 34 },
    { x: 334, w: 52 },
    { x: 398, w: 30 },
    { x: 1004, w: 40 },
    { x: 1052, w: 56 },
    { x: 1118, w: 32 },
  ];

  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden>
      <svg viewBox="0 0 1440 710" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <defs>
          <linearGradient id="mm-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f7fafc" />
            <stop offset="45%" stopColor="#fbf7ef" />
            <stop offset="100%" stopColor="#fdf3e0" />
          </linearGradient>
          <radialGradient id="mm-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fbb84d" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fbb84d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mm-ridge-far" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7099be" />
            <stop offset="100%" stopColor="#b6cfe2" />
          </linearGradient>
          <linearGradient id="mm-ridge-mid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4a7ba9" />
            <stop offset="100%" stopColor="#93b8cd" />
          </linearGradient>
          <linearGradient id="mm-ridge-near" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3a6f78" />
            <stop offset="100%" stopColor="#6ba85c" />
          </linearGradient>
          <linearGradient id="mm-mist" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mm-field" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9ecc7f" />
            <stop offset="35%" stopColor="#6fb14c" />
            <stop offset="100%" stopColor="#2f6b27" />
          </linearGradient>
          <clipPath id="mm-field-clip">
            <path d="M0 356 C260 348 520 364 760 356 C1000 348 1220 366 1440 354 L1440 620 L0 620 Z" />
          </clipPath>
        </defs>

        <rect width="1440" height="710" fill="url(#mm-sky)" />
        <circle cx="1120" cy="180" r="280" fill="url(#mm-sun)" />

        {/* Scenery sits in the lower two-thirds; the sky above carries the headline. */}
        <g transform="translate(0 90)">
        {/* Far ridge: soft, rolling profile lost in haze */}
        <path
          d="M0 300 C80 250 150 244 224 272 C286 296 328 262 392 238 C458 214 512 250 578 272 C640 292 684 258 748 236 C814 214 866 250 932 272 C992 292 1038 260 1102 240 C1168 220 1218 254 1284 274 C1346 292 1396 262 1440 246 L1440 372 L0 372 Z"
          fill="url(#mm-ridge-far)"
          opacity="0.78"
        />
        {/* Mid ridge */}
        <path
          d="M0 322 C110 288 206 300 300 282 C396 264 470 300 566 306 C660 312 720 282 812 268 C902 254 970 292 1064 296 C1156 300 1230 272 1320 262 C1382 255 1414 272 1440 282 L1440 372 L0 372 Z"
          fill="url(#mm-ridge-mid)"
          opacity="0.8"
        />
        {/* Near hills */}
        <path
          d="M0 340 C140 318 268 334 396 322 C524 310 640 338 768 330 C896 322 1012 342 1140 328 C1268 314 1360 336 1440 328 L1440 372 L0 372 Z"
          fill="url(#mm-ridge-near)"
          opacity="0.85"
        />
        {/* Valley mist softens every ridge base */}
        <rect x="0" y="266" width="1440" height="106" fill="url(#mm-mist)" />

        {/* Village rooftops against the tree line */}
        <g opacity="0.3">
          {roofs.map((r) => (
            <g key={r.x}>
              <path d={`M${r.x} 350 L${r.x + r.w / 2} 338 L${r.x + r.w} 350 Z`} fill="#9c6a52" />
              <rect x={r.x + 4} y={350} width={r.w - 8} height={9} fill="#e8ded0" />
            </g>
          ))}
        </g>

        {/* Tree line along the horizon */}
        <g fill="#2a5c23" opacity="0.26">
          {treeline.map((t) => (
            <circle key={t.cx} cx={t.cx} cy={t.cy} r={t.r} />
          ))}
        </g>

        {/* Paddy fields */}
        <path d="M0 356 C260 348 520 364 760 356 C1000 348 1220 366 1440 354 L1440 620 L0 620 Z" fill="url(#mm-field)" />
        <g clipPath="url(#mm-field-clip)">
          <g stroke="#22471e" strokeOpacity="0.12" strokeWidth="2">
            {furrows.map((d) => (
              <path key={d} d={d} fill="none" />
            ))}
          </g>
          {/* Bunds between plots */}
          <path d="M0 430 C300 420 560 440 820 430 C1080 420 1250 436 1440 426" stroke="#f0f7ee" strokeOpacity="0.38" strokeWidth="3" fill="none" />
          <path d="M0 510 C260 498 600 522 880 510 C1130 499 1280 516 1440 504" stroke="#f0f7ee" strokeOpacity="0.28" strokeWidth="5" fill="none" />
          <path d="M0 592 C300 578 640 606 940 592 C1180 581 1300 598 1440 586" stroke="#f0f7ee" strokeOpacity="0.2" strokeWidth="6" fill="none" />
        </g>
        </g>
      </svg>
    </div>
  );
}

/**
 * Faint topographic contour texture. Abstract on purpose: we do not draw
 * administrative borders.
 */
export function TopoLines({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      <svg viewBox="0 0 520 380" className="h-full w-full">
        <g fill="none" stroke="#1a4577" strokeOpacity="0.1" strokeWidth="1.5">
          <path d="M20 300 C-20 200 60 88 190 62 C320 36 440 96 452 186 C464 288 330 366 180 336 C110 322 52 320 20 300 Z" />
          <path d="M62 284 C30 202 96 112 202 92 C306 72 402 118 412 190 C422 272 312 334 190 310 C134 299 88 300 62 284 Z" strokeDasharray="7 7" />
          <path d="M108 264 C86 202 134 136 212 122 C288 108 358 140 366 192 C374 250 292 296 204 280 C162 272 126 276 108 264 Z" strokeDasharray="4 8" />
          <path d="M156 242 C144 204 176 166 224 158 C272 150 314 170 318 200 C322 234 272 260 216 252 C190 248 166 252 156 242 Z" strokeDasharray="2 9" />
        </g>
      </svg>
    </div>
  );
}
