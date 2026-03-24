import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-4">🦁</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-text-secondary mb-8">
        This page doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/paths"
          className="px-4 py-2 bg-card-surface border border-card-border text-foreground rounded-lg font-medium hover:bg-card-hover transition-colors"
        >
          Browse Paths
        </Link>
      </div>
    </div>
  );
}
