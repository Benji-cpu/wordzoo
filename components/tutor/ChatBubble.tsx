'use client';

import { useCallback, useMemo } from 'react';
import { parseMessageContent, type MessageSegment } from '@/lib/tutor/message-parser';
import type { PopoverData } from './WordPopover';
import type { ChallengeMode } from '@/lib/tutor/modes';
import { InlineMarkdown } from '@/components/ui/InlineMarkdown';
import { PhaseIndicator } from '@/components/tutor/path-builder/PhaseIndicator';
import { PathVocabCard } from '@/components/tutor/path-builder/PathVocabCard';

interface ChatBubbleProps {
  role: 'user' | 'model';
  content: string;
  vocabMap: Map<string, PopoverData>;
  onWordTap: (data: PopoverData, rect: DOMRect) => void;
  onPathVocabAction?: (word: string, action: 'keep' | 'remove' | 'different') => void;
  vocabStatuses?: Map<string, 'pending' | 'kept' | 'removed'>;
  challengeMode?: ChallengeMode;
}

export function ChatBubble({ role, content, vocabMap, onWordTap, onPathVocabAction, vocabStatuses, challengeMode = 'easy' }: ChatBubbleProps) {
  const isUser = role === 'user';

  const handleWordClick = useCallback(
    (word: string, meaning: string, e: React.MouseEvent<HTMLSpanElement>) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const lowerWord = word.toLowerCase();

      const vocabEntry = vocabMap.get(lowerWord);
      if (vocabEntry) {
        onWordTap(vocabEntry, rect);
      } else {
        onWordTap({ text: word, romanization: null, meaning_en: meaning }, rect);
      }
    },
    [vocabMap, onWordTap]
  );

  const segments = useMemo(() => parseMessageContent(content), [content]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent-default text-white rounded-br-md'
            : 'bg-black/[0.05] dark:bg-white/10 border border-card-border text-foreground rounded-bl-md'
        }`}
      >
        {segments.map((seg, i) => (
          <SegmentRenderer
            key={i}
            segment={seg}
            onWordClick={handleWordClick}
            onPathVocabAction={onPathVocabAction}
            vocabStatuses={vocabStatuses}
            challengeMode={challengeMode}
          />
        ))}
      </div>
    </div>
  );
}

function SegmentRenderer({
  segment,
  onWordClick,
  onPathVocabAction,
  vocabStatuses,
  challengeMode,
}: {
  segment: MessageSegment;
  onWordClick: (word: string, meaning: string, e: React.MouseEvent<HTMLSpanElement>) => void;
  onPathVocabAction?: (word: string, action: 'keep' | 'remove' | 'different') => void;
  vocabStatuses?: Map<string, 'pending' | 'kept' | 'removed'>;
  challengeMode: ChallengeMode;
}) {
  switch (segment.type) {
    case 'text':
      return <><InlineMarkdown text={segment.content} /></>;

    case 'vocab_word':
      return (
        <span
          className="font-bold underline decoration-dotted cursor-pointer hover:opacity-80"
          onClick={(e) => onWordClick(segment.word, segment.meaning, e)}
        >
          {segment.word}
        </span>
      );

    case 'suggestion':
      // Suggestions are extracted and rendered outside the bubble by TutorChat
      return null;

    case 'english_translation':
      // Only show in Easy mode
      if (challengeMode !== 'easy') return null;
      return (
        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-xs italic text-text-secondary">
          <InlineMarkdown text={segment.content} />
        </div>
      );

    case 'correction':
      return (
        <div className="my-2 rounded-xl overflow-hidden animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10">
            <span className="text-red-400 text-xs font-bold shrink-0">&times;</span>
            <span className="text-red-400 line-through">{segment.original}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10">
            <span className="text-green-400 text-xs font-bold shrink-0">&check;</span>
            <span className="text-green-400">{segment.corrected}</span>
          </div>
          {segment.explanation && (
            <div className="px-3 py-1.5 bg-white/10">
              <span className="text-text-secondary text-xs">{segment.explanation}</span>
            </div>
          )}
        </div>
      );

    case 'grammar_note':
      return (
        <div className="my-2 bg-white/10 border-l-2 border-accent-default rounded-lg px-3 py-2 animate-fade-in">
          <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Grammar Note</div>
          <div className="font-semibold text-foreground text-sm">{segment.title}</div>
          <div className="text-sm text-text-secondary mt-1"><InlineMarkdown text={segment.body} /></div>
        </div>
      );

    case 'context_card':
      return (
        <div className="my-2 bg-white/10 rounded-lg px-3 py-2 animate-fade-in">
          <div className="text-xs text-text-secondary uppercase tracking-wider">{segment.label}</div>
          <div className="text-sm text-foreground mt-0.5"><InlineMarkdown text={segment.content} /></div>
        </div>
      );

    case 'path_vocab':
      return (
        <PathVocabCard
          word={segment.word}
          romanization={segment.romanization}
          meaning={segment.meaning}
          mnemonicHint={segment.mnemonicHint}
          status={vocabStatuses?.get(segment.word) ?? 'pending'}
          onKeep={() => onPathVocabAction?.(segment.word, 'keep')}
          onRemove={() => onPathVocabAction?.(segment.word, 'remove')}
          onDifferent={() => onPathVocabAction?.(segment.word, 'different')}
        />
      );

    case 'phase_transition':
      return (
        <PhaseIndicator phase={segment.phase} description={segment.description} />
      );

    default:
      return null;
  }
}

/** Re-export parseMessageContent for consumers that need to extract segments */
export { parseMessageContent, extractSuggestions } from '@/lib/tutor/message-parser';
