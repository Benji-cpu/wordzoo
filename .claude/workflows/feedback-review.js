export const meta = {
  name: 'feedback-review',
  description: 'Cluster all app_feedback, cross-reference each theme against the current codebase, adversarially verify, and synthesize a prioritized action register',
  whenToUse: 'Run to extensively review WordZoo in-app feedback and find what is still unaddressed. Pass args { dataPath } pointing at a JSON file of feedback rows (default /tmp/wordzoo-feedback.json); the cluster agent reads it directly.',
  phases: [
    { title: 'Cluster', detail: 'group all feedback into themes' },
    { title: 'Triage', detail: 'classify each theme vs current code + adversarial verify' },
    { title: 'Synthesize', detail: 'prioritized action register' },
  ],
};

const CLUSTER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    clusters: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          theme: { type: 'string', description: 'Short theme name' },
          summary: { type: 'string', description: 'What users are reporting in this theme' },
          itemIds: { type: 'array', items: { type: 'string' } },
          count: { type: 'number' },
          representativeQuotes: { type: 'array', items: { type: 'string' } },
        },
        required: ['theme', 'summary', 'itemIds', 'count', 'representativeQuotes'],
      },
    },
  },
  required: ['clusters'],
};

const TRIAGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    theme: { type: 'string' },
    status: { type: 'string', enum: ['fixed', 'partial', 'unfixed', 'blocked', 'wontfix'] },
    evidence: { type: 'string', description: 'File paths + what the current code does, justifying the status' },
    recommendation: { type: 'string', description: 'Concrete next action if not fully fixed' },
    severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
  },
  required: ['theme', 'status', 'evidence', 'recommendation', 'severity'],
};

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    agree: { type: 'boolean' },
    correctedStatus: { type: 'string', enum: ['fixed', 'partial', 'unfixed', 'blocked', 'wontfix'] },
    note: { type: 'string' },
  },
  required: ['agree', 'correctedStatus', 'note'],
};

const dataPath = (args && args.dataPath) || '/tmp/wordzoo-feedback.json';
log(`Reviewing WordZoo feedback from ${dataPath}.`);

// ── Phase 1: Cluster ──
phase('Cluster');
const clusterResult = await agent(
  `You are triaging in-app user feedback for WordZoo (a language-learning app). ` +
  `Read the feedback yourself by running: cat ${dataPath}\n` +
  `It is a JSON array of items {id,status,page,url,domain,date,message} (status one of new|reviewed|actioned|dismissed). ` +
  `Group ALL items into coherent THEMES (e.g. "mobile layout / continue button", "review SRS count", "audio missing", "conversational pedagogy", "tutor text bug"). ` +
  `For each theme give a summary, the list of item ids, a count, and 1-3 representative verbatim quotes. Aim for 6-12 themes.`,
  { schema: CLUSTER_SCHEMA, phase: 'Cluster', label: 'cluster-feedback' },
);
const clusters = clusterResult?.clusters ?? [];
log(`Identified ${clusters.length} themes.`);

// ── Phase 2: Triage each theme against the current codebase, then verify ──
const triaged = await pipeline(
  clusters,
  (cluster) =>
    agent(
      `You are auditing whether a cluster of WordZoo user feedback is addressed in the CURRENT codebase ` +
      `(working dir is the repo root). Read the relevant source files to decide.\n\n` +
      `Theme: ${cluster.theme}\nSummary: ${cluster.summary}\n` +
      `Representative quotes:\n- ${(cluster.representativeQuotes || []).join('\n- ')}\n\n` +
      `Classify status: fixed | partial | unfixed | blocked | wontfix. ` +
      `Cite specific files/functions as evidence (e.g. components/learn/PhraseQuiz.tsx, lib/db/queries.ts getUserDueWords). ` +
      `If not fully fixed, give a concrete recommendation and a severity (P0 critical … P3 minor). Be precise and skeptical.`,
      { schema: TRIAGE_SCHEMA, phase: 'Triage', label: `triage:${cluster.theme}`.slice(0, 60) },
    ),
  (triage, cluster) =>
    agent(
      `Adversarially verify this feedback-triage claim for WordZoo. Re-check the code yourself; default to disagreement if the evidence is thin or the files don't say what's claimed.\n\n` +
      `Theme: ${cluster.theme}\nClaimed status: ${triage.status}\nClaimed evidence: ${triage.evidence}\n\n` +
      `Return whether you agree, the status YOU believe is correct after checking the code, and a one-line note.`,
      { schema: VERDICT_SCHEMA, phase: 'Triage', label: `verify:${cluster.theme}`.slice(0, 60) },
    ).then((verdict) => ({ ...triage, cluster, verdict })),
);

const results = triaged.filter(Boolean).map((r) => ({
  theme: r.theme,
  status: r.verdict?.agree ? r.status : (r.verdict?.correctedStatus ?? r.status),
  severity: r.severity,
  evidence: r.evidence,
  recommendation: r.recommendation,
  verifierNote: r.verdict?.note ?? '',
  count: r.cluster?.count ?? 0,
}));

// ── Phase 3: Synthesize the action register ──
phase('Synthesize');
const register = await agent(
  `Write a concise markdown "Feedback Review — Action Register" for WordZoo from this verified triage data. ` +
  `Order by severity (P0 first) then by status (unfixed/partial/blocked before fixed). ` +
  `Use a table with columns: Theme | Status | Severity | Count | Evidence | Next action. ` +
  `After the table, add a short "Still needs work" bullet list of every non-fixed theme with its recommendation, ` +
  `and a one-line "Confirmed fixed this session" summary. Data:\n\n${JSON.stringify(results)}`,
  { phase: 'Synthesize', label: 'synthesize-register' },
);

return { clusters: clusters.length, results, register };
