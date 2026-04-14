import { getAdminContentOverview, getAdminUserMetrics } from '@/lib/db/admin-queries';
import { Card } from '@/components/ui/Card';

export default async function AdminOverviewPage() {
  const [content, users] = await Promise.all([
    getAdminContentOverview(),
    getAdminUserMetrics(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Admin Overview</h1>

      {/* Content Stats */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Content</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Paths" value={content.total_paths} />
          <StatCard label="Scenes" value={content.total_scenes} />
          <StatCard label="Words" value={content.total_words} />
          <StatCard label="Mnemonics" value={content.total_mnemonics} />
          <StatCard label="Users" value={content.total_users} />
        </div>
      </section>

      {/* User Stats */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Engagement</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Active (7d)" value={users.active_7d} />
          <StatCard label="Active (30d)" value={users.active_30d} />
          <StatCard label="Paths Started" value={users.paths_started} />
          <StatCard label="Paths Completed" value={users.paths_completed} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="!p-3 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </Card>
  );
}
