import { getAdminPathHealth } from '@/lib/db/admin-queries';
import { AdminContentClient } from './AdminContentClient';

export default async function AdminContentPage() {
  const pathHealth = await getAdminPathHealth();
  return <AdminContentClient pathHealth={pathHealth} />;
}
