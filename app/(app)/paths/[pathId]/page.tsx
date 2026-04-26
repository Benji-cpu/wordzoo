import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  getPathById,
  verifyPathAccess,
  getSceneMasteryForPath,
  getPathWordStats,
  getLanguageById,
  upsertUserPath,
} from '@/lib/db/queries';
import { PathDetailClient } from './PathDetailClient';

interface PageProps {
  params: Promise<{ pathId: string }>;
}

export default async function PathDetailPage({ params }: PageProps) {
  const { pathId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const path = await getPathById(pathId);
  if (!path) return notFound();

  const hasAccess = await verifyPathAccess(pathId, userId);
  if (!hasAccess) return notFound();

  // Visiting a path's detail page is an explicit selection — mark it active so
  // the dashboard and other surfaces reflect the user's intent. Fire-and-forget.
  upsertUserPath(userId, pathId, 'active').catch(() => {});

  const [sceneMastery, wordStats, language] = await Promise.all([
    getSceneMasteryForPath(userId, pathId),
    getPathWordStats(userId, pathId),
    getLanguageById(path.language_id),
  ]);

  return (
    <PathDetailClient
      path={path}
      languageName={language?.name ?? 'Unknown'}
      languageCode={language?.code ?? null}
      sceneMastery={sceneMastery}
      wordStats={wordStats}
    />
  );
}
