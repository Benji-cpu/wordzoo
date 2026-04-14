'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface BillingStatus {
  subscription: {
    tier: string;
    plan: string | null;
    status: string | null;
    currentPeriodEnd: string | null;
  };
  usage: {
    words_learned: { current: number; limit: number };
    tutor_messages: { current: number; limit: number };
    hands_free_seconds: { current: number; limit: number };
    regenerations: { current: number; limit: number };
  };
}

export function SubscriptionSection() {
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch('/api/billing/status')
      .then((res) => res.json())
      .then((res) => {
        if (res.data) setStatus(res.data);
      })
      .catch(() => {});
  }, []);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false);
    }
  }

  if (!status) return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Subscription
      </h2>
      <div className="glass-card p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-surface-inset" />
            <div className="h-3 w-32 rounded bg-surface-inset" />
          </div>
          <div className="h-8 w-20 rounded-lg bg-surface-inset" />
        </div>
      </div>
    </section>
  );

  const isPremium = status.subscription.tier === 'premium';

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
        Subscription
      </h2>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">
                {isPremium ? 'Premium' : 'Free'} Plan
              </h3>
              <Badge variant={isPremium ? 'tier' : 'default'}>
                {isPremium ? 'Active' : 'Free'}
              </Badge>
            </div>
            {isPremium && status.subscription.plan && (
              <p className="text-xs text-text-secondary mt-1">
                {status.subscription.plan === 'yearly' ? 'Yearly' : 'Monthly'} billing
                {status.subscription.currentPeriodEnd &&
                  ` · Renews ${new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            )}
          </div>
          {isPremium ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? 'Loading...' : 'Manage'}
            </Button>
          ) : (
            <Button size="sm" onClick={() => router.push('/pricing')}>
              Upgrade
            </Button>
          )}
        </div>

        {!isPremium && (
          <div className="space-y-2 pt-3 border-t border-card-border">
            <p className="text-xs font-medium text-text-secondary mb-2">Today&apos;s Usage</p>
            <UsageBar label="Words" current={status.usage.words_learned.current} limit={status.usage.words_learned.limit} />
            <UsageBar label="Tutor" current={status.usage.tutor_messages.current} limit={status.usage.tutor_messages.limit} />
            <UsageBar label="Hands-free" current={Math.floor(status.usage.hands_free_seconds.current / 60)} limit={Math.floor(status.usage.hands_free_seconds.limit / 60)} unit="min" />
            <UsageBar label="Regenerations" current={status.usage.regenerations.current} limit={status.usage.regenerations.limit} />
          </div>
        )}
      </Card>
    </section>
  );
}

function UsageBar({ label, current, limit, unit }: { label: string; current: number; limit: number; unit?: string }) {
  const pct = Math.min(100, (current / limit) * 100);
  const atLimit = current >= limit;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className={atLimit ? 'text-red-400' : 'text-text-secondary'}>
          {current}/{limit}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-inset overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-400' : 'bg-accent-default'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
