// Dialogue scene content for Indonesian language learning.
// Each scene follows the 6-phase model: dialogue → phrases → vocabulary → patterns → conversation → summary.

export interface DialogueLineData {
  id: string;
  speaker: string;
  text_target: string;
  text_en: string;
}

export interface PhraseData {
  id: string;
  text_target: string;
  text_en: string;
  literal_translation: string;
  usage_note: string;
  /** Word texts that this phrase contains (matched against existing words table) */
  wordTexts: string[];
}

export interface PatternExerciseData {
  id: string;
  pattern_template: string;
  pattern_en: string;
  explanation: string;
  prompt: string;
  hint_en: string;
  correct_answer: string;
  distractors: string[];
}

export interface NewWordData {
  id: string;
  text: string;
  meaning_en: string;
  part_of_speech: string;
}

export interface DialogueSceneData {
  id: string;
  title: string;
  description: string;
  scene_context: string;
  sort_order: number;
  dialogues: DialogueLineData[];
  phrases: PhraseData[];
  patterns: PatternExerciseData[];
  /** New words to insert (not already in the 22 existing words) */
  newWords: NewWordData[];
  /** Existing word texts to link via scene_words */
  existingWordTexts: string[];
}

// ── Scene 1: Selamat! (Hello!) ──────────────────────────────────────

const scene1: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000004',
  title: 'Selamat! (Hello!)',
  description: 'Meeting someone at a cafe — greetings and introductions',
  scene_context: 'You are at a small cafe in Bali. A friendly local sits at the next table and starts a conversation. Practice greetings, introducing yourself, and basic polite exchanges.',
  sort_order: 1,
  dialogues: [
    { id: 'e1000000-0004-4000-8000-000000000001', speaker: 'Adi', text_target: 'Selamat pagi! Apa kabar?', text_en: 'Good morning! How are you?' },
    { id: 'e1000000-0004-4000-8000-000000000002', speaker: 'You', text_target: 'Selamat pagi! Baik, terima kasih.', text_en: 'Good morning! Good, thank you.' },
    { id: 'e1000000-0004-4000-8000-000000000003', speaker: 'Adi', text_target: 'Nama saya Adi. Siapa nama Anda?', text_en: 'My name is Adi. What is your name?' },
    { id: 'e1000000-0004-4000-8000-000000000004', speaker: 'You', text_target: 'Nama saya ... Senang bertemu!', text_en: 'My name is ... Nice to meet you!' },
    { id: 'e1000000-0004-4000-8000-000000000005', speaker: 'Adi', text_target: 'Senang bertemu juga! Anda dari mana?', text_en: 'Nice to meet you too! Where are you from?' },
  ],
  phrases: [
    {
      id: 'f1000000-0004-4000-8000-000000000001',
      text_target: 'Apa kabar?',
      text_en: 'How are you?',
      literal_translation: 'What news?',
      usage_note: 'The standard greeting — used like "How are you?" in English.',
      wordTexts: ['apa'],
    },
    {
      id: 'f1000000-0004-4000-8000-000000000002',
      text_target: 'Nama saya ...',
      text_en: 'My name is ...',
      literal_translation: 'Name I/me ...',
      usage_note: 'The basic self-introduction pattern. Fill in your name after "saya".',
      wordTexts: ['nama', 'saya'],
    },
    {
      id: 'f1000000-0004-4000-8000-000000000003',
      text_target: 'Senang bertemu',
      text_en: 'Nice to meet you',
      literal_translation: 'Happy to meet',
      usage_note: 'Used when meeting someone for the first time. Add "juga" (also) to say "nice to meet you too".',
      wordTexts: ['senang', 'bertemu'],
    },
    {
      id: 'f1000000-0004-4000-8000-000000000004',
      text_target: 'Dari mana?',
      text_en: 'Where from?',
      literal_translation: 'From where?',
      usage_note: 'Short for "Anda dari mana?" — asking where someone is from.',
      wordTexts: ['dari'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0004-4000-8000-000000000001',
      pattern_template: 'Nama saya ___',
      pattern_en: 'My name is ___',
      explanation: 'Use "Nama saya" followed by your name to introduce yourself.',
      prompt: 'Nama ___ Adi.',
      hint_en: 'My name is Adi.',
      correct_answer: 'saya',
      distractors: ['apa', 'ini', 'itu'],
    },
    {
      id: '0a000000-0004-4000-8000-000000000002',
      pattern_template: '___ kabar?',
      pattern_en: 'How are you?',
      explanation: '"Apa" means "what" and is used to form questions.',
      prompt: '___ kabar?',
      hint_en: 'How are you? (What news?)',
      correct_answer: 'Apa',
      distractors: ['Ini', 'Itu', 'Di'],
    },
    {
      id: '0a000000-0004-4000-8000-000000000003',
      pattern_template: 'Baik, terima kasih',
      pattern_en: 'Good, thank you',
      explanation: '"Baik" means "good/fine" — the standard reply to "Apa kabar?"',
      prompt: '___, terima kasih.',
      hint_en: 'Good, thank you.',
      correct_answer: 'Baik',
      distractors: ['Apa', 'Nama', 'Mau'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000021', text: 'kabar', meaning_en: 'news / condition', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000022', text: 'senang', meaning_en: 'happy / glad', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000023', text: 'bertemu', meaning_en: 'to meet', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000024', text: 'dari', meaning_en: 'from', part_of_speech: 'preposition' },
  ],
  existingWordTexts: ['saya', 'apa', 'nama', 'baik', 'terima kasih', 'selamat pagi'],
};

// ── Scene 2: Siapa Itu? (Who's That?) ──────────────────────────────

const scene2: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000005',
  title: 'Siapa Itu? (Who\'s That?)',
  description: 'Introducing friends and talking about people',
  scene_context: 'You are at a gathering with your new friend Adi. He introduces you to his friend Sari. Practice introductions and talking about where people are from.',
  sort_order: 2,
  dialogues: [
    { id: 'e1000000-0005-4000-8000-000000000001', speaker: 'Adi', text_target: 'Ini teman saya, Sari.', text_en: 'This is my friend, Sari.' },
    { id: 'e1000000-0005-4000-8000-000000000002', speaker: 'Sari', text_target: 'Halo! Senang bertemu!', text_en: 'Hello! Nice to meet you!' },
    { id: 'e1000000-0005-4000-8000-000000000003', speaker: 'You', text_target: 'Senang bertemu juga! Saya dari Australia.', text_en: 'Nice to meet you too! I\'m from Australia.' },
    { id: 'e1000000-0005-4000-8000-000000000004', speaker: 'Sari', text_target: 'Dia dari Jakarta. Dan Anda?', text_en: 'He is from Jakarta. And you?' },
    { id: 'e1000000-0005-4000-8000-000000000005', speaker: 'Adi', text_target: 'Sari baik sekali!', text_en: 'Sari is very nice!' },
  ],
  phrases: [
    {
      id: 'f1000000-0005-4000-8000-000000000001',
      text_target: 'Ini teman saya',
      text_en: 'This is my friend',
      literal_translation: 'This friend I/me',
      usage_note: 'Use "ini" (this) + relationship + "saya" to introduce someone.',
      wordTexts: ['ini', 'saya'],
    },
    {
      id: 'f1000000-0005-4000-8000-000000000002',
      text_target: 'Dia dari ...',
      text_en: 'He/she is from ...',
      literal_translation: 'He/she from ...',
      usage_note: '"Dia" is gender-neutral — it means both "he" and "she".',
      wordTexts: ['dia', 'dari'],
    },
    {
      id: 'f1000000-0005-4000-8000-000000000003',
      text_target: 'Senang bertemu juga',
      text_en: 'Nice to meet you too',
      literal_translation: 'Happy meet also',
      usage_note: 'Add "juga" (also/too) to respond to "Senang bertemu".',
      wordTexts: ['senang', 'bertemu', 'juga'],
    },
    {
      id: 'f1000000-0005-4000-8000-000000000004',
      text_target: 'Baik sekali',
      text_en: 'Very good / very nice',
      literal_translation: 'Good very',
      usage_note: '"Sekali" after an adjective means "very". Word order is opposite to English.',
      wordTexts: ['baik'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0005-4000-8000-000000000001',
      pattern_template: 'Ini ___ saya',
      pattern_en: 'This is my ___',
      explanation: 'Use "Ini" + noun + "saya" to introduce someone or something that belongs to you.',
      prompt: 'Ini ___ saya, Adi.',
      hint_en: 'This is my friend, Adi.',
      correct_answer: 'teman',
      distractors: ['nama', 'dari', 'dia'],
    },
    {
      id: '0a000000-0005-4000-8000-000000000002',
      pattern_template: 'Dia dari ___',
      pattern_en: 'He/she is from ___',
      explanation: '"Dia" (he/she) + "dari" (from) + place name.',
      prompt: '___ dari Jakarta.',
      hint_en: 'He/she is from Jakarta.',
      correct_answer: 'Dia',
      distractors: ['Saya', 'Ini', 'Apa'],
    },
    {
      id: '0a000000-0005-4000-8000-000000000003',
      pattern_template: '___ sekali',
      pattern_en: 'Very ___',
      explanation: 'Put "sekali" after an adjective to mean "very".',
      prompt: 'Baik ___!',
      hint_en: 'Very good!',
      correct_answer: 'sekali',
      distractors: ['saya', 'juga', 'dan'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000025', text: 'teman', meaning_en: 'friend', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000026', text: 'dia', meaning_en: 'he / she', part_of_speech: 'pronoun' },
    { id: 'b1000000-0001-4000-8000-000000000027', text: 'juga', meaning_en: 'also / too', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000028', text: 'sekali', meaning_en: 'very / once', part_of_speech: 'adverb' },
  ],
  existingWordTexts: ['ini', 'saya', 'dan', 'baik', 'dari', 'senang', 'bertemu'],
};

// ── Scene 3: Saya Mau... (I Want...) ───────────────────────────────

const scene3: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000006',
  title: 'Saya Mau... (I Want...)',
  description: 'Ordering food and drinks at a warung',
  scene_context: 'You are at a small warung (food stall) with Adi. The server asks what you want to order. Practice ordering food and drinks.',
  sort_order: 3,
  dialogues: [
    { id: 'e1000000-0006-4000-8000-000000000001', speaker: 'Server', text_target: 'Selamat pagi! Mau pesan apa?', text_en: 'Good morning! What would you like to order?' },
    { id: 'e1000000-0006-4000-8000-000000000002', speaker: 'Adi', text_target: 'Saya mau nasi goreng dan es teh.', text_en: 'I want fried rice and iced tea.' },
    { id: 'e1000000-0006-4000-8000-000000000003', speaker: 'You', text_target: 'Saya mau mie goreng. Tidak pedas.', text_en: 'I want fried noodles. Not spicy.' },
    { id: 'e1000000-0006-4000-8000-000000000004', speaker: 'Server', text_target: 'Baik! Mau minum apa?', text_en: 'Okay! What do you want to drink?' },
    { id: 'e1000000-0006-4000-8000-000000000005', speaker: 'You', text_target: 'Saya mau air putih, terima kasih.', text_en: 'I want plain water, thank you.' },
  ],
  phrases: [
    {
      id: 'f1000000-0006-4000-8000-000000000001',
      text_target: 'Mau pesan apa?',
      text_en: 'What would you like to order?',
      literal_translation: 'Want order what?',
      usage_note: 'What servers say when taking your order at a warung or restaurant.',
      wordTexts: ['mau', 'apa'],
    },
    {
      id: 'f1000000-0006-4000-8000-000000000002',
      text_target: 'Saya mau ...',
      text_en: 'I want ...',
      literal_translation: 'I want ...',
      usage_note: 'The essential ordering phrase. Follow with what you want.',
      wordTexts: ['saya', 'mau'],
    },
    {
      id: 'f1000000-0006-4000-8000-000000000003',
      text_target: 'Tidak pedas',
      text_en: 'Not spicy',
      literal_translation: 'Not spicy',
      usage_note: 'Say this when ordering to request no spice. Very useful in Indonesia!',
      wordTexts: ['tidak', 'pedas'],
    },
    {
      id: 'f1000000-0006-4000-8000-000000000004',
      text_target: 'Mau minum apa?',
      text_en: 'What do you want to drink?',
      literal_translation: 'Want drink what?',
      usage_note: 'Common follow-up question when ordering food.',
      wordTexts: ['mau', 'minum', 'apa'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0006-4000-8000-000000000001',
      pattern_template: 'Saya mau ___',
      pattern_en: 'I want ___',
      explanation: '"Saya mau" + item is the basic way to say what you want.',
      prompt: 'Saya ___ nasi goreng.',
      hint_en: 'I want fried rice.',
      correct_answer: 'mau',
      distractors: ['nama', 'dari', 'di'],
    },
    {
      id: '0a000000-0006-4000-8000-000000000002',
      pattern_template: 'Mau ___ apa?',
      pattern_en: 'What do you want to ___?',
      explanation: 'Mau + verb + apa? asks "what do you want to [verb]?"',
      prompt: 'Mau ___ apa?',
      hint_en: 'What do you want to drink?',
      correct_answer: 'minum',
      distractors: ['makan', 'nama', 'baik'],
    },
    {
      id: '0a000000-0006-4000-8000-000000000003',
      pattern_template: 'Tidak ___',
      pattern_en: 'Not ___',
      explanation: '"Tidak" negates adjectives and verbs. Put it before the word.',
      prompt: '___ pedas.',
      hint_en: 'Not spicy.',
      correct_answer: 'Tidak',
      distractors: ['Saya', 'Mau', 'Dan'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000029', text: 'nasi goreng', meaning_en: 'fried rice', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000030', text: 'air putih', meaning_en: 'plain water', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000031', text: 'pesan', meaning_en: 'to order', part_of_speech: 'verb' },
  ],
  existingWordTexts: ['saya', 'mau', 'apa', 'tidak', 'pedas', 'makan', 'minum', 'dan', 'baik', 'terima kasih'],
};

// ── Scene 4: Berapa Harganya? (How Much?) ──────────────────────────

const scene4: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000007',
  title: 'Berapa Harganya? (How Much?)',
  description: 'Shopping at a market — asking prices and bargaining',
  scene_context: 'You are at a traditional market in Ubud. You see some souvenirs and want to buy something. Practice asking prices and basic bargaining.',
  sort_order: 4,
  dialogues: [
    { id: 'e1000000-0007-4000-8000-000000000001', speaker: 'You', text_target: 'Permisi, berapa harganya?', text_en: 'Excuse me, how much is it?' },
    { id: 'e1000000-0007-4000-8000-000000000002', speaker: 'Seller', text_target: 'Itu seratus ribu rupiah.', text_en: 'That is one hundred thousand rupiah.' },
    { id: 'e1000000-0007-4000-8000-000000000003', speaker: 'You', text_target: 'Terlalu mahal! Bisa kurang?', text_en: 'Too expensive! Can you lower it?' },
    { id: 'e1000000-0007-4000-8000-000000000004', speaker: 'Seller', text_target: 'Baik, tujuh puluh ribu. Ini bagus sekali!', text_en: 'Okay, seventy thousand. This is very good!' },
    { id: 'e1000000-0007-4000-8000-000000000005', speaker: 'You', text_target: 'Baik, saya mau ini. Terima kasih!', text_en: 'Okay, I want this one. Thank you!' },
  ],
  phrases: [
    {
      id: 'f1000000-0007-4000-8000-000000000001',
      text_target: 'Berapa harganya?',
      text_en: 'How much is it?',
      literal_translation: 'How much price-its?',
      usage_note: 'The essential market phrase. "-nya" makes it "the price (of it)".',
      wordTexts: ['berapa'],
    },
    {
      id: 'f1000000-0007-4000-8000-000000000002',
      text_target: 'Terlalu mahal',
      text_en: 'Too expensive',
      literal_translation: 'Too expensive',
      usage_note: 'Use this to start bargaining. "Terlalu" means "too much".',
      wordTexts: ['mahal'],
    },
    {
      id: 'f1000000-0007-4000-8000-000000000003',
      text_target: 'Bisa kurang?',
      text_en: 'Can you lower it?',
      literal_translation: 'Can less?',
      usage_note: 'A polite way to ask for a discount. "Bisa" = can, "kurang" = less.',
      wordTexts: ['bisa'],
    },
    {
      id: 'f1000000-0007-4000-8000-000000000004',
      text_target: 'Saya mau ini',
      text_en: 'I want this one',
      literal_translation: 'I want this',
      usage_note: 'Point at what you want and say this to buy it.',
      wordTexts: ['saya', 'mau', 'ini'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0007-4000-8000-000000000001',
      pattern_template: 'Berapa ___?',
      pattern_en: 'How much ___?',
      explanation: '"Berapa" asks "how much/many". Add "-nya" to a noun to mean "the [noun]".',
      prompt: '___ harganya?',
      hint_en: 'How much is the price?',
      correct_answer: 'Berapa',
      distractors: ['Apa', 'Di mana', 'Siapa'],
    },
    {
      id: '0a000000-0007-4000-8000-000000000002',
      pattern_template: 'Terlalu ___',
      pattern_en: 'Too ___',
      explanation: '"Terlalu" before an adjective means "too [adjective]".',
      prompt: 'Terlalu ___!',
      hint_en: 'Too expensive!',
      correct_answer: 'mahal',
      distractors: ['baik', 'besar', 'pedas'],
    },
    {
      id: '0a000000-0007-4000-8000-000000000003',
      pattern_template: 'Saya mau ___',
      pattern_en: 'I want ___',
      explanation: 'Point and say "Saya mau" + demonstrative to choose something.',
      prompt: 'Saya mau ___.',
      hint_en: 'I want this one.',
      correct_answer: 'ini',
      distractors: ['apa', 'dari', 'di'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000032', text: 'mahal', meaning_en: 'expensive', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000033', text: 'harga', meaning_en: 'price', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000034', text: 'bisa', meaning_en: 'can / able', part_of_speech: 'verb' },
  ],
  existingWordTexts: ['berapa', 'itu', 'ini', 'saya', 'mau', 'baik', 'terima kasih', 'besar'],
};

// ── Scene 5: Enak Sekali! (So Delicious!) ──────────────────────────

const scene5: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000008',
  title: 'Enak Sekali! (So Delicious!)',
  description: 'Talking about food preferences and flavors',
  scene_context: 'You are eating at the warung with Adi. The food arrives and you talk about what you like. Practice expressing food preferences and complimenting food.',
  sort_order: 5,
  dialogues: [
    { id: 'e1000000-0008-4000-8000-000000000001', speaker: 'Adi', text_target: 'Ini nasi goreng saya. Enak sekali!', text_en: 'This is my fried rice. So delicious!' },
    { id: 'e1000000-0008-4000-8000-000000000002', speaker: 'You', text_target: 'Saya suka mie goreng ini!', text_en: 'I like this fried noodle!' },
    { id: 'e1000000-0008-4000-8000-000000000003', speaker: 'Adi', text_target: 'Anda suka pedas?', text_en: 'Do you like spicy?' },
    { id: 'e1000000-0008-4000-8000-000000000004', speaker: 'You', text_target: 'Tidak, saya tidak suka pedas.', text_en: 'No, I don\'t like spicy.' },
    { id: 'e1000000-0008-4000-8000-000000000005', speaker: 'Adi', text_target: 'Saya suka pedas sekali! Mau coba?', text_en: 'I like it very spicy! Want to try?' },
  ],
  phrases: [
    {
      id: 'f1000000-0008-4000-8000-000000000001',
      text_target: 'Enak sekali!',
      text_en: 'So delicious!',
      literal_translation: 'Delicious very!',
      usage_note: 'A big compliment for food. "Enak" = delicious, "sekali" = very.',
      wordTexts: ['enak', 'sekali'],
    },
    {
      id: 'f1000000-0008-4000-8000-000000000002',
      text_target: 'Saya suka ...',
      text_en: 'I like ...',
      literal_translation: 'I like ...',
      usage_note: 'Express your preferences. Follow with a noun or verb.',
      wordTexts: ['saya'],
    },
    {
      id: 'f1000000-0008-4000-8000-000000000003',
      text_target: 'Saya tidak suka ...',
      text_en: 'I don\'t like ...',
      literal_translation: 'I not like ...',
      usage_note: 'Negate with "tidak" to say you don\'t like something.',
      wordTexts: ['saya', 'tidak'],
    },
    {
      id: 'f1000000-0008-4000-8000-000000000004',
      text_target: 'Mau coba?',
      text_en: 'Want to try?',
      literal_translation: 'Want try?',
      usage_note: 'Offering someone a taste of your food.',
      wordTexts: ['mau'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0008-4000-8000-000000000001',
      pattern_template: '___ sekali!',
      pattern_en: 'So ___!',
      explanation: 'Adjective + "sekali" = "so [adjective]!" or "very [adjective]!"',
      prompt: '___ sekali!',
      hint_en: 'So delicious!',
      correct_answer: 'Enak',
      distractors: ['Baik', 'Besar', 'Mahal'],
    },
    {
      id: '0a000000-0008-4000-8000-000000000002',
      pattern_template: 'Saya suka ___',
      pattern_en: 'I like ___',
      explanation: '"Suka" means "like". Put it after "saya" and before what you like.',
      prompt: 'Saya ___ nasi goreng.',
      hint_en: 'I like fried rice.',
      correct_answer: 'suka',
      distractors: ['mau', 'makan', 'dari'],
    },
    {
      id: '0a000000-0008-4000-8000-000000000003',
      pattern_template: 'Saya tidak suka ___',
      pattern_en: 'I don\'t like ___',
      explanation: '"Tidak" before "suka" negates it: "I don\'t like".',
      prompt: 'Saya ___ suka pedas.',
      hint_en: 'I don\'t like spicy.',
      correct_answer: 'tidak',
      distractors: ['mau', 'ini', 'itu'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000035', text: 'enak', meaning_en: 'delicious', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000036', text: 'suka', meaning_en: 'to like', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000037', text: 'coba', meaning_en: 'to try', part_of_speech: 'verb' },
  ],
  existingWordTexts: ['saya', 'ini', 'tidak', 'pedas', 'mau', 'sekali'],
};

// ── Scene 6: Di Mana...? (Where Is...?) ──────────────────────────

const scene6: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000009',
  title: 'Di Mana...? (Where Is...?)',
  description: 'Asking for and understanding directions',
  scene_context: 'You are walking around Ubud and need to find a pharmacy. You stop a friendly local to ask for directions. Practice asking where things are and understanding basic directions.',
  sort_order: 6,
  dialogues: [
    { id: 'e1000000-0009-4000-8000-000000000001', speaker: 'You', text_target: 'Permisi, di mana apotek?', text_en: 'Excuse me, where is the pharmacy?' },
    { id: 'e1000000-0009-4000-8000-000000000002', speaker: 'Local', text_target: 'Apotek? Jalan lurus, lalu belok kiri.', text_en: 'The pharmacy? Go straight, then turn left.' },
    { id: 'e1000000-0009-4000-8000-000000000003', speaker: 'You', text_target: 'Belok kiri? Itu dekat?', text_en: 'Turn left? Is it nearby?' },
    { id: 'e1000000-0009-4000-8000-000000000004', speaker: 'Local', text_target: 'Ya, dekat sekali! Di kanan ada pasar.', text_en: 'Yes, very close! On the right there is a market.' },
    { id: 'e1000000-0009-4000-8000-000000000005', speaker: 'You', text_target: 'Baik, terima kasih banyak!', text_en: 'Okay, thank you very much!' },
  ],
  phrases: [
    {
      id: 'f1000000-0009-4000-8000-000000000001',
      text_target: 'Di mana ...?',
      text_en: 'Where is ...?',
      literal_translation: 'At where ...?',
      usage_note: 'The essential direction phrase. "Di mana" + place to ask where something is.',
      wordTexts: ['di mana'],
    },
    {
      id: 'f1000000-0009-4000-8000-000000000002',
      text_target: 'Jalan lurus',
      text_en: 'Go straight',
      literal_translation: 'Walk straight',
      usage_note: '"Jalan" means to walk/go. "Lurus" means straight ahead.',
      wordTexts: ['lurus'],
    },
    {
      id: 'f1000000-0009-4000-8000-000000000003',
      text_target: 'Belok kiri / belok kanan',
      text_en: 'Turn left / turn right',
      literal_translation: 'Turn left / turn right',
      usage_note: '"Belok" means to turn. Pair with "kiri" (left) or "kanan" (right).',
      wordTexts: ['kiri', 'kanan'],
    },
    {
      id: 'f1000000-0009-4000-8000-000000000004',
      text_target: 'Dekat sekali',
      text_en: 'Very close / nearby',
      literal_translation: 'Close very',
      usage_note: 'Use "dekat" for close/nearby. Add "sekali" for emphasis.',
      wordTexts: ['dekat', 'sekali'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0009-4000-8000-000000000001',
      pattern_template: 'Di mana ___?',
      pattern_en: 'Where is ___?',
      explanation: '"Di mana" asks "where". Follow it with the place you are looking for.',
      prompt: 'Di ___ apotek?',
      hint_en: 'Where is the pharmacy?',
      correct_answer: 'mana',
      distractors: ['ini', 'itu', 'apa'],
    },
    {
      id: '0a000000-0009-4000-8000-000000000002',
      pattern_template: 'Belok ___',
      pattern_en: 'Turn ___',
      explanation: '"Belok" means to turn. Follow with a direction: "kiri" (left) or "kanan" (right).',
      prompt: 'Belok ___.',
      hint_en: 'Turn left.',
      correct_answer: 'kiri',
      distractors: ['lurus', 'dekat', 'di'],
    },
    {
      id: '0a000000-0009-4000-8000-000000000003',
      pattern_template: 'Di ___ ada ___',
      pattern_en: 'On the ___ there is ___',
      explanation: '"Di" + direction + "ada" = there is something in that direction.',
      prompt: 'Di ___ ada pasar.',
      hint_en: 'On the right there is a market.',
      correct_answer: 'kanan',
      distractors: ['mana', 'ini', 'itu'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000038', text: 'belok', meaning_en: 'to turn', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000039', text: 'dekat', meaning_en: 'close / nearby', part_of_speech: 'adjective' },
  ],
  existingWordTexts: ['di', 'kiri', 'kanan', 'lurus', 'di mana', 'baik', 'terima kasih', 'sekali'],
};

export const DIALOGUE_SCENES: DialogueSceneData[] = [scene1, scene2, scene3, scene4, scene5, scene6];
