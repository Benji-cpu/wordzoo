'use client';

import { useState } from 'react';

interface ShareButtonProps {
  mnemonicId: string;
  wordId: string;
  wordText: string;
  meaningEn: string;
  languageName: string;
  compact?: boolean;
}

export function ShareButton({ mnemonicId, wordId, wordText, meaningEn, languageName, compact = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = `${window.location.origin}/word/${wordId}`;
    const shareText = `I learned "${wordText}" in ${languageName} — it means "${meaningEn}"! Try this memory trick on WordZoo.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wordText} — WordZoo`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard failed
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/5 text-text-secondary hover:bg-white/10 transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      <span className={compact ? 'hidden sm:inline' : ''}>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}
