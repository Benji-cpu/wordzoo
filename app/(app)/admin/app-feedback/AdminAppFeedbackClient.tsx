'use client';

import { useState } from 'react';
import type { AppFeedbackWithUser } from '@/lib/db/admin-queries';

interface Props {
  initialStats: {
    total: number;
    new_count: number;
    reviewed_count: number;
    actioned_count: number;
    dismissed_count: number;
  };
  initialItems: AppFeedbackWithUser[];
}

const STATUS_TABS = ['all', 'new', 'reviewed', 'actioned', 'dismissed'] as const;
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  reviewed: 'bg-yellow-500/20 text-yellow-400',
  actioned: 'bg-green-500/20 text-green-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return local.slice(0, 2) + '***@' + domain;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminAppFeedbackClient({ initialStats, initialItems }: Props) {
  const [stats, setStats] = useState(initialStats);
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);

  async function fetchFiltered(status: string) {
    setActiveTab(status);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/app-feedback?status=${status}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setStats(json.data.stats);
          setItems(json.data.items);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/app-feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      // Refresh
      fetchFiltered(activeTab);
    }
  }

  async function saveNotes(id: string, notes: string) {
    await fetch(`/api/admin/app-feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: items.find(i => i.id === id)?.status ?? 'new', adminNotes: notes }),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">App Feedback</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total },
          { label: 'New', value: stats.new_count },
          { label: 'Reviewed', value: stats.reviewed_count },
          { label: 'Actioned', value: stats.actioned_count },
          { label: 'Dismissed', value: stats.dismissed_count },
        ].map(s => (
          <div key={s.label} className="bg-card-surface border border-card-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => fetchFiltered(tab)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? 'bg-accent-id text-white'
                : 'text-text-secondary hover:bg-surface-inset'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      {loading ? (
        <p className="text-text-secondary text-sm">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-text-secondary text-sm">No feedback items found.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-card-surface border border-card-border rounded-xl p-4 space-y-3">
              {/* Header: status + date + email */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || ''}`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-text-secondary">{maskEmail(item.user_email)}</span>
                </div>
                <span className="text-xs text-text-secondary">{formatDate(item.created_at)}</span>
              </div>

              {/* Message */}
              <p className="text-sm text-foreground whitespace-pre-wrap">{item.message}</p>

              {/* Context breadcrumb */}
              <p className="text-xs text-text-secondary truncate">
                {item.page_url}
                {item.viewport_width && item.viewport_height && (
                  <span className="ml-2">({item.viewport_width}x{item.viewport_height})</span>
                )}
              </p>

              {/* Screenshot thumbnail */}
              {item.screenshot_url && (
                <div>
                  <button
                    onClick={() => setExpandedScreenshot(
                      expandedScreenshot === item.id ? null : item.id
                    )}
                    className="text-xs text-accent-id hover:underline"
                  >
                    {expandedScreenshot === item.id ? 'Hide screenshot' : 'View screenshot'}
                  </button>
                  {expandedScreenshot === item.id && (
                    <img
                      src={item.screenshot_url}
                      alt="Feedback screenshot"
                      className="mt-2 rounded-lg border border-card-border max-w-full max-h-80 object-contain"
                    />
                  )}
                </div>
              )}

              {/* Admin controls */}
              <div className="flex items-center gap-3 pt-1 border-t border-card-border">
                <select
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  className="text-xs bg-surface-inset border border-card-border rounded-lg px-2 py-1 text-foreground"
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="actioned">Actioned</option>
                  <option value="dismissed">Dismissed</option>
                </select>
                <input
                  type="text"
                  placeholder="Admin notes..."
                  defaultValue={item.admin_notes ?? ''}
                  onBlur={(e) => saveNotes(item.id, e.target.value)}
                  className="flex-1 text-xs bg-surface-inset border border-card-border rounded-lg px-2 py-1 text-foreground placeholder:text-text-secondary/60"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
