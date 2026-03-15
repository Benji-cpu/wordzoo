'use client';

import { useEffect, useRef } from 'react';

export interface PopoverData {
  text: string;
  romanization: string | null;
  meaning_en: string;
  pronunciation_audio_url?: string | null;
  keyword_text?: string | null;
  scene_description?: string | null;
}

interface WordPopoverProps {
  data: PopoverData;
  anchorRect: DOMRect | null;
  onClose: () => void;
}

export function WordPopover({ data, anchorRect, onClose }: WordPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (!anchorRect) return null;

  const top = anchorRect.bottom + 8;
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 280));

  return (
    <div
      ref={ref}
      className="fixed z-50 w-64 rounded-xl bg-card-surface border border-card-border p-4 shadow-xl"
      style={{ top, left }}
    >
      <div className="text-lg font-bold text-foreground">{data.text}</div>
      {data.romanization && (
        <div className="text-sm text-text-secondary">{data.romanization}</div>
      )}
      <div className="text-sm text-accent-default mt-1">{data.meaning_en}</div>
      {data.keyword_text && (
        <div className="mt-2 pt-2 border-t border-card-border">
          <div className="text-xs text-text-secondary">Mnemonic</div>
          <div className="text-sm text-foreground">{data.keyword_text}</div>
          {data.scene_description && (
            <div className="text-xs text-text-secondary mt-1">{data.scene_description}</div>
          )}
        </div>
      )}
    </div>
  );
}
