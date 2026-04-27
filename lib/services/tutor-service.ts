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
import { getUserProfile } from '@/lib/db/queries';
import { l1NameFromCode } from '@/lib/ai/tutor-prompts';

const MAX_GUIDED_TURNS = 6;
const MAX_FREE_TURNS = 10;
import { generateChat, generateChatStream } from '@/lib/ai/gemini';
import { buildTutorSystemPrompt, buildGuidedConversationPrompt, getGuidedPhase, getFreeChatPhase } from '@/lib/ai/tutor-prompts';
import { buildAdaptiveContext } from '@/lib/services/learner-profile-service';
import { createDraft, getDraftBySessionId } from '@/lib/services/path-builder-service';
import { buildPathBuilderDiscoveryPrompt, buildPathBuilderVocabPrompt } from '@/lib/ai/tutor-prompts';
import type { PathBuilderScenarioContext } from '@/types/database';
import type { GeminiChatMessage } from '@/types/ai';
import type { TutorMessage } from '@/types/database';

function countNewWordsIntroduced(
  modelMessages: TutorMessage[],
  knownWordTexts: Set<string>
): { count: number; words: string[] } {
  const wordPattern = /\*\*([^*]+)\*\*/g;
  const newWords: string[] = [];
  const seen = new Set<string>();
  for (const msg of modelMessages) {
    let match;
    while ((match = wordPattern.exec(msg.content)) !== null) {
      const word = match[1].toLowerCase();
      if (!knownWordTexts.has(word) && !seen.has(word)) {
        seen.add(word);
        newWords.push(match[1]);
      }
    }
  }
  return { count: newWords.length, words: newWords };
}

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

  const [knownWords, dueWords, { contextString: adaptiveCtx, proficiencyTier }, userProfile] = await Promise.all([
    getUserKnownWords(userId, languageId),
    getUserDueWords(userId, languageId),
    buildAdaptiveContext(userId, languageId),
    getUserProfile(userId),
  ]);
  const l1Name = l1NameFromCode(userProfile?.native_language);

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
      languageCode: language.code,
      l1Name,
      mode,
      scenario,
      knownWords,
      dueWords,
      adaptiveContext: adaptiveCtx,
      userName,
      proficiencyTier,
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

  const [dialogues, phrases, { contextString: adaptiveCtx, proficiencyTier }, userProfile] = await Promise.all([
    getSceneDialogues(sceneId),
    getScenePhrases(sceneId),
    buildAdaptiveContext(userId, languageId),
    getUserProfile(userId),
  ]);

  const systemPrompt = buildGuidedConversationPrompt({
    languageName: language.name,
    languageCode: language.code,
    l1Name: l1NameFromCode(userProfile?.native_language),
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
    adaptiveContext: adaptiveCtx,
    userName,
    currentUserTurn: 0,
    isLastTurn: false,
    proficiencyTier,
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
): Promise<{ stream: ReadableStream<string>; completePromise: Promise<void>; isLastTurn: boolean }> {
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
  const [{ contextString: adaptiveCtx, proficiencyTier }, userProfile] = await Promise.all([
    buildAdaptiveContext(userId, session.language_id),
    getUserProfile(userId),
  ]);
  const l1Name = l1NameFromCode(userProfile?.native_language);

  let isLastTurn = false;
  if (session.mode === 'guided_conversation' && session.scene_id) {
    const userTurnCount = dbMessages.filter(m => m.role === 'user').length;
    isLastTurn = userTurnCount >= MAX_GUIDED_TURNS;
    const [dialogues, phrases] = await Promise.all([
      getSceneDialogues(session.scene_id),
      getScenePhrases(session.scene_id),
    ]);
    const phase = getGuidedPhase(userTurnCount, MAX_GUIDED_TURNS);
    systemPrompt = buildGuidedConversationPrompt({
      languageName: language.name,
      languageCode: language.code,
      l1Name,
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
      adaptiveContext: adaptiveCtx,
      userName,
      currentUserTurn: userTurnCount,
      isLastTurn,
      proficiencyTier,
      phase,
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

    // Vocabulary budget tracking
    const knownSet = new Set([
      ...knownWords.map(w => w.text.toLowerCase()),
      ...dueWords.map(w => w.text.toLowerCase()),
    ]);
    const modelMessages = dbMessages.filter(m => m.role === 'model');
    const { count: newWordsUsed } = countNewWordsIntroduced(modelMessages, knownSet);
    const maxNewWords = 3;

    // Free chat phase + auto-end
    const userTurnCount = dbMessages.filter(m => m.role === 'user').length;
    const budgetRemaining = Math.max(0, maxNewWords - newWordsUsed);
    const phase = getFreeChatPhase(userTurnCount, MAX_FREE_TURNS, budgetRemaining);
    if (userTurnCount >= MAX_FREE_TURNS) {
      isLastTurn = true;
    }

    systemPrompt = buildTutorSystemPrompt({
      languageName: language.name,
      languageCode: language.code,
      l1Name,
      mode: session.mode,
      scenario: session.scenario,
      knownWords,
      dueWords,
      adaptiveContext: adaptiveCtx,
      userName,
      proficiencyTier,
      newWordsIntroduced: newWordsUsed,
      maxNewWords,
      phase,
      currentUserTurn: userTurnCount,
    });
  }

  // Bumped from default 1024 → 4096. User reported tutor responses being
  // cut off mid-sentence; replies often include the main turn, an
  // [EN: ...] translation line, and a [SUGGEST: ...] line, which adds up.
  const { stream, tokensPromise } = await generateChatStream(chatMessages, systemPrompt, { maxOutputTokens: 4096 });

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
    if (isLastTurn) {
      endSession(sessionId, userId).catch(() => {});
    }
  })();

  return { stream: clientStream, completePromise, isLastTurn };
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
    const { contextString: adaptiveCtx } = await buildAdaptiveContext(userId, session.language_id);
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
