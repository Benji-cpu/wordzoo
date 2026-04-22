'use client';

import { useState, type ReactNode } from 'react';

type Variant = 'card' | 'review' | 'phrase-composite' | 'phrase-word' | 'thumb' | 'community';

const VARIANT_IMG_CLASS: Record<Variant, string> = {
  card: 'w-full max-h-[55dvh] mx-auto block object-cover rounded-xl shadow-[var(--shadow-elevated)]',
  review: 'w-full max-h-[calc(100dvh-340px)] min-h-[120px] object-cover rounded-xl',
  'phrase-composite': 'w-full max-h-[45dvh] object-cover rounded-xl',
  'phrase-word': 'max-h-[150px] rounded-lg object-cover mx-auto',
  thumb: 'w-10 h-10 rounded-lg object-cover flex-shrink-0',
  community: 'w-full h-full object-cover',
};

const VARIANT_SKELETON_CLASS: Record<Variant, string> = {
  card: 'w-full h-[55dvh] rounded-xl',
  review: 'w-full h-[200px] rounded-xl',
  'phrase-composite': 'w-full h-[200px] rounded-xl',
  'phrase-word': 'w-full h-[150px] rounded-lg',
  thumb: 'w-10 h-10 rounded-lg',
  community: 'w-full h-full',
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
  /** Show a skeleton while the image loads. Default: true. */
  skeleton?: boolean;
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

/**
 * Shared mnemonic image renderer. Centralises loading skeleton, null-src fallback,
 * and per-surface sizing so every mnemonic image across the app looks consistent.
 */
export function MnemonicImage({
  src,
  alt,
  variant = 'card',
  className,
  fallback,
  keyword,
  skeleton = true,
  onLoad,
}: MnemonicImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
  }

  if (!src) {
    if (fallback === null) return null;
    return <>{fallback ?? <DefaultFallback keyword={keyword} variant={variant} />}</>;
  }

  const imgClass = `${VARIANT_IMG_CLASS[variant]} ${className ?? ''}`.trim();

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
        className={`${imgClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : skeleton ? 'opacity-0 h-0' : 'opacity-100'}`}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
      />
    </>
  );
}
