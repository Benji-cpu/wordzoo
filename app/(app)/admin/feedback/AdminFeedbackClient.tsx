'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MnemonicItem {
  id: string;
  keyword_text: string;
  scene_description: string;
  image_url: string | null;
  thumbs_up_count: number;
  thumbs_down_count: number;
  word_text: string;
  meaning_en: string;
  language_name: string;
}

interface CommentItem {
  id: string;
  rating: string;
  comment: string;
  created_at: Date;
  user_email: string;
  word_text: string;
  meaning_en: string;
  mnemonic_id: string;
}

interface AdminFeedbackClientProps {
  stats: {
    total_feedback: number;
    total_thumbs_up: number;
    total_thumbs_down: number;
  };
  worst: MnemonicItem[];
  best: MnemonicItem[];
  comments: CommentItem[];
}

export function AdminFeedbackClient({
  stats,
  worst,
  best,
  comments,
}: AdminFeedbackClientProps) {
  const [activeTab, setActiveTab] = useState<'worst' | 'best' | 'comments'>(
    'worst'
  );
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const positivePercent =
    stats.total_feedback > 0
      ? (stats.total_thumbs_up / stats.total_feedback * 100).toFixed(0)
      : 'N/A';

  async function handleRegenerate(mnemonicId: string) {
    setRegeneratingId(mnemonicId);
    setSuccessId(null);

    try {
      const res = await fetch('/api/admin/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonicId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to regenerate');
      }

      setSuccessId(mnemonicId);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setRegeneratingId(null);
    }
  }

  function maskEmail(email: string): string {
    if (!email || email.length < 3) return '***';
    return email.slice(0, 3) + '...';
  }

  const tabs = [
    { key: 'worst' as const, label: 'Worst' },
    { key: 'best' as const, label: 'Best' },
    { key: 'comments' as const, label: 'Comments' },
  ];

  const activeMnemonics = activeTab === 'worst' ? worst : best;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-text-secondary hover:text-foreground transition-colors text-sm"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Mnemonic Feedback
        </h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-inset rounded-2xl border border-card-border p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider">
            Total Feedback
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {stats.total_feedback}
          </p>
        </div>

        <div className="bg-surface-inset rounded-2xl border border-card-border p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider">
            Thumbs Up
          </p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {stats.total_thumbs_up}
          </p>
        </div>

        <div className="bg-surface-inset rounded-2xl border border-card-border p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider">
            Thumbs Down
          </p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {stats.total_thumbs_down}
          </p>
        </div>

        <div className="bg-surface-inset rounded-2xl border border-card-border p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider">
            Positive %
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {positivePercent === 'N/A' ? positivePercent : `${positivePercent}%`}
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-card-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-accent-default text-foreground'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'comments' ? (
        /* Comments Tab */
        comments.length === 0 ? (
          <p className="text-center text-text-secondary py-8">
            No feedback yet
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((item) => (
              <div
                key={item.id}
                className="bg-surface-inset rounded-2xl border border-card-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                      item.rating === 'thumbs_up'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {item.rating === 'thumbs_up' ? '👍' : '👎'}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-foreground">{item.comment}</p>

                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>
                    {item.word_text} &rarr; {item.meaning_en}
                  </span>
                  <span>{maskEmail(item.user_email)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : /* Worst / Best Tabs */
      activeMnemonics.length === 0 ? (
        <p className="text-center text-text-secondary py-8">
          No feedback yet
        </p>
      ) : (
        <div className="space-y-3">
          {activeMnemonics.map((item) => {
            const total = item.thumbs_up_count + item.thumbs_down_count;
            const ratio =
              total > 0
                ? ((item.thumbs_up_count / total) * 100).toFixed(0)
                : '0';

            return (
              <div
                key={item.id}
                className="bg-surface-inset rounded-2xl border border-card-border p-4 space-y-3"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.keyword_text}
                      className="w-[60px] h-[60px] rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-lg bg-surface-inset flex-shrink-0" />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-accent-id truncate">
                      {item.word_text}
                    </p>
                    <p className="text-sm text-text-secondary truncate">
                      {item.meaning_en}
                    </p>
                    <p className="text-sm text-foreground truncate">
                      &ldquo;{item.keyword_text}&rdquo;
                    </p>
                    <span className="inline-block text-xs bg-surface-inset text-text-secondary px-2 py-0.5 rounded-full mt-1">
                      {item.language_name}
                    </span>
                  </div>
                </div>

                {/* Feedback counts + Regenerate */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-400">
                      👍 {item.thumbs_up_count}
                    </span>
                    <span className="text-red-400">
                      👎 {item.thumbs_down_count}
                    </span>
                    <span className="text-text-secondary text-xs">
                      ({ratio}% positive)
                    </span>
                  </div>

                  {successId === item.id ? (
                    <span className="text-green-400 text-sm">
                      New version created!
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRegenerate(item.id)}
                      disabled={regeneratingId === item.id}
                      className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 px-3 py-1 rounded-lg text-sm disabled:opacity-50 transition-colors"
                    >
                      {regeneratingId === item.id
                        ? 'Regenerating...'
                        : 'Regenerate'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
