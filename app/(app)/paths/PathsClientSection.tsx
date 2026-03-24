'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomPathInput } from '@/components/learn/CustomPathInput';
import { PaywallGate } from '@/components/billing/PaywallGate';

interface PathsClientSectionProps {
  languageId: string | null;
}

export function PathsClientSection({ languageId }: PathsClientSectionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreatePath(topic: string) {
    if (!languageId) {
      setError('No language selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/paths/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageId, userInput: topic }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? 'Failed to create path');
        return;
      }

      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PaywallGate feature="custom_path">
      <CustomPathInput onSubmit={handleCreatePath} disabled={isLoading} />
      {error && (
        <p className="text-sm text-red-400 mt-2">{error}</p>
      )}
    </PaywallGate>
  );
}
