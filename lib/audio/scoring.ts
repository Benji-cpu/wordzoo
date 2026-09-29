import type {
  SupportedLanguageCode,
  PronunciationResult,
  PronunciationChallenge,
} from '@/types/audio';
import { LANGUAGE_VOICE_MAP } from './voice-map';
import { playWordPronunciation, fetchWord } from './pronunciation';
import { stopPlayback } from './player';
import { stopNarration } from './narration';
import { recognitionLang } from './recognition-lang';
import { normalizeSentence } from '@/lib/pedagogy/normalize';
import {
  isSpeechServiceBlocked,
  markSpeechServiceBlocked,
  recordSpeechFailure,
  recordSpeechSuccess,
  speechRetryMessage,
  speechUnavailableMessage,
} from './speech-support';

// Minimal Web Speech API types (not in TypeScript's DOM lib)
interface WebSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface WebSpeechRecognitionEvent {
  results: { [index: number]: { length: number; [index: number]: { transcript: string } } };
}

interface WebSpeechRecognitionErrorEvent {
  error: string;
}

type SpeechRecognitionCtor = new () => WebSpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as Record<string, SpeechRecognitionCtor>).SpeechRecognition ??
    (window as unknown as Record<string, SpeechRecognitionCtor>).webkitSpeechRecognition ??
    null
  );
}

export function isScoringAvailable(languageCode: SupportedLanguageCode): boolean {
  const config = LANGUAGE_VOICE_MAP[languageCode];
  if (!config.speechRecognitionSupported) return false;
  if (getSpeechRecognition() === null) return false;
  // The constructor is present in Brave too, but the service behind it is not.
  // Once we've actually watched it fail, stop claiming the capability.
  return !isSpeechServiceBlocked();
}

export const LISTEN_TIMEOUT_MS = 5000;

/**
 * Open a second mic stream purely to measure loudness while recognition runs.
 *
 * The Web Speech API tells us nothing until it is finished — no "I can hear
 * you", no level, not even confirmation the mic opened. So a UI built on
 * recognition alone can only *claim* to be listening, which is exactly what the
 * speaking session did: a text chip and nothing else. The learner had no way to
 * tell a working mic from a dead one until the session ended.
 *
 * Entirely best-effort. Browsers hand both consumers the same device, but if
 * this stream is refused or the AudioContext won't start, recognition carries on
 * untouched — a missing waveform must never cost someone their attempt.
 */
function startLevelMeter(onLevel: (level: number) => void): () => void {
  let stopped = false;
  let raf = 0;
  let ctx: AudioContext | null = null;
  let stream: MediaStream | null = null;

  navigator.mediaDevices
    ?.getUserMedia({ audio: true })
    .then((s) => {
      if (stopped) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = s;
      ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(s).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (stopped) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        // RMS of speech at a normal distance sits around 0.05-0.15, which is
        // invisible drawn raw. Scaled so ordinary talking fills the meter.
        onLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })
    .catch(() => {});

  return () => {
    stopped = true;
    if (raf) cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    void ctx?.close().catch(() => {});
    onLevel(0);
  };
}

function notScored(
  reason: NonNullable<PronunciationResult['reason']>,
  feedback: string,
  targetWord: string,
): SpeechAttemptResult {
  return { score: 'not_scored', reason, transcription: '', feedback, targetWord, alternatives: [] };
}

/**
 * A `PronunciationResult` plus every alternative the recogniser offered,
 * best-first. Extra field only, so callers written against
 * `PronunciationResult` keep compiling and behaving.
 */
export type SpeechAttemptResult = PronunciationResult & { alternatives: string[] };

export type RecognitionOutcome =
  | { ok: true; alternatives: string[] }
  | { ok: false; reason: NonNullable<PronunciationResult['reason']>; message: string };

export interface RecognitionOptions {
  timeoutMs?: number;
  /** Mic loudness 0-1 while the window is open, then 0 once. Desktop only. */
  onLevel?: (level: number) => void;
  /** The mic is open. This, not the click, is when "listening" is true. */
  onAudioStart?: () => void;
  /** Any sound at all reached the recogniser. */
  onSoundStart?: () => void;
  /** Sound it thinks is speech. */
  onSpeechStart?: () => void;
}

/** Touch phones share one mic between the page and the system recogniser. */
function isTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.maxTouchPoints > 0 || /Android|iPhone|iPad/.test(navigator.userAgent);
}

/**
 * Listen once and hand back what was heard, ungraded.
 *
 * Call it synchronously from a tap: mobile browsers refuse to open the mic
 * otherwise. Never rejects — anything that stops a transcript arriving
 * resolves as `ok: false` with a reason, and that is a microphone problem, not
 * a verdict on the learner.
 */
export function startRecognition(
  languageCode: SupportedLanguageCode | string,
  options: RecognitionOptions = {},
): { promise: Promise<RecognitionOutcome>; stop: () => void } {
  const { timeoutMs = LISTEN_TIMEOUT_MS, onLevel, onAudioStart, onSoundStart, onSpeechStart } = options;
  const fail = (
    reason: NonNullable<PronunciationResult['reason']>,
    message: string,
  ): RecognitionOutcome => ({ ok: false, reason, message });

  const SpeechRec = getSpeechRecognition();
  if (!SpeechRec || LANGUAGE_VOICE_MAP[languageCode as SupportedLanguageCode]?.speechRecognitionSupported === false || isSpeechServiceBlocked()) {
    return {
      promise: Promise.resolve(
        fail(
          isSpeechServiceBlocked() ? 'service_blocked' : 'unsupported_browser',
          speechUnavailableMessage(),
        ),
      ),
      stop: () => {},
    };
  }

  // The recogniser must not have to talk over our own audio, and on some
  // phones a playing clip holds the audio route the mic needs.
  stopPlayback();
  stopNarration();

  let stop = () => {};
  const promise = new Promise<RecognitionOutcome>((resolve) => {
    const recognition = new SpeechRec();

    recognition.lang = recognitionLang(languageCode).bcp47;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    let resolved = false;
    let audioStarted = false;
    let stopMeter = () => {};
    const startedAt = Date.now();
    const timer = setTimeout(() => recognition.stop(), timeoutMs);

    const settle = (outcome: RecognitionOutcome) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      stopMeter();
      resolve(outcome);
    };

    stop = () => {
      recognition.abort();
      settle(fail('no_speech', 'Stopped before anything was scored.'));
    };

    // The listening UI hangs off these, not off the tap: the mic is only open
    // once the browser says so, and a permission prompt can sit in between.
    recognition.onaudiostart = () => {
      audioStarted = true;
      recordSpeechSuccess();
      // A second capture stream while the system recogniser holds the mic
      // starves it on phones. Desktop only, and only once audio is flowing.
      if (onLevel && !isTouchDevice()) stopMeter = startLevelMeter(onLevel);
      onAudioStart?.();
    };
    recognition.onsoundstart = () => onSoundStart?.();
    recognition.onspeechstart = () => onSpeechStart?.();

    recognition.onresult = (event: WebSpeechRecognitionEvent) => {
      const first = event.results[0];
      const alternatives: string[] = [];
      for (let i = 0; first && i < first.length; i++) {
        const t = first[i]?.transcript?.trim();
        if (t) alternatives.push(t);
      }
      if (alternatives.length === 0) {
        settle(fail('no_speech', 'No speech detected — nothing was scored. Tap the mic and try again.'));
        return;
      }
      settle({ ok: true, alternatives });
    };

    recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        settle(fail('mic_denied', 'Mic access is off, so nothing was scored. Allow the mic and try again.'));
        return;
      }

      if (event.error === 'service-not-allowed') {
        markSpeechServiceBlocked();
        settle(fail('service_blocked', speechUnavailableMessage()));
        return;
      }

      // 'network' is often just a dropped connection. Only an immediate
      // failure on a browser without the service (or a second one in a row)
      // latches speech off; anything else is worth another tap.
      if (event.error === 'network') {
        const latched = recordSpeechFailure({ msSinceStart: Date.now() - startedAt, audioStarted });
        settle(
          latched
            ? fail('service_blocked', speechUnavailableMessage())
            : fail('recognition_error', speechRetryMessage()),
        );
        return;
      }

      if (event.error === 'no-speech') {
        settle(fail('no_speech', 'No speech detected — nothing was scored. Tap the mic and try again.'));
        return;
      }

      settle(fail('recognition_error', "We couldn't hear you, so nothing was scored. Try again."));
    };

    recognition.onend = () => {
      settle(fail('no_speech', 'No speech detected — nothing was scored. Tap the mic and try again.'));
    };

    try {
      recognition.start();
    } catch {
      settle(fail('recognition_error', "Listening didn't start, so nothing was checked."));
    }
  });

  return { promise, stop };
}

/**
 * Listen once and score whatever was transcribed against `target`.
 *
 * Target-agnostic on purpose: the original listener was reachable only through
 * a `wordId`, which meant a sentence-level speak turn couldn't use it at all.
 * `startPronunciationChallenge` below is now a thin wrapper, so the hands-free
 * engine's behaviour is unchanged.
 *
 * Never rejects. Anything that stops us obtaining a transcript resolves as
 * `not_scored` with a reason — a microphone problem is not a verdict on the
 * learner, and callers must not treat it as one.
 */
export function startSpeechAttempt(
  target: string,
  languageCode: SupportedLanguageCode,
  options: RecognitionOptions & { romanization?: string | null } = {},
): { promise: Promise<SpeechAttemptResult>; stop: () => void } {
  const { romanization = null, ...recognitionOptions } = options;
  const attempt = startRecognition(languageCode, recognitionOptions);

  const promise = attempt.promise.then((outcome): SpeechAttemptResult => {
    if (!outcome.ok) return notScored(outcome.reason, outcome.message, target);
    return {
      ...scorePronunciation(outcome.alternatives[0], target, languageCode, romanization, outcome.alternatives),
      alternatives: outcome.alternatives,
    };
  });

  return { promise, stop: attempt.stop };
}

export async function startPronunciationChallenge(
  wordId: string
): Promise<PronunciationChallenge> {
  const word = await fetchWord(wordId);
  if (!word) {
    throw new Error('Word not found');
  }

  // Play the word first so the user hears the target
  await playWordPronunciation(wordId);

  const attempt = startSpeechAttempt(word.text, word.language_code, {
    romanization: word.romanization,
  });

  const challenge: PronunciationChallenge = {
    wordId,
    targetWord: word.text,
    language: word.language_code,
    isListening: true,
    result: null,
    stop: attempt.stop,
  };

  challenge.result = await attempt.promise;
  challenge.isListening = false;
  return challenge;
}

export function scorePronunciation(
  transcription: string,
  targetWord: string,
  language: SupportedLanguageCode,
  romanization: string | null = null,
  alternatives: string[] = [],
): PronunciationResult {
  const normalizedTarget = normalizeSentence(targetWord);
  const normalizedRoman = language === 'ja' && romanization ? normalizeSentence(romanization) : null;

  // Best alternative wins: the recogniser's first guess is often a near-homophone.
  let similarity = -1;
  let heard = transcription;
  for (const candidate of [transcription, ...alternatives]) {
    const c = normalizeSentence(candidate);
    let sim = levenshteinSimilarity(c, normalizedTarget);
    // For Japanese, also compare against romanization
    if (normalizedRoman) sim = Math.max(sim, levenshteinSimilarity(c, normalizedRoman));
    if (sim > similarity) {
      similarity = sim;
      heard = candidate;
    }
  }
  transcription = heard;

  if (similarity >= 0.7) {
    return {
      score: 'close_enough',
      transcription,
      feedback: 'Great pronunciation! Well done!',
      targetWord,
    };
  }

  if (similarity >= 0.4) {
    return {
      score: 'getting_there',
      transcription,
      feedback: 'Almost there! Try listening again and repeating.',
      targetWord,
    };
  }

  return {
    score: 'try_again',
    transcription,
    feedback: `Let's try once more. Listen carefully to "${targetWord}".`,
    targetWord,
  };
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }

  return dp[n];
}
