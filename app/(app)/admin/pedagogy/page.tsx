import { auth } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { resolvePedagogyFlags } from '@/lib/pedagogy/flags';
import {
  getCueAccuracy,
  getCheckpointStats,
  getWordAccuracyDistribution,
  getWeakestWords,
  getRetentionCurve,
  getOverdueQueue,
  getEventVolume,
  getLearnerTotals,
  getLeechWords,
} from '@/lib/db/pedagogy-queries';

export const dynamic = 'force-dynamic';

/**
 * The measurement surface. Two data sources with very different trust levels:
 *
 *   user_words          — dense, always written, trustworthy.
 *   pedagogy_events     — sparse; only fires from components behind pedagogy v2
 *                         slices, so coverage depends on PEDAGOGY_V2_SLICES.
 *
 * Hence the signal-coverage strip at the top. A page full of confident-looking
 * percentages computed over eleven rows is worse than no page, so every
 * event-derived section states its sample size and the flag state is rendered
 * literally rather than assumed.
 */
export default async function AdminPedagogyPage() {
  const session = await auth();
  const flags = resolvePedagogyFlags({ userEmail: session?.user?.email });

  const [
    totals,
    cueAccuracy,
    checkpoints,
    accuracyDist,
    weakest,
    retention,
    overdue,
    eventVolume,
    leeches,
  ] = await Promise.all([
    getLearnerTotals(),
    getCueAccuracy(365),
    getCheckpointStats(365),
    getWordAccuracyDistribution(),
    getWeakestWords(20),
    getRetentionCurve(365),
    getOverdueQueue(),
    getEventVolume(365),
    getLeechWords(20),
  ]);

  const eventTotal = eventVolume.reduce((s, e) => s + e.n, 0);
  const cueTotal = cueAccuracy.reduce((s, c) => s + c.attempts, 0);
  const cueCorrect = cueAccuracy.reduce((s, c) => s + c.correct, 0);
  const overallAccuracy = cueTotal > 0 ? Math.round((1000 * cueCorrect) / cueTotal) / 10 : 0;
  const activeSlices = Object.entries(flags).filter(([, on]) => on).map(([k]) => k);
  const totalOverdue = totals.overdue_words + totals.overdue_phrases;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pedagogy</h1>
        <p className="text-xs text-text-secondary mt-1">
          Does WordZoo actually teach? Everything below reads data the app was
          already collecting and never looked at.
        </p>
      </div>

      {/* ---- Signal coverage: the honesty strip ---- */}
      <section>
        <SectionHeading>Signal coverage</SectionHeading>
        <Card variant="inset" size="compact">
          <p className="text-xs text-text-secondary mb-2">
            {eventTotal.toLocaleString()} telemetry events across{' '}
            {eventVolume.length} event types.{' '}
            <span className="font-medium text-foreground">
              Slices on for you: {activeSlices.length > 0 ? activeSlices.join(', ') : 'none'}
            </span>
            {!process.env.PEDAGOGY_V2_SLICES && (
              <>
                {' · '}
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  PEDAGOGY_V2_SLICES is unset, so non-admins emit nothing — treat
                  every event-derived number below as an admin-only sample.
                </span>
              </>
            )}
          </p>
          {eventVolume.length === 0 ? (
            <p className="text-sm text-text-secondary">No events recorded.</p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {eventVolume.map((e) => (
                <li key={e.event} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="font-mono truncate">{e.event}</span>
                  <span className="text-text-secondary shrink-0">
                    {e.n} · {e.last_seen ? e.last_seen.slice(0, 10) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ---- Headline ---- */}
      <section>
        <SectionHeading>Headline</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Learners" value={totals.learners} />
          <StatCard label="Items reviewed" value={totals.words_reviewed} />
          <StatCard label="Mean item accuracy" value={`${totals.mean_accuracy_pct}%`} />
          <StatCard label="Drill accuracy" value={cueTotal > 0 ? `${overallAccuracy}%` : '—'} />
          <StatCard label="Overdue" value={totalOverdue} tone={totalOverdue > 50 ? 'warn' : 'default'} />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          &ldquo;Mean item accuracy&rdquo; is lifetime <code>times_correct/times_reviewed</code>{' '}
          over items with ≥3 reviews ({totals.words_tracked} tracked).
          &ldquo;Drill accuracy&rdquo; is the event stream ({cueTotal} attempts) — if the
          two diverge sharply, the drills are easier than the review queue.
        </p>
      </section>

      {/* ---- Retention: the number that decides whether any of this works ---- */}
      <section>
        <SectionHeading>Retention by interval</SectionHeading>
        {retention.length === 0 ? (
          <Card variant="inset" size="compact">
            <p className="text-sm text-text-secondary">
              No data yet. This chart reads the{' '}
              <code className="font-mono">srs_review_recorded</code> event, which
              starts emitting from the next review anyone completes. It is the
              only view that answers &ldquo;of the words that came due after N
              days, how many were remembered?&rdquo; — come back in a week.
            </p>
          </Card>
        ) : (
          <BarList
            rows={retention.map((r) => ({
              label: r.interval_bucket,
              pct: r.retention_pct,
              detail: `${r.correct}/${r.reviews}`,
              tone: r.retention_pct < 80 ? 'warn' : 'good',
            }))}
          />
        )}
      </section>

      {/* ---- Accuracy by cue ---- */}
      <section>
        <SectionHeading>Accuracy by cue type</SectionHeading>
        {cueAccuracy.length === 0 ? (
          <EmptyNote>No drill events recorded.</EmptyNote>
        ) : (
          <>
            <BarList
              rows={cueAccuracy.map((c) => ({
                label: c.cue_type,
                pct: c.accuracy_pct,
                detail: `${c.correct}/${c.attempts} · ${c.first_try} first-try`,
                tone: c.accuracy_pct >= 95 ? 'warn' : 'good',
              }))}
            />
            <p className="text-xs text-text-secondary mt-2">
              Amber marks ≥95%. A cue nobody ever fails is not measuring
              retrieval — it is measuring whether the answer was still on screen.
            </p>
          </>
        )}
      </section>

      {/* ---- Checkpoints ---- */}
      <section>
        <SectionHeading>Checkpoints</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Started" value={checkpoints.started} />
          <StatCard label="Passed" value={checkpoints.passed} />
          <StatCard
            label="Failed"
            value={checkpoints.failed}
            tone={checkpoints.started > 0 && checkpoints.failed === 0 ? 'warn' : 'default'}
          />
          <StatCard label="Avg remediation loops" value={checkpoints.avg_remediation_loops} />
        </div>
        {checkpoints.started > 0 && checkpoints.failed === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Zero failures. Checkpoints return <code>passed: true</code> once
            remediation is exhausted, so a 100% pass rate is the expected output
            of the current design rather than evidence of mastery.
          </p>
        )}
      </section>

      {/* ---- Item accuracy distribution ---- */}
      <section>
        <SectionHeading>Item accuracy distribution</SectionHeading>
        {accuracyDist.length === 0 ? (
          <EmptyNote>No items with ≥3 reviews yet.</EmptyNote>
        ) : (
          <BarList
            rows={(() => {
              const max = Math.max(...accuracyDist.map((d) => d.word_count), 1);
              return accuracyDist.map((d) => ({
                label: d.bucket,
                pct: (d.word_count / max) * 100,
                detail: `${d.word_count} items`,
                tone: d.bucket === '0-49%' ? 'warn' : 'good',
              }));
            })()}
          />
        )}
      </section>

      {/* ---- Overdue queue ---- */}
      <section>
        <SectionHeading>Overdue queue</SectionHeading>
        {overdue.length === 0 ? (
          <EmptyNote>Nothing overdue.</EmptyNote>
        ) : (
          <BarList
            rows={(() => {
              const max = Math.max(...overdue.map((o) => o.words + o.phrases), 1);
              return overdue.map((o) => ({
                label: o.bucket,
                pct: ((o.words + o.phrases) / max) * 100,
                detail: `${o.words} words · ${o.phrases} phrases`,
                tone: o.bucket === '8d+ late' ? 'warn' : 'good',
              }));
            })()}
          />
        )}
      </section>

      {/* ---- Leeches ---- */}
      <section>
        <SectionHeading>Leeches</SectionHeading>
        <p className="text-xs text-text-secondary mb-2">
          Items the scheduler is capping at 21 days — forgotten 6+ times{' '}
          <em>after</em> graduating. Lifetime accuracy used to be the criterion,
          but it never fired: it needed 8 reviews and almost nothing reaches
          that. Lapses count the thing that matters — failing a word you had
          already learned. They are surfaced rather than suspended on purpose:
          burying a hard word is how a learner ends up with a queue they
          can&apos;t clear and no idea why. A leech that recurs across learners
          is a content bug, not a learner problem.
        </p>
        {leeches.length === 0 ? (
          <EmptyNote>
            No leeches — nothing has been forgotten 6+ times after graduating.
          </EmptyNote>
        ) : (
          <ul className="divide-y divide-border">
            {leeches.map((w) => (
              <li key={w.word_id} className="py-2 flex items-baseline justify-between gap-3">
                <span className="text-sm">
                  <span className="font-medium">{w.text}</span>
                  <span className="text-text-secondary"> — {w.meaning_en}</span>
                  <span className="text-text-secondary text-xs font-mono ml-2">{w.language_code}</span>
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0 tabular-nums">
                  {w.lapses} lapses · {w.accuracy_pct}% · {w.times_correct}/{w.times_reviewed} · EF{' '}
                  {w.ease_factor}
                  {w.learners > 1 && ` · ${w.learners} learners`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Weakest content ---- */}
      <section>
        <SectionHeading>Weakest items</SectionHeading>
        <p className="text-xs text-text-secondary mb-2">
          Aggregated across users. One learner failing a word is a learner
          problem; everyone failing it is a content problem — a bad mnemonic, a
          misleading gloss, or a distractor that is actually correct.
        </p>
        {weakest.length === 0 ? (
          <EmptyNote>Not enough review history yet.</EmptyNote>
        ) : (
          <ul className="divide-y divide-border">
            {weakest.map((w) => (
              <li key={w.word_id} className="py-2 flex items-baseline justify-between gap-3">
                <span className="text-sm">
                  <span className="font-medium">{w.text}</span>
                  <span className="text-text-secondary"> — {w.meaning_en}</span>
                  <span className="text-text-secondary text-xs font-mono ml-2">{w.language_code}</span>
                </span>
                <span className="text-xs text-text-secondary shrink-0 tabular-nums">
                  {w.accuracy_pct}% · {w.times_correct}/{w.times_reviewed}
                  {w.learners > 1 && ` · ${w.learners} learners`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-2">
      {children}
    </h2>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <Card variant="inset" size="compact">
      <p className="text-sm text-text-secondary">{children}</p>
    </Card>
  );
}

function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'warn';
}) {
  return (
    <Card className="!p-3 text-center">
      <p
        className={`text-2xl font-bold ${
          tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </Card>
  );
}

/**
 * Hand-rolled bars, matching components/learn/ProgressChart.tsx. There is no
 * charting library in this project and adding one for an admin page would be
 * the wrong trade.
 */
function BarList({
  rows,
}: {
  rows: { label: string; pct: number; detail: string; tone?: 'good' | 'warn' }[];
}) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3">
          <span className="text-xs font-mono truncate">{r.label}</span>
          <div className="h-2.5 rounded-full bg-surface-inset overflow-hidden">
            <div
              className={`h-full rounded-full ${
                r.tone === 'warn' ? 'bg-amber-400' : 'bg-green-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, r.pct))}%` }}
            />
          </div>
          <span className="text-xs text-text-secondary tabular-nums shrink-0">{r.detail}</span>
        </div>
      ))}
    </div>
  );
}
