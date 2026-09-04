export function ClipClapLogo({ className = "size-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-label="Logo ClipClap">
      <defs>
        <linearGradient id="clipclap-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF007F" />
          <stop offset="100%" stopColor="#8A2BE2" />
        </linearGradient>
        <filter id="clipclap-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#clipclap-glow)">
        {/* clap du haut */}
        <path
          d="M12 26 L80 14 L84 30 L16 42 Z"
          fill="url(#clipclap-grad)"
          transform="rotate(-4 48 28)"
        />
        <path d="M28 22 L34 37 M46 19 L52 34 M64 16 L70 31" stroke="#0B0E14" strokeWidth="4" />
        {/* corps */}
        <rect x="14" y="38" width="68" height="44" rx="10" fill="none" stroke="url(#clipclap-grad)" strokeWidth="4" />
        {/* play */}
        <path d="M42 50 L62 60 L42 70 Z" fill="url(#clipclap-grad)" />
      </g>
    </svg>
  );
}
