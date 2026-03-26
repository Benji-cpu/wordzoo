# Tutor Path Builder — Design Spec

**Date:** 2026-03-26
**Status:** Draft
**Goal:** Enable users to create custom learning paths through natural conversation with the AI tutor. The tutor discovers the user's scenario, then builds a layered path (vocabulary → phrases → dialogues) with interactive building blocks and progressive voice integration.

---

## 1. Problem Statement

WordZoo has curated learning paths (premade, travel) but no way for users to create paths tailored to their specific needs. A user going to Bali to haggle at markets, or wanting to chat with their Indonesian partner's family, has to piece together generic vocabulary that may not match their actual scenario.

The tutor is already a conversational AI — it understands context, adapts to levels, and speaks the target language. The natural extension is to let the tutor *build* a custom path from a conversation about what the user actually needs.

## 2. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Entry point | Tutor-first (new "Build a Path" mode) | Users already describe scenarios to the tutor. Natural fit. No separate wizard needed. |
| Content structure | Layered: vocabulary → phrases → dialogues | Progressive complexity matches learning science. Each layer builds on the previous. |
| Voice integration | Progressive: text → pronunciation → full voice | Matches the layers — text for word learning, pronunciation for phrases, full voice for dialogues. |
| Visual interaction | Interactive building blocks in chat | Extends the existing rich segment architecture. Cards appear inline with Keep/Remove/Different actions. |
| Conversation flow | Hybrid: organic discovery → structured building | Natural conversation for understanding needs, then structured phases for guaranteed completeness. |
| Monetization | Freemium with limits | Free users get 1 limited path; premium gets unlimited with full features. Low AI cost per path makes this viable. |

## 3. User Flow

### 3.1 Entry Point

A 6th mode card in the existing `ModeSelector` component:

| Icon | Label | Description |
|------|-------|-------------|
| 🛠 | Build a Path | Describe a scenario and I'll create a custom learning path for you |

Selecting this mode starts a `path_builder` tutor session.

### 3.2 The Hybrid Flow

```
┌─────────────────────────────────────────┐
│  MODE SELECT: "Build a Path"            │
└────────────────┬────────────────────────┘
                 │
    ┌────────────▼────────────────┐
    │   ORGANIC: Discovery        │  2-5 messages
    │   "Tell me about your       │  Natural conversation
    │    scenario..."             │  Tutor asks follow-ups
    └────────────┬────────────────┘
                 │ Tutor determines it has enough context
                 │ "Got it! Let me build your path."
    ┌────────────▼────────────────┐
    │   PHASE 1: Vocabulary       │  Text only
    │   [PATH_VOCAB] cards        │  Keep/Remove/Different
    │   15-30 words generated     │  User curates
    └────────────┬────────────────┘
                 │ User confirms vocabulary set
    ┌────────────▼────────────────┐
    │   PHASE 2: Phrases          │  + Pronunciation
    │   [PATH_PHRASE] cards       │  Tap-to-hear
    │   10-20 phrases generated   │  Keep/Remove/Request more
    └────────────┬────────────────┘
                 │ User confirms phrase set
    ┌────────────▼────────────────┐
    │   PHASE 3: Dialogues        │  + Full voice
    │   [PATH_DIALOGUE] cards     │  Expandable preview
    │   3-5 dialogue scripts      │  Role-play preview
    └────────────┬────────────────┘
                 │ User confirms dialogues
    ┌────────────▼────────────────┐
    │   CONFIRM: Blueprint        │  Full summary card
    │   [PATH_BLUEPRINT] card     │  Title, description, counts
    │   "Create Path" button      │  Saves to /paths
    └─────────────────────────────┘
```

### 3.3 Phase Transitions

The tutor manages phase transitions through its system prompt. At each transition:

1. Tutor emits a `[PHASE_TRANSITION]` segment (rendered as a subtle visual divider)
2. Context from previous phases is included in the next prompt
3. User can ask to go back to a previous phase at any time via natural language

The transition from organic → structured is the most important seam. The tutor's system prompt instructs it to transition when it has gathered: the scenario context, the user's proficiency level, specific sub-topics, and any preferences.

## 4. Chat Segment Types

### 4.1 New Segments

Extending the existing message parser (`lib/tutor/message-parser.ts`) with 5 new segment types:

#### PATH_VOCAB
```
[PATH_VOCAB: berapa|buh-RAH-pah|how much / how many|At the BEAR-APA (bear spa), you ask "how much?" for the honey massage]
```

Rendered as an interactive card:
- Word in target script (bold, large)
- Romanization
- English meaning
- Mnemonic hint (collapsible)
- Action buttons: **Keep** (green), **Remove** (red), **Different** (neutral)

#### PATH_PHRASE
```
[PATH_PHRASE: Berapa harganya?|How much is this?|berapa=how much + harga=price + nya=the/this|Point at an item and say this to start haggling]
```

Rendered as:
- Phrase in target script (bold)
- English meaning
- Word-by-word breakdown (collapsible)
- Usage note
- Tap-to-hear pronunciation button (progressive voice kicks in here)
- Action buttons: **Keep**, **Remove**

#### PATH_DIALOGUE
```
[PATH_DIALOGUE: Market Haggling|You're at a fabric stall in Ubud market|Buyer: Berapa harganya? / Seller: Tiga ratus ribu. / Buyer: Wah, mahal! Bisa kurang? / Seller: Untuk kamu, dua ratus lima puluh.|Buyer: How much is this? / Seller: Three hundred thousand. / Buyer: Wow, expensive! Can you reduce? / Seller: For you, two hundred fifty thousand.]
```

Rendered as an expandable card:
- Title and context description
- Dialogue lines (target + English side by side)
- Expand/collapse toggle
- Role-play preview button (plays TTS for the other speaker, user speaks their lines)
- Action buttons: **Keep**, **Remove**, **Edit Context**

#### PATH_BLUEPRINT
```
[PATH_BLUEPRINT: Market Haggling in Bali|Master the art of bargaining at Balinese markets|20|12|3]
```

Rendered as a summary card:
- Path title (editable)
- Description (editable)
- Layer counts: "20 words · 12 phrases · 3 dialogues"
- Visual layer indicators (colored bars)
- **Create Path** primary action button
- **Edit** secondary button (returns to previous phases)

#### PHASE_TRANSITION
```
[PHASE_TRANSITION: Vocabulary|Now let's pick the essential words for your scenario]
```

Rendered as a subtle visual divider:
- Phase name in a small badge
- Brief description
- Thin horizontal line separating phases

### 4.2 Existing Segments (unchanged)

The path builder conversation can also use existing segment types:
- `text` — normal conversation during discovery
- `suggestion` — suggestion chips ("Tell me more about the market" / "I also want restaurant phrases")
- `vocab_word` — inline vocabulary annotations during discovery
- `context_card` — cultural context during dialogues

## 5. New Components

### 5.1 PathVocabCard

**File:** `components/tutor/path-builder/PathVocabCard.tsx`

Interactive vocabulary building block card. Props:
- `word: string` — word in target script
- `romanization: string`
- `meaning: string`
- `mnemonicHint: string`
- `onKeep: () => void`
- `onRemove: () => void`
- `onDifferent: () => void`
- `status: 'pending' | 'kept' | 'removed'`

Visual states: pending (neutral border), kept (green left border + checkmark), removed (faded, strikethrough).

### 5.2 PathPhraseCard

**File:** `components/tutor/path-builder/PathPhraseCard.tsx`

Phrase building block with pronunciation. Props:
- `phrase: string`
- `meaning: string`
- `breakdown: string` — word-by-word breakdown
- `usageNote: string`
- `onKeep: () => void`
- `onRemove: () => void`
- `onPlayAudio: () => void`
- `status: 'pending' | 'kept' | 'removed'`

Includes a small speaker icon that triggers TTS for the phrase.

### 5.3 PathDialogueCard

**File:** `components/tutor/path-builder/PathDialogueCard.tsx`

Expandable dialogue preview. Props:
- `title: string`
- `context: string`
- `linesTarget: string[]` — dialogue lines in target language
- `linesEn: string[]` — English translations
- `speakers: string[]`
- `onKeep: () => void`
- `onRemove: () => void`
- `expanded: boolean`
- `onToggleExpand: () => void`

Shows title + context when collapsed. Full dialogue lines when expanded.

### 5.4 PathBlueprintCard

**File:** `components/tutor/path-builder/PathBlueprintCard.tsx`

Final summary card. Props:
- `title: string`
- `description: string`
- `vocabCount: number`
- `phraseCount: number`
- `dialogueCount: number`
- `onConfirm: () => void`
- `onEdit: () => void`
- `isCreating: boolean` — loading state during path creation

### 5.5 PhaseIndicator

**File:** `components/tutor/path-builder/PhaseIndicator.tsx`

Subtle divider between phases. Props:
- `phase: string`
- `description: string`

### 5.6 ModeSelector Update

Add a 6th card to the existing `components/tutor/ModeSelector.tsx`:

```typescript
{
  mode: 'path_builder',
  icon: Hammer, // or Wand2 from lucide
  label: 'Build a Path',
  description: 'Describe a scenario and I\'ll create a custom learning path',
  color: 'purple', // distinct from other modes
}
```

No scenario input field (unlike role_play) — the discovery conversation handles that.

## 6. Database Changes

### 6.1 New Table: `path_builder_drafts`

Tracks in-progress path builds. Enables resuming and prevents data loss if the user leaves mid-build.

```sql
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
  draft_content JSONB NOT NULL DEFAULT '{
    "vocabulary": [],
    "phrases": [],
    "dialogues": []
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_path_builder_drafts_user
  ON path_builder_drafts(user_id);
```

**`scenario_context` JSONB shape:**
```typescript
{
  scenario: string;         // "haggling at Bali markets"
  proficiency: string;      // "beginner"
  subtopics: string[];      // ["fabrics", "souvenirs", "food stalls"]
  preferences: string[];    // ["polite forms", "numbers"]
  targetLanguage: string;   // "id" (Indonesian)
}
```

**`draft_content` JSONB shape:**
```typescript
{
  vocabulary: Array<{
    tempId: string;
    word: string;
    romanization: string;
    meaning: string;
    mnemonicHint: string;
    partOfSpeech: string;
    status: 'pending' | 'kept' | 'removed';
  }>;
  phrases: Array<{
    tempId: string;
    phrase: string;
    meaning: string;
    breakdown: string;
    usageNote: string;
    status: 'pending' | 'kept' | 'removed';
  }>;
  dialogues: Array<{
    tempId: string;
    title: string;
    context: string;
    linesTarget: string[];
    linesEn: string[];
    speakers: string[];
    status: 'pending' | 'kept' | 'removed';
  }>;
}
```

### 6.2 Tutor Session Mode Extension

Extend the mode constraint on `tutor_sessions`:

```sql
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
```

### 6.3 Daily Usage Extension

Track custom path creation for free tier limits:

```sql
ALTER TABLE daily_usage
  ADD COLUMN IF NOT EXISTS custom_paths_created INTEGER NOT NULL DEFAULT 0;
```

### 6.4 Path Creation (on confirm)

When the user confirms the blueprint, the draft is converted into real records:

1. Insert into `paths` (type='custom', user_id set)
2. For each kept vocabulary item:
   - Find or create a `words` record (match by text + language_id, or create new)
   - Insert into `path_words`
   - Find or create `mnemonics` record with the mnemonic hint
3. Create a `scenes` record (scene_type='dialogue') for the path
4. For each kept phrase:
   - Insert into `scene_phrases`
   - Link constituent words via `phrase_words`
5. For each kept dialogue:
   - Insert into `scene_dialogues` (one row per line, with speaker and sort_order)
6. Create `user_paths` record (status='active')
7. Mark draft as `completed`
8. Increment `daily_usage.custom_paths_created`

## 7. API Surface

### 7.1 Extended: `POST /api/tutor/message`

The existing message endpoint handles `path_builder` mode. The mode-specific system prompt changes based on the draft's `current_phase`. The endpoint:

1. Reads the draft's `current_phase` and `scenario_context`
2. Selects the appropriate system prompt (discovery, vocabulary, phrases, or dialogues)
3. Includes confirmed items from previous phases as context
4. Streams the response (existing streaming infrastructure)
5. Client-side parser extracts building block segments and renders them as interactive cards

### 7.2 New: `POST /api/tutor/path-builder/action`

Handles building block interactions.

**Request body:**
```typescript
{
  sessionId: string;
  action: 'keep' | 'remove' | 'different' | 'advance_phase';
  itemType?: 'vocabulary' | 'phrase' | 'dialogue';
  tempId?: string; // which item to act on
}
```

**Behavior:**
- `keep`/`remove`: Updates the item's status in `draft_content`
- `different`: Marks item as removed + sends a follow-up message asking the tutor for an alternative
- `advance_phase`: Moves `current_phase` forward (e.g., vocabulary → phrases). Validates that at least some items are kept.

### 7.3 New: `POST /api/tutor/path-builder/confirm`

Finalizes the draft into a real path.

**Request body:**
```typescript
{
  sessionId: string;
  title?: string;   // override if user edited
  description?: string;
}
```

**Response:**
```typescript
{
  data: {
    pathId: string;
    title: string;
    wordCount: number;
    phraseCount: number;
    dialogueCount: number;
  }
}
```

### 7.4 New: `GET /api/tutor/path-builder/draft`

Check for and resume an in-progress draft.

**Query params:** `languageId`

**Response:**
```typescript
{
  data: {
    draft: PathBuilderDraft | null;
    canCreate: boolean;  // false if free user has hit limit
  }
}
```

## 8. Prompt Architecture

### 8.1 Discovery Prompt

```
You are helping the user design a custom learning path for {language}.
Your goal is to understand their scenario thoroughly before building.

Ask about:
- The specific situation (where, who, what)
- Their current level (beginner/intermediate/advanced)
- Any specific sub-topics or vocabulary areas
- How soon they need this (urgency)
- Any preferences (formal/informal, specific dialects)

Typically 2-5 exchanges is enough. When you have a clear picture of:
✓ The scenario context
✓ The user's proficiency level
✓ At least 2-3 specific sub-topics
✓ Any stated preferences

Respond with something like "I've got a great picture of what you need!
Let me start building your path." and emit:
[PHASE_TRANSITION: Vocabulary|Building your essential word list]

Then begin generating vocabulary cards.
```

### 8.2 Vocabulary Prompt

```
You are building the vocabulary layer of a custom learning path.

Scenario: {scenario_context}
User level: {proficiency}
Sub-topics: {subtopics}

Generate 15-25 essential vocabulary words for this scenario.
For each word, emit a [PATH_VOCAB] segment:
[PATH_VOCAB: word|romanization|meaning|mnemonic_hint]

The mnemonic_hint should use the keyword method — find an English word
that sounds like the target word and create a vivid mental image connecting
the sound to the meaning.

Group related words together (e.g., all number words, then all
descriptive words, then all action words).

After emitting all words, say something like "Those are the essential
words for your scenario. Tap ✓ to keep the ones you want, ✗ to remove
any, or ↻ for alternatives. When you're happy, tell me to move on
to phrases!"
```

### 8.3 Phrases Prompt

```
You are building the phrases layer of a custom learning path.

Scenario: {scenario_context}
Confirmed vocabulary: {kept_vocabulary}

Generate 10-15 essential phrases for this scenario using the confirmed
vocabulary where possible. For each phrase, emit:
[PATH_PHRASE: phrase|meaning|word_by_word_breakdown|usage_note]

[PHASE_TRANSITION: Phrases|Building key phrases using your vocabulary]

Focus on phrases the user would actually say in this scenario.
Order from most essential to nice-to-have.
Include at least 2-3 response phrases (things others might say TO the user).
```

### 8.4 Dialogues Prompt

```
You are building the dialogues layer of a custom learning path.

Scenario: {scenario_context}
Confirmed vocabulary: {kept_vocabulary}
Confirmed phrases: {kept_phrases}

Generate 3-5 realistic dialogue scripts for this scenario.
Each dialogue should use the confirmed vocabulary and phrases.
For each dialogue, emit:
[PATH_DIALOGUE: title|context|target_lines_pipe_separated|english_lines_pipe_separated]

[PHASE_TRANSITION: Dialogues|Creating realistic conversations for practice]

Dialogues should progress in complexity:
1. Simple exchange (2-3 lines each)
2. Medium exchange with a complication
3. Extended conversation with cultural nuances
```

### 8.5 Blueprint Prompt

After the user confirms dialogues, the client generates the `[PATH_BLUEPRINT]` segment locally (no AI call needed — it's just a summary of the confirmed items).

## 9. Progressive Voice Integration

| Phase | User Input | Tutor Output | Audio Features |
|-------|-----------|--------------|----------------|
| Discovery | Text + speech-to-text | Text | None |
| Vocabulary | Text + card taps | Text + cards | None (text-only learning) |
| Phrases | Text + card taps | Text + cards | Tap-to-hear TTS on phrase cards |
| Dialogues | Text + voice | Text + cards | Full TTS playback, role-play mode |
| Saved path (practice) | Voice | Voice | Full bidirectional voice |

### 9.1 Phrase Audio

When a user taps the speaker icon on a `PathPhraseCard`, the client calls the existing Google Cloud TTS API (same as word pronunciation) to generate audio for the full phrase. This can be cached client-side in IndexedDB.

### 9.2 Dialogue Voice

Dialogue cards include a "Play" button that reads the full dialogue aloud with TTS, alternating speakers. A "Role-play" button plays only the non-user speaker's lines, pausing for the user to speak their lines (using the existing `useSpeechInput` hook for speech-to-text).

## 10. Freemium Limits

| Feature | Free | Premium |
|---------|------|---------|
| Custom paths created | 1 (lifetime) | Unlimited |
| Vocabulary per path | 15 words max | 30 words |
| Phrases per path | 8 phrases max | 20 phrases |
| Dialogues per path | 1 dialogue | 5 dialogues |
| Voice in dialogues | No | Yes |
| Resume drafts | No (single session) | Yes |

Free users see the limit before starting ("You can create 1 custom path for free. Upgrade for unlimited."). If they've used their free path, the mode card shows a lock icon with "Premium" badge.

Enforcement points:
- `ModeSelector`: Check `canCreate` from draft endpoint
- `POST /api/tutor/path-builder/action` with `advance_phase`: Enforce item count limits
- `POST /api/tutor/path-builder/confirm`: Final validation

## 11. Cost Analysis

Using Gemini 2.0 Flash pricing:

| Phase | Estimated Tokens | Cost |
|-------|-----------------|------|
| Discovery conversation (3-5 exchanges) | ~10-15K | ~$0.002 |
| Vocabulary generation (20 words) | ~8-12K | ~$0.002 |
| Phrase generation (15 phrases) | ~8-12K | ~$0.002 |
| Dialogue generation (3 scripts) | ~10-15K | ~$0.003 |
| Refinements & re-rolls | ~5-10K | ~$0.002 |
| **Total per path** | **~40-65K** | **~$0.01-0.02** |

At 1,000 daily path creations: ~$10-20/day. At 100 daily (more realistic near-term): ~$1-2/day.

## 12. Implementation Phases

### Phase 1: Foundation
- `path_builder_drafts` table migration
- Extend `tutor_sessions` mode constraint
- Basic path builder prompt templates (discovery + vocabulary)
- `PathVocabCard` component
- `PhaseIndicator` component
- ModeSelector update with 6th card
- `/api/tutor/path-builder/action` endpoint
- Message parser extensions for `PATH_VOCAB` and `PHASE_TRANSITION`

### Phase 2: Full Building
- Phrase and dialogue prompt templates
- `PathPhraseCard` and `PathDialogueCard` components
- `PathBlueprintCard` component
- Message parser extensions for `PATH_PHRASE`, `PATH_DIALOGUE`, `PATH_BLUEPRINT`
- `/api/tutor/path-builder/confirm` endpoint (draft → real path conversion)
- Freemium limit enforcement

### Phase 3: Voice & Polish
- Phrase TTS integration (tap-to-hear on phrase cards)
- Dialogue playback (sequential TTS)
- Role-play mode (TTS + speech-to-text alternation)
- Draft resume flow (`/api/tutor/path-builder/draft` endpoint)
- Free tier UI (lock icon, limit messaging)

### Phase 4: SRS Integration
- Generated words feed into `user_words` SRS tracking
- Generated phrases feed into `user_phrases` SRS tracking
- Custom paths appear in `/review` alongside curated path content
- Path progress tracking via existing `user_scene_progress`

## 13. What This Reuses

| Existing Infrastructure | How It's Used |
|------------------------|---------------|
| `paths` table (type='custom') | Stores the final custom path |
| `scenes`, `scene_words`, `scene_phrases`, `scene_dialogues` | Stores path content layers |
| `user_paths`, `user_scene_progress` | Tracks learning progress |
| Tutor chat UI (`TutorChat`, `ChatBubble`) | Hosts the building conversation |
| Message parser (`message-parser.ts`) | Extended with new segment types |
| `useTutorChat` hook | Handles streaming for builder conversation |
| `ModeSelector` | Gets one more card |
| SRS engine (`lib/srs/`) | Schedules reviews for generated content |
| Billing service | Enforces freemium limits |
| Google Cloud TTS | Powers phrase/dialogue audio |
| `useSpeechInput` hook | Voice input during dialogues |

## 14. Open Questions

1. **Should custom paths appear in the main `/paths` page or a separate "My Paths" section?** — Recommendation: separate "My Paths" tab/section on the paths page, distinct from curated paths.

2. **Can users share custom paths with other users?** — Possible future feature. The database supports it (paths are just rows), but the UI and permissions need design. Out of scope for v1.

3. **Should the tutor remember past custom paths when creating new ones?** — Useful to avoid duplicating vocabulary. Could check existing custom path words against new generation. Nice-to-have for v2.

4. **How to handle words that already exist in the `words` table?** — When converting draft to real path, match by `(text, language_id)`. If the word exists, link to it. If not, create it. This ensures SRS progress is shared across paths.
