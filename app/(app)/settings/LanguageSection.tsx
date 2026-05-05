'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface TargetOption {
  pathId: string;
  languageId: string;
  languageCode: string;
  label: string;
}

interface LanguageSectionProps {
  initialNativeLanguage: string;
  targetOptions: TargetOption[];
  initialTargetLanguageCode: string | null;
}

const NATIVE_OPTIONS: Array<{ code: string; label: string }> = [
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

export function LanguageSection({
  initialNativeLanguage,
  targetOptions,
  initialTargetLanguageCode,
}: LanguageSectionProps) {
  const router = useRouter();
  const [nativeValue, setNativeValue] = useState(initialNativeLanguage);
  const [savingNative, setSavingNative] = useState(false);

  const initialPathId = (() => {
    if (initialTargetLanguageCode) {
      const match = targetOptions.find((o) => o.languageCode === initialTargetLanguageCode);
      if (match) return match.pathId;
    }
    return targetOptions[0]?.pathId ?? '';
  })();
  const [targetPathId, setTargetPathId] = useState(initialPathId);
  const [savingTarget, setSavingTarget] = useState(false);

  async function onNativeChange(next: string) {
    setNativeValue(next);
    setSavingNative(true);
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
        setNativeValue(initialNativeLanguage);
        return;
      }
      toast.success('Native language updated.');
    } catch {
      const { toast } = await import('sonner');
      toast.error("Couldn't reach the server. Please try again.");
      setNativeValue(initialNativeLanguage);
    } finally {
      setSavingNative(false);
    }
  }

  async function onTargetChange(nextPathId: string) {
    const previous = targetPathId;
    setTargetPathId(nextPathId);
    setSavingTarget(true);
    try {
      const res = await fetch('/api/user/active-path', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathId: nextPathId }),
      });
      const json = await res.json();
      const { toast } = await import('sonner');
      if (!res.ok || json.error) {
        toast.error(json.error ?? "Couldn't switch language.");
        setTargetPathId(previous);
        return;
      }
      const label = targetOptions.find((o) => o.pathId === nextPathId)?.label ?? 'language';
      toast.success(`Now learning ${label}.`);
      router.refresh();
    } catch {
      const { toast } = await import('sonner');
      toast.error("Couldn't reach the server. Please try again.");
      setTargetPathId(previous);
    } finally {
      setSavingTarget(false);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Language
      </h2>
      <Card>
        <div className="space-y-5">
          {targetOptions.length > 0 && (
            <label className="block">
              <span className="text-sm text-foreground font-medium">Learning</span>
              <p className="text-xs text-text-secondary mt-0.5 mb-3">
                The language you&apos;re learning. Switching changes your active path on the dashboard.
              </p>
              <select
                value={targetPathId}
                onChange={(e) => onTargetChange(e.target.value)}
                disabled={savingTarget}
                className="w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default disabled:opacity-50"
              >
                {targetOptions.map((o) => (
                  <option key={o.pathId} value={o.pathId}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-sm text-foreground font-medium">Native language</span>
            <p className="text-xs text-text-secondary mt-0.5 mb-3">
              Used for translations and explanations across the app.
            </p>
            <select
              value={nativeValue}
              onChange={(e) => onNativeChange(e.target.value)}
              disabled={savingNative}
              className="w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default disabled:opacity-50"
            >
              {NATIVE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>
    </section>
  );
}
