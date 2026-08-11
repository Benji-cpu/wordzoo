// --- Audio Engine Types ---

export type SupportedLanguageCode = 'id' | 'es' | 'ja' | 'pt';

export interface LanguageVoiceConfig {
  bcp47: string;
  fallbackBcp47: string;
  speechRecognitionSupported: boolean;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1.0;

/**
 * `not_scored` is NOT a pass. It means we never obtained a transcript — the
 * browser can't do speech recognition, the mic was denied, nothing was heard,
 * or recognition errored.
 *
 * Every one of those paths used to return `close_enough` with "Great
 * pronunciation! Well done!", so a learner who never granted mic access was
 * congratulated indefinitely and an all-unscoreable session reported 100%.
 * Keep the two concepts apart: only a real transcript can earn a real score.
 */
export type PronunciationScore =
  | 'close_enough'
  | 'getting_there'
  | 'try_again'
  | 'not_scored';

/**
 * `service_blocked` is distinct from `recognition_error` on purpose. It means
 * the browser has no working speech service at all (Brave holds no licence for
 * Google's), so recognition ends the instant it starts. Retrying can never
 * succeed, so the UI must stop offering the mic rather than invite another go.
 */
export type NotScoredReason =
  | 'unsupported_browser'
  | 'service_blocked'
  | 'mic_denied'
  | 'no_speech'
  | 'recognition_error';

export interface PronunciationResult {
  score: PronunciationScore;
  transcription: string;
  feedback: string;
  targetWord: string;
  /** Set only when score === 'not_scored'. */
  reason?: NotScoredReason;
}

export interface PronunciationChallenge {
  wordId: string;
  targetWord: string;
  language: SupportedLanguageCode;
  isListening: boolean;
  result: PronunciationResult | null;
  stop: () => void;
}

export type HandsFreeState =
  | 'idle'
  | 'playing_word'
  | 'playing_mnemonic'
  | 'waiting_for_repeat'
  | 'scoring'
  | 'giving_feedback'
  | 'next_word'
  | 'session_complete';

export interface HandsFreeSession {
  state: HandsFreeState;
  currentWordIndex: number;
  totalWords: number;
  currentWord: { text: string; meaning: string } | null;
  isPaused: boolean;
  results: PronunciationResult[];
}

export interface SessionSummary {
  wordsAttempted: number;
  pronunciationScores: Record<PronunciationScore, number>;
  duration: number;
}

export interface AudioCapabilities {
  speechSynthesis: boolean;
  speechRecognition: boolean;
  mediaSession: boolean;
  getUserMedia: boolean;
}

export interface WordWithMnemonic {
  id: string;
  text: string;
  romanization: string | null;
  pronunciation_audio_url: string | null;
  meaning_en: string;
  language_code: SupportedLanguageCode;
  mnemonic: {
    keyword_text: string;
    scene_description: string;
    audio_url: string | null;
  } | null;
}
