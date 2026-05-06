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
  const studyDays = Math.max(1, sceneRows.length);
  const todayIso = new Date().toISOString().slice(0, 10);

  // Day-N math is anchored to when the plan was created (user_paths.started_at):
  // Day 1 the day you buy, Day 2 the next day, capped at the number of scenes.
  const planStartIso = userPath?.started_at
    ? new Date(userPath.started_at).toISOString().slice(0, 10)
    : todayIso;
  const daysSinceStart = Math.max(0, daysBetween(planStartIso, todayIso));
  const todayDayIndex = Math.min(studyDays - 1, daysSinceStart);

  // Trip status: if a trip date is set, compute days until and whether the trip is over.
  let daysUntilTrip: number | null = null;
  let tripIsOver = false;
  let tripLabel = '';
  if (tripStartDate) {
    const diff = daysBetween(todayIso, tripStartDate);
    daysUntilTrip = Math.max(0, diff);
    tripIsOver = diff < 0;
    tripLabel = new Date(`${tripStartDate}T00:00:00`).toLocaleDateString('en-US', {
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
        tripLabel={tripLabel}
        daysUntilTrip={daysUntilTrip}
        tripIsOver={tripIsOver}
        studyDays={studyDays}
        todayDayIndex={todayDayIndex}
        scenes={scenes}
        purchased={Boolean(purchase)}
        showPurchaseToast={purchasedParam === 'true'}
        showCanceledToast={canceledParam === 'true'}
      />
    </main>
  );
}
