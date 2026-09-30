'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Celebration } from '@/components/ui/Celebration';
import { SpeakAnswer } from '@/components/audio/SpeakAnswer';
import { recognitionLang } from '@/lib/audio/recognition-lang';
import { playPhraseAudio, stopPlayback } from '@/lib/audio/pronunciation';
import { usePace } from '@/lib/hooks/usePace';
import { useXP } from '@/lib/hooks/useXP';
import type { DueCanDo } from '@/lib/db/can-do-queries';

/**
 * The certification test. A delayed (>=48h), UNAIDED production attempt.
 *
 * What is deliberately absent BEFORE the verdict, and must stay absent:
 *   hints, word chips, distractors, a reveal button, target-language audio,
 *   romanization, the reference answer, autocomplete, spellcheck.
 * The English prompt may be read aloud ("Read it to me"): that is the question,
 * not the answer. Target-language audio only exists after the verdict.
 *
 * ConversationBlock ships `hints[]` on its produce turns on purpose — that is
 * PRACTICE, and scaffolding belongs there. Certification is the same act with
 * the scaffolding removed; that difference is the entire measurement.
 *
 * Nothing here dead-ends: every state keeps Skip or Continue on screen, and no
 * server error string is ever printed (a raw "Forbidden" once read as "you ran
 * out of usage").
 */

export type CanDoVerdict = 'pass' | 'fail' | 'unclear' | 'gave_up' | 'skipped';

export interface CanDoOutcome {
  verdict: CanDoVerdict;
}

/** The certify route's 200 payload. */
export interface CertifyResult {
  verdict: 'pass' | 'fail' | 'unclear' | 'gave_up';
  feedback: string;
  reference: string | null;
  acceptNotes: string | null;
  nextEligibleAt: string | null;
  certified: boolean;
  alreadySettled: boolean;
  gaveUp: boolean;
}

interface CanDoTestProps {
  canDo: DueCanDo;
  languageCode: string;
  onSettled: (outcome: CanDoOutcome) => void;
}

type Mode = 'spoken' | 'typed';
type Reply = { ok: true; data: CertifyResult } | { ok: false; message: string };

const REQUEST_TIMEOUT_MS = 20_000;
const VERDICTS = ['pass', 'fail', 'unclear', 'gave_up'];

const PRIMARY_BTN =
  'w-full min-h-[52px] rounded-xl bg-accent-default text-white text-base font-bold disabled:opacity-40';
const QUIET_BTN =
  'min-h-[48px] px-3 rounded-xl text-sm font-semibold text-text-secondary underline-offset-2 hover:underline disabled:opacity-40';

/** "3:40 PM" today, "tomorrow 3:40 PM", otherwise "Sat 3:40 PM" — in the device's zone. */
function formatLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'later';
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
  if (days <= 0) return time;
  if (days === 1) return `tomorrow ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
}

async function postCertify(canDoId: string, body: Record<string, unknown>): Promise<Reply> {
  try {
    const res = await fetch(`/api/can-dos/${canDoId}/certify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(REQUEST_TIMEOUT_MS) : undefined,
    });
    if (res.status === 401) return { ok: false, message: 'Please sign in again.' };
    if (res.status === 429) {
      return { ok: false, message: 'Too many tries just now. Wait a minute, or skip and come back.' };
    }
    const json = await res.json().catch(() => null);
    const data = json?.data;
    if (!res.ok || !data || !VERDICTS.includes(data.verdict)) {
      return { ok: false, message: "Couldn't reach the checker — skip and come back." };
    }
    return { ok: true, data: data as CertifyResult };
  } catch {
    return { ok: false, message: "Couldn't reach the checker — skip and come back." };
  }
}

export function CanDoTest({ canDo, languageCode, onSettled }: CanDoTestProps) {
  const [attempt, setAttempt] = useState('');
  const [mode, setMode] = useState<Mode>('typed');
  const [boxOpen, setBoxOpen] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: CertifyResult; attempt: string } | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [canReadAloud, setCanReadAloud] = useState(false);
  const [reading, setReading] = useState(false);
  const [refPlaying, setRefPlaying] = useState(false);

  // A ref, not state: state lags a render, so Enter + tap could both pass.
  const inFlight = useRef(false);
  const awarded = useRef(false);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const { award } = useXP();
  const { beat, reduced } = usePace();
  const { bcp47 } = recognitionLang(languageCode);

  useEffect(() => {
    setCanReadAloud(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
      stopPlayback();
    };
  }, []);

  useEffect(() => {
    if (focusNonce > 0) boxRef.current?.focus();
  }, [focusNonce]);

  // Confetti is a beat, not a fixture.
  useEffect(() => {
    if (!celebrate) return;
    const id = setTimeout(() => setCelebrate(false), Math.max(beat('toast'), 900));
    return () => clearTimeout(id);
  }, [celebrate, beat]);

  const stopEnglish = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setReading(false);
  }, []);

  const readPrompt = useCallback(() => {
    if (reading) return stopEnglish();
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(canDo.prompt_en);
      utt.lang = 'en-US';
      utt.onend = () => setReading(false);
      utt.onerror = () => setReading(false);
      setReading(true);
      synth.speak(utt);
    } catch {
      setReading(false);
    }
  }, [reading, stopEnglish, canDo.prompt_en]);

  const openBox = useCallback((focus: boolean) => {
    setBoxOpen(true);
    if (focus) setFocusNonce((n) => n + 1);
  }, []);

  const handleHeard = useCallback(
    (alternatives: string[]) => {
      // Editable, so a mishearing is fixable before it is graded.
      setAttempt(alternatives[0] ?? '');
      setMode('spoken');
      setNotice(null);
      openBox(false);
    },
    [openBox],
  );

  // SpeakAnswer shows its own message for the failure; we only make typing available.
  const handleMicUnavailable = useCallback(
    (reason: string) => openBox(reason !== 'no_speech'),
    [openBox],
  );

  const send = useCallback(
    async (body: Record<string, unknown>, written: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSubmitting(true);
      setNotice(null);
      stopEnglish();
      try {
        const reply = await postCertify(canDo.can_do_id, body);
        if (!reply.ok) {
          setNotice(reply.message);
          return;
        }
        const { data } = reply;
        setResult({ data, attempt: written });
        if (data.verdict === 'pass' && !data.alreadySettled && !awarded.current) {
          awarded.current = true;
          setCelebrate(!reduced);
          void award('can_do_certified');
        }
      } finally {
        inFlight.current = false;
        setSubmitting(false);
      }
    },
    [canDo.can_do_id, award, reduced, stopEnglish],
  );

  const submit = useCallback(() => {
    const text = attempt.trim();
    if (!text) return;
    void send({ attempt: text, mode }, text);
  }, [attempt, mode, send]);

  const giveUp = useCallback(() => void send({ gaveUp: true }, ''), [send]);

  const skip = useCallback(() => {
    stopEnglish();
    onSettled({ verdict: 'skipped' });
  }, [onSettled, stopEnglish]);

  const playReference = useCallback(
    (text: string) => {
      setRefPlaying(true);
      // TTS is fine now: the verdict is recorded, so audio can't help the score.
      void playPhraseAudio(null, { text, languageCode })
        .catch(() => {})
        .finally(() => setRefPlaying(false));
    },
    [languageCode],
  );

  // ---------------------------------------------------------------- result

  if (result) {
    const { data } = result;
    const settle = () => {
      stopPlayback();
      onSettled({ verdict: data.verdict });
    };
    const resting = data.alreadySettled && data.verdict === 'unclear' && data.nextEligibleAt;

    const heading =
      data.verdict === 'pass'
        ? data.alreadySettled
          ? 'Already done ✓'
          : 'Certified ✓'
        : data.verdict === 'fail'
          ? 'Not yet'
          : data.verdict === 'gave_up'
            ? 'Here is how it goes'
            : resting
              ? 'Resting'
              : "Couldn't check";

    const line =
      data.verdict === 'pass'
        ? data.alreadySettled
          ? null
          : data.feedback
        : data.verdict === 'fail'
          ? data.feedback
          : data.verdict === 'gave_up'
            ? "No worries. We'll bring these phrases back for practice."
            : resting
              ? `Resting until ${formatLocal(data.nextEligibleAt as string)}`
              : "Couldn't check that one — no penalty";

    const showReference = data.reference && (data.verdict === 'fail' || data.verdict === 'gave_up');

    return (
      <div className="relative space-y-4">
        {celebrate && <Celebration active variant="scene-complete" />}

        <div className="rounded-2xl bg-[var(--surface-inset)] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            {heading}
          </p>
          <p className="text-lg font-bold leading-snug">{canDo.statement_en}</p>
          {line && <p className="text-sm text-text-secondary mt-2">{line}</p>}

          {result.attempt && data.verdict !== 'gave_up' && !data.alreadySettled && (
            <p className="mt-4 text-sm">
              <span className="text-text-secondary">{mode === 'spoken' ? 'You said: ' : 'You wrote: '}</span>
              <span className="font-medium">{result.attempt}</span>
            </p>
          )}

          {/* Safe to reveal now: the verdict is already recorded. */}
          {showReference && (
            <div className="mt-3 rounded-xl bg-[var(--surface)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                A natural way to say it
              </p>
              <div className="flex items-start gap-3">
                <p className="flex-1 text-base font-semibold" lang={bcp47}>
                  {data.reference}
                </p>
                <button
                  type="button"
                  onClick={() => playReference(data.reference as string)}
                  disabled={refPlaying}
                  aria-label="Play the reference"
                  className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-accent-default text-white disabled:opacity-50"
                >
                  <PlayIcon />
                </button>
              </div>
              {data.acceptNotes && (
                <p className="text-xs text-text-secondary mt-1">{data.acceptNotes}</p>
              )}
            </div>
          )}

          {data.verdict === 'gave_up' && data.reference && (
            <div className="mt-4 flex flex-col items-center">
              <SpeakAnswer
                languageCode={languageCode}
                onResult={() => {}}
                label="Tap and say it once"
              />
              <p className="mt-1 text-xs text-text-secondary">Just for practice, not graded.</p>
            </div>
          )}

          {(data.verdict === 'fail' || data.verdict === 'gave_up') && (
            <p className="mt-3 text-xs text-text-secondary">
              {data.nextEligibleAt && <>You can try again from {formatLocal(data.nextEligibleAt)}. </>}
              <Link href={`/learn/${canDo.scene_id}`} className="underline font-medium">
                Practise the scene
              </Link>
            </p>
          )}
        </div>

        <button type="button" onClick={settle} className={PRIMARY_BTN}>
          Continue →
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------- answer

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface-inset)] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
          Can-do check
        </p>
        <p className="text-base font-bold leading-snug mb-3">{canDo.statement_en}</p>
        <p className="text-sm text-text-secondary leading-relaxed">{canDo.prompt_en}</p>
        {canReadAloud && (
          <button
            type="button"
            onClick={readPrompt}
            className="mt-3 min-h-[44px] rounded-full bg-[var(--surface)] px-4 text-sm font-semibold"
          >
            {reading ? 'Stop' : 'Read it to me'}
          </button>
        )}
      </div>

      {/* Capture phase: the mic must not hear the English prompt being read. */}
      <div onClickCapture={stopEnglish}>
        <SpeakAnswer
          languageCode={languageCode}
          onResult={handleHeard}
          onUnavailable={handleMicUnavailable}
          disabled={submitting}
        />
      </div>

      {!boxOpen && (
        <div className="text-center">
          <button type="button" onClick={() => openBox(true)} className={QUIET_BTN}>
            Type instead
          </button>
        </div>
      )}

      {boxOpen && (
        <div>
          {mode === 'spoken' ? (
            <label htmlFor="canDoAttempt" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
              Heard — fix it if it misheard
            </label>
          ) : (
            <label htmlFor="canDoAttempt" className="sr-only">
              Your answer
            </label>
          )}
          <textarea
            id="canDoAttempt"
            ref={boxRef}
            value={attempt}
            lang={bcp47}
            onChange={(e) => {
              setAttempt(e.target.value);
              // Fixing a transcript stays spoken; clearing the box and typing is typed.
              if (!e.target.value.trim()) setMode('typed');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (attempt.trim()) submit();
              }
            }}
            rows={2}
            maxLength={500}
            placeholder="Say it, or write it from memory…"
            // No autocomplete, no spellcheck, no autocorrect: a keyboard
            // suggesting target-language words is scaffolding, and this test is
            // supposed to have none.
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full rounded-xl bg-[var(--surface-inset)] p-4 text-base leading-relaxed outline-none focus:ring-2 focus:ring-accent-default resize-none"
          />
        </div>
      )}

      {notice && (
        <p role="alert" className="text-sm text-rose-500">
          {notice}
        </p>
      )}

      {boxOpen && (
        <button
          type="button"
          onClick={submit}
          disabled={!attempt.trim() || submitting}
          className={PRIMARY_BTN}
        >
          {submitting ? 'Checking…' : 'Submit'}
        </button>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-2">
        <button type="button" onClick={giveUp} disabled={submitting} className={QUIET_BTN}>
          I don&apos;t know — show me
        </button>
        <button type="button" onClick={skip} disabled={submitting} className={QUIET_BTN}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
