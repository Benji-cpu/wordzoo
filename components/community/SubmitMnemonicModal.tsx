'use client';

import { useState } from 'react';

interface SubmitMnemonicModalProps {
  mnemonicId: string;
  keyword: string;
  sceneDescription: string;
  imageUrl: string | null;
  wordId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function SubmitMnemonicModal({
  mnemonicId,
  keyword,
  sceneDescription,
  imageUrl,
  wordId,
  onClose,
  onSubmitted,
}: SubmitMnemonicModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/community/${wordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonicId }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setSuccess(true);
        setTimeout(onSubmitted, 1500);
      }
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="glass-card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">Shared!</div>
            <p className="text-sm text-text-secondary">
              Your mnemonic is now visible to the community.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-foreground mb-4">Share with Community</h3>

            {/* Preview */}
            <div className="glass-card p-3 mb-4">
              {imageUrl && (
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <p className="text-sm font-medium text-foreground mb-1">
                &ldquo;{keyword}&rdquo;
              </p>
              <p className="text-xs text-text-secondary line-clamp-2">{sceneDescription}</p>
            </div>

            <p className="text-xs text-text-secondary mb-4">
              By submitting, you agree that this content is appropriate and original.
              It will be visible to other WordZoo users.
            </p>

            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl text-sm text-text-secondary bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-accent-default hover:bg-accent-default/80 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
