'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Fox, type FoxPose } from '@/components/mascot/Fox';

interface InsightCardProps {
  /** Main body copy. Supports ReactNode so callers can emphasise spans. */
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Fox pose for the leading avatar. Defaults to 'idle'. */
  foxPose?: FoxPose;
  /** Right-side affordance. Defaults to the chevron when href/onClick is set. */
  trailing?: ReactNode;
  className?: string;
}

export function InsightCard({
  children,
  href,
  onClick,
  foxPose = 'idle',
  trailing,
  className = '',
}: InsightCardProps) {
  const hasAction = !!href || !!onClick;
  const trailingNode =
    trailing ??
    (hasAction ? (
      <span aria-hidden className="font-black text-[color:var(--nav-active)] text-base">
        ›
      </span>
    ) : null);

  const body = (
    <div
      className={`flex items-center gap-3 p-[14px] rounded-[18px] bg-[color:var(--card-surface)] border border-dashed shadow-[0_2px_6px_color-mix(in_srgb,var(--foreground)_4%,transparent)] ${className}`}
      style={{ borderColor: 'color-mix(in srgb, var(--accent-indonesian) 40%, transparent)' }}
    >
      <div
        aria-hidden
        className="w-10 h-10 rounded-[12px] bg-[color:var(--accent-indonesian-soft)] flex items-center justify-center flex-shrink-0"
      >
        <Fox pose={foxPose} size="xs" />
      </div>
      <div className="flex-1 text-[12.5px] font-semibold text-[color:var(--foreground)] leading-snug">
        {children}
      </div>
      {trailingNode}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[18px] active:scale-[0.99] transition-transform"
      >
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[18px] active:scale-[0.99] transition-transform"
      >
        {body}
      </button>
    );
  }

  return body;
}
