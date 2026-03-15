'use client';

import { usePackDownload } from '@/lib/hooks/usePackDownload';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

const phaseLabels = {
  mnemonics: 'Downloading words & mnemonics...',
  images: 'Downloading images...',
  audio: 'Downloading audio...',
  complete: 'Download complete!',
} as const;

interface DownloadProgressProps {
  pathId: string;
  onComplete?: () => void;
}

export function DownloadProgress({ pathId, onComplete }: DownloadProgressProps) {
  const { status, progress, error, startDownload, pause, resume } =
    usePackDownload();

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  if (status === 'complete') {
    onComplete?.();
  }

  return (
    <div className="glass-card p-4 space-y-3">
      {status === 'idle' && (
        <Button
          onClick={() => startDownload(pathId)}
          variant="primary"
          size="sm"
        >
          Download for offline
        </Button>
      )}

      {status === 'downloading' && progress && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              {phaseLabels[progress.phase]}
            </span>
            <span className="text-foreground font-medium">{percent}%</span>
          </div>
          <ProgressBar value={percent} height="md" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {formatBytes(progress.sizeBytes)}
            </span>
            <Button onClick={pause} variant="ghost" size="sm">
              Pause
            </Button>
          </div>
        </>
      )}

      {status === 'paused' && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            Download paused ({percent}%)
          </span>
          <div className="flex gap-2">
            <Button onClick={() => resume(pathId)} variant="secondary" size="sm">
              Resume
            </Button>
          </div>
        </div>
      )}

      {status === 'complete' && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Available offline
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <p className="text-sm text-red-400">{error}</p>
          <Button
            onClick={() => startDownload(pathId)}
            variant="secondary"
            size="sm"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
