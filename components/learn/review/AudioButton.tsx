'use client';

interface AudioButtonProps {
  onPlay: () => void;
  playing?: boolean;
  label?: string;
  size?: 'md' | 'lg';
}

/** A big speaker button; the accessible name says what it plays. */
export function AudioButton({ onPlay, playing = false, label = 'Play audio', size = 'md' }: AudioButtonProps) {
  const dim = size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';
  const icon = size === 'lg' ? 34 : 24;
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={label}
      className={`${dim} shrink-0 grid place-items-center rounded-full bg-[color:var(--color-fox-soft)] text-[color:var(--color-fox-deep)] dark:text-[color:var(--color-fox-primary)] active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-fox-ring)] ${
        playing ? 'animate-pulse' : ''
      }`}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity={0.5} />
      </svg>
    </button>
  );
}
