/**
 * Pedagogy v2 feature flags.
 *
 * Each "slice" can be toggled independently to dark-launch phases of the
 * vocabulary teaching rebuild. Flags resolve in priority order:
 *
 *   1. URL override: `?p2=1` enables all slices for the request.
 *      `?p2.distractors=1&p2.production=0` toggles individual slices.
 *   2. Admin-email allowlist (Benji's accounts) — every slice enabled.
 *   3. Env-var rollout: `PEDAGOGY_V2_SLICES=distractors,production` enables
 *      those slices for everyone.
 *   4. Default: every slice off.
 */

export type PedagogySlice =
  | 'distractors'   // Phase 1: smart distractors + reveal-mask delay
  | 'production'    // Phase 2: typing exercise + Leitner re-queue
  | 'mastery'       // Phase 3: mastery_stage column + intro-time daily limit
  | 'restructure'   // Phase 4: introduce-batch / drill-block / checkpoint
  | 'cloze'         // Phase 5: cloze, pattern, listening drill, confidence
  | 'tutor';        // Phase 6: no-reveal tutor + SRS auto-apply

export type PedagogyFlags = Record<PedagogySlice, boolean>;

const ALL_SLICES: readonly PedagogySlice[] = [
  'distractors',
  'production',
  'mastery',
  'restructure',
  'cloze',
  'tutor',
];

const OFF: PedagogyFlags = {
  distractors: false,
  production: false,
  mastery: false,
  restructure: false,
  cloze: false,
  tutor: false,
};

const ON: PedagogyFlags = {
  distractors: true,
  production: true,
  mastery: true,
  restructure: true,
  cloze: true,
  tutor: true,
};

interface ResolveContext {
  /** URL search params or a plain record. */
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined> | null;
  /** Signed-in user's email (lowercased internally). */
  userEmail?: string | null;
}

function envSlices(): PedagogyFlags {
  const raw = process.env.PEDAGOGY_V2_SLICES?.trim();
  if (!raw) return { ...OFF };
  if (raw === '*' || raw === 'all') return { ...ON };
  const enabled = new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
  const out = { ...OFF };
  for (const slice of ALL_SLICES) {
    if (enabled.has(slice)) out[slice] = true;
  }
  return out;
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getParam(
  params: ResolveContext['searchParams'],
  key: string,
): string | null {
  if (!params) return null;
  if (params instanceof URLSearchParams) return params.get(key);
  const v = (params as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function urlOverride(params: ResolveContext['searchParams']): Partial<PedagogyFlags> | null {
  if (!params) return null;
  const all = getParam(params, 'p2');
  if (all === '1' || all === 'true') return { ...ON };
  if (all === '0' || all === 'false') return { ...OFF };

  const out: Partial<PedagogyFlags> = {};
  let touched = false;
  for (const slice of ALL_SLICES) {
    const v = getParam(params, `p2.${slice}`);
    if (v === '1' || v === 'true') {
      out[slice] = true;
      touched = true;
    } else if (v === '0' || v === 'false') {
      out[slice] = false;
      touched = true;
    }
  }
  return touched ? out : null;
}

export function resolvePedagogyFlags(ctx: ResolveContext = {}): PedagogyFlags {
  const baseline = envSlices();

  if (ctx.userEmail) {
    const admins = adminEmails();
    if (admins.has(ctx.userEmail.trim().toLowerCase())) {
      Object.assign(baseline, ON);
    }
  }

  const override = urlOverride(ctx.searchParams);
  if (override) Object.assign(baseline, override);

  return baseline;
}

export function isSliceEnabled(flags: PedagogyFlags, slice: PedagogySlice): boolean {
  return flags[slice] === true;
}

export function anyEnabled(flags: PedagogyFlags): boolean {
  return ALL_SLICES.some((s) => flags[s]);
}
