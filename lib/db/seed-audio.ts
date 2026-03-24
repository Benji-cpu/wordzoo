import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { synthesizeSpeech } from '../ai/google-tts';

// Parse CLI flags
const args = process.argv.slice(2);
const mode = args.find(a => a.startsWith('--mode='))?.replace('--mode=', '') ?? 'words';
const onlyWords = args.find(a => a.startsWith('--only='))
  ?.replace('--only=', '')
  .split(',')
  .map(w => w.trim());
const force = args.includes('--force');

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedWordAudio(sql: ReturnType<typeof neon>) {
  console.log('=== Seeding Word Pronunciation Audio ===\n');

  const allWords = await sql`
    SELECT w.id, w.text, w.romanization, w.pronunciation_audio_url, l.code AS language_code
    FROM words w
    JOIN languages l ON l.id = w.language_id
    ORDER BY l.code, w.frequency_rank
  `;

  console.log(`Found ${allWords.length} words total.\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < allWords.length; i++) {
    const word = allWords[i] as {
      id: string;
      text: string;
      romanization: string | null;
      pronunciation_audio_url: string | null;
      language_code: string;
    };
    const displayText = word.romanization ? `${word.text} (${word.romanization})` : word.text;

    console.log(`\n--- [${i + 1}/${allWords.length}] "${displayText}" [${word.language_code}] ---`);

    // Filter by --only flag
    if (onlyWords) {
      const matches = onlyWords.some(w => w === word.text || w === word.romanization);
      if (!matches) {
        console.log('  Skipping -- not in --only list');
        skipCount++;
        continue;
      }
    }

    // Skip if already has URL (unless --force)
    if (word.pronunciation_audio_url && !force) {
      console.log('  Skipping -- already has audio URL');
      skipCount++;
      continue;
    }

    try {
      const blobPath = `audio/words/${word.language_code}/${word.text}.mp3`;
      console.log(`  Synthesizing...`);
      const url = await synthesizeSpeech(word.text, word.language_code, blobPath);
      console.log(`  URL: ${url}`);

      await sql`UPDATE words SET pronunciation_audio_url = ${url} WHERE id = ${word.id}`;
      console.log('  Saved to database!');
      successCount++;

      // Rate limit: 250ms between requests
      await delay(250);
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\n=== Words Done! ${successCount} generated, ${skipCount} skipped, ${failCount} failed ===`);
}

async function seedNarrationAudio(sql: ReturnType<typeof neon>) {
  console.log('=== Seeding Mnemonic Narration Audio ===\n');

  const mnemonics = await sql`
    SELECT m.id, m.keyword_text, m.scene_description, m.audio_url,
      w.text AS word_text, w.romanization
    FROM mnemonics m
    JOIN words w ON w.id = m.word_id
    WHERE m.user_id IS NULL
    ORDER BY w.text
  `;

  console.log(`Found ${mnemonics.length} shared mnemonics.\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < mnemonics.length; i++) {
    const m = mnemonics[i] as {
      id: string;
      keyword_text: string;
      scene_description: string;
      audio_url: string | null;
      word_text: string;
      romanization: string | null;
    };
    const displayText = m.romanization ? `${m.word_text} (${m.romanization})` : m.word_text;

    console.log(`\n--- [${i + 1}/${mnemonics.length}] "${displayText}" — keyword: "${m.keyword_text}" ---`);

    // Filter by --only flag
    if (onlyWords) {
      const matches = onlyWords.some(w => w === m.word_text || w === m.romanization);
      if (!matches) {
        console.log('  Skipping -- not in --only list');
        skipCount++;
        continue;
      }
    }

    // Skip if already has URL (unless --force)
    if (m.audio_url && !force) {
      console.log('  Skipping -- already has audio URL');
      skipCount++;
      continue;
    }

    try {
      const narrationText = `It sounds like ${m.keyword_text}. ${m.scene_description}`;
      const blobPath = `audio/narrations/${m.word_text}-${Date.now()}.mp3`;
      console.log(`  Synthesizing narration (${narrationText.length} chars)...`);
      const url = await synthesizeSpeech(narrationText, 'en', blobPath);
      console.log(`  URL: ${url}`);

      await sql`UPDATE mnemonics SET audio_url = ${url} WHERE id = ${m.id}`;
      console.log('  Saved to database!');
      successCount++;

      // Rate limit: 250ms between requests
      await delay(250);
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\n=== Narrations Done! ${successCount} generated, ${skipCount} skipped, ${failCount} failed ===`);
}

async function seedPhraseAudio(sql: ReturnType<typeof neon>) {
  console.log('=== Seeding Phrase Audio ===\n');

  const phrases = await sql`
    SELECT sp.id, sp.text_target, sp.audio_url, l.code AS language_code
    FROM scene_phrases sp
    JOIN scenes s ON s.id = sp.scene_id
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    ORDER BY s.sort_order, sp.sort_order
  `;

  console.log(`Found ${(phrases as unknown[]).length} phrases total.\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < (phrases as unknown[]).length; i++) {
    const phrase = (phrases as Record<string, unknown>[])[i] as {
      id: string; text_target: string; audio_url: string | null; language_code: string;
    };

    console.log(`\n--- [${i + 1}/${(phrases as unknown[]).length}] "${phrase.text_target}" [${phrase.language_code}] ---`);

    if (phrase.audio_url && !force) {
      console.log('  Skipping -- already has audio URL');
      skipCount++;
      continue;
    }

    try {
      const blobPath = `audio/phrases/${phrase.language_code}/${phrase.text_target.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
      console.log(`  Synthesizing...`);
      const url = await synthesizeSpeech(phrase.text_target, phrase.language_code, blobPath);
      console.log(`  URL: ${url}`);

      await sql`UPDATE scene_phrases SET audio_url = ${url} WHERE id = ${phrase.id}`;
      console.log('  Saved to database!');
      successCount++;
      await delay(250);
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\n=== Phrases Done! ${successCount} generated, ${skipCount} skipped, ${failCount} failed ===`);
}

async function seedDialogueAudio(sql: ReturnType<typeof neon>) {
  console.log('=== Seeding Dialogue Audio ===\n');

  const dialogues = await sql`
    SELECT sd.id, sd.text_target, sd.speaker, sd.audio_url, l.code AS language_code
    FROM scene_dialogues sd
    JOIN scenes s ON s.id = sd.scene_id
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    ORDER BY s.sort_order, sd.sort_order
  `;

  console.log(`Found ${(dialogues as unknown[]).length} dialogue lines total.\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < (dialogues as unknown[]).length; i++) {
    const line = (dialogues as Record<string, unknown>[])[i] as {
      id: string; text_target: string; speaker: string; audio_url: string | null; language_code: string;
    };

    console.log(`\n--- [${i + 1}/${(dialogues as unknown[]).length}] ${line.speaker}: "${line.text_target}" [${line.language_code}] ---`);

    if (line.audio_url && !force) {
      console.log('  Skipping -- already has audio URL');
      skipCount++;
      continue;
    }

    try {
      const blobPath = `audio/dialogues/${line.language_code}/${line.speaker}_${line.text_target.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.mp3`;
      console.log(`  Synthesizing...`);
      const url = await synthesizeSpeech(line.text_target, line.language_code, blobPath);
      console.log(`  URL: ${url}`);

      await sql`UPDATE scene_dialogues SET audio_url = ${url} WHERE id = ${line.id}`;
      console.log('  Saved to database!');
      successCount++;
      await delay(250);
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\n=== Dialogues Done! ${successCount} generated, ${skipCount} skipped, ${failCount} failed ===`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  if (onlyWords) {
    console.log(`Selective mode: ${onlyWords.join(', ')}`);
  }
  if (force) {
    console.log('Force mode: regenerating existing audio');
  }

  const validModes = ['words', 'narrations', 'phrases', 'dialogues', 'all'];

  if (!validModes.includes(mode)) {
    console.error(`Unknown mode: ${mode}. Use --mode=${validModes.join('|')}`);
    process.exit(1);
  }

  if (mode === 'words' || mode === 'all') {
    await seedWordAudio(sql);
  }
  if (mode === 'narrations' || mode === 'all') {
    await seedNarrationAudio(sql);
  }
  if (mode === 'phrases' || mode === 'all') {
    await seedPhraseAudio(sql);
  }
  if (mode === 'dialogues' || mode === 'all') {
    await seedDialogueAudio(sql);
  }
}

main();
