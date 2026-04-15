// Unit 3: Food & Drink — Scenes 3.3a/b, 3.4a/b/c, 3.5a/b
// Extended dialogue scenes for Indonesian language learning.
// Split from original 3 scenes (14+16+14 words) into 7 scenes (7+7+6+5+5+7+7 words).

import type { DialogueSceneData } from '../../dialogue-data';

// ── Scene 3.3a: Pesan Kopi (Ordering Coffee) ────────────────────────

const scene3_3a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000018',
  title: 'Pesan Kopi (Ordering Coffee)',
  description: 'Ordering coffee drinks at a Balinese cafe',
  scene_context:
    'You stop at a cozy cafe in Ubud. You order a coffee and customize your drink. Practice polite ordering with "minta" and temperature words.',
  sort_order: 17,
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
      text_target: 'Baik. Mau gula sedikit?',
      text_en: 'Okay. Want a little sugar?',
    },
    {
      id: 'e1000000-0018-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Tidak, terima kasih. Kopi dengan susu saja.',
      text_en: 'No, thank you. Coffee with milk only.',
    },
    {
      id: 'e1000000-0018-4000-8000-000000000005',
      speaker: 'Barista',
      text_target: 'Mau kopi panas atau dingin?',
      text_en: 'Want hot or cold coffee?',
    },
    {
      id: 'e1000000-0018-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Panas, tolong. Terima kasih!',
      text_en: 'Hot, please. Thank you!',
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
      text_target: 'Kopi dingin',
      text_en: 'Iced coffee',
      literal_translation: 'Coffee cold',
      usage_note:
        'In Indonesian, adjectives follow the noun. "Kopi dingin" means cold/iced coffee.',
      wordTexts: ['kopi', 'dingin'],
    },
    {
      id: 'f1000000-0018-4000-8000-000000000003',
      text_target: 'Gula sedikit',
      text_en: 'A little sugar',
      literal_translation: 'Sugar a-little',
      usage_note:
        '"Sedikit" means "a little". Use it after a noun to indicate a small amount.',
      wordTexts: ['gula', 'sedikit'],
    },
    {
      id: 'f1000000-0018-4000-8000-000000000004',
      text_target: 'Dengan susu',
      text_en: 'With milk',
      literal_translation: 'With milk',
      usage_note:
        '"Dengan" means "with". Use it to customize your order by adding something.',
      wordTexts: ['susu'],
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
      distractors: ['dingin', 'sedikit', 'gula'],
    },
    {
      id: '0a000000-0018-4000-8000-000000000003',
      pattern_template: '___ susu',
      pattern_en: 'With milk',
      explanation:
        '"Dengan" means "with". Place it before the noun you want included in your order.',
      prompt: 'Kopi ___ susu.',
      hint_en: 'Coffee with milk.',
      correct_answer: 'dengan',
      distractors: ['tanpa', 'dan', 'di'],
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
  ],
  existingWordTexts: ['saya', 'mau', 'terima kasih', 'tolong', 'baik', 'dengan', 'tidak', 'pesan', 'apa'],
};

// ── Scene 3.3b: Kue di Kafe (Cafe Snacks) ──────────────────────────

const scene3_3b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000038',
  title: 'Kue di Kafe (Cafe Snacks)',
  description: 'Ordering snacks and describing food at a cafe',
  scene_context:
    'You are still at the cafe and decide to order some food. You try local snacks and describe what you like. Practice "sama", "tanpa", and "tambah" for customizing orders.',
  sort_order: 18,
  dialogues: [
    {
      id: 'e1000000-0038-4000-8000-000000000001',
      speaker: 'Barista',
      text_target: 'Mau coba kue pisang? Enak sekali!',
      text_en: 'Want to try banana cake? So delicious!',
    },
    {
      id: 'e1000000-0038-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Saya mau kue pisang sama roti, minta.',
      text_en: "I'd like banana cake and bread, please.",
    },
    {
      id: 'e1000000-0038-4000-8000-000000000003',
      speaker: 'Barista',
      text_target: 'Roti dengan kopi panas. Mau tambah gula?',
      text_en: 'Bread with hot coffee. Want to add sugar?',
    },
    {
      id: 'e1000000-0038-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Tanpa gula, terima kasih. Kue ini enak!',
      text_en: 'Without sugar, thank you. This cake is delicious!',
    },
    {
      id: 'e1000000-0038-4000-8000-000000000005',
      speaker: 'Barista',
      text_target: 'Mau lagi? Ada kue dingin juga.',
      text_en: 'Want more? There are cold cakes too.',
    },
    {
      id: 'e1000000-0038-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Saya suka sekali! Tambah satu lagi, minta.',
      text_en: 'I love it! Add one more, please.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0038-4000-8000-000000000001',
      text_target: 'Kue sama roti',
      text_en: 'Cake and bread',
      literal_translation: 'Cake same bread',
      usage_note:
        '"Sama" in casual Indonesian means "and" or "with", connecting two items. It is more informal than "dan".',
      wordTexts: ['kue', 'sama', 'roti'],
    },
    {
      id: 'f1000000-0038-4000-8000-000000000002',
      text_target: 'Tanpa gula',
      text_en: 'Without sugar',
      literal_translation: 'Without sugar',
      usage_note:
        '"Tanpa" means "without". Use it to say what you do not want in your order.',
      wordTexts: ['tanpa'],
    },
    {
      id: 'f1000000-0038-4000-8000-000000000003',
      text_target: 'Tambah satu lagi',
      text_en: 'Add one more',
      literal_translation: 'Add one again',
      usage_note:
        '"Tambah" means to add. "Lagi" means again or more. Together they are a common way to order more.',
      wordTexts: ['tambah', 'lagi'],
    },
    {
      id: 'f1000000-0038-4000-8000-000000000004',
      text_target: 'Kue pisang enak',
      text_en: 'Banana cake is delicious',
      literal_translation: 'Cake banana delicious',
      usage_note:
        'Indonesian noun phrases stack: item + type + description. "Kue pisang enak" = delicious banana cake.',
      wordTexts: ['kue', 'pisang'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0038-4000-8000-000000000001',
      pattern_template: 'Tanpa ___ / Dengan ___',
      pattern_en: 'Without ___ / With ___',
      explanation:
        '"Tanpa" means "without" and "dengan" means "with". Use them to customize your order.',
      prompt: '___ gula.',
      hint_en: 'Without sugar.',
      correct_answer: 'Tanpa',
      distractors: ['Dengan', 'Tambah', 'Sama'],
    },
    {
      id: '0a000000-0038-4000-8000-000000000002',
      pattern_template: '___ satu lagi',
      pattern_en: 'Add one more',
      explanation:
        '"Tambah" means to add. "Lagi" means again/more. Together they let you order extra items.',
      prompt: '___ satu lagi.',
      hint_en: 'Add one more.',
      correct_answer: 'Tambah',
      distractors: ['Minta', 'Mau', 'Sama'],
    },
    {
      id: '0a000000-0038-4000-8000-000000000003',
      pattern_template: '___ sama ___',
      pattern_en: '___ and ___',
      explanation:
        '"Sama" in casual speech means "and" or "with", used to link two items you want together.',
      prompt: 'Kue ___ roti.',
      hint_en: 'Cake and bread.',
      correct_answer: 'sama',
      distractors: ['dengan', 'dan', 'lagi'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000131', text: 'sama', meaning_en: 'same / and (informal)', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000132', text: 'roti', meaning_en: 'bread', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000133', text: 'pisang', meaning_en: 'banana', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000134', text: 'kue', meaning_en: 'cake / pastry', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000135', text: 'lagi', meaning_en: 'again / more', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000136', text: 'tanpa', meaning_en: 'without', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000137', text: 'tambah', meaning_en: 'to add / extra', part_of_speech: 'verb' },
  ],
  existingWordTexts: [
    'saya', 'mau', 'terima kasih', 'enak', 'suka', 'ada', 'sekali', 'coba',
    'kopi', 'panas', 'dingin', 'sedikit', 'minta', 'dengan',
  ],
};

// ── Scene 3.4a: Pesan Makanan (Ordering Food) ───────────────────────

const scene3_4a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000019',
  title: 'Pesan Makanan (Ordering Food)',
  description: 'Ordering main courses at a restaurant in Seminyak',
  scene_context:
    'You and your friend Adi sit down at a restaurant in Seminyak. You look at the menu and order main dishes. Practice food vocabulary and ordering with "pesan".',
  sort_order: 19,
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
      text_target: 'Saya mau nasi goreng ayam, minta.',
      text_en: "I'd like chicken fried rice, please.",
    },
    {
      id: 'e1000000-0019-4000-8000-000000000003',
      speaker: 'Pelayan',
      text_target: 'Mau tambah sambal? Ada ikan goreng juga.',
      text_en: 'Want extra chili sauce? There is also fried fish.',
    },
    {
      id: 'e1000000-0019-4000-8000-000000000004',
      speaker: 'Adi',
      text_target: 'Saya mau ikan goreng dengan sayur.',
      text_en: 'I want fried fish with vegetables.',
    },
    {
      id: 'e1000000-0019-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Tambah sambal, minta! Tidak terlalu pedas.',
      text_en: 'Extra chili sauce, please! Not too spicy.',
    },
    {
      id: 'e1000000-0019-4000-8000-000000000006',
      speaker: 'Pelayan',
      text_target: 'Baik. Mau pesan daging juga?',
      text_en: 'Okay. Want to order meat too?',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0019-4000-8000-000000000001',
      text_target: 'Nasi goreng ayam',
      text_en: 'Chicken fried rice',
      literal_translation: 'Rice fried chicken',
      usage_note:
        'Indonesia\'s most famous dish. "Nasi" = rice, "goreng" = fried, "ayam" = chicken. Nouns modify each other by stacking.',
      wordTexts: ['nasi', 'ayam'],
    },
    {
      id: 'f1000000-0019-4000-8000-000000000002',
      text_target: 'Ikan goreng dengan sayur',
      text_en: 'Fried fish with vegetables',
      literal_translation: 'Fish fried with vegetable',
      usage_note:
        '"Dengan" connects the main dish with a side. "Ikan goreng" = fried fish.',
      wordTexts: ['ikan', 'sayur'],
    },
    {
      id: 'f1000000-0019-4000-8000-000000000003',
      text_target: 'Tambah sambal',
      text_en: 'Extra chili sauce',
      literal_translation: 'Add chili-sauce',
      usage_note:
        '"Sambal" is chili sauce, essential in Indonesian food. "Tambah sambal" is a very common restaurant request.',
      wordTexts: ['sambal'],
    },
    {
      id: 'f1000000-0019-4000-8000-000000000004',
      text_target: 'Pesan daging',
      text_en: 'Order meat',
      literal_translation: 'Order meat',
      usage_note:
        '"Daging" is a general word for meat. Use "pesan" + food item to order at a restaurant.',
      wordTexts: ['daging'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0019-4000-8000-000000000001',
      pattern_template: 'Nasi ___ ___',
      pattern_en: '___ fried rice',
      explanation:
        '"Nasi goreng" is fried rice. Add a protein after to specify the type: ayam (chicken), ikan (fish), daging (meat).',
      prompt: 'Nasi goreng ___.',
      hint_en: 'Chicken fried rice.',
      correct_answer: 'ayam',
      distractors: ['ikan', 'sayur', 'sambal'],
    },
    {
      id: '0a000000-0019-4000-8000-000000000002',
      pattern_template: '___ goreng',
      pattern_en: 'Fried ___',
      explanation:
        '"Goreng" means fried. Place it after the food item: "nasi goreng" (fried rice), "ikan goreng" (fried fish).',
      prompt: '___ goreng.',
      hint_en: 'Fried fish.',
      correct_answer: 'Ikan',
      distractors: ['Nasi', 'Sayur', 'Sambal'],
    },
    {
      id: '0a000000-0019-4000-8000-000000000003',
      pattern_template: '___ dengan ___',
      pattern_en: '___ with ___',
      explanation:
        '"Dengan" connects a main dish with a side or addition. A versatile word for combining food items.',
      prompt: 'Ikan goreng ___ sayur.',
      hint_en: 'Fried fish with vegetables.',
      correct_answer: 'dengan',
      distractors: ['sama', 'dan', 'tambah'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000138', text: 'ayam', meaning_en: 'chicken', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000139', text: 'ikan', meaning_en: 'fish', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000140', text: 'sayur', meaning_en: 'vegetable', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000141', text: 'daging', meaning_en: 'meat', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000142', text: 'sambal', meaning_en: 'chili sauce', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000152', text: 'nasi', meaning_en: 'rice (cooked)', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'mau', 'saya', 'pedas', 'tidak', 'pesan', 'apa', 'dengan', 'goreng', 'tambah', 'minta', 'sore',
  ],
};

// ── Scene 3.4b: Rasa Makanan (Food Flavors) ─────────────────────────

const scene3_4b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000039',
  title: 'Rasa Makanan (Food Flavors)',
  description: 'Describing flavors and tastes at a restaurant',
  scene_context:
    'The food has arrived at your table. You and Adi taste the dishes and describe the flavors. Practice taste words like "asin", "asam", and intensity words like "sangat" and "terlalu".',
  sort_order: 20,
  dialogues: [
    {
      id: 'e1000000-0039-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Nasi goreng ini enak sekali!',
      text_en: 'This fried rice is so delicious!',
    },
    {
      id: 'e1000000-0039-4000-8000-000000000002',
      speaker: 'Adi',
      text_target: 'Ikan goreng saya sangat pedas! Terlalu pedas.',
      text_en: 'My fried fish is very spicy! Too spicy.',
    },
    {
      id: 'e1000000-0039-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Ayam ini sedikit asin, tapi enak.',
      text_en: 'This chicken is a little salty, but delicious.',
    },
    {
      id: 'e1000000-0039-4000-8000-000000000004',
      speaker: 'Adi',
      text_target: 'Saya tidak suka asam. Terlalu asam!',
      text_en: "I don't like sour. Too sour!",
    },
    {
      id: 'e1000000-0039-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Kopi ini pahit. Tapi saya suka!',
      text_en: 'This coffee is bitter. But I like it!',
    },
    {
      id: 'e1000000-0039-4000-8000-000000000006',
      speaker: 'Adi',
      text_target: 'Nasi goreng dingin tidak enak. Nasi panas sangat enak!',
      text_en: 'Cold fried rice is not good. Hot rice is very delicious!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0039-4000-8000-000000000001',
      text_target: 'Sangat pedas',
      text_en: 'Very spicy',
      literal_translation: 'Very spicy',
      usage_note:
        '"Sangat" is a formal way to say "very". It goes before the adjective, unlike "sekali" which goes after.',
      wordTexts: ['sangat'],
    },
    {
      id: 'f1000000-0039-4000-8000-000000000002',
      text_target: 'Terlalu asin',
      text_en: 'Too salty',
      literal_translation: 'Too salty',
      usage_note:
        '"Terlalu" means "too much" of something. Use it before an adjective to complain about excess.',
      wordTexts: ['terlalu', 'asin'],
    },
    {
      id: 'f1000000-0039-4000-8000-000000000003',
      text_target: 'Sedikit asam',
      text_en: 'A little sour',
      literal_translation: 'A-little sour',
      usage_note:
        '"Sedikit" + adjective softens the description. "Sedikit asam" is gentler than just "asam".',
      wordTexts: ['asam'],
    },
    {
      id: 'f1000000-0039-4000-8000-000000000004',
      text_target: 'Kopi pahit',
      text_en: 'Bitter coffee',
      literal_translation: 'Coffee bitter',
      usage_note:
        '"Pahit" means bitter. Indonesian coffee is often served black and strong, so "kopi pahit" is a common description.',
      wordTexts: ['pahit'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0039-4000-8000-000000000001',
      pattern_template: 'Sangat ___',
      pattern_en: 'Very ___',
      explanation:
        '"Sangat" goes before an adjective to mean "very". More formal than "sekali" which follows the adjective.',
      prompt: '___ enak!',
      hint_en: 'Very delicious!',
      correct_answer: 'Sangat',
      distractors: ['Terlalu', 'Sedikit', 'Tidak'],
    },
    {
      id: '0a000000-0039-4000-8000-000000000002',
      pattern_template: 'Terlalu ___',
      pattern_en: 'Too ___',
      explanation:
        '"Terlalu" + adjective means "too much" of that quality. Use it to describe something excessive.',
      prompt: '___ pedas!',
      hint_en: 'Too spicy!',
      correct_answer: 'Terlalu',
      distractors: ['Sangat', 'Sedikit', 'Tidak'],
    },
    {
      id: '0a000000-0039-4000-8000-000000000003',
      pattern_template: 'Sedikit ___',
      pattern_en: 'A little ___',
      explanation:
        '"Sedikit" before an adjective softens the description. It means "a little" or "slightly".',
      prompt: '___ asin.',
      hint_en: 'A little salty.',
      correct_answer: 'Sedikit',
      distractors: ['Sangat', 'Terlalu', 'Tidak'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000143', text: 'asin', meaning_en: 'salty', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000144', text: 'asam', meaning_en: 'sour', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000145', text: 'pahit', meaning_en: 'bitter', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000150', text: 'sangat', meaning_en: 'very', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000151', text: 'terlalu', meaning_en: 'too (much)', part_of_speech: 'adverb' },
  ],
  existingWordTexts: [
    'enak', 'sekali', 'pedas', 'sedikit', 'tidak', 'tapi', 'suka', 'saya',
    'ayam', 'ikan', 'nasi', 'goreng', 'panas', 'dingin',
  ],
};

// ── Scene 3.4c: Bayar di Restoran (Paying the Bill) ─────────────────

const scene3_4c: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000059',
  title: 'Bayar di Restoran (Paying the Bill)',
  description: 'Asking for the bill and paying at a restaurant',
  scene_context:
    'You and Adi have finished your meal. You call the waiter and ask for the bill. Practice "selesai", "bayar", "bon", and wrapping up a meal.',
  sort_order: 21,
  dialogues: [
    {
      id: 'e1000000-0059-4000-8000-000000000001',
      speaker: 'Adi',
      text_target: 'Sudah selesai? Nasi goreng ayam sangat enak!',
      text_en: 'Already finished? The chicken fried rice was very delicious!',
    },
    {
      id: 'e1000000-0059-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Sudah selesai. Minta bon, tolong.',
      text_en: 'Already finished. The bill, please.',
    },
    {
      id: 'e1000000-0059-4000-8000-000000000003',
      speaker: 'Pelayan',
      text_target: 'Ini bon. Mau bayar sekarang?',
      text_en: 'Here is the bill. Want to pay now?',
    },
    {
      id: 'e1000000-0059-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Berapa? Saya mau bayar.',
      text_en: 'How much? I want to pay.',
    },
    {
      id: 'e1000000-0059-4000-8000-000000000005',
      speaker: 'Pelayan',
      text_target: 'Ini. Bisa bayar dengan uang atau kartu.',
      text_en: 'Here. You can pay with cash or card.',
    },
    {
      id: 'e1000000-0059-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Terima kasih! Nasi goreng di sini sangat enak!',
      text_en: 'Thank you! The fried rice here is very delicious!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0059-4000-8000-000000000001',
      text_target: 'Minta bon',
      text_en: 'The bill, please',
      literal_translation: 'Request bill',
      usage_note:
        'A polite way to ask for the bill at a restaurant. "Minta" is softer than "mau".',
      wordTexts: ['bon'],
    },
    {
      id: 'f1000000-0059-4000-8000-000000000002',
      text_target: 'Sudah selesai',
      text_en: 'Already finished',
      literal_translation: 'Already finished',
      usage_note:
        '"Sudah" marks completion. "Sudah selesai" means you are done eating or done with a task.',
      wordTexts: ['selesai'],
    },
    {
      id: 'f1000000-0059-4000-8000-000000000003',
      text_target: 'Bisa bayar?',
      text_en: 'Can I pay?',
      literal_translation: 'Can pay?',
      usage_note:
        '"Bisa" + verb asks if you can do something. A polite way to request the check.',
      wordTexts: ['bayar'],
    },
    {
      id: 'f1000000-0059-4000-8000-000000000004',
      text_target: 'Bayar dengan uang',
      text_en: 'Pay with cash',
      literal_translation: 'Pay with money',
      usage_note:
        '"Uang" means money/cash. "Bayar dengan uang" specifies paying with cash rather than card.',
      wordTexts: ['bayar', 'uang'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0059-4000-8000-000000000001',
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
      id: '0a000000-0059-4000-8000-000000000002',
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
      id: '0a000000-0059-4000-8000-000000000003',
      pattern_template: 'Minta ___',
      pattern_en: 'The ___, please',
      explanation:
        '"Minta" + noun is a polite request. At a restaurant, "minta bon" is the standard way to ask for the bill.',
      prompt: '___ bon.',
      hint_en: 'The bill, please.',
      correct_answer: 'Minta',
      distractors: ['Mau', 'Bisa', 'Bayar'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000146', text: 'selesai', meaning_en: 'finished', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000147', text: 'bayar', meaning_en: 'to pay', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000148', text: 'uang', meaning_en: 'money', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000149', text: 'bon', meaning_en: 'bill / check', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000153', text: 'goreng', meaning_en: 'fried', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'bisa', 'mau', 'saya', 'sudah', 'terima kasih', 'minta', 'berapa', 'sangat', 'enak', 'nasi', 'ayam',
  ],
};

// ── Scene 3.5a: Beli Bahan (Buying Ingredients) ─────────────────────

const scene3_5a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000020',
  title: 'Beli Bahan (Buying Ingredients)',
  description: 'Shopping for cooking ingredients at a small shop',
  scene_context:
    'You decide to cook at your rental villa. You go to a small shop to buy ingredients. Practice "perlu", "beli", and ingredient vocabulary.',
  sort_order: 22,
  dialogues: [
    {
      id: 'e1000000-0020-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, saya mau beli telur dan bawang.',
      text_en: 'Excuse me, I want to buy eggs and onion.',
    },
    {
      id: 'e1000000-0020-4000-8000-000000000002',
      speaker: 'Penjual',
      text_target: 'Berapa telur? Ada bawang juga.',
      text_en: 'How many eggs? There is onion too.',
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
      text_target: 'Saya mau masak! Perlu beli bawang dan telur.',
      text_en: 'I want to cook! Need to buy onion and eggs.',
    },
    {
      id: 'e1000000-0020-4000-8000-000000000006',
      speaker: 'Penjual',
      text_target: 'Berapa? Ini minyak dan garam. Terima kasih!',
      text_en: 'How much? Here is oil and salt. Thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0020-4000-8000-000000000001',
      text_target: 'Mau beli telur',
      text_en: 'Want to buy eggs',
      literal_translation: 'Want buy egg',
      usage_note:
        '"Beli" means to buy. "Mau beli" is the most common way to say you want to purchase something.',
      wordTexts: ['beli', 'telur'],
    },
    {
      id: 'f1000000-0020-4000-8000-000000000002',
      text_target: 'Perlu minyak',
      text_en: 'Need oil',
      literal_translation: 'Need oil',
      usage_note:
        '"Perlu" means "to need". It expresses necessity, stronger than "mau" (want).',
      wordTexts: ['perlu', 'minyak'],
    },
    {
      id: 'f1000000-0020-4000-8000-000000000003',
      text_target: 'Bawang dan garam',
      text_en: 'Onion and salt',
      literal_translation: 'Onion and salt',
      usage_note:
        'Essential cooking ingredients. "Bawang" covers onion, shallot, and garlic depending on the modifier.',
      wordTexts: ['bawang', 'garam'],
    },
    {
      id: 'f1000000-0020-4000-8000-000000000004',
      text_target: 'Mau masak',
      text_en: 'Want to cook',
      literal_translation: 'Want cook',
      usage_note:
        '"Masak" means to cook. "Mau masak" expresses your intention to cook.',
      wordTexts: ['masak'],
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
      pattern_template: 'Mau ___ ___',
      pattern_en: 'Want to buy ___',
      explanation:
        '"Mau" + verb + noun chains together intention and action. "Mau beli" = want to buy.',
      prompt: 'Saya mau ___ telur.',
      hint_en: 'I want to buy eggs.',
      correct_answer: 'beli',
      distractors: ['masak', 'perlu', 'minta'],
    },
    {
      id: '0a000000-0020-4000-8000-000000000003',
      pattern_template: 'Mau ___ apa?',
      pattern_en: 'What do you want to ___?',
      explanation:
        '"Mau" + verb + "apa" asks what someone wants to do. "Mau masak apa?" = What do you want to cook?',
      prompt: 'Mau ___ apa?',
      hint_en: 'What do you want to cook?',
      correct_answer: 'masak',
      distractors: ['beli', 'pesan', 'makan'],
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
  ],
  existingWordTexts: ['saya', 'mau', 'berapa', 'ada', 'terima kasih', 'dan', 'juga', 'empat', 'toko', 'permisi'],
};

// ── Scene 3.5b: Masak di Rumah (Cooking at Home) ────────────────────

const scene3_5b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000040',
  title: 'Masak di Rumah (Cooking at Home)',
  description: 'Cooking at your villa with fresh ingredients',
  scene_context:
    'Back at your villa, you start cooking nasi goreng from scratch. Practice cooking verbs "potong" and "campur", the word "sendiri", and color words used for ingredients.',
  sort_order: 23,
  dialogues: [
    {
      id: 'e1000000-0040-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Saya mau masak nasi goreng sendiri!',
      text_en: 'I want to cook fried rice by myself!',
    },
    {
      id: 'e1000000-0040-4000-8000-000000000002',
      speaker: 'Adi',
      text_target: 'Potong bawang merah dulu. Campur dengan telur.',
      text_en: 'Cut the shallots first. Mix with egg.',
    },
    {
      id: 'e1000000-0040-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Saya campur nasi dengan minyak. Tambah bawang putih.',
      text_en: 'I mix the rice with oil. Add garlic.',
    },
    {
      id: 'e1000000-0040-4000-8000-000000000004',
      speaker: 'Adi',
      text_target: 'Sayur hijau dan kuning enak dengan ayam goreng.',
      text_en: 'Green and yellow vegetables are delicious with fried chicken.',
    },
    {
      id: 'e1000000-0040-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Saya potong ayam sendiri. Campur dengan garam sedikit.',
      text_en: 'I cut the chicken myself. Mix with a little salt.',
    },
    {
      id: 'e1000000-0040-4000-8000-000000000006',
      speaker: 'Adi',
      text_target: 'Enak! Saya suka masak sendiri. Nasi goreng merah!',
      text_en: 'Delicious! I like cooking by myself. Red fried rice!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0040-4000-8000-000000000001',
      text_target: 'Masak sendiri',
      text_en: 'Cook by yourself',
      literal_translation: 'Cook self',
      usage_note:
        '"Sendiri" means "by oneself" or "alone". After a verb, it emphasizes doing something yourself.',
      wordTexts: ['sendiri'],
    },
    {
      id: 'f1000000-0040-4000-8000-000000000002',
      text_target: 'Potong bawang merah',
      text_en: 'Cut the shallots',
      literal_translation: 'Cut onion red',
      usage_note:
        '"Bawang merah" literally means "red onion" and refers to shallots, essential in Indonesian cooking.',
      wordTexts: ['potong', 'merah'],
    },
    {
      id: 'f1000000-0040-4000-8000-000000000003',
      text_target: 'Campur dengan telur',
      text_en: 'Mix with egg',
      literal_translation: 'Mix with egg',
      usage_note:
        '"Campur" means to mix. "Dengan" connects the verb to what you mix with.',
      wordTexts: ['campur'],
    },
    {
      id: 'f1000000-0040-4000-8000-000000000004',
      text_target: 'Sayur hijau dan kuning',
      text_en: 'Green and yellow vegetables',
      literal_translation: 'Vegetable green and yellow',
      usage_note:
        'Color words follow the noun in Indonesian. "Hijau" = green, "kuning" = yellow. Colors describe ingredient types.',
      wordTexts: ['hijau', 'kuning'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0040-4000-8000-000000000001',
      pattern_template: '___ sendiri',
      pattern_en: '___ by yourself',
      explanation:
        '"Sendiri" after a verb means doing it by yourself. "Masak sendiri" = cook by yourself.',
      prompt: 'Masak ___.',
      hint_en: 'Cook by yourself.',
      correct_answer: 'sendiri',
      distractors: ['saya', 'lagi', 'juga'],
    },
    {
      id: '0a000000-0040-4000-8000-000000000002',
      pattern_template: 'Potong ___',
      pattern_en: 'Cut ___',
      explanation:
        '"Potong" + noun describes how to prepare food. In Indonesian the object follows the verb.',
      prompt: '___ bawang.',
      hint_en: 'Cut the onion.',
      correct_answer: 'Potong',
      distractors: ['Campur', 'Masak', 'Tambah'],
    },
    {
      id: '0a000000-0040-4000-8000-000000000003',
      pattern_template: 'Bawang ___ / Bawang ___',
      pattern_en: 'Shallots / Garlic',
      explanation:
        'Colors modify "bawang" to specify the type: "bawang merah" = shallots (red onion), "bawang putih" = garlic (white onion).',
      prompt: 'Bawang ___.',
      hint_en: 'Garlic (white onion).',
      correct_answer: 'putih',
      distractors: ['merah', 'hijau', 'kuning'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000161', text: 'sendiri', meaning_en: 'self / alone', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000162', text: 'potong', meaning_en: 'to cut', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000163', text: 'campur', meaning_en: 'to mix', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000164', text: 'merah', meaning_en: 'red', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000165', text: 'putih', meaning_en: 'white', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000166', text: 'hijau', meaning_en: 'green', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000167', text: 'kuning', meaning_en: 'yellow', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'saya', 'mau', 'dengan', 'enak', 'suka', 'nasi', 'goreng', 'ayam', 'sayur',
    'gula', 'sedikit', 'masak', 'telur', 'bawang', 'garam', 'minyak',
  ],
};

export const UNIT3_SCENES: DialogueSceneData[] = [scene3_3a, scene3_3b, scene3_4a, scene3_4b, scene3_4c, scene3_5a, scene3_5b];
