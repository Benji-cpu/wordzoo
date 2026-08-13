'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { PronunciationResult } from '@/types/audio';

/**
 * Shared mic chrome for every speaking surface.
 *
 * Lifted out of RepeatAfterMe so the drill's SpeakChallenge and the tutor-side
 * widget draw the same icon and, more importantly, the same score treatment.
 * The `not_scored` tone in particular must have exactly one definition — it is
 * deliberately colourless because we never heard the learner, so it is not a
 * verdict, and a second copy would eventually drift into looking like failure.
 */

export function MicIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="1" width="6" height="11" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

const BARS = 32;

/**
 * Live mic level, drawn as a scrolling bar meter.
 *
 * The point is answering "is it hearing me?" — a question the Web Speech API
 * never answers on its own, and which a "Listening…" label only asserts. Bars
 * that move when you speak are the difference between trusting the mic and
 * assuming the feature is broken.
 *
 * Reads the level from a ref inside its own rAF loop, so a 60 Hz signal never
 * re-renders React. Drawing stops entirely when the mic is shut, leaving the
 * resting row on screen — a canvas that goes blank reads as broken, which is
 * the exact impression this component exists to prevent.
 */
export function Waveform({
  levelRef,
  active,
  className = '',
}: {
  levelRef: RefObject<number>;
  active: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>(new Array(BARS).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const history = historyRef.current;
    let raf = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // Inherit whatever colour the parent set, so the meter matches the state
      // it is drawn inside without the caller passing hex around.
      ctx.fillStyle = getComputedStyle(canvas).color;

      const gap = 3;
      const barW = Math.max(2, (w - gap * (BARS - 1)) / BARS);
      const mid = h / 2;
      for (let i = 0; i < BARS; i++) {
        // A floor keeps a resting dot visible: a flat row still says "open and
        // hearing silence", where nothing at all says "dead".
        const barH = Math.max(barW, Math.min(h, history[i] * h));
        const x = i * (barW + gap);
        const y = mid - barH / 2;
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, Math.min(barW, barH) / 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barW, barH);
        }
      }
    };

    if (!active) {
      history.fill(0);
      draw();
      return;
    }

    const tick = () => {
      history.push(levelRef.current);
      history.shift();
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, levelRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

export function ScoreDisplay({ result }: { result: PronunciationResult }) {
  const config: Record<PronunciationResult['score'], { icon: string; color: string; bg: string }> = {
    close_enough: { icon: '✓', color: 'text-green-400', bg: 'bg-green-500/20' },
    getting_there: { icon: '◐', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    try_again: { icon: '↻', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    // Neutral on purpose — we never heard them, so this is not a verdict.
    not_scored: { icon: '–', color: 'text-text-secondary', bg: 'bg-surface-inset' },
  };
  const tone = config[result.score];

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${tone.bg}`}>
      <span className={`text-lg font-bold ${tone.color}`}>{tone.icon}</span>
      <span className={`text-sm ${tone.color}`}>{result.feedback}</span>
    </div>
  );
}
