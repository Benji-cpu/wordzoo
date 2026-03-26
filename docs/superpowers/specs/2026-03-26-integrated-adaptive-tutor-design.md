# Integrated Adaptive Tutor — Design Spec

**Date:** 2026-03-26
**Status:** Draft
**Goal:** Transform the AI tutor from a standalone chat page into an always-available, context-aware learning companion that adapts to each student's weaknesses and feeds conversation practice directly into the spaced repetition system.

---

## 1. Problem Statement

The current tutor works well as an isolated feature — 5 conversation modes, streaming chat, vocabulary-aware prompts, guided scene conversations. But it operates in a silo:

- **No SRS feedback loop** — words practiced in conversation don't update spaced repetition intervals. A student could nail a word in conversation but still get quizzed on it as "due."
- **No adaptive difficulty** — the tutor sends the same style regardless of whether the student is struggling or breezing through.
- **No performance tracking** — sessions are saved but there's no analysis of accuracy, correction patterns, or which modes help retention.
- **No session continuity** — every conversation starts fresh with no memory of past sessions.
- **Tutor is a separate destination** — students navigate TO the tutor page rather than having the tutor woven into their learning flow.

## 2. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI pattern | Global floating panel (Tutor Layer) | Always available without navigation disruption. Context flows naturally from current page. |
| SRS impact | Full review credit for correct word usage | Conversation IS practice. Correct production = quality 4, corrected = quality 3. |
| Weakness detection | SRS data + AI correction analysis | SRS catches vocabulary weaknesses; AI catches grammar/structural patterns. Combined = complete picture. |
| Session memory | Hybrid: structured profile + recent session summaries | Gets the teacher-student relationship feel without needing full conversation recall. |
| Nudge approach | Proactive smart triggers with cooldowns | The tutor reaches out at strategic moments, but respects dismissals and doesn't spam. |

## 3. UI Architecture: The Tutor Layer

### 3.1 Global TutorProvider

A `<TutorProvider>` wraps the entire `(app)` layout. It manages:
- Session state (active session, conversation history)
- Panel open/close state
- Current page context
- Active nudge

### 3.2 Floating Action Button (FAB)

- Bottom-right corner on every page inside the `(app)` route group
- Shows a subtle pulse animation when there's an active nudge
- Badge indicator for pending suggestions
- Tap to open the tutor panel

### 3.3 Tutor Panel

- **Desktop:** Slide-out drawer from the right, 400px wide, overlays content
- **Mobile:** Full-screen bottom sheet that slides up
- **States:**
  1. **Collapsed** — just the FAB
  2. **Quick mode** — small popover for 1-2 exchange contextual help (e.g., tap a word and ask "what does this mean in context?")
  3. **Full session** — the slide-out panel with full chat, mode selection, session controls

### 3.4 Context Awareness

Each page registers its context with the TutorProvider via a `useTutorContext()` hook:

| Page | Context provided |
|------|-----------------|
| Learn | `{ page: 'learn', sceneId, currentWord, phase }` |
| Review | `{ page: 'review', currentWord, direction, streak }` |
| Dashboard | `{ page: 'dashboard', dueWords, nextScene }` |
| Paths | `{ page: 'paths', pathId, currentScene }` |

When the tutor opens, it uses this context to:
- Auto-suggest a conversation mode
- Pre-populate relevant vocabulary
- Offer contextual quick actions ("Explain this word", "Practice this phrase", "Help me with this scene")

### 3.5 Existing `/tutor` Page

The dedicated tutor page remains for focused full-screen sessions. The panel and page share session state — opening the panel while on the tutor page shows the current conversation.

## 4. Learner Profile & Adaptive Intelligence

### 4.1 Database: `learner_profiles` Table

```sql
CREATE TABLE learner_profiles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
  weakness_patterns JSONB DEFAULT '[]',
  topics_covered JSONB DEFAULT '[]',
  correction_history JSONB DEFAULT '{}',
  proficiency_estimate TEXT DEFAULT 'beginner',
  session_count INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  total_practice_minutes INT DEFAULT 0,
  recent_session_summaries JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, language_id)
);
```

**JSONB Schemas:**

`weakness_patterns`:
```json
[
  { "type": "vocabulary", "pattern": "number words", "severity": "high", "examples": ["satu/dua confusion"], "last_seen": "2026-03-25" },
  { "type": "grammar", "pattern": "question word order", "severity": "medium", "examples": ["Kamu mau apa? vs Apa kamu mau?"], "last_seen": "2026-03-24" }
]
```

`topics_covered`:
```json
[
  { "topic": "ordering food", "frequency": 3, "last_practiced": "2026-03-25", "scene_ids": ["uuid1"] },
  { "topic": "directions", "frequency": 1, "last_practiced": "2026-03-20", "scene_ids": ["uuid2"] }
]
```

`recent_session_summaries` (rolling window of last 5):
```json
[
  {
    "session_id": "uuid",
    "date": "2026-03-25",
    "mode": "role_play",
    "duration_seconds": 180,
    "highlight": "Practiced market negotiation, struggled with price numbers",
    "words_practiced": ["harga", "berapa", "mahal"],
    "words_corrected": ["murah"],
    "accuracy_rate": 0.75
  }
]
```

### 4.2 Service: `lib/services/learner-profile-service.ts`

**Functions:**

- **`getOrCreateProfile(userId, languageId)`** — returns the full learner profile, creates if missing
- **`updateFromSession(userId, sessionId)`** — called on session end:
  - Sends conversation to Gemini for correction pattern analysis
  - Updates weakness_patterns, topics_covered, correction_history
  - Appends to recent_session_summaries (cap at 5, FIFO)
  - Re-estimates proficiency from accumulated data
- **`getWeaknessReport(userId, languageId)`** — combines:
  - SRS data: words with ease_factor < 2.0, high fail rates
  - AI corrections: grammar patterns, word confusion pairs
  - Returns prioritized list of areas to work on
- **`buildAdaptiveContext(userId, languageId)`** — generates the context block for tutor system prompts

### 4.3 Adaptive Prompt Injection

The existing `buildTutorSystemPrompt` gets a new section from `buildAdaptiveContext`:

```
## Learner Profile
Proficiency: Elementary
Weaknesses: [number words (confused satu/dua), question formation (word order), -nya suffix usage]
Recent topics: [ordering food (2 days ago), directions (5 days ago)]
Recent session note: "Struggled with price negotiation vocabulary, got excited about food ordering"
Guidance: Prioritize number practice naturally. Avoid food ordering (recently covered). Build on enthusiasm.
```

This context is injected alongside the existing known/due words context. The tutor prompt instructions tell the model how to use it: prioritize weakness areas in natural conversation, reference past sessions when relevant, calibrate sentence complexity to proficiency level.

## 5. SRS Bridge — Conversation Practice Counts

### 5.1 Database: `tutor_word_reviews` Table

```sql
CREATE TABLE tutor_word_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('correct', 'corrected', 'introduced', 'missed')),
  srs_quality INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutor_word_reviews_session ON tutor_word_reviews(session_id);
CREATE INDEX idx_tutor_word_reviews_user ON tutor_word_reviews(user_id, created_at DESC);
```

### 5.2 Service: `lib/services/tutor-srs-bridge.ts`

**Functions:**

- **`analyzeMessageForWordUsage(message, role, knownWords, dueWords)`**
  - Scans user messages for active production of target words
  - Scans model messages for corrections and new word introductions
  - Returns: `{ wordsUsedCorrectly, wordsUsedIncorrectly, wordsCorrected, newWordsIntroduced }`

- **`recordConversationReviews(userId, sessionId, wordUsageMap)`**
  Called at session end:
  - Correct usage by student → `recordReview(userId, wordId, 'production', 'got_it')` (quality 4, full SRS credit)
  - Corrected by tutor → `recordReview(userId, wordId, 'production', 'hard')` (quality 3, partial credit)
  - New words introduced → `getOrCreateUserWord()` with status 'learning'
  - Saves all outcomes to `tutor_word_reviews` for analytics
  - Failed/missed words → no SRS update (neutral)

### 5.3 Enhanced Session Summary

The `tutor_sessions.summary` JSONB gains richer data:

```json
{
  "duration_seconds": 180,
  "message_count": 12,
  "words_practiced": ["harga", "berapa", "mahal"],
  "words_corrected": ["murah"],
  "new_words_introduced": ["diskon"],
  "srs_reviews_recorded": 4,
  "accuracy_rate": 0.75,
  "mode": "free_chat",
  "weakness_areas_addressed": ["number words"]
}
```

### 5.4 Flow Example

1. Student is in a free_chat session. The tutor uses **harga** (price) naturally.
2. Student responds: "Berapa harga ini?"
3. At session end, `analyzeMessageForWordUsage` detects the student actively produced "harga" and "berapa" correctly.
4. `recordConversationReviews` fires `recordReview` with quality 4 for both words.
5. SRS intervals for "harga" and "berapa" advance — they won't come up for review as soon.
6. If the student wrote "ini mahal sekali" but should have said "ini terlalu mahal", the tutor corrects → quality 3 for "mahal" (shorter interval).

## 6. Smart Nudges — The Tutor Reaches Out

### 6.1 Database: `tutor_nudges` Table

```sql
CREATE TABLE tutor_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL,
  context JSONB,
  shown_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutor_nudges_user ON tutor_nudges(user_id, created_at DESC);
```

### 6.2 Nudge Triggers

| Trigger | When | Nudge Message | Auto-mode |
|---------|------|---------------|-----------|
| `post_lesson` | After completing a scene's vocabulary phase | "You just learned 5 new words! Want to practice using them in conversation?" | `word_review` with scene words |
| `weak_words` | 3+ words with ease_factor < 1.8 | "I noticed you're having trouble with [words]. Want to work on those together?" | `word_review` with weak words |
| `review_streak` | After completing 10+ review cards | "Nice review session! Want to try using those words in a real conversation?" | `free_chat` with reviewed words |
| `scene_completion` | After finishing all phases of a scene | "You've mastered [scene]! Want to role-play [scenario]?" | `role_play` with scene context |
| `return_visit` | User returns after 2+ days away | "Welcome back! Last time we practiced [topic]. Want to pick up where we left off?" | Previous mode with profile context |
| `grammar_pattern` | AI detects repeated grammar error in corrections | "I've noticed you often mix up [pattern]. Want a quick grammar session?" | `grammar_glimpse` with specific pattern |

### 6.3 Service: `lib/services/nudge-service.ts`

**Functions:**

- **`getActiveNudge(userId, languageId, pageContext)`**
  - Evaluates all triggers against current state
  - Checks cooldowns (per-type cooldown period, typically 24h)
  - Checks dismissal history (don't re-show dismissed nudges of same type within 3 days)
  - Returns highest-priority nudge or null
  - Priority order: weak_words > post_lesson > grammar_pattern > scene_completion > review_streak > return_visit

- **`recordNudgeShown(nudgeId)`** — marks nudge as shown
- **`recordNudgeDismissed(nudgeId)`** — marks dismissed, extends cooldown
- **`recordNudgeAccepted(nudgeId)`** — marks accepted, logs for effectiveness tracking

### 6.4 Dashboard Integration

A new "Tutor Suggests" card on the dashboard (alongside Continue Learning and Quick Review):
- Shows the highest-priority nudge as an actionable card
- One-tap to launch a pre-configured tutor session with the right mode and context
- Below the nudge: learner profile insights ("Your strengths: greetings, food vocabulary. Working on: numbers, directions")

## 7. Modified Existing Files

| File | Changes |
|------|---------|
| `lib/services/tutor-service.ts` | Inject learner profile context into system prompts via `buildAdaptiveContext()`. Call `tutor-srs-bridge.recordConversationReviews()` in `endSession()`. Call `learner-profile-service.updateFromSession()` in `endSession()`. |
| `lib/ai/tutor-prompts.ts` | Add adaptive context section to `buildTutorSystemPrompt()`. Add learner profile instructions telling the model how to use weakness data, reference past sessions, and calibrate difficulty. |
| `app/(app)/layout.tsx` | Wrap children with `<TutorProvider>`. Render `<TutorFAB>` and `<TutorPanel>`. |
| `app/(app)/dashboard/page.tsx` | Fetch active nudge via nudge service. Add TutorNudgeCard component. Add learner insights display. |
| `app/(app)/learn/[sceneId]/page.tsx` | Register context with `useTutorContext()` hook. |
| `app/(app)/review/page.tsx` | Register context with `useTutorContext()` hook. |
| `app/(app)/paths/[pathId]/PathDetailClient.tsx` | Register context with `useTutorContext()` hook. |

## 8. New Files

| File | Purpose |
|------|---------|
| `lib/services/learner-profile-service.ts` | Profile CRUD, session analysis, weakness reports, adaptive context generation |
| `lib/services/tutor-srs-bridge.ts` | Conversation word tracking → SRS review recording |
| `lib/services/nudge-service.ts` | Nudge trigger evaluation, cooldown management, tracking |
| `lib/db/migrations/XXX_add_tutor_integration.sql` | New tables: learner_profiles, tutor_word_reviews, tutor_nudges. Alter tutor_sessions. |
| `components/tutor/TutorProvider.tsx` | Global context provider: session state, page context, panel state |
| `components/tutor/TutorPanel.tsx` | Slide-out drawer (desktop) / bottom sheet (mobile) with full chat UI |
| `components/tutor/TutorFAB.tsx` | Floating action button with nudge badge |
| `components/tutor/TutorNudgeCard.tsx` | Dashboard card showing active nudge suggestion |
| `components/tutor/TutorInsights.tsx` | Learner profile summary (strengths, weaknesses, stats) |
| `app/api/tutor/nudge/route.ts` | GET endpoint for fetching active nudge |
| `app/api/tutor/profile/route.ts` | GET endpoint for learner profile data |

## 9. Billing Impact

No changes to billing limits. The tutor panel uses the same `checkAccess('tutor_message')` enforcement as the existing tutor page. Free tier remains 3 messages/day across all tutor surfaces (panel + page share the same counter).

Nudges are free to display — they only consume a billing slot when the student accepts and starts a conversation.

## 10. Migration Safety

- All new tables are additive — no destructive changes to existing schema
- `tutor_sessions.learner_context` column is nullable — existing sessions unaffected
- Enhanced summary JSONB is backward-compatible — existing summaries keep working, new sessions get richer data
- Existing `/tutor` page continues to work as-is — the panel is a new surface, not a replacement

## 11. Success Criteria

- Students can open the tutor from any page without navigating away
- Tutor conversations feed word mastery data back into SRS (visible in review schedule changes)
- Tutor adapts its language and focus based on learner profile (observable in prompt differences between beginners and intermediates)
- Smart nudges appear at contextually appropriate moments with relevant suggestions
- Session summaries show accuracy rates and SRS reviews recorded
- Learner profile displays meaningful strength/weakness data on the dashboard
