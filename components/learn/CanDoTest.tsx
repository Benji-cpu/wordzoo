'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Celebration } from '@/components/ui/Celebration';
import { useXP } from '@/lib/hooks/useXP';

/**
 * The certification test. A delayed (>=48h), UNAIDED production attempt.
 *
 * What is deliberately absent, and must stay absent:
 *   hints, word chips, distractors, a reveal button, target-language audio,
 *   romanization, the reference answer, autocomplete, spellcheck.
 *
 * ConversationBlock ships `hints[]` on its produce turns on purpose — that is
 * PRACTICE, and scaffolding belongs there. Certification is the same act with
 * the scaffolding removed; that difference is the entire measurement. If you
 * are here to "help the learner out a bit", add it to the conversation block
 * instead.
 *
 * This is also why ProductionTyping isn't reused: it has a reveal ladder,
 * fuzzy auto-accept and XP on correct. Every one of those is an aid.
 */

export interface CertifyResult {
  verdict: 'pass' | 'fail' | 'unclear';
  feedback: string;
  reference: string | null;
  acceptNotes: string | null;
  nextEligibleAt: string | null;
  certified: boolean;
}

interface CanDoTestProps {
  canDoId: string;
  sceneId: string;
  statementEn: string;
  promptEn: string;
  onSettled: (result: CertifyResult) => void;
}

export function CanDoTest({
  canDoId,
  sceneId,
  statementEn,
  promptEn,
  onSettled,
}: CanDoTestProps) {
  const [attempt, setAttempt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CertifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const awarded = useRef(false);
  const { award } = useXP();

  const submit = useCallback(async () => {
    const text = attempt.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/can-dos/${canDoId}/certify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt: text }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        setError(json?.error ?? 'Could not check that. Try again in a moment.');
        setSubmitting(false);
        return;
      }
      const data = json.data as CertifyResult;
      setResult(data);
      if (data.verdict === 'pass' && !awarded.current) {
        awarded.current = true;
        void award('can_do_certified');
      }
    } catch {
      setError('Could not reach the server. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }, [attempt, canDoId, submitting, award]);

  if (result) {
    return (
      <div className="space-y-4">
        {result.verdict === 'pass' && <Celebration active variant="scene-complete" />}

        <div className="rounded-2xl bg-[var(--surface-inset)] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            {result.verdict === 'pass'
              ? 'Certified'
              : result.verdict === 'fail'
                ? 'Not yet'
                : "Couldn't check"}
          </p>
          <p className="text-lg font-bold leading-snug">{statementEn}</p>
          <p className="text-sm text-text-secondary mt-2">{result.feedback}</p>

          <p className="mt-4 text-sm">
            <span className="text-text-secondary">You wrote: </span>
            <span className="font-medium">{attempt.trim()}</span>
          </p>

          {/* Safe to reveal now: the verdict is already recorded. */}
          {result.reference && result.verdict === 'fail' && (
            <div className="mt-3 rounded-xl bg-[var(--surface)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                A natural way to say it
              </p>
              <p className="text-base font-semibold">{result.reference}</p>
              {result.acceptNotes && (
                <p className="text-xs text-text-secondary mt-1">{result.acceptNotes}</p>
              )}
            </div>
          )}

          {result.verdict === 'fail' && (
            <p className="mt-3 text-xs text-text-secondary">
              You can try this again tomorrow.{' '}
              <Link href={`/learn/${sceneId}`} className="underline font-medium">
                Practise the scene
              </Link>
            </p>
          )}
          {result.verdict === 'unclear' && (
            <p className="mt-3 text-xs text-text-secondary">
              This one didn&apos;t count against you — it&apos;s still available.
            </p>
          )}
        </div>

        <button
          onClick={() => onSettled(result)}
          className="w-full min-h-[52px] rounded-xl bg-[var(--accent-indonesian)] text-white text-base font-bold"
        >
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface-inset)] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
          Can-do check
        </p>
        <p className="text-base font-bold leading-snug mb-3">{statementEn}</p>
        <p className="text-sm text-text-secondary leading-relaxed">{promptEn}</p>
      </div>

      <div>
        <label htmlFor="candoAttempt" className="sr-only">
          Your answer
        </label>
        <textarea
          id="canDoAttempt"
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={2}
          maxLength={500}
          placeholder="Write it from memory…"
          // No autocomplete, no spellcheck, no autocorrect: a browser
          // suggesting Indonesian words is scaffolding, and this test is
          // supposed to have none.
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full rounded-xl bg-[var(--surface-inset)] p-4 text-base leading-relaxed outline-none focus:ring-2 focus:ring-[var(--accent-indonesian)] resize-none"
        />
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
      </div>

      <button
        onClick={() => void submit()}
        disabled={!attempt.trim() || submitting}
        className="w-full min-h-[52px] rounded-xl bg-[var(--accent-indonesian)] text-white text-base font-bold disabled:opacity-40"
      >
        {submitting ? 'Checking…' : 'Submit'}
      </button>
    </div>
  );
}
