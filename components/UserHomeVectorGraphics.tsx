import React from 'react';

interface VectorProps {
  className?: string;
  size?: number;
  color?: string;
  accentColor?: string;
}

/**
 * Modernist Brutalist Arena Architectural Isometric Cutaway
 * Illustrates the physical University of Abra Arena bowl, seating tiers, court, and human scale entourage.
 */
export const ArenaArchitecturalIsometric: React.FC<VectorProps> = ({
  className = '',
  accentColor = '#E8590C',
}) => {
  return (
    <svg
      viewBox="0 0 600 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto ${className}`}
      aria-label="University of Abra Arena Architectural Isometric Cutaway"
    >
      <defs>
        {/* Arena Floodlight Conical Gradient */}
        <linearGradient id="lightBeamLeft" x1="60" y1="20" x2="240" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lightBeamRight" x1="540" y1="20" x2="360" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
        <pattern id="concreteGridPattern" width="16" height="16" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="16" y2="0" stroke="#161616" strokeWidth="0.5" strokeOpacity="0.12" />
          <line x1="0" y1="0" x2="0" y2="16" stroke="#161616" strokeWidth="0.5" strokeOpacity="0.12" />
        </pattern>
      </defs>

      {/* Background Architectural Grid */}
      <rect x="10" y="10" width="580" height="320" fill="url(#concreteGridPattern)" />

      {/* Floodlight Beams */}
      <polygon points="50,15 90,15 290,260 210,260" fill="url(#lightBeamLeft)" />
      <polygon points="550,15 510,15 310,260 390,260" fill="url(#lightBeamRight)" />

      {/* Outer Stadium Concrete Parapet / Structure */}
      <polygon
        points="300,50 560,140 560,180 300,270 40,180 40,140"
        fill="#C8C5BD"
        stroke="#161616"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Stadium Foundation Facet (South) */}
      <polygon
        points="40,180 300,270 300,310 40,220"
        fill="#B8B5AD"
        stroke="#161616"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Stadium Foundation Facet (East) */}
      <polygon
        points="300,270 560,180 560,220 300,310"
        fill="#A8A59D"
        stroke="#161616"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Tier 3: Upper Bleachers Tier */}
      <polygon
        points="300,75 520,150 300,225 80,150"
        fill="#D7D5CF"
        stroke="#161616"
        strokeWidth="2.5"
      />

      {/* Tier 2: Lower Box Orchestra Tier */}
      <polygon
        points="300,100 480,160 300,220 120,160"
        fill="#BCB9B0"
        stroke="#161616"
        strokeWidth="2.5"
      />

      {/* Tier 1: VIP Patron Courtside Ring */}
      <polygon
        points="300,125 440,170 300,215 160,170"
        fill="#2A2926"
        stroke="#161616"
        strokeWidth="2.5"
      />

      {/* Central Court / Stage Floor */}
      <polygon
        points="300,145 400,180 300,215 200,180"
        fill={accentColor}
        stroke="#161616"
        strokeWidth="2.5"
      />

      {/* Court Key Lines & Center Circle */}
      <ellipse cx="300" cy="180" rx="32" ry="12" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.9" />
      <line x1="300" y1="145" x2="300" y2="215" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2" />

      {/* Seating Tier Steps & Isometric Rows */}
      {/* Bleachers Rows */}
      <path d="M 100 145 L 300 78 L 500 145" stroke="#161616" strokeWidth="1.5" opacity="0.4" />
      <path d="M 115 152 L 300 90 L 485 152" stroke="#161616" strokeWidth="1.5" opacity="0.4" />
      {/* Lower Box Rows */}
      <path d="M 135 160 L 300 105 L 465 160" stroke="#161616" strokeWidth="1.5" opacity="0.6" />
      <path d="M 150 166 L 300 116 L 450 166" stroke="#161616" strokeWidth="1.5" opacity="0.6" />

      {/* Minimalist Spectator Silhouettes Seated in Tiers */}
      {/* VIP Ring Spectators */}
      <circle cx="215" cy="172" r="2.5" fill="#FFFFFF" />
      <circle cx="235" cy="166" r="2.5" fill="#FFFFFF" />
      <circle cx="255" cy="160" r="2.5" fill="#FFFFFF" />
      <circle cx="345" cy="160" r="2.5" fill="#FFFFFF" />
      <circle cx="365" cy="166" r="2.5" fill="#FFFFFF" />
      <circle cx="385" cy="172" r="2.5" fill="#FFFFFF" />

      {/* Lower Box Spectators */}
      <circle cx="160" cy="158" r="2" fill="#161616" />
      <circle cx="180" cy="150" r="2" fill="#161616" />
      <circle cx="200" cy="142" r="2" fill="#161616" />
      <circle cx="400" cy="142" r="2" fill="#161616" />
      <circle cx="420" cy="150" r="2" fill="#161616" />
      <circle cx="440" cy="158" r="2" fill="#161616" />

      {/* Bleachers Cheering Fans (Raised Arms Vectors) */}
      <g opacity="0.85">
        <circle cx="130" cy="138" r="2.5" fill="#161616" />
        <line x1="128" y1="138" x2="125" y2="133" stroke="#161616" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="132" y1="138" x2="135" y2="133" stroke="#161616" strokeWidth="1.2" strokeLinecap="round" />

        <circle cx="155" cy="128" r="2.5" fill="#161616" />
        <line x1="153" y1="128" x2="150" y2="123" stroke="#161616" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="157" y1="128" x2="160" y2="123" stroke="#161616" strokeWidth="1.2" strokeLinecap="round" />

        <circle cx="445" cy="128" r="2.5" fill="#161616" />
        <line x1="443" y1="128" x2="440" y2="123" stroke="#161616" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="447" y1="128" x2="450" y2="123" stroke="#161616" strokeWidth="1.2" strokeLinecap="round" />

        <circle cx="470" cy="138" r="2.5" fill="#161616" />
        <line x1="468" y1="138" x2="465" y2="133" stroke="#161616" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="472" y1="138" x2="475" y2="133" stroke="#161616" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Concourse Level Entrance & Optical Turnstile Gate */}
      <polygon
        points="300,270 380,242 420,256 340,284"
        fill="#FFFFFF"
        stroke="#161616"
        strokeWidth="2"
      />
      {/* Optical Barrier Gate Pods */}
      <rect x="340" y="258" width="5" height="12" fill="#161616" rx="1" />
      <rect x="352" y="254" width="5" height="12" fill="#161616" rx="1" />
      <line x1="345" y1="262" x2="352" y2="260" stroke="#2ECC40" strokeWidth="2" />

      {/* Human Entering Gate in Isometric Silhouette */}
      <circle cx="330" cy="265" r="3" fill="#161616" />
      <line x1="330" y1="268" x2="333" y2="278" stroke="#161616" strokeWidth="2" strokeLinecap="round" />
      <line x1="333" y1="272" x2="340" y2="267" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />

      {/* Architectural Dimension Ticks & Callouts */}
      <g className="font-mono text-[9px] font-bold">
        {/* VIP Callout */}
        <line x1="160" y1="170" x2="90" y2="190" stroke="#161616" strokeWidth="1.5" />
        <rect x="25" y="184" width="85" height="18" fill="#161616" />
        <text x="67" y="196" fill="#FFFFFF" textAnchor="middle" fontSize="8" fontWeight="bold">
          VIP BLOCK (₱250)
        </text>

        {/* Bleachers Callout */}
        <line x1="480" y1="110" x2="520" y2="85" stroke="#161616" strokeWidth="1.5" />
        <rect x="490" y="72" width="95" height="18" fill="#161616" />
        <text x="537" y="84" fill="#FFFFFF" textAnchor="middle" fontSize="8" fontWeight="bold">
          CORNER BLOCKS
        </text>

        {/* Turnstile Access Callout */}
        <line x1="345" y1="274" x2="345" y2="305" stroke={accentColor} strokeWidth="1.5" />
        <rect x="290" y="300" width="110" height="18" fill={accentColor} stroke="#161616" strokeWidth="1.5" />
        <text x="345" y="312" fill="#FFFFFF" textAnchor="middle" fontSize="8" fontWeight="bold">
          OPTICAL GATE A // QR SCAN
        </text>
      </g>

      {/* Arena Compass & Datum Stamp */}
      <g transform="translate(30, 30)">
        <circle cx="16" cy="16" r="14" fill="#D7D5CF" stroke="#161616" strokeWidth="2" />
        <line x1="16" y1="4" x2="16" y2="28" stroke="#161616" strokeWidth="1.5" />
        <line x1="4" y1="16" x2="28" y2="16" stroke="#161616" strokeWidth="1.5" />
        <polygon points="16,4 19,12 13,12" fill={accentColor} />
        <text x="16" y="3" textAnchor="middle" fontSize="7" fill="#161616" fontWeight="bold">
          N
        </text>
      </g>
    </svg>
  );
};

/**
 * Modernist Vector Illustration: Turnstile Barrier Gate & QR Ticket Validation
 */
export const TurnstileGateVectorIllustration: React.FC<VectorProps> = ({
  className = '',
  accentColor = '#E8590C',
}) => {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto ${className}`}
      aria-label="Contactless Gate Barrier Turnstile Illustration"
    >
      {/* Ground Plane */}
      <line x1="20" y1="190" x2="300" y2="190" stroke="#161616" strokeWidth="3" />
      <line x1="20" y1="198" x2="300" y2="198" stroke="#161616" strokeWidth="1" strokeDasharray="4 4" />

      {/* Optical Turnstile Left Pod */}
      <rect x="140" y="80" width="36" height="110" fill="#161616" rx="2" />
      <rect x="144" y="86" width="28" height="14" fill="#2ECC40" />
      <text x="158" y="96" fill="#161616" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        PASS ✓
      </text>

      {/* Laser scanner glass window */}
      <rect x="145" y="108" width="26" height="8" fill="#333" />
      <line x1="148" y1="112" x2="168" y2="112" stroke={accentColor} strokeWidth="2" strokeDasharray="3 2" />

      {/* Barrier Gate Arm in UP (Open) Position */}
      <line x1="140" y1="100" x2="105" y2="55" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
      <circle cx="140" cy="100" r="4" fill="#FFFFFF" stroke="#161616" strokeWidth="2" />

      {/* Turnstile Right Pod (Matching Lane) */}
      <rect x="230" y="80" width="36" height="110" fill="#2A2926" rx="2" stroke="#161616" strokeWidth="2" />
      <rect x="234" y="86" width="28" height="14" fill="#3A3936" />

      {/* Minimalist Human Walking Through Barrier */}
      {/* Head */}
      <circle cx="85" cy="55" r="10" fill="#161616" />
      {/* Torso */}
      <path d="M76 72 C76 68, 94 68, 94 72 L97 114 C97 118, 92 120, 85 120 C78 120, 73 118, 73 114 Z" fill="#161616" />
      {/* Arm forward with phone */}
      <path d="M92 76 L110 92 L128 88" stroke="#161616" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Phone emitting green beam */}
      <rect x="126" y="82" width="9" height="14" rx="2" fill={accentColor} />
      <path d="M135 90 L146 108" stroke="#2ECC40" strokeWidth="2" strokeDasharray="2 2" />
      {/* Back arm swinging */}
      <path d="M75 76 L66 98 L60 110" stroke="#161616" strokeWidth="4.5" strokeLinecap="round" />
      {/* Legs in forward stride through turnstile */}
      <path d="M88 118 L104 150 L115 190 L128 190" stroke="#161616" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M78 118 L64 150 L52 190 L42 190" stroke="#161616" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Passage arrow indicator */}
      <path d="M190 150 L205 150 L200 144 M205 150 L200 156" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="198" y="170" fill="#161616" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        LANE 01
      </text>
    </svg>
  );
};

/**
 * Modernist Vector Illustration: Arena Seat Selection & 10-Minute Hold Lock
 */
export const SeatSelectionHoldVector: React.FC<VectorProps> = ({
  className = '',
  accentColor = '#E8590C',
}) => {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto ${className}`}
      aria-label="Seat Selection and Instant Hold Vector"
    >
      {/* Stadium Tier Step Profile */}
      <path
        d="M30 180 L110 180 L110 130 L190 130 L190 80 L290 80"
        stroke="#161616"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tier 1 Seat (Available) */}
      <g transform="translate(45, 125)">
        <rect x="0" y="0" width="10" height="35" rx="2" fill="#D7D5CF" stroke="#161616" strokeWidth="2" />
        <rect x="8" y="25" width="28" height="10" rx="2" fill="#D7D5CF" stroke="#161616" strokeWidth="2" />
        <line x1="28" y1="35" x2="28" y2="55" stroke="#161616" strokeWidth="3" />
      </g>

      {/* Tier 2 Seat (Selected / Held by User with Orange Glow) */}
      <g transform="translate(125, 75)">
        <rect x="0" y="0" width="12" height="38" rx="2" fill={accentColor} stroke="#161616" strokeWidth="2" />
        <rect x="10" y="26" width="32" height="12" rx="2" fill={accentColor} stroke="#161616" strokeWidth="2" />
        <line x1="32" y1="38" x2="32" y2="55" stroke="#161616" strokeWidth="3" />

        {/* Lock / Security Shield Badge floating above */}
        <g transform="translate(8, -32)">
          <rect x="0" y="0" width="34" height="24" rx="2" fill="#161616" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M12 10 C12 7, 22 7, 22 10 L22 13 L12 13 Z" stroke={accentColor} strokeWidth="1.5" fill="none" />
          <text x="17" y="19" fill={accentColor} fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            10m
          </text>
        </g>
      </g>

      {/* Minimalist Human Hand Selecting Seat */}
      <g transform="translate(200, 30)">
        <circle cx="70" cy="30" r="9" fill="#161616" />
        <path d="M60 48 C60 44, 80 44, 80 48 L82 85 L60 85 Z" fill="#161616" />
        {/* Arm extending toward seat */}
        <path d="M62 52 L35 70 L-20 86" stroke="#161616" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-22" cy="86" r="3.5" fill={accentColor} />
      </g>

      {/* Concurrency Indicator */}
      <g transform="translate(30, 25)">
        <rect x="0" y="0" width="130" height="24" fill="#C8C5BD" stroke="#161616" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" fill="#2ECC40" />
        <text x="24" y="16" fill="#161616" fontSize="8" fontWeight="bold" fontFamily="monospace">
          REALTIME ROW-LOCK ACTIVE
        </text>
      </g>
    </svg>
  );
};

/**
 * Modernist Vector Illustration: Arena Fan Celebration & Atmosphere
 */
export const ArenaAtmosphereFanVector: React.FC<VectorProps> = ({
  className = '',
  accentColor = '#E8590C',
}) => {
  return (
    <svg
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto ${className}`}
      aria-label="Arena Fan Atmosphere and Cheering Crowd"
    >
      {/* Tiered bleachers grandstand line */}
      <path d="M10 160 L310 160" stroke="#161616" strokeWidth="3" />
      <path d="M10 120 L310 120" stroke="#161616" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Cheering Fan 1 (Left) */}
      <g transform="translate(40, 60)">
        <circle cx="20" cy="15" r="7" fill="#161616" />
        <path d="M14 26 L4 10 L0 2" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M26 26 L36 10 L40 2" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M14 25 C14 23, 26 23, 26 25 L28 58 L12 58 Z" fill="#161616" />
        <path d="M15 58 L10 100" stroke="#161616" strokeWidth="4" strokeLinecap="round" />
        <path d="M25 58 L30 100" stroke="#161616" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Center Fan (High energy celebration) */}
      <g transform="translate(130, 45)">
        <circle cx="25" cy="15" r="8" fill="#161616" />
        {/* Banner held above */}
        <polygon points="5, -10 50, -10 45, 2 10, 2" fill={accentColor} stroke="#161616" strokeWidth="1.5" />
        <text x="27" y="-2" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          ABRA
        </text>
        <path d="M16 28 L10 2 M34 28 L40 2" stroke="#161616" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M16 28 C16 25, 34 25, 34 28 L36 68 L14 68 Z" fill="#161616" />
        <path d="M18 68 L12 115" stroke="#161616" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M32 68 L38 115" stroke="#161616" strokeWidth="4.5" strokeLinecap="round" />
      </g>

      {/* Cheering Fan 3 (Right) */}
      <g transform="translate(230, 60)">
        <circle cx="20" cy="15" r="7" fill="#161616" />
        <path d="M14 26 L6 8" stroke="#161616" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M26 26 L38 8 L44 0" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M14 25 C14 23, 26 23, 26 25 L28 58 L12 58 Z" fill="#161616" />
        <path d="M15 58 L12 100" stroke="#161616" strokeWidth="4" strokeLinecap="round" />
        <path d="M25 58 L28 100" stroke="#161616" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
};
