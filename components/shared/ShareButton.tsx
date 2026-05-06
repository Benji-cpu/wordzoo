'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy-load the sheet so the button stays cheap on cards.
const ShareSheet = dynamic(() => import('./ShareSheet').then((m) => m.ShareSheet), {
  ssr: false,
});

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  /** Visual style — overlay sits on a dark image; surface sits on light card. */
  surface?: 'overlay' | 'surface';
  className?: string;
  ariaLabel?: string;
  /** When provided, opens a richer share sheet with image + format options. */
  mnemonicId?: string;
  wordId?: string;
  wordText?: string;
  meaningEn?: string;
  languageName?: string;
}

/**
 * Share button used across learn / review / gallery / public-word surfaces.
 * - With `mnemonicId`: opens a sheet with image preview, square/story toggle, copy link.
 * - Without: falls back to native navigator.share or clipboard, immediate.
 * Stops click propagation so it never bubbles to a parent "tap to reveal" affordance.
 */
export function ShareButton({
  title,
  text,
  url,
  surface = 'overlay',
  className,
  ariaLabel = 'Share',
  mnemonicId,
  wordId,
  wordText,
  meaningEn,
  languageName,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const richMode = !!(mnemonicId && wordId && wordText && meaningEn && languageName);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (richMode) {
      setOpen(true);
      return;
    }
    if (typeof navigator === 'undefined') return;
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
    }
  }

  const base = 'w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform';
  const tone = surface === 'overlay'
    ? 'text-white/85 hover:text-white'
    : 'text-text-secondary hover:text-foreground';

  return (
    <>
      <button onClick={handleClick} aria-label={ariaLabel} className={`${base} ${tone} ${className ?? ''}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
      {richMode && (
        <ShareSheet
          open={open}
          onClose={() => setOpen(false)}
          mnemonicId={mnemonicId!}
          wordId={wordId!}
          wordText={wordText!}
          meaningEn={meaningEn!}
          languageName={languageName!}
          shareUrl={url}
        />
      )}
    </>
  );
}
