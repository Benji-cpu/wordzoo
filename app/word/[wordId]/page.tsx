import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getPublicWordData } from '@/lib/db/community-queries';
import { trackReferralClick } from '@/lib/services/share-service';

interface Props {
  params: Promise<{ wordId: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { wordId } = await params;
  const data = await getPublicWordData(wordId);

  if (!data) {
    return { title: 'WordZoo' };
  }

  const title = `I learned '${data.word_text}' in ${data.language_name} — it means '${data.meaning_en}'!`;
  const description = data.keyword_text
    ? `It sounds like '${data.keyword_text.toUpperCase()}'. Try this memory trick.`
    : `Learn ${data.language_name} vocabulary with memorable mnemonics.`;

  const ogImage = data.mnemonic_id
    ? `/api/share/${data.mnemonic_id}/image?format=square`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 1200 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PublicWordPage({ params, searchParams }: Props) {
  const { wordId } = await params;
  const { ref } = await searchParams;

  const data = await getPublicWordData(wordId);

  // Handle referral tracking
  if (ref) {
    const cookieStore = await cookies();
    const existingRef = cookieStore.get('wz_ref');
    if (!existingRef) {
      // Set cookie via response headers (handled below)
      // Track the click
      try {
        await trackReferralClick(ref, null);
      } catch {
        // Ignore tracking errors
      }
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Word not found</h1>
          <Link href="/login" className="text-accent-default hover:underline">
            Go to WordZoo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-card-border px-4 py-3">
        <nav className="flex items-center justify-between max-w-lg mx-auto">
          <span className="text-lg font-bold text-foreground">WordZoo</span>
          <Link
            href="/login"
            className="text-sm text-accent-default hover:underline"
          >
            Log in
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto p-4 pb-24">
        {/* Word */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{data.word_text}</h1>
          {data.romanization && (
            <p className="text-lg text-text-secondary mb-1">{data.romanization}</p>
          )}
          <p className="text-xl text-text-secondary">
            &ldquo;{data.meaning_en}&rdquo;
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {data.part_of_speech} in {data.language_name}
          </p>
        </div>

        {/* Mnemonic */}
        {data.mnemonic_id && (
          <div className="glass-card p-4 mb-8">
            {data.image_url && (
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-surface-inset">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.image_url}
                  alt={data.scene_description ?? ''}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {data.keyword_text && (
              <p className="text-lg text-foreground mb-2">
                Sounds like <span className="font-bold">&ldquo;{data.keyword_text}&rdquo;</span>
              </p>
            )}

            {data.scene_description && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {data.scene_description}
              </p>
            )}

            {data.upvote_count != null && data.upvote_count > 0 && (
              <p className="text-xs text-text-secondary mt-3">
                {data.upvote_count} {data.upvote_count === 1 ? 'person' : 'people'} found this helpful
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="text-center space-y-4">
          <Link
            href="/signup"
            className="block w-full py-3 rounded-xl text-center font-medium text-white bg-accent-default hover:bg-accent-default/80 transition-colors"
          >
            Try WordZoo Free
          </Link>
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-default hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      {/* Referral cookie script */}
      {ref && (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.cookie="wz_ref=${encodeURIComponent(ref)};path=/;max-age=${30 * 24 * 60 * 60};SameSite=Lax";`,
          }}
        />
      )}
    </div>
  );
}
