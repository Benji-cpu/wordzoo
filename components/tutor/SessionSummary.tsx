'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { parseMessageContent } from '@/lib/tutor/message-parser';
import type { ChatMessage } from '@/components/tutor/TutorChat';

interface SessionSummaryProps {
  summary: {
    messageCount: number;
    userMessageCount: number;
    wordCount: number;
    wordsUsed: string[];
    durationMinutes: number;
    mode: string;
    srsReviewsRecorded?: number;
    wordsIntroduced?: number;
    accuracyRate?: number;
  };
  onNewSession: () => void;
  onStartSession?: (mode: string) => void;
  mode?: string;
  messages?: ChatMessage[];
}

const MODE_LABELS: Record<string, string> = {
  free_chat: 'Free Chat',
  role_play: 'Role Play',
  word_review: 'Word Review',
  grammar_glimpse: 'Grammar',
  pronunciation_coach: 'Pronunciation',
  guided_conversation: 'Guided',
};

export function SessionSummary({ summary, onNewSession, onStartSession, mode, messages }: SessionSummaryProps) {
  // Count corrections from model messages
  const correctionCount = useMemo(() => {
    if (!messages) return 0;
    let count = 0;
    for (const msg of messages) {
      if (msg.role !== 'model') continue;
      const segments = parseMessageContent(msg.content);
      for (const seg of segments) {
        if (seg.type === 'correction') count++;
      }
    }
    return count;
  }, [messages]);

  let sectionIndex = 0;

  return (
    <div className="space-y-4">
      <h2
        className="text-lg font-semibold text-foreground text-center animate-slide-up"
        style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
      >
        Session Complete
      </h2>

      <div
        className="grid grid-cols-2 gap-3 animate-slide-up"
        style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
      >
        <Card>
          <div className="text-2xl font-bold text-accent-default text-center">
            {summary.durationMinutes}
          </div>
          <div className="text-xs text-text-secondary text-center">minutes</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-accent-default text-center">
            {summary.userMessageCount}
          </div>
          <div className="text-xs text-text-secondary text-center">messages sent</div>
        </Card>
        <Card>
          <div className="text-2xl font-bold text-accent-default text-center">
            {summary.wordCount}
          </div>
          <div className="text-xs text-text-secondary text-center">words practiced</div>
        </Card>
        {correctionCount > 0 ? (
          <Card>
            <div className="text-2xl font-bold text-orange-400 text-center">
              {correctionCount}
            </div>
            <div className="text-xs text-text-secondary text-center">corrections</div>
          </Card>
        ) : (
          <Card>
            <div className="text-base font-bold text-accent-default text-center truncate">
              {MODE_LABELS[summary.mode] ?? summary.mode}
            </div>
            <div className="text-xs text-text-secondary text-center">mode</div>
          </Card>
        )}
      </div>

      {/* SRS Integration Stats */}
      {(summary.srsReviewsRecorded != null && summary.srsReviewsRecorded > 0) && (
        <div
          className="grid grid-cols-3 gap-3 animate-slide-up"
          style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
        >
          <Card>
            <div className="text-2xl font-bold text-green-400 text-center">
              {summary.srsReviewsRecorded}
            </div>
            <div className="text-xs text-text-secondary text-center">SRS reviews</div>
          </Card>
          {summary.accuracyRate != null && (
            <Card>
              <div className="text-2xl font-bold text-accent-default text-center">
                {summary.accuracyRate}%
              </div>
              <div className="text-xs text-text-secondary text-center">accuracy</div>
            </Card>
          )}
          {summary.wordsIntroduced != null && summary.wordsIntroduced > 0 && (
            <Card>
              <div className="text-2xl font-bold text-blue-400 text-center">
                {summary.wordsIntroduced}
              </div>
              <div className="text-xs text-text-secondary text-center">new words</div>
            </Card>
          )}
        </div>
      )}

      {summary.wordsUsed.length > 0 && (
        <div
          className="animate-slide-up"
          style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
        >
          <Card>
            <div className="text-sm font-medium text-foreground mb-2">Words practiced</div>
            <div className="flex flex-wrap gap-1.5">
              {summary.wordsUsed.map((word) => (
                <span
                  key={word}
                  className="px-2 py-0.5 rounded-full bg-accent-default/10 text-accent-default text-xs font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div
        className="space-y-2 animate-slide-up"
        style={{ animationDelay: `${sectionIndex++ * 100}ms`, animationFillMode: 'backwards' }}
      >
        {mode && onStartSession && (
          <Button
            onClick={() => onStartSession(mode)}
            variant="secondary"
            className="w-full"
          >
            Practice Again ({MODE_LABELS[mode] ?? mode})
          </Button>
        )}
        <Button onClick={onNewSession} className="w-full">
          New Session
        </Button>
      </div>
    </div>
  );
}
