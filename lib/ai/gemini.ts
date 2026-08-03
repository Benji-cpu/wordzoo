import { GoogleGenAI } from '@google/genai';
import type { GeminiTextOptions, GeminiChatMessage, GeminiTextResponse } from '@/types/ai';

function getClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Model chain. Every AI feature in the app funnels through this file, so a
 * single unavailable model takes down the tutor, mnemonics, path generation,
 * grading and session evaluation at once.
 *
 * That is not hypothetical: on 2026-08-03 the tutor returned "Failed to send
 * message" mid-conversation because the Gemini key had exhausted its free-tier
 * quota for gemini-2.5-flash (429, `generate_content_free_tier_requests`,
 * limit 20). The greeting had already succeeded, so the session was live with
 * no way to continue. There was no retry and no fallback — one 429 was fatal.
 *
 * FALLBACK_MODEL is a separate quota pool, so it survives primary exhaustion.
 * It is weaker than the primary, which is why it is only ever reached after
 * the primary has actually failed.
 */
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

/**
 * Every call below carries an abort signal. Without one a hung Gemini request
 * blocks forever, and on the 300s routes (paths/travel, paths/custom,
 * studio/generate) that means a single stalled call burns the entire lambda
 * budget. 30s covers normal completions; the long-form path/mnemonic
 * generations pass a larger timeout explicitly.
 *
 * A fresh signal is built per attempt — AbortSignal.timeout() starts counting
 * at construction, so a reused signal would give retry #2 no time at all.
 */
const DEFAULT_TIMEOUT_MS = 30_000;
const LONG_TIMEOUT_MS = 60_000;

/** Attempts per model before failing over to the next one in the chain. */
const ATTEMPTS_PER_MODEL = 2;
/**
 * How long we're willing to stall a user-facing request waiting out a quota
 * window. Gemini's 429s often ask for 4s+, and the free-tier daily cap asks for
 * ~40s — waiting that out is worse than answering with the fallback model.
 */
const MAX_INLINE_RETRY_MS = 2_000;

export type AiFailureReason = 'quota' | 'timeout' | 'upstream' | 'empty' | 'request';

/**
 * A model call that failed in a way the caller can act on. Routes map `.status`
 * straight to the HTTP response and `.message` is safe to show a user — it
 * never contains the raw upstream error (which leaks quota/project details).
 */
export class AiUnavailableError extends Error {
  readonly reason: AiFailureReason;
  readonly status: number;
  readonly retryable: boolean;

  constructor(reason: AiFailureReason, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AiUnavailableError';
    this.reason = reason;
    // 503 (not 500) for capacity problems: it tells the client "try again",
    // and keeps genuine bugs distinguishable in logs.
    this.status = reason === 'request' ? 502 : reason === 'quota' ? 503 : 503;
    this.retryable = reason !== 'request';
  }
}

export function isAiUnavailable(err: unknown): err is AiUnavailableError {
  return err instanceof AiUnavailableError;
}

interface Classified {
  retryable: boolean;
  reason: AiFailureReason;
  retryAfterMs: number | null;
  status: number | null;
}

/** Pull Gemini's own backoff hint out of the error. The SDK nests an escaped
 *  JSON blob inside `message`, so unescape before matching. */
function parseRetryDelay(raw: string): number | null {
  const m =
    raw.match(/retryDelay"?\s*:\s*"?([\d.]+)s/i) ??
    raw.match(/retry in ([\d.]+)\s*s/i);
  if (!m) return null;
  const ms = Math.ceil(parseFloat(m[1]) * 1000);
  return Number.isFinite(ms) ? ms : null;
}

function classify(err: unknown): Classified {
  const e = err as { status?: number; name?: string; message?: string } | undefined;
  const name = e?.name ?? '';

  // AbortSignal.timeout() fires TimeoutError; a caller-cancelled request aborts.
  if (name === 'TimeoutError' || name === 'AbortError') {
    return { retryable: true, reason: 'timeout', retryAfterMs: 0, status: null };
  }

  const raw = String(e?.message ?? '').replace(/\\/g, '');
  const status =
    typeof e?.status === 'number'
      ? e.status
      : Number(raw.match(/"code"\s*:\s*(\d+)/)?.[1] ?? NaN);
  const retryAfterMs = parseRetryDelay(raw);

  if (status === 429) return { retryable: true, reason: 'quota', retryAfterMs, status };
  if (status >= 500 && status <= 599) {
    return { retryable: true, reason: 'upstream', retryAfterMs, status };
  }
  if (Number.isNaN(status)) {
    // Network-level failure (DNS, socket reset) — worth one more try.
    return { retryable: true, reason: 'upstream', retryAfterMs: null, status: null };
  }
  // 400/401/403/404 are our bug or our key — retrying changes nothing.
  return { retryable: false, reason: 'request', retryAfterMs: null, status };
}

function toPublicError(c: Classified, cause: unknown): AiUnavailableError {
  const message =
    c.reason === 'quota'
      ? 'The AI tutor is at capacity right now. Please try again in a moment.'
      : c.reason === 'timeout'
        ? 'The AI took too long to respond. Please try again.'
        : c.reason === 'request'
          // Our misconfiguration, not the learner's — retrying won't help, so
          // don't imply it will.
          ? "The tutor isn't available right now. This one's on us — please send feedback if it persists."
          : 'The AI service is temporarily unavailable. Please try again.';
  return new AiUnavailableError(c.reason, message, { cause });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `op` against the model chain: retry briefly on the same model for blips,
 * fail over to the next model when the quota window won't reopen in time.
 *
 * `op` must be the *whole* upstream call including config construction, so each
 * attempt gets a fresh abort signal.
 */
async function runWithFallback<T>(
  op: (model: string) => Promise<T>,
  label: string,
  preferredModel?: string,
): Promise<T> {
  const first = preferredModel ?? PRIMARY_MODEL;
  const chain = first === FALLBACK_MODEL ? [first] : [first, FALLBACK_MODEL];

  let last: Classified = { retryable: true, reason: 'upstream', retryAfterMs: null, status: null };

  for (const model of chain) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        return await op(model);
      } catch (err) {
        const c = classify(err);
        last = c;
        console.error(
          `[ai] ${label} failed — model=${model} attempt=${attempt}/${ATTEMPTS_PER_MODEL} ` +
            `reason=${c.reason} status=${c.status ?? 'n/a'} retryAfterMs=${c.retryAfterMs ?? 'n/a'}`,
        );
        if (!c.retryable) throw toPublicError(c, err);

        const wait = c.retryAfterMs ?? attempt * 400;
        // Out of attempts, or the backoff is longer than we're willing to make
        // the user wait → move to the next model in the chain.
        if (attempt === ATTEMPTS_PER_MODEL || wait > MAX_INLINE_RETRY_MS) break;
        await sleep(wait);
      }
    }
  }

  console.error(`[ai] ${label} exhausted the model chain (${chain.join(' -> ')})`);
  throw toPublicError(last, undefined);
}

/** Turn a truncated or non-JSON model reply into a clear error. */
function parseModelJson<T>(raw: string | undefined): T {
  try {
    return JSON.parse(raw ?? '{}') as T;
  } catch {
    throw new Error(
      'Failed to parse AI response as JSON. The model returned malformed output.'
    );
  }
}

/**
 * gemini-2.5-flash is a thinking model with a dynamic budget, and thinking
 * tokens are drawn from maxOutputTokens. On a tight budget the model can spend
 * the whole allowance reasoning and return an EMPTY body with
 * finishReason=MAX_TOKENS. For conversational turns that reasoning buys
 * nothing, so we switch it off — it also makes replies land faster.
 */
const NO_THINKING = { thinkingBudget: 0 } as const;

/**
 * An empty completion is a failure, not a valid answer — saving it produces a
 * blank tutor bubble or (via parseModelJson('{}')) a silently empty object.
 * Reported as retryable so the runner fails over, where a different model or a
 * fresh attempt usually returns real text.
 */
function requireText(text: string | undefined, model: string, label: string): string {
  const out = text ?? '';
  if (out.trim() === '') {
    console.error(`[ai] ${label} returned an empty completion — model=${model}`);
    const err = new Error('Empty completion') as Error & { status?: number };
    err.status = 503;
    throw err;
  }
  return out;
}

export async function generateText(
  prompt: string,
  options: GeminiTextOptions = {}
): Promise<GeminiTextResponse> {
  const ai = getClient();

  return runWithFallback(
    async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 1024,
          ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
          abortSignal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
        },
      });

      return {
        text: requireText(response.text, model, 'generateText'),
        tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
      };
    },
    'generateText',
    options.model,
  );
}

function toContents(messages: GeminiChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'model' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
}

export async function generateChat(
  messages: GeminiChatMessage[],
  systemPrompt: string
): Promise<GeminiTextResponse> {
  const ai = getClient();
  const contents = toContents(messages);

  return runWithFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 1024,
        thinkingConfig: NO_THINKING,
        abortSignal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      },
    });

    return {
      text: requireText(response.text, model, 'generateChat'),
      tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
    };
  }, 'generateChat');
}

export async function generateChatJSON<T = unknown>(
  messages: GeminiChatMessage[],
  systemPrompt: string,
  options?: { maxOutputTokens?: number }
): Promise<{ data: T; tokensUsed: number }> {
  const ai = getClient();
  const contents = toContents(messages);
  const maxOutputTokens = options?.maxOutputTokens ?? 2048;

  return runWithFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens,
        responseMimeType: 'application/json',
        // Large maxOutputTokens means a long-form generation; give it room.
        abortSignal: AbortSignal.timeout(
          maxOutputTokens > 2048 ? LONG_TIMEOUT_MS : DEFAULT_TIMEOUT_MS
        ),
      },
    });

    const data = parseModelJson<T>(requireText(response.text, model, 'generateChatJSON'));
    return { data, tokensUsed: response.usageMetadata?.totalTokenCount ?? 0 };
  }, 'generateChatJSON');
}

export async function generateChatStream(
  messages: GeminiChatMessage[],
  systemPrompt: string,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<{ stream: ReadableStream<string>; tokensPromise: Promise<number> }> {
  const ai = getClient();
  const contents = toContents(messages);

  // Quota/availability errors reject on this await, before a single byte
  // reaches the client — which is exactly why retry and fail-over are safe
  // here. Once chunks start flowing we're committed to the stream.
  const response = await runWithFallback(
    (model) =>
      ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 1024,
          thinkingConfig: NO_THINKING,
          // Aborting mid-stream surfaces in the for-await below, which already
          // routes errors to controller.error().
          abortSignal: AbortSignal.timeout(LONG_TIMEOUT_MS),
        },
      }),
    'generateChatStream',
  );

  let totalTokens = 0;
  let resolveTokens: (tokens: number) => void;
  const tokensPromise = new Promise<number>((resolve) => {
    resolveTokens = resolve;
  });

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const text = chunk.text ?? '';
          if (text) {
            controller.enqueue(text);
          }
          if (chunk.usageMetadata?.totalTokenCount) {
            totalTokens = chunk.usageMetadata.totalTokenCount;
          }
        }
        controller.close();
        resolveTokens(totalTokens);
      } catch (error) {
        controller.error(error);
        resolveTokens(totalTokens);
      }
    },
  });

  return { stream, tokensPromise };
}
