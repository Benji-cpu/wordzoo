'use client';

import { useEffect, useState } from 'react';
import { UpgradePrompt } from './UpgradePrompt';
import type { BillingFeature } from '@/types/api';

interface PaywallGateProps {
  feature: BillingFeature;
  children: React.ReactNode;
  /** 'soft' shows upgrade prompt below children; 'hard' replaces children entirely */
  mode?: 'soft' | 'hard';
}

interface AccessResult {
  allowed: boolean;
  upgradeMessage: string | null;
}

export function PaywallGate({ feature, children, mode = 'hard' }: PaywallGateProps) {
  const [access, setAccess] = useState<AccessResult | null>(null);

  useEffect(() => {
    fetch('/api/billing/check-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.data) setAccess(res.data);
      })
      .catch(() => {
        // Fail open — show children on error
        setAccess({ allowed: true, upgradeMessage: null });
      });
  }, [feature]);

  // Fail open during loading
  if (access === null) {
    return <>{children}</>;
  }

  if (access.allowed) {
    return <>{children}</>;
  }

  if (mode === 'soft') {
    return (
      <>
        {children}
        <div className="mt-3">
          <UpgradePrompt feature={feature} message={access.upgradeMessage ?? undefined} compact />
        </div>
      </>
    );
  }

  // Hard gate — replace children with upgrade prompt
  return <UpgradePrompt feature={feature} message={access.upgradeMessage ?? undefined} />;
}
