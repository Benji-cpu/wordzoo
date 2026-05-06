'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PhraseQuiz } from '@/components/learn/PhraseQuiz';
import { ProductionTyping } from '@/components/learn/ProductionTyping';
import { Cloze } from '@/components/learn/Cloze';
import { ConfidenceButtons } from '@/components/learn/ConfidenceButtons';
import type { ScenePhraseWithMnemonics } from '@/types/database';
import type { SupportedLanguageCode } from '@/types/audio';
import {
  buildQueue,
  applyCorrect,
  applyWrong,
  currentItem,
  type CueType,
  type DrillQueue,
} from '@/lib/pedagogy/leitner';
import {
  computePhraseEligibility,
  pickPhraseCueType,
  pickClozeWord,
  type PhraseEligibility,
} from '@/lib/pedagogy/phrase-exercise-picker';
import { fireTelemetry } from '@/lib/pedagogy/telemetry';
import { buildPhraseDistractors } from '@/lib/learn/phrase-distractors';

interface PhraseDrillBlockProps {
  /** Phrases being drilled this block. Order is the introduce order. */
  phrases: ScenePhraseWithMnemonics[];
  /** All phrases in the scene — used to source MCQ distractors. */
  scenePhrases: ScenePhraseWithMnemonics[];
  languageCode?: SupportedLanguageCode;
  /** Cue types enabled by the parent. Default = recognition + production. */
  enabledCueTypes?: CueType[];
  /** K — distinct cue types each item must pass before being removed. */
  requiredCueTypes?: number;
  /** Show "I knew it / I guessed" buttons after first-attempt correct. */
  showConfidence?: boolean;
  /** Records phrase-level reviews. `correct=false` → SRS rating 'forgot'. */
  onItemAnswered?: (
    phraseId: string,
    cueType: CueType,
    correct: boolean,
    confidence?: 'knew_it' | 'guessed',
  ) => void;
  /** Fired when the queue empties. */
  onComplete: (queue: DrillQueue) => void;
}

interface BatchEligibilityMap {
  [phraseId: string]: PhraseEligibility;
}

export function PhraseDrillBlock({
  phrases,
  scenePhrases,
  languageCode,
  enabledCueTypes = ['recognition', 'production'],
  requiredCueTypes = 2,
  showConfidence = false,
  onItemAnswered,
  onComplete,
}: PhraseDrillBlockProps) {
  const eligibilityMap = useMemo<BatchEligibilityMap>(() => {
    const out: BatchEligibilityMap = {};
    for (const p of phrases) {
      out[p.id] = computePhraseEligibility(p, scenePhrases.length);
    }
    return out;
  }, [phrases, scenePhrases.length]);

  const phraseById = useMemo(() => {
    const map = new Map<string, ScenePhraseWithMnemonics>();
    for (const p of phrases) map.set(p.id, p);
    return map;
  }, [phrases]);

  const [queue, setQueue] = useState<DrillQueue>(() =>
    buildQueue(
      phrases.map((p) => ({
        itemId: p.id,
        itemType: 'phrase' as const,
        refId: p.id,
      })),
      { requiredCueTypes },
    ),
  );

  const [activeCueType, setActiveCueType] = useState<CueType>(() => {
    const item = currentItem(queue);
    if (!item) return 'recognition';
    const elig = eligibilityMap[item.itemId] ?? defaultEligibility();
    return pickPhraseCueType(item, elig, enabledCueTypes);
  });

  const [attemptKey, setAttemptKey] = useState(0);
  const completedRef = useRef(false);
  const lastWrongRef = useRef(false);
  const [pendingConfidence, setPendingConfidence] = useState<{
    cueType: CueType;
    phraseId: string;
  } | null>(null);

  // Completion check.
  useEffect(() => {
    if (queue.items.length === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete(queue);
    }
  }, [queue, onComplete]);

  // Pick a cue type when the active item changes.
  useEffect(() => {
    const item = currentItem(queue);
    if (!item) return;
    const elig = eligibilityMap[item.itemId] ?? defaultEligibility();
    setActiveCueType(pickPhraseCueType(item, elig, enabledCueTypes));
    setAttemptKey((k) => k + 1);
    lastWrongRef.current = false;
    setPendingConfidence(null);
  }, [queue.cursor, queue.items.length, eligibilityMap, enabledCueTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceCorrect = useCallback(
    (confidence: 'knew_it' | 'guessed' | null) => {
      const item = currentItem(queue);
      if (!item) return;
      onItemAnswered?.(item.itemId, activeCueType, true, confidence ?? undefined);
      fireTelemetry({
        event: 'phrase_drill_correct',
        payload: { phraseId: item.itemId, cueType: activeCueType, tries: item.tries + 1, confidence },
      });
      if (confidence === 'guessed') {
        // Re-queue with gap so a guessed answer resurfaces shortly.
        setQueue((q) => applyWrong(q, activeCueType, 3));
        return;
      }
      setQueue((q) => applyCorrect(q, activeCueType, confidence));
    },
    [queue, activeCueType, onItemAnswered],
  );

  const handleCorrect = useCallback(() => {
    if (lastWrongRef.current) {
      lastWrongRef.current = false;
      return;
    }
    const item = currentItem(queue);
    if (!item) return;
    if (showConfidence && item.tries === 0) {
      setPendingConfidence({ cueType: activeCueType, phraseId: item.itemId });
      return;
    }
    advanceCorrect(null);
  }, [queue, activeCueType, showConfidence, advanceCorrect]);

  const handleWrong = useCallback(() => {
    lastWrongRef.current = true;
    const item = currentItem(queue);
    if (!item) return;
    onItemAnswered?.(item.itemId, activeCueType, false);
    fireTelemetry({
      event: 'phrase_drill_wrong',
      payload: { phraseId: item.itemId, cueType: activeCueType, tries: item.tries + 1 },
    });
    setQueue((q) => applyWrong(q, activeCueType, 2));
  }, [queue, activeCueType, onItemAnswered]);

  const handleConfidencePick = useCallback(
    (confidence: 'knew_it' | 'guessed') => {
      setPendingConfidence(null);
      advanceCorrect(confidence);
    },
    [advanceCorrect],
  );

  const item = currentItem(queue);
  if (!item) return null;

  const phrase = phraseById.get(item.itemId);
  if (!phrase) {
    // Defensive: queue refers to a phrase not in the batch — drop it.
    setQueue((q) => applyCorrect(q, activeCueType));
    return null;
  }

  const header = (
    <div className="text-center mb-2">
      <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)]">
        {queue.items.length} left · {humanCueType(activeCueType)}
      </p>
    </div>
  );

  const confidenceFooter = pendingConfidence ? (
    <ConfidenceButtons
      key={`pconf-${pendingConfidence.phraseId}-${pendingConfidence.cueType}`}
      wordId={pendingConfidence.phraseId}
      cueType={pendingConfidence.cueType}
      onPick={handleConfidencePick}
    />
  ) : null;

  if (activeCueType === 'cloze') {
    const clozeWord = pickClozeWord(phrase);
    if (clozeWord) {
      return (
        <>
          {header}
          <Cloze
            key={`pdrill-cloze-${item.itemId}-${attemptKey}`}
            correctTarget={clozeWord.word_text}
            wordId={clozeWord.word_id}
            meaningEn={clozeWord.word_en}
            phrases={[
              {
                phrase_id: phrase.id,
                text_target: phrase.text_target,
                text_en: phrase.text_en,
                word_text: clozeWord.word_text,
                audio_url: phrase.audio_url,
              },
            ]}
            onCorrect={handleCorrect}
            onAnswer={(correct) => {
              if (!correct) handleWrong();
            }}
          />
          {confidenceFooter}
        </>
      );
    }
    // Defensive: cue picker said cloze, but no eligible word — fall through
    // to recognition/production below.
  }

  if (activeCueType === 'production') {
    const len = phrase.text_target.length;
    const maxEdits = Math.min(5, Math.max(2, Math.floor(len / 4)));
    return (
      <>
        {header}
        <ProductionTyping
          key={`pdrill-prod-${item.itemId}-${attemptKey}`}
          promptEn={phrase.text_en}
          correctTarget={phrase.text_target}
          targetLanguageCode={languageCode}
          wordId={phrase.id /* Cloze/Production both use this as a focus key */}
          audioUrl={phrase.audio_url}
          maxEdits={maxEdits}
          onCorrect={handleCorrect}
          onAnswer={(correct, attempts) => {
            // Mark wrong on the second wrong attempt — matches DrillBlock's
            // word-level production handling. The component still reveals
            // the answer and self-resolves; we just need the queue state
            // updated before that happens.
            if (!correct && attempts === 2) handleWrong();
          }}
        />
        {confidenceFooter}
      </>
    );
  }

  // Recognition (default): MCQ. Picker filters this out for scenes with
  // <4 phrases so distractors should be plentiful; if not, PhraseQuiz
  // gracefully shows fewer options.
  const distractors = buildPhraseDistractors(scenePhrases, phrase.text_target, 3);
  return (
    <>
      {header}
      <PhraseQuiz
        key={`pdrill-rec-${item.itemId}-${attemptKey}`}
        promptText={phrase.text_en}
        correctAnswer={phrase.text_target}
        distractors={distractors}
        onCorrect={handleCorrect}
        onAnswer={(correct) => {
          if (!correct) handleWrong();
        }}
      />
      {confidenceFooter}
    </>
  );
}

function humanCueType(cue: CueType): string {
  switch (cue) {
    case 'recognition': return 'pick the phrase';
    case 'production': return 'type it';
    case 'cloze': return 'fill the blank';
    case 'listening': return 'hear & type';
    case 'pattern': return 'pattern';
  }
}

function defaultEligibility(): PhraseEligibility {
  return { recognitionAvailable: false, clozeAvailable: false, hasAudioUrl: false };
}
