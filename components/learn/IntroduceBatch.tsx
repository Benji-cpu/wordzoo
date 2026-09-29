'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { WordCard } from '@/components/learn/WordCard';
import { MnemonicCard } from '@/components/learn/MnemonicCard';
import { CollapsibleWordFamily } from '@/components/learn/WordFamilyCard';
import type { LearnWord } from '@/types/learn';
import type { SupportedLanguageCode } from '@/types/audio';

interface IntroduceBatchProps {
  words: LearnWord[];
  /** 0-based batch index, used for the "Words 1-3 of 6" caption. */
  batchIndex: number;
  /** Word indices of the full scene's word list this batch covers. */
  globalIndexStart: number;
  totalWords: number;
  languageName: string;
  languageCode?: SupportedLanguageCode;
  /** Pedagogy v2 introduce hook (fired by WordCard on first mount). */
  recordIntroduce?: boolean;
  onIntroduceBlocked?: (upgradeMessage: string | null) => void;
  /**
   * Enter on the last screen instead of the first. Set when the learner backs
   * out of the drill: the screen before the drill is the handoff, not word 1.
   */
  startAtEnd?: boolean;
  /**
   * Hands the parent a closure that steps back one card, returning false once
   * there is nothing left to step back to. Without it the parent's back button
   * can only skip the whole batch, which is what made "back" feel like it threw
   * you to the start of the section.
   */
  registerBack?: (goBack: (() => boolean) | null) => void;
  onComplete: () => void;
}

type Step = { wordIdx: number; sub: 'word' | 'mnemonic' };

/**
 * Batched introduction phase. Walks the user through N words consecutively
 * as WordCard → MnemonicCard, with no inline quizzes — retrieval happens
 * after the batch in the DrillBlock.
 *
 * The drill button at the end ("Drill these N words →") is the handoff.
 */
export function IntroduceBatch({
  words,
  batchIndex,
  globalIndexStart,
  totalWords,
  languageName,
  languageCode,
  recordIntroduce,
  onIntroduceBlocked,
  startAtEnd,
  registerBack,
  onComplete,
}: IntroduceBatchProps) {
  // A word gets a mnemonic step only when it has a written mnemonic. There is
  // no on-demand generation any more (deleted 2026-09-29: every pt word ships
  // with one), so a word without one goes straight from its card to the drill.
  const steps = useMemo<Step[]>(() => {
    const out: Step[] = [];
    words.forEach((w, i) => {
      out.push({ wordIdx: i, sub: 'word' });
      if (w.mnemonic) out.push({ wordIdx: i, sub: 'mnemonic' });
    });
    return out;
  }, [words]);

  // `startAtEnd` is only read on mount — the parent remounts this component
  // (keyed by batch) whenever it wants a different entry point.
  const [stepIdx, setStepIdx] = useState(() => (startAtEnd ? Math.max(0, steps.length - 1) : 0));
  const [readyToDrill, setReadyToDrill] = useState(Boolean(startAtEnd));
  const introducedRef = useRef<Set<string>>(new Set());

  const advance = useCallback(() => {
    if (stepIdx + 1 >= steps.length) {
      setReadyToDrill(true);
      return;
    }
    setStepIdx((i) => i + 1);
  }, [stepIdx, steps.length]);

  /** Exact reverse of `advance`: handoff → last card → … → first card. */
  const goBack = useCallback((): boolean => {
    if (readyToDrill) {
      setReadyToDrill(false);
      return true;
    }
    if (stepIdx > 0) {
      setStepIdx((i) => i - 1);
      return true;
    }
    return false;
  }, [readyToDrill, stepIdx]);

  // Register a stable wrapper once; the ref keeps it pointed at the current
  // step so the parent never holds a stale closure.
  const goBackRef = useRef(goBack);
  useEffect(() => {
    goBackRef.current = goBack;
  }, [goBack]);
  useEffect(() => {
    if (!registerBack) return;
    registerBack(() => goBackRef.current());
    return () => registerBack(null);
  }, [registerBack]);

  // Introduce gate: when `recordIntroduce` is on (Pedagogy v2 mastery slice),
  // ping the introduce endpoint the first time we land on each word's card.
  // Server returns `{allowed: false}` when the daily limit is hit; surface
  // that to the parent so it can show an upgrade nudge. Idempotent on the
  // server (ON CONFLICT DO NOTHING), but we also de-dupe client-side.
  useEffect(() => {
    if (!recordIntroduce) return;
    const step = steps[stepIdx];
    if (!step || step.sub !== 'word') return;
    const word = words[step.wordIdx];
    if (!word || introducedRef.current.has(word.word.id)) return;
    introducedRef.current.add(word.word.id);
    fetch(`/api/words/by-id/${word.word.id}/introduce`, { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res?.data?.allowed === false) {
          onIntroduceBlocked?.(res.data.upgradeMessage ?? null);
        }
      })
      .catch(() => {});
  }, [recordIntroduce, stepIdx, steps, words, onIntroduceBlocked]);

  if (words.length === 0) {
    // Defensive: empty batch — hand off immediately.
    onComplete();
    return null;
  }

  if (readyToDrill) {
    return (
      <div className="flex flex-col items-center justify-center text-center flex-1 min-h-0 py-12 px-6 animate-spring-in">
        <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)] mb-3">
          Batch {batchIndex + 1} · Words {globalIndexStart + 1}–{globalIndexStart + words.length} of {totalWords}
        </p>
        <h2
          className="font-display text-[color:var(--color-fox-primary)] leading-[0.95] mb-4"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)' }}
        >
          You&apos;ve met them all
        </h2>
        <p className="text-sm text-[color:var(--text-secondary)] max-w-sm mb-8">
          Now let&apos;s see if they stick. The next few exercises will mix
          recognition, typing, and listening — wrong answers come back later
          in a different shape.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-xl bg-[color:var(--color-fox-primary)] text-white font-bold py-3 px-6 active:scale-[0.98] transition"
        >
          Drill these {words.length} words →
        </button>
      </div>
    );
  }

  const step = steps[stepIdx];
  const word = words[step.wordIdx];

  if (step.sub === 'word') {
    // The introduce-gate fetch lives in the effect above so we don't have
    // to fork WordCard's interface for a Pedagogy v2 concern.
    return (
      <WordCard
        key={`intro-word-${word.word.id}`}
        text={word.word.text}
        romanization={word.word.romanization}
        meaningEn={word.word.meaning_en}
        partOfSpeech={word.word.part_of_speech}
        wordId={word.word.id}
        audioUrl={word.word.pronunciation_audio_url}
        languageCode={languageCode}
        informalText={word.word.informal_text}
        unitIndex={globalIndexStart + step.wordIdx}
        onContinue={advance}
      />
    );
  }

  // mnemonic — steps only include this sub-step when the word has one.
  const mnemonic = word.mnemonic;
  if (!mnemonic) return null;

  return (
    <>
      <MnemonicCard
        key={`intro-mn-${word.word.id}`}
        wordText={word.word.text}
        keyword={mnemonic.keyword_text}
        sceneDescription={mnemonic.scene_description}
        bridgeSentence={mnemonic.bridge_sentence}
        imageUrl={mnemonic.image_url}
        mnemonicId={mnemonic.id}
        wordId={word.word.id}
        meaningEn={word.word.meaning_en}
        languageName={languageName}
        onContinue={advance}
      />
      {word.wordFamilies && word.wordFamilies.length > 0 ? (
        <CollapsibleWordFamily
          rootWord={{
            text: word.word.text,
            meaning: word.word.meaning_en,
          }}
          derivedForms={word.wordFamilies}
        />
      ) : null}
    </>
  );
}
