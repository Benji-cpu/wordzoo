'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    SpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechInput(langCode: string) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopListening();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAudio() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
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

  const startListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Brave disables Web Speech API by default. Surface a clear hint instead of
      // failing silently — most users won't know to flip the brave://settings flag.
      const ua = navigator.userAgent;
      const isBrave = !!(navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } }).brave;
      setError(
        isBrave
          ? 'Brave blocks speech recognition by default. Enable it at brave://settings/privacy → "Use Google services for push messaging" or use Chrome.'
          : ua.includes('Firefox')
            ? 'Firefox does not support speech recognition. Please use Chrome, Edge, or Safari.'
            : 'Speech recognition is not available in this browser.'
      );
      return;
    }
    setError(null);

    // Request mic access for audio visualization
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      startAudioLoop(analyser);
    } catch {
      // Visualization unavailable — still proceed with speech recognition
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;   // Stay active until user stops
    recognition.interimResults = true;
    recognition.lang = langCode;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event: { error: string }) => {
      // 'no-speech' is non-fatal when continuous — ignore it
      if (event.error !== 'no-speech') {
        stopListening();
      }
    };

    recognition.onend = () => {
      // With continuous=true, onend only fires if recognition was manually stopped
      // or on a fatal error — always clean up
      setIsListening(false);
      stopAudio();
    };

    recognitionRef.current = recognition;
    setTranscript('');
    setIsListening(true);
    recognition.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langCode]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    stopAudio();
  }, []);

  return { isListening, transcript, audioLevel, startListening, stopListening, supported, error };
}
