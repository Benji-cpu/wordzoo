'use client';

import { useState, useEffect } from 'react';

interface FeedbackButtonsProps {
  mnemonicId: string;
  context: 'learn' | 'review';
  compact?: boolean;
  overlay?: boolean;
}

type Rating = 'thumbs_up' | 'thumbs_down';

export function FeedbackButtons({ mnemonicId, context, compact = false, overlay = false }: FeedbackButtonsProps) {
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const placeholderText = context === 'learn'
    ? 'What made it memorable (or not)?'
    : 'Did the image help you recall?';

  function submitFeedback(rating: Rating, comment?: string) {
    fetch('/api/mnemonics/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mnemonicId, rating, comment }),
    }).catch(console.error);
  }

  function handleRate(rating: Rating) {
    if (selectedRating) return;
    setSelectedRating(rating);
    setShowComment(true);
    submitFeedback(rating);
  }

  function handleSendComment() {
    if (!selectedRating || !commentText.trim()) return;
    submitFeedback(selectedRating, commentText.trim());
    setShowComment(false);
    setSubmitted(true);
  }

  function handleSkip() {
    setShowComment(false);
    setSubmitted(true);
  }

  // Auto-hide the "Thanks!" message after 2 seconds
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => setSubmitted(false), 2000);
    return () => clearTimeout(timer);
  }, [submitted]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Header + thumb buttons row */}
      <div className={`flex items-center ${compact ? 'gap-2' : 'justify-center gap-3'}`}>
        <button
          onClick={() => handleRate('thumbs_up')}
          disabled={selectedRating !== null}
          className={`flex items-center justify-center rounded-lg transition-all ${overlay ? 'w-7 h-7' : 'w-8 h-8'} ${
            selectedRating === 'thumbs_up'
              ? 'text-green-400'
              : selectedRating
                ? `${overlay ? 'text-white/30' : 'text-text-secondary bg-surface-inset'} opacity-40`
                : overlay
                  ? 'text-white/80 hover:text-white'
                  : 'text-text-secondary bg-surface-inset hover:bg-surface-inset'
          }`}
          aria-label="Thumbs up"
        >
          <svg width={overlay ? "14" : "16"} height={overlay ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 10v12" />
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
          </svg>
        </button>

        <button
          onClick={() => handleRate('thumbs_down')}
          disabled={selectedRating !== null}
          className={`flex items-center justify-center rounded-lg transition-all ${overlay ? 'w-7 h-7' : 'w-8 h-8'} ${
            selectedRating === 'thumbs_down'
              ? 'text-red-400'
              : selectedRating
                ? `${overlay ? 'text-white/30' : 'text-text-secondary bg-surface-inset'} opacity-40`
                : overlay
                  ? 'text-white/80 hover:text-white'
                  : 'text-text-secondary bg-surface-inset hover:bg-surface-inset'
          }`}
          aria-label="Thumbs down"
        >
          <svg width={overlay ? "14" : "16"} height={overlay ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 14V2" />
            <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
          </svg>
        </button>
      </div>

      {/* Comment input — slides in after rating */}
      {showComment && (
        <div className="mt-3 animate-slide-up">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && commentText.trim()) handleSendComment(); }}
            placeholder={placeholderText}
            className="w-full px-3 py-2 rounded-lg bg-surface-inset border border-card-border text-sm text-foreground placeholder:text-text-secondary focus:outline-none focus:border-accent-default/50 transition-colors"
            maxLength={500}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={handleSkip}
              className="px-3 py-1 text-xs text-text-secondary hover:text-foreground transition-colors"
            >
              Skip
            </button>
            {commentText.trim() && (
              <button
                onClick={handleSendComment}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-accent-default text-white hover:brightness-110 transition-all"
              >
                Send
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thanks message */}
      {submitted && (
        <p className="mt-2 text-xs text-text-secondary text-center animate-fade-in">
          Thanks!
        </p>
      )}
    </div>
  );
}
