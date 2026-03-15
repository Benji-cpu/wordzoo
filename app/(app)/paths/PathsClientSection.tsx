'use client';

import { CustomPathInput } from '@/components/learn/CustomPathInput';
import { PaywallGate } from '@/components/billing/PaywallGate';

export function PathsClientSection() {
  function handleCreatePath(topic: string) {
    // TODO: Call POST /api/paths/custom when API is ready
    console.log('Create custom path:', topic);
  }

  return (
    <PaywallGate feature="custom_path">
      <CustomPathInput onSubmit={handleCreatePath} />
    </PaywallGate>
  );
}
