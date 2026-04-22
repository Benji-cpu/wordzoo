'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type Tone = 'warm' | 'cream' | 'neutral';

interface ActionCardProps {
  /** Small icon (emoji or SVG). */
  icon?: ReactNode;
  /** Big numeric/value shown prominently. */
  value: string | number;
  /** Short label below the value. */
  label: string;
  /** Background tint for the icon tile. */
  tone?: Tone;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const ICON_BG: Record<Tone, string> = {
  warm: 'var(--accent-indonesian-soft)',
  cream: 'var(--surface-warm)',
  neutral: 'color-mix(in srgb, var(--foreground) 6%, var(--card-surface))',
};

export function ActionCard({
  icon,
  value,
  label,
  tone = 'warm',
  href,
  onClick,
  className = '',
}: ActionCardProps) {
  const body = (
    <div className="flex flex-col items-start p-[14px]">
      {icon && (
        <div
          aria-hidden
          className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center text-base mb-1.5"
          style={{ background: ICON_BG[tone] }}
        >
          {icon}
        </div>
      )}
      <div className="text-[22px] font-extrabold leading-none text-[color:var(--foreground)]">
        {value}
      </div>
      <div className="text-[11px] font-bold text-[color:var(--text-secondary)] mt-1">
        {label}
      </div>
    </div>
  );

  const shell = (
    <div
      className={`rounded-[18px] bg-[color:var(--card-surface)] border border-[color:var(--border-subtle)] shadow-[0_3px_8px_color-mix(in_srgb,var(--foreground)_5%,transparent)] ${className}`}
    >
      {body}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex-1 min-w-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[18px] active:scale-[0.98] transition-transform"
      >
        {shell}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[18px] active:scale-[0.98] transition-transform"
      >
        {shell}
      </button>
    );
  }

  return <div className="flex-1 min-w-0">{shell}</div>;
}

/** Row helper for laying out a set of ActionCards side-by-side. */
export function ActionCardRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex gap-2.5 ${className}`}>{children}</div>;
}
