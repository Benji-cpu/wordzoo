'use client';

import { useHaptic } from '@/lib/hooks/useHaptic';
import { useSound } from '@/lib/hooks/useSound';

export function FeedbackSection() {
  const haptic = useHaptic();
  const sound = useSound();

  return (
    <section>
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        Feedback
      </h2>
      <div className="rounded-2xl bg-card-surface border border-card-border divide-y divide-border-subtle">
        <Toggle
          label="Sound effects"
          hint="Play chimes on correct answers, celebrations, and transitions"
          checked={sound.enabled}
          onChange={(v) => {
            sound.setEnabled(v);
            if (v) sound.play('soft-tap');
          }}
        />
        <Toggle
          label="Haptic feedback"
          hint="Vibration on taps, correct/incorrect, and celebrations (mobile)"
          checked={haptic.enabled}
          onChange={(v) => {
            haptic.setEnabled(v);
            if (v) haptic.trigger('tap');
          }}
        />
      </div>
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-4 p-4 cursor-pointer">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint ? <p className="text-xs text-text-secondary mt-0.5">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-[var(--color-fox-primary)]' : 'bg-[var(--surface-inset)]'
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}
