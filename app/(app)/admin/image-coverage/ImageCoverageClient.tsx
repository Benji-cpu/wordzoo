'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ImageCoverageStats } from '@/lib/db/admin-queries';

type Tab = 'mnemonics' | 'phrases' | 'scenes';

interface MissingMnemonicItem {
  id: string;
  word_id: string;
  keyword_text: string;
  bridge_sentence: string | null;
  scene_description: string;
  word_text: string;
  meaning_en: string;
  scene_title: string | null;
  scene_id: string | null;
  path_title: string | null;
  path_id: string | null;
}

interface MissingPhraseItem {
  id: string;
  text_target: string;
  text_en: string;
  phrase_bridge_sentence: string | null;
  scene_title: string;
  scene_id: string;
  path_title: string;
  path_id: string;
}

interface MissingSceneItem {
  id: string;
  title: string;
  description: string | null;
  path_title: string;
  path_id: string;
}

export function ImageCoverageClient({ stats }: { stats: ImageCoverageStats }) {
  const [activeTab, setActiveTab] = useState<Tab>('mnemonics');
  const [mnemonics, setMnemonics] = useState<MissingMnemonicItem[] | null>(null);
  const [phrases, setPhrases] = useState<MissingPhraseItem[] | null>(null);
  const [scenes, setScenes] = useState<MissingSceneItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMissing(tab: Tab) {
    setActiveTab(tab);

    // Check if already loaded
    if (tab === 'mnemonics' && mnemonics) return;
    if (tab === 'phrases' && phrases) return;
    if (tab === 'scenes' && scenes) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/image-coverage/missing?type=${tab}`);
      const json = await res.json();
      if (json.data) {
        if (tab === 'mnemonics') setMnemonics(json.data.items);
        if (tab === 'phrases') setPhrases(json.data.items);
        if (tab === 'scenes') setScenes(json.data.items);
      }
    } catch (e) {
      console.error('Failed to load missing items:', e);
    } finally {
      setLoading(false);
    }
  }

  function coverageColor(pct: number) {
    if (pct >= 80) return 'text-green-400';
    if (pct >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  function coverageBg(pct: number) {
    if (pct >= 80) return 'bg-green-500/20 border-green-500/30';
    if (pct >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  }

  // Group items by path
  function groupByPath<T extends { path_title: string | null; path_id: string | null }>(
    items: T[]
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    for (const item of items) {
      const key = item.path_title ?? 'Unassigned';
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return groups;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Image Coverage</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track and fill missing images across mnemonics, phrases, and scenes
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Back to Admin
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Mnemonics"
          total={stats.mnemonics.total}
          filled={stats.mnemonics.withImage}
          missing={stats.mnemonics.missing}
          pct={stats.mnemonics.coveragePercent}
          colorFn={coverageColor}
          bgFn={coverageBg}
        />
        <StatCard
          label="Phrases"
          total={stats.phrases.total}
          filled={stats.phrases.withImage}
          missing={stats.phrases.missing}
          pct={stats.phrases.coveragePercent}
          colorFn={coverageColor}
          bgFn={coverageBg}
        />
        <StatCard
          label="Scene Anchors"
          total={stats.scenes.total}
          filled={stats.scenes.withAnchorImage}
          missing={stats.scenes.missingAnchor}
          pct={stats.scenes.coveragePercent}
          colorFn={coverageColor}
          bgFn={coverageBg}
        />
      </div>

      {/* CLI hint */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-8">
        <p className="text-zinc-300 text-sm font-medium mb-2">Batch fill missing images:</p>
        <code className="text-xs text-emerald-400 block">
          npm run db:seed-missing-images -- --type=mnemonics --limit=10 --dry-run
        </code>
        <code className="text-xs text-emerald-400 block mt-1">
          npm run db:seed-missing-images -- --type=phrases --limit=5 --delay=3000
        </code>
        <code className="text-xs text-emerald-400 block mt-1">
          npm run db:seed-missing-images -- --type=all --limit=20
        </code>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['mnemonics', 'phrases', 'scenes'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => loadMissing(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'scenes' ? 'Scene Anchors' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-2 text-xs opacity-60">
              ({tab === 'mnemonics'
                ? stats.mnemonics.missing
                : tab === 'phrases'
                  ? stats.phrases.missing
                  : stats.scenes.missingAnchor} missing)
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="text-center text-zinc-400 py-12">Loading missing items...</div>
      )}

      {!loading && activeTab === 'mnemonics' && mnemonics && (
        <MnemonicsList items={mnemonics} groupByPath={groupByPath} />
      )}

      {!loading && activeTab === 'phrases' && phrases && (
        <PhrasesList items={phrases} groupByPath={groupByPath} />
      )}

      {!loading && activeTab === 'scenes' && scenes && (
        <ScenesList items={scenes} groupByPath={groupByPath} />
      )}

      {!loading && !mnemonics && activeTab === 'mnemonics' && (
        <EmptyPrompt tab="mnemonics" onLoad={() => loadMissing('mnemonics')} />
      )}
      {!loading && !phrases && activeTab === 'phrases' && (
        <EmptyPrompt tab="phrases" onLoad={() => loadMissing('phrases')} />
      )}
      {!loading && !scenes && activeTab === 'scenes' && (
        <EmptyPrompt tab="scenes" onLoad={() => loadMissing('scenes')} />
      )}
    </div>
  );
}

// --- Sub-components ---

function StatCard({
  label,
  total,
  filled,
  missing,
  pct,
  colorFn,
  bgFn,
}: {
  label: string;
  total: number;
  filled: number;
  missing: number;
  pct: number;
  colorFn: (pct: number) => string;
  bgFn: (pct: number) => string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bgFn(pct)}`}>
      <p className="text-zinc-300 text-sm font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colorFn(pct)}`}>{pct}%</p>
      <div className="mt-2 text-xs text-zinc-400 space-y-0.5">
        <p>{filled} / {total} have images</p>
        <p>{missing} missing</p>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-current transition-all"
          style={{ width: `${pct}%`, color: pct >= 80 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171' }}
        />
      </div>
    </div>
  );
}

function EmptyPrompt({ tab, onLoad }: { tab: string; onLoad: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="text-zinc-400 mb-4">Click to load missing {tab}</p>
      <button
        onClick={onLoad}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
      >
        Load Missing {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    </div>
  );
}

function MnemonicsList({
  items,
  groupByPath,
}: {
  items: MissingMnemonicItem[];
  groupByPath: <T extends { path_title: string | null; path_id: string | null }>(items: T[]) => Map<string, T[]>;
}) {
  if (items.length === 0) {
    return <p className="text-center text-green-400 py-8">All mnemonics have images!</p>;
  }

  const groups = groupByPath(items);

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([pathTitle, groupItems]) => (
        <div key={pathTitle}>
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">{pathTitle}</h3>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            {groupItems.map((m) => (
              <div key={`${m.id}-${m.scene_id}`} className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium">
                    {m.word_text} <span className="text-zinc-500">({m.meaning_en})</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Keyword: &ldquo;{m.keyword_text}&rdquo;
                    {m.scene_title && <> &middot; {m.scene_title}</>}
                  </p>
                </div>
                <span className="text-xs text-zinc-600 shrink-0 font-mono">{m.id.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhrasesList({
  items,
  groupByPath,
}: {
  items: MissingPhraseItem[];
  groupByPath: <T extends { path_title: string | null; path_id: string | null }>(items: T[]) => Map<string, T[]>;
}) {
  if (items.length === 0) {
    return <p className="text-center text-green-400 py-8">All phrases have images!</p>;
  }

  const groups = groupByPath(items);

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([pathTitle, groupItems]) => (
        <div key={pathTitle}>
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">{pathTitle}</h3>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            {groupItems.map((p) => (
              <div key={p.id} className="px-4 py-3">
                <p className="text-white font-medium">{p.text_target}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {p.text_en} &middot; {p.scene_title}
                  {p.phrase_bridge_sentence && (
                    <span className="text-emerald-500"> (has mnemonic text)</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScenesList({
  items,
  groupByPath,
}: {
  items: MissingSceneItem[];
  groupByPath: <T extends { path_title: string | null; path_id: string | null }>(items: T[]) => Map<string, T[]>;
}) {
  if (items.length === 0) {
    return <p className="text-center text-green-400 py-8">All scenes have anchor images!</p>;
  }

  const groups = groupByPath(items);

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([pathTitle, groupItems]) => (
        <div key={pathTitle}>
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">{pathTitle}</h3>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
            {groupItems.map((s) => (
              <div key={s.id} className="px-4 py-3">
                <p className="text-white font-medium">{s.title}</p>
                {s.description && (
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{s.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
