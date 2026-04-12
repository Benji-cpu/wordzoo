// Unit 1: Arrivals & Greetings — Scenes 1.3, 1.4, 1.5
// Extended dialogue scenes for Indonesian language learning.

import type { DialogueSceneData } from '../dialogue-data';

// ── Scene 1.3: Sampai di Bandara (Arriving at the Airport) ──────────

const scene1_3: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000011',
  title: 'Sampai di Bandara (Arriving at the Airport)',
  description: 'Arriving at Bali airport, going through immigration',
  scene_context:
    "You've just landed at Ngurah Rai airport in Bali. You go through immigration and need to get your bags and find a taxi. Practice basic airport phrases.",
  sort_order: 3,
  dialogues: [
    {
      id: 'e1000000-0011-4000-8000-000000000001',
      speaker: 'Petugas',
      text_target: 'Selamat malam. Paspor, ya.',
      text_en: 'Good evening. Passport, please.',
    },
    {
      id: 'e1000000-0011-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Ini paspor saya.',
      text_en: 'Here is my passport.',
    },
    {
      id: 'e1000000-0011-4000-8000-000000000003',
      speaker: 'Petugas',
      text_target: 'Untuk berapa malam?',
      text_en: 'For how many nights?',
    },
    {
      id: 'e1000000-0011-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Satu malam di Kuta, lalu ke Ubud.',
      text_en: 'One night in Kuta, then to Ubud.',
    },
    {
      id: 'e1000000-0011-4000-8000-000000000005',
      speaker: 'Petugas',
      text_target: 'Baik. Selamat datang!',
      text_en: 'Okay. Welcome!',
    },
    {
      id: 'e1000000-0011-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Permisi, tolong tas saya. Berat sekali!',
      text_en: 'Excuse me, please help with my bag. So heavy!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0011-4000-8000-000000000001',
      text_target: 'Tolong tas saya',
      text_en: 'Please help with my bag',
      literal_translation: 'Help bag I/me',
      usage_note:
        '"Tolong" means "please" or "help". Follow it with what you need help with.',
      wordTexts: ['tolong', 'tas', 'saya'],
    },
    {
      id: 'f1000000-0011-4000-8000-000000000002',
      text_target: 'Saya mau ke Ubud',
      text_en: 'I want to go to Ubud',
      literal_translation: 'I want to Ubud',
      usage_note:
        '"Mau ke" + place name is how you say where you want to go. No extra verb needed.',
      wordTexts: ['saya', 'mau', 'ke'],
    },
    {
      id: 'f1000000-0011-4000-8000-000000000003',
      text_target: 'Sampai!',
      text_en: 'Arrived!',
      literal_translation: 'Arrive!',
      usage_note:
        'A common exclamation when you reach your destination. Short and cheerful.',
      wordTexts: ['sampai'],
    },
    {
      id: 'f1000000-0011-4000-8000-000000000004',
      text_target: 'Satu malam',
      text_en: 'One night',
      literal_translation: 'One night',
      usage_note:
        'Number + "malam" to say how many nights. Used at hotels and immigration.',
      wordTexts: ['satu', 'malam'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0011-4000-8000-000000000001',
      pattern_template: 'Tolong ___ saya',
      pattern_en: 'Please help with my ___',
      explanation:
        '"Tolong" + noun asks for help with something. Add "saya" to say it is yours.',
      prompt: 'Tolong ___ saya.',
      hint_en: 'Please help with my bag.',
      correct_answer: 'tas',
      distractors: ['paspor', 'bandara', 'malam'],
    },
    {
      id: '0a000000-0011-4000-8000-000000000002',
      pattern_template: 'Saya mau ke ___',
      pattern_en: 'I want to go to ___',
      explanation:
        '"Mau ke" + place tells people your destination. No extra verb for "go" is needed.',
      prompt: 'Saya mau ___ Ubud.',
      hint_en: 'I want to go to Ubud.',
      correct_answer: 'ke',
      distractors: ['di', 'untuk', 'dari'],
    },
    {
      id: '0a000000-0011-4000-8000-000000000003',
      pattern_template: '___ malam',
      pattern_en: '___ night(s)',
      explanation:
        'Number + "malam" says how many nights. Indonesian has no plural marker.',
      prompt: '___ malam di Kuta.',
      hint_en: 'One night in Kuta.',
      correct_answer: 'Satu',
      distractors: ['Tas', 'Ke', 'Untuk'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000043', text: 'permisi', meaning_en: 'excuse me', part_of_speech: 'interjection' },
    { id: 'b1000000-0001-4000-8000-000000000044', text: 'ya', meaning_en: 'yes', part_of_speech: 'interjection' },
    { id: 'b1000000-0001-4000-8000-000000000045', text: 'tolong', meaning_en: 'please / help', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000046', text: 'ke', meaning_en: 'to (direction)', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000047', text: 'sampai', meaning_en: 'arrive / until', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000048', text: 'bandara', meaning_en: 'airport', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000049', text: 'paspor', meaning_en: 'passport', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000050', text: 'tas', meaning_en: 'bag', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000051', text: 'berat', meaning_en: 'heavy', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000052', text: 'untuk', meaning_en: 'for / in order to', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000053', text: 'satu', meaning_en: 'one', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000054', text: 'malam', meaning_en: 'night / evening', part_of_speech: 'noun' },
  ],
  existingWordTexts: ['tidak', 'di', 'mau', 'saya', 'baik', 'ini', 'berapa', 'sekali'],
};

// ── Scene 1.4: Check-in di Hotel (Hotel Check-In) ───────────────────

const scene1_4: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000012',
  title: 'Check-in di Hotel (Hotel Check-In)',
  description: 'Checking into a hotel in Bali',
  scene_context:
    'You arrive at your hotel in Ubud. The receptionist helps you check in. Practice asking about rooms and hotel vocabulary.',
  sort_order: 4,
  dialogues: [
    {
      id: 'e1000000-0012-4000-8000-000000000001',
      speaker: 'Resepsionis',
      text_target: 'Selamat siang! Mau check-in?',
      text_en: 'Good afternoon! Checking in?',
    },
    {
      id: 'e1000000-0012-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Ya, saya mau check-in. Ada kamar untuk dua malam?',
      text_en: 'Yes, I want to check in. Is there a room for two nights?',
    },
    {
      id: 'e1000000-0012-4000-8000-000000000003',
      speaker: 'Resepsionis',
      text_target: 'Ada! Kamar di lantai dua. Kamar besar dengan balkon.',
      text_en: 'Yes! A room on the second floor. A big room with a balcony.',
    },
    {
      id: 'e1000000-0012-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Bagus! Berapa satu malam?',
      text_en: 'Nice! How much per night?',
    },
    {
      id: 'e1000000-0012-4000-8000-000000000005',
      speaker: 'Resepsionis',
      text_target: 'Tiga ratus ribu per malam. Ini kunci kamar.',
      text_en: 'Three hundred thousand per night. Here is the room key.',
    },
    {
      id: 'e1000000-0012-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Terima kasih!',
      text_en: 'Thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0012-4000-8000-000000000001',
      text_target: 'Ada kamar?',
      text_en: 'Is there a room?',
      literal_translation: 'There-is room?',
      usage_note:
        '"Ada" means "there is" or "have". As a question it asks if something is available.',
      wordTexts: ['ada', 'kamar'],
    },
    {
      id: 'f1000000-0012-4000-8000-000000000002',
      text_target: 'Berapa malam?',
      text_en: 'How many nights?',
      literal_translation: 'How-many night?',
      usage_note:
        '"Berapa" + noun asks "how many". No plural marker needed in Indonesian.',
      wordTexts: ['berapa', 'malam'],
    },
    {
      id: 'f1000000-0012-4000-8000-000000000003',
      text_target: 'Kamar di lantai dua',
      text_en: 'Room on the second floor',
      literal_translation: 'Room at floor two',
      usage_note:
        '"Di lantai" + number tells which floor. Numbers come after the noun in Indonesian.',
      wordTexts: ['kamar', 'di', 'lantai', 'dua'],
    },
    {
      id: 'f1000000-0012-4000-8000-000000000004',
      text_target: 'Ini kunci kamar',
      text_en: 'This is the room key',
      literal_translation: 'This key room',
      usage_note:
        '"Kunci kamar" = room key. In Indonesian the modifier comes after the noun.',
      wordTexts: ['ini', 'kunci', 'kamar'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0012-4000-8000-000000000001',
      pattern_template: 'Ada ___?',
      pattern_en: 'Is there a ___?',
      explanation:
        '"Ada" at the start of a question asks whether something exists or is available.',
      prompt: '___ kamar?',
      hint_en: 'Is there a room?',
      correct_answer: 'Ada',
      distractors: ['Ini', 'Mau', 'Apa'],
    },
    {
      id: '0a000000-0012-4000-8000-000000000002',
      pattern_template: 'Berapa ___?',
      pattern_en: 'How many ___?',
      explanation:
        '"Berapa" + noun asks "how much" or "how many". Works for both price and quantity.',
      prompt: 'Berapa ___?',
      hint_en: 'How many nights?',
      correct_answer: 'malam',
      distractors: ['kamar', 'kunci', 'lantai'],
    },
    {
      id: '0a000000-0012-4000-8000-000000000003',
      pattern_template: 'Di lantai ___',
      pattern_en: 'On floor ___',
      explanation:
        '"Di lantai" + number describes which floor. Indonesian numbers follow the noun.',
      prompt: 'Kamar di lantai ___.',
      hint_en: 'Room on the second floor.',
      correct_answer: 'dua',
      distractors: ['satu', 'tiga', 'kecil'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000055', text: 'ada', meaning_en: 'there is / have', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000056', text: 'kamar', meaning_en: 'room', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000057', text: 'siang', meaning_en: 'afternoon', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000058', text: 'sore', meaning_en: 'late afternoon', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000059', text: 'kunci', meaning_en: 'key', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000060', text: 'lantai', meaning_en: 'floor / level', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000061', text: 'dua', meaning_en: 'two', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000062', text: 'tiga', meaning_en: 'three', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000063', text: 'dengan', meaning_en: 'with', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000064', text: 'kecil', meaning_en: 'small', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000065', text: 'bagus', meaning_en: 'good / nice', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'berapa', 'besar', 'saya', 'mau', 'ini', 'baik', 'terima kasih', 'di',
    // From scene 1.3:
    'malam', 'tolong', 'ke', 'untuk', 'satu', 'ya',
  ],
};

// ── Scene 1.5: Tetangga Baru (New Neighbors) ───────────────────────

const scene1_5: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000013',
  title: 'Tetangga Baru (New Neighbors)',
  description: 'Meeting your new neighbors',
  scene_context:
    "You've moved into a rental in Ubud. A friendly neighbor comes by to introduce themselves. Practice small talk about where you live and how long you've been there.",
  sort_order: 5,
  dialogues: [
    {
      id: 'e1000000-0013-4000-8000-000000000001',
      speaker: 'Wayan',
      text_target: 'Halo! Saya Wayan. Saya tetangga di sini.',
      text_en: 'Hello! I am Wayan. I am a neighbor here.',
    },
    {
      id: 'e1000000-0013-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Senang bertemu, Wayan! Nama saya ... Saya orang baru di sini.',
      text_en: 'Nice to meet you, Wayan! My name is ... I am new here.',
    },
    {
      id: 'e1000000-0013-4000-8000-000000000003',
      speaker: 'Wayan',
      text_target: 'Tinggal di mana? Rumah dekat sini?',
      text_en: 'Where do you live? A house near here?',
    },
    {
      id: 'e1000000-0013-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Ya, rumah kecil di sana. Saya belum lama di sini.',
      text_en: 'Yes, a small house over there. I have not been here long.',
    },
    {
      id: 'e1000000-0013-4000-8000-000000000005',
      speaker: 'Wayan',
      text_target: 'Saya sudah lama tinggal di sini. Sudah dua puluh tahun!',
      text_en: 'I have lived here a long time. Already twenty years!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0013-4000-8000-000000000001',
      text_target: 'Tinggal di mana?',
      text_en: 'Where do you live?',
      literal_translation: 'Live at where?',
      usage_note:
        '"Tinggal" means to live or stay. "Di mana" asks where. A very common question for new acquaintances.',
      wordTexts: ['tinggal', 'di mana'],
    },
    {
      id: 'f1000000-0013-4000-8000-000000000002',
      text_target: 'Sudah lama?',
      text_en: 'Been long?',
      literal_translation: 'Already long?',
      usage_note:
        '"Sudah" means "already" and marks something completed or ongoing. "Lama" means a long time.',
      wordTexts: ['sudah', 'lama'],
    },
    {
      id: 'f1000000-0013-4000-8000-000000000003',
      text_target: 'Belum lama',
      text_en: 'Not long yet',
      literal_translation: 'Not-yet long',
      usage_note:
        '"Belum" means "not yet" — it implies it may happen later. Different from "tidak" which is a flat no.',
      wordTexts: ['belum', 'lama'],
    },
    {
      id: 'f1000000-0013-4000-8000-000000000004',
      text_target: 'Tetangga baru',
      text_en: 'New neighbor',
      literal_translation: 'Neighbor new',
      usage_note:
        'In Indonesian, adjectives come after the noun. "Tetangga baru" = new neighbor.',
      wordTexts: ['tetangga', 'baru'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0013-4000-8000-000000000001',
      pattern_template: 'Tinggal di ___',
      pattern_en: 'Live in ___',
      explanation:
        '"Tinggal di" + place name tells where someone lives. "Di" marks location.',
      prompt: 'Saya tinggal ___ Ubud.',
      hint_en: 'I live in Ubud.',
      correct_answer: 'di',
      distractors: ['ke', 'dari', 'untuk'],
    },
    {
      id: '0a000000-0013-4000-8000-000000000002',
      pattern_template: 'Sudah ___',
      pattern_en: 'Already ___',
      explanation:
        '"Sudah" before a time word or adjective means something has already happened or been the case.',
      prompt: '___ lama tinggal di sini.',
      hint_en: 'Have lived here a long time.',
      correct_answer: 'Sudah',
      distractors: ['Belum', 'Tidak', 'Baru'],
    },
    {
      id: '0a000000-0013-4000-8000-000000000003',
      pattern_template: 'Belum ___',
      pattern_en: 'Not yet ___',
      explanation:
        '"Belum" means "not yet" — unlike "tidak", it implies the action may still happen in the future.',
      prompt: 'Saya ___ lama di sini.',
      hint_en: 'I have not been here long yet.',
      correct_answer: 'belum',
      distractors: ['sudah', 'tidak', 'baru'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000066', text: 'tinggal', meaning_en: 'to live / to stay', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000067', text: 'sudah', meaning_en: 'already', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000068', text: 'belum', meaning_en: 'not yet', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000069', text: 'lama', meaning_en: 'long (time)', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000070', text: 'baru', meaning_en: 'new / just', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000071', text: 'orang', meaning_en: 'person / people', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000072', text: 'rumah', meaning_en: 'house / home', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000073', text: 'tetangga', meaning_en: 'neighbor', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'di mana', 'dekat', 'dari', 'saya', 'nama', 'senang', 'bertemu', 'baik', 'di',
    // From scene 1.3:
    'ya',
    // From scene 1.4:
    'kecil', 'dua',
  ],
};

export const UNIT1_SCENES: DialogueSceneData[] = [scene1_3, scene1_4, scene1_5];
