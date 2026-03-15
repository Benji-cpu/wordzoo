'use client';

import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface SceneHeaderProps {
  title: string;
  current: number;
  total: number;
}

export function SceneHeader({ title, current, total }: SceneHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 mb-6">
      <IconButton label="Go back" onClick={() => router.push('/dashboard')} size="sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </IconButton>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <ProgressBar value={(current / total) * 100} accentColor="bg-accent-id" />
          <span className="text-xs text-text-secondary whitespace-nowrap">
            {current}/{total}
          </span>
        </div>
      </div>
    </div>
  );
}
