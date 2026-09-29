/**
 * How a Daily Dose text splits into lines. Shared by InfoByteCard, which
 * interleaves each Portuguese sentence with its English, and by the content
 * test, which checks the two sides split into the same number of lines.
 * Kept apart from index.ts so the client card doesn't bundle the content.
 */
export function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
}
