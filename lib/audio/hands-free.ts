import type {
  HandsFreeState,
  HandsFreeSession,
  SessionSummary,
  PronunciationResult,
  WordWithMnemonic,
} from '@/types/audio';
import { getVoiceForLanguage, getEnglishVoice, speakWithPromise, pauseMs } from './voice-map';
import { fetchWord, getPlaybackSpeed } from './pronunciation';
import { isScoringAvailable, startPronunciationChallenge } from './scoring';
import { narrateMnemonic, stopNarration } from './narration';

export class HandsFreeEngine {
  private onStateChange: (session: HandsFreeSession) => void;
  private abortController: AbortController | null = null;
  private silentAudio: HTMLAudioElement | null = null;

  private state: HandsFreeState = 'idle';
  private currentWordIndex = 0;
  private totalWords = 0;
  private currentWord: { text: string; meaning: string } | null = null;
  private isPaused = false;
  private results: PronunciationResult[] = [];
  private wordIds: string[] = [];
  private startTime = 0;

  constructor(onStateChange: (session: HandsFreeSession) => void) {
    this.onStateChange = onStateChange;
  }

  async start(wordIds: string[]): Promise<void> {
    if (wordIds.length === 0) return;

    this.wordIds = wordIds;
    this.totalWords = wordIds.length;
    this.currentWordIndex = 0;
    this.results = [];
    this.isPaused = false;
    this.startTime = Date.now();
    this.abortController = new AbortController();

    this.setupMediaSession();
    this.startSilentAudio();

    await this.processWord(0);
  }

  pause(): void {
    this.isPaused = true;
    speechSynthesis.pause();
    this.emitState();
  }

  resume(): void {
    this.isPaused = false;
    speechSynthesis.resume();
    this.emitState();
  }

  stop(): SessionSummary {
    const summary = this.buildSummary();
    this.cleanup();
    this.setState('idle');
    return summary;
  }

  private async processWord(index: number): Promise<void> {
    if (index >= this.wordIds.length) {
      this.setState('session_complete');
      this.cleanup();
      return;
    }

    this.currentWordIndex = index;
    const word = await fetchWord(this.wordIds[index]);
    if (!word) {
      // Skip missing words
      await this.processWord(index + 1);
      return;
    }

    this.currentWord = { text: word.text, meaning: word.meaning_en };

    // 1. Play word pronunciation
    this.setState('playing_word');
    await this.checkAbortAndPause();
    await this.speakEnglish('Next word. Listen:');
    await this.checkAbortAndPause();
    await this.playWordTTS(word);
    await pauseMs(1000);

    // 2. Play mnemonic / meaning
    this.setState('playing_mnemonic');
    await this.checkAbortAndPause();
    await this.speakEnglish(`This means: ${word.meaning_en}`);
    if (word.mnemonic) {
      await this.checkAbortAndPause();
      await narrateMnemonic(word.mnemonic);
    }
    await pauseMs(1000);

    // 3. Listen for repeat
    this.setState('waiting_for_repeat');
    await this.checkAbortAndPause();
    await this.speakEnglish('Now you say it:');
    await this.checkAbortAndPause();
    await this.playWordTTS(word);

    let result: PronunciationResult | null = null;
    if (isScoringAvailable(word.language_code)) {
      this.setState('scoring');
      const challenge = await startPronunciationChallenge(this.wordIds[index]);
      result = challenge.result;
    }

    // 4. Give feedback
    this.setState('giving_feedback');
    await this.checkAbortAndPause();

    if (result) {
      await this.speakEnglish(result.feedback);

      // Give one retry if not close_enough
      if (result.score !== 'close_enough') {
        await pauseMs(500);
        await this.speakEnglish('Try one more time:');
        await this.checkAbortAndPause();
        await this.playWordTTS(word);

        if (isScoringAvailable(word.language_code)) {
          const retry = await startPronunciationChallenge(this.wordIds[index]);
          if (retry.result) {
            result = retry.result;
            await this.speakEnglish(retry.result.feedback);
          }
        }
      }

      this.results.push(result);
    } else {
      await this.speakEnglish('Good effort! Moving on.');
      this.results.push({
        score: 'close_enough',
        transcription: '',
        feedback: 'Scoring unavailable',
        targetWord: word.text,
      });
    }

    // 5. Next word
    this.setState('next_word');
    await pauseMs(500);
    await this.checkAbortAndPause();
    await this.processWord(index + 1);
  }

  private async playWordTTS(word: WordWithMnemonic): Promise<void> {
    speechSynthesis.cancel();
    const voice = await getVoiceForLanguage(word.language_code);
    const utterance = new SpeechSynthesisUtterance(word.text);
    if (voice) utterance.voice = voice;
    utterance.rate = getPlaybackSpeed();
    await speakWithPromise(utterance);
  }

  private async speakEnglish(text: string): Promise<void> {
    speechSynthesis.cancel();
    const voice = await getEnglishVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    await speakWithPromise(utterance);
  }

  private async checkAbortAndPause(): Promise<void> {
    if (this.abortController?.signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    while (this.isPaused) {
      await pauseMs(200);
      if (this.abortController?.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
    }
  }

  private setState(state: HandsFreeState): void {
    this.state = state;
    this.emitState();
  }

  private emitState(): void {
    this.onStateChange({
      state: this.state,
      currentWordIndex: this.currentWordIndex,
      totalWords: this.totalWords,
      currentWord: this.currentWord,
      isPaused: this.isPaused,
      results: [...this.results],
    });
  }

  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'WordZoo — Hands-Free Practice',
      artist: 'WordZoo',
    });

    navigator.mediaSession.setActionHandler('play', () => this.resume());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('stop', () => this.stop());
  }

  private startSilentAudio(): void {
    // A silent audio loop keeps the Media Session API alive during TTS
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();

      // Create a dummy audio element to keep media session active
      const audio = new Audio();
      audio.loop = true;
      this.silentAudio = audio;
    } catch {
      // Media Session just won't work — not critical
    }
  }

  private cleanup(): void {
    this.abortController?.abort();
    this.abortController = null;
    speechSynthesis.cancel();
    stopNarration();

    if (this.silentAudio) {
      this.silentAudio.pause();
      this.silentAudio = null;
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    }
  }

  private buildSummary(): SessionSummary {
    const scores: SessionSummary['pronunciationScores'] = {
      close_enough: 0,
      getting_there: 0,
      try_again: 0,
    };
    for (const r of this.results) {
      scores[r.score]++;
    }
    return {
      wordsAttempted: this.results.length,
      pronunciationScores: scores,
      duration: Date.now() - this.startTime,
    };
  }
}
