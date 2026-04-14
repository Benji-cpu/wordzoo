'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { AdminPathHealth } from '@/lib/db/admin-queries';

interface AdminContentClientProps {
  pathHealth: AdminPathHealth[];
}

export function AdminContentClient({ pathHealth }: AdminContentClientProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Content Health</h1>

      <div className="space-y-3">
        {pathHealth.map(path => {
          const hasGaps = path.scenes_without_dialogues > 0 || path.words_without_mnemonics > 0;
          return (
            <Card key={path.id} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground truncate">{path.title}</h3>
                    <Badge variant="default">{path.type}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{path.language_name}</p>
                  <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                    <span>{path.scene_count} scenes</span>
                    <span>{path.word_count} words</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {hasGaps ? (
                    <div className="w-3 h-3 rounded-full bg-amber-400" title="Has content gaps" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-green-400" title="Complete" />
                  )}
                </div>
              </div>
              {hasGaps && (
                <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-2">
                  {path.scenes_without_dialogues > 0 && (
                    <span className="text-xs text-amber-400">
                      {path.scenes_without_dialogues} scene{path.scenes_without_dialogues > 1 ? 's' : ''} missing dialogues
                    </span>
                  )}
                  {path.words_without_mnemonics > 0 && (
                    <span className="text-xs text-amber-400">
                      {path.words_without_mnemonics} word{path.words_without_mnemonics > 1 ? 's' : ''} missing mnemonics
                    </span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
