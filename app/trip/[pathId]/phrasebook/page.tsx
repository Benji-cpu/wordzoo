import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import {
  getPathById,
  getSceneMasteryForPath,
  getSceneWordsWithDetails,
  getUserPathRow,
} from '@/lib/db/queries';
import { Phrasebook } from '@/components/trip/Phrasebook';

interface PageProps {
  params: Promise<{ pathId: string }>;
}

export default async function PhrasebookPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?return=/trip');
  }

  const { pathId } = await params;
  const path = await getPathById(pathId);
  if (!path || path.type !== 'travel') {
    notFound();
  }

  const [scenes, userPath] = await Promise.all([
    getSceneMasteryForPath(session.user.id, pathId),
    getUserPathRow(session.user.id, pathId),
  ]);

  // Pull words for every scene in parallel.
  const sceneWords = await Promise.all(
    scenes.map((s) => getSceneWordsWithDetails(s.id, session.user!.id!))
  );

  const days = scenes.map((s, i) => ({
    sceneId: s.id,
    title: s.title,
    description: s.description,
    dayNumber: i + 1,
    words: sceneWords[i].map((w) => ({
      text: w.text,
      romanization: w.romanization,
      meaning: w.meaning_en,
      partOfSpeech: w.part_of_speech,
      mastered: w.user_word_status === 'mastered' || w.user_word_status === 'reviewing',
    })),
  }));

  return (
    <Phrasebook
      pathId={path.id}
      pathTitle={path.title}
      pathDescription={path.description ?? null}
      tripStartDate={userPath?.trip_start_date ?? null}
      days={days}
    />
  );
}
