import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { CanDoInventory } from '@/lib/db/can-do-queries';

/**
 * The capability headline: what the learner can actually do, not how many
 * words they've seen.
 *
 * Every other number on this dashboard is throughput — XP, streak days, words
 * mastered (which is just "SRS interval >= 30d"). This one only moves when a
 * learner passed an unaided production test at least 48h after the lesson, so
 * it's the only figure here that a learner could repeat in a warung.
 */
export function CanDoInventoryCard({
  inventory,
  languageName,
}: {
  inventory: CanDoInventory;
  languageName: string;
}) {
  const { certified, due_now, unlocked, recent } = inventory;

  return (
    <Card className="mb-3">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[color:var(--text-secondary)]">
          What you can do
        </div>
        {unlocked > 0 && due_now === 0 && (
          <span className="text-[11px] text-[color:var(--text-secondary)]">
            {unlocked} waiting
          </span>
        )}
      </div>

      <p className="text-[15px] font-bold leading-snug">
        You can do <span className="text-[color:var(--accent-indonesian)]">{certified}</span>{' '}
        {certified === 1 ? 'thing' : 'things'} in {languageName}
      </p>

      {recent.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {recent.map((r) => (
            <li
              key={r.statement_en}
              className="text-[12.5px] text-[color:var(--text-secondary)] leading-snug"
            >
              · {r.statement_en}
            </li>
          ))}
        </ul>
      )}

      {certified === 0 && due_now === 0 && (
        <p className="mt-1.5 text-[12px] text-[color:var(--text-secondary)]">
          Finish a scene and we&apos;ll test you on it in two days — no hints.
        </p>
      )}

      {due_now > 0 && (
        <Link
          href="/review"
          className="mt-3 flex items-center justify-between rounded-xl bg-amber-100 dark:bg-amber-500/15 px-3 py-2"
        >
          <span className="text-[13px] font-bold text-amber-800 dark:text-amber-300">
            {due_now} ready to certify
          </span>
          <span className="text-[13px] font-bold text-amber-800 dark:text-amber-300">→</span>
        </Link>
      )}
    </Card>
  );
}
