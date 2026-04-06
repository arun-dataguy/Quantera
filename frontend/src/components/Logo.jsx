/**
 * Logo component — uses the real Quantera SVG assets.
 *
 * Props:
 *   variant  "default" | "white" | "icon"
 *             default → quantera-logo.svg       (dark text, light backgrounds)
 *             white   → quantera-logo-white.svg  (all-white, dark backgrounds)
 *             icon    → quantera-icon.svg        (square icon only, any bg)
 *   height   number (px) — default 36
 *   style    extra inline styles
 */

import logoDefault from '../assets/quantera-logo.svg'
import logoWhite   from '../assets/quantera-logo-white.svg'
import logoIcon    from '../assets/quantera-icon.svg'

const ASPECT = { default: 320 / 80, white: 320 / 80, icon: 1 }

export default function Logo({ variant = 'default', height = 36, style = {} }) {
  const src = variant === 'white' ? logoWhite
            : variant === 'icon'  ? logoIcon
            : logoDefault

  const width = Math.round(height * ASPECT[variant] || height)

  return (
    <img
      src={src}
      alt="Quantera AI"
      height={height}
      width={width}
      style={{ display: 'block', ...style }}
    />
  )
}
