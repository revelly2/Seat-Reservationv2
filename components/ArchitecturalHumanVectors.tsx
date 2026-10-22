import React from 'react';

interface HumanVectorProps {
  className?: string;
  color?: string;
  accentColor?: string;
  size?: number;
}

/**
 * Architectural scale figure: Person walking in profile with smartphone (ticket in hand)
 */
export const HumanWalkingPhone: React.FC<HumanVectorProps> = ({
  className = '',
  color = '#161616',
  accentColor = '#E8590C',
  size = 64,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Human scale figure walking with phone"
    >
      {/* Head */}
      <circle cx="34" cy="14" r="7" fill={color} />
      {/* Neck & Torso */}
      <path
        d="M28 25 C28 23, 40 23, 40 25 L43 48 C43 51, 39 52, 34 52 C29 52, 25 51, 26 48 Z"
        fill={color}
      />
      {/* Left arm forward holding phone */}
      <path
        d="M38 27 L46 38 L51 36"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Smartphone emitting ticket glow */}
      <rect x="50" y="32" width="4.5" height="7" rx="1" fill={accentColor} />
      <line x1="52" y1="31" x2="55" y2="28" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* Right arm slightly back */}
      <path
        d="M27 27 L22 40 L19 46"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Stride legs: Forward leg */}
      <path
        d="M36 51 L43 70 L48 91 L54 91"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Back leg */}
      <path
        d="M29 51 L20 70 L14 91 L8 91"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Architectural scale figure: Attendee scanning ticket at optical turnstile barrier
 */
export const HumanScanningGate: React.FC<HumanVectorProps> = ({
  className = '',
  color = '#161616',
  accentColor = '#E8590C',
  size = 80,
}) => {
  return (
    <svg
      width={size * 1.3}
      height={size}
      viewBox="0 0 110 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Human scanning ticket at turnstile barrier"
    >
      {/* Turnstile Pedestal */}
      <rect x="74" y="44" width="22" height="50" fill="#161616" rx="2" />
      <rect x="76" y="46" width="18" height="6" fill="#2ECC40" opacity="0.9" />
      <rect x="80" y="56" width="10" height="2" fill="#D7D5CF" />
      {/* Optical scanning laser beam */}
      <path d="M68 36 L78 45 L88 45" stroke={accentColor} strokeWidth="2" strokeDasharray="3 2" />
      {/* Barrier gate arm */}
      <line x1="74" y1="52" x2="52" y2="40" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />

      {/* Human Head */}
      <circle cx="38" cy="14" r="7" fill={color} />
      {/* Body leaning forward slightly */}
      <path
        d="M32 25 C32 23, 44 23, 45 25 L48 49 C48 52, 43 53, 38 53 C33 53, 30 52, 30 49 Z"
        fill={color}
      />
      {/* Right arm extended downward holding smartphone over scanner */}
      <path
        d="M44 28 L58 35 L68 35"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Smartphone */}
      <rect x="67" y="32" width="7" height="4.5" rx="1" fill={accentColor} />
      {/* Left arm relaxed at side */}
      <path
        d="M32 27 L28 42 L29 48"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Legs standing poised */}
      <path
        d="M41 52 L44 72 L46 94 L53 94"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 52 L31 72 L30 94 L24 94"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ground reference shadow line */}
      <line x1="16" y1="94" x2="102" y2="94" stroke={color} strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
};

/**
 * Architectural scale figure: Spectator seated in arena seating tier
 */
export const HumanSeatedSpectator: React.FC<HumanVectorProps> = ({
  className = '',
  color = '#161616',
  accentColor = '#E8590C',
  size = 64,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Human seated spectator"
    >
      {/* Stadium Tiered Seat outline */}
      <path
        d="M14 28 L14 54 L44 54 L44 76"
        stroke="#161616"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="11" y="24" width="7" height="32" rx="2" fill={accentColor} opacity="0.3" />
      <rect x="14" y="52" width="30" height="6" rx="2" fill={accentColor} opacity="0.3" />

      {/* Head */}
      <circle cx="28" cy="12" r="6.5" fill={color} />
      {/* Torso upright / leaning back against seat */}
      <path
        d="M22 22 C22 20, 34 20, 35 22 L37 46 C37 48, 33 49, 28 49 C23 49, 21 48, 21 46 Z"
        fill={color}
      />
      {/* Arm resting on lap */}
      <path
        d="M31 24 L38 34 L32 44"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Seated Thigh horizontal */}
      <path
        d="M28 48 L46 50"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Lower Leg vertical & foot */}
      <path
        d="M46 50 L46 74 L54 74"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Architectural scale figure: Cheering Arena Fan with arms raised
 */
export const HumanCheeringFan: React.FC<HumanVectorProps> = ({
  className = '',
  color = '#161616',
  accentColor = '#E8590C',
  size = 64,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Human cheering arena fan"
    >
      {/* Head */}
      <circle cx="36" cy="22" r="6.5" fill={color} />
      {/* Both arms raised triumphantly */}
      <path
        d="M30 32 L16 16 L12 6"
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 32 L56 16 L60 6"
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Torso */}
      <path
        d="M30 30 C30 28, 42 28, 42 30 L44 56 C44 59, 39 60, 36 60 C33 60, 28 59, 28 56 Z"
        fill={color}
      />
      {/* Energetic legs stance */}
      <path
        d="M39 59 L46 76 L50 94 L57 94"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 59 L26 76 L22 94 L15 94"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Architectural scale figure: Operator / Supervisor holding arena telemetry tablet
 */
export const HumanOperatorSupervisor: React.FC<HumanVectorProps> = ({
  className = '',
  color = '#161616',
  accentColor = '#E8590C',
  size = 64,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Human arena supervisor with telemetry tablet"
    >
      {/* Head */}
      <circle cx="32" cy="14" r="7" fill={color} />
      {/* Hard hat / headset accent */}
      <path d="M24 12 C24 8, 40 8, 40 12" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
      {/* Torso */}
      <path
        d="M26 24 C26 22, 38 22, 38 24 L40 50 C40 53, 36 54, 32 54 C28 54, 24 53, 24 50 Z"
        fill={color}
      />
      {/* Hi-vis brutalist vest lines */}
      <line x1="28" y1="28" x2="30" y2="50" stroke={accentColor} strokeWidth="2" />
      <line x1="36" y1="28" x2="34" y2="50" stroke={accentColor} strokeWidth="2" />
      {/* Both arms holding tablet in front */}
      <path
        d="M26 28 L20 40 L30 42"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M38 28 L44 40 L34 42"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Tablet display */}
      <rect x="26" y="38" width="12" height="8" rx="1" fill="#161616" stroke={accentColor} strokeWidth="1.5" />
      {/* Upright legs */}
      <path
        d="M35 53 L36 74 L37 93 L43 93"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29 53 L28 74 L27 93 L21 93"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Architectural scale dimension box: Modernist elevation scale reference figure with measurement ticks
 */
export const HumanScaleDimensionBox: React.FC<{
  label?: string;
  metric?: string;
  heightMm?: number;
}> = ({ label = 'HUMAN ENTOURAGE', metric = '1.78m SCALE', heightMm = 90 }) => {
  return (
    <div className="relative border-2 border-[#161616] bg-[#C8C5BD] p-3 flex items-center justify-between overflow-hidden shadow-concrete-sm font-mono-spec">
      <div className="flex items-center gap-3">
        <div className="relative">
          <HumanWalkingPhone size={heightMm} color="#161616" accentColor="#E8590C" />
          {/* Vertical measurement dimension line */}
          <div className="absolute -left-2 top-1 bottom-1 flex flex-col justify-between items-center text-[8px] text-[#555] font-bold">
            <span className="w-1.5 h-[1px] bg-[#161616]" />
            <div className="w-[1px] flex-1 bg-[#161616] my-0.5" />
            <span className="w-1.5 h-[1px] bg-[#161616]" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[9px] tracking-widest text-[#E8590C] font-bold uppercase">
            REF: ARCH-SCALE // 1:50
          </div>
          <div className="font-anton text-sm uppercase text-[#161616] tracking-wider">
            {label}
          </div>
          <div className="text-[10px] text-[#444] font-bold uppercase">
            {metric} • ISO 7000 SPEC
          </div>
        </div>
      </div>

      {/* Decorative technical crosshairs */}
      <div className="hidden sm:flex flex-col items-end gap-1 text-[9px] text-[#555]">
        <span className="px-1.5 py-0.5 bg-[#161616] text-[#D7D5CF] font-bold">Z-AXIS 0.00</span>
        <span className="text-[8px] font-bold tracking-widest uppercase">TURNSTILE CLEARANCE: 850mm</span>
      </div>
    </div>
  );
};

/**
 * Full Width Architectural Horizon: Entourage of minimalist humans interacting across arena concourse
 */
export const ArchitecturalConcourseBand: React.FC<{
  totalCapacity?: number;
  occupancyPercent?: number;
}> = ({ totalCapacity = 80, occupancyPercent = 0 }) => {
  return (
    <div className="relative w-full bg-[#161616] text-[#D7D5CF] border-2 border-[#161616] p-4 overflow-hidden shadow-concrete">
      {/* Background Architectural Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        {/* Technical Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2ECC40] animate-pulse" />
            <span className="text-[10px] tracking-widest text-[#E8590C] font-bold uppercase">
              ARENA ENTOURAGE & SPECTATOR FLOW // UNIVERSITY OF ABRA ARENA
            </span>
          </div>
          <h3 className="font-anton text-lg tracking-wider uppercase text-[#FFFFFF]">
            AUDIENCE ELEVATION & CAPACITY VISUALIZATION
          </h3>
          <p className="text-xs text-[#BCB9B0] max-w-xl">
            Live turnstile influx and human scale representation across VIP, Orchestra, and Balcony concourse zones.
          </p>
        </div>

        {/* Live metric badge */}
        <div className="flex items-center gap-3 bg-[#2A2926] border border-[#555] px-3 py-2 self-start md:self-end">
          <div className="text-right">
            <div className="text-[9px] text-[#999] uppercase font-bold tracking-widest">CURRENT OCCUPANCY</div>
            <div className="font-anton text-xl text-[#E8590C] tracking-wide">{occupancyPercent}%</div>
          </div>
          <div className="h-8 w-[1px] bg-[#555]" />
          <div>
            <div className="text-[9px] text-[#999] uppercase font-bold tracking-widest">ARENA CAPACITY</div>
            <div className="font-anton text-xl text-[#FFFFFF] tracking-wide">{totalCapacity} SEATS</div>
          </div>
        </div>
      </div>

      {/* Human Scale Parade Silhouette Graphic */}
      <div className="relative mt-6 pt-2 pb-0 flex items-end justify-between border-b-2 border-[#D7D5CF]/40 overflow-x-auto min-w-[600px]">
        {/* Zone 1: Concourse Entrance / Scanner */}
        <div className="flex items-end gap-2 pr-6 border-r border-[#444]">
          <div className="text-center">
            <div className="text-[8px] text-[#E8590C] font-bold uppercase mb-1">GATE A SCAN</div>
            <HumanScanningGate size={68} color="#D7D5CF" accentColor="#E8590C" />
          </div>
          <div className="text-center">
            <div className="text-[8px] text-[#888] font-bold uppercase mb-1">WALK-IN</div>
            <HumanWalkingPhone size={64} color="#D7D5CF" accentColor="#E8590C" />
          </div>
        </div>

        {/* Zone 2: Concourse Promenade & Supervisor */}
        <div className="flex items-end gap-4 px-6 border-r border-[#444]">
          <div className="text-center">
            <div className="text-[8px] text-[#E8590C] font-bold uppercase mb-1">FLOOR SUPV</div>
            <HumanOperatorSupervisor size={66} color="#D7D5CF" accentColor="#E8590C" />
          </div>
          <div className="text-center">
            <div className="text-[8px] text-[#888] font-bold uppercase mb-1">SPECTATOR</div>
            <HumanWalkingPhone size={62} color="#D7D5CF" accentColor="#E8590C" />
          </div>
        </div>

        {/* Zone 3: Seated VIP & Orchestra */}
        <div className="flex items-end gap-3 px-6 border-r border-[#444]">
          <div className="text-center">
            <div className="text-[8px] text-[#E8590C] font-bold uppercase mb-1">VIP PATRON</div>
            <HumanSeatedSpectator size={58} color="#D7D5CF" accentColor="#E8590C" />
          </div>
          <div className="text-center">
            <div className="text-[8px] text-[#888] font-bold uppercase mb-1">LOWER BOX</div>
            <HumanSeatedSpectator size={58} color="#D7D5CF" accentColor="#E8590C" />
          </div>
        </div>

        {/* Zone 4: Cheering Bleachers Grandstand */}
        <div className="flex items-end gap-3 pl-6">
          <div className="text-center">
            <div className="text-[8px] text-[#2ECC40] font-bold uppercase mb-1">FAN ZONE</div>
            <HumanCheeringFan size={68} color="#D7D5CF" accentColor="#E8590C" />
          </div>
          <div className="text-center">
            <div className="text-[8px] text-[#888] font-bold uppercase mb-1">CHEERING</div>
            <HumanCheeringFan size={62} color="#D7D5CF" accentColor="#E8590C" />
          </div>
          <div className="text-center">
            <div className="text-[8px] text-[#888] font-bold uppercase mb-1">BALCONY</div>
            <HumanSeatedSpectator size={54} color="#D7D5CF" accentColor="#E8590C" />
          </div>
        </div>
      </div>

      {/* Ground Line Reference & Elevation Marker */}
      <div className="flex items-center justify-between text-[8px] tracking-widest text-[#888] uppercase pt-1.5 font-mono-spec">
        <span>▼ DATUM: LEVEL 0.00 CONCOURSE GROUND</span>
        <span>OPTICAL TURNSTILE CHECK-IN FLOW</span>
        <span>▲ LEVEL +3.20m ARENA BOWL TIER</span>
      </div>
    </div>
  );
};
