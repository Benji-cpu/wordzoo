'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { speak, playWordPronunciation } from '@/lib/audio';
import { useAutoSpeak } from '@/components/audio/AudioPreferences';

type Variant = 'card' | 'review' | 'phrase-composite' | 'phrase-word' | 'thumb' | 'community';

const VARIANT_IMG_CLASS: Record<Variant, string> = {
  // Slightly tightened from 55dvh → 45dvh on card variant so the surrounding
  // text and rating buttons fit inside one mobile viewport.
  card: 'w-full max-h-[45dvh] mx-auto block object-cover rounded-xl shadow-[var(--shadow-elevated)]',
  review: 'w-full max-h-[calc(100dvh-360px)] min-h-[120px] object-cover rounded-xl',
  'phrase-composite': 'w-full max-h-[40dvh] object-cover rounded-xl',
  'phrase-word': 'max-h-[150px] rounded-lg object-cover mx-auto',
  thumb: 'w-10 h-10 rounded-lg object-cover flex-shrink-0',
  community: 'w-full h-full object-cover',
};

const VARIANT_SKELETON_CLASS: Record<Variant, string> = {
  card: 'w-full h-[45dvh] rounded-xl',
  review: 'w-full h-[200px] rounded-xl',
  'phrase-composite': 'w-full h-[200px] rounded-xl',
  'phrase-word': 'w-full h-[150px] rounded-lg',
  thumb: 'w-10 h-10 rounded-lg',
  community: 'w-full h-full',
};

/**
 * How each variant opens its lightbox.
 *
 *   'tap'    — the image itself opens it (nothing else wants that tap).
 *   'button' — an explicit ⤢ button opens it, because the surrounding card
 *              already owns the tap (MnemonicCard advances, ReviewCard
 *              reveals) and swallowing it would cost the biggest, easiest
 *              target on the screen. Needs a positioned ancestor to anchor
 *              the button — both current consumers wrap in `relative`.
 *   'none'   — thumbnails and images inside links/popovers.
 */
type ZoomMode = 'tap' | 'button' | 'none';

const VARIANT_ZOOM_MODE: Record<Variant, ZoomMode> = {
  card: 'button',
  review: 'button',
  'phrase-composite': 'tap',
  'phrase-word': 'tap',
  thumb: 'none',
  community: 'none',
};

interface MnemonicImageProps {
  src: string | null | undefined;
  alt: string;
  variant?: Variant;
  className?: string;
  /** Content rendered when `src` is nullish. If omitted, a default gradient fallback is used. Pass `null` to render nothing on missing src. */
  fallback?: ReactNode;
  /** Fallback keyword (used only by default fallback). */
  keyword?: string;
  /** Optional bridge sentence / caption shown overlaid in the zoom modal. */
  zoomCaption?: string | null;
  /** Show a skeleton while the image loads. Default: true. */
  skeleton?: boolean;
  /** Override how this image opens its lightbox. Defaults per variant — see VARIANT_ZOOM_MODE. */
  zoom?: ZoomMode;
  /**
   * What this picture says when you ask it to. Supplying it puts a speaker on
   * the image and, for learners who asked to be spoken to, plays it on arrival.
   *
   * The speaker is a corner button rather than the image's own tap, which is
   * already spoken for everywhere it matters: on `card` and `review` the
   * surrounding card advances or reveals, and on the phrase variants the image
   * zooms. Taking that tap would trade the biggest target on the screen for a
   * gesture nobody can see is available.
   */
  speech?: ImageSpeech | null;
  onLoad?: () => void;
}

/**
 * What to say, in whichever terms the caller actually has.
 *
 * Surfaces differ in what they hold: a review card has a `Word` (which carries
 * a `language_id`, not a code), a phrase block has raw text and a language
 * code, and a mnemonic card has a word id and little else. Rather than push a
 * language code down through every tree, take what is available and let the
 * existing ladder resolve the rest.
 */
export interface ImageSpeech {
  /** Shown in the label; also what gets synthesized when `lang` is known. */
  text: string;
  lang?: string | null;
  audioUrl?: string | null;
  /** Resolves language and audio via the API when the caller has neither. */
  wordId?: string | null;
}

function DefaultFallback({ keyword, variant }: { keyword?: string; variant: Variant }) {
  if (variant === 'thumb') {
    return (
      <div className="w-10 h-10 rounded-lg bg-card-border/30 flex-shrink-0 flex items-center justify-center text-xs text-text-secondary">
        {keyword?.charAt(0).toUpperCase() ?? '?'}
      </div>
    );
  }
  const sizing =
    variant === 'phrase-word'
      ? 'py-4 px-3'
      : variant === 'phrase-composite'
        ? 'py-6 px-4'
        : variant === 'community'
          ? 'w-full h-full py-10 px-6'
          : 'py-10 px-6';
  const rounded = variant === 'phrase-word' ? 'rounded-lg' : 'rounded-xl';
  return (
    <div className={`${sizing} ${rounded} bg-gradient-to-br from-accent-id/15 to-surface-inset flex flex-col items-center justify-center text-center`}>
      {keyword && (
        <p className="text-lg sm:text-2xl font-bold text-accent-id">&ldquo;{keyword}&rdquo;</p>
      )}
      <p className="text-xs text-text-secondary mt-2">Visual coming soon</p>
    </div>
  );
}

function ZoomOverlay({ src, alt, caption, onClose, onSpeak }: { src: string; alt: string; caption?: string | null; onClose: () => void; onSpeak?: (() => void) | null }) {
  const [showCaption, setShowCaption] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Anything that isn't the story toggle closes: backdrop, the padding around
  // the image, and the image itself. Tapping an opened image to shut it again
  // is the one gesture everybody tries first.
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        onClick={onClose}
        aria-label="Close image"
        className="fixed top-3 right-3 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      {onSpeak && (
        // Fixed, next to the close button: the overlay's own tap closes it, so
        // the full-screen view would otherwise be the one place you cannot hear
        // the thing you are looking at.
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSpeak();
          }}
          aria-label="Hear this"
          className="fixed top-3 right-16 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
      )}
      <div className="relative max-w-3xl w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full max-h-[85vh] object-contain rounded-xl" />
        {caption && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCaption((s) => !s);
              }}
              className="absolute top-3 left-3 rounded-full bg-black/65 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white active:scale-95"
            >
              {showCaption ? 'Hide story' : 'Show story'}
            </button>
            <div
              className={`absolute inset-x-3 bottom-3 rounded-xl bg-black/65 backdrop-blur px-4 py-3 text-white text-sm leading-snug transition-opacity duration-300 ${
                showCaption ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {caption}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Say-it button, mirroring ExpandButton across the image.
 *
 * Deliberately the same shape and weight as the expand control: they are two
 * things you can do to a picture, and making one of them louder would suggest
 * a hierarchy that isn't there.
 */
function SpeakButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Hear this"
      className="absolute top-2 left-2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md text-white/85 flex items-center justify-center active:scale-95 hover:text-white transition-[transform,color] z-10"
    >
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
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className={busy ? 'animate-pulse' : ''} />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className={busy ? 'animate-pulse' : ''} />
      </svg>
    </button>
  );
}

/** Corner affordance for images whose own tap belongs to the card around them. */
function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Open image full screen"
      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md text-white/85 flex items-center justify-center active:scale-95 hover:text-white transition-[transform,color]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6" />
        <path d="M9 21H3v-6" />
        <path d="M21 3l-7 7" />
        <path d="M3 21l7-7" />
      </svg>
    </button>
  );
}

/**
 * Shared mnemonic image renderer. Centralises loading skeleton, null-src fallback,
 * per-surface sizing, and the lightbox so every mnemonic image across the app
 * opens the same way (tap, or the ⤢ button where the card owns the tap) and
 * closes the same way (tap anywhere, Escape, or ✕).
 */
export function MnemonicImage({
  src,
  alt,
  variant = 'card',
  className,
  fallback,
  keyword,
  zoomCaption,
  skeleton = true,
  zoom,
  speech,
  onLoad,
}: MnemonicImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  const [zoomed, setZoomed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
    setErrored(false);
  }

  const say = useCallback(async () => {
    if (!speech) return;
    setSpeaking(true);
    try {
      if (speech.lang) {
        await speak(speech.text, speech.lang, { audioUrl: speech.audioUrl, kind: 'word' });
      } else if (speech.wordId) {
        // No language code here — this path fetches it along with the clip.
        await playWordPronunciation(speech.wordId, { audioUrl: speech.audioUrl ?? undefined });
      }
    } catch {
      // A picture that cannot speak is still a picture.
    } finally {
      setSpeaking(false);
    }
  }, [speech]);

  // Keyed on what is said rather than on `src`, so a picture that changes while
  // the word stays put (a regenerated mnemonic) doesn't announce itself again.
  useAutoSpeak(speech ? `${speech.lang ?? speech.wordId ?? ''}:${speech.text}` : null, say);

  if (!src || errored) {
    if (fallback === null) return null;
    return <>{fallback ?? <DefaultFallback keyword={keyword} variant={variant} />}</>;
  }

  const imgClass = `${VARIANT_IMG_CLASS[variant]} ${className ?? ''}`.trim();
  const zoomMode = zoom ?? VARIANT_ZOOM_MODE[variant];

  return (
    <>
      {skeleton && !loaded && (
        <div
          className={`${VARIANT_SKELETON_CLASS[variant]} bg-surface-inset animate-pulse`}
          aria-hidden
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${imgClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : skeleton ? 'opacity-0 h-0' : 'opacity-100'} ${zoomMode === 'tap' ? 'cursor-zoom-in' : ''}`}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onError={() => setErrored(true)}
        onClick={zoomMode === 'tap' ? (e) => { e.stopPropagation(); setZoomed(true); } : undefined}
      />
      {zoomMode === 'button' && loaded && <ExpandButton onClick={() => setZoomed(true)} />}
      {/* Thumbnails and community tiles are too small to carry a control, and
          are decoration rather than the thing being learned. */}
      {speech && loaded && variant !== 'thumb' && variant !== 'community' && (
        <SpeakButton onClick={say} busy={speaking} />
      )}
      {zoomed && (
        <ZoomOverlay
          src={src}
          alt={alt}
          caption={zoomCaption ?? null}
          onClose={() => setZoomed(false)}
          onSpeak={speech ? say : null}
        />
      )}
    </>
  );
}
