# Tutor Path Builder — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Build a Path" mode to the AI tutor where users describe a scenario in natural conversation, then the tutor generates interactive vocabulary building blocks they can curate into a custom learning path.

**Architecture:** New 6th tutor mode (`path_builder`) with hybrid flow — organic discovery conversation followed by structured vocabulary generation using new `[PATH_VOCAB]` and `[PHASE_TRANSITION]` chat segments rendered as interactive cards. Draft state persisted in a new `path_builder_drafts` table. Phase 1 covers discovery + vocabulary; phrases/dialogues/confirmation are Phase 2.

**Tech Stack:** Next.js 16, React 19, TypeScript, Neon Postgres (raw SQL), Gemini 2.0 Flash, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-26-tutor-path-builder-design.md`

---

## Context

Users currently can only learn from pre-built curated paths. This feature lets users describe a real-world scenario to the tutor ("I'm going to Bali and want to haggle at markets") and the tutor builds a custom vocabulary set with mnemonics, rendered as interactive cards in the chat. This is Phase 1 — discovery conversation + vocabulary building blocks. Phrases, dialogues, and path confirmation come in Phase 2.

---

## File Map

### Modified Files
| File | Responsibility |
|------|---------------|
| `lib/db/schema.ts:501` | Add `path_builder_drafts` table, extend mode constraint, add `custom_paths_created` column |
| `types/database.ts:131,212,364` | Add `path_builder` to TutorSession mode, `custom_paths_created` to DailyUsage, PathBuilderDraft types |
| `types/api.ts:53,261` | Add `path_builder` to TutorModeEnum, add PathBuilderActionSchema |
| `lib/tutor/message-parser.ts:1-11,53,72-87` | Extend MessageSegment union, regex, match handler for PATH_VOCAB + PHASE_TRANSITION |
| `components/tutor/ChatBubble.tsx:7-12,44,51-117` | Add path builder props, render PathVocabCard and PhaseIndicator |
| `components/tutor/ModeSelector.tsx:43` | Add 6th "Build a Path" mode card |
| `lib/ai/tutor-prompts.ts:22,144` | Add path_builder MODE_INSTRUCTIONS, discovery + vocab prompt builders |
| `lib/services/tutor-service.ts:17,37-44,135-169` | Import path builder service, add mode branch in startSession + sendMessage |
| `components/tutor/TutorChat.tsx:82,124-127` | Add vocabStatuses state, handlePathVocabAction, pass props to ChatBubble |
| `components/tutor/SessionProgressBar.tsx:14` | Add `path_builder: 'Build a Path'` to MODE_LABELS |

### New Files
| File | Responsibility |
|------|---------------|
| `components/tutor/path-builder/PhaseIndicator.tsx` | Visual divider between path builder phases |
| `components/tutor/path-builder/PathVocabCard.tsx` | Interactive vocabulary building block card |
| `lib/services/path-builder-service.ts` | Draft CRUD, vocab item actions, access check |
| `app/api/tutor/path-builder/action/route.ts` | API for Keep/Remove/Different interactions |

---

### Task 1: Schema & Migration

**Files:**
- Modify: `lib/db/schema.ts:501` (before closing backtick)

- [ ] **Step 1: Add path_builder_drafts table, mode constraint, and daily_usage column to schema.ts**

Append before the closing backtick (line 501) in `CREATE_TABLES_SQL`:

```sql

-- Path Builder Drafts (in-progress path builds from tutor)
CREATE TABLE IF NOT EXISTS path_builder_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  scenario_context JSONB NOT NULL DEFAULT '{}',
  current_phase TEXT NOT NULL DEFAULT 'discovery'
    CHECK (current_phase IN ('discovery','vocabulary','phrases','dialogues','confirm','completed')),
  draft_content JSONB NOT NULL DEFAULT '{"vocabulary":[],"phrases":[],"dialogues":[]}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_path_builder_drafts_user
  ON path_builder_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_path_builder_drafts_session
  ON path_builder_drafts(session_id);

-- Extend tutor_sessions mode to include path_builder (re-applies constraint)
DO $$
DECLARE _conname TEXT;
BEGIN
  SELECT conname INTO _conname FROM pg_constraint
  WHERE conrelid = 'tutor_sessions'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%mode%';
  IF _conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE tutor_sessions DROP CONSTRAINT %I', _conname);
  END IF;
  ALTER TABLE tutor_sessions ADD CONSTRAINT tutor_sessions_mode_check
    CHECK (mode IN (
      'free_chat','role_play','word_review','grammar_glimpse',
      'pronunciation_coach','guided_conversation','path_builder'
    ));
END $$;

-- Track custom path creation for free tier limits
ALTER TABLE daily_usage
  ADD COLUMN IF NOT EXISTS custom_paths_created INTEGER NOT NULL DEFAULT 0;
```

- [ ] **Step 2: Run migration**

Run: `npm run db:migrate`
Expected: "All tables created successfully."

- [ ] **Step 3: Verify via Neon MCP**

Use Neon MCP `run_sql`:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'path_builder_drafts';
```
Expected: 1 row returned.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add path_builder_drafts table and extend tutor mode constraint"
```

---

### Task 2: TypeScript Types & Zod Schemas

**Files:**
- Modify: `types/database.ts:131,212,364`
- Modify: `types/api.ts:53,261`

- [ ] **Step 1: Extend TutorSession.mode in types/database.ts**

On line 131, change:
```typescript
mode: 'free_chat' | 'role_play' | 'word_review' | 'grammar_glimpse' | 'pronunciation_coach' | 'guided_conversation';
```
to:
```typescript
mode: 'free_chat' | 'role_play' | 'word_review' | 'grammar_glimpse' | 'pronunciation_coach' | 'guided_conversation' | 'path_builder';
```

- [ ] **Step 2: Add custom_paths_created to DailyUsage**

On line 211 (after `regenerations: number;`), add:
```typescript
  custom_paths_created: number;
```

- [ ] **Step 3: Add PathBuilderDraft types at end of types/database.ts**

After line 364 (end of `UserSceneProgress`), add:

```typescript

// --- Path Builder Draft types ---

export interface PathBuilderVocabItem {
  tempId: string;
  word: string;
  romanization: string;
  meaning: string;
  mnemonicHint: string;
  partOfSpeech: string;
  status: 'pending' | 'kept' | 'removed';
}

export interface PathBuilderPhraseItem {
  tempId: string;
  phrase: string;
  meaning: string;
  breakdown: string;
  usageNote: string;
  status: 'pending' | 'kept' | 'removed';
}

export interface PathBuilderDialogueItem {
  tempId: string;
  title: string;
  context: string;
  linesTarget: string[];
  linesEn: string[];
  speakers: string[];
  status: 'pending' | 'kept' | 'removed';
}

export interface PathBuilderDraftContent {
  vocabulary: PathBuilderVocabItem[];
  phrases: PathBuilderPhraseItem[];
  dialogues: PathBuilderDialogueItem[];
}

export interface PathBuilderScenarioContext {
  scenario: string;
  proficiency: string;
  subtopics: string[];
  preferences: string[];
  targetLanguage: string;
}

export type PathBuilderPhase = 'discovery' | 'vocabulary' | 'phrases' | 'dialogues' | 'confirm' | 'completed';

export interface PathBuilderDraft {
  id: string;
  user_id: string;
  session_id: string;
  language_id: string;
  title: string | null;
  description: string | null;
  scenario_context: PathBuilderScenarioContext;
  current_phase: PathBuilderPhase;
  draft_content: PathBuilderDraftContent;
  created_at: Date;
  updated_at: Date;
}
```

- [ ] **Step 4: Extend TutorModeEnum in types/api.ts**

On line 53, change:
```typescript
export const TutorModeEnum = z.enum(['free_chat', 'role_play', 'word_review', 'grammar_glimpse', 'pronunciation_coach', 'guided_conversation']);
```
to:
```typescript
export const TutorModeEnum = z.enum(['free_chat', 'role_play', 'word_review', 'grammar_glimpse', 'pronunciation_coach', 'guided_conversation', 'path_builder']);
```

- [ ] **Step 5: Add PathBuilderActionSchema at end of types/api.ts**

After line 261, add:

```typescript

// Path Builder
export const PathBuilderActionSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(['keep', 'remove', 'different', 'advance_phase']),
  itemType: z.enum(['vocabulary', 'phrase', 'dialogue']).optional(),
  tempId: z.string().optional(),
});

export type PathBuilderActionInput = z.infer<typeof PathBuilderActionSchema>;
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add types/database.ts types/api.ts
git commit -m "feat: add path builder TypeScript types and Zod schemas"
```

---

### Task 3: Message Parser Extension

**Files:**
- Modify: `lib/tutor/message-parser.ts:1-7,10-11,53,72-87`

- [ ] **Step 1: Extend MessageSegment union (lines 1-7)**

Replace the `MessageSegment` type:
```typescript
export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'vocab_word'; word: string; meaning: string }
  | { type: 'suggestion'; options: string[] }
  | { type: 'correction'; original: string; corrected: string; explanation?: string }
  | { type: 'grammar_note'; title: string; body: string }
  | { type: 'context_card'; label: string; content: string }
  | { type: 'path_vocab'; word: string; romanization: string; meaning: string; mnemonicHint: string }
  | { type: 'phase_transition'; phase: string; description: string };
```

- [ ] **Step 2: Extend MARKER_REGEX (line 10-11)**

Replace:
```typescript
const MARKER_REGEX =
  /\[SUGGEST:\s*([^\]]+)\]|\[CORRECT:\s*([^\]]+)\]|\[GRAMMAR:\s*([^\]]+)\]|\[CONTEXT:\s*([^\]]+)\]|\*\*([^*]+)\*\*\s*\(([^)]+)\)/g;
```
with (adds PATH_VOCAB and PHASE_TRANSITION before the **word** (meaning) pattern):
```typescript
const MARKER_REGEX =
  /\[SUGGEST:\s*([^\]]+)\]|\[CORRECT:\s*([^\]]+)\]|\[GRAMMAR:\s*([^\]]+)\]|\[CONTEXT:\s*([^\]]+)\]|\[PATH_VOCAB:\s*([^\]]+)\]|\[PHASE_TRANSITION:\s*([^\]]+)\]|\*\*([^*]+)\*\*\s*\(([^)]+)\)/g;
```

Note: This shifts the `**word** (meaning)` capture groups from 5-6 to 7-8.

- [ ] **Step 3: Add parser functions (after parseContext, ~line 53)**

```typescript
function parsePathVocab(inner: string): MessageSegment {
  const parts = inner.split('|').map((s) => s.trim());
  if (parts.length < 3) {
    return { type: 'text', content: `[PATH_VOCAB: ${inner}]` };
  }
  return {
    type: 'path_vocab',
    word: parts[0],
    romanization: parts[1],
    meaning: parts[2],
    mnemonicHint: parts[3] ?? '',
  };
}

function parsePhaseTransition(inner: string): MessageSegment {
  const pipeIdx = inner.indexOf('|');
  if (pipeIdx < 0) {
    return { type: 'phase_transition', phase: inner.trim(), description: '' };
  }
  return {
    type: 'phase_transition',
    phase: inner.slice(0, pipeIdx).trim(),
    description: inner.slice(pipeIdx + 1).trim(),
  };
}
```

- [ ] **Step 4: Update match handler in parseMessageContent (lines 72-87)**

Replace the if/else-if chain to handle new groups and shifted indices:
```typescript
    if (match[1] != null) {
      // [SUGGEST: ...]
      segments.push(parseSuggest(match[1]));
    } else if (match[2] != null) {
      // [CORRECT: ...]
      segments.push(parseCorrect(match[2]));
    } else if (match[3] != null) {
      // [GRAMMAR: ...]
      segments.push(parseGrammar(match[3]));
    } else if (match[4] != null) {
      // [CONTEXT: ...]
      segments.push(parseContext(match[4]));
    } else if (match[5] != null) {
      // [PATH_VOCAB: ...]
      segments.push(parsePathVocab(match[5]));
    } else if (match[6] != null) {
      // [PHASE_TRANSITION: ...]
      segments.push(parsePhaseTransition(match[6]));
    } else if (match[7] != null && match[8] != null) {
      // **word** (meaning)
      segments.push({ type: 'vocab_word', word: match[7], meaning: match[8] });
    }
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add lib/tutor/message-parser.ts
git commit -m "feat: extend message parser with PATH_VOCAB and PHASE_TRANSITION segments"
```

---

### Task 4: PhaseIndicator Component

**Files:**
- Create: `components/tutor/path-builder/PhaseIndicator.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client';

interface PhaseIndicatorProps {
  phase: string;
  description: string;
}

const PHASE_ICONS: Record<string, string> = {
  Discovery: '🔍',
  Vocabulary: '📝',
  Phrases: '💬',
  Dialogues: '🎭',
  Confirm: '✅',
};

export function PhaseIndicator({ phase, description }: PhaseIndicatorProps) {
  const icon = PHASE_ICONS[phase] ?? '📍';

  return (
    <div className="my-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-card-border" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-default/10 border border-accent-default/20">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold text-accent-default uppercase tracking-wider">
            {phase}
          </span>
        </div>
        <div className="flex-1 h-px bg-card-border" />
      </div>
      {description && (
        <p className="text-center text-xs text-text-secondary mt-1.5">{description}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/tutor/path-builder/PhaseIndicator.tsx
git commit -m "feat: add PhaseIndicator component for path builder phase dividers"
```

---

### Task 5: PathVocabCard Component

**Files:**
- Create: `components/tutor/path-builder/PathVocabCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client';

import { useState } from 'react';

interface PathVocabCardProps {
  word: string;
  romanization: string;
  meaning: string;
  mnemonicHint: string;
  onKeep: () => void;
  onRemove: () => void;
  onDifferent: () => void;
  status: 'pending' | 'kept' | 'removed';
}

export function PathVocabCard({
  word,
  romanization,
  meaning,
  mnemonicHint,
  onKeep,
  onRemove,
  onDifferent,
  status,
}: PathVocabCardProps) {
  const [showHint, setShowHint] = useState(false);

  const isKept = status === 'kept';
  const isRemoved = status === 'removed';
  const isPending = status === 'pending';

  return (
    <div
      className={`my-2 rounded-xl overflow-hidden border transition-all animate-fade-in ${
        isKept
          ? 'border-l-4 border-l-green-500 border-green-500/30 bg-green-500/5'
          : isRemoved
          ? 'border-card-border bg-card-surface/50 opacity-60'
          : 'border-card-border bg-card-surface'
      }`}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`font-bold text-base ${isRemoved ? 'line-through text-text-secondary' : 'text-foreground'}`}>
              {word}
            </span>
            {romanization && (
              <span className="text-text-secondary text-sm ml-1.5">({romanization})</span>
            )}
            <div className={`text-sm mt-0.5 ${isRemoved ? 'line-through text-text-secondary' : 'text-text-secondary'}`}>
              {meaning}
            </div>
          </div>
          {isKept && <span className="text-green-400 text-lg shrink-0">✓</span>}
          {isRemoved && <span className="text-red-400 text-lg shrink-0">✗</span>}
        </div>

        {mnemonicHint && !isRemoved && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-accent-default mt-1.5 hover:underline"
          >
            {showHint ? 'Hide mnemonic' : 'Show mnemonic'}
          </button>
        )}
        {showHint && mnemonicHint && (
          <div className="mt-1 text-xs text-text-secondary bg-white/5 rounded-lg px-2 py-1.5 animate-fade-in">
            {mnemonicHint}
          </div>
        )}

        {isPending && (
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={onKeep}
              className="flex-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 active:scale-95 transition-all"
            >
              ✓ Keep
            </button>
            <button
              onClick={onRemove}
              className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 active:scale-95 transition-all"
            >
              ✗ Remove
            </button>
            <button
              onClick={onDifferent}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 text-text-secondary text-xs font-medium hover:bg-white/10 active:scale-95 transition-all"
            >
              ↻ Different
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/tutor/path-builder/PathVocabCard.tsx
git commit -m "feat: add PathVocabCard component for interactive vocabulary building blocks"
```

---

### Task 6: ChatBubble Extension

**Files:**
- Modify: `components/tutor/ChatBubble.tsx`

- [ ] **Step 1: Add imports (after line 4)**

```typescript
import { PhaseIndicator } from '@/components/tutor/path-builder/PhaseIndicator';
import { PathVocabCard } from '@/components/tutor/path-builder/PathVocabCard';
```

- [ ] **Step 2: Extend ChatBubbleProps (lines 7-12)**

Replace:
```typescript
interface ChatBubbleProps {
  role: 'user' | 'model';
  content: string;
  vocabMap: Map<string, PopoverData>;
  onWordTap: (data: PopoverData, rect: DOMRect) => void;
}
```
with:
```typescript
interface ChatBubbleProps {
  role: 'user' | 'model';
  content: string;
  vocabMap: Map<string, PopoverData>;
  onWordTap: (data: PopoverData, rect: DOMRect) => void;
  onPathVocabAction?: (word: string, action: 'keep' | 'remove' | 'different') => void;
  vocabStatuses?: Map<string, 'pending' | 'kept' | 'removed'>;
}
```

- [ ] **Step 3: Update ChatBubble destructuring (line 14)**

Change to:
```typescript
export function ChatBubble({ role, content, vocabMap, onWordTap, onPathVocabAction, vocabStatuses }: ChatBubbleProps) {
```

- [ ] **Step 4: Pass new props to SegmentRenderer (~line 44)**

Replace:
```typescript
          <SegmentRenderer key={i} segment={seg} onWordClick={handleWordClick} />
```
with:
```typescript
          <SegmentRenderer
            key={i}
            segment={seg}
            onWordClick={handleWordClick}
            onPathVocabAction={onPathVocabAction}
            vocabStatuses={vocabStatuses}
          />
```

- [ ] **Step 5: Extend SegmentRenderer props and add new cases (~lines 51-117)**

Update the function signature:
```typescript
function SegmentRenderer({
  segment,
  onWordClick,
  onPathVocabAction,
  vocabStatuses,
}: {
  segment: MessageSegment;
  onWordClick: (word: string, meaning: string, e: React.MouseEvent<HTMLSpanElement>) => void;
  onPathVocabAction?: (word: string, action: 'keep' | 'remove' | 'different') => void;
  vocabStatuses?: Map<string, 'pending' | 'kept' | 'removed'>;
}) {
```

Add two new cases before the `default:` case (before line 114):
```typescript
    case 'path_vocab':
      return (
        <PathVocabCard
          word={segment.word}
          romanization={segment.romanization}
          meaning={segment.meaning}
          mnemonicHint={segment.mnemonicHint}
          status={vocabStatuses?.get(segment.word) ?? 'pending'}
          onKeep={() => onPathVocabAction?.(segment.word, 'keep')}
          onRemove={() => onPathVocabAction?.(segment.word, 'remove')}
          onDifferent={() => onPathVocabAction?.(segment.word, 'different')}
        />
      );

    case 'phase_transition':
      return (
        <PhaseIndicator phase={segment.phase} description={segment.description} />
      );
```

- [ ] **Step 6: Verify build**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add components/tutor/ChatBubble.tsx
git commit -m "feat: extend ChatBubble with PathVocabCard and PhaseIndicator rendering"
```

---

### Task 7: ModeSelector Update

**Files:**
- Modify: `components/tutor/ModeSelector.tsx:43`

- [ ] **Step 1: Add 6th mode card**

After line 42 (the pronunciation_coach entry's closing `}`), add:
```typescript
  {
    id: 'path_builder',
    label: 'Build a Path',
    description: 'Create a custom learning path from a scenario',
    icon: '🛠️',
  },
```

- [ ] **Step 2: Add path_builder to SessionProgressBar MODE_LABELS**

In `components/tutor/SessionProgressBar.tsx`, after line 13 (`guided_conversation: 'Guided',`), add:
```typescript
  path_builder: 'Build a Path',
```

- [ ] **Step 3: Verify build and visual**

Run: `npm run build`
Via Playwright MCP: navigate to `localhost:8000/api/auth/test-login`, then `/tutor`. Take screenshot — should show 6 mode cards in a 3×2 grid with "Build a Path" as the last card.

- [ ] **Step 4: Commit**

```bash
git add components/tutor/ModeSelector.tsx components/tutor/SessionProgressBar.tsx
git commit -m "feat: add Build a Path mode card to ModeSelector"
```

---

### Task 8: Tutor Prompts for Path Builder

**Files:**
- Modify: `lib/ai/tutor-prompts.ts:22,144`

- [ ] **Step 1: Add path_builder to MODE_INSTRUCTIONS (after line 21, the pronunciation_coach entry)**

```typescript
  path_builder: `You are helping the user design a custom learning path. Your goal is to understand their scenario thoroughly before building. Ask about: the specific situation (where, who, what), their current level, any specific sub-topics, and any preferences. When you have a clear picture (typically 2-5 exchanges), say "I've got a great picture of what you need! Let me start building your path." then emit [PHASE_TRANSITION: Vocabulary|Building your essential word list] and immediately generate vocabulary cards.`,
```

- [ ] **Step 2: Add path builder prompt builders (after line 143, end of file)**

```typescript

// --- Path Builder Prompts ---

export interface PathBuilderPromptOptions {
  languageName: string;
  scenarioContext: {
    scenario: string;
    proficiency: string;
    subtopics: string[];
    preferences: string[];
  };
  knownWords: KnownWordRow[];
  adaptiveContext?: string;
  confirmedVocab?: Array<{ word: string; meaning: string }>;
}

export function buildPathBuilderDiscoveryPrompt(opts: PathBuilderPromptOptions): string {
  const blocks: string[] = [];

  blocks.push(
    `You are a friendly, encouraging language tutor for ${opts.languageName}. ` +
    `You are helping the user design a custom learning path tailored to their specific needs. ` +
    `Be warm and curious — your goal is to understand their scenario before you start building.`
  );

  if (opts.adaptiveContext) {
    blocks.push(`## Learner Profile\n${opts.adaptiveContext}`);
  }

  blocks.push(
    `Your goal in this phase is to understand the user's scenario thoroughly.\n` +
    `Ask about:\n` +
    `- The specific situation (where, who, what)\n` +
    `- Their current level with ${opts.languageName} (beginner/intermediate/advanced)\n` +
    `- Any specific sub-topics or vocabulary areas they need\n` +
    `- Any preferences (formal/informal, specific dialects)\n\n` +
    `Typically 2-5 exchanges is enough. When you have a clear picture of:\n` +
    `✓ The scenario context\n` +
    `✓ The user's proficiency level\n` +
    `✓ At least 2-3 specific sub-topics\n` +
    `✓ Any stated preferences\n\n` +
    `Transition by saying something like "I've got a great picture of what you need! ` +
    `Let me start building your path." and emit:\n` +
    `[PHASE_TRANSITION: Vocabulary|Building your essential word list]\n\n` +
    `Then immediately generate 15-25 vocabulary words using the format:\n` +
    `[PATH_VOCAB: word|romanization|meaning|mnemonic_hint]\n\n` +
    `The mnemonic_hint should use the keyword method — find an English word that sounds like ` +
    `the target word and create a vivid mental image connecting the sound to the meaning.\n\n` +
    `Group related words together (numbers, then descriptive words, then action words, etc.).\n\n` +
    `After all words, say: "Those are the essential words for your scenario. ` +
    `Tap the Keep/Remove buttons on each word, or ask me for alternatives. ` +
    `When you're happy with your word list, tell me to move on to phrases!"`
  );

  if (opts.knownWords.length > 0) {
    const knownList = opts.knownWords
      .slice(0, 30)
      .map((w) => `${w.text} = ${w.meaning_en}`)
      .join(', ');
    blocks.push(
      `The student already knows these words (don't include them unless essential): ${knownList}`
    );
  }

  blocks.push(
    `Formatting rules:\n` +
    `- During discovery, bold target-language words: **word** (meaning)\n` +
    `- Keep discovery responses 2-3 sentences\n` +
    `- After transitioning, use ONLY [PATH_VOCAB: word|romanization|meaning|mnemonic_hint] for each word\n` +
    `- Include [SUGGEST:] chips during discovery to help the user describe their scenario\n` +
    `- Keep mnemonic hints under 20 words each`
  );

  return blocks.join('\n\n');
}

export function buildPathBuilderVocabPrompt(opts: PathBuilderPromptOptions): string {
  const blocks: string[] = [];

  blocks.push(
    `You are building a vocabulary list for a custom ${opts.languageName} learning path. ` +
    `The user has described their scenario and you are now generating vocabulary cards.`
  );

  blocks.push(
    `Scenario: ${opts.scenarioContext.scenario}\n` +
    `User level: ${opts.scenarioContext.proficiency}\n` +
    `Sub-topics: ${opts.scenarioContext.subtopics.join(', ')}` +
    (opts.scenarioContext.preferences.length > 0
      ? `\nPreferences: ${opts.scenarioContext.preferences.join(', ')}`
      : '')
  );

  if (opts.confirmedVocab && opts.confirmedVocab.length > 0) {
    blocks.push(
      `Already confirmed vocabulary:\n` +
      opts.confirmedVocab.map((v) => `- ${v.word} = ${v.meaning}`).join('\n')
    );
  }

  if (opts.knownWords.length > 0) {
    const knownList = opts.knownWords
      .slice(0, 30)
      .map((w) => `${w.text} = ${w.meaning_en}`)
      .join(', ');
    blocks.push(
      `The student already knows these words: ${knownList}`
    );
  }

  blocks.push(
    `Generate vocabulary using [PATH_VOCAB: word|romanization|meaning|mnemonic_hint] format.\n` +
    `The mnemonic_hint should use the keyword method — find an English word that sounds like ` +
    `the target word and create a vivid mental image connecting the sound to the meaning.\n` +
    `Keep mnemonic hints under 20 words.\n` +
    `Group related words together.`
  );

  return blocks.join('\n\n');
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add lib/ai/tutor-prompts.ts
git commit -m "feat: add path builder discovery and vocabulary prompt templates"
```

---

### Task 9: Path Builder Service

**Files:**
- Create: `lib/services/path-builder-service.ts`

- [ ] **Step 1: Create the service**

```typescript
import { sql } from '@/lib/db/client';
import type {
  PathBuilderDraft,
  PathBuilderPhase,
  PathBuilderDraftContent,
  PathBuilderScenarioContext,
} from '@/types/database';

// --- Draft CRUD ---

export async function createDraft(
  userId: string,
  sessionId: string,
  languageId: string
): Promise<PathBuilderDraft> {
  const rows = await sql`
    INSERT INTO path_builder_drafts (user_id, session_id, language_id)
    VALUES (${userId}, ${sessionId}, ${languageId})
    RETURNING *
  `;
  return rows[0] as PathBuilderDraft;
}

export async function getDraftBySessionId(sessionId: string): Promise<PathBuilderDraft | null> {
  const rows = await sql`
    SELECT * FROM path_builder_drafts WHERE session_id = ${sessionId}
  `;
  return (rows[0] as PathBuilderDraft) ?? null;
}

export async function getDraftByUserId(
  userId: string,
  languageId: string
): Promise<PathBuilderDraft | null> {
  const rows = await sql`
    SELECT * FROM path_builder_drafts
    WHERE user_id = ${userId} AND language_id = ${languageId}
      AND current_phase != 'completed'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return (rows[0] as PathBuilderDraft) ?? null;
}

export async function updateDraftPhase(
  draftId: string,
  phase: PathBuilderPhase
): Promise<void> {
  await sql`
    UPDATE path_builder_drafts
    SET current_phase = ${phase}, updated_at = NOW()
    WHERE id = ${draftId}
  `;
}

export async function updateDraftContent(
  draftId: string,
  content: PathBuilderDraftContent
): Promise<void> {
  await sql`
    UPDATE path_builder_drafts
    SET draft_content = ${JSON.stringify(content)}, updated_at = NOW()
    WHERE id = ${draftId}
  `;
}

export async function updateDraftScenarioContext(
  draftId: string,
  context: PathBuilderScenarioContext
): Promise<void> {
  await sql`
    UPDATE path_builder_drafts
    SET scenario_context = ${JSON.stringify(context)}, updated_at = NOW()
    WHERE id = ${draftId}
  `;
}

// --- Vocab Item Actions ---

export async function handleVocabAction(
  draftId: string,
  wordText: string,
  action: 'keep' | 'remove'
): Promise<PathBuilderDraftContent> {
  const draft = await getDraftById(draftId);
  if (!draft) throw new Error('Draft not found');

  const content = draft.draft_content as PathBuilderDraftContent;
  const idx = content.vocabulary.findIndex((v) => v.word === wordText);
  if (idx === -1) throw new Error('Vocabulary item not found');

  content.vocabulary[idx].status = action === 'keep' ? 'kept' : 'removed';
  await updateDraftContent(draftId, content);
  return content;
}

export async function addVocabItem(
  draftId: string,
  item: { word: string; romanization: string; meaning: string; mnemonicHint: string; partOfSpeech: string }
): Promise<void> {
  const draft = await getDraftById(draftId);
  if (!draft) throw new Error('Draft not found');

  const content = draft.draft_content as PathBuilderDraftContent;
  content.vocabulary.push({
    tempId: crypto.randomUUID(),
    word: item.word,
    romanization: item.romanization,
    meaning: item.meaning,
    mnemonicHint: item.mnemonicHint,
    partOfSpeech: item.partOfSpeech,
    status: 'pending',
  });
  await updateDraftContent(draftId, content);
}

// --- Helpers ---

async function getDraftById(draftId: string): Promise<PathBuilderDraft | null> {
  const rows = await sql`
    SELECT * FROM path_builder_drafts WHERE id = ${draftId}
  `;
  return (rows[0] as PathBuilderDraft) ?? null;
}

// --- Access Check ---

export async function getUserCustomPathCount(userId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM paths
    WHERE user_id = ${userId} AND type = 'custom'
  `;
  return (rows[0] as { count: number })?.count ?? 0;
}

export async function canCreatePath(userId: string, isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const count = await getUserCustomPathCount(userId);
  return count < 1; // Free users get 1 lifetime custom path
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add lib/services/path-builder-service.ts
git commit -m "feat: add path builder service with draft CRUD and vocab actions"
```

---

### Task 10: Path Builder Action API Endpoint

**Files:**
- Create: `app/api/tutor/path-builder/action/route.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PathBuilderActionSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import {
  getDraftBySessionId,
  handleVocabAction,
  updateDraftPhase,
} from '@/lib/services/path-builder-service';
import { getTutorSessionById } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = PathBuilderActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { sessionId, action, itemType, tempId } = parsed.data;

    const tutorSession = await getTutorSessionById(sessionId);
    if (!tutorSession || tutorSession.user_id !== session.user.id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (tutorSession.mode !== 'path_builder') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Not a path builder session' },
        { status: 400 }
      );
    }

    const draft = await getDraftBySessionId(sessionId);
    if (!draft) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No draft found for this session' },
        { status: 404 }
      );
    }

    if (action === 'advance_phase') {
      const phaseOrder = ['discovery', 'vocabulary', 'phrases', 'dialogues', 'confirm', 'completed'] as const;
      const currentIdx = phaseOrder.indexOf(draft.current_phase as typeof phaseOrder[number]);
      if (currentIdx < 0 || currentIdx >= phaseOrder.length - 1) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Cannot advance from current phase' },
          { status: 400 }
        );
      }

      if (draft.current_phase === 'vocabulary') {
        const keptCount = draft.draft_content.vocabulary.filter((v) => v.status === 'kept').length;
        if (keptCount === 0) {
          return NextResponse.json<ApiResponse<null>>(
            { data: null, error: 'Keep at least one vocabulary word before advancing' },
            { status: 400 }
          );
        }
      }

      const nextPhase = phaseOrder[currentIdx + 1];
      await updateDraftPhase(draft.id, nextPhase);
      return NextResponse.json<ApiResponse<{ phase: string }>>(
        { data: { phase: nextPhase }, error: null }
      );
    }

    if ((action === 'keep' || action === 'remove') && itemType === 'vocabulary' && tempId) {
      const updatedContent = await handleVocabAction(draft.id, tempId, action);
      return NextResponse.json<ApiResponse<{ content: typeof updatedContent }>>(
        { data: { content: updatedContent }, error: null }
      );
    }

    if (action === 'different' && itemType === 'vocabulary' && tempId) {
      const updatedContent = await handleVocabAction(draft.id, tempId, 'remove');
      return NextResponse.json<ApiResponse<{ content: typeof updatedContent; needsAlternative: boolean }>>(
        { data: { content: updatedContent, needsAlternative: true }, error: null }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add app/api/tutor/path-builder/action/route.ts
git commit -m "feat: add path builder action API endpoint"
```

---

### Task 11: Tutor Service Extension

**Files:**
- Modify: `lib/services/tutor-service.ts`

Key functions: `startSession` (~line 20-60), `sendMessage` (~line 111-189).
Existing imports are at lines 1-17.

- [ ] **Step 1: Add imports (at top of file)**

After existing imports, add:
```typescript
import { createDraft, getDraftBySessionId } from '@/lib/services/path-builder-service';
import { buildPathBuilderDiscoveryPrompt, buildPathBuilderVocabPrompt } from '@/lib/ai/tutor-prompts';
import type { PathBuilderScenarioContext } from '@/types/database';
```

- [ ] **Step 2: Modify startSession — add path_builder branch**

In `startSession`, the system prompt is currently built on ~lines 37-44. Change the prompt building from:
```typescript
  const systemPrompt = buildTutorSystemPrompt({
    languageName: language.name,
    mode,
    scenario,
    knownWords,
    dueWords,
    adaptiveContext: adaptiveCtx,
  });
```
to:
```typescript
  let systemPrompt: string;

  if (mode === 'path_builder') {
    systemPrompt = buildPathBuilderDiscoveryPrompt({
      languageName: language.name,
      scenarioContext: { scenario: '', proficiency: '', subtopics: [], preferences: [] },
      knownWords,
      adaptiveContext: adaptiveCtx,
    });
  } else {
    systemPrompt = buildTutorSystemPrompt({
      languageName: language.name,
      mode,
      scenario,
      knownWords,
      dueWords,
      adaptiveContext: adaptiveCtx,
    });
  }
```

- [ ] **Step 3: Modify startSession — create draft after session**

After the greeting is saved and before the return statement (~line 58), add:
```typescript
  if (mode === 'path_builder') {
    await createDraft(userId, session.id, languageId);
  }
```

- [ ] **Step 4: Modify sendMessage — add path_builder branch**

In `sendMessage`, there are currently two branches for prompt selection (~lines 135-169):
1. `if (session.mode === 'guided_conversation' && session.scene_id)` → uses `buildGuidedConversationPrompt`
2. `else` → uses `buildTutorSystemPrompt`

Add a new branch between them for `path_builder`:

```typescript
  } else if (session.mode === 'path_builder') {
    const draft = await getDraftBySessionId(sessionId);
    const knownWords = await getUserKnownWords(userId, session.language_id);

    if (draft && draft.current_phase === 'vocabulary') {
      const scenarioCtx = (draft.scenario_context ?? {}) as PathBuilderScenarioContext;
      const confirmedVocab = draft.draft_content.vocabulary
        .filter((v) => v.status === 'kept')
        .map((v) => ({ word: v.word, meaning: v.meaning }));

      systemPrompt = buildPathBuilderVocabPrompt({
        languageName: language.name,
        scenarioContext: {
          scenario: scenarioCtx.scenario ?? '',
          proficiency: scenarioCtx.proficiency ?? 'beginner',
          subtopics: scenarioCtx.subtopics ?? [],
          preferences: scenarioCtx.preferences ?? [],
        },
        knownWords,
        adaptiveContext: adaptiveCtx,
        confirmedVocab,
      });
    } else {
      systemPrompt = buildPathBuilderDiscoveryPrompt({
        languageName: language.name,
        scenarioContext: {
          scenario: (draft?.scenario_context as PathBuilderScenarioContext)?.scenario ?? '',
          proficiency: (draft?.scenario_context as PathBuilderScenarioContext)?.proficiency ?? '',
          subtopics: (draft?.scenario_context as PathBuilderScenarioContext)?.subtopics ?? [],
          preferences: (draft?.scenario_context as PathBuilderScenarioContext)?.preferences ?? [],
        },
        knownWords,
        adaptiveContext: adaptiveCtx,
      });
    }
```

The full if/else chain becomes:
1. `guided_conversation` with scene_id
2. `path_builder` (new)
3. Everything else

- [ ] **Step 5: Verify build**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add lib/services/tutor-service.ts
git commit -m "feat: extend tutor service to handle path_builder mode"
```

---

### Task 12: TutorChat Integration

**Files:**
- Modify: `components/tutor/TutorChat.tsx`

- [ ] **Step 1: Add vocabStatuses state (after line 66)**

```typescript
  const [vocabStatuses, setVocabStatuses] = useState(() => new Map<string, 'pending' | 'kept' | 'removed'>());
```

- [ ] **Step 2: Add reset effect for vocabStatuses (after the auto-start effect, ~line 93)**

```typescript
  useEffect(() => {
    if (!sessionId) {
      setVocabStatuses(new Map());
    }
  }, [sessionId]);
```

- [ ] **Step 3: Add handlePathVocabAction callback (after handleMicToggle, ~line 99)**

```typescript
  const handlePathVocabAction = useCallback(
    async (word: string, action: 'keep' | 'remove' | 'different') => {
      if (!sessionId) return;

      setVocabStatuses((prev) => {
        const next = new Map(prev);
        next.set(word, action === 'keep' ? 'kept' : 'removed');
        return next;
      });

      try {
        const res = await fetch('/api/tutor/path-builder/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            action,
            itemType: 'vocabulary',
            tempId: word,
          }),
        });

        if (!res.ok) {
          setVocabStatuses((prev) => {
            const next = new Map(prev);
            next.set(word, 'pending');
            return next;
          });
        }

        if (action === 'different') {
          onSendMessage(`Can you suggest a different word instead of "${word}"?`);
        }
      } catch {
        setVocabStatuses((prev) => {
          const next = new Map(prev);
          next.set(word, 'pending');
          return next;
        });
      }
    },
    [sessionId, onSendMessage]
  );
```

- [ ] **Step 4: Pass new props to ChatBubble in messages loop (~line 124)**

Replace:
```typescript
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                vocabMap={vocabMap}
                onWordTap={handleWordTap}
              />
```
with:
```typescript
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                vocabMap={vocabMap}
                onWordTap={handleWordTap}
                onPathVocabAction={activeMode === 'path_builder' ? handlePathVocabAction : undefined}
                vocabStatuses={activeMode === 'path_builder' ? vocabStatuses : undefined}
              />
```

- [ ] **Step 5: Verify build**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add components/tutor/TutorChat.tsx
git commit -m "feat: wire up path builder vocab interactions in TutorChat"
```

---

## Verification

After all 12 tasks, verify the full end-to-end flow via Playwright MCP:

1. Navigate to `localhost:8000/api/auth/test-login` to authenticate
2. Navigate to `/` — verify dashboard loads with "Continue Learning" card
3. Navigate to `/tutor` — verify 6 mode cards visible (including "Build a Path")
4. Select "Build a Path" — verify discovery conversation starts
5. Type: "I'm visiting Bali next month and want to learn to haggle at markets"
6. Continue 2-3 exchanges until tutor transitions to vocabulary
7. Verify `[PHASE_TRANSITION: Vocabulary|...]` renders as a visual divider
8. Verify `[PATH_VOCAB: ...]` cards render with word, romanization, meaning, mnemonic
9. Click "Keep" on a card — verify it turns green with checkmark
10. Click "Remove" on a card — verify it fades with strikethrough
11. Click "Different" — verify card fades and tutor receives alternative request
12. End session — verify summary renders
13. Navigate to `/paths` — verify paths page loads normally
14. Navigate to `/review` — verify review page loads normally
15. Select a different tutor mode (e.g., Free Chat) — verify existing modes still work
