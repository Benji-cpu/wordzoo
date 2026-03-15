'use client';

import { Card } from '@/components/ui/Card';

interface OfflineMessageProps {
  feature?: string;
}

export function OfflineMessage({ feature = 'This feature' }: OfflineMessageProps) {
  return (
    <Card className="text-center py-8">
      <div className="flex flex-col items-center gap-3">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-secondary"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        <div>
          <p className="text-foreground font-medium">You&apos;re offline</p>
          <p className="text-sm text-text-secondary mt-1">
            {feature} requires an internet connection. Your progress will sync
            when you&apos;re back online.
          </p>
        </div>
      </div>
    </Card>
  );
}
