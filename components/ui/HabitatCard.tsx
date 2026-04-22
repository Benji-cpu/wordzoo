'use client';

import Link from 'next/link';

type LanguageKey = 'indonesian' | 'spanish' | 'japanese' | 'default';

interface HabitatCardProps {
  /** Emoji or small icon rendered in the left tile. */
  icon: string;
  label: string;
  title: string;
  /** 0–1 fractional progress. Omit to hide the progress bar. */
  progress?: number;
  href?: string;
  onClick?: () => void;
  language?: LanguageKey;
  /** Shown to the right of the title; optional secondary stat (e.g. "20 words"). */
  trailing?: string;
  className?: string;
}

const GRADIENT: Record<LanguageKey, string> = {
  default: 'var(--habitat-default)',
  indonesian: 'var(--habitat-indonesian)',
  spanish: 'var(--habitat-spanish)',
  japanese: 'var(--habitat-japanese)',
};

export function HabitatCard({
  icon,
  label,
  title,
  progress,
  href,
  onClick,
  language = 'default',
  trailing,
  className = '',
}: HabitatCardProps) {
  const body = (
    <>
      <div
        aria-hidden
        className="absolute -top-8 -right-5 w-32 h-32 rounded-full opacity-10 bg-white"
      />
      <div className="relative flex items-center gap-3 p-[14px] text-white">
        <div
          aria-hidden
          className="w-11 h-11 rounded-[14px] bg-white/25 backdrop-blur-sm flex items-center justify-center text-2xl flex-shrink-0"
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-extrabold tracking-[0.16em] uppercase opacity-90 mb-0.5">
            {label}
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-[15px] font-extrabold truncate">{title}</div>
            {trailing && (
              <div className="text-[11px] font-bold opacity-80 whitespace-nowrap">{trailing}</div>
            )}
          </div>
          {typeof progress === 'number' && (
            <div className="h-[4px] bg-white/30 rounded-full overflow-hidden mt-[6px]">
              <div
                className="h-full bg-white rounded-full transition-[width] duration-500"
                style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
              />
            </div>
          )}
        </div>
        <span
          aria-hidden
          className="w-[34px] h-[34px] rounded-full bg-white text-[color:var(--foreground)] flex items-center justify-center font-black text-base shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex-shrink-0"
        >
          ›
        </span>
      </div>
    </>
  );

  const shell = (
    <div
      className={`relative overflow-hidden rounded-[22px] shadow-[0_6px_14px_color-mix(in_srgb,var(--foreground)_8%,transparent)] ${className}`}
      style={{ background: GRADIENT[language] }}
    >
      {body}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[22px] active:scale-[0.99] transition-transform"
      >
        {shell}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[22px] active:scale-[0.99] transition-transform"
    >
      {shell}
    </button>
  );
}
