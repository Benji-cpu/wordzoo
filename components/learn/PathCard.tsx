import { HabitatCard } from '@/components/ui/HabitatCard';
import type { HabitatLanguage } from '@/lib/utils/language-habitat';
import { displayPathTitle } from '@/lib/utils/path-display';
import type { Path } from '@/types/database';

interface PathCardProps {
  path: Path;
  wordCount: number;
  wordsCompleted: number;
  /** 0–100 integer percent (kept as percent for back-compat with callers). */
  progress: number;
  scenesCompleted?: number;
  totalScenes?: number;
  nextSceneId?: string | null;
  language: HabitatLanguage;
}

function iconForType(type: Path['type']): string {
  switch (type) {
    case 'travel':
      return '✈️';
    case 'studio':
      return '🎬';
    case 'custom':
      return '✦';
    case 'premade':
    default:
      return '📚';
  }
}

function labelForPath(path: Path): string {
  switch (path.type) {
    case 'travel':
      return 'Travel pack';
    case 'studio':
      return 'Studio path';
    case 'custom':
      return 'Custom path';
    case 'premade':
    default:
      return 'Path';
  }
}

export function PathCard({
  path,
  wordCount,
  wordsCompleted,
  progress,
  scenesCompleted,
  totalScenes,
  nextSceneId,
  language,
}: PathCardProps) {
  const trailing =
    totalScenes != null && scenesCompleted != null
      ? `${scenesCompleted}/${totalScenes} scenes`
      : `${wordsCompleted}/${wordCount} words`;

  // Tap anywhere on the card → continue into the next scene when we have one;
  // otherwise fall back to the path detail page.
  const href = nextSceneId && progress < 100 ? `/learn/${nextSceneId}` : `/paths/${path.id}`;

  return (
    <HabitatCard
      icon={iconForType(path.type)}
      label={labelForPath(path)}
      title={displayPathTitle(path.title)}
      progress={progress / 100}
      trailing={trailing}
      href={href}
      language={language}
    />
  );
}
