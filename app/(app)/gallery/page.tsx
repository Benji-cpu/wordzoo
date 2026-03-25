import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLearnedWordsWithMnemonics } from '@/lib/db/queries';
import { MnemonicGalleryCard } from '@/components/learn/MnemonicGalleryCard';
import Link from 'next/link';

export default async function GalleryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const words = await getLearnedWordsWithMnemonics(session.user.id);

  if (words.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-4xl mb-4">🖼️</p>
        <h2 className="text-xl font-bold text-foreground mb-1">Your Gallery is Empty</h2>
        <p className="text-text-secondary mb-6 text-center">
          Learn words to build your mnemonic collection. Each word creates a vivid memory scene.
        </p>
        <Link
          href="/paths"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent-id text-white font-medium hover:bg-accent-id/90 transition-colors"
        >
          Start Learning
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mnemonic Gallery</h1>
        <p className="text-sm text-text-secondary mt-1">
          {words.length} memory scene{words.length !== 1 ? 's' : ''} collected
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {words.map(word => (
          <MnemonicGalleryCard key={word.word_id} word={word} />
        ))}
      </div>
    </div>
  );
}
