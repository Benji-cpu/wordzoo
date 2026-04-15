import { getAppFeedbackStats, getAppFeedbackList } from '@/lib/db/admin-queries';
import { AdminAppFeedbackClient } from './AdminAppFeedbackClient';

export default async function AdminAppFeedbackPage() {
  const [stats, items] = await Promise.all([
    getAppFeedbackStats(),
    getAppFeedbackList(20, 0),
  ]);

  return <AdminAppFeedbackClient initialStats={stats} initialItems={items} />;
}
