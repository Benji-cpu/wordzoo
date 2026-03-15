'use client';

import { useEffect, useState } from 'react';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';

export function DashboardUpgradeBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    fetch('/api/billing/status')
      .then((res) => res.json())
      .then((res) => {
        if (!res.data) return;
        const { subscription, usage } = res.data;
        if (subscription.tier === 'premium') return;

        // Show banner if user is at 80%+ of any daily limit
        const nearLimit =
          usage.words_learned.current >= usage.words_learned.limit * 0.8 ||
          usage.tutor_messages.current >= usage.tutor_messages.limit * 0.8 ||
          usage.regenerations.current >= usage.regenerations.limit * 0.8;

        setShowBanner(nearLimit);
      })
      .catch(() => {});
  }, []);

  if (!showBanner) return null;

  return (
    <UpgradePrompt
      message="You're running low on free usage today. Upgrade for unlimited access!"
      compact
    />
  );
}
