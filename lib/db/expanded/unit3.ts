// Unit 3: Food & Drink — Scenes 3.3, 3.4, 3.5
// Extended dialogue scenes for Indonesian language learning.

import type { DialogueSceneData } from '../dialogue-data';

// ── Scene 3.3: Di Kafe (At the Cafe) ────────────────────────────────

const scene3_3: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000018',
  title: 'Di Kafe (At the Cafe)',
  description: 'Ordering coffee and snacks at a Balinese cafe',
  scene_context:
    'You stop at a cozy cafe in Ubud. You order coffee and try some local snacks. Practice polite ordering with "minta" and describing what you want.',
  sort_order: 13,
  dialogues: [
    {
      id: 'e1000000-0018-4000-8000-000000000001',
      speaker: 'Barista',
      text_target: 'Selamat pagi! Mau pesan apa?',
      text_en: 'Good morning! What would you like to order?',
    },
    {
      id: 'e1000000-0018-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Minta kopi panas dengan susu, tolong.',
      text_en: "I'd like hot coffee with milk, please.",
    },
    {
      id: 'e1000000-0018-4000-8000-000000000003',
      speaker: 'Barista',
      text_target: 'Baik. Mau tambah gula?',
      text_en: 'Okay. Want to add sugar?',
    },
    {
      id: 'e1000000-0018-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Tanpa gula, terima kasih. Ada kue pisang?',
      text_en: 'Without sugar, thank you. Do you have banana cake?',
    },
    {
      id: 'e1000000-0018-4000-8000-000000000005',
      speaker: 'Barista',
      text_target: 'Ada! Roti pisang juga enak. Mau coba?',
      text_en: 'Yes! Banana bread is also delicious. Want to try?',
    },
    {
      id: 'e1000000-0018-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Saya mau kue pisang sama roti. Enak sekali!',
      text_en: 'I want banana cake and bread. So delicious!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0018-4000-8000-000000000001',
      text_target: 'Minta kopi panas',
      text_en: "I'd like hot coffee",
      literal_translation: 'Request coffee hot',
      usage_note:
        '"Minta" is a polite way to request something, softer than "mau". Follow it with what you want.',
      wordTexts: ['minta', 'kopi', 'panas'],
    },
    {
      id: 'f1000000-0018-4000-8000-000000000002',
      text_target: 'Tanpa gula',
      text_en: 'Without sugar',
      literal_translation: 'Without sugar',
      usage_note:
        '"Tanpa" means "without". Use it to say what you do not want in your order.',
      wordTexts: ['tanpa', 'gula'],
    },
    {
      id: 'f1000000-0018-4000-8000-000000000003',
      text_target: 'Tambah susu sedikit',
      text_en: 'Add a little milk',
      literal_translation: 'Add milk a-little',
      usage_note:
        '"Tambah" means to add. "Sedikit" means a little. Useful for customizing drinks.',
      wordTexts: ['tambah', 'susu', 'sedikit'],
    },
    {
      id: 'f1000000-0018-4000-8000-000000000004',
      text_target: 'Enak sekali!',
      text_en: 'So delicious!',
      literal_translation: 'Delicious very!',
      usage_note:
        'A common compliment for food and drinks. "Sekali" after an adjective means "very".',
      wordTexts: ['enak'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0018-4000-8000-000000000001',
      pattern_template: 'Minta ___',
      pattern_en: "I'd like ___",
      explanation:
        '"Minta" is a polite request word. Follow it with the noun you want to order.',
      prompt: '___ kopi panas.',
      hint_en: "I'd like hot coffee.",
      correct_answer: 'Minta',
      distractors: ['Mau', 'Suka', 'Ada'],
    },
    {
      id: '0a000000-0018-4000-8000-000000000002',
      pattern_template: 'Kopi ___ / kopi ___',
      pattern_en: 'Hot coffee / cold coffee',
      explanation:
        'In Indonesian, adjectives come after the noun. "Kopi panas" = hot coffee, "kopi dingin" = cold coffee.',
      prompt: 'Kopi ___.',
      hint_en: 'Hot coffee.',
      correct_answer: 'panas',
      distractors: ['dingin', 'sedikit', 'lagi'],
    },
    {
      id: '0a000000-0018-4000-8000-000000000003',
      pattern_template: 'Tanpa ___ / Dengan ___',
      pattern_en: 'Without ___ / With ___',
      explanation:
        '"Tanpa" means "without" and "dengan" means "with". Use them to customize your order.',
      prompt: '___ gula.',
      hint_en: 'Without sugar.',
      correct_answer: 'Tanpa',
      distractors: ['Dengan', 'Tambah', 'Minta'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000124', text: 'kopi', meaning_en: 'coffee', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000125', text: 'susu', meaning_en: 'milk', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000126', text: 'gula', meaning_en: 'sugar', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000127', text: 'panas', meaning_en: 'hot', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000128', text: 'dingin', meaning_en: 'cold', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000129', text: 'sedikit', meaning_en: 'a little', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000130', text: 'minta', meaning_en: 'to request / ask for', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000131', text: 'sama', meaning_en: 'same', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000132', text: 'roti', meaning_en: 'bread', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000133', text: 'pisang', meaning_en: 'banana', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000134', text: 'kue', meaning_en: 'cake / pastry', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000135', text: 'lagi', meaning_en: 'again / more', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000136', text: 'tanpa', meaning_en: 'without', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000137', text: 'tambah', meaning_en: 'to add / extra', part_of_speech: 'verb' },
  ],
  existingWordTexts: [
    'saya', 'mau', 'terima kasih', 'tolong', 'baik', 'enak', 'suka', 'dengan', 'tidak',
    // From earlier Unit 3 scenes (Saya Mau, Enak Sekali):
    'pesan', 'apa', 'sekali', 'coba', 'ada',
  ],
};

// ── Scene 3.4: Makan di Restoran (Eating at a Restaurant) ───────────

const scene3_4: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000019',
  title: 'Makan di Restoran (Eating at a Restaurant)',
  description: 'Full restaurant dining experience',
  scene_context:
    'You and your friend eat at a nicer restaurant in Seminyak. You order various dishes, describe tastes, and ask for the bill.',
  sort_order: 14,
  dialogues: [
    {
      id: 'e1000000-0019-4000-8000-000000000001',
      speaker: 'Pelayan',
      text_target: 'Selamat sore! Mau pesan apa?',
      text_en: 'Good afternoon! What would you like to order?',
    },
    {
      id: 'e1000000-0019-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Saya mau nasi goreng ayam. Tidak terlalu pedas.',
      text_en: 'I want chicken fried rice. Not too spicy.',
    },
    {
      id: 'e1000000-0019-4000-8000-000000000003',
      speaker: 'Adi',
      text_target: 'Saya mau ikan goreng dengan sayur. Tambah sambal!',
      text_en: 'I want fried fish with vegetables. Extra chili sauce!',
    },
    {
      id: 'e1000000-0019-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Sangat enak! Tapi sedikit asin.',
      text_en: 'Very delicious! But a little salty.',
    },
    {
      id: 'e1000000-0019-4000-8000-000000000005',
      speaker: 'Adi',
      text_target: 'Sudah selesai? Bisa minta bon?',
      text_en: 'Already finished? Can we ask for the bill?',
    },
    {
      id: 'e1000000-0019-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Ya, sudah selesai. Saya mau bayar. Terima kasih!',
      text_en: 'Yes, already finished. I want to pay. Thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0019-4000-8000-000000000001',
      text_target: 'Minta bon',
      text_en: 'The bill, please',
      literal_translation: 'Request bill',
      usage_note:
        'A polite way to ask for the bill at a restaurant. "Minta" is softer than "mau".',
      wordTexts: ['minta', 'bon'],
    },
    {
      id: 'f1000000-0019-4000-8000-000000000002',
      text_target: 'Sudah selesai',
      text_en: 'Already finished',
      literal_translation: 'Already finished',
      usage_note:
        '"Sudah" marks completion. "Sudah selesai" means you are done eating or done with a task.',
      wordTexts: ['selesai'],
    },
    {
      id: 'f1000000-0019-4000-8000-000000000003',
      text_target: 'Bisa bayar?',
      text_en: 'Can I pay?',
      literal_translation: 'Can pay?',
      usage_note:
        '"Bisa" + verb asks if you can do something. A polite way to request the check.',
      wordTexts: ['bisa', 'bayar'],
    },
    {
      id: 'f1000000-0019-4000-8000-000000000004',
      text_target: 'Sangat enak!',
      text_en: 'Very delicious!',
      literal_translation: 'Very delicious!',
      usage_note:
        '"Sangat" is a more formal way to say "very", compared to "sekali" which goes after the adjective.',
      wordTexts: ['sangat', 'enak'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0019-4000-8000-000000000001',
      pattern_template: 'Bisa ___?',
      pattern_en: 'Can ___?',
      explanation:
        '"Bisa" + verb asks if something is possible or permitted. Used for polite requests.',
      prompt: '___ bayar?',
      hint_en: 'Can I pay?',
      correct_answer: 'Bisa',
      distractors: ['Mau', 'Minta', 'Sudah'],
    },
    {
      id: '0a000000-0019-4000-8000-000000000002',
      pattern_template: 'Sudah ___',
      pattern_en: 'Already ___',
      explanation:
        '"Sudah" + adjective or verb means something is already done or completed.',
      prompt: '___ selesai.',
      hint_en: 'Already finished.',
      correct_answer: 'Sudah',
      distractors: ['Bisa', 'Mau', 'Tidak'],
    },
    {
      id: '0a000000-0019-4000-8000-000000000003',
      pattern_template: 'Terlalu ___',
      pattern_en: 'Too ___',
      explanation:
        '"Terlalu" + adjective means "too much" of that quality. Use it to describe something excessive.',
      prompt: 'Tidak ___ pedas.',
      hint_en: 'Not too spicy.',
      correct_answer: 'terlalu',
      distractors: ['sangat', 'sedikit', 'sekali'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000138', text: 'ayam', meaning_en: 'chicken', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000139', text: 'ikan', meaning_en: 'fish', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000140', text: 'sayur', meaning_en: 'vegetable', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000141', text: 'daging', meaning_en: 'meat', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000142', text: 'sambal', meaning_en: 'chili sauce', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000143', text: 'asin', meaning_en: 'salty', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000144', text: 'asam', meaning_en: 'sour', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000145', text: 'pahit', meaning_en: 'bitter', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000146', text: 'selesai', meaning_en: 'finished', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000147', text: 'bayar', meaning_en: 'to pay', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000148', text: 'uang', meaning_en: 'money', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000149', text: 'bon', meaning_en: 'bill / check', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000150', text: 'sangat', meaning_en: 'very', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000151', text: 'terlalu', meaning_en: 'too (much)', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000152', text: 'nasi', meaning_en: 'rice (cooked)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000153', text: 'goreng', meaning_en: 'fried', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'bisa', 'mau', 'saya', 'pedas', 'enak', 'sekali', 'tidak', 'makan', 'minum',
    'terima kasih', 'pesan', 'apa', 'dengan', 'sudah',
    // From scene 3.3:
    'kopi', 'panas', 'dingin', 'sedikit', 'minta', 'tambah',
  ],
};

// ── Scene 3.5: Masak Sendiri (Cooking Yourself) ─────────────────────

const scene3_5: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000020',
  title: 'Masak Sendiri (Cooking Yourself)',
  description: 'Shopping for ingredients and cooking at home',
  scene_context:
    'You decide to cook at your rental villa. You go to a small shop to buy ingredients. Practice food ingredient vocabulary and simple cooking words.',
  sort_order: 15,
  dialogues: [
    {
      id: 'e1000000-0020-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, saya perlu telur dan bawang merah.',
      text_en: 'Excuse me, I need eggs and shallots.',
    },
    {
      id: 'e1000000-0020-4000-8000-000000000002',
      speaker: 'Penjual',
      text_target: 'Berapa telur? Ada bawang putih juga.',
      text_en: 'How many eggs? There are also garlic.',
    },
    {
      id: 'e1000000-0020-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Empat telur. Saya juga perlu minyak dan garam.',
      text_en: 'Four eggs. I also need oil and salt.',
    },
    {
      id: 'e1000000-0020-4000-8000-000000000004',
      speaker: 'Penjual',
      text_target: 'Mau masak apa?',
      text_en: 'What do you want to cook?',
    },
    {
      id: 'e1000000-0020-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Masak nasi goreng sendiri! Potong bawang, campur dengan telur.',
      text_en: 'Cook fried rice by myself! Cut onion, mix with egg.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0020-4000-8000-000000000001',
      text_target: 'Masak sendiri',
      text_en: 'Cook by yourself',
      literal_translation: 'Cook self',
      usage_note:
        '"Sendiri" means "by oneself" or "alone". After a verb, it emphasizes doing something yourself.',
      wordTexts: ['masak', 'sendiri'],
    },
    {
      id: 'f1000000-0020-4000-8000-000000000002',
      text_target: 'Perlu bawang merah',
      text_en: 'Need shallots',
      literal_translation: 'Need onion red',
      usage_note:
        '"Perlu" means "to need". "Bawang merah" literally means "red onion" and refers to shallots, essential in Indonesian cooking.',
      wordTexts: ['perlu', 'bawang', 'merah'],
    },
    {
      id: 'f1000000-0020-4000-8000-000000000003',
      text_target: 'Potong kecil-kecil',
      text_en: 'Cut into small pieces',
      literal_translation: 'Cut small-small',
      usage_note:
        'Reduplication ("kecil-kecil") means "into small pieces". This is a common Indonesian pattern to indicate plurality or intensity.',
      wordTexts: ['potong'],
    },
    {
      id: 'f1000000-0020-4000-8000-000000000004',
      text_target: 'Campur dengan garam',
      text_en: 'Mix with salt',
      literal_translation: 'Mix with salt',
      usage_note:
        '"Campur" means to mix. "Dengan" connects the verb to what you mix with.',
      wordTexts: ['campur', 'dengan', 'garam'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0020-4000-8000-000000000001',
      pattern_template: 'Perlu ___',
      pattern_en: 'Need ___',
      explanation:
        '"Perlu" + noun means you need something. Works like "mau" but expresses necessity rather than desire.',
      prompt: 'Saya ___ telur.',
      hint_en: 'I need eggs.',
      correct_answer: 'perlu',
      distractors: ['mau', 'minta', 'suka'],
    },
    {
      id: '0a000000-0020-4000-8000-000000000002',
      pattern_template: 'Potong ___',
      pattern_en: 'Cut ___',
      explanation:
        '"Potong" + size or noun describes how to prepare food. In Indonesian the description follows the verb.',
      prompt: '___ bawang.',
      hint_en: 'Cut the onion.',
      correct_answer: 'Potong',
      distractors: ['Campur', 'Masak', 'Tambah'],
    },
    {
      id: '0a000000-0020-4000-8000-000000000003',
      pattern_template: 'Campur dengan ___',
      pattern_en: 'Mix with ___',
      explanation:
        '"Campur dengan" + noun means to mix with something. "Dengan" links the action to the ingredient.',
      prompt: 'Campur ___ garam.',
      hint_en: 'Mix with salt.',
      correct_answer: 'dengan',
      distractors: ['tanpa', 'dan', 'di'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000154', text: 'masak', meaning_en: 'to cook', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000155', text: 'beli', meaning_en: 'to buy', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000156', text: 'perlu', meaning_en: 'to need', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000157', text: 'telur', meaning_en: 'egg', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000158', text: 'bawang', meaning_en: 'onion / garlic', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000159', text: 'garam', meaning_en: 'salt', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000160', text: 'minyak', meaning_en: 'oil', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000161', text: 'sendiri', meaning_en: 'self / alone', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000162', text: 'potong', meaning_en: 'to cut', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000163', text: 'campur', meaning_en: 'to mix', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000164', text: 'merah', meaning_en: 'red', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000165', text: 'putih', meaning_en: 'white', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000166', text: 'hijau', meaning_en: 'green', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000167', text: 'kuning', meaning_en: 'yellow', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'saya', 'mau', 'berapa', 'ada', 'terima kasih', 'dengan', 'enak', 'suka', 'toko',
    'dan', 'juga', 'empat',
    // From scene 3.3:
    'gula', 'sedikit',
    // From scene 3.4:
    'nasi', 'goreng', 'ayam', 'sayur',
  ],
};

export const UNIT3_SCENES: DialogueSceneData[] = [scene3_3, scene3_4, scene3_5];
