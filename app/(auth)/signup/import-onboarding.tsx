'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { importOnboardingProgress, claimReferral } from '@/lib/onboarding/actions';
import { loadOnboardingProgress, clearOnboardingProgress } from '@/lib/onboarding/state';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function ImportOnboardingAfterAuth() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) return;

    const run = async () => {
      // 1. Referral attribution
      const referrerId = getCookie('wz_ref');
      if (referrerId) {
        try {
          await claimReferral(referrerId);
        } catch {
          // Attribution failed — non-blocking
        }
        deleteCookie('wz_ref');
      }

      // 2. Onboarding import (if saved progress exists)
      const saved = loadOnboardingProgress();
      if (saved?.selectedLanguage) {
        try {
          await importOnboardingProgress({
            languageCode: saved.selectedLanguage.code,
            words: saved.words.map((w) => ({
              text: w.text,
              romanization: w.romanization,
              meaningEn: w.meaningEn,
              partOfSpeech: w.partOfSpeech,
              keyword: w.keyword,
              sceneDescription: w.sceneDescription,
            })),
          });
          clearOnboardingProgress();
        } catch {
          // Import failed — non-blocking
        }
      }

      // 3. Always redirect
      router.push('/dashboard');
    };

    run();
  }, [session, router]);

  return null;
}
