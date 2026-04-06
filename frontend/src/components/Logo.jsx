/**
 * Logo component — renders the Quantera wordmark or icon-only.
 * Usage:
 *   <Logo />              → full horizontal wordmark (default)
 *   <Logo iconOnly />     → just the Q icon square
 *   <Logo height={32} />  → custom size
 */

export default function Logo({ iconOnly = false, height = 36, style = {} }) {
  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        height={height}
        width={height}
        fill="none"
        style={style}
        aria-label="Quantera AI"
      >
        <defs>
          <linearGradient id="qGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1a6bff"/>
            <stop offset="100%" stopColor="#0050CB"/>
          </linearGradient>
          <linearGradient id="qShine" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white"/>
            <stop offset="100%" stopColor="transparent"/>
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="44" fill="url(#qGrad)"/>
        <rect width="200" height="200" rx="44" fill="url(#qShine)" opacity="0.12"/>
        <circle cx="90" cy="98" r="46" stroke="white" strokeWidth="16" fill="none"/>
        <line x1="122" y1="128" x2="158" y2="93" stroke="white" strokeWidth="16" strokeLinecap="round"/>
        <polyline points="145,79 158,93 144,106" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <polyline points="62,108 74,108 80,88 90,120 98,82 108,98 118,98" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.65"/>
      </svg>
    )
  }

  // Full horizontal wordmark
  const scale   = height / 72
  const w       = Math.round(340 * scale)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 340 72"
      height={height}
      width={w}
      fill="none"
      style={style}
      aria-label="Quantera AI"
    >
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a6bff"/>
          <stop offset="100%" stopColor="#0050CB"/>
        </linearGradient>
        <linearGradient id="wShine" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white"/>
          <stop offset="100%" stopColor="transparent"/>
        </linearGradient>
      </defs>
      {/* Icon block */}
      <rect x="0" y="4" width="64" height="64" rx="14" fill="url(#wGrad)"/>
      <rect x="0" y="4" width="64" height="64" rx="14" fill="url(#wShine)" opacity="0.12"/>
      <circle cx="29" cy="36" r="15" stroke="white" strokeWidth="5" fill="none"/>
      <line x1="39.5" y1="47" x2="52" y2="32.5" stroke="white" strokeWidth="5" strokeLinecap="round"/>
      <polyline points="45,24.5 52,32.5 44,39" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <polyline points="19,39 23,39 25,31 29,43 33,28 37,35 40,35" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7"/>
      {/* Wordmark */}
      <text x="80" y="47"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="28"
        fill="#161b2b"
        letterSpacing="-1.2">Quantera</text>
      {/* AI pill */}
      <rect x="289" y="22" width="36" height="20" rx="5" fill="#e8f0fe"/>
      <text x="297" y="36"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="#0050CB"
        letterSpacing="0.5">AI</text>
    </svg>
  )
}
