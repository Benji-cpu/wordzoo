'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { isSceneComplete, sceneProgress, sceneStatusLabel } from '@/lib/utils/scene-progress';
import type { SceneMasteryRow } from '@/lib/db/queries';

interface PathJourneyMapProps {
  sceneMastery: SceneMasteryRow[];
  pathId: string;
}

const NODE_SIZE = 48;
const NODE_GAP_Y = 100;
const ZIGZAG_X = 60;
const CENTER_X = 160;

export function PathJourneyMap({ sceneMastery, pathId }: PathJourneyMapProps) {
  const router = useRouter();
  const currentRef = useRef<HTMLDivElement>(null);

  // Find first incomplete scene
  const currentIdx = sceneMastery.findIndex(s => !isSceneComplete(s));
  const activeIdx = currentIdx >= 0 ? currentIdx : sceneMastery.length;

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const totalHeight = (sceneMastery.length - 1) * NODE_GAP_Y + NODE_SIZE;

  function getNodeX(index: number): number {
    return CENTER_X + (index % 2 === 0 ? -ZIGZAG_X : ZIGZAG_X);
  }

  function getNodeY(index: number): number {
    return index * NODE_GAP_Y + NODE_SIZE / 2;
  }

  // Build SVG path connecting all nodes
  function buildConnectorPath(): string {
    if (sceneMastery.length < 2) return '';
    const points = sceneMastery.map((_, i) => ({ x: getNodeX(i), y: getNodeY(i) }));
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  return (
    <div className="relative w-full overflow-visible" style={{ height: totalHeight + 40 }}>
      {/* SVG connector lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 320 ${totalHeight + 40}`}
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <linearGradient id={`path-grad-${pathId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34 197 94)" />
            <stop offset="50%" stopColor="rgb(var(--accent-id-rgb, 99 102 241))" />
            <stop offset="100%" stopColor="rgb(100 100 120)" />
          </linearGradient>
        </defs>
        {/* Background path (muted) */}
        <path
          d={buildConnectorPath()}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Progress path (colored) */}
        {activeIdx > 0 && (
          <path
            d={buildConnectorPath()}
            fill="none"
            stroke="rgb(34 197 94)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(activeIdx / sceneMastery.length) * 100}% 200%`}
          />
        )}
      </svg>

      {/* Scene nodes */}
      {sceneMastery.map((s, i) => {
        const complete = isSceneComplete(s);
        const isCurrent = i === activeIdx;
        const isUnlocked = complete || isCurrent || i === 0;
        const progress = sceneProgress(s);
        const status = sceneStatusLabel(s);
        const nodeX = getNodeX(i);
        const nodeY = getNodeY(i);
        const isLeft = i % 2 === 0;

        return (
          <div
            key={s.id}
            ref={isCurrent ? currentRef : undefined}
            className="absolute flex items-center gap-3"
            style={{
              top: nodeY - NODE_SIZE / 2,
              left: isLeft ? nodeX - NODE_SIZE - 8 : nodeX - NODE_SIZE / 2,
              flexDirection: isLeft ? 'row-reverse' : 'row',
            }}
          >
            {/* Node circle */}
            <button
              onClick={() => isUnlocked && router.push(`/learn/${s.id}`)}
              disabled={!isUnlocked}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                complete
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40'
                  : isCurrent
                  ? 'bg-accent-id/20 text-accent-id border-2 border-accent-id shadow-[0_0_12px_rgba(var(--accent-id-rgb,99,102,241),0.4)] scale-110'
                  : !isUnlocked
                  ? 'bg-surface-inset/50 text-text-secondary/40 border-2 border-card-border/50 opacity-50 cursor-not-allowed'
                  : 'bg-surface-inset text-text-secondary border-2 border-card-border'
              }`}
            >
              {complete ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : !isUnlocked ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : (
                i + 1
              )}
            </button>

            {/* Label */}
            <div className={`min-w-0 max-w-[140px] ${isLeft ? 'text-right' : 'text-left'}`}>
              <p className={`text-sm font-medium truncate ${
                complete ? 'text-green-400' : isCurrent ? 'text-foreground' : !isUnlocked ? 'text-text-secondary/40' : 'text-text-secondary'
              }`}>
                {s.title}
              </p>
              {complete && (
                <p className="text-xs text-green-400/70">{s.mastered_words}/{s.total_words} words</p>
              )}
              {isCurrent && (
                <div className="mt-1">
                  <p className="text-xs text-accent-id mb-0.5">{status}</p>
                  <div className="max-w-[100px]">
                    <ProgressBar value={progress} accentColor="bg-accent-id" height="sm" />
                  </div>
                </div>
              )}
              {!complete && !isCurrent && isUnlocked && (
                <p className="text-xs text-text-tertiary">{status}</p>
              )}
              {!isUnlocked && (
                <p className="text-xs text-text-secondary/40">Locked</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
