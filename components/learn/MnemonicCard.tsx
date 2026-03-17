'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ShareButton } from '@/components/community/ShareButton';
import { FeedbackButtons } from '@/components/learn/FeedbackButtons';

interface MnemonicCardProps {
  wordText: string;
  keyword: string;
  sceneDescription: string;
  imageUrl: string | null;
  mnemonicId?: string;
  wordId?: string;
  meaningEn?: string;
  languageName?: string;
  onContinue: () => void;
}

export function MnemonicCard({
  wordText,
  keyword,
  sceneDescription,
  imageUrl,
  mnemonicId,
  wordId,
  meaningEn,
  languageName,
  onContinue,
}: MnemonicCardProps) {
  return (
    <Card className="animate-slide-up overflow-hidden" onClick={onContinue}>
      <p className="text-sm text-text-secondary mb-2">Remember it like this:</p>
      <p className="text-lg text-foreground mb-2">
        <span className="font-bold text-accent-id">{wordText}</span>{' '}
        sounds like{' '}
        <span className="font-bold text-foreground">&ldquo;{keyword}&rdquo;</span>
      </p>

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={sceneDescription}
          className="max-w-full max-h-[36vh] rounded-xl mx-auto block mb-2"
        />
      )}

      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
        {sceneDescription}
      </p>

      {/* Feedback */}
      {mnemonicId && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <FeedbackButtons mnemonicId={mnemonicId} context="learn" />
        </div>
      )}

      {/* Share + Community actions */}
      {mnemonicId && wordId && (
        <div
          className="flex items-center gap-3 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <ShareButton
            mnemonicId={mnemonicId}
            wordId={wordId}
            wordText={wordText}
            meaningEn={meaningEn ?? ''}
            languageName={languageName ?? ''}
          />
          <Link
            href={`/community/${wordId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/5 text-text-secondary hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Community
          </Link>
        </div>
      )}

      <p className="text-sm text-text-secondary mt-3 text-center">Tap to continue</p>
    </Card>
  );
}
