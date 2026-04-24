import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto flex flex-col justify-center min-h-[60vh] px-4">
      <EmptyStateCard
        foxPose="thinking"
        title="Page not found"
        subtitle="This page doesn't exist or may have been moved. Pick where to go next."
        primary={{ label: 'Go to dashboard', href: '/dashboard' }}
        secondary={{ label: 'Browse paths', href: '/paths' }}
      />
    </div>
  );
}
