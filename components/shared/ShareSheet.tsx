'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  mnemonicId: string;
  wordId: string;
  wordText: string;
  meaningEn: string;
  languageName: string;
  shareUrl: string;
  onShared?: (format: 'square' | 'story' | 'link', channel: string) => void;
}

type Format = 'square' | 'story';

async function blobFromUrl(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('image fetch failed');
  return res.blob();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ShareSheet({
  open,
  onClose,
  mnemonicId,
  wordId,
  wordText,
  meaningEn,
  languageName,
  shareUrl,
  onShared,
}: ShareSheetProps) {
  const [format, setFormat] = useState<Format>('square');
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Lock scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const imageUrl = `/api/share/${mnemonicId}/image?format=${format}`;
  const shareText = `I learned "${wordText}" in ${languageName} — it means "${meaningEn}". Try this memory trick on WordZoo.`;

  async function recordShare(fmt: 'square' | 'story' | 'link', channel: string) {
    try {
      await fetch('/api/share/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonicId, format: fmt, channel }),
      });
    } catch {
      // Telemetry failure must not block sharing.
    }
    onShared?.(fmt, channel);
  }

  async function handleShareImage() {
    if (busy) return;
    setBusy('image');
    try {
      const blob = await blobFromUrl(imageUrl);
      const file = new File([blob], `${wordText}-wordzoo.png`, { type: 'image/png' });

      // Web Share API with files (mobile)
      if (
        typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `${wordText} — WordZoo`,
          text: shareText,
        });
        await recordShare(format, 'native');
      } else {
        downloadBlob(blob, `${wordText}-wordzoo.png`);
        await recordShare(format, 'download');
      }
    } catch {
      // User cancelled or share failed — silent.
    } finally {
      setBusy(null);
    }
  }

  async function handleCopyLink() {
    if (busy) return;
    setBusy('link');
    try {
      const payload = `${shareText}\n${shareUrl}`;
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      await recordShare('link', 'clipboard');
    } catch {
      // Clipboard denied
    } finally {
      setBusy(null);
    }
  }

  // Cache-busting key — re-fetch when format toggles
  const previewKey = `${mnemonicId}-${format}`;

  const sheet = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share mnemonic"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <button
        type="button"
        aria-label="Close share sheet"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
      />
      <div
        className="relative w-full sm:max-w-md bg-[var(--background)] rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 shadow-[0_-8px_30px_rgba(0,0,0,0.25)] animate-slide-up"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[color:var(--foreground)]">Share this mnemonic</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[color:var(--text-secondary)] hover:bg-[var(--surface-inset)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        {/* Format toggle */}
        <div className="inline-flex rounded-full bg-[var(--surface-inset)] p-1 mb-3 text-xs font-bold">
          {(['square', 'story'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`px-3.5 py-1.5 rounded-full transition-colors ${
                format === f
                  ? 'bg-[var(--background)] text-[color:var(--foreground)] shadow-sm'
                  : 'text-[color:var(--text-secondary)]'
              }`}
            >
              {f === 'square' ? 'Square (post)' : 'Tall (story)'}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="rounded-2xl overflow-hidden bg-[var(--surface-inset)] mb-4 max-h-[42vh] flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewKey}
            src={imageUrl}
            alt="Share preview"
            className={format === 'story' ? 'h-[42vh] w-auto object-contain' : 'w-full h-auto object-contain'}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShareImage}
            disabled={busy === 'image'}
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--accent-indonesian)] text-white font-bold disabled:opacity-60"
          >
            {busy === 'image' ? 'Preparing…' : 'Share image'}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={busy === 'link'}
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--surface-inset)] text-[color:var(--foreground)] font-semibold disabled:opacity-60"
          >
            {copied ? 'Copied!' : busy === 'link' ? 'Copying…' : 'Copy link'}
          </button>
        </div>

        <p className="mt-3 text-[11px] text-[color:var(--text-secondary)] text-center">
          Tap an option to share to Instagram, WhatsApp, TikTok, or anywhere else.
        </p>

        {/* hidden a11y context for screen readers */}
        <span className="sr-only">{shareText}</span>
        <span className="sr-only">{shareUrl}</span>
        <span className="sr-only">{wordId}</span>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
