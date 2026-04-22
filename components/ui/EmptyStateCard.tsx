'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Fox, type FoxPose } from '@/components/mascot/Fox';

interface CTA {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateCardProps {
  title: string;
  subtitle: ReactNode;
  /** Primary handoff — the "what can I still do right now" call-to-action. */
  primary: CTA;
  /** Optional softer secondary CTA. Never more than two. */
  secondary?: CTA;
  /** Fox pose for the top bubble. */
  foxPose?: FoxPose;
  className?: string;
}

function CtaButton({ cta, variant }: { cta: CTA; variant: 'primary' | 'secondary' }) {
  const primary =
    'bg-[color:var(--accent-indonesian)] text-white shadow-[0_4px_10px_color-mix(in_srgb,var(--accent-indonesian)_30%,transparent)]';
  const secondary =
    'bg-transparent text-[color:var(--foreground)] border border-[color:var(--border-default)]';
  const classes = `block w-full py-3 rounded-[14px] font-extrabold text-[13.5px] text-center active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
    variant === 'primary' ? primary : secondary
  }`;

  if (cta.href) {
    return (
      <Link href={cta.href} className={classes}>
        {cta.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={cta.onClick} className={classes}>
      {cta.label}
    </button>
  );
}

export function EmptyStateCard({
  title,
  subtitle,
  primary,
  secondary,
  foxPose = 'proud',
  className = '',
}: EmptyStateCardProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2.5 text-center p-6 rounded-[22px] bg-[color:var(--card-surface)] border border-[color:var(--border-subtle)] shadow-[0_4px_14px_color-mix(in_srgb,var(--foreground)_5%,transparent)] ${className}`}
    >
      <div
        aria-hidden
        className="w-[72px] h-[72px] rounded-full bg-[color:var(--accent-indonesian-soft)] flex items-center justify-center shadow-[0_6px_14px_color-mix(in_srgb,var(--accent-indonesian)_25%,transparent)] mb-1"
      >
        <Fox pose={foxPose} size="md" />
      </div>
      <h2 className="text-[17px] font-extrabold text-[color:var(--foreground)]">{title}</h2>
      <p className="text-[13px] text-[color:var(--text-secondary)] font-semibold leading-[1.5] max-w-[260px]">
        {subtitle}
      </p>
      <div className="flex flex-col gap-2 w-full mt-2">
        <CtaButton cta={primary} variant="primary" />
        {secondary && <CtaButton cta={secondary} variant="secondary" />}
      </div>
    </div>
  );
}
