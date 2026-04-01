import {
  insertTutorSession,
  getTutorSessionById,
  updateTutorSession,
  insertTutorMessage,
  getTutorMessages,
  getUserKnownWords,
  getUserDueWords,
  getLanguageById,
  insertGuidedConversationSession,
  getSceneDialogues,
  getScenePhrases,
  updateTutorSessionLearnerContext,
} from '@/lib/db';
import { generateChat, generateChatStream } from '@/lib/ai/gemini';
import { buildTutorSystemPrompt, buildGuidedConversationPrompt } from '@/lib/ai/tutor-prompts';
import { buildAdaptiveContext } from '@/lib/services/learner-profile-service';
import { createDraft, getDraftBySessionId } from '@/lib/services/path-builder-service';
import { buildPathBuilderDiscoveryPrompt, buildPathBuilderVocabPrompt } from '@/lib/ai/tutor-prompts';
import type { PathBuilderScenarioContext } from '@/types/database';
import type { GeminiChatMessage } from '@/types/ai';

export async function startSession(
  userId: string,
  mode: string,
  languageId: string,
  scenario?: string,
  userName?: string | null
): Promise<{ sessionId: string; greeting: string }> {
  const session = await insertTutorSession(userId, languageId, mode, scenario);

  const language = await getLanguageById(languageId);
  if (!language) throw new Error('Language not found');

  const [knownWords, dueWords, adaptiveCtx] = await Promise.all([
    getUserKnownWords(userId, languageId),
    getUserDueWords(userId, languageId),
    buildAdaptiveContext(userId, languageId),
  ]);

  let systemPrompt: string;

  if (mode === 'path_builder') {
    systemPrompt = buildPathBuilderDiscoveryPrompt({
      languageName: language.name,
      scenarioContext: { scenario: '', proficiency: '', subtopics: [], preferences: [] },
      knownWords,
      adaptiveContext: adaptiveCtx,
    });
  } else {
    systemPrompt = buildTutorSystemPrompt({
      languageName: language.name,
      mode,
      scenario,
      knownWords,
      dueWords,
      adaptiveContext: adaptiveCtx,
      userName,
    });
  }

  // Save adaptive context snapshot to session
  if (adaptiveCtx) {
    updateTutorSessionLearnerContext(session.id, { context: adaptiveCtx }).catch(() => {});
  }

  const greetingMessages: GeminiChatMessage[] = [
    { role: 'user', content: 'Start the conversation with a greeting.' },
  ];

  const response = await generateChat(greetingMessages, systemPrompt);
  await insertTutorMessage(session.id, 'model', response.text);
  await updateTutorSession(session.id, { tokensUsed: response.tokensUsed });

  if (mode === 'path_builder') {
    await createDraft(userId, session.id, languageId);
  }

  return { sessionId: session.id, greeting: response.text };
}

export async function startGuidedSession(
  userId: string,
  languageId: string,
  sceneId: string,
  sceneContext: string,
  userName?: string | null
): Promise<{ sessionId: string; greeting: string }> {
  const session = await insertGuidedConversationSession(userId, languageId, sceneId, sceneContext);

  const language = await getLanguageById(languageId);
  if (!language) throw new Error('Language not found');

  const [dialogues, phrases, knownWords, adaptiveCtx] = await Promise.all([
    getSceneDialogues(sceneId),
    getScenePhrases(sceneId),
    getUserKnownWords(userId, languageId),
    buildAdaptiveContext(userId, languageId),
  ]);

  const systemPrompt = buildGuidedConversationPrompt({
    languageName: language.name,
    sceneContext,
    dialogueLines: dialogues.map((d) => ({
      speaker: d.speaker,
      text_target: d.text_target,
      text_en: d.text_en,
    })),
    phrases: phrases.map((p) => ({
      text_target: p.text_target,
      text_en: p.text_en,
    })),
    knownWords,
    adaptiveContext: adaptiveCtx,
    userName,
  });

  if (adaptiveCtx) {
    updateTutorSessionLearnerContext(session.id, { context: adaptiveCtx }).catch(() => {});
  }

  const greetingMessages: GeminiChatMessage[] = [
    { role: 'user', content: 'Start the practice conversation. Keep your opening to 1-2 short sentences — no scene-setting.' },
  ];

  const response = await generateChat(greetingMessages, systemPrompt);
  await insertTutorMessage(session.id, 'model', response.text);
  await updateTutorSession(session.id, { tokensUsed: response.tokensUsed });

  return { sessionId: session.id, greeting: response.text };
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  userMessage: string,
  userName?: string | null
): Promise<{ stream: ReadableStream<string>; completePromise: Promise<void> }> {
  const session = await getTutorSessionById(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.user_id !== userId) throw new Error('Unauthorized');
  if (session.ended_at) throw new Error('Session has ended');

  await insertTutorMessage(sessionId, 'user', userMessage);

  const dbMessages = await getTutorMessages(sessionId);
  const chatMessages: GeminiChatMessage[] = dbMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const language = await getLanguageById(session.language_id);
  if (!language) throw new Error('Language not found');

  let systemPrompt: string;
  const adaptiveCtx = await buildAdaptiveContext(userId, session.language_id);

  if (session.mode === 'guided_conversation' && session.scene_id) {
    const [dialogues, phrases, knownWords] = await Promise.all([
      getSceneDialogues(session.scene_id),
      getScenePhrases(session.scene_id),
      getUserKnownWords(userId, session.language_id),
    ]);
    systemPrompt = buildGuidedConversationPrompt({
      languageName: language.name,
      sceneContext: session.scenario ?? '',
      dialogueLines: dialogues.map((d) => ({
        speaker: d.speaker,
        text_target: d.text_target,
        text_en: d.text_en,
      })),
      phrases: phrases.map((p) => ({
        text_target: p.text_target,
        text_en: p.text_en,
      })),
      knownWords,
      adaptiveContext: adaptiveCtx,
      userName,
    });
  } else if (session.mode === 'path_builder') {
    const draft = await getDraftBySessionId(sessionId);
    const knownWords = await getUserKnownWords(userId, session.language_id);

    if (draft && draft.current_phase === 'vocabulary') {
      const scenarioCtx = (draft.scenario_context ?? {}) as PathBuilderScenarioContext;
      const confirmedVocab = draft.draft_content.vocabulary
        .filter((v) => v.status === 'kept')
        .map((v) => ({ word: v.word, meaning: v.meaning }));

      systemPrompt = buildPathBuilderVocabPrompt({
        languageName: language.name,
        scenarioContext: {
          scenario: scenarioCtx.scenario ?? '',
          proficiency: scenarioCtx.proficiency ?? 'beginner',
          subtopics: scenarioCtx.subtopics ?? [],
          preferences: scenarioCtx.preferences ?? [],
        },
        knownWords,
        adaptiveContext: adaptiveCtx,
        confirmedVocab,
      });
    } else {
      systemPrompt = buildPathBuilderDiscoveryPrompt({
        languageName: language.name,
        scenarioContext: {
          scenario: (draft?.scenario_context as PathBuilderScenarioContext)?.scenario ?? '',
          proficiency: (draft?.scenario_context as PathBuilderScenarioContext)?.proficiency ?? '',
          subtopics: (draft?.scenario_context as PathBuilderScenarioContext)?.subtopics ?? [],
          preferences: (draft?.scenario_context as PathBuilderScenarioContext)?.preferences ?? [],
        },
        knownWords,
        adaptiveContext: adaptiveCtx,
      });
    }
  } else {
    const [knownWords, dueWords] = await Promise.all([
      getUserKnownWords(userId, session.language_id),
      getUserDueWords(userId, session.language_id),
    ]);
    systemPrompt = buildTutorSystemPrompt({
      languageName: language.name,
      mode: session.mode,
      scenario: session.scenario,
      knownWords,
      dueWords,
      adaptiveContext: adaptiveCtx,
      userName,
    });
  }

  const { stream, tokensPromise } = await generateChatStream(chatMessages, systemPrompt);

  let fullResponse = '';
  const [clientStream, saveStream] = stream.tee();

  const completePromise = (async () => {
    const reader = saveStream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullResponse += value;
    }
    const tokens = await tokensPromise;
    await insertTutorMessage(sessionId, 'model', fullResponse);
    await updateTutorSession(sessionId, { tokensUsed: tokens });
  })();

  return { stream: clientStream, completePromise };
}

export async function endSession(
  sessionId: string,
  userId: string
): Promise<Record<string, unknown>> {
  const session = await getTutorSessionById(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.user_id !== userId) throw new Error('Unauthorized');

  const messages = await getTutorMessages(sessionId, 1000);

  const userMessages = messages.filter((m) => m.role === 'user');
  const modelMessages = messages.filter((m) => m.role === 'model');

  // Extract bolded words from model messages: **word** (meaning)
  const wordPattern = /\*\*([^*]+)\*\*/g;
  const mentionedWords = new Set<string>();
  for (const msg of modelMessages) {
    let match;
    while ((match = wordPattern.exec(msg.content)) !== null) {
      mentionedWords.add(match[1].toLowerCase());
    }
  }

  const startedAt = new Date(session.started_at);
  const durationMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000);

  // Generate AI evaluation synchronously (adds ~1-2s, acceptable after a chat)
  let evaluation = null;
  try {
    const { generateSessionEvaluation } = await import('@/lib/services/tutor-srs-bridge');
    const adaptiveCtx = await buildAdaptiveContext(userId, session.language_id);
    evaluation = await generateSessionEvaluation(messages, adaptiveCtx, session.mode);
  } catch (error) {
    console.error(`[tutor-service] Session evaluation failed for ${sessionId}:`, error);
  }

  const summary: Record<string, unknown> = {
    messageCount: messages.length,
    userMessageCount: userMessages.length,
    modelMessageCount: modelMessages.length,
    wordsUsed: Array.from(mentionedWords),
    wordCount: mentionedWords.size,
    durationMinutes,
    mode: session.mode,
    ...(evaluation && { evaluation }),
  };

  await updateTutorSession(sessionId, {
    endedAt: new Date().toISOString(),
    summary,
  });

  // Fire-and-forget: SRS bridge analysis + learner profile update
  (async () => {
    try {
      const { analyzeSessionWordUsage, recordConversationReviews } = await import('@/lib/services/tutor-srs-bridge');
      const { updateFromSession } = await import('@/lib/services/learner-profile-service');

      const [knownWords, dueWords] = await Promise.all([
        getUserKnownWords(userId, session.language_id),
        getUserDueWords(userId, session.language_id),
      ]);

      const wordUsage = await analyzeSessionWordUsage(messages, knownWords, dueWords, session.language_id);
      const srsResult = await recordConversationReviews(userId, sessionId, session.language_id, wordUsage);

      // Enrich session summary with SRS data
      await updateTutorSession(sessionId, {
        summary: {
          ...summary,
          srsReviewsRecorded: srsResult.reviewsRecorded,
          wordsIntroduced: srsResult.wordsIntroduced,
          accuracyRate: srsResult.accuracyRate,
        },
      });

      // Update learner profile
      await updateFromSession(userId, sessionId);
    } catch (error) {
      console.error(`[tutor-service] Background processing failed for session ${sessionId}:`, error);
    }
  })().catch(console.error);

  return summary;
}
