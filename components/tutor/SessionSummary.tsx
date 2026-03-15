'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SessionSummaryProps {
  summary: {
    messageCount: number;
    userMessageCount: number;
    wordCount: number;
    wordsUsed: string[];
    durationMinutes: number;
    mode: string;
  };
  onNewSession: () => void;
}

const MODE_LABELS: Record<string, string> = {
  free_chat: 'Free Chat',
  role_play: 'Role Play',
  word_review: 'Word Review',
  grammar_glimpse: 'Grammar',
  pronunciation_coach: 'Pronunciation',
};

export function SessionSummary({ summary, onNewSession }: SessionSummaryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground text-center">Session Complete</h2>

      <div className="grid grid-cols-2 gap-3">
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
        <Card>
          <div className="text-base font-bold text-accent-default text-center truncate">
            {MODE_LABELS[summary.mode] ?? summary.mode}
          </div>
          <div className="text-xs text-text-secondary text-center">mode</div>
        </Card>
      </div>

      {summary.wordsUsed.length > 0 && (
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
      )}

      <Button onClick={onNewSession} className="w-full">
        New Session
      </Button>
    </div>
  );
}
