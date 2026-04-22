'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { MnemonicImage } from '@/components/shared/MnemonicImage';
import { playWordPronunciation, isAudioUnlocked } from '@/lib/audio/pronunciation';

function renderBridgeSentence(sentence: string) {
  // Split on ALL-CAPS words (2+ letters) and render them highlighted
  const parts = sentence.split(/\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/);
  return parts.map((part, i) =>
    /^[A-Z]{2,}(?:\s+[A-Z]{2,})*$/.test(part) ? (
      <span key={i} className="font-bold text-accent-id not-italic">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const MNEMONIC_VIEWS_KEY = 'wz-mnemonic-views';

interface MnemonicCardProps {
  wordText: string;
  keyword: string;
  sceneDescription: string;
  bridgeSentence: string | null;
  imageUrl: string | null;
  mnemonicId?: string;
  wordId?: string;
  meaningEn?: string;
  languageName?: string;
  onContinue: () => void;
}

export function MnemonicCard({
  wordText,
  keyword,
  sceneDescription,
  bridgeSentence,
  imageUrl,
  mnemonicId,
  wordId,
  meaningEn,
  languageName,
  onContinue,
}: MnemonicCardProps) {
  const hasAutoPlayed = useRef(false);
  const [showLabel, setShowLabel] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Auto-play pronunciation when card appears
  useEffect(() => {
    if (wordId && !hasAutoPlayed.current && isAudioUnlocked()) {
      hasAutoPlayed.current = true;
      playWordPronunciation(wordId).catch(() => {});
    }
  }, [wordId]);

  // Track mnemonic view count — hide label after 3 views
  useEffect(() => {
    try {
      const views = parseInt(localStorage.getItem(MNEMONIC_VIEWS_KEY) || '0', 10);
      if (views >= 3) setShowLabel(false);
      localStorage.setItem(MNEMONIC_VIEWS_KEY, String(views + 1));
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Auto-hide "Thanks!" after 2s
  useEffect(() => {
    if (!feedbackSubmitted) return;
    const timer = setTimeout(() => setFeedbackSubmitted(false), 2000);
    return () => clearTimeout(timer);
  }, [feedbackSubmitted]);

  function submitFeedback(rating: 'thumbs_up' | 'thumbs_down', comment?: string) {
    if (!mnemonicId) return;
    fetch('/api/mnemonics/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mnemonicId, rating, comment }),
    }).catch(console.error);
  }

  function handleRate(rating: 'thumbs_up' | 'thumbs_down') {
    if (feedbackRating) return;
    setFeedbackRating(rating);
    setShowComment(true);
    submitFeedback(rating);
  }

  function handleSendComment() {
    if (!feedbackRating || !commentText.trim()) return;
    submitFeedback(feedbackRating, commentText.trim());
    setShowComment(false);
    setFeedbackSubmitted(true);
  }

  function handleSkipComment() {
    setShowComment(false);
    setFeedbackSubmitted(true);
  }

  function handleShare() {
    if (!wordId) return;
    const shareUrl = `${window.location.origin}/word/${wordId}`;
    const shareText = `I learned "${wordText}" in ${languageName ?? ''} — it means "${meaningEn ?? ''}"! Try this memory trick on WordZoo.`;

    if (navigator.share) {
      navigator.share({
        title: `${wordText} — WordZoo`,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).catch(() => {});
    }
  }

  return (
    <Card className="animate-spring-in overflow-hidden cursor-pointer" onClick={onContinue}>
      {showLabel && (
        <p className="text-sm text-text-secondary mb-1">Remember it like this:</p>
      )}
      <div className="flex items-center gap-1 whitespace-nowrap overflow-hidden mb-1">
        <span className="text-[clamp(0.9rem,4vw,1.25rem)] font-bold text-[var(--color-fox-primary)]">{wordText}</span>
        {wordId && (
          <span onClick={(e) => e.stopPropagation()}>
            <PronunciationButton wordId={wordId} size={18} className="-my-1" />
          </span>
        )}
        {keyword && (
          <>
            <span className="text-[clamp(0.85rem,3.8vw,1.125rem)] text-foreground">sounds like</span>
            <span className="text-[clamp(0.9rem,4vw,1.25rem)] font-bold text-foreground">&ldquo;{keyword}&rdquo;</span>
          </>
        )}
      </div>

      {bridgeSentence && (
        <p className="text-sm sm:text-base text-foreground italic mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
          {renderBridgeSentence(bridgeSentence)}
        </p>
      )}

      <div className="relative">
        <MnemonicImage
          src={imageUrl}
          alt={keyword}
          variant="card"
          keyword={keyword}
          fallback={
            <div className="w-full rounded-xl bg-gradient-to-br from-accent-id/15 to-surface-inset flex flex-col items-center justify-center py-10 px-6">
              <p className="text-2xl font-bold text-accent-id mb-2">&ldquo;{keyword}&rdquo;</p>
              {bridgeSentence && (
                <p className="text-sm text-foreground italic text-center">{renderBridgeSentence(bridgeSentence)}</p>
              )}
              <p className="text-xs text-text-secondary mt-4">Visual coming soon</p>
            </div>
          }
        />
      </div>
      {/* Feedback + share action strip — larger thumb targets (44px) in
          their own row below the image instead of tiny overlay buttons. */}
      {mnemonicId && (
        <div
          className="flex items-center justify-end gap-2 mt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRate('thumbs_up')}
            disabled={feedbackRating !== null}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              feedbackRating === 'thumbs_up'
                ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] scale-110'
                : feedbackRating
                  ? 'text-text-secondary/40'
                  : 'bg-[var(--surface-inset)] text-text-secondary hover:text-foreground active:scale-95'
            }`}
            aria-label="Thumbs up"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 10v12" />
              <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
            </svg>
          </button>
          <button
            onClick={() => handleRate('thumbs_down')}
            disabled={feedbackRating !== null}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              feedbackRating === 'thumbs_down'
                ? 'bg-[var(--color-error)]/15 text-[var(--color-error)] scale-110'
                : feedbackRating
                  ? 'text-text-secondary/40'
                  : 'bg-[var(--surface-inset)] text-text-secondary hover:text-foreground active:scale-95'
            }`}
            aria-label="Thumbs down"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 14V2" />
              <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
            </svg>
          </button>
          {wordId && (
            <button
              onClick={handleShare}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-[var(--surface-inset)] text-text-secondary hover:text-foreground active:scale-95 transition-all"
              aria-label="Share"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Comment input — appears below image after rating */}
      {showComment && (
        <div className="mt-2 animate-slide-up" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What made it memorable (or not)?"
            className="w-full px-3 py-2 rounded-lg bg-surface-inset border border-card-border text-sm text-foreground placeholder:text-text-secondary focus:outline-none focus:border-accent-default/50 transition-colors"
            maxLength={500}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={handleSkipComment}
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
      {feedbackSubmitted && (
        <p className="mt-2 text-xs text-text-secondary text-center animate-fade-in">
          Thanks!
        </p>
      )}
    </Card>
  );
}
