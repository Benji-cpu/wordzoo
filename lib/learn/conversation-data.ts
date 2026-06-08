/**
 * In-scene conversation practice content (Pedagogy v2 — "conversation" slice).
 *
 * Feedback: scenes were too passive (multi-select / fill-blank / flashcards
 * only) with no real conversation. This adds a short, PROGRESSIVE, TWO-SIDED
 * conversation block to the first three Indonesian scenes — the learner both
 * ANSWERS the NPC and ASKS questions, ramping easy → hard so they finish able
 * to actually hold the scene's conversation.
 *
 * Pure data, no migration. Keyed by scene id and gated by an explicit
 * allowlist (a scene with no entry simply never shows the phase). Stays strictly
 * within each scene's already-taught vocabulary. `[name]` is substituted with
 * the learner's name at render time (Indonesian has no gender agreement, so a
 * plain substitution is safe — see lib/learn/personalize.ts for the gendered
 * languages).
 *
 * Difficulty ladder per learner turn:
 *   - 'select'  → tap the correct line among authored distractors (easiest)
 *   - 'type'    → type it with English goal + hint chips + reveal ladder
 *   - 'produce' → free production from an English goal only; graded leniently
 *                 by the conversation-grade route, ACCEPT-AND-COACH (never a
 *                 dead end — MEMORY: the app must never wall the learner in).
 */

export type ConversationMode = 'select' | 'type' | 'produce';
export type ConversationSide = 'ask' | 'answer';

export interface ConversationTurn {
  /** Who is speaking — 'You' for the learner, otherwise the NPC's name. */
  speaker: string;
  /** NPC turns: the line shown. Learner turns: the reference/expected answer. */
  target: string;
  /** English gloss of `target`. */
  en: string;
  /** NPC turns auto-reveal; learner turns are graded. */
  role: 'npc' | 'learner';
  /** Learner turns only. */
  mode?: ConversationMode;
  /** Learner turns only: 'answer' the NPC vs 'ask' a question. */
  side?: ConversationSide;
  /** Learner turns: the English goal shown as the prompt. */
  goal_en?: string;
  /** 'select' mode: wrong lines shown alongside the correct `target`. */
  distractors?: string[];
  /** 'type' / 'produce' mode: optional word chips to scaffold the answer. */
  hints?: string[];
  /** Name-introduction turns: accept any answer that fits the pattern even
   * when we don't know the learner's name (avoids a spelling dead-end). */
  acceptAny?: boolean;
}

export interface ConversationExchange {
  /** Short label for the chat header, e.g. "Greeting". */
  label: string;
  turns: ConversationTurn[];
}

const SCENE_CONVERSATIONS: Record<string, ConversationExchange[]> = {
  // ── Scene 1: Selamat Pagi! (greetings + introductions) ──────────────
  'd1000000-0001-4000-8000-000000000004': [
    {
      label: 'Good morning',
      turns: [
        { role: 'npc', speaker: 'Adi', target: 'Selamat pagi! Apa kabar?', en: 'Good morning! How are you?' },
        {
          role: 'learner', speaker: 'You', mode: 'select', side: 'answer',
          goal_en: 'Reply that you are good, and thank them',
          target: 'Baik, terima kasih.', en: 'Good, thank you.',
          distractors: ['Dari mana?', 'Nama saya Adi.', 'Senang bertemu.'],
        },
      ],
    },
    {
      label: 'Introductions',
      turns: [
        { role: 'npc', speaker: 'Adi', target: 'Nama saya Adi. Siapa nama Anda?', en: 'My name is Adi. What is your name?' },
        {
          role: 'learner', speaker: 'You', mode: 'type', side: 'answer',
          goal_en: 'Tell Adi your name', target: 'Nama saya [name].', en: 'My name is [name].',
          hints: ['Nama', 'saya', '[name]'], acceptAny: true,
        },
        { role: 'npc', speaker: 'Adi', target: 'Senang bertemu!', en: 'Nice to meet you!' },
        {
          role: 'learner', speaker: 'You', mode: 'select', side: 'answer',
          goal_en: 'Say "nice to meet you too"',
          target: 'Senang bertemu juga!', en: 'Nice to meet you too!',
          distractors: ['Apa kabar?', 'Terima kasih.', 'Selamat pagi.'],
        },
      ],
    },
    {
      label: 'Your turn to ask',
      turns: [
        { role: 'npc', speaker: 'Adi', target: 'Saya dari Jakarta.', en: 'I am from Jakarta.' },
        {
          role: 'learner', speaker: 'You', mode: 'produce', side: 'ask',
          goal_en: 'Ask Adi where he is from', target: 'Anda dari mana?', en: 'Where are you from?',
          hints: ['Anda', 'dari', 'mana'],
        },
      ],
    },
  ],

  // ── Scene 2: Siapa Itu? (introducing friends) ───────────────────────
  'd1000000-0001-4000-8000-000000000005': [
    {
      label: 'Meeting Sari',
      turns: [
        { role: 'npc', speaker: 'Sari', target: 'Halo! Senang bertemu!', en: 'Hello! Nice to meet you!' },
        {
          role: 'learner', speaker: 'You', mode: 'select', side: 'answer',
          goal_en: 'Say "nice to meet you too"',
          target: 'Senang bertemu juga!', en: 'Nice to meet you too!',
          distractors: ['Ini teman saya.', 'Dia dari Jakarta.', 'Baik sekali!'],
        },
      ],
    },
    {
      label: 'Where are you from?',
      turns: [
        { role: 'npc', speaker: 'Sari', target: 'Anda dari mana?', en: 'Where are you from?' },
        {
          role: 'learner', speaker: 'You', mode: 'type', side: 'answer',
          goal_en: 'Say you are from Australia', target: 'Saya dari Australia.', en: 'I am from Australia.',
          hints: ['Saya', 'dari', 'Australia'],
        },
      ],
    },
    {
      label: 'Ask about Sari',
      turns: [
        { role: 'npc', speaker: 'Adi', target: 'Ini teman saya, Sari.', en: 'This is my friend, Sari.' },
        {
          role: 'learner', speaker: 'You', mode: 'produce', side: 'ask',
          goal_en: 'Ask where she (Sari) is from', target: 'Dia dari mana?', en: 'Where is she from?',
          hints: ['Dia', 'dari', 'mana'],
        },
        { role: 'npc', speaker: 'Sari', target: 'Saya dari Jakarta.', en: 'I am from Jakarta.' },
      ],
    },
  ],

  // ── Scene 3: Saya Mau... (ordering food) ────────────────────────────
  'd1000000-0001-4000-8000-000000000006': [
    {
      label: 'Ordering',
      turns: [
        { role: 'npc', speaker: 'Server', target: 'Selamat pagi! Mau pesan apa?', en: 'Good morning! What would you like to order?' },
        {
          role: 'learner', speaker: 'You', mode: 'select', side: 'answer',
          goal_en: 'Order fried rice',
          target: 'Saya mau nasi goreng.', en: 'I want fried rice.',
          distractors: ['Terima kasih.', 'Tidak pedas.', 'Senang bertemu.'],
        },
      ],
    },
    {
      label: 'Something to drink',
      turns: [
        { role: 'npc', speaker: 'Server', target: 'Mau minum apa?', en: 'What do you want to drink?' },
        {
          role: 'learner', speaker: 'You', mode: 'type', side: 'answer',
          goal_en: 'Say you want plain water', target: 'Saya mau air putih.', en: 'I want plain water.',
          hints: ['Saya', 'mau', 'air putih'],
        },
      ],
    },
    {
      label: 'No spice, please',
      turns: [
        { role: 'npc', speaker: 'Server', target: 'Mau pedas?', en: 'Do you want it spicy?' },
        {
          role: 'learner', speaker: 'You', mode: 'produce', side: 'answer',
          goal_en: 'Say: not spicy, thank you', target: 'Tidak pedas, terima kasih.', en: 'Not spicy, thank you.',
          hints: ['Tidak', 'pedas', 'terima kasih'],
        },
      ],
    },
  ],
};

/** Replace the `[name]` placeholder with the learner's name (fallback kept
 * neutral so a missing name never renders a literal "[name]"). */
export function applyLearnerName(text: string, learnerName: string | null): string {
  return text.replace(/\[name\]/g, learnerName?.trim() || 'teman');
}

/** Authored exchanges for a scene, or null when the scene has no conversation
 * (the allowlist is implicit — a missing key means no phase). */
export function getSceneConversation(sceneId: string): ConversationExchange[] | null {
  return SCENE_CONVERSATIONS[sceneId] ?? null;
}

/** Total learner-graded turns across all exchanges — used for the progress bar. */
export function countLearnerTurns(exchanges: ConversationExchange[]): number {
  return exchanges.reduce(
    (n, ex) => n + ex.turns.filter((t) => t.role === 'learner').length,
    0,
  );
}
