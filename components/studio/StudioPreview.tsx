'use client';

import type { StudioPathPreview } from '@/types/database';
import { Badge } from '@/components/ui/Badge';

interface StudioPreviewProps {
  pathPreview: StudioPathPreview | null;
  canGenerate: boolean;
  isGenerating: boolean;
  isPremium: boolean;
  onGenerate: () => void;
}

export function StudioPreview({
  pathPreview,
  canGenerate,
  isGenerating,
  isPremium,
  onGenerate,
}: StudioPreviewProps) {
  if (!pathPreview) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-card-surface border border-card-border flex items-center justify-center mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-secondary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed">
          Your path will appear here as you design it...
        </p>
        <p className="text-text-secondary/60 text-xs mt-2">
          Chat with the AI to get started
        </p>
      </div>
    );
  }

  const difficultyColorMap: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400',
    intermediate: 'bg-amber-500/20 text-amber-400',
    advanced: 'bg-red-500/20 text-red-400',
  };

  const difficultyColor = pathPreview.difficulty
    ? difficultyColorMap[pathPreview.difficulty.toLowerCase()] ?? 'bg-white/10 text-text-secondary'
    : 'bg-white/10 text-text-secondary';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Preview content — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title + meta */}
        <div className="animate-fade-in-up">
          <h2 className="text-lg font-bold text-foreground">
            {pathPreview.title ?? 'Your Custom Path'}
          </h2>
          {pathPreview.description && (
            <p className="text-sm text-text-secondary mt-1 leading-relaxed">
              {pathPreview.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {pathPreview.difficulty && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor}`}
              >
                {pathPreview.difficulty.charAt(0).toUpperCase() + pathPreview.difficulty.slice(1)}
              </span>
            )}
            {pathPreview.estimated_words != null && (
              <Badge variant="default">
                ~{pathPreview.estimated_words} words
              </Badge>
            )}
          </div>
        </div>

        {/* Scene list */}
        {pathPreview.scenes && pathPreview.scenes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Scenes
            </p>
            {pathPreview.scenes.map((scene, i) => (
              <SceneCard key={i} scene={scene} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Generate CTA */}
      <div className="p-4 border-t border-card-border">
        <button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="w-full py-3 px-4 rounded-xl bg-accent-default text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              Generate My Path
              {!isPremium && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                  $2.99
                </span>
              )}
            </>
          )}
        </button>
        {!canGenerate && !isGenerating && (
          <p className="text-xs text-text-secondary text-center mt-2">
            Keep chatting to finalize your path design
          </p>
        )}
      </div>
    </div>
  );
}

// --- Scene card ---

import type { StudioPreviewScene } from '@/types/database';

interface SceneCardProps {
  scene: StudioPreviewScene;
  index: number;
}

function SceneCard({ scene, index }: SceneCardProps) {
  const statusConfig = {
    confirmed: {
      label: 'Ready',
      className: 'bg-green-500/20 text-green-400',
    },
    building: {
      label: 'Building...',
      className: 'bg-amber-500/20 text-amber-400',
    },
    pending: {
      label: 'Pending',
      className: 'bg-white/10 text-text-secondary',
    },
  } as const;

  const config = statusConfig[scene.status];

  return (
    <div
      className="p-3 rounded-xl bg-card-surface border border-card-border animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{scene.title}</p>
          {scene.description && (
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
              {scene.description}
            </p>
          )}
          {scene.word_count != null && (
            <p className="text-xs text-text-secondary mt-1">{scene.word_count} words</p>
          )}
        </div>
        <span
          className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
