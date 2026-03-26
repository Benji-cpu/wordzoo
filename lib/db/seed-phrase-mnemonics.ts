import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { generateImage } from '../ai/image-generation';
import { PHRASE_MNEMONIC_DATA } from './phrase-mnemonic-data';
import { SCENE_ANCHOR_DATA } from './scene-anchor-data';

// Parse --only=phrase-text flag for selective re-generation
const onlyPhrases = process.argv.find(a => a.startsWith('--only='))
  ?.replace('--only=', '')
  .split(',')
  .map(w => w.trim());

async function seedPhraseMnemonics() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  if (onlyPhrases) {
    console.log(`=== Selective Seeding: ${onlyPhrases.join(', ')} ===\n`);
  } else {
    console.log('=== Seeding Phrase Mnemonics & Scene Anchors ===\n');
  }

  // --- Step 1: Seed Scene Anchor Images ---
  if (!onlyPhrases) {
    console.log('--- Scene Anchor Images ---\n');
    for (const [sceneId, data] of Object.entries(SCENE_ANCHOR_DATA)) {
      console.log(`Scene: ${sceneId}`);

      // Check if anchor already exists
      const existing = await sql`
        SELECT anchor_image_url FROM scenes WHERE id = ${sceneId}
      `;
      if (existing[0]?.anchor_image_url) {
        console.log('  Skipping -- already has anchor image');
        continue;
      }

      try {
        console.log('  Generating anchor image...');
        const imageResult = await generateImage(data.anchorImagePrompt);
        console.log(`  Image URL: ${imageResult.imageUrl}`);

        await sql`
          UPDATE scenes SET anchor_image_url = ${imageResult.imageUrl}
          WHERE id = ${sceneId}
        `;
        console.log('  Saved to database!');
      } catch (error) {
        console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  // --- Step 2: Seed Phrase Composite Images + Bridge Sentences ---
  console.log('\n--- Phrase Mnemonics ---\n');

  const allPhrases = await sql`
    SELECT sp.id, sp.text_target, sp.text_en, sp.phrase_bridge_sentence,
           sp.composite_image_url, s.title AS scene_title
    FROM scene_phrases sp
    JOIN scenes s ON s.id = sp.scene_id
    ORDER BY s.sort_order, sp.sort_order
  `;

  console.log(`Found ${allPhrases.length} phrases total.\n`);

  let successCount = 0;
  let skipCount = 0;
  let noDataCount = 0;
  let failCount = 0;

  for (let i = 0; i < allPhrases.length; i++) {
    const phrase = allPhrases[i];
    console.log(`\n--- [${i + 1}/${allPhrases.length}] "${phrase.text_target}" (${phrase.text_en}) [${phrase.scene_title}] ---`);

    // If --only flag is set, skip phrases not in the list
    if (onlyPhrases) {
      if (!onlyPhrases.some(p => phrase.text_target.includes(p))) {
        console.log('  Skipping -- not in --only list');
        skipCount++;
        continue;
      }
    }

    // Look up pre-generated data
    const data = PHRASE_MNEMONIC_DATA[phrase.text_target];
    if (!data) {
      console.log('  No pre-generated mnemonic data found');
      noDataCount++;
      continue;
    }

    // For non-selective mode, skip if already seeded
    if (!onlyPhrases && phrase.phrase_bridge_sentence) {
      console.log('  Skipping -- already has bridge sentence');
      skipCount++;
      continue;
    }

    try {
      let compositeImageUrl: string | null = null;

      // Generate composite image only if we have a prompt
      if (data.compositeImagePrompt) {
        console.log('  Generating composite image...');
        const imageResult = await generateImage(data.compositeImagePrompt);
        compositeImageUrl = imageResult.imageUrl;
        console.log(`  Image URL: ${compositeImageUrl}`);
      } else {
        console.log('  No composite image (single keyword phrase)');
      }

      // Update database
      await sql`
        UPDATE scene_phrases SET
          phrase_bridge_sentence = ${data.phraseBridgeSentence},
          composite_image_url = ${compositeImageUrl},
          composite_scene_description = ${data.compositeSceneDescription || null}
        WHERE id = ${phrase.id}
      `;
      console.log('  Saved to database!');
      successCount++;
    } catch (error) {
      console.error(`  FAIL: ${error instanceof Error ? error.message : error}`);
      failCount++;
    }
  }

  console.log(`\n=== Done! ${successCount} generated, ${skipCount} skipped, ${noDataCount} missing data, ${failCount} failed ===`);
}

seedPhraseMnemonics();
