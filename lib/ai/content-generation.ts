import { generateText } from './gemini';
import { buildSceneGenerationPrompt } from './prompts';

interface GeneratedWord {
  text: string;
  meaning_en: string;
  part_of_speech: string;
  romanization: string | null;
}

interface GeneratedMnemonic {
  word_text: string;
  keyword_text: string;
  scene_description: string;
  bridge_sentence: string;
}

interface GeneratedDialogueLine {
  speaker: string;
  text_target: string;
  text_en: string;
}

interface GeneratedPhrase {
  text_target: string;
  text_en: string;
  literal_translation: string;
  usage_note: string;
}

export interface GeneratedScene {
  title: string;
  description: string;
  scene_context: string;
  words: GeneratedWord[];
  mnemonics: GeneratedMnemonic[];
  dialogues: GeneratedDialogueLine[];
  phrases: GeneratedPhrase[];
}

export async function generateScene(
  topic: string,
  languageName: string,
  languageCode: string,
  existingWords: string[],
  wordCount: number = 10
): Promise<GeneratedScene> {
  const prompt = buildSceneGenerationPrompt(topic, languageName, languageCode, existingWords, wordCount);

  const response = await generateText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 4096,
  });

  const cleaned = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as GeneratedScene;
}
