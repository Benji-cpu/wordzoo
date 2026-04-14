import {
  getFeedbackStats,
  getWorstMnemonics,
  getBestMnemonics,
  getFeedbackWithComments,
} from '@/lib/db/admin-queries';
import { AdminFeedbackClient } from './AdminFeedbackClient';

export default async function AdminFeedbackPage() {
  const [stats, worst, best, comments] = await Promise.all([
    getFeedbackStats(),
    getWorstMnemonics(20, 0),
    getBestMnemonics(20, 0),
    getFeedbackWithComments(20, 0),
  ]);

  return (
    <AdminFeedbackClient
      stats={stats}
      worst={worst}
      best={best}
      comments={comments}
    />
  );
}
