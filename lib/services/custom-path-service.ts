import type { Path } from '@/types/database';
import { generateText } from '@/lib/ai/gemini';
import {
  CUSTOM_PATH_SYSTEM_PROMPT,
  buildCustomPathPrompt,
  buildTravelPackPrompt,
} from '@/lib/ai/path-prompts';
import {
  getLanguageById,
  findWordByTextAndLanguage,
  insertWord,
  insertPath,
  insertScene,
  insertSceneWord,
  insertPathWord,
} from '@/lib/db/queries';
import { upsertUserPath } from '@/lib/db/queries';

interface GeneratedWord {
  text: string;
  romanization: string | null;
  meaning: string;
  part_of_speech: string;
}

interface GeneratedScene {
  title: string;
  narrative: string;
  words: GeneratedWord[];
}

interface GeneratedPath {
  pathTitle: string;
  pathDescription: string;
  scenes: GeneratedScene[];
}

function parsePathResponse(text: string): GeneratedPath {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed: GeneratedPath;
  try {
    parsed = JSON.parse(cleaned) as GeneratedPath;
  } catch {
    throw new Error('Failed to parse AI response as JSON. The model returned malformed output.');
  }

  if (!parsed.pathTitle || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error('Invalid path response structure');
  }

  return parsed;
}

async function buildPath(
  userId: string,
  languageId: string,
  type: 'custom' | 'travel',
  prompt: string
): Promise<Path> {
  const fullPrompt = `${CUSTOM_PATH_SYSTEM_PROMPT}\n\n${prompt}`;

  const response = await generateText(fullPrompt, {
    temperature: 0.8,
    maxOutputTokens: 4096,
  });

  const generated = parsePathResponse(response.text);

  // Insert the path
  const path = await insertPath({
    languageId,
    userId,
    type,
    title: generated.pathTitle,
    description: generated.pathDescription,
  });

  // Process each scene
  let globalWordOrder = 0;
  for (let sceneIdx = 0; sceneIdx < generated.scenes.length; sceneIdx++) {
    const genScene = generated.scenes[sceneIdx];

    const scene = await insertScene({
      pathId: path.id,
      title: genScene.title,
      description: genScene.narrative,
      sortOrder: sceneIdx,
    });

    for (let wordIdx = 0; wordIdx < genScene.words.length; wordIdx++) {
      const genWord = genScene.words[wordIdx];

      // Check if word already exists
      let word = await findWordByTextAndLanguage(genWord.text, languageId);
      if (!word) {
        word = await insertWord({
          languageId,
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
  }

  // Set as user's active path
  await upsertUserPath(userId, path.id, 'active');

  return path;
}

export async function generateCustomPath(
  userId: string,
  userInput: string,
  languageId: string
): Promise<Path> {
  const language = await getLanguageById(languageId);
  if (!language) {
    throw new Error('Language not found');
  }

  const prompt = buildCustomPathPrompt(userInput, language.name);
  return buildPath(userId, languageId, 'custom', prompt);
}

export async function generateTravelPack(
  userId: string,
  destination: string,
  duration: string,
  languageId: string
): Promise<Path> {
  const language = await getLanguageById(languageId);
  if (!language) {
    throw new Error('Language not found');
  }

  const prompt = buildTravelPackPrompt(destination, duration, language.name);
  return buildPath(userId, languageId, 'travel', prompt);
}
