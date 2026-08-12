interface AureusLogoProps {
  size?: number
  className?: string
}

export function AureusLogo({ size = 32, className = '' }: AureusLogoProps) {
  const gradId = 'aureus-logo-grad'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Aureus Logo"
      style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 8px rgba(201, 168, 76, 0.35))' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCE592" />
          <stop offset="35%" stopColor="#E5C365" />
          <stop offset="70%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#997728" />
        </linearGradient>
      </defs>

      {/* Main stylized 'A' with financial growth arrow */}
      <g>
        {/* Left diagonal stem */}
        <path
          d="M16 80 L44 14 L56 14 L36 62 L26 52 L16 80 Z"
          fill={`url(#${gradId})`}
        />

        {/* Right diagonal stem (bottom segment) */}
        <path
          d="M62 58 L72 80 L84 80 L67 48 L62 58 Z"
          fill={`url(#${gradId})`}
        />

        {/* Right diagonal stem (top segment above arrow) */}
        <path
          d="M50 14 L56 14 L68 38 L60 44 L50 14 Z"
          fill={`url(#${gradId})`}
        />

        {/* Upward Trend Line and Arrow */}
        <path
          d="M36 62 L52 74 L80 40 L76 36 L52 64 L42 56 Z"
          fill={`url(#${gradId})`}
        />

        {/* Arrow Head */}
        <polygon
          points="86,30 68,36 78,46"
          fill={`url(#${gradId})`}
        />
      </g>
    </svg>
  )
}
