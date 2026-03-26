# Path Studio: Tutor-Driven Custom Path Creation

## Context

WordZoo's current custom path creation is a single text input that generates vocabulary-only (legacy scene) paths. Users describe a topic, Gemini generates words, done. This works for quick paths but misses the opportunity for:

- **Richer content**: dialogue scenes with the full 6-phase learning flow
- **User intent capture**: understanding *why* someone needs to learn, not just *what*
- **Visual, multi-modal interaction**: users want to tap, speak, and see — not just type
- **Monetization**: a premium experience that justifies per-path pricing for free users

Path Studio is a split-panel interface where users co-create learning paths with the AI tutor through a visual + conversational experience. The tutor asks questions, presents tappable visual elements (chips, cards, sliders), and builds a path preview in real-time. The result is a rich dialogue-scene path tailored to the user's specific real-world scenario.

## MVP Scope

**In scope (v1):**
- Path Studio page (`/paths/studio`) with split-panel layout
- Tutor-guided 5-step intake conversation with visual elements
- Two entry points: tutor chat intent detection → studio, and direct "Path Studio" button
- Tiered generation: vocabulary + anchor dialogues upfront
- Hybrid billing: premium unlimited, free users pay per-path
- Keep existing "Quick Create" alongside Path Studio

**Out of scope (v2):**
- Progressive unlock (tutor adds phrases/patterns/dialogues as user learns)
- Evolution timeline on path detail page
- Advanced content generation on demand (phrases, pattern exercises)

---

## User Experience

### Entry Point A: From Tutor Conversation

1. User opens tutor (panel or `/tutor` page) and describes a learning need
2. Tutor detects path-creation intent (e.g., "help me learn market haggling", "build me a path for...")
3. Tutor responds: "I'd love to build a custom path for that! Let me open Path Studio."
4. Inline CTA card: "Open Path Studio — I'll bring your context with me"
5. Navigates to `/paths/studio` with pre-filled context (scenario, language, level from learner profile)
6. Studio conversation starts at Step 2 (situations drill-down), skipping the scenario question

### Entry Point B: Direct Access

1. From `/paths` page: "Path Studio" button in the custom paths section (alongside "Quick Create")
2. From dashboard: "Create a new path" CTA card
3. Navigates to `/paths/studio` with language pre-selected from active path
4. Studio conversation starts at Step 1 (scenario description)

### Quick Create (Preserved)

The existing custom path flow (text input → instant vocab-only generation) remains as "Quick Create" — a fast, simple alternative to Path Studio. Path Studio produces richer paths; Quick Create is for speed.

---

## Path Studio Layout

### Desktop (>= 768px): Side-by-Side

| Left Panel (45%) | Right Panel (55%) |
|---|---|
| Tutor conversation | Path preview |
| Text input + mic button | Path title + description |
| Inline visual elements (chips, cards) | Scene cards (confirmed / building) |
| | "Generate My Path" CTA |

### Mobile (< 768px): Tabbed

- Two tabs: "Chat" and "Preview"
- Chat tab shows tutor conversation with full-width visual elements
- Preview tab shows the building path
- Green pulsing dot on Preview tab when path updates
- Swipe or tap to switch tabs

---

## 5-Step Intake Conversation

Steps are conversational, not rigid. The tutor can compress/skip based on how much context the user provides.

### Step 1: Scenario Description
- **Tutor asks**: "What scenario are you preparing for?"
- **Visual elements**: Category chips (Shopping/Markets, Restaurants, Travel, Social, Emergency, Business, Family, Custom)
- **Input**: Tap a chip OR describe freely via text/voice
- **Preview update**: Path title + description appear
- **AI processing**: Extract scenario from user input

### Step 2: Situations Drill-Down
- **Tutor asks**: "Within [scenario], what specific situations matter?"
- **Visual elements**: AI-generated sub-scenario chips (multi-select), contextual to Step 1
  - Example for "Bali Markets": Asking prices, Negotiating lower, Buying souvenirs, Comparing quality, Polite declining
- **Input**: Tap multiple chips AND/OR describe additional situations
- **Preview update**: Scene outlines appear (one per situation cluster)
- **AI processing**: Generate sub-scenarios from Step 1 context, extract selections

### Step 3: Difficulty & Level
- **Tutor asks**: "How confident are you in [language]?"
- **Visual elements**: 3 tappable cards — Beginner (no prior knowledge), Some Basics (know common words), Conversational (can hold basic chats)
- **Smart default**: If learner profile exists, tutor suggests the right level
- **Preview update**: Word count + difficulty indicator adjust

### Step 4: Focus Areas (Optional)
- **Tutor asks**: "Anything you want to focus on especially?"
- **Visual elements**: Multi-select chips — Speaking confidence, Listening comprehension, Reading signs/menus, Grammar patterns, Vocabulary breadth, Cultural context
- **Tutor may skip**: If context is already clear from Steps 1-3
- **Preview update**: Focus badges appear on relevant scenes

### Step 5: Review & Generate
- **Tutor summarizes**: "Here's what I've built for you!" with a conversational recap
- **Preview**: Complete path structure visible — all scenes, word counts, focus areas
- **User can**: Adjust (tutor asks "What would you like to change?" and user can revise any prior choice via text/voice — tutor updates the preview accordingly) or Confirm
- **On confirm**: "Generate My Path" button activates
- **After generation**: Redirect to path detail page

---

## Conversation Architecture

### Structured Messages

The studio conversation is not a regular tutor session. Each API response includes:

```typescript
interface StudioMessage {
  text: string;                    // Tutor's conversational text
  visualElements?: {
    type: 'chips' | 'cards' | 'difficulty' | 'confirmation';
    multiSelect?: boolean;
    options: Array<{
      id: string;
      label: string;
      emoji?: string;
      description?: string;
      selected?: boolean;
    }>;
  };
  pathPreview?: {
    title: string;
    description: string;
    wordCount: number;
    scenes: Array<{
      title: string;
      description: string;
      wordCount: number;
      status: 'confirmed' | 'building' | 'pending';
    }>;
  };
  intakeProgress: {
    step: 1 | 2 | 3 | 4 | 5;
    complete: boolean;
    canGenerate: boolean;
  };
}
```

### State Management

Client-side state in `PathStudioClient`:
- `intakeData`: accumulated scenario, situations, level, focus areas
- `messages`: conversation history
- `pathPreview`: current path preview state
- `currentStep`: which intake step is active
- `isGenerating`: path generation in progress

### Intent Detection (Tutor Entry)

When the regular tutor receives a message, a lightweight Gemini check classifies whether it's a path-creation request. If confidence > 0.8, the tutor offers to open Path Studio. Classification prompt is simple and fast (small context, boolean output).

---

## Path Generation

### Tiered Model

**Upfront generation (on "Generate My Path"):**
- Single Gemini call with full intake context
- Output: path metadata + 3-5 dialogue scenes with vocabulary + one anchor dialogue per scene
- Enhanced version of existing `custom-path-service.ts` prompt
- Scenes created as `scene_type='dialogue'` for 6-phase flow compatibility
- Word deduplication reuses existing `findWordByTextAndLanguage()`

**Generated scene content (MVP):**
- Scene title, description, context
- 6-10 vocabulary words per scene (with translations, romanization, parts of speech)
- One anchor dialogue (3-5 lines between speakers)
- Phrases and pattern exercises are empty (available for v2 progressive unlock)

**Deferred generation (v2):**
- Functional phrases generated when user reaches phrase phase
- Pattern exercises generated when user reaches patterns phase
- Additional dialogues generated based on tutor conversation observations

### Gemini Prompt Structure

```
SYSTEM: You are a language learning path designer for [language].
Given the user's scenario and preferences, create a structured learning path.

INTAKE CONTEXT:
- Scenario: [from Step 1]
- Situations: [from Step 2]
- Level: [from Step 3]
- Focus areas: [from Step 4]
- Known vocabulary: [from user's existing word list]

OUTPUT FORMAT: JSON matching the path + scenes + words + dialogues schema.
```

Temperature: 0.7 (focused but varied)

---

## Billing

### Hybrid Model

| User Type | Path Studio | Quick Create |
|---|---|---|
| Free | Per-path purchase ($2-4 via Stripe) | Not available (premium feature) |
| Premium | Unlimited (included in subscription) | Unlimited |

### Implementation

- New billing feature: `studio_path`
- Free users see price on "Generate My Path" button: "Generate My Path — $3"
- On click: Stripe checkout session → on success: generate path → redirect to path detail
- Premium users: direct generation, no payment step
- New `purchases` record type: `studio_path` (alongside existing `travel_pack`)

### Cost Considerations

- Path generation: ~1 Gemini call for intake conversation (spread across 5 steps) + 1 larger call for path generation
- Estimated Gemini cost per path: $0.01-0.03 (Flash pricing)
- Per-path revenue: $2-4 for free users, $0 for premium (amortized in subscription)
- Comfortable margin even at scale

---

## New Components & Files

### Pages
- `app/(app)/paths/studio/page.tsx` — Server component, auth gate, loads language/profile data

### Components
- `components/studio/PathStudioClient.tsx` — Main studio layout (split/tabbed), state management
- `components/studio/StudioChat.tsx` — Tutor conversation panel (messages + visual elements + input)
- `components/studio/StudioPreview.tsx` — Live path preview panel (scene cards, progress)
- `components/studio/RichMessage.tsx` — Renders visual element types (chips, cards, difficulty picker)
- `components/studio/StudioInput.tsx` — Text input + mic button (reuses `useSpeechInput` hook)

### Services
- `lib/services/studio-service.ts` — Orchestrates intake conversation, intent extraction, path generation
- `lib/ai/studio-prompts.ts` — Gemini prompts for conversation, sub-scenario generation, path generation

### API Routes
- `app/api/studio/chat/route.ts` — POST: send message, get structured response with visual elements
- `app/api/studio/generate/route.ts` — POST: generate path from completed intake
- `app/api/studio/suggestions/route.ts` — GET: generate sub-scenario chips for Step 2

### Reused Existing Code
- `lib/services/custom-path-service.ts` — `buildPath()` core logic for DB inserts
- `lib/db/queries.ts` — `findWordByTextAndLanguage()`, `insertWord()`, `insertPath()`, etc.
- `lib/hooks/useSpeechInput.ts` — Speech recognition hook
- `components/tutor/ChatBubble.tsx` — Message rendering patterns
- `components/tutor/ChatInput.tsx` — Input patterns
- `lib/services/billing-service.ts` — `checkAccess()`, usage tracking
- `lib/services/learner-profile-service.ts` — `buildAdaptiveContext()` for level detection

---

## Database Changes

### New Table: `studio_sessions`
```sql
CREATE TABLE studio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  language_id UUID NOT NULL REFERENCES languages(id),
  intake_data JSONB DEFAULT '{}',  -- accumulated scenario, situations, level, focus
  messages JSONB DEFAULT '[]',     -- conversation history
  path_preview JSONB,              -- current preview state
  status TEXT DEFAULT 'active',    -- active, completed, abandoned
  path_id UUID REFERENCES paths(id), -- linked path after generation
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Modified: `paths` table
- Add `'studio'` to the `type` check constraint (alongside premade, custom, travel)

### No other schema changes
- Scenes, dialogues, words, user progress — all existing tables work unchanged
- Studio paths create dialogue-type scenes that slot into the existing 6-phase flow

### Required SceneFlowClient Update

The existing `SceneFlowClient` (`components/learn/SceneFlowClient.tsx`) hardcodes phase transitions: dialogue → phrases → vocabulary → patterns → conversation → summary. It does not handle empty phases — if `phrases` array is empty, `handleDialogueComplete` sets `phraseIndex: 0` on an empty array, which breaks.

**Fix needed**: Update phase transition handlers to skip empty phases. When dialogue completes and phrases is empty, jump to vocabulary. When vocabulary completes and patterns is empty, jump to conversation. The back-navigation (`computePreviousState`) already handles this correctly (it checks `.length > 0` before jumping to a phase), but the forward transitions do not.

This is a prerequisite for studio paths, which have dialogue + vocabulary content but empty phrases and patterns in MVP.

---

## V2 Vision: Progressive Unlock

*Designed for, not built in MVP.*

### Concept
After the user starts learning their studio path, the tutor monitors progress through guided conversation phases. When it detects struggles or opportunities, it generates new content and adds it to the path.

### Triggers
- User struggles with a phrase → generate targeted pattern exercise
- User masters vocabulary in conversation → suggest advanced dialogue
- User completes all vocab in a scene → unlock phrases phase with generated content

### Data Model (v2)
- `path_evolution_log` table: records each unlock event
- `evolution_state` JSONB on `user_paths`: tracks what's been unlocked per scene
- Path detail page shows "evolution timeline" — visual history of growth

### UX (v2)
- Tutor mentions new content in chat: "I noticed you struggle with X. I've added a practice exercise."
- Visual badge on path page: "New content unlocked!"
- Evolution timeline shows the path's growth story

### Why MVP Supports This
- Studio paths use `scene_type='dialogue'` — all 6 phases structurally available
- Phases can be empty initially (no phrases/patterns) and populated later
- `studio_sessions` preserves full intake context for future generation
- Tiered generation infrastructure already in place

---

## Verification Plan

### After implementation, verify:

1. **Entry Point A**: Open tutor → say "build me a path for market haggling" → tutor offers Path Studio → click → studio opens with pre-filled context
2. **Entry Point B**: Go to `/paths` → click "Path Studio" → studio opens fresh with language pre-selected
3. **Intake Flow**: Complete all 5 steps using a mix of text input, voice input, and tapping visual elements
4. **Path Preview**: Confirm preview updates in real-time as conversation progresses
5. **Mobile Layout**: Test on 390px viewport — tabbed layout, green dot indicator, full-width chips
6. **Desktop Layout**: Test on 1024px+ — side-by-side panels, responsive preview
7. **Path Generation**: Click "Generate My Path" → path created with dialogue scenes → redirected to path detail
8. **Learning Flow**: Open generated path → verify scenes have vocabulary + anchor dialogue → complete a scene
9. **Billing (Free)**: As free user, verify Stripe checkout appears before generation
10. **Billing (Premium)**: As premium user, verify direct generation without payment
11. **Quick Create**: Verify existing custom path flow still works alongside Path Studio
