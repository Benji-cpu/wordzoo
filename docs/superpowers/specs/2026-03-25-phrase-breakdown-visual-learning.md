# Phrase Breakdown Visual Learning

**Date**: 2026-03-25
**Status**: Draft

## Problem

WordZoo's learning flow has a visual gap at the phrase level. Individual words get a full mnemonic experience (keyword + AI image + bridge sentence), but phrases skip straight from a text card to a quiz. As complexity builds from words to phrases to patterns, the visual learning experience drops off entirely. Users lose the memory technique that makes word learning effective.

## Design Decisions

- **Word breakdown overlay with tap-to-reveal accordion** — reuses existing word mnemonic images rather than generating new phrase-level images
- **Contextual bridge sentence** — connects individual word meanings to the phrase's idiomatic meaning
- **Text-only fallback** — words without mnemonic images get a compact text card (meaning, pronunciation, part of speech)
- **New component between PhraseCard and PhraseQuiz** — clean separation of concerns, fits existing state machine pattern

## Architecture

### New Component: PhraseBreakdown

`components/learn/PhraseBreakdown.tsx`

**Props:**
```typescript
interface PhraseBreakdownProps {
  phrase: ScenePhraseWithWords;
  words: LearnWord[];           // all scene words (with mnemonics)
  onContinue: () => void;
}
```

**Layout (top to bottom):**

1. **Phrase header** — full phrase in target language (large, accent color) + English meaning + pronunciation button
2. **Word chips row** — each word in phrase order as a tappable pill/chip. Punctuation excluded. Visual indicator (subtle glow or icon) on words that have mnemonic images.
3. **Accordion expansion area** — below the chips. Tapping a word expands its card:
   - **With mnemonic**: mnemonic image (compact, ~150px), keyword text (e.g., *sounds like "cobbler"*), bridge sentence
   - **Without mnemonic**: word text, romanization, meaning, part of speech — compact text card with same styling minus image
   - One word expanded at a time — tapping another collapses the first
4. **Bridge sentence** — appears at bottom after user has tapped at least one word. Connects literal word meanings to the phrase's idiomatic meaning. Uses phrase's `literal_translation` + `usage_note` formatted as: *"Literally '{literal_translation}' — {usage_note}"*
5. **Advance** — "Continue" footer tap area or swipe right

**Word matching logic**: The component receives `phrase.words` (array of `{ word_id, position }` from the `phrase_words` table). It matches each `word_id` against the `words` array to find the `LearnWord` with its mnemonic data. Words are displayed in `position` order. Words present in `phrase.words` but not found in the `LearnWord[]` array are rendered as chips with the word text only (extracted from the phrase by position) — tapping shows a minimal "unknown word" card. This handles edge cases where phrase-word links reference words outside the scene's word list.

**Internal state**: The component maintains `expandedWordId: string | null` to track which word's accordion is open. Bridge sentence visibility is derived from whether `expandedWordId` has ever been non-null (tracked via a `hasExpandedAny: boolean` state).

**Pronunciation**: The phrase header plays `phrase.audio_url` via the existing `PronunciationButton` component. Hidden when `audio_url` is null.

### State Machine Change

Current phrase flow state:
```typescript
{ phase: 'phrases'; phraseIndex: number; step: 'show' | 'quiz' }
```

New phrase flow state:
```typescript
{ phase: 'phrases'; phraseIndex: number; step: 'show' | 'breakdown' | 'quiz' }
```

Transition flow per phrase:
```
PhraseCard ('show') → PhraseBreakdown ('breakdown') → PhraseQuiz ('quiz')
    tap to continue       tap to continue              correct answer
```

### SceneFlowClient Changes

File: `components/learn/SceneFlowClient.tsx`

1. **Props type** — change `phrases: ScenePhrase[]` to `phrases: ScenePhraseWithWords[]` in `SceneFlowClientProps` (add import for `ScenePhraseWithWords` from `scene-flow-queries.ts`)
2. **FlowState type** — add `'breakdown'` to the phrases step union
3. **handlePhraseContinue()** — change from advancing to `'quiz'` to advancing to `'breakdown'`
4. **New handler: handleBreakdownContinue()** — advances from `'breakdown'` to `'quiz'`
5. **Render logic** — add case for `step === 'breakdown'` that renders `<PhraseBreakdown>`
6. **Swipe handler** — add `else if (state.phase === 'phrases' && state.step === 'breakdown') handleBreakdownContinue()` to the touch event `useEffect`
7. **Resume logic** — no sub-step persistence exists in the database (`UserSceneProgress` stores only `current_phase` and `phase_index`). Resume always starts at `step: 'show'` for the current phrase index. This is acceptable UX — re-showing the phrase card before breakdown is harmless.

### Data Flow

No new database tables or queries needed. All required data is already fetched:

- `flowData.phrases` → `ScenePhraseWithWords[]` (includes `words: { word_id, position }[]`)
- `words` → `LearnWord[]` (includes `mnemonic?: { keyword_text, bridge_sentence, image_url, scene_description }`)

The `PhraseBreakdown` component cross-references these two arrays to match each phrase word to its full `LearnWord` data (including mnemonic if it exists).

### Bridge Sentence Strategy

For v1, the bridge sentence is composed from existing phrase data:
- Format: *"Literally '{literal_translation}' — {usage_note}"*
- If only `literal_translation` exists: *"Literally '{literal_translation}'"*
- If neither exists: no bridge shown (graceful degradation)

This avoids adding new database fields or seed data. If we find the auto-composed bridges feel too generic, we can add a dedicated `breakdown_bridge` field to `PhraseData` in a future iteration.

## Visual Design

Follows existing card-based UI patterns:

- **Card container**: `max-w-lg`, rounded borders, `bg-card-surface`, `animate-slide-up` entrance
- **Word chips**: inline-flex row, each chip `px-3 py-1.5 rounded-full border border-card-border bg-card-surface cursor-pointer hover:bg-white/10 transition-all`
- **Active chip** (expanded): `border-accent bg-accent/10 text-accent`
- **Accordion card**: slides down below chips with `animate-slide-up`, contains image (if mnemonic) + text
- **Mnemonic image**: `w-full max-h-[150px] object-cover rounded-lg` — compact but visible
- **Text-only fallback**: same card layout, just meaning/pronunciation/POS without image
- **Bridge sentence**: `text-sm text-muted-foreground italic` at bottom, appears with fade-in after first word tap

## Scope & What's NOT Included

- **No new image generation** — reuses existing word mnemonic images
- **No new database schema** — uses existing `phrase_words` join + `LearnWord` mnemonics
- **No changes to PhraseCard** — it stays as-is, PhraseBreakdown is a new step after it
- **No changes to PhraseQuiz** — it stays as-is
- **No pattern-level visual treatment** — patterns remain fill-in-blank (future enhancement)
- **No phrase-level SRS changes** — SRS recording still happens in PhraseQuiz as before

## Relationship to Current Plan

This feature extends the existing plan (which covers mnemonic data for belok/dekat + shared AnswerButton/useShuffled extraction). The shared component refactoring and mnemonic data additions proceed as planned — this spec adds the PhraseBreakdown component on top. The two are independent and can be implemented in either order.

## Files Modified

| File | Change |
|------|--------|
| `components/learn/PhraseBreakdown.tsx` | **NEW** — tap-to-reveal word breakdown component |
| `components/learn/SceneFlowClient.tsx` | Change `phrases` prop type to `ScenePhraseWithWords[]`, add `'breakdown'` step to FlowState, new handler, render case, swipe handler update |
| `types/database.ts` | No change needed — existing types sufficient |
| `lib/db/scene-flow-queries.ts` | No change needed — already fetches phrase-word associations |

## Verification

1. Navigate to a dialogue scene (e.g., Scene 1 "Selamat! (Hello!)")
2. Complete dialogue phase, enter phrases phase
3. See PhraseCard for first phrase → tap to continue
4. See PhraseBreakdown — verify word chips appear in phrase order
5. Tap a word with a mnemonic → verify image + keyword + bridge sentence expand
6. Tap a word without a mnemonic → verify text-only card expands
7. Tap a different word → verify first word collapses, new one expands
8. Verify bridge sentence appears at bottom after tapping a word
9. Tap continue → verify PhraseQuiz loads correctly
10. Complete all phrases → verify transition to vocabulary phase works
11. `npm run build` succeeds with no TypeScript errors
