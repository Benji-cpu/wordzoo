import type { LearnWord } from '@/components/learn/LearnClient';

export interface DialogueSegment {
  type: 'word' | 'text';
  text: string;
  word?: LearnWord;
}

/**
 * Tokenize a dialogue line into segments of matched vocab words and plain text.
 * Uses longest-match-first to handle compound words like "terima kasih", "selamat pagi".
 */
export function tokenizeDialogueLine(
  textTarget: string,
  vocabWords: LearnWord[]
): DialogueSegment[] {
  if (vocabWords.length === 0) return [{ type: 'text', text: textTarget }];

  // Sort by text length descending for longest-match-first
  const sorted = [...vocabWords].sort((a, b) => b.word.text.length - a.word.text.length);

  // Find all matches with their positions
  const matches: { start: number; end: number; word: LearnWord }[] = [];
  const lowerText = textTarget.toLowerCase();

  for (const vw of sorted) {
    const wordLower = vw.word.text.toLowerCase();
    let searchFrom = 0;

    while (searchFrom < lowerText.length) {
      const idx = lowerText.indexOf(wordLower, searchFrom);
      if (idx === -1) break;

      const end = idx + wordLower.length;

      // Word boundary check: ensure we're not matching inside another word
      const charBefore = idx > 0 ? lowerText[idx - 1] : ' ';
      const charAfter = end < lowerText.length ? lowerText[end] : ' ';
      const isBoundaryBefore = !/[a-zA-Z]/.test(charBefore);
      const isBoundaryAfter = !/[a-zA-Z]/.test(charAfter);

      if (isBoundaryBefore && isBoundaryAfter) {
        // Check no overlap with existing matches
        const overlaps = matches.some(
          (m) => idx < m.end && end > m.start
        );
        if (!overlaps) {
          matches.push({ start: idx, end, word: vw });
        }
      }

      searchFrom = idx + 1;
    }
  }

  if (matches.length === 0) return [{ type: 'text', text: textTarget }];

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  // Build segments
  const segments: DialogueSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ type: 'text', text: textTarget.slice(cursor, match.start) });
    }
    segments.push({
      type: 'word',
      text: textTarget.slice(match.start, match.end),
      word: match.word,
    });
    cursor = match.end;
  }

  if (cursor < textTarget.length) {
    segments.push({ type: 'text', text: textTarget.slice(cursor) });
  }

  return segments;
}
