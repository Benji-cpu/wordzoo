export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'vocab_word'; word: string; meaning: string }
  | { type: 'suggestion'; options: string[] }
  | { type: 'correction'; original: string; corrected: string; explanation?: string }
  | { type: 'grammar_note'; title: string; body: string }
  | { type: 'context_card'; label: string; content: string }
  | { type: 'path_vocab'; word: string; romanization: string; meaning: string; mnemonicHint: string }
  | { type: 'phase_transition'; phase: string; description: string };

// Matches [MARKER: content] patterns and **word** (meaning) patterns
const MARKER_REGEX =
  /\[SUGGEST:\s*([^\]]+)\]|\[CORRECT:\s*([^\]]+)\]|\[GRAMMAR:\s*([^\]]+)\]|\[CONTEXT:\s*([^\]]+)\]|\[PATH_VOCAB:\s*([^\]]+)\]|\[PHASE_TRANSITION:\s*([^\]]+)\]|\*\*([^*]+)\*\*\s*\(([^)]+)\)/g;

function parseSuggest(inner: string): MessageSegment {
  const options = inner.split('|').map((s) => s.trim()).filter(Boolean);
  return { type: 'suggestion', options };
}

function parseCorrect(inner: string): MessageSegment {
  // Format: original -> corrected | explanation
  const pipeIdx = inner.indexOf('|');
  const arrowPart = pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner;
  const explanation = pipeIdx >= 0 ? inner.slice(pipeIdx + 1).trim() : undefined;

  const arrowIdx = arrowPart.indexOf('->');
  if (arrowIdx < 0) {
    // Malformed — no arrow separator, treat as text
    return { type: 'text', content: `[CORRECT: ${inner}]` };
  }

  const original = arrowPart.slice(0, arrowIdx).trim();
  const corrected = arrowPart.slice(arrowIdx + 2).trim();
  return { type: 'correction', original, corrected, explanation: explanation || undefined };
}

function parseGrammar(inner: string): MessageSegment {
  const pipeIdx = inner.indexOf('|');
  if (pipeIdx < 0) {
    return { type: 'text', content: `[GRAMMAR: ${inner}]` };
  }
  const title = inner.slice(0, pipeIdx).trim();
  const body = inner.slice(pipeIdx + 1).trim();
  return { type: 'grammar_note', title, body };
}

function parseContext(inner: string): MessageSegment {
  const pipeIdx = inner.indexOf('|');
  if (pipeIdx < 0) {
    return { type: 'context_card', label: 'Scene', content: inner };
  }
  const label = inner.slice(0, pipeIdx).trim();
  const content = inner.slice(pipeIdx + 1).trim();
  return { type: 'context_card', label, content };
}

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

function addText(segments: MessageSegment[], text: string) {
  if (text) {
    segments.push({ type: 'text', content: text });
  }
}

export function parseMessageContent(raw: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MARKER_REGEX.lastIndex = 0;

  while ((match = MARKER_REGEX.exec(raw)) !== null) {
    // Text before the match
    addText(segments, raw.slice(lastIndex, match.index));

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

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  addText(segments, raw.slice(lastIndex));

  return segments.length > 0 ? segments : [{ type: 'text', content: raw }];
}

/** Extract suggestion options from parsed segments */
export function extractSuggestions(segments: MessageSegment[]): string[] {
  for (const seg of segments) {
    if (seg.type === 'suggestion') return seg.options;
  }
  return [];
}
