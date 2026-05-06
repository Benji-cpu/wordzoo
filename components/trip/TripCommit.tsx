'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  loadTripState,
  clearTripState,
  type TripIntake,
} from '@/lib/onboarding/trip-state';
import type { Path } from '@/types/database';

type Phase = 'reading' | 'creating-path' | 'creating-checkout' | 'redirecting' | 'error' | 'no-state';

export function TripCommit() {
  const [phase, setPhase] = useState<Phase>('reading');
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    void run();
  }, []);

  async function run() {
    const stored = loadTripState();
    if (!stored?.intake || !stored?.preview) {
      setPhase('no-state');
      return;
    }
    const intake: TripIntake = stored.intake;
    const languageId = stored.preview.languageId;

    try {
      setPhase('creating-path');
      const pathRes = await fetch('/api/paths/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: intake.destination,
          duration: `${intake.tripDays} days`,
          languageId,
          useCases: intake.useCases,
          tripDays: intake.tripDays,
          tripStartDate: intake.tripStartDate,
        }),
      });
      const pathJson = (await pathRes.json()) as { data: Path | null; error: string | null };
      if (!pathRes.ok || !pathJson.data) {
        throw new Error(pathJson.error ?? 'Could not save your plan');
      }

      setPhase('creating-checkout');
      const successPath = `/trip/${pathJson.data.id}?purchased=true`;
      const cancelPath = `/trip/${pathJson.data.id}?canceled=true`;
      const billingRes = await fetch('/api/billing/travel-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pathJson.data.id,
          successPath,
          cancelPath,
        }),
      });
      const billingJson = (await billingRes.json()) as { data: { url: string } | null; error: string | null };
      if (!billingRes.ok || !billingJson.data?.url) {
        throw new Error(billingJson.error ?? 'Could not start checkout');
      }

      setPhase('redirecting');
      clearTripState();
      window.location.href = billingJson.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPhase('error');
    }
  }

  if (phase === 'no-state') {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center space-y-4">
        <p className="text-base font-bold text-[color:var(--foreground)]">
          Your trip plan has expired.
        </p>
        <p className="text-sm text-[color:var(--text-secondary)] font-medium">
          Re-run the intake and we&rsquo;ll build a fresh one.
        </p>
        <Link
          href="/trip"
          className="inline-block px-5 py-3 rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold text-sm"
        >
          Start over
        </Link>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center space-y-4">
        <p className="text-base font-bold text-red-700">Something went wrong</p>
        <p className="text-sm text-[color:var(--text-secondary)]">{error}</p>
        <Link
          href="/trip"
          className="inline-block px-5 py-3 rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold text-sm"
        >
          Try again
        </Link>
      </div>
    );
  }

  const message =
    phase === 'creating-path'
      ? 'Saving your personalised plan…'
      : phase === 'creating-checkout'
        ? 'Opening checkout…'
        : phase === 'redirecting'
          ? 'Redirecting to Stripe…'
          : 'Loading…';

  return (
    <div className="max-w-md mx-auto px-5 py-16 text-center space-y-4">
      <div className="w-10 h-10 mx-auto rounded-full border-4 border-[color:var(--accent-indonesian)]/30 border-t-[color:var(--accent-indonesian)] animate-spin" />
      <p className="text-sm font-bold text-[color:var(--text-secondary)]">{message}</p>
    </div>
  );
}
