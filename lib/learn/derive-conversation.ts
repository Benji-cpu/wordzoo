/**
 * Derive in-scene conversation practice from a scene's own dialogue.
 *
 * The authored conversations in `conversation-data.ts` cover three Indonesian
 * scenes. Every other scene — all of Portuguese and Spanish — had no
 * conversation phase at all, so the learning loop was drill-only: cards,
 * multiple choice, typing, checkpoint.
 *
 * But every dialogue scene already contains the learner's own lines. They are
 * marked `speaker: "You"` and carry both the target text and its English
 * gloss, which is exactly what a learner turn needs. This module reads them
 * that way, so conversation practice exists in every scene and every language
 * without authoring anything.
 *
 * Two properties make this more than a shortcut:
 *   - The dialogue phase runs FIRST in every scene, so anything derived from
 *     it is by construction a retrieval check on scene-opening material.
 *   - `personalizeSceneContent` has already rewritten these lines with the
 *     learner's name and gender agreement before they reach us, so derived
 *     turns inherit that for free.
 *
 * Known quality gap: authored `goal_en` is a communicative function ("Reply
 * that you are good, and thank them"); derived can only be built from the
 * English gloss ("Say: …"). That makes the `produce` tier a translation
 * prompt rather than a communicative goal — real production practice, but
 * weaker. Authored scenes still win, and the fix path is an authored override
 * per scene, not runtime generation.
 *
 * Everything here is pure and deterministic — no Math.random, no Date. The
 * same scene must produce the same distractors and the same slot schedule on
 * every render, or a re-render would reshuffle the exercise under the learner.
 */

import type { SceneDialogue } from '@/types/database';
import { fuzzyMatchAnswer, normalizeForCompare } from '@/lib/pedagogy/normalize';
import {
  getSceneConversation,
  type ConversationExchange,
  type ConversationMode,
  type ConversationTurn,
} from '@/lib/learn/conversation-data';

/** Difficulty ordering, independent of which tiers are active this session. */
const MODE_ORDER: readonly ConversationMode[] = ['select', 'type', 'speak', 'produce'];

/** A `select` turn needs this many wrong options; below it we serve `type`
 * instead. A two-option multiple choice is a coin flip that credits the
 * learner for nothing. */
const MIN_DISTRACTORS = 3;

/** Longest label shown in the chat header before truncation. */
const MAX_LABEL_CHARS = 28;

/** Hint chips beyond this get dropped — the longest tokens are the content
 * words, and a full chip set for a long sentence hands the answer over. */
const MAX_HINTS = 6;

type DialogueLine = Pick<SceneDialogue, 'speaker' | 'text_target' | 'text_en'>;

export interface DeriveInput {
  /** Seeds every shuffle so the same scene always renders identically. */
  sceneId: string;
  /** Scene dialogue in sort order — already personalized by the page. */
  dialogues: DialogueLine[];
  /** Scene phrases, used only as last-resort distractors. */
  phrases?: { text_target: string }[];
}

// ── Deterministic helpers ───────────────────────────────────────────────────

/** djb2. Always positive so callers can use it as an index directly. */
export function stableHash(value: string): number {
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Seeded shuffle. Deterministic for a given (items, seed) pair, so a
 * re-render never reorders options under the learner's finger.
 */
export function stableShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let state = stableHash(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    // xorshift32 — cheap, and good enough to break the input ordering.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const j = Math.abs(state) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── Derivation ──────────────────────────────────────────────────────────────

function isLearnerLine(line: DialogueLine): boolean {
  // Matches DialoguePlayer's own test, so the bubble that renders on the
  // learner's side is exactly the line we turn into a learner turn.
  return line.speaker.trim().toLowerCase() === 'you';
}

function stripEdgePunctuation(token: string): string {
  return token.replace(/^[¿¡"'“”‘’(-]+|[.,!?;:"'“”‘’)-]+$/g, '');
}

/**
 * Split target-language text into comparable word tokens. Exported so callers
 * building the "what has been taught so far" set tokenize it exactly the way
 * `pickInterleavedExchange` tokenizes the exchanges it scores — two different
 * splitters would silently score everything as zero.
 */
export function tokenizeTarget(text: string): string[] {
  return text
    .split(/\s+/)
    .map(stripEdgePunctuation)
    .filter((t) => t.length > 0);
}

const tokenize = tokenizeTarget;

function labelFor(line: DialogueLine, index: number): string {
  const source = line.text_en?.trim();
  if (!source) return `Part ${index + 1}`;
  if (source.length <= MAX_LABEL_CHARS) return source;
  const cut = source.slice(0, MAX_LABEL_CHARS);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 12 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[.,;:!?]$/, '')}…`;
}

function npcTurn(line: DialogueLine): ConversationTurn {
  return {
    role: 'npc',
    speaker: line.speaker,
    target: line.text_target,
    en: line.text_en,
  };
}

/**
 * Wrong options for a `select` turn, in priority order: the learner's other
 * lines first (same register, same topic — genuinely plausible), then the
 * NPC's lines, then scene phrases. Shuffled within each tier so priority
 * survives.
 *
 * Anything the fuzzy matcher would ACCEPT as the target is discarded: a
 * near-duplicate line rendered as a wrong option is a second correct answer.
 */
function buildDistractors(
  target: string,
  tiers: string[][],
  seed: string,
): string[] {
  const picked: string[] = [];
  const seen = new Set<string>([normalizeForCompare(target)]);

  for (const tier of tiers) {
    if (picked.length >= MIN_DISTRACTORS) break;
    const viable = tier.filter((candidate) => {
      const key = normalizeForCompare(candidate);
      if (!key || seen.has(key)) return false;
      if (fuzzyMatchAnswer(candidate, target).kind !== 'wrong') return false;
      seen.add(key);
      return true;
    });
    picked.push(
      ...stableShuffle(viable, seed).slice(0, MIN_DISTRACTORS - picked.length),
    );
  }

  return picked;
}

/**
 * Scaffold chips for `type` / `produce`. Shuffled on purpose: the authored
 * hints ship in answer order, so tapping them left to right builds the answer
 * without recalling anything.
 */
function buildHints(target: string, seed: string): string[] | undefined {
  const tokens: string[] = [];
  const seen = new Set<string>();
  for (const token of tokenize(target)) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(token);
  }
  if (tokens.length <= 1) return undefined;
  const kept =
    tokens.length <= MAX_HINTS
      ? tokens
      : [...tokens].sort((a, b) => b.length - a.length).slice(0, MAX_HINTS);
  return stableShuffle(kept, seed);
}

/**
 * Turn a scene's dialogue into conversation exchanges, in dialogue order.
 *
 * Consecutive NPC lines buffer into the lead-in for the next learner turn;
 * trailing NPC lines join the final exchange so the conversation closes on
 * the NPC's reply rather than the learner's. `mode` is left unset — the
 * planner stamps it, because the same exchange replays at rising difficulty.
 */
export function deriveSceneConversation(input: DeriveInput): ConversationExchange[] {
  const { sceneId, dialogues, phrases = [] } = input;
  if (dialogues.length < 2) return [];
  if (!dialogues.some(isLearnerLine)) return [];

  const learnerTexts = dialogues.filter(isLearnerLine).map((l) => l.text_target);
  const npcTexts = dialogues.filter((l) => !isLearnerLine(l)).map((l) => l.text_target);
  const phraseTexts = phrases.map((p) => p.text_target);

  const exchanges: ConversationExchange[] = [];
  let npcBuffer: DialogueLine[] = [];

  for (const line of dialogues) {
    if (!isLearnerLine(line)) {
      npcBuffer.push(line);
      continue;
    }

    const index = exchanges.length;
    const seed = `${sceneId}:${index}`;
    const target = line.text_target;
    const side: ConversationTurn['side'] = target.trim().endsWith('?') ? 'ask' : 'answer';

    const learner: ConversationTurn = {
      role: 'learner',
      speaker: line.speaker,
      target,
      en: line.text_en,
      side,
      goal_en: side === 'ask' ? `Ask: “${line.text_en}”` : `Say: “${line.text_en}”`,
      distractors: buildDistractors(
        target,
        [learnerTexts, npcTexts, phraseTexts],
        `${seed}:distractors`,
      ),
      hints: buildHints(target, `${seed}:hints`),
    };

    exchanges.push({
      label: labelFor(npcBuffer[0] ?? line, index),
      turns: [...npcBuffer.map(npcTurn), learner],
    });
    npcBuffer = [];
  }

  if (npcBuffer.length > 0 && exchanges.length > 0) {
    const last = exchanges[exchanges.length - 1];
    exchanges[exchanges.length - 1] = {
      ...last,
      turns: [...last.turns, ...npcBuffer.map(npcTurn)],
    };
  }

  return exchanges;
}

/** Hand-authored content wins; derivation is the fallback. */
export function resolveSceneConversation(
  input: DeriveInput,
): ConversationExchange[] | null {
  const authored = getSceneConversation(input.sceneId);
  if (authored && authored.length > 0) return authored;
  const derived = deriveSceneConversation(input);
  return derived.length > 0 ? derived : null;
}

// ── Planning: which exchange lands where, and how hard ───────────────────────

export interface ConversationPlan {
  /** One entry per slot (a slot is "after batch N's drill"). Empty → no interlude. */
  interludes: ConversationExchange[][];
  /** The full conversation, every exchange in order, at its top tier. */
  capstone: ConversationExchange[];
}

function modeRank(mode: ConversationMode | undefined): number {
  if (!mode) return -1;
  const i = MODE_ORDER.indexOf(mode);
  return i === -1 ? 0 : i;
}

/**
 * Stamp a difficulty tier onto an exchange's learner turns.
 *
 * Never downgrades: an authored turn already set to `produce` is not dragged
 * back to `select` by an early slot. And `select` falls back to `type` when
 * there aren't enough wrong options to make the choice mean anything.
 */
function withMode(exchange: ConversationExchange, mode: ConversationMode): ConversationExchange {
  return {
    ...exchange,
    turns: exchange.turns.map((turn) => {
      if (turn.role !== 'learner') return turn;
      const chosen = modeRank(mode) >= modeRank(turn.mode) ? mode : (turn.mode as ConversationMode);
      const usable =
        chosen === 'select' && (turn.distractors?.length ?? 0) < MIN_DISTRACTORS
          ? 'type'
          : chosen;
      return { ...turn, mode: usable };
    }),
  };
}

function learnerTokensOf(exchange: ConversationExchange): string[] {
  return exchange.turns
    .filter((t) => t.role === 'learner')
    .flatMap((t) => tokenize(t.target).map(normalizeForCompare))
    .filter(Boolean);
}

/**
 * Choose which exchange to replay in a given slot.
 *
 * Scored on how much of the exchange the learner has been taught SO FAR —
 * cumulatively, across every batch up to this point, not just the batch they
 * have this second finished drilling. That is the whole trick: an exchange
 * dense in batch-1 vocabulary still scores highly at the last slot, so early
 * material keeps getting pulled forward instead of being crowded out by
 * whatever is freshest.
 *
 * Ties break on fewest plays, then lowest index. Returns -1 for an empty set.
 */
export function pickInterleavedExchange(args: {
  exchanges: ConversationExchange[];
  /** Target-language word texts taught cumulatively through this slot. */
  taughtWordTexts: string[];
  playCounts: number[];
  slotIndex: number;
}): number {
  const { exchanges, taughtWordTexts, playCounts, slotIndex } = args;
  if (exchanges.length === 0) return -1;

  const taught = new Set(taughtWordTexts.map(normalizeForCompare).filter(Boolean));
  const scores = exchanges.map((ex) => {
    const tokens = new Set(learnerTokensOf(ex));
    let hits = 0;
    for (const token of tokens) if (taught.has(token)) hits++;
    return hits;
  });

  let best = 0;
  for (let i = 1; i < exchanges.length; i++) {
    if (scores[i] > scores[best]) {
      best = i;
    } else if (scores[i] === scores[best] && (playCounts[i] ?? 0) < (playCounts[best] ?? 0)) {
      best = i;
    }
  }

  // Nothing matched — the lines use only names or function words outside the
  // scene's word list. Rotate rather than hammering exchange 0 every slot.
  if (scores[best] === 0) return slotIndex % exchanges.length;
  return best;
}

/**
 * Build the whole schedule up front: one exchange per slot, plus the capstone.
 *
 * The difficulty ladder is applied at PRESENTATION time rather than baked into
 * the data, because the same exchange comes back harder each time it is
 * replayed. Unsupported speech shrinks the ladder rather than branching, so
 * Japanese and non-Chrome browsers need no special case downstream.
 */
export function planSceneConversation(input: {
  exchanges: ConversationExchange[];
  /** Cumulative taught word texts at the end of each slot; length = slot count. */
  slotWordTexts: string[][];
  /** False → `speak` is removed from the ladder entirely. */
  speakSupported: boolean;
}): ConversationPlan {
  const { exchanges, slotWordTexts, speakSupported } = input;
  if (exchanges.length === 0) return { interludes: [], capstone: [] };

  const ladder: ConversationMode[] = speakSupported
    ? ['select', 'type', 'speak', 'produce']
    : ['select', 'type', 'produce'];
  const top = ladder.length - 1;

  // Where each exchange starts on the ladder: later exchanges in the scene
  // open harder, so the conversation as a whole ramps.
  const baseTier = (i: number) => Math.floor((i * ladder.length) / exchanges.length);
  const playCounts = new Array(exchanges.length).fill(0);

  const interludes: ConversationExchange[][] = [];
  // A single exchange replayed every slot is repetition, not reinforcement.
  // Below two, the capstone alone carries the conversation.
  const interleave = exchanges.length >= 2;

  for (let slot = 0; slot < slotWordTexts.length; slot++) {
    if (!interleave) {
      interludes.push([]);
      continue;
    }
    const index = pickInterleavedExchange({
      exchanges,
      taughtWordTexts: slotWordTexts[slot] ?? [],
      playCounts,
      slotIndex: slot,
    });
    if (index < 0) {
      interludes.push([]);
      continue;
    }
    const tier = Math.min(top, baseTier(index) + playCounts[index]);
    interludes.push([withMode(exchanges[index], ladder[tier])]);
    playCounts[index] += 1;
  }

  const capstone = exchanges.map((ex, i) =>
    withMode(ex, ladder[Math.min(top, baseTier(i) + playCounts[i])]),
  );

  return { interludes, capstone };
}
