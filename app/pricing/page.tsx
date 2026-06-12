import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { PricingContent } from '@/components/billing/PricingContent';

export const metadata = {
  title: 'Pricing — WordZoo',
  description: 'WordZoo is free forever. Premium unlocks unlimited words, tutor messages, and custom learning paths.',
};

export default async function PricingPage() {
  const session = await auth();
  const isAuthed = !!session?.user;

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} className="rounded-lg" />
          <span className="font-bold text-foreground">WordZoo</span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthed && (
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-text-secondary hover:text-foreground transition-colors"
            >
              ← Dashboard
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className="px-4 pt-4">
        <Suspense>
          <PricingContent isAuthed={isAuthed} />
        </Suspense>
      </main>
    </div>
  );
}
