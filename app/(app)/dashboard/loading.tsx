/**
 * Dashboard route skeleton. The page is a server component that awaits
 * several queries (active path, due words/phrases, streak, info-byte,
 * stats, insights, trip context) before it can render. Without this
 * segment-level fallback the main area sat blank during that wait — the
 * "a preload screen loads first" flash users reported. This mirrors the
 * real layout (greeting → hero → review card) so the wait reads as the
 * page assembling rather than a jarring empty screen.
 */
function Block({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-inset ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="max-w-lg mx-auto space-y-4" aria-busy="true" aria-label="Loading your dashboard">
      {/* Greeting + streak row */}
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-2">
          <Block className="h-7 w-44" />
          <Block className="h-4 w-28" />
        </div>
        <Block className="h-10 w-12 rounded-full" />
      </div>

      {/* Continue-learning hero */}
      <Block className="h-44 w-full" />

      {/* Review queue card */}
      <Block className="h-24 w-full" />

      {/* Secondary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Block className="h-28" />
        <Block className="h-28" />
      </div>

      {/* Info byte */}
      <Block className="h-20 w-full" />
    </div>
  );
}
