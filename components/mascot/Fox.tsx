/**
 * WordZoo mascot — a fox. Inline SVG so it can be animated via CSS.
 * Palette driven by CSS vars (--color-fox-primary/soft/deep) so it auto-themes.
 */

export type FoxPose =
  | 'idle'
  | 'thinking'
  | 'celebrating'
  | 'sad'
  | 'stretch'
  | 'wave'
  | 'sleeping'
  | 'proud';

export type FoxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<FoxSize, number> = {
  xs: 24,
  sm: 40,
  md: 96,
  lg: 160,
  xl: 240,
};

type Props = {
  pose?: FoxPose;
  size?: FoxSize;
  animate?: boolean;
  className?: string;
  'aria-label'?: string;
};

export function Fox({
  pose = 'idle',
  size = 'md',
  animate = true,
  className = '',
  'aria-label': ariaLabel = 'WordZoo fox mascot',
}: Props) {
  const px = SIZE_PX[size];
  const ambient =
    animate && (pose === 'idle' || pose === 'proud') ? 'animate-bob' : '';
  const wiggle = animate && pose === 'celebrating' ? 'animate-wiggle' : '';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      className={`${ambient} ${wiggle} ${className}`.trim()}
    >
      {/* Tail — behind body */}
      <FoxTail pose={pose} />

      {/* Body + chest */}
      <FoxBody pose={pose} />

      {/* Head group */}
      <g>
        {/* Ears (behind head) */}
        <FoxEars pose={pose} />
        {/* Head */}
        <FoxHead pose={pose} />
        {/* Cheek/mask patches */}
        <FoxMask pose={pose} />
        {/* Eyes */}
        <FoxEyes pose={pose} />
        {/* Nose + mouth */}
        <FoxMouth pose={pose} />
      </g>

      {/* Pose-specific accents */}
      {pose === 'wave' && <WavePaw />}
      {pose === 'sleeping' && <SleepZs />}
      {pose === 'thinking' && <ThoughtDots />}
      {pose === 'celebrating' && <Sparkles />}
      {pose === 'proud' && <ProudGlint />}
    </svg>
  );
}

/* ---------- body parts ---------- */

function FoxBody({ pose }: { pose: FoxPose }) {
  const stretched = pose === 'stretch';
  return (
    <g>
      <ellipse
        cx="60"
        cy={stretched ? 96 : 92}
        rx={stretched ? 34 : 28}
        ry={stretched ? 14 : 18}
        fill="var(--color-fox-primary, #F97316)"
      />
      {/* Chest patch */}
      <ellipse
        cx="60"
        cy={stretched ? 96 : 94}
        rx={stretched ? 18 : 14}
        ry={stretched ? 8 : 11}
        fill="#FFFFFF"
        opacity="0.95"
      />
    </g>
  );
}

function FoxTail({ pose }: { pose: FoxPose }) {
  const up = pose === 'celebrating' || pose === 'proud' || pose === 'wave';
  // Curvy tail — bezier. Raised when excited.
  const d = up
    ? 'M 32 86 C 10 72 12 54 24 46 C 32 54 36 66 36 82 Z'
    : 'M 32 92 C 10 92 8 78 20 70 C 26 78 32 84 36 92 Z';
  return (
    <g>
      <path d={d} fill="var(--color-fox-primary, #F97316)" />
      {/* White tail tip */}
      <circle cx={up ? 24 : 20} cy={up ? 46 : 70} r="6" fill="#FFFFFF" />
    </g>
  );
}

function FoxHead({ pose }: { pose: FoxPose }) {
  const tilt = pose === 'thinking' ? -6 : pose === 'sad' ? 4 : 0;
  return (
    <g transform={`rotate(${tilt} 60 58)`}>
      {/* Main head — inverted egg */}
      <path
        d="M 60 22 C 82 22 94 38 94 58 C 94 76 80 90 60 90 C 40 90 26 76 26 58 C 26 38 38 22 60 22 Z"
        fill="var(--color-fox-primary, #F97316)"
      />
      {/* Snout white patch */}
      <path
        d="M 44 64 C 44 76 52 86 60 86 C 68 86 76 76 76 64 C 76 60 68 58 60 58 C 52 58 44 60 44 64 Z"
        fill="#FFFFFF"
      />
    </g>
  );
}

function FoxEars({ pose }: { pose: FoxPose }) {
  const droopy = pose === 'sad' || pose === 'sleeping';
  if (droopy) {
    return (
      <g>
        <path d="M 28 40 L 22 60 L 40 50 Z" fill="var(--color-fox-primary, #F97316)" />
        <path d="M 92 40 L 98 60 L 80 50 Z" fill="var(--color-fox-primary, #F97316)" />
      </g>
    );
  }
  return (
    <g>
      <path d="M 30 38 L 24 12 L 48 28 Z" fill="var(--color-fox-primary, #F97316)" />
      <path
        d="M 33 32 L 30 18 L 42 28 Z"
        fill="var(--color-fox-deep, #9A3412)"
        opacity="0.6"
      />
      <path d="M 90 38 L 96 12 L 72 28 Z" fill="var(--color-fox-primary, #F97316)" />
      <path
        d="M 87 32 L 90 18 L 78 28 Z"
        fill="var(--color-fox-deep, #9A3412)"
        opacity="0.6"
      />
    </g>
  );
}

function FoxMask({ pose }: { pose: FoxPose }) {
  if (pose === 'sleeping') return null;
  return (
    <>
      {/* Cheek blush */}
      <circle cx="36" cy="60" r="5" fill="#FDA4AF" opacity="0.5" />
      <circle cx="84" cy="60" r="5" fill="#FDA4AF" opacity="0.5" />
    </>
  );
}

function FoxEyes({ pose }: { pose: FoxPose }) {
  if (pose === 'sleeping') {
    return (
      <g stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M 42 54 Q 48 58 54 54" />
        <path d="M 66 54 Q 72 58 78 54" />
      </g>
    );
  }
  if (pose === 'celebrating' || pose === 'proud') {
    // Happy closed-upward eyes
    return (
      <g stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M 42 54 Q 48 48 54 54" />
        <path d="M 66 54 Q 72 48 78 54" />
      </g>
    );
  }
  if (pose === 'thinking') {
    return (
      <g>
        <path
          d="M 42 54 Q 48 60 54 54"
          stroke="#1C1917"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="72" cy="54" rx="3" ry="4" fill="#1C1917" />
      </g>
    );
  }
  if (pose === 'sad') {
    return (
      <g>
        <ellipse cx="48" cy="56" rx="2.5" ry="3" fill="#1C1917" />
        <ellipse cx="72" cy="56" rx="2.5" ry="3" fill="#1C1917" />
        {/* Tear */}
        <circle cx="46" cy="64" r="2" fill="#60A5FA" />
      </g>
    );
  }
  // idle / stretch / wave — open eyes with highlight
  return (
    <g>
      <ellipse cx="48" cy="54" rx="3.2" ry="4" fill="#1C1917" />
      <ellipse cx="72" cy="54" rx="3.2" ry="4" fill="#1C1917" />
      <circle cx="49" cy="53" r="1" fill="#FFFFFF" />
      <circle cx="73" cy="53" r="1" fill="#FFFFFF" />
    </g>
  );
}

function FoxMouth({ pose }: { pose: FoxPose }) {
  const nose = <ellipse cx="60" cy="64" rx="3" ry="2.5" fill="#1C1917" />;
  let mouthPath = 'M 60 66 Q 60 74 54 74';
  if (pose === 'celebrating' || pose === 'wave' || pose === 'proud') {
    // Big smile / open
    mouthPath = 'M 52 70 Q 60 80 68 70';
  } else if (pose === 'thinking') {
    mouthPath = 'M 56 74 L 64 74';
  } else if (pose === 'sad') {
    mouthPath = 'M 54 76 Q 60 70 66 76';
  } else if (pose === 'sleeping') {
    mouthPath = 'M 58 74 Q 60 76 62 74';
  } else if (pose === 'stretch') {
    mouthPath = 'M 52 72 Q 60 82 68 72'; // yawn
  }
  return (
    <g>
      {nose}
      <path
        d={mouthPath}
        stroke="#1C1917"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill={pose === 'celebrating' || pose === 'stretch' ? '#1C1917' : 'none'}
      />
    </g>
  );
}

/* ---------- pose-specific accents ---------- */

function WavePaw() {
  return (
    <g className="origin-[96px_70px] animate-wiggle">
      <ellipse cx="100" cy="70" rx="8" ry="10" fill="var(--color-fox-primary, #F97316)" />
      <ellipse cx="100" cy="66" rx="5" ry="6" fill="#FFFFFF" opacity="0.8" />
    </g>
  );
}

function SleepZs() {
  return (
    <g fill="#78716C">
      <text x="88" y="24" fontSize="12" fontWeight="700">Z</text>
      <text x="98" y="16" fontSize="9" fontWeight="700">z</text>
    </g>
  );
}

function ThoughtDots() {
  return (
    <g fill="#78716C">
      <circle cx="92" cy="28" r="4" />
      <circle cx="104" cy="20" r="3" />
      <circle cx="112" cy="14" r="2" />
    </g>
  );
}

function Sparkles() {
  const star = (cx: number, cy: number, r: number, fill: string) => (
    <path
      d={`M ${cx} ${cy - r} L ${cx + r * 0.3} ${cy - r * 0.3} L ${cx + r} ${cy} L ${cx + r * 0.3} ${cy + r * 0.3} L ${cx} ${cy + r} L ${cx - r * 0.3} ${cy + r * 0.3} L ${cx - r} ${cy} L ${cx - r * 0.3} ${cy - r * 0.3} Z`}
      fill={fill}
    />
  );
  return (
    <g className="animate-pop">
      {star(18, 24, 5, 'var(--color-celebrate-gold, #FBBF24)')}
      {star(100, 20, 4, 'var(--color-celebrate-pink, #EC4899)')}
      {star(106, 60, 3, 'var(--color-celebrate-cyan, #06B6D4)')}
    </g>
  );
}

function ProudGlint() {
  return (
    <circle
      cx="100"
      cy="28"
      r="3"
      fill="var(--color-celebrate-gold, #FBBF24)"
    />
  );
}
