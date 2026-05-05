'use client';

import { useEffect, useState, type ReactNode } from 'react';

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

const ZOOMABLE_VARIANTS: ReadonlySet<Variant> = new Set(['card', 'review', 'phrase-composite']);

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
  /** Disable click-to-zoom. Defaults to true on card/review/phrase-composite variants. */
  zoomable?: boolean;
  onLoad?: () => void;
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

function ZoomOverlay({ src, alt, caption, onClose }: { src: string; alt: string; caption?: string | null; onClose: () => void }) {
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Mnemonic image"
    >
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full max-h-[85vh] object-contain rounded-xl"
          onClick={() => caption && setShowCaption((s) => !s)}
        />
        {caption && (
          <div
            className={`absolute inset-x-3 bottom-3 rounded-xl bg-black/65 backdrop-blur px-4 py-3 text-white text-sm leading-snug transition-opacity duration-300 ${
              showCaption ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {caption}
          </div>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {caption && !showCaption && (
          <p className="absolute inset-x-0 -bottom-7 text-center text-xs text-white/60">
            Tap image to reveal story
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Shared mnemonic image renderer. Centralises loading skeleton, null-src fallback,
 * per-surface sizing, and click-to-zoom so every mnemonic image across the app
 * behaves consistently.
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
  zoomable,
  onLoad,
}: MnemonicImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  const [zoomed, setZoomed] = useState(false);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
  }

  if (!src) {
    if (fallback === null) return null;
    return <>{fallback ?? <DefaultFallback keyword={keyword} variant={variant} />}</>;
  }

  const imgClass = `${VARIANT_IMG_CLASS[variant]} ${className ?? ''}`.trim();
  const isZoomable = zoomable ?? ZOOMABLE_VARIANTS.has(variant);

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
        className={`${imgClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : skeleton ? 'opacity-0 h-0' : 'opacity-100'} ${isZoomable ? 'cursor-zoom-in' : ''}`}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onClick={isZoomable ? (e) => { e.stopPropagation(); setZoomed(true); } : undefined}
      />
      {zoomed && (
        <ZoomOverlay
          src={src}
          alt={alt}
          caption={zoomCaption ?? null}
          onClose={() => setZoomed(false)}
        />
      )}
    </>
  );
}
