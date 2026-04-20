'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DangerSectionProps {
  userEmail: string;
}

export function DangerSection({ userEmail }: DangerSectionProps) {
  const [exporting, setExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/user/export');
      if (!res.ok) {
        const { toast } = await import('sonner');
        toast.error('Export failed. Please try again.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wordzoo-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      const { toast } = await import('sonner');
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
      const { toast } = await import('sonner');
      toast.error("Email doesn't match. Delete cancelled.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const { toast } = await import('sonner');
        toast.error(json.error ?? "Couldn't delete your account.");
        setDeleting(false);
        return;
      }
      // Force hard reload so server session is dropped
      window.location.href = '/login?deleted=1';
    } catch {
      const { toast } = await import('sonner');
      toast.error("Couldn't reach the server. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Your data
      </h2>
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">Export your data</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Download everything WordZoo has for you — profile, reviews, paths, feedback.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Preparing…' : 'Download'}
            </Button>
          </div>

          <div className="pt-3 border-t border-card-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-red-400">Delete account</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Permanently removes your account and all data. Cancels any active subscription.
                </p>
              </div>
              {!showConfirm && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowConfirm(true)}
                  className="text-red-400"
                >
                  Delete
                </Button>
              )}
            </div>

            {showConfirm && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <p className="text-sm text-foreground mb-2">
                  Type your email <strong>{userEmail}</strong> to confirm.
                </p>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={userEmail}
                  className="w-full min-h-[44px] rounded-lg bg-surface-inset border border-card-border px-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting || confirmEmail.length === 0}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {deleting ? 'Deleting…' : 'Permanently delete'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmEmail('');
                    }}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}

