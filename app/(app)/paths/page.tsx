import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getPathWordStats,
  getPathsByLanguage,
  getAllLanguages,
  getSceneMasteryForPath,
} from '@/lib/db/queries';
import type { SceneMasteryRow } from '@/lib/db/queries';
import { PathCard } from '@/components/learn/PathCard';
import { habitatFromLanguageCode, type HabitatLanguage } from '@/lib/utils/language-habitat';
import type { Path, Language } from '@/types/database';

function isSceneComplete(s: SceneMasteryRow): boolean {
  return s.scene_type === 'dialogue' ? s.scene_completed : s.mastered_words >= s.total_words;
}

export default async function PathsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const languages = await getAllLanguages();
  const languageById = new Map<string, Language>(languages.map((l) => [l.id, l]));

  const allPathsRaw: Path[] = [];
  for (const lang of languages) {
    try {
      const paths = await getPathsByLanguage(lang.id, userId);
      allPathsRaw.push(...paths);
    } catch (e) {
      console.error(`PathsPage: getPathsByLanguage failed for language ${lang.id}:`, e);
    }
  }

  // Only the premade paths: custom, studio and travel paths were deleted on
  // 27 Sep 2026 (WordZoo is Ben's own tool). Their rows stay in the DB.
  const seen = new Set<string>();
  const uniquePaths = allPathsRaw.filter((p) => {
    if (p.type !== 'premade' || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const EMPTY_STATS = { total_words: 0, words_learned: 0, words_mastered: 0 };
  const [statsResults, masteryResults] = await Promise.all([
    Promise.all(
      uniquePaths.map((p) =>
        getPathWordStats(userId, p.id).catch((e) => {
          console.error(`PathsPage: getPathWordStats failed for ${p.id}:`, e);
          return EMPTY_STATS;
        }),
      ),
    ),
    Promise.all(
      uniquePaths.map((p) =>
        getSceneMasteryForPath(userId, p.id).catch((e) => {
          console.error(`PathsPage: getSceneMasteryForPath failed for ${p.id}:`, e);
          return [] as SceneMasteryRow[];
        }),
      ),
    ),
  ]);

  const pathsWithStats = uniquePaths.map((path, i) => {
    const mastery = masteryResults[i];
    const scenesCompleted = mastery.filter(isSceneComplete).length;
    const totalScenes = mastery.length;
    const nextScene = mastery.find((s) => !isSceneComplete(s));
    const language: HabitatLanguage = habitatFromLanguageCode(languageById.get(path.language_id)?.code);
    return {
      path,
      wordCount: statsResults[i].total_words,
      wordsCompleted: statsResults[i].words_learned,
      progress:
        statsResults[i].total_words > 0
          ? Math.round((statsResults[i].words_learned / statsResults[i].total_words) * 100)
          : 0,
      scenesCompleted,
      totalScenes,
      nextSceneId: nextScene?.id ?? null,
      language,
    };
  });

  const premade = pathsWithStats;

  return (
    <div className="max-w-lg lg:max-w-5xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-[color:var(--foreground)] tracking-tight">
          Learning paths
        </h1>
        <p className="text-sm text-[color:var(--text-secondary)] font-semibold mt-1">
          Choose a path to start learning
        </p>
      </div>

      {/* Premade Paths */}
      {premade.length > 0 && (
        <section>
          <h2 className="text-[10.5px] font-extrabold text-[color:var(--text-secondary)] uppercase tracking-[0.16em] mb-3 px-1">
            Premade paths
          </h2>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {premade.map((p) => (
              <PathCard
                key={p.path.id}
                path={p.path}
                wordCount={p.wordCount}
                wordsCompleted={p.wordsCompleted}
                progress={p.progress}
                scenesCompleted={p.scenesCompleted}
                totalScenes={p.totalScenes}
                nextSceneId={p.nextSceneId}
                language={p.language}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
