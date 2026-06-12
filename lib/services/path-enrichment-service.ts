import {
  generateMnemonic,
  generateSceneImage,
  saveMnemonic,
} from '@/lib/services/mnemonic-service';
import { synthesizeSpeech, hasTtsVoice } from '@/lib/ai/google-tts';
import {
  getPathWordsNeedingEnrichment,
  setPathEnrichmentStatus,
  updateWordAudioUrl,
  type WordNeedingEnrichment,
} from '@/lib/db/queries';

const CONCURRENCY = 3;

/**
 * Post-generation enrichment for AI-generated paths (custom / travel /
 * studio): gives every new word a mnemonic (+ illustration) and TTS audio,
 * matching the curated-content experience. Designed to run fire-and-forget
 * via next/server `after()` — failures are tolerated per word and the path
 * is marked 'partial' so the in-app lazy fallback can fill gaps later.
 */
export async function enrichPath(pathId: string, userId: string): Promise<void> {
  let words: WordNeedingEnrichment[];
  try {
    words = await getPathWordsNeedingEnrichment(pathId);
  } catch (error) {
    console.error(`[enrich-path] ${pathId}: failed to load words`, error);
    return;
  }

  if (words.length === 0) {
    await setPathEnrichmentStatus(pathId, 'done').catch(() => {});
    return;
  }

  await setPathEnrichmentStatus(pathId, 'processing').catch(() => {});
  console.log(`[enrich-path] ${pathId}: enriching ${words.length} words`);

  let failures = 0;

  async function enrichWord(word: WordNeedingEnrichment): Promise<void> {
    let wordFailed = false;

    if (word.needs_mnemonic) {
      try {
        const result = await generateMnemonic(word.id, userId);
        const candidate = result.candidates[result.recommended];
        // Image generation is the most failure-prone step (Blob quota,
        // model availability) — a mnemonic without an image still renders
        // via the keyword fallback card, so save it either way.
        let imageUrl: string | null = null;
        try {
          imageUrl = await generateSceneImage(candidate.imagePrompt);
        } catch (error) {
          console.error(`[enrich-path] image failed for "${word.text}"`, error);
        }
        await saveMnemonic(word.id, userId, candidate, imageUrl);
      } catch (error) {
        console.error(`[enrich-path] mnemonic failed for "${word.text}"`, error);
        wordFailed = true;
      }
    }

    if (word.needs_audio && hasTtsVoice(word.language_code)) {
      try {
        const blobPath = `audio/words/${word.language_code}/${word.text}.mp3`;
        const url = await synthesizeSpeech(word.text, word.language_code, blobPath);
        await updateWordAudioUrl(word.id, url);
      } catch (error) {
        console.error(`[enrich-path] audio failed for "${word.text}"`, error);
        wordFailed = true;
      }
    }

    if (wordFailed) failures++;
  }

  // Simple promise pool: words are already in scene order, so the first
  // scene's words finish first even with concurrent workers.
  const queue = [...words];
  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const word = queue.shift();
      if (!word) return;
      await enrichWord(word);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const status = failures === 0 ? 'done' : 'partial';
  await setPathEnrichmentStatus(pathId, status).catch(() => {});
  console.log(
    `[enrich-path] ${pathId}: ${status} (${words.length - failures}/${words.length} ok)`
  );
}
