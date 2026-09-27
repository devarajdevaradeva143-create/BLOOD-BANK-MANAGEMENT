export default function MedicalIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 400 320"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* soft background blobs */}
      <ellipse cx="200" cy="160" rx="170" ry="130" fill="#fee2e2" opacity="0.45" />
      <ellipse cx="200" cy="160" rx="120" ry="95" fill="#fecaca" opacity="0.35" />

      {/* IV stand */}
      <rect x="70" y="30" width="8" height="240" rx="4" fill="#94a3b8" opacity="0.6" />
      <rect x="48" y="262" width="52" height="8" rx="4" fill="#94a3b8" opacity="0.6" />
      <rect x="70" y="30" width="90" height="8" rx="4" fill="#94a3b8" opacity="0.6" />

      {/* blood bag */}
      <rect x="128" y="52" width="76" height="120" rx="14" fill="#fff1f2" stroke="#fda4af" strokeWidth="3" />
      <rect x="138" y="86" width="56" height="76" rx="8" fill="#dc2626" opacity="0.9" />
      <rect x="138" y="86" width="56" height="18" rx="8" fill="#f87171" opacity="0.8" />
      {/* measurement ticks */}
      <line x1="146" y1="96" x2="156" y2="96" stroke="#fecaca" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="110" x2="156" y2="110" stroke="#fecaca" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="124" x2="156" y2="124" stroke="#fecaca" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="138" x2="156" y2="138" stroke="#fecaca" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="152" x2="156" y2="152" stroke="#fecaca" strokeWidth="2.5" strokeLinecap="round" />
      {/* bag port */}
      <rect x="156" y="172" width="20" height="12" rx="3" fill="#fda4af" />
      {/* hanger */}
      <rect x="158" y="38" width="16" height="14" rx="3" fill="none" stroke="#94a3b8" strokeWidth="3" />

      {/* tube curving down to droplet */}
      <path
        d="M166 184 C166 220 166 232 210 236 C250 240 258 252 258 268"
        fill="none"
        stroke="#f87171"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M166 184 C166 220 166 232 210 236 C250 240 258 252 258 268"
        fill="none"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 8"
      />

      {/* droplet */}
      <path
        d="M258 272 c-12 14 -18 22 -18 31 a18 18 0 0 0 36 0 c0 -9 -6 -17 -18 -31 z"
        fill="#dc2626"
      />
      <ellipse cx="252" cy="301" rx="4" ry="6" fill="#fecaca" opacity="0.9" transform="rotate(-20 252 301)" />

      {/* medical cross badge */}
      <circle cx="306" cy="92" r="30" fill="#ffffff" stroke="#fecaca" strokeWidth="3" />
      <rect x="298" y="76" width="16" height="32" rx="3" fill="#dc2626" />
      <rect x="290" y="84" width="32" height="16" rx="3" fill="#dc2626" />

      {/* pulse line */}
      <polyline
        points="60,250 110,250 125,232 140,266 155,242 170,250 250,250 262,238 274,260 286,250 340,250"
        fill="none"
        stroke="#e11d48"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* small decorative drops */}
      <circle cx="110" cy="100" r="6" fill="#fda4af" opacity="0.7" />
      <circle cx="320" cy="200" r="8" fill="#fecaca" opacity="0.6" />
      <circle cx="96" cy="200" r="4" fill="#fda4af" opacity="0.5" />
    </svg>
  )
}
