import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import {
  getUserByUnsubscribeToken,
  setEmailRemindersEnabled,
} from '@/lib/db/email-queries';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: 'Unsubscribe — WordZoo' };

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let unsubscribed = false;
  if (UUID_RE.test(token)) {
    const user = await getUserByUnsubscribeToken(token);
    if (user) {
      await setEmailRemindersEnabled(user.id, false);
      unsubscribed = true;
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <Logo size={56} className="rounded-2xl mx-auto mb-6" />
        {unsubscribed ? (
          <>
            <h1 className="text-xl font-bold text-foreground mb-2">
              You&rsquo;re unsubscribed
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              No more reminder emails. You can switch them back on anytime in
              your settings.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground mb-2">
              That link didn&rsquo;t work
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              The unsubscribe link looks invalid or expired. You can manage
              email reminders from your settings instead.
            </p>
          </>
        )}
        <Link
          href="/settings"
          className="text-sm font-extrabold text-[color:var(--accent-indonesian)] hover:underline"
        >
          Go to settings →
        </Link>
      </div>
    </div>
  );
}
