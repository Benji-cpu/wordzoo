import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { SyncProvider } from '@/components/offline/SyncProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SyncProvider>
      <div className="h-dvh flex flex-col bg-background text-foreground">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-card-border px-4 py-3">
          <nav className="flex items-center justify-between max-w-lg mx-auto">
            <span className="text-lg font-bold text-foreground">WordZoo</span>
            <div className="flex items-center gap-2">
              <OfflineIndicator />
              <ThemeToggle />
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  className="w-8 h-8 rounded-full border border-card-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-card-surface border border-card-border flex items-center justify-center text-xs text-text-secondary">
                  {session.user.email?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20">{children}</main>

        {/* Bottom navigation */}
        <BottomNav />
      </div>
    </SyncProvider>
  );
}
