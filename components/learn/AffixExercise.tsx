'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import type { AffixExercise as AffixExerciseData } from '@/types/database';

interface AffixExerciseProps {
  exercise: AffixExerciseData;
  onComplete: (correct: boolean) => void;
}

export function AffixExercise({ exercise, onComplete }: AffixExerciseProps) {
  switch (exercise.exercise_type) {
    case 'decompose':
      return <DecomposeExercise exercise={exercise} onComplete={onComplete} />;
    case 'construct':
      return <ConstructExercise exercise={exercise} onComplete={onComplete} />;
    case 'match':
      return <MatchExercise exercise={exercise} onComplete={onComplete} />;
    case 'predict':
      return <PredictExercise exercise={exercise} onComplete={onComplete} />;
  }
}

// --- Decompose: Split derived word into affix + root ---

function DecomposeExercise({ exercise, onComplete }: AffixExerciseProps) {
  const [tappedAffix, setTappedAffix] = useState(false);
  const [tappedRoot, setTappedRoot] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Determine the affix part and root part from the derived word
  const { affixPart, rootPart } = useMemo(() => {
    const affix = exercise.target_affix;
    const derived = exercise.derived_word;
    const root = exercise.root_word;

    // Handle circumfix (e.g., "pe-...-an")
    if (affix.includes('...')) {
      const parts = affix.replace(/\.\.\./g, '').split('-').filter(Boolean);
      return {
        affixPart: parts.join('-...-'),
        rootPart: root,
      };
    }

    // Handle prefix (e.g., "me-", "ber-")
    if (affix.endsWith('-')) {
      const prefix = derived.slice(0, derived.length - root.length);
      return { affixPart: prefix.length > 0 ? prefix + '-' : affix, rootPart: root };
    }

    // Handle suffix (e.g., "-an", "-kan")
    if (affix.startsWith('-')) {
      const suffix = derived.slice(root.length);
      return { affixPart: '-' + suffix, rootPart: root };
    }

    return { affixPart: affix, rootPart: root };
  }, [exercise]);

  const handleTapAffix = useCallback(() => {
    setTappedAffix(true);
    if (tappedRoot) {
      setShowExplanation(true);
      setTimeout(() => onComplete(true), 2000);
    }
  }, [tappedRoot, onComplete]);

  const handleTapRoot = useCallback(() => {
    setTappedRoot(true);
    if (tappedAffix) {
      setShowExplanation(true);
      setTimeout(() => onComplete(true), 2000);
    }
  }, [tappedAffix, onComplete]);

  return (
    <div className="animate-slide-up">
      <p className="text-center text-sm text-text-secondary mb-2">Break apart this word:</p>
      <p className="text-center text-2xl font-bold text-accent-id mb-1">{exercise.derived_word}</p>
      <p className="text-center text-sm text-text-secondary mb-6">{exercise.derived_meaning}</p>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={handleTapAffix}
          className={`px-6 py-4 rounded-xl font-bold text-lg transition-all border-2 ${
            tappedAffix
              ? 'bg-accent-id/20 border-accent-id text-accent-id scale-105'
              : 'bg-card-surface border-card-border text-foreground hover:bg-white/10 active:scale-95'
          }`}
        >
          {affixPart}
          {tappedAffix && (
            <span className="block text-xs font-normal mt-1 text-text-secondary">affix</span>
          )}
        </button>

        <button
          onClick={handleTapRoot}
          className={`px-6 py-4 rounded-xl font-bold text-lg transition-all border-2 ${
            tappedRoot
              ? 'bg-green-500/20 border-green-500 text-green-400 scale-105'
              : 'bg-card-surface border-card-border text-foreground hover:bg-white/10 active:scale-95'
          }`}
        >
          {rootPart}
          {tappedRoot && (
            <span className="block text-xs font-normal mt-1 text-text-secondary">root ({exercise.root_meaning})</span>
          )}
        </button>
      </div>

      {!showExplanation && (
        <p className="text-center text-xs text-text-secondary animate-pulse">
          Tap both parts to split the word
        </p>
      )}

      {showExplanation && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">How it works</p>
          <p className="text-sm text-foreground">{exercise.explanation}</p>
        </Card>
      )}
    </div>
  );
}

// --- Construct: Combine affix + root to form derived word ---

function ConstructExercise({ exercise, onComplete }: AffixExerciseProps) {
  const [combined, setCombined] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleCombine = useCallback(() => {
    setCombined(true);
    setTimeout(() => setShowResult(true), 500);
    setTimeout(() => onComplete(true), 2500);
  }, [onComplete]);

  return (
    <div className="animate-slide-up">
      <p className="text-center text-sm text-text-secondary mb-2">Combine to create a new word:</p>

      <div className="flex justify-center items-center gap-3 mb-6">
        <div className="px-4 py-3 rounded-xl bg-card-surface border border-card-border text-center">
          <p className="text-lg font-bold text-foreground">{exercise.root_word}</p>
          <p className="text-xs text-text-secondary">{exercise.root_meaning}</p>
        </div>

        <span className="text-2xl text-text-secondary">+</span>

        <div className="px-4 py-3 rounded-xl bg-accent-id/10 border border-accent-id/30 text-center">
          <p className="text-lg font-bold text-accent-id">{exercise.target_affix}</p>
          <p className="text-xs text-text-secondary">affix</p>
        </div>
      </div>

      {!combined && (
        <button
          onClick={handleCombine}
          className="mx-auto block px-8 py-3 rounded-xl bg-accent-id text-white font-medium transition-all hover:bg-accent-id/80 active:scale-95"
        >
          Combine
        </button>
      )}

      {combined && (
        <div className={`text-center transition-all duration-500 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-3xl font-bold text-green-400 mb-1">{exercise.derived_word}</p>
          <p className="text-sm text-text-secondary">{exercise.derived_meaning}</p>
        </div>
      )}

      {showResult && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Rule</p>
          <p className="text-sm text-foreground">{exercise.explanation}</p>
        </Card>
      )}
    </div>
  );
}

// --- Match: Pair derived forms with meanings ---

function MatchExercise({ exercise, onComplete }: AffixExerciseProps) {
  // Build pairs from the exercise data + distractors
  const pairs = useMemo(() => {
    const items: { word: string; meaning: string }[] = [
      { word: exercise.derived_word, meaning: exercise.derived_meaning },
    ];
    // Use distractors as additional word:meaning pairs (format: "word|meaning")
    if (exercise.distractors) {
      for (const d of exercise.distractors) {
        const parts = d.split('|');
        if (parts.length === 2) {
          items.push({ word: parts[0].trim(), meaning: parts[1].trim() });
        }
      }
    }
    return items;
  }, [exercise]);

  const shuffledMeanings = useMemo(() => {
    const hash = exercise.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return [...pairs]
      .map((p, i) => ({ ...p, sort: (hash * (i + 1) * 37) % 1000 }))
      .sort((a, b) => a.sort - b.sort);
  }, [pairs, exercise.id]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);

  const handleWordClick = useCallback((word: string) => {
    if (matchedPairs.has(word)) return;
    setSelectedWord(word);
    setWrongPair(null);
  }, [matchedPairs]);

  const handleMeaningClick = useCallback((meaning: string, expectedWord: string) => {
    if (!selectedWord) return;
    if (matchedPairs.has(expectedWord)) return;

    // Check if the selected word matches this meaning
    const pair = pairs.find(p => p.word === selectedWord);
    if (pair && pair.meaning === meaning) {
      // Correct match
      const newMatched = new Set(matchedPairs);
      newMatched.add(selectedWord);
      setMatchedPairs(newMatched);
      setSelectedWord(null);
      setWrongPair(null);

      if (newMatched.size === pairs.length) {
        setTimeout(() => onComplete(true), 800);
      }
    } else {
      // Wrong match
      setWrongPair(meaning);
      setTimeout(() => setWrongPair(null), 600);
    }
  }, [selectedWord, matchedPairs, pairs, onComplete]);

  return (
    <div className="animate-slide-up">
      <p className="text-center text-sm text-text-secondary mb-4">Match each word to its meaning:</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column: words */}
        <div className="space-y-2">
          {pairs.map((p) => (
            <button
              key={p.word}
              onClick={() => handleWordClick(p.word)}
              disabled={matchedPairs.has(p.word)}
              className={`w-full px-3 py-3 rounded-xl text-center font-medium transition-all border text-sm ${
                matchedPairs.has(p.word)
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : selectedWord === p.word
                    ? 'bg-accent-id/20 border-accent-id text-accent-id scale-[1.02]'
                    : 'bg-card-surface border-card-border text-foreground hover:bg-white/10 active:scale-95'
              }`}
            >
              {p.word}
            </button>
          ))}
        </div>

        {/* Right column: meanings (shuffled) */}
        <div className="space-y-2">
          {shuffledMeanings.map((p) => (
            <button
              key={p.meaning}
              onClick={() => handleMeaningClick(p.meaning, p.word)}
              disabled={matchedPairs.has(p.word)}
              className={`w-full px-3 py-3 rounded-xl text-center text-sm transition-all border ${
                matchedPairs.has(p.word)
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : wrongPair === p.meaning
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-card-surface border-card-border text-text-secondary hover:bg-white/10 active:scale-95'
              }`}
            >
              {p.meaning}
            </button>
          ))}
        </div>
      </div>

      {matchedPairs.size === pairs.length && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Affix Rule</p>
          <p className="text-sm text-foreground">{exercise.explanation}</p>
        </Card>
      )}
    </div>
  );
}

// --- Predict: Multiple choice meaning prediction ---

function PredictExercise({ exercise, onComplete }: AffixExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const options = useMemo(() => {
    const all = [exercise.derived_meaning, ...(exercise.distractors || []).slice(0, 3)];
    const hash = exercise.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return all
      .map((item, i) => ({ item, sort: (hash * (i + 1) * 31) % 1000 }))
      .sort((a, b) => a.sort - b.sort)
      .map((x) => x.item);
  }, [exercise]);

  const handleSelect = useCallback((option: string) => {
    if (selected) return;
    setSelected(option);
    const correct = option === exercise.derived_meaning;
    setIsCorrect(correct);

    if (correct) {
      setTimeout(() => setShowExplanation(true), 400);
      setTimeout(() => onComplete(true), 2000);
    } else {
      setTimeout(() => {
        setSelected(exercise.derived_meaning);
        setIsCorrect(true);
        setTimeout(() => setShowExplanation(true), 400);
        setTimeout(() => onComplete(false), 1600);
      }, 1000);
    }
  }, [selected, exercise.derived_meaning, onComplete]);

  return (
    <div className="animate-slide-up">
      <p className="text-center text-sm text-text-secondary mb-2">What does this word mean?</p>

      <div className="text-center mb-2">
        <p className="text-sm text-text-secondary">
          <span className="text-accent-id font-medium">{exercise.target_affix}</span>
          {' + '}
          <span className="text-foreground">{exercise.root_word}</span>
          <span className="text-text-secondary"> ({exercise.root_meaning})</span>
        </p>
      </div>

      <p className="text-center text-2xl font-bold text-foreground mb-6">{exercise.derived_word}</p>

      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => {
          let className =
            'min-h-[44px] px-4 py-3 rounded-xl text-center font-medium transition-all border ';

          if (selected === option && isCorrect) {
            className += 'bg-green-500/20 border-green-500 text-green-400 scale-[1.02]';
          } else if (selected === option && !isCorrect) {
            className += 'bg-red-500/20 border-red-500 text-red-400';
          } else if (selected && option === exercise.derived_meaning) {
            className += 'bg-green-500/20 border-green-500 text-green-400';
          } else {
            className += 'bg-card-surface border-card-border text-foreground hover:bg-white/10 active:scale-95';
          }

          return (
            <button
              key={option}
              className={className}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Why?</p>
          <p className="text-sm text-foreground">{exercise.explanation}</p>
        </Card>
      )}
    </div>
  );
}
