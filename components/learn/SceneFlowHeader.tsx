'use client';

import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/IconButton';

const PHASE_LABELS = ['Dialogue', 'Phrases', 'Vocab', 'Patterns', 'Chat', 'Summary'] as const;
const PHASE_KEYS = ['dialogue', 'phrases', 'vocabulary', 'patterns', 'conversation', 'summary'] as const;

interface SceneFlowHeaderProps {
  title: string;
  currentPhase: string;
}

export function SceneFlowHeader({ title, currentPhase }: SceneFlowHeaderProps) {
  const router = useRouter();
  const currentIdx = PHASE_KEYS.indexOf(currentPhase as typeof PHASE_KEYS[number]);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <IconButton label="Go back" onClick={() => router.push('/dashboard')} size="sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <p className="text-xs text-text-secondary">{PHASE_LABELS[currentIdx >= 0 ? currentIdx : 0]}</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {PHASE_KEYS.map((key, i) => (
          <div
            key={key}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < currentIdx
                ? 'bg-accent-id'
                : i === currentIdx
                ? 'bg-accent-id/70'
                : 'bg-white/15'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
