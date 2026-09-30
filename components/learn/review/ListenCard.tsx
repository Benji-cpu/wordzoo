'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { isAudioUnlocked } from '@/lib/audio/pronunciation';
import { normalizeSentence } from '@/lib/pedagogy/normalize';
import { AnswerFeedback } from './AnswerFeedback';
import { AudioButton } from './AudioButton';
import { useItemAudio } from './useItemAudio';
import type { CardCommit } from './ProductionCard';
import type { ItemView } from './item-view';

interface ListenCardProps {
  view: ItemView;
  /** Four English options, one of them `view.meaning`. */
  options: string[];
  languageCode: string | null;
  onCommit: (commit: CardCommit) => void;
}

type Picked = { kind: 'pick'; option: string; correct: boolean } | { kind: 'idk' };

/**
 * Listening practice: the target audio plays with the text hidden, and the
 * learner picks the meaning from four. A correct pick is hard (it shows
 * recognition, not recall, so it never graduates an item on its own). If the
 * audio cannot play at all, the text is shown instead so the card still works.
 */
export function ListenCard({ view, options, languageCode, onCommit }: ListenCardProps) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [showText, setShowText] = useState(false);
  const committed = useRef(false);
  const { play, playing } = useItemAudio(view, languageCode);

  useEffect(() => {
    // Autoplay when the browser has allowed audio; otherwise the big button is the prompt.
    if (!isAudioUnlocked()) return;
    let cancelled = false;
    void play().then((ok) => {
      if (!ok && !cancelled) setShowText(true);
    });
    return () => {
      cancelled = true;
    };
    // once per card
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tapPlay = () => {
    void play().then((ok) => {
      if (!ok) setShowText(true);
    });
  };

  if (picked) {
    const right = picked.kind === 'pick' && picked.correct;
    return (
      <AnswerFeedback
        view={view}
        tone={right ? 'right' : 'wrong'}
        note={right ? "Recognised. You'll be asked to say it another time." : null}
        play={play}
        playing={playing}
        onContinue={() => {
          if (committed.current) return;
          committed.current = true;
          onCommit({
            result: picked.kind === 'pick' ? { how: 'listen', correct: picked.correct } : { how: 'idk' },
            spoken: false,
            overridden: false,
          });
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="text-center">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">What does this mean?</p>
        <div className="flex justify-center">
          <AudioButton onPlay={tapPlay} playing={playing} size="lg" label="Play the audio" />
        </div>
        {showText ? (
          <p className="mt-3 font-display text-[color:var(--color-fox-primary)] text-3xl leading-tight">{view.text}</p>
        ) : (
          <button
            type="button"
            onClick={() => setShowText(true)}
            className="mt-3 min-h-11 px-3 text-sm font-semibold text-text-secondary underline underline-offset-2"
          >
            Can&apos;t hear it? Show the text
          </button>
        )}
      </Card>

      <div className="flex flex-col gap-2" role="group" aria-label="Meaning">
        {options.map((option) => (
          <ThumbButton
            key={option}
            variant="secondary"
            className="!justify-start text-left"
            onClick={() =>
              setPicked({
                kind: 'pick',
                option,
                correct: normalizeSentence(option) === normalizeSentence(view.meaning),
              })
            }
          >
            {option}
          </ThumbButton>
        ))}
      </div>

      <ThumbButton variant="ghost" onClick={() => setPicked({ kind: 'idk' })}>
        I don&apos;t know
      </ThumbButton>
    </div>
  );
}
