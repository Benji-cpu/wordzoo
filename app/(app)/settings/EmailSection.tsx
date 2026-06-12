'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

export function EmailSection() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/user/email-prefs')
      .then((res) => res.json())
      .then((res) => {
        if (res.data) setEnabled(res.data.emailRemindersEnabled);
      })
      .catch(() => {});
  }, []);

  async function handleToggle() {
    if (enabled === null || saving) return;
    const next = !enabled;
    setSaving(true);
    setEnabled(next);
    try {
      const res = await fetch('/api/user/email-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailRemindersEnabled: next }),
      });
      if (!res.ok) setEnabled(!next);
    } catch {
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Email
      </h2>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Daily reminders</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Streak-at-risk nudges, review reminders, and a weekly recap.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled ?? false}
            disabled={enabled === null}
            onClick={handleToggle}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              enabled ? 'bg-accent-default' : 'bg-surface-inset'
            } ${enabled === null ? 'opacity-50' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </Card>
    </section>
  );
}
