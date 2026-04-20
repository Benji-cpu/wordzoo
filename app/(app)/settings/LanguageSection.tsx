'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface LanguageSectionProps {
  initialNativeLanguage: string;
}

const OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'id', label: 'Indonesian' },
];

export function LanguageSection({ initialNativeLanguage }: LanguageSectionProps) {
  const [value, setValue] = useState(initialNativeLanguage);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    setValue(next);
    setSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nativeLanguage: next }),
      });
      const json = await res.json();
      const { toast } = await import('sonner');
      if (!res.ok || json.error) {
        toast.error(json.error ?? "Couldn't save preference.");
        setValue(initialNativeLanguage);
        return;
      }
      toast.success('Native language updated.');
    } catch {
      const { toast } = await import('sonner');
      toast.error("Couldn't reach the server. Please try again.");
      setValue(initialNativeLanguage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Language
      </h2>
      <Card>
        <label className="block">
          <span className="text-sm text-foreground font-medium">Native language</span>
          <p className="text-xs text-text-secondary mt-0.5 mb-3">
            Used for translations and explanations across the app.
          </p>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={saving}
            className="w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default disabled:opacity-50"
          >
            {OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </Card>
    </section>
  );
}
