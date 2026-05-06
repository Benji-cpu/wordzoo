'use client';

import { useState } from 'react';
import { TRIP_USE_CASES, todayIsoDate, daysUntil, type TripIntake } from '@/lib/onboarding/trip-state';

interface Props {
  onSubmit: (intake: TripIntake) => void;
  loading?: boolean;
}

export function TripIntake({ onSubmit, loading = false }: Props) {
  const today = todayIsoDate();
  const minDate = today;
  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().slice(0, 10);
  })();

  const [tripStartDate, setTripStartDate] = useState(defaultDate);
  const [tripDays, setTripDays] = useState(14);
  const [selected, setSelected] = useState<Set<string>>(new Set(['eat at warungs']));

  const days = daysUntil(tripStartDate);
  const canSubmit = tripDays > 0 && selected.size > 0 && !loading;

  function toggle(uc: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uc)) next.delete(uc);
      else next.add(uc);
      return next;
    });
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      destination: 'Bali',
      tripStartDate,
      tripDays,
      useCases: Array.from(selected),
    });
  }

  return (
    <div className="w-full max-w-lg mx-auto px-5 pb-32 pt-8 space-y-8">
      <header className="text-center space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
          Going to Bali?
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--foreground)]">
          Land speaking Indonesian.
        </h1>
        <p className="text-sm text-[color:var(--text-secondary)] font-medium leading-relaxed">
          Three questions. We&rsquo;ll build you a personalised plan ordered by
          what you&rsquo;ll actually do, paced to your trip.
        </p>
      </header>

      <section className="space-y-3">
        <label htmlFor="trip-date" className="text-sm font-bold text-[color:var(--foreground)]">
          When do you leave?
        </label>
        <input
          id="trip-date"
          type="date"
          min={minDate}
          value={tripStartDate}
          onChange={(e) => setTripStartDate(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border-2 border-[color:var(--border)] bg-[color:var(--card-surface)] text-[color:var(--foreground)] font-semibold focus:outline-none focus:border-[color:var(--accent-indonesian)]"
        />
        {days > 0 && (
          <p className="text-xs font-semibold text-[color:var(--accent-indonesian)]">
            {days} {days === 1 ? 'day' : 'days'} from now.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <label htmlFor="trip-length" className="text-sm font-bold text-[color:var(--foreground)]">
          How long is the trip?
        </label>
        <div className="flex items-center gap-3">
          <input
            id="trip-length"
            type="number"
            min={1}
            max={60}
            value={tripDays}
            onChange={(e) => setTripDays(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="w-24 px-4 py-3 rounded-2xl border-2 border-[color:var(--border)] bg-[color:var(--card-surface)] text-[color:var(--foreground)] font-semibold focus:outline-none focus:border-[color:var(--accent-indonesian)] text-center"
          />
          <span className="text-sm font-semibold text-[color:var(--text-secondary)]">days</span>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-bold text-[color:var(--foreground)]">
          What will you actually do?
        </p>
        <p className="text-xs text-[color:var(--text-secondary)] font-medium">
          Pick anything you&rsquo;ll need to handle. We&rsquo;ll order your plan around these.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TRIP_USE_CASES.map((uc) => {
            const active = selected.has(uc);
            return (
              <button
                key={uc}
                type="button"
                onClick={() => toggle(uc)}
                className={`px-3 py-3 rounded-2xl text-left text-sm font-semibold transition-all active:scale-[0.97] ${
                  active
                    ? 'bg-[color:var(--accent-indonesian)] text-white border-2 border-[color:var(--accent-indonesian)]'
                    : 'bg-[color:var(--card-surface)] text-[color:var(--foreground)] border-2 border-[color:var(--border)]'
                }`}
              >
                {uc}
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl font-extrabold text-base bg-[color:var(--accent-indonesian)] text-white disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {loading ? 'Building your plan…' : 'Build my plan'}
      </button>
    </div>
  );
}
