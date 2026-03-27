import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  getPathWordStats,
  getPathsByLanguage,
  getAllLanguages,
  getUserActivePath,
  getSceneMasteryForPath,
} from '@/lib/db/queries';
import type { SceneMasteryRow } from '@/lib/db/queries';
import { PathCard } from '@/components/learn/PathCard';
import { TravelPackCard } from '@/components/learn/TravelPackCard';
import { PathsClientSection } from './PathsClientSection';
import type { Path } from '@/types/database';

function isSceneComplete(s: SceneMasteryRow): boolean {
  return s.scene_type === 'dialogue' ? s.scene_completed : s.mastered_words >= s.total_words;
}

export default async function PathsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  // Determine default language from active path or first language
  const languages = await getAllLanguages();
  const activePath = await getUserActivePath(userId);
  const activeLanguageId = activePath?.path_language_id ?? languages[0]?.id ?? null;

  const allPathsRaw: Path[] = [];
  for (const lang of languages) {
    try {
      const paths = await getPathsByLanguage(lang.id, userId);
      allPathsRaw.push(...paths);
    } catch (e) {
      console.error(`PathsPage: getPathsByLanguage failed for language ${lang.id}:`, e);
    }
  }

  // Deduplicate (in case a path shows up under multiple queries)
  const seen = new Set<string>();
  const uniquePaths = allPathsRaw.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Get word stats and scene mastery for each path in parallel
  let statsResults: Awaited<ReturnType<typeof getPathWordStats>>[];
  let masteryResults: Awaited<ReturnType<typeof getSceneMasteryForPath>>[];
  try {
    [statsResults, masteryResults] = await Promise.all([
      Promise.all(uniquePaths.map(p => getPathWordStats(userId, p.id))),
      Promise.all(uniquePaths.map(p => getSceneMasteryForPath(userId, p.id))),
    ]);
  } catch (e) {
    console.error('PathsPage: stats/mastery fetch failed:', e);
    statsResults = uniquePaths.map(() => ({ total_words: 0, words_learned: 0, words_mastered: 0 }));
    masteryResults = uniquePaths.map(() => []);
  }

  const pathsWithStats = uniquePaths.map((path, i) => {
    const mastery = masteryResults[i];
    const scenesCompleted = mastery.filter(isSceneComplete).length;
    const totalScenes = mastery.length;
    return {
      path,
      wordCount: statsResults[i].total_words,
      wordsCompleted: statsResults[i].words_learned,
      progress: statsResults[i].total_words > 0
        ? Math.round((statsResults[i].words_learned / statsResults[i].total_words) * 100)
        : 0,
      scenesCompleted,
      totalScenes,
    };
  });

  const premade = pathsWithStats.filter(p => p.path.type === 'premade');
  const travel = pathsWithStats.filter(p => p.path.type === 'travel');
  const custom = pathsWithStats.filter(p => p.path.type === 'custom');
  const studio = pathsWithStats.filter(p => p.path.type === 'studio');

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learning Paths</h1>
        <p className="text-sm text-text-secondary mt-1">
          Choose a path to start learning
        </p>
      </div>

      {/* Premade Paths */}
      {premade.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
            Premade Paths
          </h2>
          <div className="space-y-3">
            {premade.map(p => (
              <PathCard
                key={p.path.id}
                path={p.path}
                wordCount={p.wordCount}
                wordsCompleted={p.wordsCompleted}
                progress={p.progress}
                scenesCompleted={p.scenesCompleted}
                totalScenes={p.totalScenes}
              />
            ))}
          </div>
        </section>
      )}

      {/* Travel Packs */}
      {travel.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
            Travel Packs
          </h2>
          <div className="space-y-3">
            {travel.map(p => (
              <TravelPackCard key={p.path.id} path={p.path} wordCount={p.wordCount} />
            ))}
          </div>
        </section>
      )}

      {/* Studio Paths */}
      {studio.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
            Studio Paths
          </h2>
          <div className="space-y-3">
            {studio.map(p => (
              <PathCard
                key={p.path.id}
                path={p.path}
                wordCount={p.wordCount}
                wordsCompleted={p.wordsCompleted}
                progress={p.progress}
                scenesCompleted={p.scenesCompleted}
                totalScenes={p.totalScenes}
              />
            ))}
          </div>
        </section>
      )}

      {/* Custom Paths */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Custom Paths
        </h2>
        {custom.length > 0 && (
          <div className="space-y-3 mb-3">
            {custom.map(p => (
              <PathCard
                key={p.path.id}
                path={p.path}
                wordCount={p.wordCount}
                wordsCompleted={p.wordsCompleted}
                progress={p.progress}
                scenesCompleted={p.scenesCompleted}
                totalScenes={p.totalScenes}
              />
            ))}
          </div>
        )}
        <Link
          href={`/paths/studio${activeLanguageId ? `?languageId=${activeLanguageId}` : ''}`}
          className="block w-full p-4 rounded-xl border-2 border-dashed border-accent-default/30 hover:border-accent-default/60 bg-accent-default/5 hover:bg-accent-default/10 transition-all text-center group"
        >
          <div className="flex items-center justify-center gap-2 text-accent-default">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="font-medium">Path Studio</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Co-create rich dialogue paths with AI
          </p>
        </Link>
        <PathsClientSection languageId={activeLanguageId} />
      </section>
    </div>
  );
}
