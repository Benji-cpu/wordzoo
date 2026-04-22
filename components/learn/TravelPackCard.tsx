import { HabitatCard } from '@/components/ui/HabitatCard';
import type { HabitatLanguage } from '@/lib/utils/language-habitat';
import type { Path } from '@/types/database';

interface TravelPackCardProps {
  path: Path;
  wordCount: number;
  language: HabitatLanguage;
}

export function TravelPackCard({ path, wordCount, language }: TravelPackCardProps) {
  return (
    <HabitatCard
      icon="✈️"
      label="Travel pack"
      title={path.title}
      trailing={`${wordCount} words`}
      href={`/paths/${path.id}`}
      language={language}
    />
  );
}
