import Link from 'next/link';

interface ReviewQueueCardProps {
  /** Items the next /review sitting will load — the number to lead with. */
  sittingCount: number;
  /** Everything else that is due, left for later sittings. */
  laterCount?: number;
  languageName?: string | null;
}

/**
 * Leads with one sitting, not the backlog. After seven weeks away the backlog
 * is 65+ items; showing that as the headline is a wall, and /review only ever
 * loads one sitting anyway (REVIEW_SITTING in lib/srs/engine.ts).
 */
export function ReviewQueueCard({ sittingCount, laterCount = 0, languageName }: ReviewQueueCardProps) {
  if (sittingCount <= 0) return null;

  // ~15s a card, rounded up to the minute.
  const minutes = Math.max(1, Math.ceil((sittingCount * 15) / 60));
  const subtitle = laterCount > 0
    ? `about ${minutes} min · ${laterCount} more wait for later`
    : languageName
      ? `${languageName} · about ${minutes} min`
      : `about ${minutes} min`;
  const dueCount = sittingCount;

  return (
    <Link
      href="/review"
      aria-label={`Review ${dueCount} items`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[22px] active:scale-[0.99] transition-transform"
    >
      <div
        className="relative overflow-hidden rounded-[22px] p-[18px] shadow-[0_8px_20px_rgba(217,119,6,0.22)]"
        style={{ background: 'linear-gradient(135deg,#f59e0b,#fb923c)' }}
      >
        <div aria-hidden className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10 bg-white" />
        <div aria-hidden className="absolute -bottom-8 left-1/3 w-20 h-20 rounded-full opacity-10 bg-white" />
        <div className="relative">
          <div className="text-[10px] font-extrabold tracking-[0.18em] uppercase opacity-90 mb-1 text-white">
            Review first
          </div>
          <div className="flex items-end gap-2 mb-0.5">
            <span className="text-[36px] font-black leading-none tracking-tight text-white">{dueCount}</span>
            <span className="text-[14px] font-extrabold text-white pb-1">to review</span>
          </div>
          <div className="text-[12.5px] font-semibold opacity-90 mb-3.5 text-white">{subtitle}</div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold tracking-wide text-white">Review now</span>
            <span
              aria-hidden
              className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center font-black text-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              style={{ color: '#b45309' }}
            >
              ›
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
