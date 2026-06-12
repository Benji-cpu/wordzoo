'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface InviteSectionProps {
  inviteUrl: string;
  signups: number;
  rewardedDays: number;
  bonusUntil: string | null;
  rewardDays: number;
}

export function InviteSection({
  inviteUrl,
  signups,
  rewardedDays,
  bonusUntil,
  rewardDays,
}: InviteSectionProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Learn a language with me on WordZoo',
          text: 'Words that stick, not slip — try WordZoo free:',
          url: inviteUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard unavailable — no-op.
    }
  }

  const bonusActive = bonusUntil && new Date(bonusUntil) > new Date();

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Invite Friends
      </h2>
      <Card>
        <p className="text-sm text-foreground mb-1 font-semibold">
          Give a friend a head start, get {rewardDays} days of Premium
        </p>
        <p className="text-xs text-text-secondary mb-3">
          Every friend who joins from your link earns you {rewardDays} days of
          unlimited words, tutor chat, and regenerations.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 truncate text-xs px-3 py-2.5 rounded-xl bg-surface-inset text-text-secondary">
            {inviteUrl}
          </code>
          <Button size="sm" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span>
            <span className="font-bold text-foreground">{signups}</span>{' '}
            {signups === 1 ? 'friend' : 'friends'} joined
          </span>
          <span>
            <span className="font-bold text-foreground">{rewardedDays}</span>{' '}
            days earned
          </span>
          {bonusActive && (
            <span className="text-green-400 font-semibold">
              Premium until {new Date(bonusUntil).toLocaleDateString()}
            </span>
          )}
        </div>
      </Card>
    </section>
  );
}
