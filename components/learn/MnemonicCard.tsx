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
      <span key={i} className="font-extrabold not-italic text-[color:var(--accent-indonesian)]">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
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

  useEffect(() => {
    if (wordId && !hasAutoPlayed.current && isAudioUnlocked()) {
      hasAutoPlayed.current = true;
      playWordPronunciation(wordId).catch(() => {});
    }
  }, [wordId]);

  useEffect(() => {
    try {
      const views = parseInt(localStorage.getItem(MNEMONIC_VIEWS_KEY) || '0', 10);
      if (views >= 3) setShowLabel(false);
      localStorage.setItem(MNEMONIC_VIEWS_KEY, String(views + 1));
    } catch {
      // localStorage unavailable
    }
  }, []);

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
      navigator
        .share({
          title: `${wordText} — WordZoo`,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).catch(() => {});
    }
  }

  return (
    <Card className="animate-spring-in overflow-hidden cursor-pointer" onClick={onContinue}>
      {showLabel && (
        <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[color:var(--text-secondary)] mb-2">
          Remember it like this
        </p>
      )}

      <div className="flex items-baseline gap-2 flex-wrap mb-2">
        <span
          className="font-display text-[color:var(--color-fox-primary)] leading-none"
          style={{ fontSize: 'clamp(1.35rem, 5.5vw, 1.75rem)' }}
        >
          {wordText}
        </span>
        {wordId && (
          <span onClick={(e) => e.stopPropagation()} className="inline-flex">
            <PronunciationButton wordId={wordId} size={18} className="-my-1" />
          </span>
        )}
        {keyword && (
          <>
            <span className="text-[14px] text-[color:var(--text-secondary)] font-semibold">
              sounds like
            </span>
            <span
              className="font-extrabold text-[color:var(--foreground)]"
              style={{ fontSize: 'clamp(1.1rem, 4.8vw, 1.35rem)' }}
            >
              &ldquo;{keyword}&rdquo;
            </span>
          </>
        )}
      </div>

      {bridgeSentence && (
        <p className="text-[14px] sm:text-[15px] italic text-[color:var(--foreground)] mb-3 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
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
            <div
              className="w-full rounded-[18px] flex flex-col items-center justify-center py-10 px-6"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent-indonesian) 15%, var(--surface-inset)), var(--surface-inset))',
              }}
            >
              <p className="font-display text-[color:var(--accent-indonesian)] mb-2" style={{ fontSize: '1.75rem' }}>
                &ldquo;{keyword}&rdquo;
              </p>
              {bridgeSentence && (
                <p className="text-sm text-[color:var(--foreground)] italic text-center">
                  {renderBridgeSentence(bridgeSentence)}
                </p>
              )}
              <p className="text-xs text-[color:var(--text-secondary)] mt-4 font-semibold">
                Visual coming soon
              </p>
            </div>
          }
        />

        {/* Feedback + share strip — overlaid on the image so it sits where the
            thumb naturally lands without forcing the user to scroll past it. */}
        {mnemonicId && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md px-2 py-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleRate('thumbs_up')}
              disabled={feedbackRating !== null}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-[transform,background-color,color] duration-[var(--duration-micro)] ${
                feedbackRating === 'thumbs_up'
                  ? 'bg-[color:var(--color-success)]/30 text-white scale-110'
                  : feedbackRating
                    ? 'text-white/40'
                    : 'text-white/85 hover:text-white active:scale-95'
              }`}
              aria-label="Thumbs up"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
            </button>
            <button
              onClick={() => handleRate('thumbs_down')}
              disabled={feedbackRating !== null}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-[transform,background-color,color] duration-[var(--duration-micro)] ${
                feedbackRating === 'thumbs_down'
                  ? 'bg-[color:var(--color-error)]/30 text-white scale-110'
                  : feedbackRating
                    ? 'text-white/40'
                    : 'text-white/85 hover:text-white active:scale-95'
              }`}
              aria-label="Thumbs down"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 14V2" />
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
              </svg>
            </button>
            {wordId && (
              <button
                onClick={handleShare}
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/85 hover:text-white active:scale-95 transition-[transform,color] duration-[var(--duration-micro)]"
                aria-label="Share"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      </div>

      {/* Comment input */}
      {showComment && (
        <div className="mt-3 animate-slide-up" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What made it memorable (or not)?"
            className="w-full px-3 py-2.5 rounded-[12px] bg-[color:var(--surface-inset)] border border-[color:var(--border-default)] text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--nav-active)]/50 transition-colors"
            maxLength={500}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={handleSkipComment}
              className="px-3 py-1.5 text-xs font-bold text-[color:var(--text-secondary)] hover:text-[color:var(--foreground)] transition-colors"
            >
              Skip
            </button>
            {commentText.trim() && (
              <button
                onClick={handleSendComment}
                className="px-3 py-1.5 rounded-[10px] text-xs font-extrabold bg-[color:var(--accent-indonesian)] text-white active:scale-[0.97] transition-transform"
              >
                Send
              </button>
            )}
          </div>
        </div>
      )}

      {feedbackSubmitted && (
        <p className="mt-2 text-xs font-semibold text-[color:var(--text-secondary)] text-center animate-fade-in">
          Thanks!
        </p>
      )}
    </Card>
  );
}
