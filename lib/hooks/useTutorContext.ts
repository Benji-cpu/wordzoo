'use client';

import { useContext } from 'react';
import { TutorContext } from '@/components/tutor/TutorProvider';
import type { TutorContextValue } from '@/components/tutor/TutorProvider';

export function useTutorContext(): TutorContextValue {
  const ctx = useContext(TutorContext);
  if (!ctx) {
    throw new Error('useTutorContext must be used within a TutorProvider');
  }
  return ctx;
}
