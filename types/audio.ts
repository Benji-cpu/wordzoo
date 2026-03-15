// --- Audio Engine Types ---

export type SupportedLanguageCode = 'id' | 'es' | 'ja';

export interface LanguageVoiceConfig {
  bcp47: string;
  fallbackBcp47: string;
  speechRecognitionSupported: boolean;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1.0;

export type PronunciationScore = 'close_enough' | 'getting_there' | 'try_again';

export interface PronunciationResult {
  score: PronunciationScore;
  transcription: string;
  feedback: string;
  targetWord: string;
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
