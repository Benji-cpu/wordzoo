'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import type { TripContext } from '@/lib/services/trip-service';

const SUGGESTIONS_BY_LANG: Record<string, Array<{ label: string; countryCode: string }>> = {
  id: [
    { label: 'Bali', countryCode: 'ID' },
    { label: 'Jakarta', countryCode: 'ID' },
    { label: 'Yogyakarta', countryCode: 'ID' },
    { label: 'Lombok', countryCode: 'ID' },
  ],
  es: [
    { label: 'Mexico City', countryCode: 'MX' },
    { label: 'Barcelona', countryCode: 'ES' },
    { label: 'Buenos Aires', countryCode: 'AR' },
  ],
  ja: [
    { label: 'Tokyo', countryCode: 'JP' },
    { label: 'Kyoto', countryCode: 'JP' },
  ],
};

interface TripSectionProps {
  targetLanguageCode: string | null;
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function TripSection({ targetLanguageCode }: TripSectionProps) {
  const [trip, setTrip] = useState<TripContext | null>(null);
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [target, setTarget] = useState(200);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/trip')
      .then((r) => r.json())
      .then((j: { data: TripContext | null }) => {
        if (j.data) {
          setTrip(j.data);
          setDestination(j.data.destination ?? '');
          setDate(j.data.tripDate ?? '');
          setTarget(j.data.targetWordCount ?? 200);
        }
      })
      .catch(() => {});
  }, []);

  const suggestions = (targetLanguageCode && SUGGESTIONS_BY_LANG[targetLanguageCode]) || [];
  const hasTrip = trip?.hasTrip;

  async function save() {
    if (!destination.trim() || !date) return;
    setSaving(true);
    try {
      const countryCode = suggestions.find(
        (s) => s.label.toLowerCase() === destination.trim().toLowerCase()
      )?.countryCode;
      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          countryCode,
          date,
          targetWordCount: target,
        }),
      });
      const json = await res.json();
      const { toast } = await import('sonner');
      if (!res.ok || json.error) {
        toast.error(json.error ?? "Couldn't save trip.");
        return;
      }
      setTrip(json.data);
      setEditing(false);
      toast.success('Trip saved.');
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    if (!confirm('Clear your trip? Your dashboard will return to its default view.')) return;
    setSaving(true);
    try {
      await fetch('/api/trip', { method: 'DELETE' });
      const { toast } = await import('sonner');
      toast.success('Trip cleared.');
      setTrip(null);
      setDestination('');
      setDate('');
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="trip" className="scroll-mt-20">
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Trip
      </h2>
      <Card>
        {!editing && hasTrip && trip ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{trip.destination}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {trip.daysRemaining !== null && trip.daysRemaining > 0
                  ? `${trip.daysRemaining} day${trip.daysRemaining === 1 ? '' : 's'} away · ${trip.wordsMastered} of ${trip.targetWordCount} words mastered`
                  : trip.daysRemaining === 0
                  ? 'Today · have a great trip'
                  : `Trip done · ${trip.wordsMastered} of ${trip.targetWordCount} words mastered`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-medium text-accent-default hover:underline"
              >
                Edit
              </button>
              <span className="text-text-secondary">·</span>
              <button
                onClick={clear}
                disabled={saving}
                className="text-sm font-medium text-text-secondary hover:text-foreground disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        ) : !editing ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground font-medium">Set a trip and we&apos;ll orient your dashboard around it.</p>
            <p className="text-xs text-text-secondary">
              We&apos;ll show your countdown, words mastered, and a daily pace target so you arrive ready.
            </p>
            <button
              onClick={() => {
                if (!date) setDate(todayPlus(30));
                setEditing(true);
              }}
              className="text-sm font-medium text-accent-default hover:underline"
            >
              Plan a trip →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-foreground font-medium">Where are you going?</span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Bali, Tokyo, Mexico City…"
                className="mt-2 w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default"
              />
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setDestination(s.label)}
                      className="text-xs px-2.5 py-1 rounded-full bg-surface-inset border border-card-border text-text-secondary hover:text-foreground hover:border-accent-default"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label className="block">
              <span className="text-sm text-foreground font-medium">When?</span>
              <input
                type="date"
                value={date}
                min={todayPlus(0)}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default"
              />
            </label>

            <label className="block">
              <span className="text-sm text-foreground font-medium">Word goal</span>
              <p className="text-xs text-text-secondary mt-0.5 mb-2">
                How many words you want to know by then. 200 is a good travel baseline.
              </p>
              <input
                type="number"
                value={target}
                min={20}
                max={2000}
                step={20}
                onChange={(e) => setTarget(parseInt(e.target.value) || 200)}
                className="w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default"
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={saving || !destination.trim() || !date}
                className="px-4 py-2 rounded-lg bg-accent-default text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save trip'}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
