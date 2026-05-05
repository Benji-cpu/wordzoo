import type { ReactNode } from 'react';

// Convert leading "* " or "- " bullets on each line to a literal "• ".
// Done before inline parsing so the asterisk doesn't get treated as italics.
function normalizeBullets(text: string): string {
  return text.replace(/(^|\n)\s*[*\-]\s+/g, (_m, p1: string) => `${p1}• `);
}

/**
 * Renders inline markdown (**bold** and *italic*) as React elements.
 * Also converts leading list markers (`* `, `- `) to bullet characters so
 * tutor messages don't render raw asterisks.
 */
export function InlineMarkdown({ text }: { text: string }): ReactNode {
  const normalized = normalizeBullets(text);
  const parts = normalized.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  if (parts.length === 1) return normalized;

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
