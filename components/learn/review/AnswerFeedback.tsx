'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { CollapsibleWordFamily } from '@/components/learn/WordFamilyCard';
import { HeardLine } from '@/components/audio/mic-ui';
import { isAudioUnlocked } from '@/lib/audio/pronunciation';
import { AudioButton } from './AudioButton';
import { MnemonicBlock } from './MnemonicBlock';
import type { ItemView } from './item-view';

export type FeedbackTone = 'right' | 'partial' | 'wrong';

interface AnswerFeedbackProps {
  view: ItemView;
  tone: FeedbackTone;
  /** What the recogniser heard (a spoken answer). */
  heard?: string | null;
  /** Content words that were not heard (a partial phrase). */
  missed?: string[];
  /** Right through an accepted alternative or the other gender ending. */
  usedAlternative?: boolean;
  /** The learner overrode the recogniser ("I said it right"). */
  overridden?: boolean;
  /** One quiet line under the verdict. */
  note?: string | null;
  play: () => Promise<boolean>;
  playing: boolean;
  /** Offer "I said it right" (a spoken answer that was not marked right). */
  canOverride?: boolean;
  onOverride?: () => void;
  onContinue: () => void;
}

const HEADLINE: Record<FeedbackTone, string> = {
  right: 'Correct',
  partial: 'Nearly there',
  wrong: 'Not this time',
};

const TONE_CLASS: Record<FeedbackTone, string> = {
  right: 'text-[color:var(--color-success)]',
  partial: 'text-amber-600 dark:text-amber-400',
  wrong: 'text-[color:var(--color-error)]',
};

/**
 * The moment after an answer: the correct form with its audio (played once on
 * arrival), what we were looking for when an alternative was used, the memory
 * hook after a miss, then Continue. Nothing is recorded until Continue, so
 * "I said it right" can still change the verdict here.
 */
export function AnswerFeedback({
  view,
  tone,
  heard,
  missed = [],
  usedAlternative = false,
  overridden = false,
  note,
  play,
  playing,
  canOverride = false,
  onOverride,
  onContinue,
}: AnswerFeedbackProps) {
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    if (isAudioUnlocked()) void play();
    // once per feedback screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveTone: FeedbackTone = overridden ? 'right' : tone;
  const headline = overridden ? 'Counted as right' : HEADLINE[tone];
  const miss = effectiveTone !== 'right';

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <Card className="text-center">
        <p role="status" aria-live="polite" className={`text-sm font-extrabold uppercase tracking-wider ${TONE_CLASS[effectiveTone]}`}>
          {headline}
        </p>
        {note && <p className="mt-1 text-sm text-text-secondary">{note}</p>}
        {heard ? <HeardLine text={heard} className="mt-1" /> : null}

        {usedAlternative && (
          <p className="mt-3 text-sm text-text-secondary">
            That works too. We were looking for <span className="font-semibold text-foreground">{view.text}</span>.
          </p>
        )}

        <div className="mt-3 flex items-center justify-center gap-3">
          <p
            className="font-display text-[color:var(--color-fox-primary)] leading-[1.05]"
            style={{ fontSize: 'clamp(1.65rem, 6.5vw, 2.25rem)' }}
          >
            {view.text}
          </p>
          <AudioButton onPlay={() => void play()} playing={playing} label={`Play ${view.kind === 'phrase' ? 'phrase' : 'word'} audio`} />
        </div>
        {view.romanization && <p className="mt-1 text-sm text-text-secondary">{view.romanization}</p>}
        <p className="mt-2 text-lg text-foreground font-medium">{view.meaning}</p>
        {view.literal && <p className="mt-1 text-sm text-text-secondary italic">Literally: &ldquo;{view.literal}&rdquo;</p>}
        {missed.length > 0 && !overridden && (
          <p className="mt-3 text-sm text-foreground">
            Missing: <span className="font-semibold">{missed.join(', ')}</span>
          </p>
        )}
        {miss && <MnemonicBlock view={view} withWords={view.kind === 'phrase'} />}
        {miss && view.families.length > 0 && (
          <div className="mt-3 text-left">
            <CollapsibleWordFamily rootWord={{ text: view.text, meaning: view.meaning }} derivedForms={view.families} />
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        {canOverride && !overridden && onOverride && (
          <ThumbButton variant="ghost" onClick={onOverride}>
            I said it right
          </ThumbButton>
        )}
        <ThumbButton variant="primary" size="lg" onClick={onContinue}>
          Continue
        </ThumbButton>
      </div>
    </div>
  );
}
