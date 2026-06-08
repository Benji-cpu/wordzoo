'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Fox } from '@/components/mascot/Fox';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { fuzzyMatchAnswer, normalizeForCompare } from '@/lib/pedagogy/normalize';
import {
  applyLearnerName,
  countLearnerTurns,
  type ConversationExchange,
  type ConversationTurn,
} from '@/lib/learn/conversation-data';
import type { SupportedLanguageCode } from '@/types/audio';

interface ConversationBlockProps {
  exchanges: ConversationExchange[];
  learnerName: string | null;
  languageName: string;
  languageCode?: SupportedLanguageCode;
  sceneId: string;
  /** Resume point — the exchange the learner left off at. */
  initialExchangeIndex?: number;
  onProgress?: (p: { fraction: number; goBack: () => boolean; exchangeIndex: number }) => void;
  onComplete: () => void;
}

interface Bubble {
  key: string;
  speaker: string;
  text: string;
  en: string;
  mine: boolean;
}

/**
 * In-scene progressive, two-sided conversation practice (Pedagogy v2
 * "conversation" slice). The learner both ANSWERS the NPC and ASKS questions,
 * ramping easy (tap the line) → medium (type with hints) → hard (free
 * production graded leniently). Content + difficulty are authored per turn in
 * lib/learn/conversation-data.ts.
 *
 * Layout follows the scene's pinned-footer contract: the chat transcript
 * scrolls in SceneShell's middle while the active control stays pinned at the
 * bottom (sticky) above the nav — so the action never slides out of view.
 *
 * Never a dead end (MEMORY): wrong taps shake, typing reveals a ladder, and
 * free production is accept-and-coach — the learner always moves forward.
 */
export function ConversationBlock({
  exchanges,
  learnerName,
  languageName,
  sceneId,
  initialExchangeIndex = 0,
  onProgress,
  onComplete,
}: ConversationBlockProps) {
  const totalLearnerTurns = useMemo(() => countLearnerTurns(exchanges), [exchanges]);

  const clampedStart = Math.max(0, Math.min(initialExchangeIndex, exchanges.length - 1));
  const [pos, setPos] = useState<{ ex: number; turn: number }>({ ex: clampedStart, turn: 0 });
  const [log, setLog] = useState<Bubble[]>([]);

  // Learner-turn UI state (reset whenever the active learner turn changes).
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);
  const [coach, setCoach] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const completedRef = useRef(false);
  const { play } = useSound();
  const { trigger } = useHaptic();

  const exchange = exchanges[pos.ex];
  const rawTurn: ConversationTurn | undefined = exchange?.turns[pos.turn];
  const turn = useMemo(
    () =>
      rawTurn
        ? {
            ...rawTurn,
            target: applyLearnerName(rawTurn.target, learnerName),
            en: applyLearnerName(rawTurn.en, learnerName),
            goal_en: rawTurn.goal_en ? applyLearnerName(rawTurn.goal_en, learnerName) : undefined,
            distractors: rawTurn.distractors?.map((d) => applyLearnerName(d, learnerName)),
            hints: rawTurn.hints?.map((h) => applyLearnerName(h, learnerName)),
          }
        : undefined,
    [rawTurn, learnerName],
  );

  const keyOf = (p: { ex: number; turn: number }) => `${p.ex}-${p.turn}`;

  // Shuffled multiple-choice options for 'select' turns. Computed
  // unconditionally (rules of hooks); empty for non-select turns.
  const options = useMemo(() => {
    if (!turn || turn.mode !== 'select' || !turn.distractors) return [] as string[];
    const all = [turn.target, ...turn.distractors.slice(0, 3)];
    const seed = `${pos.ex}-${pos.turn}`;
    const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return all
      .map((item, i) => ({ item, sort: (hash * (i + 1) * 31) % 1000 }))
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.item);
  }, [turn, pos.ex, pos.turn]);

  const resetTurnUi = useCallback(() => {
    setSelected(null);
    setTyped('');
    setAttempts(0);
    setRevealed(false);
    setGrading(false);
    setCoach(null);
    setFeedback(null);
    setShake(false);
  }, []);

  // Reveal NPC turns into the transcript when we land on them; complete when
  // we run past the end. Learner turns are appended only once answered.
  useEffect(() => {
    if (!turn) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }
    resetTurnUi();
    if (turn.role === 'npc') {
      const k = keyOf(pos);
      setLog((prev) =>
        prev.some((b) => b.key === k)
          ? prev
          : [...prev, { key: k, speaker: turn.speaker, text: turn.target, en: turn.en, mine: false }],
      );
    } else {
      // Focus the input for typing/producing turns.
      if (turn.mode !== 'select') setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pos, turn, onComplete, resetTurnUi]);

  // Keep the latest line in view as the transcript grows.
  useEffect(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }, [log, pos]);

  // Report progress + a (no-op) back handler. Back during conversation exits
  // to the previous phase rather than rewinding turn-by-turn (kept simple to
  // avoid transcript-trim bugs; never traps the learner).
  const learnerTurnsBefore = useMemo(() => {
    let n = 0;
    for (let e = 0; e < exchanges.length; e++) {
      for (let t = 0; t < exchanges[e].turns.length; t++) {
        if (e < pos.ex || (e === pos.ex && t < pos.turn)) {
          if (exchanges[e].turns[t].role === 'learner') n++;
        }
      }
    }
    return n;
  }, [exchanges, pos]);

  useEffect(() => {
    onProgress?.({
      fraction: totalLearnerTurns > 0 ? learnerTurnsBefore / totalLearnerTurns : 0,
      goBack: () => false,
      exchangeIndex: pos.ex,
    });
  }, [pos.ex, learnerTurnsBefore, totalLearnerTurns, onProgress]);

  const advance = useCallback(() => {
    setPos((p) => {
      const ex = exchanges[p.ex];
      if (ex && p.turn + 1 < ex.turns.length) return { ex: p.ex, turn: p.turn + 1 };
      if (p.ex + 1 < exchanges.length) return { ex: p.ex + 1, turn: 0 };
      return { ex: exchanges.length, turn: 0 }; // past end → effect fires onComplete
    });
  }, [exchanges]);

  const pushMine = useCallback(
    (text: string) => {
      const k = `${keyOf(pos)}-mine`;
      setLog((prev) => [...prev, { key: k, speaker: 'You', text, en: '', mine: true }]);
    },
    [pos],
  );

  const acceptLearner = useCallback(
    (textToShow: string) => {
      play('correct');
      trigger('success');
      pushMine(textToShow);
      setTimeout(advance, 650);
    },
    [play, trigger, pushMine, advance],
  );

  // ── Select ──
  const handleSelect = useCallback(
    (option: string) => {
      if (!turn || selected) return;
      if (option === turn.target) {
        setSelected(option);
        acceptLearner(option);
      } else {
        play('incorrect');
        trigger('error');
        setShake(true);
        setTimeout(() => setShake(false), 400);
        const next = attempts + 1;
        setAttempts(next);
        if (next >= 2) setRevealed(true); // after two misses, highlight the right one (no dead end)
      }
    },
    [turn, selected, attempts, acceptLearner, play, trigger],
  );

  // ── Type ──
  const handleTypeSubmit = useCallback(() => {
    if (!turn || !typed.trim()) return;
    const guess = typed.trim();
    // Name intro: accept any "nama saya <something>" so a learner whose name we
    // don't know (or who spells it differently) is never blocked.
    if (turn.acceptAny) {
      const n = normalizeForCompare(guess);
      if (n.startsWith('nama saya') && n.length > 'nama saya'.length + 1) {
        acceptLearner(guess);
        return;
      }
    }
    const result = fuzzyMatchAnswer(guess, turn.target, 2);
    if (result.kind === 'exact' || result.kind === 'close') {
      acceptLearner(turn.target);
      return;
    }
    play('incorrect');
    trigger('error');
    setShake(true);
    setTimeout(() => setShake(false), 400);
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 2) {
      setRevealed(true); // reveal full answer; learner types it to continue
    }
    setTyped('');
    inputRef.current?.focus();
  }, [turn, typed, attempts, acceptLearner, play, trigger]);

  // When the answer is revealed, finishing the transcription advances.
  const handleTypeChange = useCallback(
    (value: string) => {
      setTyped(value);
      if (revealed && turn) {
        if (fuzzyMatchAnswer(value, turn.target, 0).kind === 'exact') {
          acceptLearner(turn.target);
        }
      }
    },
    [revealed, turn, acceptLearner],
  );

  // ── Produce (free, AI-graded, accept-and-coach) ──
  const handleProduce = useCallback(async () => {
    if (!turn || !typed.trim() || grading) return;
    const attempt = typed.trim();
    setGrading(true);
    try {
      const res = await fetch(`/api/scenes/${sceneId}/conversation-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalEn: turn.goal_en ?? turn.en,
          expected: turn.target,
          attempt,
          languageName,
        }),
      });
      const json = await res.json().catch(() => null);
      const data = json?.data as { accept: boolean; feedback: string; reference: string } | undefined;
      if (data?.accept) {
        setFeedback(data.feedback);
        acceptLearner(attempt);
      } else {
        // Coach: show the reference as a gentle recast, then advance on tap.
        setGrading(false);
        setCoach(data?.reference ?? turn.target);
        setFeedback(data?.feedback ?? null);
      }
    } catch {
      // Fail-open — never block.
      acceptLearner(attempt);
    }
  }, [turn, typed, grading, sceneId, languageName, acceptLearner]);

  const acceptCoachAndAdvance = useCallback(() => {
    if (!turn) return;
    play('reveal');
    pushMine(typed.trim() || turn.target);
    setTimeout(advance, 300);
  }, [turn, typed, play, pushMine, advance]);

  if (!turn) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[40vh] py-12 animate-pulse">
        <Fox pose="celebrating" size="sm" aria-label="Conversation complete" />
        <p className="mt-3 text-xs text-[color:var(--text-secondary)]">Wrapping up…</p>
      </div>
    );
  }

  const sideLabel = turn.role === 'learner' ? (turn.side === 'ask' ? 'Your turn — ask' : 'Your turn — reply') : '';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Transcript (scrolls in SceneShell's middle) */}
      <div className="flex-1 space-y-2.5 pb-2">
        <p className="text-center text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)]">
          Conversation · {exchange.label}
        </p>
        {log.map((b) => (
          <div key={b.key} className={`flex ${b.mine ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                b.mine
                  ? 'bg-[color:var(--accent-indonesian)] text-white rounded-br-sm'
                  : 'bg-surface-inset text-foreground rounded-bl-sm'
              }`}
            >
              {!b.mine && (
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-60 mb-0.5">{b.speaker}</p>
              )}
              <p className="text-[15px] font-semibold leading-snug">{b.text}</p>
              {!b.mine && b.en && <p className="text-xs opacity-70 mt-0.5">{b.en}</p>}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Pinned action footer — always at the bottom, above the nav. */}
      <div className="sticky bottom-0 mt-2 pt-2 bg-[var(--background)] thumb-zone">
        {turn.role === 'npc' ? (
          <button
            type="button"
            onClick={advance}
            className="w-full rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold py-3.5 shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-indonesian)_35%,transparent)] active:scale-[0.97] transition-transform"
          >
            Continue →
          </button>
        ) : coach ? (
          // Produce was off — show the natural answer and let them move on.
          <div className="animate-slide-up">
            {feedback && <p className="text-sm text-[color:var(--text-secondary)] mb-2 text-center">{feedback}</p>}
            <div className="rounded-xl bg-surface-inset px-3.5 py-2.5 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--text-secondary)] mb-0.5">
                A natural way to say it
              </p>
              <p className="text-[15px] font-semibold text-foreground">{coach}</p>
            </div>
            <button
              type="button"
              onClick={acceptCoachAndAdvance}
              className="w-full rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold py-3.5 active:scale-[0.97] transition-transform"
            >
              Got it →
            </button>
          </div>
        ) : (
          <div className={shake ? 'animate-shake' : ''}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[color:var(--color-fox-primary)]">
                {sideLabel}
              </p>
              {turn.goal_en && <p className="text-xs text-[color:var(--text-secondary)] truncate ml-2">{turn.goal_en}</p>}
            </div>

            {turn.mode === 'select' && turn.distractors ? (
              <div className="grid grid-cols-1 gap-2.5">
                {options.map((option) => {
                  const isRevealedRight = revealed && option === turn.target;
                  return (
                    <ThumbButton
                      key={option}
                      variant={selected === option ? 'success' : isRevealedRight ? 'success' : 'secondary'}
                      size="md"
                      haptic={false}
                      sound={false}
                      disabled={!!selected}
                      className={`whitespace-normal text-base leading-snug h-auto py-3 ${isRevealedRight ? 'animate-pop' : ''}`}
                      onClick={() => handleSelect(option)}
                    >
                      {option}
                    </ThumbButton>
                  );
                })}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (turn.mode === 'produce') void handleProduce();
                  else handleTypeSubmit();
                }}
                className="flex flex-col gap-2"
              >
                {revealed && turn.mode === 'type' && (
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Answer: <span className="font-bold text-[color:var(--color-fox-primary)]">{turn.target}</span> · type it to continue
                  </p>
                )}
                {turn.hints && turn.hints.length > 0 && !revealed && (
                  <div className="flex flex-wrap gap-1.5">
                    {turn.hints.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTyped((t) => (t ? `${t} ${h}` : h))}
                        className="rounded-full bg-surface-inset border border-card-border px-2.5 py-1 text-xs font-semibold text-text-secondary hover:text-foreground"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={typed}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  inputMode="text"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Type your answer…"
                  disabled={grading}
                  className={`w-full rounded-xl border px-4 py-3 text-base bg-surface-inset text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-default disabled:opacity-60 ${
                    revealed ? 'border-amber-500/60' : 'border-card-border'
                  }`}
                />
                <button
                  type="submit"
                  disabled={grading || typed.trim().length === 0}
                  className="rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold py-3.5 disabled:opacity-40 active:scale-[0.97] transition"
                >
                  {grading ? 'Checking…' : revealed ? 'Type the answer above' : turn.mode === 'produce' ? 'Send →' : 'Check'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
