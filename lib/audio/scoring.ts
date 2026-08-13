import type {
  SupportedLanguageCode,
  PronunciationResult,
  PronunciationChallenge,
} from '@/types/audio';
import { LANGUAGE_VOICE_MAP } from './voice-map';
import { playWordPronunciation, fetchWord } from './pronunciation';
import {
  isSpeechServiceBlocked,
  markSpeechServiceBlocked,
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
  start(): void;
  stop(): void;
  abort(): void;
}

interface WebSpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
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
): PronunciationResult {
  return { score: 'not_scored', reason, transcription: '', feedback, targetWord };
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
  options: {
    romanization?: string | null;
    timeoutMs?: number;
    /** Mic loudness 0-1 while the window is open, then 0 once. Best-effort. */
    onLevel?: (level: number) => void;
  } = {},
): { promise: Promise<PronunciationResult>; stop: () => void } {
  const { romanization = null, timeoutMs = LISTEN_TIMEOUT_MS, onLevel } = options;

  if (!isScoringAvailable(languageCode)) {
    return {
      promise: Promise.resolve(
        notScored(
          isSpeechServiceBlocked() ? 'service_blocked' : 'unsupported_browser',
          speechUnavailableMessage(),
          target,
        ),
      ),
      stop: () => {},
    };
  }

  let stop = () => {};
  const promise = new Promise<PronunciationResult>((resolve) => {
    const SpeechRec = getSpeechRecognition()!;
    const recognition = new SpeechRec();
    const config = LANGUAGE_VOICE_MAP[languageCode];

    recognition.lang = config.bcp47;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    let resolved = false;
    const timer = setTimeout(() => recognition.stop(), timeoutMs);
    const stopMeter = onLevel ? startLevelMeter(onLevel) : () => {};

    const settle = (result: PronunciationResult) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      stopMeter();
      resolve(result);
    };

    stop = () => {
      recognition.abort();
      settle(
        notScored('no_speech', 'Stopped before anything was scored.', target),
      );
    };

    recognition.onresult = (event: WebSpeechRecognitionEvent) => {
      const transcription = event.results[0][0].transcript;
      settle(scorePronunciation(transcription, target, languageCode, romanization));
    };

    recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        settle(
          notScored(
            'mic_denied',
            'Mic access is off, so nothing was scored. Allow the mic and try again.',
            target,
          ),
        );
        return;
      }

      // The browser has no working speech service — Brave holds no licence for
      // one, and both codes also cover a blocked or unreachable service. The
      // learner did nothing wrong and retrying cannot help, so remember it and
      // say so instead of asking them to speak up.
      if (event.error === 'service-not-allowed' || event.error === 'network') {
        markSpeechServiceBlocked();
        settle(notScored('service_blocked', speechUnavailableMessage(), target));
        return;
      }

      settle(
        notScored(
          'recognition_error',
          "We couldn't hear you, so nothing was scored. Try again.",
          target,
        ),
      );
    };

    recognition.onend = () => {
      settle(
        notScored(
          'no_speech',
          'No speech detected — nothing was scored. Tap the mic and try again.',
          target,
        ),
      );
    };

    try {
      recognition.start();
    } catch {
      settle(
        notScored(
          'recognition_error',
          "Listening didn't start, so nothing was checked.",
          target,
        ),
      );
    }
  });

  return { promise, stop };
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
  romanization: string | null = null
): PronunciationResult {
  const normalizedTranscript = normalize(transcription);
  const normalizedTarget = normalize(targetWord);

  let similarity = levenshteinSimilarity(normalizedTranscript, normalizedTarget);

  // For Japanese, also compare against romanization
  if (language === 'ja' && romanization) {
    const romanSimilarity = levenshteinSimilarity(
      normalizedTranscript,
      normalize(romanization)
    );
    similarity = Math.max(similarity, romanSimilarity);
  }

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

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
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
