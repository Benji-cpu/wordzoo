'use client';

import { Card } from '@/components/ui/Card';
import { useAudioPreferences } from '@/components/audio/AudioPreferences';

/**
 * The one audio control.
 *
 * Reads and writes the shared context rather than fetching its own copy, so
 * flipping it here changes the very next card without a reload — the toggle and
 * the surfaces that obey it are looking at the same value.
 */
export function AudioSection() {
  const { autoplay, setAutoplay } = useAudioPreferences();

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Audio
      </h2>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Speak to me</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Play each word out loud on its own as you go, instead of waiting to be
              asked. Tapping a word or its picture always speaks, either way.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoplay}
            aria-label="Speak words aloud automatically"
            onClick={() => setAutoplay(!autoplay)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              autoplay ? 'bg-accent-default' : 'bg-surface-inset'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                autoplay ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </Card>
    </section>
  );
}
