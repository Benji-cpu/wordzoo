import type { ReactNode } from 'react';

/**
 * Renders inline markdown (**bold** and *italic*) as React elements.
 * Does NOT handle block-level markdown (headers, lists, code blocks).
 */
export function InlineMarkdown({ text }: { text: string }): ReactNode {
  // Match **bold** first (greedy for double asterisks), then *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  if (parts.length === 1) return text;

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
