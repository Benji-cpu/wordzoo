import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-6xl font-bold text-accent-default">404</p>
        <h1 className="text-2xl font-bold">We couldn&apos;t find that page</h1>
        <p className="text-text-secondary">
          It may have moved, or the link might be out of date.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full min-h-[48px] rounded-lg bg-accent-default text-white font-semibold hover:brightness-110"
          >
            Back to dashboard
          </Link>
          <Link
            href="/paths"
            className="inline-flex items-center justify-center w-full min-h-[48px] rounded-lg border border-card-border text-foreground font-medium hover:bg-surface-inset"
          >
            Browse paths
          </Link>
        </div>
      </div>
    </div>
  );
}
