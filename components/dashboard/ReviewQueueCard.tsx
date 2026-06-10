import Link from 'next/link';

interface ReviewQueueCardProps {
  dueCount: number;
  languageName?: string | null;
  startWithMostOverdue?: boolean;
}

export function ReviewQueueCard({ dueCount, languageName, startWithMostOverdue }: ReviewQueueCardProps) {
  if (dueCount <= 0) return null;

  const subtitle = startWithMostOverdue
    ? "we'll start with the most overdue"
    : languageName
      ? `${languageName} · words & phrases ready to review`
      : 'words & phrases ready to review';

  return (
    <Link
      href="/review"
      aria-label={`Review ${dueCount} due items`}
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
            <span className="text-[14px] font-extrabold text-white pb-1">due</span>
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
