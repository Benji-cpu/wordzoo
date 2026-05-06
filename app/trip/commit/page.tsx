import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TripCommit } from '@/components/trip/TripCommit';

export default async function TripCommitPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/signup?return=/trip/commit');
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] flex items-center justify-center">
      <TripCommit />
    </main>
  );
}
