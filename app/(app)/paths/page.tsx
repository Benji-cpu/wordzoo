import { getMockPaths, getMockSceneList } from '@/lib/mocks/learning-data';
import { PathCard } from '@/components/learn/PathCard';
import { TravelPackCard } from '@/components/learn/TravelPackCard';
import { PathsClientSection } from './PathsClientSection';

export default function PathsPage() {
  const allPaths = getMockPaths();
  const scenes = getMockSceneList();

  const premade = allPaths.filter(p => p.path.type === 'premade');
  const travel = allPaths.filter(p => p.path.type === 'travel');
  const custom = allPaths.filter(p => p.path.type === 'custom');

  // For navigation: first scene id
  const firstSceneId = scenes[0]?.id;

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
              />
            ))}
          </div>
        )}
        <PathsClientSection />
      </section>
    </div>
  );
}
