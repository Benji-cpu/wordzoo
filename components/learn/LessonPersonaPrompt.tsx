'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface LessonPersonaPromptProps {
  /** The learner's current first name (from their profile), if any. */
  initialName: string | null;
  /** Display name of the language being learned, e.g. "Portuguese". */
  languageName: string;
}

type Gender = 'male' | 'female';

/**
 * One-time overlay shown on a gender-inflected language when the learner
 * hasn't told us their name/gender yet. Lessons substitute the learner's
 * real name and agree wording with their gender (see lib/learn/personalize).
 * Persists the answer to user preferences and refreshes so the current
 * scene re-renders personalized. Skipping records a dismissal so it
 * doesn't nag on every scene.
 */
export function LessonPersonaPrompt({ initialName, languageName }: LessonPersonaPromptProps) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [name, setName] = useState(initialName ?? '');
  const [gender, setGender] = useState<Gender | null>(null);
  const [saving, setSaving] = useState(false);

  if (hidden) return null;

  async function patchPreferences(preferences: Record<string, unknown>): Promise<boolean> {
    const res = await fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences }),
    });
    const json = await res.json().catch(() => ({ error: 'Network error' }));
    return res.ok && !json.error;
  }

  async function onSave() {
    if (!gender) return;
    setSaving(true);
    const prefs: Record<string, unknown> = {
      learner_gender: gender,
      persona_prompt_dismissed: true,
    };
    const trimmed = name.trim();
    if (trimmed) prefs.learner_name = trimmed;
    const ok = await patchPreferences(prefs);
    const { toast } = await import('sonner');
    if (!ok) {
      toast.error("Couldn't save that — you can set it later in Settings.");
      setSaving(false);
      return;
    }
    setHidden(true);
    toast.success('Your lessons are now personalized.');
    router.refresh();
  }

  async function onSkip() {
    setHidden(true);
    // Fire-and-forget — don't block the lesson if it fails.
    void patchPreferences({ persona_prompt_dismissed: true });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-title"
    >
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-[color:var(--background)] border border-[color:var(--card-border)] shadow-2xl p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] animate-slide-up">
        <h2 id="persona-title" className="text-xl font-bold text-foreground">
          Make {languageName} yours
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {languageName} changes some words depending on whether you speak as a
          man or a woman (like <span className="font-semibold">obrigado</span> /{' '}
          <span className="font-semibold">obrigada</span>). Tell us yours so the
          lessons use your name and match how you&apos;d really say it.
        </p>

        <label className="block mt-5">
          <span className="text-sm font-medium text-foreground">Your name in lessons</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Carlos"
            maxLength={40}
            className="mt-2 w-full min-h-[44px] rounded-xl bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default"
          />
        </label>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-foreground mb-2">
            How should the lessons refer to you?
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGender('female')}
              aria-pressed={gender === 'female'}
              className={`rounded-xl border px-3 py-3 text-center transition ${
                gender === 'female'
                  ? 'border-[color:var(--accent-indonesian)] bg-[color:var(--accent-indonesian-soft)] text-foreground'
                  : 'border-card-border bg-surface-inset text-text-secondary hover:text-foreground'
              }`}
            >
              <span className="block font-semibold">Woman</span>
              <span className="block text-xs mt-0.5">obrigada</span>
            </button>
            <button
              type="button"
              onClick={() => setGender('male')}
              aria-pressed={gender === 'male'}
              className={`rounded-xl border px-3 py-3 text-center transition ${
                gender === 'male'
                  ? 'border-[color:var(--accent-indonesian)] bg-[color:var(--accent-indonesian-soft)] text-foreground'
                  : 'border-card-border bg-surface-inset text-text-secondary hover:text-foreground'
              }`}
            >
              <span className="block font-semibold">Man</span>
              <span className="block text-xs mt-0.5">obrigado</span>
            </button>
          </div>
        </fieldset>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="accent" size="md" onClick={onSave} disabled={!gender || saving} className="flex-1">
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button variant="ghost" size="md" onClick={onSkip} disabled={saving}>
            Skip
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-text-secondary">
          You can change this anytime in Settings.
        </p>
      </div>
    </div>
  );
}
