import type { Path, StudioMessage, StudioIntakeData, StudioPathPreview, StudioSession, StudioChip } from '@/types/database';
import type { GeminiChatMessage } from '@/types/ai';
import {
  insertStudioSession,
  getStudioSessionById,
  updateStudioSession,
  insertPath,
  insertScene,
  insertSceneWord,
  insertPathWord,
  insertWord,
  insertSceneDialogue,
  findWordByTextAndLanguage,
  upsertUserPath,
  getLanguageById,
  getUserKnownWords,
} from '@/lib/db/queries';
import { generateText, generateChat } from '@/lib/ai/gemini';
import {
  buildStudioConversationPrompt,
  buildSubScenarioPrompt,
  buildStudioPathGenerationPrompt,
} from '@/lib/ai/studio-prompts';
import { buildAdaptiveContext } from '@/lib/services/learner-profile-service';

// ---- Internal types for AI-generated path structure ----

interface GeneratedWord {
  text: string;
  romanization: string | null;
  meaning: string;
  part_of_speech: string;
}

interface GeneratedDialogueLine {
  speaker: string;
  text_target: string;
  text_en: string;
}

interface GeneratedScene {
  title: string;
  description: string;
  words: GeneratedWord[];
  dialogue: GeneratedDialogueLine[];
}

interface GeneratedStudioPath {
  pathTitle: string;
  pathDescription: string;
  scenes: GeneratedScene[];
}

// ---- Internal type for conversation response from Gemini ----

interface ConversationResponse {
  text: string;
  visual_elements?: StudioMessage['visual_elements'];
  intake_progress?: StudioMessage['intake_progress'];
  path_preview?: StudioPathPreview;
}

// ---- JSON parsing helpers ----

function stripJsonFences(raw: string): string {
  return raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
}

function parseConversationResponse(raw: string): ConversationResponse {
  const cleaned = stripJsonFences(raw);
  let parsed: ConversationResponse;
  try {
    parsed = JSON.parse(cleaned) as ConversationResponse;
  } catch {
    // Fallback: treat raw text as the message text
    return { text: raw.trim(), visual_elements: [] };
  }
  if (!parsed.text) {
    parsed.text = '';
  }
  return parsed;
}

function parseStudioPathResponse(raw: string): GeneratedStudioPath {
  const cleaned = stripJsonFences(raw);
  let parsed: GeneratedStudioPath;
  try {
    parsed = JSON.parse(cleaned) as GeneratedStudioPath;
  } catch {
    throw new Error('Failed to parse AI path response as JSON. The model returned malformed output.');
  }
  if (!parsed.pathTitle || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error('Invalid studio path response structure');
  }
  return parsed;
}

// ---- startStudioSession ----

export async function startStudioSession(
  userId: string,
  languageId: string,
  prefillContext?: string
): Promise<{ sessionId: string; message: StudioMessage }> {
  const language = await getLanguageById(languageId);
  if (!language) {
    throw new Error('Language not found');
  }

  // Create the session in DB
  const session = await insertStudioSession({ userId, languageId });

  // Build adaptive learner context
  let adaptiveContext: string | undefined;
  try {
    adaptiveContext = await buildAdaptiveContext(userId, languageId);
  } catch {
    // Non-fatal — proceed without learner context
  }

  // Build system prompt
  const systemPrompt = buildStudioConversationPrompt({
    languageName: language.name,
    adaptiveContext: adaptiveContext || undefined,
    currentIntake: {},
    prefillScenario: prefillContext,
  });

  // Initial user message to kick off the conversation
  const initialUserMessage = prefillContext
    ? `I want to create a learning path about: ${prefillContext}`
    : 'I want to create a new learning path';

  const chatMessages: GeminiChatMessage[] = [
    { role: 'user', content: initialUserMessage },
  ];

  const response = await generateChat(chatMessages, systemPrompt);
  const parsed = parseConversationResponse(response.text);

  const now = new Date().toISOString();

  const userMsg: StudioMessage = {
    role: 'user',
    content: initialUserMessage,
    timestamp: now,
  };

  const tutorMsg: StudioMessage = {
    role: 'model',
    content: parsed.text,
    visual_elements: parsed.visual_elements,
    intake_progress: parsed.intake_progress,
    path_preview: parsed.path_preview,
    timestamp: now,
  };

  const messages: StudioMessage[] = [userMsg, tutorMsg];

  // Persist messages (and path_preview if present) to session
  await updateStudioSession(session.id, {
    messages,
    ...(parsed.path_preview ? { pathPreview: parsed.path_preview } : {}),
  });

  return { sessionId: session.id, message: tutorMsg };
}

// ---- handleStudioMessage ----

export async function handleStudioMessage(
  sessionId: string,
  userId: string,
  message: string,
  selections?: string[]
): Promise<StudioMessage> {
  const session = await getStudioSessionById(sessionId);
  if (!session) {
    throw new Error('Studio session not found');
  }
  if (session.user_id !== userId) {
    throw new Error('Unauthorized');
  }
  if (session.status !== 'active') {
    throw new Error('Studio session is no longer active');
  }

  const language = await getLanguageById(session.language_id);
  if (!language) {
    throw new Error('Language not found');
  }

  const now = new Date().toISOString();
  const existingMessages: StudioMessage[] = Array.isArray(session.messages) ? session.messages : [];

  // Merge selections into intake_data
  let intakeData: StudioIntakeData = { ...(session.intake_data ?? {}) };

  if (selections && selections.length > 0) {
    // Determine current step from the last model message's intake_progress
    const lastModelMsg = [...existingMessages].reverse().find((m) => m.role === 'model');
    const currentStep = lastModelMsg?.intake_progress?.current_step ?? 1;

    if (currentStep === 1) {
      // Step 1 = category (single select)
      intakeData.category = selections[0];
    } else if (currentStep === 2) {
      // Step 2 = scenario (single select)
      intakeData.scenario = selections[0];
    } else if (currentStep === 3) {
      // Step 3 = sub_scenarios / focus areas (multi select)
      intakeData.sub_scenarios = selections;
    } else if (currentStep === 4) {
      // Step 4 = difficulty (single select chip/card id)
      const diffMap: Record<string, StudioIntakeData['difficulty']> = {
        beginner: 'beginner',
        intermediate: 'intermediate',
        advanced: 'advanced',
      };
      intakeData.difficulty = diffMap[selections[0]] ?? 'intermediate';
    }
  }

  // Append user message
  const userMsg: StudioMessage = {
    role: 'user',
    content: message,
    timestamp: now,
  };
  const updatedMessages = [...existingMessages, userMsg];

  // Build system prompt with current intake state
  const adaptiveContext = undefined; // Skip re-fetching adaptive context mid-session for speed
  const systemPrompt = buildStudioConversationPrompt({
    languageName: language.name,
    adaptiveContext,
    currentIntake: intakeData,
  });

  // Build chat history for Gemini
  const chatMessages: GeminiChatMessage[] = updatedMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await generateChat(chatMessages, systemPrompt);
  const parsed = parseConversationResponse(response.text);

  // Update intake_data from intake_progress if can_generate is set
  if (parsed.intake_progress?.can_generate) {
    intakeData.confirmed = true;
  }

  const tutorMsg: StudioMessage = {
    role: 'model',
    content: parsed.text,
    visual_elements: parsed.visual_elements,
    intake_progress: parsed.intake_progress,
    path_preview: parsed.path_preview,
    timestamp: now,
  };

  const finalMessages = [...updatedMessages, tutorMsg];

  // Persist everything back
  await updateStudioSession(sessionId, {
    messages: finalMessages,
    intakeData,
    ...(parsed.path_preview ? { pathPreview: parsed.path_preview } : {}),
  });

  return tutorMsg;
}

// ---- generateStudioPath ----

export async function generateStudioPath(
  sessionId: string,
  userId: string
): Promise<Path> {
  const session = await getStudioSessionById(sessionId);
  if (!session) {
    throw new Error('Studio session not found');
  }
  if (session.user_id !== userId) {
    throw new Error('Unauthorized');
  }

  const intakeData: StudioIntakeData = session.intake_data ?? {};
  if (!intakeData.confirmed) {
    throw new Error('Intake is not yet confirmed — cannot generate path');
  }

  const language = await getLanguageById(session.language_id);
  if (!language) {
    throw new Error('Language not found');
  }

  // Get known vocabulary to avoid duplicates
  const knownWords = await getUserKnownWords(userId, session.language_id, 200);
  const knownVocabulary = knownWords.map((w) => w.text);

  // Build prompt and call Gemini
  const prompt = buildStudioPathGenerationPrompt(intakeData, language.name, knownVocabulary);

  const response = await generateText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 8192,
  });

  const generated = parseStudioPathResponse(response.text);

  // Insert path
  const path = await insertPath({
    languageId: session.language_id,
    userId,
    type: 'studio',
    title: generated.pathTitle,
    description: generated.pathDescription,
  });

  // Process scenes
  let globalWordOrder = 0;
  for (let sceneIdx = 0; sceneIdx < generated.scenes.length; sceneIdx++) {
    const genScene = generated.scenes[sceneIdx];

    const scene = await insertScene({
      pathId: path.id,
      title: genScene.title,
      description: genScene.description,
      sortOrder: sceneIdx,
      sceneType: 'dialogue',
      sceneContext: genScene.description,
    });

    // Insert words
    for (let wordIdx = 0; wordIdx < genScene.words.length; wordIdx++) {
      const genWord = genScene.words[wordIdx];

      let word = await findWordByTextAndLanguage(genWord.text, session.language_id);
      if (!word) {
        word = await insertWord({
          languageId: session.language_id,
          text: genWord.text,
          romanization: genWord.romanization,
          meaningEn: genWord.meaning,
          partOfSpeech: genWord.part_of_speech,
        });
      }

      await insertSceneWord(scene.id, word.id, wordIdx);
      await insertPathWord(path.id, word.id, globalWordOrder);
      globalWordOrder++;
    }

    // Insert dialogue lines
    const dialogueLines = Array.isArray(genScene.dialogue) ? genScene.dialogue : [];
    for (let lineIdx = 0; lineIdx < dialogueLines.length; lineIdx++) {
      const line = dialogueLines[lineIdx];
      await insertSceneDialogue({
        sceneId: scene.id,
        speaker: line.speaker,
        textTarget: line.text_target,
        textEn: line.text_en,
        sortOrder: lineIdx,
      });
    }
  }

  // Auto-activate path for user
  await upsertUserPath(userId, path.id, 'active');

  // Mark session as completed
  await updateStudioSession(sessionId, {
    status: 'completed',
    pathId: path.id,
  });

  return path;
}

// ---- generateSubScenarioChips ----

export async function generateSubScenarioChips(
  sessionId: string,
  scenario: string
): Promise<StudioChip[]> {
  const session = await getStudioSessionById(sessionId);
  if (!session) {
    throw new Error('Studio session not found');
  }

  const language = await getLanguageById(session.language_id);
  if (!language) {
    throw new Error('Language not found');
  }

  const prompt = buildSubScenarioPrompt(scenario, language.name);

  const response = await generateText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 512,
  });

  const cleaned = stripJsonFences(response.text);
  let chips: StudioChip[];
  try {
    chips = JSON.parse(cleaned) as StudioChip[];
  } catch {
    throw new Error('Failed to parse sub-scenario chips response');
  }

  if (!Array.isArray(chips)) {
    throw new Error('Invalid chips response — expected JSON array');
  }

  return chips;
}
