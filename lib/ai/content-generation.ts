import { generateText } from './gemini';
import { buildSceneGenerationPrompt } from './prompts';

export interface GeneratedWord {
  text: string;
  meaning_en: string;
  part_of_speech: string;
  romanization: string | null;
}

export interface GeneratedMnemonic {
  word_text: string;
  keyword_text: string;
  scene_description: string;
  bridge_sentence: string;
}

export interface GeneratedDialogueLine {
  speaker: string;
  text_target: string;
  text_en: string;
}

export interface GeneratedPhrase {
  text_target: string;
  text_en: string;
  literal_translation: string;
  usage_note: string;
}

export interface GeneratedPattern {
  prompt: string;
  hint_en: string;
  correct_answer: string;
  distractors: string[];
  explanation: string;
  exercise_type: 'fill_blank' | 'sentence_build' | 'typed_translation';
  pattern_template: string;
  pattern_en: string;
}

export interface GeneratedScene {
  title: string;
  description: string;
  scene_context: string;
  anchor_image_prompt: string;
  words: GeneratedWord[];
  mnemonics: GeneratedMnemonic[];
  dialogues: GeneratedDialogueLine[];
  phrases: GeneratedPhrase[];
  patterns: GeneratedPattern[];
}

export async function generateScene(
  topic: string,
  languageName: string,
  languageCode: string,
  existingWords: string[],
  wordCount: number = 10,
  grammarFocus?: string
): Promise<GeneratedScene> {
  const prompt = buildSceneGenerationPrompt(topic, languageName, languageCode, existingWords, wordCount, grammarFocus);

  const response = await generateText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 8192,
  });

  const cleaned = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as GeneratedScene;
}
