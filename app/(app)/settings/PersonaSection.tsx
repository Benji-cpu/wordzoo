'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface PersonaSectionProps {
  initialName: string;
  initialGender: 'male' | 'female' | '';
}

/**
 * Lets the learner set the name + grammatical gender used to personalize
 * lessons in gender-inflected languages (Portuguese, Spanish, …). Saved to
 * user preferences; the learn page reads these to rewrite self-referential
 * wording. See lib/learn/personalize.ts.
 */
export function PersonaSection({ initialName, initialGender }: PersonaSectionProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [gender, setGender] = useState<'male' | 'female' | ''>(initialGender);
  const [saving, setSaving] = useState(false);

  async function save(next: { learner_name?: string; learner_gender?: 'male' | 'female' }) {
    setSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: next }),
      });
      const json = await res.json();
      const { toast } = await import('sonner');
      if (!res.ok || json.error) {
        toast.error(json.error ?? "Couldn't save that.");
        return;
      }
      toast.success('Saved.');
      router.refresh();
    } catch {
      const { toast } = await import('sonner');
      toast.error("Couldn't reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function onGenderChange(next: 'male' | 'female' | '') {
    setGender(next);
    if (next) save({ learner_gender: next });
  }

  function onNameBlur() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== initialName) save({ learner_name: trimmed });
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Lessons
      </h2>
      <Card>
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm text-foreground font-medium">Your name in lessons</span>
            <p className="text-xs text-text-secondary mt-0.5 mb-3">
              Used in dialogues and phrases, e.g. &ldquo;Eu sou o Carlos.&rdquo;
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={onNameBlur}
              placeholder="Your name"
              maxLength={40}
              disabled={saving}
              className="w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default disabled:opacity-50"
            />
          </label>

          <label className="block">
            <span className="text-sm text-foreground font-medium">Grammatical gender</span>
            <p className="text-xs text-text-secondary mt-0.5 mb-3">
              Languages like Portuguese and Spanish change wording by gender
              (obrigado / obrigada). Used to make your lessons agree.
            </p>
            <select
              value={gender}
              onChange={(e) => onGenderChange(e.target.value as 'male' | 'female' | '')}
              disabled={saving}
              className="w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-default disabled:opacity-50"
            >
              <option value="">Not set</option>
              <option value="female">Woman (obrigada)</option>
              <option value="male">Man (obrigado)</option>
            </select>
          </label>
        </div>
      </Card>
    </section>
  );
}
