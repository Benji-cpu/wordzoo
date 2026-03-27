import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserActivePath, getAllLanguages, getUserById } from '@/lib/db/queries';
import { PathStudioClient } from '@/components/studio/PathStudioClient';

interface StudioPageProps {
  searchParams: Promise<{ prefillScenario?: string; languageId?: string }>;
}

export default async function PathStudioPage({ searchParams }: StudioPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const params = await searchParams;
  const prefillScenario = params.prefillScenario;
  let languageId = params.languageId;

  // Resolve languageId + isPremium in parallel
  const [activePath, languages, user] = await Promise.all([
    getUserActivePath(userId),
    getAllLanguages(),
    getUserById(userId),
  ]);

  if (!languageId) {
    if (activePath?.path_language_id) {
      languageId = activePath.path_language_id;
    } else {
      languageId = languages[0]?.id ?? '';
    }
  }

  const isPremium = user?.subscription_tier === 'premium';

  return (
    <PathStudioClient
      languageId={languageId}
      prefillScenario={prefillScenario}
      isPremium={isPremium}
    />
  );
}
