import type {
  HandsFreeState,
  HandsFreeSession,
  SessionSummary,
  PronunciationResult,
  WordWithMnemonic,
} from '@/types/audio';
import { pauseMs } from './voice-map';
import { fetchWord, stopPlayback } from './pronunciation';
import { speak, prewarm } from './voice';
import { isScoringAvailable, startSpeechAttempt, LISTEN_TIMEOUT_MS } from './scoring';
import { narrateMnemonic, stopNarration } from './narration';

/**
 * The gap between beats of the loop.
 *
 * Was a flat second everywhere, which reads as the app having stalled — long
 * enough to wonder whether something broke, not long enough to do anything
 * with. 450ms is a breath: it separates the phrases without inviting you to
 * check the screen.
 */
const BEAT = 450;

/** Thrown by `checkAbortAndPause` when the learner ends the session. Expected. */
function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export class HandsFreeEngine {
  private onStateChange: (session: HandsFreeSession) => void;
  private onLevel: (level: number) => void;
  private abortController: AbortController | null = null;
  private silentAudio: HTMLAudioElement | null = null;

  private state: HandsFreeState = 'idle';
  private currentWordIndex = 0;
  private totalWords = 0;
  private currentWord: { text: string; meaning: string } | null = null;
  /** Kept whole (not just text + meaning) so `replay()` can re-speak it. */
  private currentWordFull: WordWithMnemonic | null = null;
  private isPaused = false;
  private results: PronunciationResult[] = [];
  private wordIds: string[] = [];
  private startTime = 0;
  private listenDeadline: number | null = null;
  private error: string | null = null;
  private stopListening: (() => void) | null = null;
  /** Set by `stop()` so in-flight awaits don't emit state over 'idle'. */
  private stopped = false;

  constructor(
    onStateChange: (session: HandsFreeSession) => void,
    onLevel: (level: number) => void = () => {},
  ) {
    this.onStateChange = onStateChange;
    this.onLevel = onLevel;
  }

  async start(wordIds: string[]): Promise<void> {
    if (wordIds.length === 0) return;

    this.wordIds = wordIds;
    this.totalWords = wordIds.length;
    this.currentWordIndex = 0;
    this.results = [];
    this.isPaused = false;
    this.error = null;
    this.stopped = false;
    this.startTime = Date.now();
    this.abortController = new AbortController();

    this.setupMediaSession();
    this.startSilentAudio();
    // Every session says these, and the first play of a line is the only one
    // that costs a round-trip. Fetching them while the first word is still
    // being introduced keeps the gaps quiet.
    prewarm([
      { text: 'Listen, then say it back.', lang: 'en' },
      { text: 'Great pronunciation! Well done!', lang: 'en' },
      { text: 'Almost there! Try listening again and repeating.', lang: 'en' },
      { text: 'Moving on.', lang: 'en' },
    ]);

    await this.run();
  }

  /**
   * Drive the queue, and absorb anything one word throws.
   *
   * This used to be recursion inside `processWord` with no handler anywhere up
   * the chain — `start()` rejected into a caller that didn't catch, the engine
   * stopped emitting state, and the screen froze on whatever chip was last set
   * with the buttons still live and nothing happening. `speakWithPromise`
   * rejecting on a synthesis failure, or a mnemonic's `audio_url` 404ing, was
   * enough to do it. One bad word now costs that word, not the session.
   */
  private async run(): Promise<void> {
    for (let index = 0; index < this.wordIds.length; index++) {
      try {
        await this.processWord(index);
      } catch (err) {
        if (isAbortError(err)) return;
        this.error = 'Some words could not be played — they were skipped.';
        this.emitState();
      }
    }
    this.setState('session_complete');
    this.cleanup();
  }

  /**
   * Say the current word again, on demand.
   *
   * The session is otherwise a fixed timeline: miss the word and the only way
   * to hear it again was to end the run and start over. Deliberately does not
   * touch the state machine — it interrupts what is being said, says the word,
   * and the timeline carries on from wherever it was.
   */
  async replay(): Promise<void> {
    const word = this.currentWordFull;
    if (!word) return;
    try {
      await this.playWordTTS(word);
    } catch {
      // A convenience control must not be able to take the session down.
    }
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
    this.stopped = true;
    const summary = this.buildSummary();
    this.cleanup();
    this.setState('idle');
    return summary;
  }

  private async processWord(index: number): Promise<void> {
    this.currentWordIndex = index;
    const word = await fetchWord(this.wordIds[index]);
    if (!word) return; // Missing word — the loop moves on.

    this.currentWord = { text: word.text, meaning: word.meaning_en };
    this.currentWordFull = word;

    // 1. Hear it. The instruction is said once, on the first word — repeating
    // "Next word. Listen:" eight times is most of what made this drag, and by
    // word two the learner knows the shape of the loop.
    this.setState('playing_word');
    await this.checkAbortAndPause();
    if (index === 0) await this.speakEnglish('Listen, then say it back.');
    await this.checkAbortAndPause();
    await this.playWordTTS(word);
    await pauseMs(BEAT);

    // 2. What it means — the bare gloss. "This means:" on every word is three
    // syllables of scaffolding around one of content.
    this.setState('playing_mnemonic');
    await this.checkAbortAndPause();
    await this.speakEnglish(word.meaning_en);
    await pauseMs(BEAT);

    // 3. Say it back. The word is replayed rather than announced: a second
    // hearing immediately before speaking is what actually helps, where "Now
    // you say it" is a sentence to sit through. The screen says whose turn it
    // is, and the mic panel makes it unmissable.
    this.setState('waiting_for_repeat');
    await this.checkAbortAndPause();
    await this.playWordTTS(word);

    let result: PronunciationResult | null = null;
    if (isScoringAvailable(word.language_code)) {
      result = await this.listen(word);
    }

    // 4. Give feedback
    this.setState('giving_feedback');
    await this.checkAbortAndPause();

    if (result) {
      await this.speakEnglish(result.feedback);

      // Give one retry if they were heard but missed. Deliberately NOT on
      // 'not_scored' — retrying against a mic we can't read just makes the
      // learner repeat themselves into silence.
      if (result.score === 'getting_there' || result.score === 'try_again') {
        await pauseMs(BEAT);
        // The mnemonic lands here rather than before every word. It is a hint,
        // and a hint offered before the attempt is just a longer lesson —
        // narrating a whole scene ahead of all eight words was the single
        // biggest reason the session dragged.
        if (word.mnemonic) {
          this.setState('playing_mnemonic');
          await this.checkAbortAndPause();
          await narrateMnemonic(word.mnemonic);
          this.setState('giving_feedback');
        }
        await this.checkAbortAndPause();
        await this.playWordTTS(word);

        const retry = await this.listen(word);
        this.setState('giving_feedback');
        await this.checkAbortAndPause();
        // A silent retry is not a downgrade. Keep the verdict they actually
        // earned rather than replacing it with "we heard nothing".
        if (retry.score !== 'not_scored') {
          result = retry;
          await this.speakEnglish(retry.feedback);
        }
      }

      this.results.push(result);
    } else {
      await this.speakEnglish('Moving on.');
      this.results.push({
        score: 'not_scored',
        reason: 'unsupported_browser',
        transcription: '',
        feedback: 'Scoring unavailable',
        targetWord: word.text,
      });
    }

    // 5. Next word
    this.setState('next_word');
    await pauseMs(BEAT);
    await this.checkAbortAndPause();
  }

  /**
   * The one place the microphone is open.
   *
   * Two things used to be wrong here. The state was set to `scoring` *before*
   * a helper that replayed the word first, so the screen read "listening to
   * you" while the app was still talking — and the word was spoken twice
   * running, because step 3 had just played it. And the retry listen ran with
   * the state left on `giving_feedback`, so the mic was live while the screen
   * said "Feedback". `listening` is now set immediately before `start()` and
   * cleared the moment there is a verdict, with a deadline and a live level so
   * the UI can show the window rather than describe it.
   */
  private async listen(word: WordWithMnemonic): Promise<PronunciationResult> {
    const attempt = startSpeechAttempt(word.text, word.language_code, {
      romanization: word.romanization,
      onLevel: this.onLevel,
    });
    this.stopListening = attempt.stop;
    this.listenDeadline = Date.now() + LISTEN_TIMEOUT_MS;
    this.setState('listening');
    try {
      return await attempt.promise;
    } finally {
      this.stopListening = null;
      this.listenDeadline = null;
      this.onLevel(0);
      // Ending mid-listen settles this promise a microtask after stop() has
      // already set 'idle'; emitting here would flash a stage that is no
      // longer running over the top of it.
      if (!this.stopped) this.setState('scoring');
    }
  }

  /**
   * Say the target word.
   *
   * This used to build a `SpeechSynthesisUtterance` and hand it to the browser
   * — while a Google Neural clip sat in Blob storage for every single word in
   * the database. That was one of the two robotic voices: the app owned good
   * audio and never played it.
   */
  private async playWordTTS(word: WordWithMnemonic): Promise<void> {
    stopPlayback();
    await speak(word.text, word.language_code, {
      audioUrl: word.pronunciation_audio_url,
      kind: 'word',
    });
  }

  /** The other robotic voice: narration had no path to a real one at all. */
  private async speakEnglish(text: string): Promise<void> {
    stopPlayback();
    await speak(text, 'en');
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
      listenDeadline: this.listenDeadline,
      error: this.error,
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
    // Ending mid-listen has to close the mic, not just stop caring about it —
    // otherwise the recording light stays on for the rest of the timeout.
    this.stopListening?.();
    this.stopListening = null;
    this.listenDeadline = null;
    this.onLevel(0);
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
      not_scored: 0,
    };
    for (const r of this.results) {
      scores[r.score]++;
    }
    return {
      wordsAttempted: this.results.length,
      pronunciationScores: scores,
      duration: Date.now() - this.startTime,
      error: this.error,
    };
  }
}
