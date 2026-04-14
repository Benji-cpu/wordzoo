import { getAdminUserMetrics, getAdminPathEngagement } from '@/lib/db/admin-queries';
import { AdminUsersClient } from './AdminUsersClient';

export default async function AdminUsersPage() {
  const [metrics, engagement] = await Promise.all([
    getAdminUserMetrics(),
    getAdminPathEngagement(),
  ]);

  return <AdminUsersClient metrics={metrics} engagement={engagement} />;
}
