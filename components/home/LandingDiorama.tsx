/** Quiet work-cell preview for the product window. */

export function LandingDiorama() {
  return (
    <div className="relative bg-[#08090c]">
      <svg viewBox="0 0 420 240" className="h-auto w-full" aria-hidden role="presentation">
        <defs>
          <linearGradient id="tableTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#141820" />
            <stop offset="100%" stopColor="#0c1016" />
          </linearGradient>
        </defs>
        <ellipse cx="210" cy="188" rx="148" ry="18" fill="#00AEEF" opacity="0.06" />
        <path d="M70 158 L210 112 L350 158 L210 204 Z" fill="url(#tableTop)" stroke="#ffffff" strokeOpacity="0.08" />
        <path d="M70 158 L70 172 L210 218 L210 204 Z" fill="#0a0d12" />
        <path d="M350 158 L350 172 L210 218 L210 204 Z" fill="#080b10" />
        <ellipse cx="268" cy="166" rx="26" ry="9" fill="none" stroke="#F7941E" strokeOpacity="0.7" strokeWidth="1.2" />
        <g className="landing-lift">
          <rect x="148" y="144" width="15" height="15" fill="#00AEEF" rx="2" />
        </g>
        <rect x="176" y="148" width="15" height="15" fill="#F7941E" rx="2" />
        <rect x="204" y="146" width="15" height="15" fill="#E11D8F" rx="2" />
        <g className="landing-reach">
          <rect x="78" y="118" width="16" height="40" rx="3" fill="#1a222c" />
          <rect x="82" y="90" width="9" height="34" rx="2" fill="#00AEEF" opacity="0.85" />
          <rect x="86" y="72" width="50" height="9" rx="2" fill="#00AEEF" />
          <rect x="128" y="68" width="26" height="7" rx="1" fill="#E8EEF5" />
        </g>
      </svg>
    </div>
  );
}
