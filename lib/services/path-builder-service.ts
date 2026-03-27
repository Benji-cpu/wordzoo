import { sql } from '@/lib/db/client';
import type {
  PathBuilderDraft,
  PathBuilderPhase,
  PathBuilderDraftContent,
  PathBuilderScenarioContext,
} from '@/types/database';

// --- Draft CRUD ---

export async function createDraft(
  userId: string,
  sessionId: string,
  languageId: string
): Promise<PathBuilderDraft> {
  const rows = await sql`
    INSERT INTO path_builder_drafts (user_id, session_id, language_id)
    VALUES (${userId}, ${sessionId}, ${languageId})
    RETURNING *
  `;
  return rows[0] as PathBuilderDraft;
}

export async function getDraftBySessionId(sessionId: string): Promise<PathBuilderDraft | null> {
  const rows = await sql`
    SELECT * FROM path_builder_drafts WHERE session_id = ${sessionId}
  `;
  return (rows[0] as PathBuilderDraft) ?? null;
}

export async function getDraftByUserId(
  userId: string,
  languageId: string
): Promise<PathBuilderDraft | null> {
  const rows = await sql`
    SELECT * FROM path_builder_drafts
    WHERE user_id = ${userId} AND language_id = ${languageId}
      AND current_phase != 'completed'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return (rows[0] as PathBuilderDraft) ?? null;
}

export async function updateDraftPhase(
  draftId: string,
  phase: PathBuilderPhase
): Promise<void> {
  await sql`
    UPDATE path_builder_drafts
    SET current_phase = ${phase}, updated_at = NOW()
    WHERE id = ${draftId}
  `;
}

export async function updateDraftContent(
  draftId: string,
  content: PathBuilderDraftContent
): Promise<void> {
  await sql`
    UPDATE path_builder_drafts
    SET draft_content = ${JSON.stringify(content)}, updated_at = NOW()
    WHERE id = ${draftId}
  `;
}

export async function updateDraftScenarioContext(
  draftId: string,
  context: PathBuilderScenarioContext
): Promise<void> {
  await sql`
    UPDATE path_builder_drafts
    SET scenario_context = ${JSON.stringify(context)}, updated_at = NOW()
    WHERE id = ${draftId}
  `;
}

// --- Vocab Item Actions ---

export async function handleVocabAction(
  draftId: string,
  wordText: string,
  action: 'keep' | 'remove'
): Promise<PathBuilderDraftContent> {
  const draft = await getDraftById(draftId);
  if (!draft) throw new Error('Draft not found');

  const content = draft.draft_content as PathBuilderDraftContent;
  const idx = content.vocabulary.findIndex((v) => v.word === wordText);
  if (idx === -1) throw new Error('Vocabulary item not found');

  content.vocabulary[idx].status = action === 'keep' ? 'kept' : 'removed';
  await updateDraftContent(draftId, content);
  return content;
}

export async function addVocabItem(
  draftId: string,
  item: { word: string; romanization: string; meaning: string; mnemonicHint: string; partOfSpeech: string }
): Promise<void> {
  const draft = await getDraftById(draftId);
  if (!draft) throw new Error('Draft not found');

  const content = draft.draft_content as PathBuilderDraftContent;
  content.vocabulary.push({
    tempId: crypto.randomUUID(),
    word: item.word,
    romanization: item.romanization,
    meaning: item.meaning,
    mnemonicHint: item.mnemonicHint,
    partOfSpeech: item.partOfSpeech,
    status: 'pending',
  });
  await updateDraftContent(draftId, content);
}

// --- Helpers ---

async function getDraftById(draftId: string): Promise<PathBuilderDraft | null> {
  const rows = await sql`
    SELECT * FROM path_builder_drafts WHERE id = ${draftId}
  `;
  return (rows[0] as PathBuilderDraft) ?? null;
}

// --- Access Check ---

export async function getUserCustomPathCount(userId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM paths
    WHERE user_id = ${userId} AND type = 'custom'
  `;
  return (rows[0] as { count: number })?.count ?? 0;
}

export async function canCreatePath(userId: string, isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const count = await getUserCustomPathCount(userId);
  return count < 1; // Free users get 1 lifetime custom path
}
