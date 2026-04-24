import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[color:var(--background)] text-[color:var(--foreground)] p-6">
      <div className="max-w-md w-full">
        <EmptyStateCard
          foxPose="thinking"
          title="We couldn't find that page"
          subtitle="It may have moved, or the link might be out of date. Head back to your dashboard, or browse a learning path."
          primary={{ label: 'Back to dashboard', href: '/dashboard' }}
          secondary={{ label: 'Browse paths', href: '/paths' }}
        />
      </div>
    </div>
  );
}
