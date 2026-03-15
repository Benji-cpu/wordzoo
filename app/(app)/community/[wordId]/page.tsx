import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getWordById } from '@/lib/db/queries';
import { getCommunityMnemonicsForWord, getCommunityCountForWord, getUserMnemonicForWord } from '@/lib/db/community-queries';
import { CommunityClient } from './CommunityClient';

interface Props {
  params: Promise<{ wordId: string }>;
}

export default async function CommunityPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { wordId } = await params;
  const word = await getWordById(wordId);

  if (!word) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-text-secondary">Word not found.</p>
      </div>
    );
  }

  const [items, total, userMnemonic] = await Promise.all([
    getCommunityMnemonicsForWord(wordId, session.user.id, 'top', 20, 0),
    getCommunityCountForWord(wordId),
    getUserMnemonicForWord(wordId, session.user.id),
  ]);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Community Mnemonics
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          <span className="font-medium text-foreground">{word.text}</span>
          {word.romanization && (
            <span className="text-text-secondary"> ({word.romanization})</span>
          )}
          {' — '}{word.meaning_en}
        </p>
        <p className="text-xs text-text-secondary mt-1">
          {total} {total === 1 ? 'mnemonic' : 'mnemonics'} shared
        </p>
      </div>

      <CommunityClient
        wordId={wordId}
        initialItems={items}
        initialTotal={total}
        userId={session.user.id}
        userMnemonic={userMnemonic}
      />
    </div>
  );
}
