import type { MnemonicCandidate, MnemonicGenerationResult } from '@/types/ai';
import type { Mnemonic } from '@/types/database';
import { generateText } from '@/lib/ai/gemini';
import { generateImage } from '@/lib/ai/stability';
import {
  MNEMONIC_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildRegeneratePrompt,
  buildCustomKeywordPrompt,
} from '@/lib/ai/prompts';
import { filterMnemonicContent } from '@/lib/ai/safety';
import { getWordById, insertMnemonic } from '@/lib/db/queries';

function parseCandidates(text: string): MnemonicCandidate[] {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array of candidates');
  }

  return parsed.map((c: Record<string, unknown>) => ({
    keyword: String(c.keyword ?? ''),
    phoneticLink: String(c.phoneticLink ?? ''),
    sceneDescription: String(c.sceneDescription ?? ''),
    imagePrompt: String(c.imagePrompt ?? ''),
  }));
}

async function fetchWord(wordId: string) {
  const word = await getWordById(wordId);
  if (!word) {
    throw new Error(`Word not found: ${wordId}`);
  }
  return word;
}

export async function generateMnemonic(
  wordId: string,
  _userId: string
): Promise<MnemonicGenerationResult> {
  const word = await fetchWord(wordId);

  const prompt = `${MNEMONIC_SYSTEM_PROMPT}\n\n${buildGeneratePrompt(
    word.romanization || word.text,
    word.meaning_en,
    word.language_name
  )}`;

  const response = await generateText(prompt, {
    temperature: 0.9,
    maxOutputTokens: 2048,
  });

  const candidates = parseCandidates(response.text);

  // Filter unsafe content, keep safe candidates
  const safeCandidates = candidates.filter(
    (c) => filterMnemonicContent(c).safe
  );

  if (safeCandidates.length === 0) {
    throw new Error('All generated candidates were filtered by safety check. Please try again.');
  }

  return {
    candidates: safeCandidates,
    recommended: 0,
  };
}

export async function regenerateMnemonic(
  wordId: string,
  _userId: string,
  excludeKeywords: string[]
): Promise<MnemonicGenerationResult> {
  const word = await fetchWord(wordId);

  const prompt = `${MNEMONIC_SYSTEM_PROMPT}\n\n${buildRegeneratePrompt(
    word.romanization || word.text,
    word.meaning_en,
    word.language_name,
    excludeKeywords
  )}`;

  const response = await generateText(prompt, {
    temperature: 0.95,
    maxOutputTokens: 2048,
  });

  const candidates = parseCandidates(response.text);

  const safeCandidates = candidates.filter(
    (c) => filterMnemonicContent(c).safe
  );

  if (safeCandidates.length === 0) {
    throw new Error('All generated candidates were filtered by safety check. Please try again.');
  }

  return {
    candidates: safeCandidates,
    recommended: 0,
  };
}

export async function generateFromUserKeyword(
  wordId: string,
  _userId: string,
  keyword: string
): Promise<MnemonicCandidate> {
  // Safety-check the user's keyword itself
  const keywordCheck = filterMnemonicContent({
    keyword,
    phoneticLink: '',
    sceneDescription: '',
    imagePrompt: '',
  });
  if (!keywordCheck.safe) {
    throw new Error('The provided keyword contains inappropriate content.');
  }

  const word = await fetchWord(wordId);

  const prompt = `${MNEMONIC_SYSTEM_PROMPT}\n\n${buildCustomKeywordPrompt(
    word.romanization || word.text,
    word.meaning_en,
    keyword
  )}`;

  const response = await generateText(prompt, {
    temperature: 0.8,
    maxOutputTokens: 1024,
  });

  const candidates = parseCandidates(response.text);
  if (candidates.length === 0) {
    throw new Error('Failed to generate a candidate for the provided keyword.');
  }

  const candidate = candidates[0];
  const safetyResult = filterMnemonicContent(candidate);
  if (!safetyResult.safe) {
    throw new Error('Generated content was filtered by safety check. Please try a different keyword.');
  }

  return candidate;
}

export async function generateSceneImage(imagePrompt: string): Promise<string> {
  const result = await generateImage(imagePrompt);
  return result.imageUrl;
}

export async function saveMnemonic(
  wordId: string,
  userId: string | null,
  candidate: MnemonicCandidate,
  imageUrl: string | null,
  isCustom = false
): Promise<Mnemonic> {
  return insertMnemonic({
    wordId,
    userId,
    keywordText: candidate.keyword,
    sceneDescription: candidate.sceneDescription,
    imageUrl,
    isCustom,
  });
}
