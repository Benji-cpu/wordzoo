import Image from 'next/image';
import { Card } from '@/components/ui/Card';

/**
 * A real mnemonic from the Indonesian stream, rendered in the same visual
 * language as the in-app MnemonicCard so visitors see the actual product.
 * Uses the locally-bundled /try demo asset so the landing page never depends
 * on external storage.
 */
const SHOWCASE = {
  word: 'kucing',
  language: 'Indonesian',
  meaning: 'cat',
  keyword: 'COUCHING',
  imageUrl: '/landing/kucing.webp',
};

export function MnemonicShowcase() {
  return (
    <section className="px-6 py-12 max-w-lg mx-auto w-full">
      <h2 className="text-2xl font-bold text-foreground text-center mb-2">
        See how it works
      </h2>
      <p className="text-sm text-text-secondary text-center mb-6">
        Every word comes with a sound-alike keyword and a scene you can&rsquo;t forget.
      </p>
      <Card className="overflow-hidden">
        <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[color:var(--text-secondary)] mb-2">
          Remember it like this
        </p>
        <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
          <span
            className="font-display text-[color:var(--color-fox-primary)] leading-none"
            style={{ fontSize: 'clamp(1.35rem, 5.5vw, 1.75rem)' }}
          >
            {SHOWCASE.word}
          </span>
          <span className="text-[14px] text-[color:var(--text-secondary)] font-semibold">
            sounds like
          </span>
          <span
            className="font-extrabold text-[color:var(--foreground)]"
            style={{ fontSize: 'clamp(1.1rem, 4.8vw, 1.35rem)' }}
          >
            &ldquo;{SHOWCASE.keyword}&rdquo;
          </span>
        </div>
        <div className="mb-2 flex items-baseline gap-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[color:var(--text-secondary)]">
            means
          </span>
          <span className="text-[15px] font-bold text-[color:var(--foreground)]">
            {SHOWCASE.meaning}
          </span>
        </div>
        <p className="text-[14px] sm:text-[15px] italic text-[color:var(--foreground)] mb-3 leading-snug">
          A fluffy{' '}
          <span className="font-extrabold not-italic text-[color:var(--accent-indonesian)]">CAT</span>{' '}
          <span className="font-extrabold not-italic text-[color:var(--accent-indonesian)]">COUCHING</span>{' '}
          down on a velvet sofa.
        </p>
        <Image
          src={SHOWCASE.imageUrl}
          alt={`Mnemonic scene for ${SHOWCASE.word}`}
          width={640}
          height={640}
          className="w-full rounded-[18px]"
          unoptimized
        />
        <p className="text-xs text-text-secondary text-center mt-3">
          One of hundreds of AI-illustrated memory tricks in {SHOWCASE.language} and beyond.
        </p>
      </Card>
    </section>
  );
}
