import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/db/queries';
import { SubscriptionSection } from './SubscriptionSection';
import { ProfileSection } from './ProfileSection';
import { LanguageSection } from './LanguageSection';
import { FeedbackSection } from './FeedbackSection';
import { DangerSection } from './DangerSection';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const profile = await getUserProfile(session.user.id);

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24 lg:max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account, language, and subscription.
        </p>
      </div>

      <ProfileSection userId={session.user.id} />
      <SubscriptionSection />
      <LanguageSection initialNativeLanguage={profile?.native_language ?? 'en'} />
      <FeedbackSection />
      {profile && <DangerSection userEmail={profile.email} />}
    </div>
  );
}
