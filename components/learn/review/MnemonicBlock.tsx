'use client';

import { MnemonicImage } from '@/components/shared/MnemonicImage';
import type { ItemView } from './item-view';

/** Bridge sentences mark the sound-alike in CAPITALS; give them weight. */
function renderBridge(sentence: string) {
  const parts = sentence.split(/\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/);
  return parts.map((part, i) =>
    /^[A-Z]{2,}(?:\s+[A-Z]{2,})*$/.test(part) ? (
      <span key={i} className="font-extrabold not-italic text-[color:var(--accent-indonesian)]">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * The memory hook for an item: picture, sound-alike keyword, bridge sentence.
 * Shown after a miss and on a teach card, never before an answer (it would
 * give the answer away). For a phrase, the words it is built from follow.
 */
export function MnemonicBlock({ view, withWords = false }: { view: ItemView; withWords?: boolean }) {
  const m = view.mnemonic;
  const words = withWords ? view.phraseWords : [];
  if (!m && words.length === 0) return null;
  return (
    <div className="mt-3 text-left">
      {m?.imageUrl && (
        <div className="relative w-full rounded-xl overflow-hidden bg-surface-inset max-h-[30vh]">
          <MnemonicImage
            src={m.imageUrl}
            alt={m.keyword ? `Memory picture: ${m.keyword}` : `Memory picture for ${view.text}`}
            variant={view.kind === 'phrase' ? 'phrase-composite' : 'review'}
            keyword={m.keyword ?? undefined}
            zoomCaption={m.bridge ?? m.description}
            speech={null}
          />
        </div>
      )}
      {m?.keyword && (
        <p className="mt-2 text-sm text-text-secondary">
          Sounds like &ldquo;<span className="text-accent-id font-semibold">{m.keyword}</span>&rdquo;
        </p>
      )}
      {m?.bridge && <p className="mt-1 text-base text-foreground italic">{renderBridge(m.bridge)}</p>}
      {words.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {words.map((w) => (
            <li key={w.word_id} className="text-sm text-foreground">
              <span className="font-semibold">{w.word_text}</span>
              <span className="text-text-secondary"> = {w.word_en}</span>
              {w.keyword_text && (
                <span className="text-text-secondary">
                  {' '}
                  (sounds like &ldquo;<span className="text-accent-id">{w.keyword_text}</span>&rdquo;)
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
