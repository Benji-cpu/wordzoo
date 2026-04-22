'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface UpgradePromptProps {
  feature?: string;
  message?: string;
  compact?: boolean;
}

const FEATURE_MESSAGES: Record<string, { title: string; description: string }> = {
  new_word: {
    title: 'Daily Word Limit Reached',
    description: 'You\'ve learned all your free words for today. Upgrade to keep going!',
  },
  regenerate_mnemonic: {
    title: 'Regeneration Limit Reached',
    description: 'Upgrade to Premium for unlimited mnemonic regenerations.',
  },
  hands_free: {
    title: 'Hands-Free Time Used Up',
    description: 'Get unlimited hands-free learning time with Premium.',
  },
  tutor_message: {
    title: 'Tutor Messages Used Up',
    description: 'Upgrade for unlimited tutor conversations.',
  },
  custom_path: {
    title: 'Premium Feature',
    description: 'Custom paths are available with a Premium subscription.',
  },
};

export function UpgradePrompt({ feature, message, compact = false }: UpgradePromptProps) {
  const router = useRouter();
  const info = feature ? FEATURE_MESSAGES[feature] : null;
  const title = info?.title ?? 'Upgrade to Premium';
  const description = message ?? info?.description ?? 'Get unlimited access to all features.';

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-accent-default/10 border border-accent-default/20">
        <p className="text-sm text-text-secondary">{description}</p>
        <Button size="sm" onClick={() => router.push('/pricing')}>
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="text-center py-6">
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-4 max-w-xs mx-auto">{description}</p>
      <Button onClick={() => router.push('/pricing')}>
        View Plans
      </Button>
    </Card>
  );
}
