import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getPathById, getSceneMasteryForPath, getUserPathRow, getPurchaseForPath } from '@/lib/db/queries';
import { TripDashboard } from '@/components/trip/TripDashboard';

interface PageProps {
  params: Promise<{ pathId: string }>;
  searchParams: Promise<{ purchased?: string; canceled?: string }>;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function TripDashboardPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?return=/trip');
  }

  const { pathId } = await params;
  const { purchased: purchasedParam, canceled: canceledParam } = await searchParams;

  const path = await getPathById(pathId);
  if (!path || path.type !== 'travel') {
    notFound();
  }

  const [userPath, sceneRows, purchase] = await Promise.all([
    getUserPathRow(session.user.id, pathId),
    getSceneMasteryForPath(session.user.id, pathId),
    getPurchaseForPath(session.user.id, pathId),
  ]);

  const tripStartDate = userPath?.trip_start_date ?? null;
  const tripDays = sceneRows.length || 1;
  const todayIso = new Date().toISOString().slice(0, 10);

  let daysUntilTrip: number | null = null;
  let todayLabel = '';
  if (tripStartDate) {
    const diff = daysBetween(todayIso, tripStartDate);
    daysUntilTrip = diff < 0 ? 0 : diff;
    todayLabel = new Date(`${tripStartDate}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  const scenes = sceneRows.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    totalWords: s.total_words,
    masteredWords: s.mastered_words,
  }));

  return (
    <main className="min-h-screen bg-[color:var(--background)]">
      <TripDashboard
        pathId={path.id}
        pathTitle={path.title}
        tripStartDate={tripStartDate}
        tripDays={tripDays}
        scenes={scenes}
        purchased={Boolean(purchase)}
        todayLabel={todayLabel}
        daysUntilTrip={daysUntilTrip}
        showPurchaseToast={purchasedParam === 'true'}
        showCanceledToast={canceledParam === 'true'}
      />
    </main>
  );
}
