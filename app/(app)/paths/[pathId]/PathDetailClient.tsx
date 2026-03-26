'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { IconButton } from '@/components/ui/IconButton';
import type { Path } from '@/types/database';
import type { SceneMasteryRow, PathWordStats } from '@/lib/db/queries';

interface PathDetailClientProps {
  path: Path;
  languageName: string;
  sceneMastery: SceneMasteryRow[];
  wordStats: PathWordStats;
}

const PHASE_WEIGHTS: Record<string, number> = {
  dialogue: 15, phrases: 30, vocabulary: 55, patterns: 70, conversation: 85, summary: 100,
};

function isSceneComplete(s: SceneMasteryRow): boolean {
  return s.scene_type === 'dialogue' ? s.scene_completed : s.mastered_words >= s.total_words;
}

function sceneProgress(s: SceneMasteryRow): number {
  if (isSceneComplete(s)) return 100;
  if (s.scene_type === 'dialogue') {
    return PHASE_WEIGHTS[s.current_phase ?? 'dialogue'] ?? 0;
  }
  return s.total_words > 0 ? Math.round((s.mastered_words / s.total_words) * 100) : 0;
}

function sceneStatusLabel(s: SceneMasteryRow): string {
  if (isSceneComplete(s)) return 'Complete';
  const progress = sceneProgress(s);
  if (progress === 0) return 'Not started';
  if (s.scene_type === 'dialogue' && s.current_phase) {
    const labels: Record<string, string> = {
      dialogue: 'Dialogue', phrases: 'Phrases', vocabulary: 'Vocab',
      patterns: 'Patterns', conversation: 'Chat', summary: 'Summary',
    };
    return labels[s.current_phase] ?? 'In progress';
  }
  return `${s.mastered_words}/${s.total_words} words`;
}

function tierLabel(type: Path['type']): string {
  switch (type) {
    case 'premade': return 'Premade';
    case 'custom': return 'Custom';
    case 'travel': return 'Travel';
  }
}

export function PathDetailClient({ path, languageName, sceneMastery, wordStats }: PathDetailClientProps) {
  const router = useRouter();
  const completedScenes = sceneMastery.filter(isSceneComplete).length;
  const totalScenes = sceneMastery.length;
  const overallProgress = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <IconButton label="Back to paths" onClick={() => router.push('/paths')} size="sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </IconButton>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground truncate">{path.title}</h1>
            <Badge variant={path.type === 'travel' ? 'tier' : 'default'}>
              {tierLabel(path.type)}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary">{languageName}</p>
        </div>
      </div>

      {/* Overall progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">
            {completedScenes}/{totalScenes} scenes complete
          </p>
          <p className="text-xs text-text-secondary">{overallProgress}%</p>
        </div>
        <ProgressBar value={overallProgress} accentColor="bg-accent-id" height="md" />
        <p className="text-xs text-text-secondary mt-2">
          {wordStats.words_learned}/{wordStats.total_words} words learned
        </p>
      </Card>

      {/* Scene list */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
          Scenes
        </h2>
        <div className="space-y-2">
          {sceneMastery.map((s, i) => {
            const complete = isSceneComplete(s);
            const progress = sceneProgress(s);
            const status = sceneStatusLabel(s);

            return (
              <Link key={s.id} href={`/learn/${s.id}`} className="block">
                <Card className="!p-3">
                  <div className="flex items-center gap-3">
                    {/* Scene number / checkmark */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      complete
                        ? 'bg-green-500/20 text-green-400'
                        : progress > 0
                        ? 'bg-accent-id/20 text-accent-id'
                        : 'bg-white/10 text-text-secondary'
                    }`}>
                      {complete ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>

                    {/* Scene info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-xs ${complete ? 'text-green-400' : 'text-text-secondary'}`}>
                          {status}
                        </p>
                        {!complete && progress > 0 && (
                          <div className="flex-1 max-w-[80px]">
                            <ProgressBar value={progress} accentColor="bg-accent-id" height="sm" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
