import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('Seeding database...');

  try {
    // --- Languages ---
    console.log('Seeding languages...');
    await sql`
      INSERT INTO languages (id, code, name, native_name) VALUES
        ('a1b2c3d4-0001-4000-8000-000000000001', 'id', 'Indonesian', 'Bahasa Indonesia'),
        ('a1b2c3d4-0001-4000-8000-000000000002', 'es', 'Spanish', 'Espa\u00f1ol'),
        ('a1b2c3d4-0001-4000-8000-000000000003', 'ja', 'Japanese', '\u65E5\u672C\u8A9E')
      ON CONFLICT (code) DO NOTHING
    `;

    const LANG_ID = 'a1b2c3d4-0001-4000-8000-00000000000';
    const ID_LANG = `${LANG_ID}1`;
    const ES_LANG = `${LANG_ID}2`;
    const JA_LANG = `${LANG_ID}3`;

    // --- Indonesian Words (20, frequency-ranked) ---
    console.log('Seeding Indonesian words...');
    await sql`
      INSERT INTO words (id, language_id, text, meaning_en, part_of_speech, frequency_rank) VALUES
        ('b1000000-0001-4000-8000-000000000001', ${ID_LANG}, 'saya', 'I / me', 'pronoun', 1),
        ('b1000000-0001-4000-8000-000000000002', ${ID_LANG}, 'tidak', 'no / not', 'adverb', 2),
        ('b1000000-0001-4000-8000-000000000003', ${ID_LANG}, 'apa', 'what', 'pronoun', 3),
        ('b1000000-0001-4000-8000-000000000004', ${ID_LANG}, 'ini', 'this', 'pronoun', 4),
        ('b1000000-0001-4000-8000-000000000005', ${ID_LANG}, 'itu', 'that', 'pronoun', 5),
        ('b1000000-0001-4000-8000-000000000006', ${ID_LANG}, 'dan', 'and', 'conjunction', 6),
        ('b1000000-0001-4000-8000-000000000007', ${ID_LANG}, 'di', 'in / at', 'preposition', 7),
        ('b1000000-0001-4000-8000-000000000008', ${ID_LANG}, 'mau', 'want', 'verb', 8),
        ('b1000000-0001-4000-8000-000000000009', ${ID_LANG}, 'nama', 'name', 'noun', 9),
        ('b1000000-0001-4000-8000-000000000010', ${ID_LANG}, 'baik', 'good / fine', 'adjective', 10),
        ('b1000000-0001-4000-8000-000000000011', ${ID_LANG}, 'terima kasih', 'thank you', 'phrase', 11),
        ('b1000000-0001-4000-8000-000000000012', ${ID_LANG}, 'makan', 'eat', 'verb', 12),
        ('b1000000-0001-4000-8000-000000000013', ${ID_LANG}, 'minum', 'drink', 'verb', 13),
        ('b1000000-0001-4000-8000-000000000014', ${ID_LANG}, 'berapa', 'how much / how many', 'pronoun', 14),
        ('b1000000-0001-4000-8000-000000000015', ${ID_LANG}, 'kiri', 'left', 'noun', 15),
        ('b1000000-0001-4000-8000-000000000016', ${ID_LANG}, 'kanan', 'right', 'noun', 16),
        ('b1000000-0001-4000-8000-000000000017', ${ID_LANG}, 'lurus', 'straight', 'adjective', 17),
        ('b1000000-0001-4000-8000-000000000018', ${ID_LANG}, 'di mana', 'where', 'adverb', 18),
        ('b1000000-0001-4000-8000-000000000019', ${ID_LANG}, 'pedas', 'spicy', 'adjective', 19),
        ('b1000000-0001-4000-8000-000000000020', ${ID_LANG}, 'selamat pagi', 'good morning', 'phrase', 20)
      ON CONFLICT DO NOTHING
    `;

    // --- Spanish Words (20, frequency-ranked) ---
    console.log('Seeding Spanish words...');
    await sql`
      INSERT INTO words (id, language_id, text, meaning_en, part_of_speech, frequency_rank) VALUES
        ('b2000000-0001-4000-8000-000000000001', ${ES_LANG}, 'hola', 'hello', 'interjection', 1),
        ('b2000000-0001-4000-8000-000000000002', ${ES_LANG}, 'gracias', 'thank you', 'noun', 2),
        ('b2000000-0001-4000-8000-000000000003', ${ES_LANG}, 'por favor', 'please', 'phrase', 3),
        ('b2000000-0001-4000-8000-000000000004', ${ES_LANG}, 'si', 'yes', 'adverb', 4),
        ('b2000000-0001-4000-8000-000000000005', ${ES_LANG}, 'no', 'no', 'adverb', 5),
        ('b2000000-0001-4000-8000-000000000006', ${ES_LANG}, 'agua', 'water', 'noun', 6),
        ('b2000000-0001-4000-8000-000000000007', ${ES_LANG}, 'comida', 'food', 'noun', 7),
        ('b2000000-0001-4000-8000-000000000008', ${ES_LANG}, 'donde', 'where', 'adverb', 8),
        ('b2000000-0001-4000-8000-000000000009', ${ES_LANG}, 'izquierda', 'left', 'noun', 9),
        ('b2000000-0001-4000-8000-000000000010', ${ES_LANG}, 'derecha', 'right', 'noun', 10),
        ('b2000000-0001-4000-8000-000000000011', ${ES_LANG}, 'nombre', 'name', 'noun', 11),
        ('b2000000-0001-4000-8000-000000000012', ${ES_LANG}, 'comer', 'to eat', 'verb', 12),
        ('b2000000-0001-4000-8000-000000000013', ${ES_LANG}, 'beber', 'to drink', 'verb', 13),
        ('b2000000-0001-4000-8000-000000000014', ${ES_LANG}, 'cuanto', 'how much', 'pronoun', 14),
        ('b2000000-0001-4000-8000-000000000015', ${ES_LANG}, 'bueno', 'good', 'adjective', 15),
        ('b2000000-0001-4000-8000-000000000016', ${ES_LANG}, 'quiero', 'I want', 'verb', 16),
        ('b2000000-0001-4000-8000-000000000017', ${ES_LANG}, 'amigo', 'friend', 'noun', 17),
        ('b2000000-0001-4000-8000-000000000018', ${ES_LANG}, 'familia', 'family', 'noun', 18),
        ('b2000000-0001-4000-8000-000000000019', ${ES_LANG}, 'dinero', 'money', 'noun', 19),
        ('b2000000-0001-4000-8000-000000000020', ${ES_LANG}, 'cuenta', 'bill / check', 'noun', 20)
      ON CONFLICT DO NOTHING
    `;

    // --- Japanese Words (20, frequency-ranked, with romanization) ---
    console.log('Seeding Japanese words...');
    await sql`
      INSERT INTO words (id, language_id, text, romanization, meaning_en, part_of_speech, frequency_rank) VALUES
        ('b3000000-0001-4000-8000-000000000001', ${JA_LANG}, '\u306F\u3044', 'hai', 'yes', 'interjection', 1),
        ('b3000000-0001-4000-8000-000000000002', ${JA_LANG}, '\u3044\u3044\u3048', 'iie', 'no', 'interjection', 2),
        ('b3000000-0001-4000-8000-000000000003', ${JA_LANG}, '\u3042\u308A\u304C\u3068\u3046', 'arigatou', 'thank you', 'phrase', 3),
        ('b3000000-0001-4000-8000-000000000004', ${JA_LANG}, '\u3059\u307F\u307E\u305B\u3093', 'sumimasen', 'excuse me / sorry', 'phrase', 4),
        ('b3000000-0001-4000-8000-000000000005', ${JA_LANG}, '\u304A\u306F\u3088\u3046', 'ohayou', 'good morning', 'phrase', 5),
        ('b3000000-0001-4000-8000-000000000006', ${JA_LANG}, '\u540D\u524D', 'namae', 'name', 'noun', 6),
        ('b3000000-0001-4000-8000-000000000007', ${JA_LANG}, '\u6C34', 'mizu', 'water', 'noun', 7),
        ('b3000000-0001-4000-8000-000000000008', ${JA_LANG}, '\u98DF\u3079\u308B', 'taberu', 'to eat', 'verb', 8),
        ('b3000000-0001-4000-8000-000000000009', ${JA_LANG}, '\u98F2\u3080', 'nomu', 'to drink', 'verb', 9),
        ('b3000000-0001-4000-8000-000000000010', ${JA_LANG}, '\u3044\u304F\u3089', 'ikura', 'how much', 'pronoun', 10),
        ('b3000000-0001-4000-8000-000000000011', ${JA_LANG}, '\u5DE6', 'hidari', 'left', 'noun', 11),
        ('b3000000-0001-4000-8000-000000000012', ${JA_LANG}, '\u53F3', 'migi', 'right', 'noun', 12),
        ('b3000000-0001-4000-8000-000000000013', ${JA_LANG}, '\u307E\u3063\u3059\u3050', 'massugu', 'straight', 'adverb', 13),
        ('b3000000-0001-4000-8000-000000000014', ${JA_LANG}, '\u3069\u3053', 'doko', 'where', 'pronoun', 14),
        ('b3000000-0001-4000-8000-000000000015', ${JA_LANG}, '\u304A\u3044\u3057\u3044', 'oishii', 'delicious', 'adjective', 15),
        ('b3000000-0001-4000-8000-000000000016', ${JA_LANG}, '\u304A\u9858\u3044\u3057\u307E\u3059', 'onegaishimasu', 'please', 'phrase', 16),
        ('b3000000-0001-4000-8000-000000000017', ${JA_LANG}, '\u53CB\u9054', 'tomodachi', 'friend', 'noun', 17),
        ('b3000000-0001-4000-8000-000000000018', ${JA_LANG}, '\u5BB6\u65CF', 'kazoku', 'family', 'noun', 18),
        ('b3000000-0001-4000-8000-000000000019', ${JA_LANG}, '\u304A\u91D1', 'okane', 'money', 'noun', 19),
        ('b3000000-0001-4000-8000-000000000020', ${JA_LANG}, '\u99C5', 'eki', 'train station', 'noun', 20)
      ON CONFLICT DO NOTHING
    `;

    // --- Paths (1 per language: "Survival [Language]") ---
    console.log('Seeding paths...');
    await sql`
      INSERT INTO paths (id, language_id, type, title, description) VALUES
        ('c1000000-0001-4000-8000-000000000001', ${ID_LANG}, 'premade', 'Survival Indonesian', 'Essential words and phrases for getting by in Indonesia'),
        ('c1000000-0001-4000-8000-000000000002', ${ES_LANG}, 'premade', 'Survival Spanish', 'Essential words and phrases for getting by in Spanish-speaking countries'),
        ('c1000000-0001-4000-8000-000000000003', ${JA_LANG}, 'premade', 'Survival Japanese', 'Essential words and phrases for getting by in Japan')
      ON CONFLICT DO NOTHING
    `;

    // --- Scenes (3 per path) ---
    console.log('Seeding scenes...');
    // Indonesian scenes
    await sql`
      INSERT INTO scenes (id, path_id, title, description, sort_order) VALUES
        ('d1000000-0001-4000-8000-000000000001', 'c1000000-0001-4000-8000-000000000001', 'Meeting Someone', 'Greetings and introductions in Bahasa Indonesia', 1),
        ('d1000000-0001-4000-8000-000000000002', 'c1000000-0001-4000-8000-000000000001', 'Getting Food', 'Ordering food and drinks at a warung', 2),
        ('d1000000-0001-4000-8000-000000000003', 'c1000000-0001-4000-8000-000000000001', 'Finding Your Way', 'Asking for and understanding directions', 3)
      ON CONFLICT DO NOTHING
    `;
    // Spanish scenes
    await sql`
      INSERT INTO scenes (id, path_id, title, description, sort_order) VALUES
        ('d2000000-0001-4000-8000-000000000001', 'c1000000-0001-4000-8000-000000000002', 'Meeting Someone', 'Greetings and introductions in Spanish', 1),
        ('d2000000-0001-4000-8000-000000000002', 'c1000000-0001-4000-8000-000000000002', 'Getting Food', 'Ordering food and drinks at a restaurant', 2),
        ('d2000000-0001-4000-8000-000000000003', 'c1000000-0001-4000-8000-000000000002', 'Finding Your Way', 'Navigating streets and transportation', 3)
      ON CONFLICT DO NOTHING
    `;
    // Japanese scenes
    await sql`
      INSERT INTO scenes (id, path_id, title, description, sort_order) VALUES
        ('d3000000-0001-4000-8000-000000000001', 'c1000000-0001-4000-8000-000000000003', 'Meeting Someone', 'Greetings and introductions in Japanese', 1),
        ('d3000000-0001-4000-8000-000000000002', 'c1000000-0001-4000-8000-000000000003', 'Getting Food', 'Ordering at an izakaya or restaurant', 2),
        ('d3000000-0001-4000-8000-000000000003', 'c1000000-0001-4000-8000-000000000003', 'Finding Your Way', 'Getting around town and using trains', 3)
      ON CONFLICT DO NOTHING
    `;

    // --- Path Words (link all 20 words to each path) ---
    console.log('Seeding path_words...');
    for (let i = 1; i <= 20; i++) {
      const idx = String(i).padStart(3, '0');
      await sql`INSERT INTO path_words (path_id, word_id, sort_order) VALUES ('c1000000-0001-4000-8000-000000000001', ${'b1000000-0001-4000-8000-000000000' + idx}, ${i}) ON CONFLICT DO NOTHING`;
      await sql`INSERT INTO path_words (path_id, word_id, sort_order) VALUES ('c1000000-0001-4000-8000-000000000002', ${'b2000000-0001-4000-8000-000000000' + idx}, ${i}) ON CONFLICT DO NOTHING`;
      await sql`INSERT INTO path_words (path_id, word_id, sort_order) VALUES ('c1000000-0001-4000-8000-000000000003', ${'b3000000-0001-4000-8000-000000000' + idx}, ${i}) ON CONFLICT DO NOTHING`;
    }

    // --- Scene Words ---
    console.log('Seeding scene_words...');
    // Indonesian: Meeting Someone (words 1,3,4,9,10,11,20)
    const idMeeting = ['001', '003', '004', '009', '010', '011', '020'];
    for (let i = 0; i < idMeeting.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d1000000-0001-4000-8000-000000000001', ${'b1000000-0001-4000-8000-000000000' + idMeeting[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }
    // Indonesian: Getting Food (words 8,12,13,14,19)
    const idFood = ['008', '012', '013', '014', '019'];
    for (let i = 0; i < idFood.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d1000000-0001-4000-8000-000000000002', ${'b1000000-0001-4000-8000-000000000' + idFood[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }
    // Indonesian: Finding Your Way (words 7,15,16,17,18)
    const idDirections = ['007', '015', '016', '017', '018'];
    for (let i = 0; i < idDirections.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d1000000-0001-4000-8000-000000000003', ${'b1000000-0001-4000-8000-000000000' + idDirections[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }

    // Spanish: Meeting Someone (words 1,3,4,5,11,15)
    const esMeeting = ['001', '003', '004', '005', '011', '015'];
    for (let i = 0; i < esMeeting.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d2000000-0001-4000-8000-000000000001', ${'b2000000-0001-4000-8000-000000000' + esMeeting[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }
    // Spanish: Getting Food (words 2,6,7,12,13,14,20)
    const esFood = ['002', '006', '007', '012', '013', '014', '020'];
    for (let i = 0; i < esFood.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d2000000-0001-4000-8000-000000000002', ${'b2000000-0001-4000-8000-000000000' + esFood[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }
    // Spanish: Finding Your Way (words 8,9,10,16)
    const esDirections = ['008', '009', '010', '016'];
    for (let i = 0; i < esDirections.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d2000000-0001-4000-8000-000000000003', ${'b2000000-0001-4000-8000-000000000' + esDirections[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }

    // Japanese: Meeting Someone (words 1,2,3,4,5,6)
    const jaMeeting = ['001', '002', '003', '004', '005', '006'];
    for (let i = 0; i < jaMeeting.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d3000000-0001-4000-8000-000000000001', ${'b3000000-0001-4000-8000-000000000' + jaMeeting[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }
    // Japanese: Getting Food (words 7,8,9,10,15,16)
    const jaFood = ['007', '008', '009', '010', '015', '016'];
    for (let i = 0; i < jaFood.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d3000000-0001-4000-8000-000000000002', ${'b3000000-0001-4000-8000-000000000' + jaFood[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }
    // Japanese: Finding Your Way (words 11,12,13,14,20)
    const jaDirections = ['011', '012', '013', '014', '020'];
    for (let i = 0; i < jaDirections.length; i++) {
      await sql`INSERT INTO scene_words (scene_id, word_id, sort_order) VALUES ('d3000000-0001-4000-8000-000000000003', ${'b3000000-0001-4000-8000-000000000' + jaDirections[i]}, ${i + 1}) ON CONFLICT DO NOTHING`;
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
