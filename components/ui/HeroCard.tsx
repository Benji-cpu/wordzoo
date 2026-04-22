'use client';

import Link from 'next/link';

type LanguageKey = 'indonesian' | 'spanish' | 'japanese' | 'default';

interface HeroCardProps {
  /** Small uppercase eyebrow (e.g. "Continue"). */
  label?: string;
  title: string;
  /** Secondary description below title. */
  subtitle?: string;
  /** 0–1 fractional progress bar. Omit to hide the bar. */
  progress?: number;
  /** CTA copy shown at the bottom of the card. */
  ctaText?: string;
  /** Where the card links to. If omitted, renders as a button. */
  href?: string;
  onClick?: () => void;
  /** Habitat gradient to use for the card background. */
  language?: LanguageKey;
  className?: string;
}

const GRADIENT: Record<LanguageKey, string> = {
  default: 'var(--habitat-default)',
  indonesian: 'var(--habitat-indonesian)',
  spanish: 'var(--habitat-spanish)',
  japanese: 'var(--habitat-japanese)',
};

const INK: Record<LanguageKey, string> = {
  default: 'var(--accent-indonesian)',
  indonesian: 'var(--accent-indonesian)',
  spanish: 'var(--accent-spanish)',
  japanese: 'var(--accent-japanese)',
};

export function HeroCard({
  label,
  title,
  subtitle,
  progress,
  ctaText = 'Continue',
  href,
  onClick,
  language = 'default',
  className = '',
}: HeroCardProps) {
  const body = (
    <>
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10 bg-white"
      />
      <div
        aria-hidden
        className="absolute -bottom-8 left-1/3 w-20 h-20 rounded-full opacity-10 bg-white"
      />
      <div className="relative">
        {label && (
          <div className="text-[10px] font-extrabold tracking-[0.18em] uppercase opacity-90 mb-1 text-white">
            {label}
          </div>
        )}
        <div className="text-[20px] font-extrabold leading-tight tracking-tight text-white mb-0.5">
          {title}
        </div>
        {subtitle && (
          <div className="text-[12.5px] font-semibold opacity-85 mb-3.5 text-white">{subtitle}</div>
        )}
        {typeof progress === 'number' && (
          <div className="h-[5px] bg-white/30 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-extrabold tracking-wide text-white">{ctaText}</span>
          <span
            aria-hidden
            className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center font-black text-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
            style={{ color: INK[language] }}
          >
            ›
          </span>
        </div>
      </div>
    </>
  );

  const shell = (
    <div
      className={`relative overflow-hidden rounded-[22px] p-[18px] shadow-[0_8px_20px_color-mix(in_srgb,var(--accent-indonesian)_22%,transparent)] ${className}`}
      style={{ background: GRADIENT[language] }}
    >
      {body}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label ? `${label}: ${title}` : title}
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
