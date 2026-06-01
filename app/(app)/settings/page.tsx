import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/db/queries';
import { getAllPremadePaths, getUserActivePath, getLanguageById, getAllLanguages } from '@/lib/db';
import { SubscriptionSection } from './SubscriptionSection';
import { ProfileSection } from './ProfileSection';
import { LanguageSection } from './LanguageSection';
import { PersonaSection } from './PersonaSection';
import { firstNameOf } from '@/lib/learn/personalize';
import { TripSection } from './TripSection';
import { FeedbackSection } from './FeedbackSection';
import { DangerSection } from './DangerSection';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [profile, premadePaths, activePath, allLanguages] = await Promise.all([
    getUserProfile(session.user.id),
    getAllPremadePaths(),
    getUserActivePath(session.user.id),
    getAllLanguages(),
  ]);

  const activeLanguage = activePath ? await getLanguageById(activePath.path_language_id) : null;

  const personaPrefs = (profile?.preferences ?? {}) as Record<string, unknown>;
  const personaName =
    (typeof personaPrefs.learner_name === 'string' && personaPrefs.learner_name.trim()
      ? personaPrefs.learner_name.trim()
      : firstNameOf(profile?.name)) ?? '';
  const personaGender =
    personaPrefs.learner_gender === 'male' || personaPrefs.learner_gender === 'female'
      ? personaPrefs.learner_gender
      : '';

  // One canonical premade path per language for the switcher; attach language code.
  const codeByLanguageId = new Map(allLanguages.map((l) => [l.id, l.code]));
  const seen = new Set<string>();
  const targetOptions = premadePaths
    .filter((p) => {
      if (seen.has(p.language_id)) return false;
      seen.add(p.language_id);
      return true;
    })
    .map((p) => ({
      pathId: p.id,
      languageId: p.language_id,
      languageCode: codeByLanguageId.get(p.language_id) ?? '',
      label: p.language_name,
    }));

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
      <LanguageSection
        initialNativeLanguage={profile?.native_language ?? 'en'}
        targetOptions={targetOptions}
        initialTargetLanguageCode={activeLanguage?.code ?? null}
      />
      <PersonaSection initialName={personaName} initialGender={personaGender} />
      <TripSection targetLanguageCode={activeLanguage?.code ?? null} />
      <FeedbackSection />
      {profile && <DangerSection userEmail={profile.email} />}
    </div>
  );
}
