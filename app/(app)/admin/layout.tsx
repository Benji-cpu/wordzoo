import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  if (!adminEmails.includes(session.user.email!)) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        <Link href="/admin" className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-inset">
          Overview
        </Link>
        <Link href="/admin/content" className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-inset">
          Content
        </Link>
        <Link href="/admin/users" className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-inset">
          Users
        </Link>
        <Link href="/admin/feedback" className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-inset">
          Feedback
        </Link>
      </div>
      {children}
    </div>
  );
}
