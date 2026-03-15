'use client';

import { useCallback } from 'react';
import type { SessionSummary, HandsFreeState } from '@/types/audio';
import { useHandsFreeSession } from '@/lib/audio';

interface HandsFreeControlsProps {
  wordIds: string[];
  onSessionComplete?: (summary: SessionSummary) => void;
  className?: string;
}

const STATE_LABELS: Record<HandsFreeState, string> = {
  idle: 'Ready to start',
  playing_word: 'Listen carefully...',
  playing_mnemonic: 'Here\'s the meaning...',
  waiting_for_repeat: 'Your turn!',
  scoring: 'Checking...',
  giving_feedback: 'Feedback',
  next_word: 'Moving on...',
  session_complete: 'Session complete!',
};

export function HandsFreeControls({ wordIds, onSessionComplete, className = '' }: HandsFreeControlsProps) {
  const { session, start, pause, resume, stop } = useHandsFreeSession();

  const isActive = session.state !== 'idle' && session.state !== 'session_complete';
  const progress = session.totalWords > 0
    ? ((session.currentWordIndex + 1) / session.totalWords) * 100
    : 0;

  const handlePlayPause = useCallback(() => {
    if (session.state === 'idle' || session.state === 'session_complete') {
      start(wordIds);
    } else if (session.isPaused) {
      resume();
    } else {
      pause();
    }
  }, [session.state, session.isPaused, start, pause, resume, wordIds]);

  const handleStop = useCallback(() => {
    const summary = stop();
    if (summary) onSessionComplete?.(summary);
  }, [stop, onSessionComplete]);

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-6 ${className}`}>
      {/* Current word display */}
      {isActive && session.currentWord && (
        <div className="mb-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{session.currentWord.text}</p>
          <p className="text-sm text-gray-500 mt-1">{session.currentWord.meaning}</p>
        </div>
      )}

      {/* State indicator */}
      <p className={`text-center text-sm font-medium mb-4 ${
        session.state === 'waiting_for_repeat' ? 'text-blue-600' : 'text-gray-600'
      }`}>
        {STATE_LABELS[session.state]}
      </p>

      {/* Progress bar */}
      {isActive && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Word {session.currentWordIndex + 1} of {session.totalWords}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex gap-1 mt-2 justify-center">
            {Array.from({ length: session.totalWords }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < session.currentWordIndex
                    ? 'bg-green-400'
                    : i === session.currentWordIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePlayPause}
          className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
          aria-label={
            !isActive ? 'Start session' : session.isPaused ? 'Resume' : 'Pause'
          }
        >
          {!isActive || session.isPaused ? (
            <PlayIcon />
          ) : (
            <PauseIcon />
          )}
        </button>

        {isActive && (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 transition-colors"
            aria-label="Stop session"
          >
            <StopIcon />
          </button>
        )}
      </div>

      {/* Session complete summary */}
      {session.state === 'session_complete' && session.results.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-1">Session Summary</p>
          <p>
            {session.results.filter((r) => r.score === 'close_enough').length} / {session.results.length} words nailed
          </p>
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="3" width="5" height="18" rx="1" />
      <rect x="14" y="3" width="5" height="18" rx="1" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
