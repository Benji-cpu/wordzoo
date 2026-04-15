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
const langFilter = args.find(a => a.startsWith('--lang='))?.replace('--lang=', '');

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedWordAudio(sql: any) {
  console.log('=== Seeding Word Pronunciation Audio ===\n');

  const allWords = await sql`
    SELECT w.id, w.text, w.romanization, w.pronunciation_audio_url, l.code AS language_code
    FROM words w
    JOIN languages l ON l.id = w.language_id
    ORDER BY l.code, w.frequency_rank
  `;

  let words = allWords as Record<string, unknown>[];
  if (langFilter) {
    words = words.filter((w: Record<string, unknown>) => w.language_code === langFilter);
  }
  console.log(`Found ${words.length} words${langFilter ? ` for language "${langFilter}"` : ' total'}.\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i] as {
      id: string;
      text: string;
      romanization: string | null;
      pronunciation_audio_url: string | null;
      language_code: string;
    };
    const displayText = word.romanization ? `${word.text} (${word.romanization})` : word.text;

    console.log(`\n--- [${i + 1}/${words.length}] "${displayText}" [${word.language_code}] ---`);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedNarrationAudio(sql: any) {
  console.log('=== Seeding Mnemonic Narration Audio ===\n');

  const mnemonics = await sql`
    SELECT m.id, m.keyword_text, m.scene_description, m.audio_url,
      w.text AS word_text, w.romanization, l.code AS language_code
    FROM mnemonics m
    JOIN words w ON w.id = m.word_id
    JOIN languages l ON l.id = w.language_id
    WHERE m.user_id IS NULL
    ORDER BY w.text
  `;

  let rows = mnemonics as Record<string, unknown>[];
  if (langFilter) {
    rows = rows.filter((r: Record<string, unknown>) => r.language_code === langFilter);
  }
  console.log(`Found ${rows.length} shared mnemonics${langFilter ? ` for language "${langFilter}"` : ''}.\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const m = rows[i] as {
      id: string;
      keyword_text: string;
      scene_description: string;
      audio_url: string | null;
      word_text: string;
      romanization: string | null;
    };
    const displayText = m.romanization ? `${m.word_text} (${m.romanization})` : m.word_text;

    console.log(`\n--- [${i + 1}/${rows.length}] "${displayText}" — keyword: "${m.keyword_text}" ---`);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedPhraseAudio(sql: any) {
  console.log('=== Seeding Phrase Audio ===\n');

  let phrases = await sql`
    SELECT sp.id, sp.text_target, sp.audio_url, l.code AS language_code
    FROM scene_phrases sp
    JOIN scenes s ON s.id = sp.scene_id
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    ORDER BY s.sort_order, sp.sort_order
  ` as Record<string, unknown>[];
  if (langFilter) {
    phrases = phrases.filter((p: Record<string, unknown>) => p.language_code === langFilter);
  }

  console.log(`Found ${phrases.length} phrases${langFilter ? ` for language "${langFilter}"` : ' total'}.\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i] as {
      id: string; text_target: string; audio_url: string | null; language_code: string;
    };

    console.log(`\n--- [${i + 1}/${phrases.length}] "${phrase.text_target}" [${phrase.language_code}] ---`);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedDialogueAudio(sql: any) {
  console.log('=== Seeding Dialogue Audio ===\n');

  let dialogues = await sql`
    SELECT sd.id, sd.text_target, sd.speaker, sd.audio_url, l.code AS language_code
    FROM scene_dialogues sd
    JOIN scenes s ON s.id = sd.scene_id
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    ORDER BY s.sort_order, sd.sort_order
  ` as Record<string, unknown>[];
  if (langFilter) {
    dialogues = dialogues.filter((d: Record<string, unknown>) => d.language_code === langFilter);
  }

  console.log(`Found ${dialogues.length} dialogue lines${langFilter ? ` for language "${langFilter}"` : ' total'}.\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < dialogues.length; i++) {
    const line = dialogues[i] as {
      id: string; text_target: string; speaker: string; audio_url: string | null; language_code: string;
    };

    console.log(`\n--- [${i + 1}/${dialogues.length}] ${line.speaker}: "${line.text_target}" [${line.language_code}] ---`);

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
