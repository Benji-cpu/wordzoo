'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const PLANS = {
  monthly: { price: '$9.99', period: '/month' },
  yearly: { price: '$79.99', period: '/year', savings: 'Save 33%' },
};

const FREE_FEATURES = [
  '5 words per day',
  '3 tutor messages per day',
  '5 min hands-free per day',
  '2 mnemonic regenerations per day',
  'Premade learning paths',
];

const PREMIUM_FEATURES = [
  'Unlimited words per day',
  'Unlimited tutor messages',
  'Unlimited hands-free mode',
  'Unlimited regenerations',
  'Custom learning paths',
  'Offline downloads',
  'Community submissions',
  'Priority support',
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billing }),
      });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Choose Your Plan</h1>
        <p className="text-sm text-text-secondary mt-1">
          Unlock your full learning potential
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-green-400 font-medium">Welcome to Premium! Your subscription is active.</p>
        </div>
      )}

      {canceled && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
          <p className="text-yellow-400 font-medium">Checkout was canceled. No charges were made.</p>
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billing === 'monthly'
              ? 'bg-accent-default text-white'
              : 'bg-surface-inset text-text-secondary'
          }`}
          onClick={() => setBilling('monthly')}
        >
          Monthly
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            billing === 'yearly'
              ? 'bg-accent-default text-white'
              : 'bg-surface-inset text-text-secondary'
          }`}
          onClick={() => setBilling('yearly')}
        >
          Yearly
          <Badge color="bg-green-500/20 text-green-400">Save 33%</Badge>
        </button>
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 gap-4">
        {/* Free Plan */}
        <Card>
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-foreground">Free</h3>
            <p className="text-2xl font-bold text-foreground mt-1">$0</p>
            <p className="text-xs text-text-secondary">Forever free</p>
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-text-secondary mt-0.5">-</span>
                {feature}
              </li>
            ))}
          </ul>
        </Card>

        {/* Premium Plan */}
        <Card className="border-accent-default/50 ring-1 ring-accent-default/20">
          <div className="text-center mb-4">
            <Badge variant="tier" className="mb-2">Recommended</Badge>
            <h3 className="text-lg font-bold text-foreground">Premium</h3>
            <p className="text-2xl font-bold text-foreground mt-1">
              {PLANS[billing].price}
              <span className="text-sm font-normal text-text-secondary">{PLANS[billing].period}</span>
            </p>
            {billing === 'yearly' && (
              <p className="text-xs text-green-400 mt-1">{PLANS.yearly.savings}</p>
            )}
          </div>
          <ul className="space-y-2 mb-6">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-accent-default mt-0.5">+</span>
                {feature}
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Loading...' : `Get Premium — ${PLANS[billing].price}${PLANS[billing].period}`}
          </Button>
        </Card>
      </div>
    </div>
  );
}
