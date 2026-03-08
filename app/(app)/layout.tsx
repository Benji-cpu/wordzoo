import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <nav className="flex items-center justify-between">
          <span className="text-xl font-bold">WordZoo</span>
          <span className="text-sm text-gray-600">{session.user.email}</span>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
