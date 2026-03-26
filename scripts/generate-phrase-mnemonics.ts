/**
 * One-time script to generate phrase mnemonic data using Gemini AI.
 * Outputs JSON to stdout for review before hardcoding into phrase-mnemonic-data.ts.
 *
 * Usage: npx tsx scripts/generate-phrase-mnemonics.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleGenAI } from '@google/genai';
import { neon } from '@neondatabase/serverless';
import { MNEMONIC_DATA } from '../lib/db/mnemonic-data';
import { PHRASE_MNEMONIC_SYSTEM_PROMPT, buildPhraseMnemonicPrompt } from '../lib/ai/prompts';

async function generatePhraseMnemonics() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_GEMINI_API_KEY is not set');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const ai = new GoogleGenAI({ apiKey });

  // Fetch all phrases with their linked words
  const phrases = await sql`
    SELECT sp.id, sp.text_target, sp.text_en, sp.literal_translation,
           s.title AS scene_title
    FROM scene_phrases sp
    JOIN scenes s ON s.id = sp.scene_id
    ORDER BY s.sort_order, sp.sort_order
  `;

  const results: Record<string, unknown> = {};

  for (const phrase of phrases) {
    console.error(`\nProcessing: "${phrase.text_target}" (${phrase.text_en})`);

    // Get linked words with their mnemonics
    const phraseWords = await sql`
      SELECT w.text, w.meaning_en, m.keyword_text
      FROM phrase_words pw
      JOIN words w ON w.id = pw.word_id
      LEFT JOIN LATERAL (
        SELECT keyword_text FROM mnemonics
        WHERE word_id = w.id AND user_id IS NULL
        ORDER BY upvote_count DESC LIMIT 1
      ) m ON true
      WHERE pw.phrase_id = ${phrase.id}
      ORDER BY pw.position
    `;

    const wordKeywords = phraseWords
      .filter((w: Record<string, unknown>) => w.keyword_text)
      .map((w: Record<string, unknown>) => ({
        word: w.text as string,
        keyword: w.keyword_text as string,
        meaning: w.meaning_en as string,
      }));

    console.error(`  Keywords: ${wordKeywords.map((w: { word: string; keyword: string }) => `${w.word}→${w.keyword}`).join(', ') || 'none'}`);

    if (wordKeywords.length === 0) {
      console.error('  Skipping - no word keywords');
      continue;
    }

    const prompt = buildPhraseMnemonicPrompt(
      phrase.text_target as string,
      phrase.text_en as string,
      (phrase.literal_translation as string) || '',
      wordKeywords
    );

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { systemInstruction: PHRASE_MNEMONIC_SYSTEM_PROMPT },
      });

      const text = response.text?.trim();
      if (!text) {
        console.error('  No response text');
        continue;
      }

      // Try to parse JSON (strip markdown fences if present)
      const cleaned = text.replace(/^```json?\n?/g, '').replace(/\n?```$/g, '');
      const parsed = JSON.parse(cleaned);
      results[phrase.text_target as string] = parsed;
      console.error('  OK');
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Output all results as JSON to stdout
  console.log(JSON.stringify(results, null, 2));
}

// Suppress unused import warning - MNEMONIC_DATA is available for reference
void MNEMONIC_DATA;

generatePhraseMnemonics();
