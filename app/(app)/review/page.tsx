import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDueWords, getDuePhrases } from '@/lib/srs/engine';
import { ReviewClient } from '@/components/learn/ReviewClient';

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [dueWords, duePhrases] = await Promise.all([
    getDueWords(session.user.id),
    getDuePhrases(session.user.id),
  ]);

  return (
    <div className="max-w-lg mx-auto pb-24">
      <ReviewClient dueWords={dueWords} duePhrases={duePhrases} />
    </div>
  );
}
