import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UnregisterServiceWorker } from '@/components/system/UnregisterServiceWorker';
import { AppShell } from './AppShell';

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
    <div className="h-dvh flex flex-col bg-background text-foreground">
      <UnregisterServiceWorker />
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background border-b border-card-border">
        <nav className="flex items-center justify-between max-w-lg lg:max-w-none mx-auto lg:mx-0 px-4 py-3">
          <span className="text-lg font-bold text-foreground flex-shrink-0">WordZoo</span>
          <div id="header-center-slot" className="flex-1 flex items-center justify-center min-w-0 mx-3" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <a
              href="/settings"
              aria-label="Settings"
              className="w-8 h-8 rounded-full border border-[color:var(--card-border)] overflow-hidden flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)]"
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-[color:var(--text-secondary)] font-bold">
                  {session.user.email?.[0]?.toUpperCase()}
                </span>
              )}
            </a>
          </div>
        </nav>
        <div id="header-progress-slot" />
      </header>

      {/* Main content + bottom nav + feedback modal */}
      <AppShell>{children}</AppShell>
      <Toaster position="top-center" richColors closeButton theme="system" />
    </div>
  );
}
