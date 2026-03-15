import type {
  SupportedLanguageCode,
  PronunciationResult,
  PronunciationChallenge,
} from '@/types/audio';
import { LANGUAGE_VOICE_MAP } from './voice-map';
import { playWordPronunciation, fetchWord } from './pronunciation';

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
  return getSpeechRecognition() !== null;
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

  const challenge: PronunciationChallenge = {
    wordId,
    targetWord: word.text,
    language: word.language_code,
    isListening: false,
    result: null,
    stop: () => {},
  };

  if (!isScoringAvailable(word.language_code)) {
    challenge.result = {
      score: 'close_enough',
      transcription: '',
      feedback: 'Pronunciation scoring is not available in this browser. Keep practicing!',
      targetWord: word.text,
    };
    return challenge;
  }

  return listenAndScore(challenge, word.text, word.language_code, word.romanization);
}

function listenAndScore(
  challenge: PronunciationChallenge,
  targetWord: string,
  langCode: SupportedLanguageCode,
  romanization: string | null
): Promise<PronunciationChallenge> {
  return new Promise((resolve) => {
    const SpeechRec = getSpeechRecognition()!;
    const recognition = new SpeechRec();
    const config = LANGUAGE_VOICE_MAP[langCode];

    recognition.lang = config.bcp47;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    let resolved = false;

    challenge.isListening = true;
    challenge.stop = () => {
      recognition.abort();
      if (!resolved) {
        resolved = true;
        challenge.isListening = false;
        resolve(challenge);
      }
    };

    const timeout = setTimeout(() => {
      recognition.stop();
    }, 5000);

    recognition.onresult = (event: WebSpeechRecognitionEvent) => {
      clearTimeout(timeout);
      const transcription = event.results[0][0].transcript;
      challenge.result = scorePronunciation(transcription, targetWord, langCode, romanization);
      challenge.isListening = false;
      resolved = true;
      resolve(challenge);
    };

    recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
      clearTimeout(timeout);
      challenge.isListening = false;

      if (event.error === 'not-allowed') {
        challenge.result = {
          score: 'close_enough',
          transcription: '',
          feedback: 'Microphone access is needed for pronunciation practice. Please allow mic access and try again.',
          targetWord,
        };
      } else {
        challenge.result = {
          score: 'close_enough',
          transcription: '',
          feedback: 'Could not hear you clearly. Keep practicing!',
          targetWord,
        };
      }

      if (!resolved) {
        resolved = true;
        resolve(challenge);
      }
    };

    recognition.onend = () => {
      clearTimeout(timeout);
      if (!resolved) {
        challenge.isListening = false;
        challenge.result = {
          score: 'close_enough',
          transcription: '',
          feedback: 'No speech detected. Tap the mic and try again!',
          targetWord,
        };
        resolved = true;
        resolve(challenge);
      }
    };

    try {
      recognition.start();
    } catch {
      clearTimeout(timeout);
      challenge.isListening = false;
      challenge.result = {
        score: 'close_enough',
        transcription: '',
        feedback: 'Pronunciation scoring is not available. Keep practicing!',
        targetWord,
      };
      if (!resolved) {
        resolved = true;
        resolve(challenge);
      }
    }
  });
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
