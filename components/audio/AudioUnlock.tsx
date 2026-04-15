'use client';

import { useEffect } from 'react';
import { attachAudioUnlockListener } from '@/lib/audio';

/** Zero-render component that sets up the audio unlock listener on mount. */
export function AudioUnlock() {
  useEffect(() => {
    attachAudioUnlockListener();
  }, []);

  return null;
}
