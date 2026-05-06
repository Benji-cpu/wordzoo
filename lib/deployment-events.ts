import { sql } from "@/lib/db";

const PROJECT_ID = "prj_E7nmv9hKqtpRgpal67kPgfOVz0lz";
const TEAM_ID = "team_x4F7Q3Fuz3eKjGWMK6RR7z2l";
const PROJECT_NAME = "wordzoo";

export const TEAM_OWNER_EMAIL = "profbenjo@gmail.com";

export type DeploymentEvent = {
  id: number;
  vercel_deployment_id: string;
  project_name: string;
  state: string;
  error_code: string | null;
  error_message: string | null;
  commit_sha: string | null;
  commit_author_email: string | null;
  commit_message: string | null;
  build_url: string | null;
  created_at: string;
  ingested_at: string;
};

export type NormalizedFailure = {
  vercel_deployment_id: string;
  state: string;
  error_code: string | null;
  error_message: string | null;
  commit_sha: string | null;
  commit_author_email: string | null;
  commit_message: string | null;
  build_url: string | null;
  created_at: string;
};

type VercelDeployment = {
  uid: string;
  url?: string;
  state?: string;
  readyState?: string;
  created: number;
  errorCode?: string;
  errorMessage?: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorEmail?: string;
    githubCommitAuthorName?: string;
    gitlabCommitAuthorEmail?: string;
    bitbucketCommitAuthorEmail?: string;
  };
  creator?: {
    email?: string;
    username?: string;
  };
};

export async function fetchRecentVercelFailures(
  sinceMs: number
): Promise<NormalizedFailure[]> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN is not set");

  const params = new URLSearchParams({
    projectId: PROJECT_ID,
    teamId: TEAM_ID,
    state: "ERROR,CANCELED",
    since: String(sinceMs),
    limit: "50",
  });
  const url = `https://api.vercel.com/v6/deployments?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel API ${res.status}: ${body.slice(0, 500)}`);
  }
  const json = (await res.json()) as { deployments?: VercelDeployment[] };
  const deployments = json.deployments ?? [];

  return deployments.map((d) => {
    const commitEmail =
      d.meta?.githubCommitAuthorEmail ??
      d.meta?.gitlabCommitAuthorEmail ??
      d.meta?.bitbucketCommitAuthorEmail ??
      d.creator?.email ??
      null;
    return {
      vercel_deployment_id: d.uid,
      state: (d.state ?? d.readyState ?? "UNKNOWN").toUpperCase(),
      error_code: d.errorCode ?? null,
      error_message: d.errorMessage ?? null,
      commit_sha: d.meta?.githubCommitSha ?? null,
      commit_author_email: commitEmail,
      commit_message: d.meta?.githubCommitMessage ?? null,
      build_url: d.url ? `https://${d.url}` : null,
      created_at: new Date(d.created).toISOString(),
    };
  });
}

export async function ingestFailures(
  rows: NormalizedFailure[]
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    const result = (await sql`
      INSERT INTO wordzoo_deployment_events (
        vercel_deployment_id, project_name, state, error_code, error_message,
        commit_sha, commit_author_email, commit_message, build_url, created_at
      ) VALUES (
        ${r.vercel_deployment_id}, ${PROJECT_NAME}, ${r.state}, ${r.error_code}, ${r.error_message},
        ${r.commit_sha}, ${r.commit_author_email}, ${r.commit_message}, ${r.build_url}, ${r.created_at}
      )
      ON CONFLICT (vercel_deployment_id) DO NOTHING
      RETURNING id
    `) as Array<{ id: number }>;
    if (result.length > 0) inserted++;
    else skipped++;
  }
  return { inserted, skipped };
}

export async function recentFailures(days: number): Promise<DeploymentEvent[]> {
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
