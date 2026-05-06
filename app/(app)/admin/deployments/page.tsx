import { sql } from '@/lib/db';
import {
  type DeploymentEvent,
  TEAM_OWNER_EMAIL,
} from '@/lib/deployment-events';

export const dynamic = 'force-dynamic';

async function loadFailures(days: number): Promise<DeploymentEvent[]> {
  return (await sql`
    SELECT id, vercel_deployment_id, project_name, state, error_code, error_message,
           commit_sha, commit_author_email, commit_message, build_url,
           created_at, ingested_at
    FROM wordzoo_deployment_events
    WHERE created_at > now() - (${days} || ' days')::interval
    ORDER BY created_at DESC
    LIMIT 200
  `) as DeploymentEvent[];
}

export default async function AdminDeploymentsPage() {
  const rows = await loadFailures(30);
  const wrongAuthor = rows.filter(
    (r) =>
      r.commit_author_email !== null &&
      r.commit_author_email !== TEAM_OWNER_EMAIL
  );

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">
          Deployment failures
        </h1>
        <p className="text-xs text-text-secondary">
          {rows.length} in last 30 days
          {wrongAuthor.length > 0 && (
            <>
              {' · '}
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {wrongAuthor.length} from non-team author
              </span>
            </>
          )}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border p-4 text-sm text-text-secondary">
          <p className="mb-2">No deployment failures recorded yet.</p>
          <p>
            Trigger an ingest to backfill recent events:
          </p>
          <pre className="mt-2 text-xs bg-surface-inset rounded p-2 overflow-x-auto">
{`curl -X POST -H "Content-Type: application/json" \\
  --cookie "authjs.session-token=…" \\
  https://wordzoo.vercel.app/api/admin/deployments \\
  -d '{"action":"ingest","sinceHours":720}'`}
          </pre>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <DeploymentRow key={r.id} row={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DeploymentRow({ row }: { row: DeploymentEvent }) {
  const isWrongAuthor =
    row.commit_author_email !== null &&
    row.commit_author_email !== TEAM_OWNER_EMAIL;

  return (
    <li className="py-4 grid gap-2">
      <div className="flex flex-wrap items-baseline gap-3 text-xs text-text-secondary">
        <span className="font-mono">
          {new Date(row.created_at).toLocaleString()}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-medium ${
            row.state === 'ERROR'
              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              : 'bg-surface-inset text-text-secondary'
          }`}
        >
          {row.state}
        </span>
        {row.error_code && (
          <span className="font-mono text-[11px]">{row.error_code}</span>
        )}
        {row.build_url && (
          <a
            href={row.build_url}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            build
          </a>
        )}
      </div>

      {row.error_message && (
        <p className="text-sm whitespace-pre-wrap text-red-700 dark:text-red-400">
          {row.error_message}
        </p>
      )}

      {row.commit_message && (
        <p className="text-sm whitespace-pre-wrap">{row.commit_message}</p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
        {row.commit_sha && (
          <span className="font-mono">{row.commit_sha.slice(0, 7)}</span>
        )}
        {row.commit_author_email && (
          <span
            className={
              isWrongAuthor
                ? 'text-amber-600 dark:text-amber-400 font-medium'
                : ''
            }
          >
            {row.commit_author_email}
            {isWrongAuthor && ' ⚠ not on team'}
          </span>
        )}
      </div>
    </li>
  );
}
