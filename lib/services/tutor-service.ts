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
} from '@/lib/db';
import { generateChat, generateChatStream } from '@/lib/ai/gemini';
import { buildTutorSystemPrompt, buildGuidedConversationPrompt } from '@/lib/ai/tutor-prompts';
import type { GeminiChatMessage } from '@/types/ai';

export async function startSession(
  userId: string,
  mode: string,
  languageId: string,
  scenario?: string
): Promise<{ sessionId: string; greeting: string }> {
  const session = await insertTutorSession(userId, languageId, mode, scenario);

  const language = await getLanguageById(languageId);
  if (!language) throw new Error('Language not found');

  const [knownWords, dueWords] = await Promise.all([
    getUserKnownWords(userId, languageId),
    getUserDueWords(userId, languageId),
  ]);

  const systemPrompt = buildTutorSystemPrompt({
    languageName: language.name,
    mode,
    scenario,
    knownWords,
    dueWords,
  });

  const greetingMessages: GeminiChatMessage[] = [
    { role: 'user', content: 'Start the conversation with a greeting.' },
  ];

  const response = await generateChat(greetingMessages, systemPrompt);
  await insertTutorMessage(session.id, 'model', response.text);
  await updateTutorSession(session.id, { tokensUsed: response.tokensUsed });

  return { sessionId: session.id, greeting: response.text };
}

export async function startGuidedSession(
  userId: string,
  languageId: string,
  sceneId: string,
  sceneContext: string
): Promise<{ sessionId: string; greeting: string }> {
  const session = await insertGuidedConversationSession(userId, languageId, sceneId, sceneContext);

  const language = await getLanguageById(languageId);
  if (!language) throw new Error('Language not found');

  const [dialogues, phrases, knownWords] = await Promise.all([
    getSceneDialogues(sceneId),
    getScenePhrases(sceneId),
    getUserKnownWords(userId, languageId),
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
  });

  const greetingMessages: GeminiChatMessage[] = [
    { role: 'user', content: 'Start the practice conversation with a greeting.' },
  ];

  const response = await generateChat(greetingMessages, systemPrompt);
  await insertTutorMessage(session.id, 'model', response.text);
  await updateTutorSession(session.id, { tokensUsed: response.tokensUsed });

  return { sessionId: session.id, greeting: response.text };
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  userMessage: string
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
    });
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

  const summary = {
    messageCount: messages.length,
    userMessageCount: userMessages.length,
    modelMessageCount: modelMessages.length,
    wordsUsed: Array.from(mentionedWords),
    wordCount: mentionedWords.size,
    durationMinutes,
    mode: session.mode,
  };

  await updateTutorSession(sessionId, {
    endedAt: new Date().toISOString(),
    summary,
  });

  return summary;
}
