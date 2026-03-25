# Visual Learning for Phrases and Dialogues

**Date:** 2026-03-25
**Status:** Approved

## Problem

The learn flow progresses through 6 phases (Dialogue > Phrases > Vocab > Patterns > Chat > Summary), but only the Vocab phase has visual mnemonic learning (keyword + bridge sentence + AI image). Phrases and dialogues are text-only. As content complexity increases, the visual learning disappears — the opposite of what learners need.

## Solution

Extend the keyword mnemonic system to phrases and dialogues by building on established word-level memories:

1. **Phrase Montage Step** — a new sub-step in the phrase phase showing a horizontal strip of mnemonic images (one per word), giving learners a visual representation of the phrase composed from memories they already formed.
2. **Dialogue Tappable Words** — vocabulary words in dialogue chat bubbles become tappable, showing a popover with the word's mnemonic image and keyword as an optional recall aid.

Patterns and guided conversation remain text-only.

## Design Decisions

- **Build on word mnemonics** (not standalone phrase illustrations) — phrases reuse the keyword images learners already know, reinforcing word-level memory through repetition in a new context.
- **Dedicated montage step** (not inline in PhraseCard) — gives the visual learning proper screen real estate as its own learning moment, consistent with how word-level mnemonics have their own MnemonicCard step.
- **Phrases + dialogue only** — patterns are grammar-focused (fill-in-the-blank) and guided conversation is free-form AI chat; visual mnemonics would be intrusive in both.

## Data Layer

### Fill `wordTexts` for all phrases

Many phrases in `dialogue-data.ts` have `wordTexts: []`. All phrases must have their constituent vocabulary words linked so `phrase_words` rows exist in the DB.

Example fixes:
- "Senang bertemu" -> `['senang']`
- "Terlalu mahal" -> `['mahal']`
- "Enak sekali!" -> `['enak']`

After updating, re-seed with `npm run db:seed` to populate `phrase_words`.

### New query: `getPhraseWordsWithMnemonics`

```
getPhraseWordsWithMnemonics(phraseIds: string[], userId: string)
```

Joins `phrase_words -> words -> mnemonics` using the same LATERAL subquery pattern from `getSceneWordsForLearning`. Returns an ordered array per phrase:

```ts
{
  phrase_id: string;
  word_id: string;
  word_text: string;
  word_en: string;
  position: number;
  image_url: string | null;
  keyword_text: string | null;
  bridge_sentence: string | null;
}
```

### New type: `ScenePhraseWithMnemonics`

```ts
interface PhraseWordMnemonic {
  word_id: string;
  word_text: string;
  word_en: string;
  position: number;
  image_url: string | null;
  keyword_text: string | null;
  bridge_sentence: string | null;
}

interface ScenePhraseWithMnemonics extends ScenePhrase {
  words: PhraseWordMnemonic[];
}
```

## Phrase Montage Step

### Flow change

Phrase sub-steps: `show -> montage -> quiz` (was `show -> quiz`).

The montage step is skipped if zero words in the phrase have mnemonics (same pattern as MnemonicCard being skipped for words without mnemonics).

### PhraseMontage component

Full-screen card (same card style as MnemonicCard) with three sections:

**Top:** Full phrase in target language (large text) + English translation below.

**Middle:** Horizontal strip of word cards, one per word in phrase order:
- **Words with mnemonics:** Square thumbnail of the mnemonic image with keyword text below (e.g., "SAWYER"). Tappable to show an overlay with the bridge sentence.
- **Words without mnemonics:** Styled text card (same dimensions as image cards) showing the word text and English meaning.
- **Words not in vocab:** (proper nouns, function words) Simple text label card.

**Bottom:** "Continue" button to advance to quiz.

### Sizing

- Mobile (390px): 3-word phrase = ~110px wide cards; 4-word phrase = ~85px wide cards. Images are square.
- Desktop: Larger proportionally.

### Tap interaction

Tapping an image card shows a brief overlay with keyword + bridge sentence. Tap again or tap elsewhere to dismiss. Not a full navigation — just a quick recall prompt.

## Dialogue Tappable Words

### TappableWord component

Wraps vocabulary words in dialogue chat bubbles:
- Subtle dotted underline to signal interactivity (enough to be noticed, not enough to clutter the dialogue)
- On tap: popover/tooltip with mnemonic image (~80px), keyword text, and English meaning
- Tap anywhere to dismiss

### Word matching

Simple string tokenizer splits each dialogue line's `text_target` and matches against the scene's vocabulary words. Uses already-loaded scene vocabulary data (no new DB queries needed).

- Words in dialogue that aren't in this scene's vocab: not tappable (plain text)
- After all dialogue lines are revealed, tappable words remain interactive for review

### Data flow

Scene vocabulary words (already fetched by `getSceneFlowData`) are passed to `DialoguePlayer` as a prop. The matching and rendering happens client-side.

## What Stays Text-Only

- **Pattern exercises** — grammar-focused fill-in-the-blank; visual mnemonics don't add value
- **Guided conversation** — free-form AI chat; visual aids would be intrusive
- **Summary** — shows keyword text per word already; could show thumbnails in a future iteration

## Files Modified

| File | Change |
|---|---|
| `lib/db/dialogue-data.ts` | Fill empty `wordTexts` arrays for all phrases |
| `lib/db/scene-flow-queries.ts` | New `getPhraseWordsWithMnemonics` query |
| `types/database.ts` | New `PhraseWordMnemonic` and `ScenePhraseWithMnemonics` types |
| `components/learn/PhraseMontage.tsx` | **NEW** — montage step component |
| `components/learn/TappableWord.tsx` | **NEW** — tappable word with mnemonic popover |
| `components/learn/DialoguePlayer.tsx` | Integrate TappableWord, accept vocab data prop |
| `components/learn/SceneFlowClient.tsx` | Add `montage` sub-step to phrase phase, pass mnemonic data |
| `app/(app)/learn/[sceneId]/page.tsx` | Fetch phrase mnemonic data in server component |

## Verification

1. `npm run db:seed` completes — `phrase_words` populated for all phrases
2. Navigate through phrase phase — montage step appears between show and quiz
3. Montage shows image thumbnails for words with mnemonics, text cards for others
4. Tap an image card — overlay shows keyword + bridge sentence
5. Montage step skipped for phrases with zero word mnemonics
6. Dialogue lines show dotted underlines on vocab words
7. Tap a word in dialogue — popover shows mnemonic image + keyword
8. `npm run build` succeeds
