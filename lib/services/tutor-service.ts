import {
  insertTutorSession,
  getTutorSessionById,
  updateTutorSession,
  insertTutorMessage,
  getTutorMessages,
  countTutorUserMessages,
  claimTutorSessionEnd,
  getUserKnownWords,
  getUserDueWords,
  getWordsByIds,
  getLanguageById,
  insertGuidedConversationSession,
  getSceneDialogues,
  getScenePhrases,
  updateTutorSessionLearnerContext,
} from '@/lib/db';
import { getUserProfile } from '@/lib/db/queries';
import { l1NameFromCode } from '@/lib/ai/tutor-prompts';

// Single source of truth, shared with the client's turn indicator.
import { MAX_GUIDED_TURNS, MAX_FREE_TURNS } from '@/lib/tutor/modes';
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
  userName?: string | null,
  focusWordIds?: string[]
): Promise<{ sessionId: string; greeting: string }> {
  const session = await insertTutorSession(userId, languageId, mode, scenario);

  const language = await getLanguageById(languageId);
  if (!language) throw new Error('Language not found');

  const [knownWords, defaultDueWords, { contextString: adaptiveCtx, proficiencyTier }, userProfile] = await Promise.all([
    getUserKnownWords(userId, languageId),
    getUserDueWords(userId, languageId),
    buildAdaptiveContext(userId, languageId),
    getUserProfile(userId),
  ]);
  const l1Name = l1NameFromCode(userProfile?.native_language);

  // Review→tutor handoff: the user arrives having just cleared their due
  // queue, so seed the word_review prompt with the words they just reviewed
  // instead of the (now empty) due list.
  let dueWords = defaultDueWords;
  if (mode === 'word_review' && focusWordIds && focusWordIds.length > 0) {
    const focusWords = await getWordsByIds(focusWordIds, languageId);
    if (focusWords.length > 0) dueWords = focusWords;
  }

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
    maxTurns: MAX_GUIDED_TURNS,
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

// Map the user-facing easy/medium/hard control to the prompt tier. Hard
// is the strongest pure-target-language signal; easy keeps L1 scaffolding.
const CHALLENGE_TIER_MAP = {
  easy: 'beginner',
  medium: 'intermediate',
  hard: 'advanced',
} as const;

export async function sendMessage(
  sessionId: string,
  userId: string,
  userMessage: string,
  userName?: string | null,
  challengeMode?: 'easy' | 'medium' | 'hard'
): Promise<{ stream: ReadableStream<string>; completePromise: Promise<void>; isLastTurn: boolean }> {
  const session = await getTutorSessionById(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.user_id !== userId) throw new Error('Unauthorized');
  if (session.ended_at) throw new Error('Session has ended');

  // The learner's message is deliberately NOT persisted yet. It used to be
  // written here, before the model call — so when Gemini failed (e.g. the
  // quota 429 that produced "Failed to send message"), the turn was already in
  // the database with no reply. Retrying appended a duplicate, which inflated
  // the turn count, corrupted the alternation the model sees, and eventually
  // auto-ended the session early. It is written below, once the stream is
  // live, so a failed send leaves no trace and is safe to retry.
  const [dbMessages, priorUserTurns] = await Promise.all([
    getTutorMessages(sessionId),
    countTutorUserMessages(sessionId),
  ]);
  const chatMessages: GeminiChatMessage[] = [
    ...dbMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];
  // Turn numbering counts the message being sent right now.
  const userTurnCount = priorUserTurns + 1;

  const language = await getLanguageById(session.language_id);
  if (!language) throw new Error('Language not found');

  let systemPrompt: string;
  const [{ contextString: adaptiveCtx, proficiencyTier }, userProfile] = await Promise.all([
    buildAdaptiveContext(userId, session.language_id),
    getUserProfile(userId),
  ]);
  const l1Name = l1NameFromCode(userProfile?.native_language);

  // User's UI-selected difficulty wins over the inferred tier when present.
  const effectiveTier = challengeMode ? CHALLENGE_TIER_MAP[challengeMode] : proficiencyTier;

  let isLastTurn = false;
  if (session.mode === 'guided_conversation' && session.scene_id) {
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
      proficiencyTier: effectiveTier,
      phase,
      maxTurns: MAX_GUIDED_TURNS,
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
      proficiencyTier: effectiveTier,
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

  // The model call succeeded and bytes are about to flow, so the learner's
  // turn is now real. Awaited (not fire-and-forget) so it is ordered strictly
  // before the model reply that follows it.
  await insertTutorMessage(sessionId, 'user', userMessage);

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
    // A stream that yields nothing (aborted mid-flight, or a thinking model
    // that spent its whole budget reasoning) must not be saved: an empty row
    // renders as a blank bubble and permanently poisons the history the model
    // is replayed. Leaving it out lets the learner simply send again.
    if (fullResponse.trim() === '') {
      console.error(`[tutor-service] Empty model reply for session ${sessionId} — not saved`);
      await updateTutorSession(sessionId, { tokensUsed: tokens });
      return;
    }
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

  // Everything here is derived from rows we already hold — no model call — so
  // it is safe to build before knowing whether we won the claim below.
  const baseSummary: Record<string, unknown> = {
    messageCount: messages.length,
    userMessageCount: userMessages.length,
    modelMessageCount: modelMessages.length,
    wordsUsed: Array.from(mentionedWords),
    wordCount: mentionedWords.size,
    durationMinutes,
    mode: session.mode,
  };

  // Hitting the turn cap ends a session twice — once fire-and-forget from the
  // stream, once from the client's POST. Claim first so only one caller pays
  // for the evaluation; the loser returns what the winner wrote (or, if that
  // hasn't landed yet, the deterministic summary above).
  const claimed = await claimTutorSessionEnd(sessionId);
  if (!claimed) {
    // The winner is probably still waiting on the model. Give it a moment
    // rather than returning immediately — whichever caller the learner is
    // actually watching must still get the evaluation, or losing the race
    // would silently strip the summary screen of its most useful section.
    for (let attempt = 0; attempt < 20; attempt++) {
      const current = await getTutorSessionById(sessionId);
      const existing = current?.summary as Record<string, unknown> | null | undefined;
      if (existing && Object.keys(existing).length > 0) return existing;
      await new Promise((r) => setTimeout(r, 250));
    }
    // Winner is wedged or its evaluation threw. The deterministic summary is
    // still true, just thinner.
    console.warn(`[tutor-service] Timed out waiting for the session summary of ${sessionId}`);
    return baseSummary;
  }

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
    ...baseSummary,
    ...(evaluation && { evaluation }),
  };

  // `ended_at` was already stamped by the claim.
  await updateTutorSession(sessionId, { summary });

  // Fire-and-forget: SRS bridge analysis + learner profile update
  (async () => {
    try {
      const { analyzeSessionWordUsage, recordConversationReviews, bridgeIntroducedWords } = await import('@/lib/services/tutor-srs-bridge');
      const { updateFromSession } = await import('@/lib/services/learner-profile-service');

      const [knownWords, dueWords] = await Promise.all([
        getUserKnownWords(userId, session.language_id),
        getUserDueWords(userId, session.language_id),
      ]);

      const wordUsage = await analyzeSessionWordUsage(messages, knownWords, dueWords, session.language_id);
      const srsResult = await recordConversationReviews(userId, sessionId, session.language_id, wordUsage);

      // Deterministic fallback: bolded tutor words that the LLM analysis didn't
      // bridge (or couldn't — empty-vocab users skip the LLM path entirely)
      const knownTexts = new Set([
        ...knownWords.map((w) => w.text.toLowerCase()),
        ...dueWords.map((w) => w.text.toLowerCase()),
      ]);
      const alreadyBridged = new Set(wordUsage.introduced.map((e) => e.wordId));
      const extraIntroduced = await bridgeIntroducedWords(
        userId, sessionId, session.language_id,
        Array.from(mentionedWords), knownTexts, alreadyBridged
      );

      // Enrich session summary with SRS data
      await updateTutorSession(sessionId, {
        summary: {
          ...summary,
          srsReviewsRecorded: srsResult.reviewsRecorded,
          wordsIntroduced: srsResult.wordsIntroduced + extraIntroduced,
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
