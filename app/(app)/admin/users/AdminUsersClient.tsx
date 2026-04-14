'use client';

import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { AdminUserMetrics, AdminPathEngagement } from '@/lib/db/admin-queries';

interface AdminUsersClientProps {
  metrics: AdminUserMetrics;
  engagement: AdminPathEngagement[];
}

export function AdminUsersClient({ metrics, engagement }: AdminUsersClientProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">User Engagement</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{metrics.total_users}</p>
          <p className="text-xs text-text-secondary">Total Users</p>
        </Card>
        <Card className="!p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{metrics.active_7d}</p>
          <p className="text-xs text-text-secondary">Active (7d)</p>
        </Card>
        <Card className="!p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{metrics.active_30d}</p>
          <p className="text-xs text-text-secondary">Active (30d)</p>
        </Card>
        <Card className="!p-3 text-center">
          <p className="text-2xl font-bold text-foreground">
            {metrics.total_users > 0 ? Math.round((metrics.active_7d / metrics.total_users) * 100) : 0}%
          </p>
          <p className="text-xs text-text-secondary">7d Retention</p>
        </Card>
      </div>

      {/* Per-path engagement funnel */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">Path Funnels</h2>
        <div className="space-y-3">
          {engagement.map(path => (
            <Card key={path.path_id} className="!p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">{path.path_title}</h3>
                <span className="text-xs text-text-secondary">{path.enrolled} enrolled</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-secondary mb-2">
                <span>{path.enrolled} started</span>
                <span className="text-text-tertiary">&rarr;</span>
                <span>{path.completed} completed</span>
                <span className="text-text-tertiary">
                  ({path.enrolled > 0 ? Math.round((path.completed / path.enrolled) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary shrink-0">Avg progress</span>
                <div className="flex-1">
                  <ProgressBar value={path.avg_progress} accentColor="bg-accent-id" height="sm" />
                </div>
                <span className="text-xs text-text-secondary shrink-0">{path.avg_progress}%</span>
              </div>
            </Card>
          ))}
          {engagement.length === 0 && (
            <p className="text-sm text-text-secondary">No enrollment data yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
