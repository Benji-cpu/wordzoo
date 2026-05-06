'use client';

import { useEffect, useState } from 'react';
import { TripIntake } from '@/components/trip/TripIntake';
import { TripPlanPreview } from '@/components/trip/TripPlanPreview';
import {
  loadTripState,
  saveTripState,
  clearTripState,
  type TripIntake as TripIntakeData,
  type TripStoredState,
} from '@/lib/onboarding/trip-state';
import type { TripPreviewResponse } from '@/lib/trip/types';

const PREVIEW_TTL_MS = 30 * 60 * 1000; // 30 min — preview is stale after that

export default function TripPage() {
  const [intake, setIntake] = useState<TripIntakeData | null>(null);
  const [preview, setPreview] = useState<TripPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Resume from localStorage on mount.
  useEffect(() => {
    const saved = loadTripState();
    if (saved?.intake && saved.preview && saved.generatedAt) {
      const fresh = Date.now() - saved.generatedAt < PREVIEW_TTL_MS;
      if (fresh) {
        setIntake(saved.intake);
        setPreview(saved.preview);
      } else {
        clearTripState();
      }
    }
    setHydrated(true);
  }, []);

  async function handleSubmit(next: TripIntakeData) {
    setIntake(next);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trip/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: next.destination,
          tripDays: next.tripDays,
          useCases: next.useCases,
        }),
      });
      const json = (await res.json()) as { data: TripPreviewResponse | null; error: string | null };
      if (!res.ok || !json.data) {
        setError(json.error ?? 'Could not generate plan. Try again.');
        setLoading(false);
        return;
      }
      const stored: TripStoredState = {
        intake: next,
        preview: json.data,
        generatedAt: Date.now(),
      };
      saveTripState(stored);
      setPreview(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setIntake(null);
    setPreview(null);
    setError(null);
  }

  if (!hydrated) {
    return null;
  }

  if (preview && intake) {
    return (
      <main className="min-h-screen bg-[color:var(--background)]">
        <TripPlanPreview intake={intake} preview={preview} onRestart={handleRestart} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] flex flex-col">
      <TripIntake onSubmit={handleSubmit} loading={loading} />
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl bg-red-100 text-red-800 text-sm font-bold shadow-lg max-w-sm text-center">
          {error}
        </div>
      )}
    </main>
  );
}
