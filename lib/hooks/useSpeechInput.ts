'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  isSpeechServiceBlocked,
  markSpeechServiceBlocked,
  recordSpeechFailure,
  recordSpeechSuccess,
  speechRetryMessage,
  speechUnavailableMessage,
} from '@/lib/audio/speech-support';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEvent {
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    SpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

/** Android Chrome ends a continuous session on silence; we restart it, within reason. */
const MAX_RESTARTS = 20;
const RESTART_DELAY_MS = 250;
/** Safari sometimes never fires onend after stop(); don't hold a caller forever. */
const STOP_FLUSH_TIMEOUT_MS = 1500;

function isTouchDevice(): boolean {
  return navigator.maxTouchPoints > 0 || /Android|iPhone|iPad/.test(navigator.userAgent);
}

function joinParts(parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).join(' ');
}

/**
 * Split one recognition event into the finalised text and the still-changing
 * tail. Always read from index 0: `event.resultIndex` only marks what changed,
 * so building from it drops every segment that finalised earlier.
 */
function readResults(event: SpeechRecognitionEvent): { finals: string; interim: string } {
  const finals: string[] = [];
  const interims: string[] = [];
  for (let i = 0; i < event.results.length; i++) {
    const r = event.results[i];
    (r.isFinal ? finals : interims).push(r[0].transcript);
  }
  // Some Android builds emit each interim as its own cumulative result. Keep
  // only the last of a run where every one extends the one before it.
  const tail = interims.filter((t, i) => !(i + 1 < interims.length && interims[i + 1].trim().startsWith(t.trim())));
  return { finals: joinParts(finals), interim: joinParts(tail) };
}

export function useSpeechInput(langCode: string) {
  const [isListening, setIsListening] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // The live instance. Every handler checks it still is the live one, so a
  // superseded or already-ended instance cannot touch newer state.
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const userStoppedRef = useRef(false);
  const restartsRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Finals from instances that already ended, plus the newest instance's tail.
  const committedRef = useRef('');
  const instanceFinalsRef = useRef('');
  const instanceInterimRef = useRef('');
  const stopWaitersRef = useRef<Array<(text: string) => void>>([]);
  const langRef = useRef(langCode);
  langRef.current = langCode;

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  function stopAudio() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  }

  function startAudioLoop(analyser: AnalyserNode) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    function tick() {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setAudioLevel(Math.min(1, rms * 4)); // scale up for visibility
      animFrameRef.current = requestAnimationFrame(tick);
    }
    animFrameRef.current = requestAnimationFrame(tick);
  }

  /** Level meter, desktop only and only once audio is flowing: a second capture
   *  stream on a phone competes with the system recogniser for the mic. */
  function openLevelMeter() {
    if (streamRef.current || isTouchDevice()) return;
    navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
      if (!recognitionRef.current || streamRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      startAudioLoop(analyser);
    }).catch(() => {
      // Visualization unavailable — recognition keeps running
    });
  }

  /** Session over for good: free the mic and hand the frozen text to anyone waiting. */
  function finish() {
    recognitionRef.current = null;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    setIsListening(false);
    setInterimText('');
    stopAudio();
    const text = committedRef.current;
    const waiters = stopWaitersRef.current;
    stopWaitersRef.current = [];
    waiters.forEach((w) => w(text));
  }

  /** Move an ending instance's text (interim tail included) into the committed text. */
  function commitInstance() {
    committedRef.current = joinParts([
      committedRef.current,
      instanceFinalsRef.current,
      instanceInterimRef.current,
    ]);
    instanceFinalsRef.current = '';
    instanceInterimRef.current = '';
    setFinalText(committedRef.current);
    setInterimText('');
  }

  function launch(): boolean {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Ctor();
    recognition.continuous = true;   // Stay active until user stops
    recognition.interimResults = true;
    recognition.lang = langRef.current;

    const startedAt = Date.now();
    let audioStarted = false;
    let fatal = false;
    const live = () => recognitionRef.current === recognition;

    recognition.onaudiostart = () => {
      if (!live()) return;
      audioStarted = true;
      recordSpeechSuccess();
      openLevelMeter();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!live()) return;
      const { finals, interim } = readResults(event);
      instanceFinalsRef.current = finals;
      instanceInterimRef.current = interim;
      setFinalText(joinParts([committedRef.current, finals]));
      setInterimText(interim);
    };

    recognition.onerror = (event: { error: string }) => {
      if (!live()) return;
      // 'no-speech' is non-fatal when continuous — onend restarts us.
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      fatal = true;
      if (event.error === 'not-allowed') {
        setError('Microphone access is blocked. Allow it in your browser settings to dictate, or just type below.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Check your device and try again, or just type below.');
      } else if (event.error === 'service-not-allowed') {
        // Not the user's connection: the browser has no speech service to reach.
        markSpeechServiceBlocked();
        setError(speechUnavailableMessage());
      } else if (event.error === 'network') {
        const latched = recordSpeechFailure({ msSinceStart: Date.now() - startedAt, audioStarted });
        setError(latched ? speechUnavailableMessage() : speechRetryMessage());
      } else {
        setError('Voice input stopped unexpectedly. Tap the mic to try again.');
      }
      // onend follows and finishes the session (fatal blocks the restart).
      try { recognition.stop(); } catch { /* already stopped */ }
    };

    recognition.onend = () => {
      if (!live()) return;
      commitInstance();
      // Android ends a continuous session after a stretch of silence. If the
      // user has not pressed stop, quietly pick it back up.
      if (!userStoppedRef.current && !fatal && restartsRef.current < MAX_RESTARTS) {
        restartsRef.current += 1;
        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null;
          if (!live() || userStoppedRef.current) return;
          try {
            if (!launch()) finish();
          } catch {
            finish();
          }
        }, RESTART_DELAY_MS);
        return;
      }
      finish();
    };

    // Detach from the previous instance before the new one becomes live.
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      return false;
    }
    return true;
  }

  const startListening = useCallback(async () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    // A missing constructor is only one of the ways this can be unavailable.
    // Brave ships `webkitSpeechRecognition` and has nothing behind it, so also
    // honour a service failure we've already watched happen recently.
    if (!Ctor || isSpeechServiceBlocked()) {
      setError(speechUnavailableMessage());
      return;
    }
    setError(null);

    // A previous instance still flushing is superseded, not waited for.
    const previous = recognitionRef.current;
    if (previous) {
      recognitionRef.current = null;
      try { previous.abort(); } catch { /* already stopped */ }
    }
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    stopWaitersRef.current.splice(0).forEach((w) => w(committedRef.current));

    userStoppedRef.current = false;
    restartsRef.current = 0;
    committedRef.current = '';
    instanceFinalsRef.current = '';
    instanceInterimRef.current = '';
    setFinalText('');
    setInterimText('');

    // Start recognition synchronously within the user gesture — awaiting
    // anything first breaks the gesture chain on iOS Safari.
    try {
      if (!launch()) throw new Error('start failed');
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setError('Voice input could not start. Tap the mic to try again.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Stop listening and resolve with the frozen text once the recogniser has
   * delivered its last result (onend). Stopping is when the words you just said
   * arrive, so anything that reads the text right after a stop must await this.
   */
  const stopListening = useCallback((): Promise<string> => {
    const rec = recognitionRef.current;
    userStoppedRef.current = true;
    setIsListening(false);
    if (!rec) {
      stopAudio();
      return Promise.resolve(committedRef.current);
    }
    if (restartTimerRef.current) {
      // Between restarts there is no live recogniser to flush.
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
      finish();
      return Promise.resolve(committedRef.current);
    }
    return new Promise<string>((resolve) => {
      const timeout = setTimeout(() => {
        if (recognitionRef.current === rec) {
          commitInstance();
          finish();
        }
      }, STOP_FLUSH_TIMEOUT_MS);
      stopWaitersRef.current.push((text) => {
        clearTimeout(timeout);
        resolve(text);
      });
      try { rec.stop(); } catch { commitInstance(); finish(); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      void stopListening();
    };
  }, [stopListening]);

  const transcript = joinParts([finalText, interimText]);
  const status: 'unsupported' | 'listening' | 'error' | 'idle' =
    !supported ? 'unsupported' : isListening ? 'listening' : error ? 'error' : 'idle';

  return {
    isListening,
    /** Everything heard this session: finalised segments plus the current interim. */
    transcript,
    /** Finalised segments only. Append-only within a session. */
    finalText,
    /** The still-changing tail, not yet final. */
    interimText,
    audioLevel,
    startListening,
    stopListening,
    supported,
    error,
    status,
  };
}
