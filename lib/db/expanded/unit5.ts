// Unit 5: Home & Daily Life — Scenes 5.1, 5.2, 5.3, 5.4, 5.5
// Extended dialogue scenes for Indonesian language learning.

import type { DialogueSceneData } from '../dialogue-data';

// ── Scene 5.1: Sewa Rumah (Renting a House) ─────────────────────────

const scene5_1: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000025',
  title: 'Sewa Rumah (Renting a House)',
  description: 'Looking for a place to rent in Bali',
  scene_context:
    'You are looking at a villa to rent in Ubud. The owner shows you around and discusses the price. Practice housing vocabulary and descriptions.',
  sort_order: 21,
  dialogues: [
    {
      id: 'e1000000-0025-4000-8000-000000000001',
      speaker: 'Pemilik',
      text_target: 'Selamat pagi! Mau lihat vila ini? Ada dua kamar dan satu kamar mandi.',
      text_en: 'Good morning! Want to see this villa? There are two bedrooms and one bathroom.',
    },
    {
      id: 'e1000000-0025-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Bagus sekali! Ada dapur?',
      text_en: 'Very nice! Is there a kitchen?',
    },
    {
      id: 'e1000000-0025-4000-8000-000000000003',
      speaker: 'Pemilik',
      text_target: 'Ada dapur besar dan taman. Ada kolam juga!',
      text_en: 'There is a big kitchen and a garden. There is also a pool!',
    },
    {
      id: 'e1000000-0025-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Berapa per bulan? Termasuk wifi dan AC?',
      text_en: 'How much per month? Including wifi and AC?',
    },
    {
      id: 'e1000000-0025-4000-8000-000000000005',
      speaker: 'Pemilik',
      text_target: 'Tujuh juta per bulan. Termasuk wifi, tapi AC tidak termasuk.',
      text_en: 'Seven million per month. Including wifi, but AC is not included.',
    },
    {
      id: 'e1000000-0025-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Bisa kurang? Saya mau sewa untuk satu tahun.',
      text_en: 'Can you lower it? I want to rent for one year.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0025-4000-8000-000000000001',
      text_target: 'Ada kolam renang?',
      text_en: 'Is there a swimming pool?',
      literal_translation: 'There-is pool swim?',
      usage_note:
        '"Ada" + noun is how you ask if something exists or is available. No verb "to be" needed.',
      wordTexts: ['ada', 'kolam'],
    },
    {
      id: 'f1000000-0025-4000-8000-000000000002',
      text_target: 'Berapa per bulan?',
      text_en: 'How much per month?',
      literal_translation: 'How-much per month?',
      usage_note:
        'Use "per" + time word to ask about recurring costs. Very common when renting.',
      wordTexts: ['berapa', 'per', 'bulan'],
    },
    {
      id: 'f1000000-0025-4000-8000-000000000003',
      text_target: 'Termasuk wifi?',
      text_en: 'Including wifi?',
      literal_translation: 'Including wifi?',
      usage_note:
        '"Termasuk" means "including" — use it to ask what is part of the price.',
      wordTexts: ['termasuk', 'wifi'],
    },
    {
      id: 'f1000000-0025-4000-8000-000000000004',
      text_target: 'Sewa vila',
      text_en: 'Rent a villa',
      literal_translation: 'Rent villa',
      usage_note:
        '"Sewa" is the verb for renting. Can be used for houses, motorbikes, or anything you rent.',
      wordTexts: ['sewa', 'vila'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0025-4000-8000-000000000001',
      pattern_template: 'Ada ___',
      pattern_en: 'There is ___',
      explanation:
        '"Ada" + noun means "there is" or "there are". No verb "to be" is needed in Indonesian.',
      prompt: '___ kolam?',
      hint_en: 'Is there a pool?',
      correct_answer: 'Ada',
      distractors: ['Ini', 'Itu', 'Mau'],
    },
    {
      id: '0a000000-0025-4000-8000-000000000002',
      pattern_template: 'Berapa per ___?',
      pattern_en: 'How much per ___?',
      explanation:
        '"Berapa per" + time word asks about a recurring price. Use "bulan" (month), "tahun" (year), etc.',
      prompt: 'Berapa per ___?',
      hint_en: 'How much per month?',
      correct_answer: 'bulan',
      distractors: ['tahun', 'hari', 'minggu'],
    },
    {
      id: '0a000000-0025-4000-8000-000000000003',
      pattern_template: 'Termasuk ___',
      pattern_en: 'Including ___',
      explanation:
        '"Termasuk" + noun means something is included. "Tidak termasuk" means not included.',
      prompt: '___ wifi?',
      hint_en: 'Including wifi?',
      correct_answer: 'Termasuk',
      distractors: ['Dengan', 'Ada', 'Mau'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000220', text: 'sewa', meaning_en: 'to rent', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000221', text: 'vila', meaning_en: 'villa', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000222', text: 'kos', meaning_en: 'boarding house room', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000223', text: 'kamar mandi', meaning_en: 'bathroom', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000224', text: 'dapur', meaning_en: 'kitchen', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000225', text: 'taman', meaning_en: 'garden', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000226', text: 'kolam', meaning_en: 'pool', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000227', text: 'AC', meaning_en: 'air conditioning', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000228', text: 'wifi', meaning_en: 'wifi', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000229', text: 'per', meaning_en: 'per', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000230', text: 'bulan', meaning_en: 'month / moon', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000231', text: 'tahun', meaning_en: 'year', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000232', text: 'termasuk', meaning_en: 'including', part_of_speech: 'verb' },
  ],
  existingWordTexts: [
    'rumah', 'ada', 'kamar', 'besar', 'kecil', 'bagus', 'berapa', 'harga',
    'mahal', 'murah', 'dengan', 'mau', 'saya', 'ini', 'itu', 'lantai',
    'dua', 'tiga', 'bisa', 'satu', 'juta', 'tapi', 'tidak',
  ],
};

// ── Scene 5.2: Pagi Hari (Morning Routine) ──────────────────────────

const scene5_2: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000026',
  title: 'Pagi Hari (Morning Routine)',
  description: 'Talking about daily morning routines',
  scene_context:
    'You and your neighbor Wayan chat about your morning routines. Practice daily activities vocabulary and time expressions.',
  sort_order: 22,
  dialogues: [
    {
      id: 'e1000000-0026-4000-8000-000000000001',
      speaker: 'Wayan',
      text_target: 'Selamat pagi! Sudah makan?',
      text_en: 'Good morning! Have you eaten?',
    },
    {
      id: 'e1000000-0026-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Belum. Saya biasanya makan jam delapan. Bangun jam berapa?',
      text_en: 'Not yet. I usually eat at eight. What time do you wake up?',
    },
    {
      id: 'e1000000-0026-4000-8000-000000000003',
      speaker: 'Wayan',
      text_target: 'Saya bangun jam enam setiap hari. Mandi, minum kopi, lalu bekerja.',
      text_en: 'I wake up at six every day. Shower, drink coffee, then work.',
    },
    {
      id: 'e1000000-0026-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Bekerja di mana? Saya belajar bahasa Indonesia setiap pagi.',
      text_en: 'Where do you work? I study Indonesian every morning.',
    },
    {
      id: 'e1000000-0026-4000-8000-000000000005',
      speaker: 'Wayan',
      text_target: 'Di restoran dekat sini. Kemarin libur, besok kerja lagi.',
      text_en: 'At a restaurant near here. Yesterday was a day off, tomorrow work again.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0026-4000-8000-000000000001',
      text_target: 'Setiap hari',
      text_en: 'Every day',
      literal_translation: 'Every day',
      usage_note:
        '"Setiap" means "every". Combine with time words: "setiap pagi" (every morning), "setiap minggu" (every week).',
      wordTexts: ['setiap', 'hari'],
    },
    {
      id: 'f1000000-0026-4000-8000-000000000002',
      text_target: 'Bangun jam berapa?',
      text_en: 'What time do you wake up?',
      literal_translation: 'Wake-up hour how-many?',
      usage_note:
        '"Bangun" = wake up. "Jam berapa?" asks what time. A very natural morning conversation starter.',
      wordTexts: ['bangun', 'jam', 'berapa'],
    },
    {
      id: 'f1000000-0026-4000-8000-000000000003',
      text_target: 'Biasanya jam enam',
      text_en: 'Usually at six',
      literal_translation: 'Usually hour six',
      usage_note:
        '"Biasanya" means "usually" and softens a statement about habits. Place it at the beginning or end.',
      wordTexts: ['biasanya', 'jam'],
    },
    {
      id: 'f1000000-0026-4000-8000-000000000004',
      text_target: 'Bekerja di mana?',
      text_en: 'Where do you work?',
      literal_translation: 'Work at where?',
      usage_note:
        '"Bekerja" is the formal form of "work". "Di mana" asks "where" for locations.',
      wordTexts: ['bekerja', 'di mana'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0026-4000-8000-000000000001',
      pattern_template: 'Setiap ___',
      pattern_en: 'Every ___',
      explanation:
        '"Setiap" + time word expresses regular habits. "Setiap hari" = every day, "setiap pagi" = every morning.',
      prompt: '___ hari.',
      hint_en: 'Every day.',
      correct_answer: 'Setiap',
      distractors: ['Biasanya', 'Kemarin', 'Besok'],
    },
    {
      id: '0a000000-0026-4000-8000-000000000002',
      pattern_template: 'Bangun jam ___',
      pattern_en: 'Wake up at ___',
      explanation:
        '"Bangun jam" + number tells what time you wake up. "Jam" means "hour" or "o\'clock".',
      prompt: 'Bangun jam ___.',
      hint_en: 'Wake up at six.',
      correct_answer: 'enam',
      distractors: ['tujuh', 'delapan', 'lima'],
    },
    {
      id: '0a000000-0026-4000-8000-000000000003',
      pattern_template: 'Biasanya ___',
      pattern_en: 'Usually ___',
      explanation:
        '"Biasanya" + activity describes what you normally do. Place it before the verb or at the start of the sentence.',
      prompt: '___ makan jam delapan.',
      hint_en: 'Usually eat at eight.',
      correct_answer: 'Biasanya',
      distractors: ['Setiap', 'Kemarin', 'Besok'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000233', text: 'bangun', meaning_en: 'to wake up', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000234', text: 'mandi', meaning_en: 'to bathe / shower', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000235', text: 'tidur', meaning_en: 'to sleep', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000236', text: 'bekerja', meaning_en: 'to work', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000237', text: 'belajar', meaning_en: 'to study / learn', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000238', text: 'setiap', meaning_en: 'every', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000239', text: 'biasanya', meaning_en: 'usually', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000240', text: 'hari', meaning_en: 'day', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000241', text: 'kemarin', meaning_en: 'yesterday', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000242', text: 'besok', meaning_en: 'tomorrow', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000243', text: 'minggu', meaning_en: 'week / Sunday', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000244', text: 'kerja', meaning_en: 'work (root)', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'pagi', 'saya', 'jam', 'berapa', 'makan', 'minum', 'kopi', 'siang',
    'sekarang', 'sudah', 'belum', 'enam', 'delapan', 'di mana', 'restoran',
    'dekat', 'lagi',
  ],
};

// ── Scene 5.3: Bersih-Bersih (Cleaning Up) ──────────────────────────

const scene5_3: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000027',
  title: 'Bersih-Bersih (Cleaning Up)',
  description: 'Household chores and cleaning',
  scene_context:
    'Your housemate reminds you about chores. You discuss what needs to be done. Practice modal verbs (harus, boleh) and household task vocabulary.',
  sort_order: 23,
  dialogues: [
    {
      id: 'e1000000-0027-4000-8000-000000000001',
      speaker: 'Teman',
      text_target: 'Kamar ini kotor sekali! Harus bersih-bersih hari ini.',
      text_en: 'This room is so dirty! We must clean up today.',
    },
    {
      id: 'e1000000-0027-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Baik. Saya bisa sapu lantai dulu.',
      text_en: 'Okay. I can sweep the floor first.',
    },
    {
      id: 'e1000000-0027-4000-8000-000000000003',
      speaker: 'Teman',
      text_target: 'Sudah cuci pakaian? Harus jemur sebelum siang.',
      text_en: 'Already washed clothes? Must dry them before noon.',
    },
    {
      id: 'e1000000-0027-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Belum. Nanti dulu. Boleh saya buang sampah dulu?',
      text_en: 'Not yet. Later. May I take out the trash first?',
    },
    {
      id: 'e1000000-0027-4000-8000-000000000005',
      speaker: 'Teman',
      text_target: 'Boleh! Sampah di dapur juga kotor. Terima kasih!',
      text_en: 'Sure! The trash in the kitchen is also dirty. Thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0027-4000-8000-000000000001',
      text_target: 'Harus cuci pakaian',
      text_en: 'Must wash clothes',
      literal_translation: 'Must wash clothing',
      usage_note:
        '"Harus" means "must" or "have to". Follow with a verb to express obligation.',
      wordTexts: ['harus', 'cuci', 'pakaian'],
    },
    {
      id: 'f1000000-0027-4000-8000-000000000002',
      text_target: 'Sudah sapu?',
      text_en: 'Already swept?',
      literal_translation: 'Already sweep?',
      usage_note:
        '"Sudah" + verb asks if something is done. A common way to check on chores.',
      wordTexts: ['sapu'],
    },
    {
      id: 'f1000000-0027-4000-8000-000000000003',
      text_target: 'Belum, nanti dulu',
      text_en: 'Not yet, later first',
      literal_translation: 'Not-yet, later first',
      usage_note:
        '"Belum" means "not yet". "Nanti dulu" is a casual way to say "later" or "in a moment".',
      wordTexts: ['dulu'],
    },
    {
      id: 'f1000000-0027-4000-8000-000000000004',
      text_target: 'Boleh saya bantu?',
      text_en: 'May I help?',
      literal_translation: 'May I help?',
      usage_note:
        '"Boleh" means "may" or "allowed". "Boleh saya..." is a polite way to ask permission.',
      wordTexts: ['boleh', 'saya'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0027-4000-8000-000000000001',
      pattern_template: 'Harus ___',
      pattern_en: 'Must ___',
      explanation:
        '"Harus" + verb expresses obligation or necessity. "Harus cuci" = must wash.',
      prompt: '___ cuci pakaian.',
      hint_en: 'Must wash clothes.',
      correct_answer: 'Harus',
      distractors: ['Boleh', 'Bisa', 'Mau'],
    },
    {
      id: '0a000000-0027-4000-8000-000000000002',
      pattern_template: 'Sudah ___ / Belum ___',
      pattern_en: 'Already ___ / Not yet ___',
      explanation:
        '"Sudah" + verb means already done. "Belum" means not yet. Use them to ask about or report task completion.',
      prompt: '___ cuci pakaian?',
      hint_en: 'Already washed clothes?',
      correct_answer: 'Sudah',
      distractors: ['Belum', 'Harus', 'Boleh'],
    },
    {
      id: '0a000000-0027-4000-8000-000000000003',
      pattern_template: 'Boleh ___ ?',
      pattern_en: 'May ___ ?',
      explanation:
        '"Boleh" + subject + verb asks for permission. "Boleh saya..." = May I...',
      prompt: '___ saya buang sampah?',
      hint_en: 'May I take out the trash?',
      correct_answer: 'Boleh',
      distractors: ['Harus', 'Bisa', 'Mau'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000245', text: 'bersih', meaning_en: 'clean', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000246', text: 'kotor', meaning_en: 'dirty', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000247', text: 'cuci', meaning_en: 'to wash', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000248', text: 'pakaian', meaning_en: 'clothing', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000249', text: 'jemur', meaning_en: 'to dry (in sun)', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000250', text: 'sapu', meaning_en: 'to sweep / broom', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000251', text: 'sampah', meaning_en: 'trash / garbage', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000252', text: 'harus', meaning_en: 'must / have to', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000253', text: 'boleh', meaning_en: 'may / allowed', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000254', text: 'dulu', meaning_en: 'first / earlier', part_of_speech: 'adverb' },
  ],
  existingWordTexts: [
    'sudah', 'belum', 'saya', 'mau', 'bisa', 'kamar', 'rumah', 'ini',
    'baik', 'terima kasih', 'lantai', 'sekali',
    // From scene 5.1:
    'dapur',
    // From scene 5.2:
    'hari', 'setiap', 'siang',
  ],
};

// ── Scene 5.4: Cuaca Hari Ini (Today's Weather) ─────────────────────

const scene5_4: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000028',
  title: 'Cuaca Hari Ini (Today\'s Weather)',
  description: 'Discussing weather and seasons',
  scene_context:
    'You and a friend discuss the weather while looking out the window. Practice weather vocabulary and descriptive sentences.',
  sort_order: 24,
  dialogues: [
    {
      id: 'e1000000-0028-4000-8000-000000000001',
      speaker: 'Sari',
      text_target: 'Cuaca hari ini mendung. Mau hujan?',
      text_en: 'The weather today is cloudy. Is it going to rain?',
    },
    {
      id: 'e1000000-0028-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Kemarin hujan besar. Hari ini sejuk sekali.',
      text_en: 'Yesterday it rained heavily. Today is very cool.',
    },
    {
      id: 'e1000000-0028-4000-8000-000000000003',
      speaker: 'Sari',
      text_target: 'Saya suka cuaca sejuk. Tidak terlalu panas.',
      text_en: 'I like cool weather. Not too hot.',
    },
    {
      id: 'e1000000-0028-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Sekarang musim hujan atau musim kering?',
      text_en: 'Is it rainy season or dry season now?',
    },
    {
      id: 'e1000000-0028-4000-8000-000000000005',
      speaker: 'Sari',
      text_target: 'Masih musim hujan. Besok cerah, ada angin juga.',
      text_en: 'Still rainy season. Tomorrow is clear, with wind too.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0028-4000-8000-000000000001',
      text_target: 'Cuaca hari ini bagaimana?',
      text_en: 'How is the weather today?',
      literal_translation: 'Weather day this how?',
      usage_note:
        '"Cuaca" means "weather". Combine with "hari ini" (today) and "bagaimana" (how) to ask about weather.',
      wordTexts: ['cuaca', 'hari', 'ini'],
    },
    {
      id: 'f1000000-0028-4000-8000-000000000002',
      text_target: 'Hari ini hujan',
      text_en: 'Today it is raining',
      literal_translation: 'Day this rain',
      usage_note:
        'No verb "to be" needed. "Hujan" functions as both the noun "rain" and the verb "to rain".',
      wordTexts: ['hari', 'ini', 'hujan'],
    },
    {
      id: 'f1000000-0028-4000-8000-000000000003',
      text_target: 'Musim kering',
      text_en: 'Dry season',
      literal_translation: 'Season dry',
      usage_note:
        '"Musim" + adjective describes a season. "Musim hujan" = rainy season, "musim kering" = dry season.',
      wordTexts: ['musim', 'kering'],
    },
    {
      id: 'f1000000-0028-4000-8000-000000000004',
      text_target: 'Ada angin',
      text_en: 'There is wind',
      literal_translation: 'There-is wind',
      usage_note:
        'Use "ada" + weather noun to describe conditions. "Ada angin" = it is windy.',
      wordTexts: ['ada', 'angin'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0028-4000-8000-000000000001',
      pattern_template: 'Cuaca ___',
      pattern_en: 'The weather is ___',
      explanation:
        '"Cuaca" + adjective describes the weather. No verb "to be" is needed in Indonesian.',
      prompt: 'Cuaca hari ini ___.',
      hint_en: 'The weather today is cloudy.',
      correct_answer: 'mendung',
      distractors: ['cerah', 'sejuk', 'kering'],
    },
    {
      id: '0a000000-0028-4000-8000-000000000002',
      pattern_template: 'Musim ___',
      pattern_en: '___ season',
      explanation:
        '"Musim" + noun or adjective names a season. "Musim hujan" = rainy season, "musim kering" = dry season.',
      prompt: 'Musim ___.',
      hint_en: 'Dry season.',
      correct_answer: 'kering',
      distractors: ['hujan', 'basah', 'cerah'],
    },
    {
      id: '0a000000-0028-4000-8000-000000000003',
      pattern_template: 'Tidak terlalu ___',
      pattern_en: 'Not too ___',
      explanation:
        '"Tidak terlalu" + adjective means "not too [adjective]". A moderate way to describe conditions.',
      prompt: 'Tidak terlalu ___.',
      hint_en: 'Not too hot.',
      correct_answer: 'panas',
      distractors: ['dingin', 'sejuk', 'basah'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000255', text: 'cuaca', meaning_en: 'weather', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000256', text: 'hujan', meaning_en: 'rain', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000257', text: 'sejuk', meaning_en: 'cool (weather)', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000258', text: 'angin', meaning_en: 'wind', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000259', text: 'mendung', meaning_en: 'cloudy / overcast', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000260', text: 'cerah', meaning_en: 'clear / sunny', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000261', text: 'musim', meaning_en: 'season', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000262', text: 'kering', meaning_en: 'dry', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000263', text: 'basah', meaning_en: 'wet', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'panas', 'ini', 'sudah', 'sangat', 'dingin', 'besar', 'saya', 'suka',
    'tidak', 'terlalu', 'atau', 'ada', 'juga', 'sekali', 'sekarang',
    'bagaimana',
    // From scene 5.2:
    'hari', 'kemarin', 'besok',
  ],
};

// ── Scene 5.5: Belanja Bulanan (Monthly Shopping) ───────────────────

const scene5_5: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000029',
  title: 'Belanja Bulanan (Monthly Shopping)',
  description: 'Monthly grocery shopping',
  scene_context:
    'You make a shopping list for your monthly groceries and go shopping at the supermarket. Practice frequency words and shopping vocabulary.',
  sort_order: 25,
  dialogues: [
    {
      id: 'e1000000-0029-4000-8000-000000000001',
      speaker: 'Teman',
      text_target: 'Beras sudah habis. Perlu belanja hari ini.',
      text_en: 'The rice is used up. Need to shop today.',
    },
    {
      id: 'e1000000-0029-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Saya juga perlu beli telur dan sayuran. Sering beli di mana?',
      text_en: 'I also need to buy eggs and vegetables. Where do you usually buy?',
    },
    {
      id: 'e1000000-0029-4000-8000-000000000003',
      speaker: 'Teman',
      text_target: 'Kadang-kadang di pasar, kadang-kadang di toko. Buah-buahan selalu di pasar.',
      text_en: 'Sometimes at the market, sometimes at the shop. Fruits always at the market.',
    },
    {
      id: 'e1000000-0029-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Apa saja kebutuhan bulan ini? Gula, garam, minyak, sabun...',
      text_en: 'What are the needs this month? Sugar, salt, oil, soap...',
    },
    {
      id: 'e1000000-0029-4000-8000-000000000005',
      speaker: 'Teman',
      text_target: 'Tisu juga habis. Saya jarang beli tisu, tapi sekarang perlu.',
      text_en: 'Tissue is also used up. I rarely buy tissue, but now we need it.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0029-4000-8000-000000000001',
      text_target: 'Belanja bulanan',
      text_en: 'Monthly shopping',
      literal_translation: 'Shopping monthly',
      usage_note:
        '"Belanja" is for grocery shopping. "Bulanan" comes from "bulan" (month) + "-an" suffix meaning "monthly".',
      wordTexts: ['belanja', 'bulan'],
    },
    {
      id: 'f1000000-0029-4000-8000-000000000002',
      text_target: 'Beras sudah habis',
      text_en: 'The rice is used up',
      literal_translation: 'Rice already finished',
      usage_note:
        '"Sudah habis" means something has run out. Very useful for household items.',
      wordTexts: ['beras', 'habis'],
    },
    {
      id: 'f1000000-0029-4000-8000-000000000003',
      text_target: 'Sering beli di mana?',
      text_en: 'Where do you usually buy?',
      literal_translation: 'Often buy at where?',
      usage_note:
        '"Sering" means "often". Placing it before the verb asks about regular habits.',
      wordTexts: ['sering', 'beli', 'di mana'],
    },
    {
      id: 'f1000000-0029-4000-8000-000000000004',
      text_target: 'Kadang-kadang di pasar',
      text_en: 'Sometimes at the market',
      literal_translation: 'Sometimes at market',
      usage_note:
        '"Kadang-kadang" means "sometimes". Indonesian uses reduplication for words expressing frequency or variety.',
      wordTexts: ['kadang-kadang'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0029-4000-8000-000000000001',
      pattern_template: 'Sering / jarang / selalu + verb',
      pattern_en: 'Often / rarely / always + verb',
      explanation:
        'Frequency words go before the verb. "Sering beli" = often buy, "jarang beli" = rarely buy, "selalu beli" = always buy.',
      prompt: 'Saya ___ beli di pasar.',
      hint_en: 'I always buy at the market.',
      correct_answer: 'selalu',
      distractors: ['sering', 'jarang', 'kadang-kadang'],
    },
    {
      id: '0a000000-0029-4000-8000-000000000002',
      pattern_template: 'Sudah habis',
      pattern_en: 'Used up / run out',
      explanation:
        '"Sudah" + "habis" means something has run out or is used up. Put the item before this phrase.',
      prompt: 'Beras sudah ___.',
      hint_en: 'The rice is used up.',
      correct_answer: 'habis',
      distractors: ['beli', 'perlu', 'bersih'],
    },
    {
      id: '0a000000-0029-4000-8000-000000000003',
      pattern_template: 'Perlu beli ___',
      pattern_en: 'Need to buy ___',
      explanation:
        '"Perlu" + "beli" + noun means you need to buy something. Chain verbs together naturally in Indonesian.',
      prompt: '___ beli telur.',
      hint_en: 'Need to buy eggs.',
      correct_answer: 'Perlu',
      distractors: ['Mau', 'Sering', 'Sudah'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000264', text: 'belanja', meaning_en: 'to shop (groceries)', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000265', text: 'sering', meaning_en: 'often', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000266', text: 'jarang', meaning_en: 'rarely', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000267', text: 'selalu', meaning_en: 'always', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000268', text: 'kadang-kadang', meaning_en: 'sometimes', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000269', text: 'beras', meaning_en: 'rice (uncooked)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000270', text: 'sayuran', meaning_en: 'vegetables (collective)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000271', text: 'buah-buahan', meaning_en: 'fruits (collective)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000272', text: 'kebutuhan', meaning_en: 'needs / necessities', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000273', text: 'habis', meaning_en: 'used up / finished', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'perlu', 'beli', 'saya', 'mau', 'telur', 'gula', 'minyak', 'garam',
    'sabun', 'tisu', 'sudah', 'tapi', 'sekarang', 'juga', 'di mana', 'toko',
    'semua', 'ini',
    // From scene 5.1:
    'bulan',
    // From scene 5.2:
    'setiap', 'hari', 'minggu',
  ],
};

export const UNIT5_SCENES: DialogueSceneData[] = [scene5_1, scene5_2, scene5_3, scene5_4, scene5_5];
