'use client';

import { useCallback, useMemo, useRef, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { SpeakAnswer } from '@/components/audio/SpeakAnswer';
import { recognitionLang } from '@/lib/audio/recognition-lang';
import { judgeAttempt, isCloseMiss, blankWords, type CardResult, type Judgement, type Stage } from '@/lib/pedagogy/review-session';
import { AnswerFeedback } from './AnswerFeedback';
import { useItemAudio } from './useItemAudio';
import type { ItemView } from './item-view';

export interface CardCommit {
  result: CardResult;
  /** The final answer was spoken (feeds the override tracker). */
  spoken: boolean;
  /** The learner said "I said it right". */
  overridden: boolean;
}

interface ProductionCardProps {
  view: ItemView;
  stage: Stage;
  /** Words to blank in a gap drill. */
  missed?: string[];
  mode: 'say' | 'type';
  /** Typing is the default only because the mic kept disagreeing with the learner. */
  typingBecauseOverrides?: boolean;
  /** Speech works here, so "Say it instead" is offered from the typing view. */
  speechAvailable: boolean;
  languageCode: string | null;
  learnerName: string | null;
  onCommit: (commit: CardCommit) => void;
}

type Phase = 'ask' | 'retry' | 'feedback';

interface Verdict {
  result: CardResult;
  judgement: Judgement | null;
  spoken: boolean;
}

const MIC_DEAD = new Set(['mic_denied', 'service_blocked', 'unsupported_browser']);

/**
 * A production card: the English is the question, the answer is spoken (the
 * default) or typed. The app grades it; the learner never rates themselves.
 *
 *   ask       the first attempt
 *   retry     a wrong SPOKEN first attempt gets one more go (prompted straight
 *             away when it was close), or "Show me"
 *   feedback  the answer, audio and memory hook; Continue records it
 *
 * A wrong spoken answer offers "I said it right" (the recogniser may be the one
 * that was wrong). It counts as hard, and the override tracker in the client
 * stops defaulting to the mic when it happens too often.
 */
export function ProductionCard({
  view,
  stage,
  missed = [],
  mode,
  typingBecauseOverrides = false,
  speechAvailable,
  languageCode,
  learnerName,
  onCommit,
}: ProductionCardProps) {
  const [input, setInput] = useState<'say' | 'type'>(mode);
  const [phase, setPhase] = useState<Phase>('ask');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [firstMiss, setFirstMiss] = useState<Judgement | null>(null);
  const [overridden, setOverridden] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [attemptNo, setAttemptNo] = useState(0);
  const tries = useRef(0);
  const committed = useRef(false);
  const { play, playing } = useItemAudio(view, languageCode);
  const { bcp47 } = recognitionLang(languageCode ?? 'pt');
  const names = useMemo(() => (learnerName ? [learnerName] : []), [learnerName]);

  const finish = useCallback((next: Verdict) => {
    setVerdict(next);
    setPhase('feedback');
  }, []);

  const submit = useCallback(
    (attempts: string[], spoken: boolean) => {
      if (phase === 'feedback' || attempts.every((a) => !a.trim())) return;
      tries.current += 1;
      const n = tries.current;
      const judgement = judgeAttempt({
        kind: view.kind,
        own: view.text,
        alternates: view.alternates,
        attempts,
        spoken,
        names,
        noVariants: view.noVariants,
      });
      if (judgement.verdict === 'correct') {
        finish({ result: { how: 'right', tries: n >= 2 ? 2 : 1 }, judgement, spoken });
      } else if (judgement.verdict === 'partial') {
        finish({ result: { how: 'partial', missed: judgement.missed }, judgement, spoken });
      } else if (n === 1 && spoken) {
        // Ungraded retry: a wrong spoken answer may be the recogniser's fault.
        setFirstMiss(judgement);
        setAttemptNo((a) => a + 1);
        setPhase('retry');
      } else {
        finish({ result: { how: 'wrong' }, judgement, spoken });
      }
    },
    [phase, view, names, finish],
  );

  const onHeard = useCallback((alternatives: string[]) => submit(alternatives, true), [submit]);

  const onMicUnavailable = useCallback((reason: string) => {
    if (MIC_DEAD.has(reason)) {
      setInput('type');
      setMicNote("The mic isn't working here, so it's typing for now.");
    }
  }, []);

  const onTypedSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = typed.trim();
    if (!value) return;
    setTyped('');
    submit([value], false);
  };

  const iDontKnow = () => finish({ result: { how: 'idk' }, judgement: firstMiss, spoken: false });
  const showMe = () => finish({ result: { how: 'wrong' }, judgement: firstMiss, spoken: true });
  const override = () => {
    setOverridden(true);
    setVerdict((v) => (v ? { ...v, result: { how: 'override' } } : v));
  };
  const overrideFromRetry = () =>
    finish({ result: { how: 'override' }, judgement: firstMiss, spoken: true });

  const commit = () => {
    if (!verdict || committed.current) return;
    committed.current = true;
    onCommit({
      result: verdict.result,
      spoken: verdict.spoken,
      // "I said it right" from the retry screen never passes through override().
      overridden: overridden || verdict.result.how === 'override',
    });
  };

  if (phase === 'feedback' && verdict) {
    const tone = verdict.result.how === 'right' || verdict.result.how === 'override'
      ? 'right'
      : verdict.result.how === 'partial'
        ? 'partial'
        : 'wrong';
    const nonRight = verdict.result.how === 'partial' || verdict.result.how === 'wrong';
    return (
      <AnswerFeedback
        view={view}
        tone={tone}
        heard={verdict.spoken ? verdict.judgement?.heard : null}
        missed={verdict.result.how === 'partial' ? verdict.result.missed : []}
        usedAlternative={verdict.judgement?.usedAlternative ?? false}
        overridden={overridden || verdict.result.how === 'override'}
        play={play}
        playing={playing}
        canOverride={verdict.spoken && nonRight}
        onOverride={override}
        onContinue={commit}
      />
    );
  }

  const isGap = stage === 'gap';
  const prompt = isGap ? 'Fill in the gaps, then say the whole phrase' : 'How do you say…';
  const close = phase === 'retry' && firstMiss ? isCloseMiss(firstMiss) : false;

  return (
    <div className="flex flex-col gap-3">
      <Card className="text-center">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">{prompt}</p>
        {isGap ? (
          <>
            <h2 className="font-display text-[color:var(--color-fox-primary)] leading-[1.15] mb-2" style={{ fontSize: 'clamp(1.5rem, 6vw, 2.1rem)' }}>
              {blankWords(view.text, missed)}
            </h2>
            <p className="text-base text-foreground font-medium">{view.meaning}</p>
          </>
        ) : (
          <h2 className="text-[26px] font-extrabold tracking-tight text-foreground leading-tight">{view.meaning}</h2>
        )}
        {stage === 'whole' && <p className="mt-2 text-xs text-text-secondary">The whole phrase, from memory.</p>}
        {phase === 'retry' && firstMiss && (
          <div className="mt-3" role="status" aria-live="polite">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {close ? 'So close. Say it once more.' : 'Not quite. One more go?'}
            </p>
            {firstMiss.heard && (
              <p className="text-sm text-foreground mt-1">
                <span className="text-text-secondary">Heard:</span> &ldquo;{firstMiss.heard}&rdquo;
              </p>
            )}
          </div>
        )}
      </Card>

      {typingBecauseOverrides && phase === 'ask' && input === 'type' && (
        <p className="text-xs text-text-secondary text-center">
          Typing for now: the mic and you have disagreed a few times lately.
        </p>
      )}
      {micNote && <p className="text-xs text-amber-600 dark:text-amber-400 text-center">{micNote}</p>}

      {input === 'say' && languageCode ? (
        <div className="flex flex-col items-center gap-2 py-1">
          <SpeakAnswer
            key={attemptNo}
            languageCode={languageCode}
            onResult={onHeard}
            onUnavailable={onMicUnavailable}
            label={phase === 'retry' ? 'Tap and say it again' : 'Tap and say it'}
          />
          <ThumbButton variant="ghost" fullWidth={false} aria-label="Type instead" onClick={() => setInput('type')}>
            Type instead
          </ThumbButton>
        </div>
      ) : (
        <form onSubmit={onTypedSubmit} className="flex flex-col gap-2">
          <label htmlFor="review-answer" className="sr-only">
            Your answer in the target language
          </label>
          <input
            id="review-answer"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            lang={bcp47}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="Type it in Portuguese"
            className="w-full min-h-[56px] rounded-2xl border border-border-default bg-surface-inset px-4 text-lg text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-fox-ring)]"
          />
          <ThumbButton type="submit" variant="primary" disabled={!typed.trim()}>
            Check
          </ThumbButton>
          {speechAvailable && languageCode && (
            <ThumbButton variant="ghost" aria-label="Say it instead" onClick={() => setInput('say')}>
              Say it instead
            </ThumbButton>
          )}
        </form>
      )}

      <div className="flex flex-col gap-2">
        {phase === 'retry' && (
          <>
            <ThumbButton variant="ghost" aria-label="I said it right" onClick={overrideFromRetry}>
              I said it right
            </ThumbButton>
            <ThumbButton variant="secondary" onClick={showMe}>
              Show me
            </ThumbButton>
          </>
        )}
        <ThumbButton variant="ghost" onClick={iDontKnow}>
          I don&apos;t know
        </ThumbButton>
      </div>
    </div>
  );
}
