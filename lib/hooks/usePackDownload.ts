'use client';

import { useState, useRef, useCallback } from 'react';
import type { PackDownloadStatus, DownloadProgress } from '@/types/offline';

export function usePackDownload() {
  const [status, setStatus] = useState<PackDownloadStatus>('idle');
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startDownload = useCallback(async (pathId: string) => {
    setStatus('downloading');
    setError(null);

    abortRef.current = new AbortController();

    try {
      const { downloadPack } = await import('@/lib/offline/download');
      const generator = downloadPack(pathId, abortRef.current.signal);

      for await (const prog of generator) {
        if (abortRef.current?.signal.aborted) {
          setStatus('paused');
          return;
        }

        setProgress(prog);

        if (prog.error) {
          setError(prog.error);
          setStatus('error');
          return;
        }

        if (prog.phase === 'complete') {
          setStatus('complete');
          return;
        }
      }
    } catch (err) {
      if (abortRef.current?.signal.aborted) {
        setStatus('paused');
      } else {
        setError(err instanceof Error ? err.message : 'Download failed');
        setStatus('error');
      }
    }
  }, []);

  const pause = useCallback(() => {
    abortRef.current?.abort();
    setStatus('paused');
  }, []);

  const resume = useCallback(
    (pathId: string) => {
      // Re-calling startDownload skips already-cached words
      startDownload(pathId);
    },
    [startDownload]
  );

  return { status, progress, error, startDownload, pause, resume };
}
