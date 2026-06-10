'use client';

import { useRef } from 'react';
import { currentItem, type DrillQueue } from '@/lib/pedagogy/leitner';

interface DrillProgressHeaderProps {
  queue: DrillQueue;
  cueLabel: string;
}

/**
 * Drill header with mastery progress: "2 of 4 locked in", one dot per batch
 * item (empty → half → full as cue types pass), and a near-done nudge.
 *
 * The Leitner queue re-surfaces wrong answers, which without a stable total
 * reads as an endless loop ("we seem to have hit an era where the learning
 * stopped"). Dots are keyed to the batch's initial item order so re-queues
 * never reshuffle them.
 */
export function DrillProgressHeader({ queue, cueLabel }: DrillProgressHeaderProps) {
  // Capture batch order once — items[] reorders as wrong answers re-queue
  const orderRef = useRef<string[] | null>(null);
  if (orderRef.current === null) {
    orderRef.current = [...queue.items, ...queue.completed].map((it) => it.itemId);
  }

  const byId = new Map(
    [...queue.items, ...queue.completed].map((it) => [it.itemId, it]),
  );
  const completedIds = new Set(queue.completed.map((it) => it.itemId));
  const total = orderRef.current.length;
  const done = orderRef.current.filter((id) => completedIds.has(id)).length;
  const active = currentItem(queue);
  const isLastItem = queue.items.length === 1 && total > 1;

  return (
    <div className="text-center mb-2 space-y-1.5">
      <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)]">
        {done} of {total} locked in · {cueLabel}
      </p>
      <div className="flex items-center justify-center gap-1.5" aria-hidden>
        {orderRef.current.map((id) => {
          const it = byId.get(id);
          const isDone = completedIds.has(id);
          const passed = it ? new Set(it.cueTypesPassed).size : 0;
          const partial = !isDone && passed > 0;
          const isCursor = active?.itemId === id;
          return (
            <span
              key={id}
              className={[
                'inline-block w-2 h-2 rounded-full transition-all duration-300',
                isDone
                  ? 'bg-[color:var(--color-fox-primary,#f59e0b)]'
                  : partial
                    ? 'bg-[color:var(--color-fox-primary,#f59e0b)] opacity-40'
                    : 'border border-[color:var(--text-secondary)] opacity-40',
                isCursor ? 'scale-125 opacity-100' : '',
              ].join(' ')}
            />
          );
        })}
      </div>
      {isLastItem && (
        <p className="text-[11px] font-semibold text-[color:var(--text-secondary)]">
          Last one — get this and the batch is done
        </p>
      )}
    </div>
  );
}
