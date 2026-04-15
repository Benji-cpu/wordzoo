// Unit 4: Shopping & Money — Scenes 4.2a/b, 4.3a/b, 4.4a/b, 4.5a/b
// Extended dialogue scenes for Indonesian language learning.
// Each original scene (12-14 words) has been split into two scenes of 6-7 words.

import type { DialogueSceneData } from '../../dialogue-data';

// ── Scene 4.2a: Buah di Pasar (Fruit Shopping) ─────────────────────

const scene4_2a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000021',
  title: 'Buah di Pasar (Fruit Shopping)',
  description: 'Buying fruit at the market with quantities and prices',
  scene_context:
    "You're at the morning market in Ubud to buy fruit. You ask about prices per kilo and per piece, and learn to talk about quantities.",
  sort_order: 25,
  dialogues: [
    {
      id: 'e1000000-0021-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, jeruk ini berapa harganya?',
      text_en: 'Excuse me, how much are these oranges?',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000002',
      speaker: 'Penjual',
      text_target: 'Dua puluh ribu satu kilo. Murah!',
      text_en: 'Twenty thousand per kilo. Cheap!',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Mangga berapa satu buah?',
      text_en: 'How much is one mango?',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000004',
      speaker: 'Penjual',
      text_target: 'Lima ribu satu buah. Mau berapa?',
      text_en: 'Five thousand each. How many do you want?',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Tiga buah mangga. Bisa kurang sedikit?',
      text_en: 'Three mangoes. Can you lower it a little?',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000006',
      speaker: 'Penjual',
      text_target: 'Baik, dua belas ribu saja. Tiga ratus kurang.',
      text_en: 'Okay, just twelve thousand. Three hundred less.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0021-4000-8000-000000000001',
      text_target: 'Berapa satu buah?',
      text_en: 'How much per piece?',
      literal_translation: 'How-much one fruit/piece?',
      usage_note:
        '"Buah" as a classifier means "piece" or "item". "Satu buah" = one piece. Used for round objects and general items.',
      wordTexts: ['berapa', 'buah'],
    },
    {
      id: 'f1000000-0021-4000-8000-000000000002',
      text_target: 'Lima ribu satu',
      text_en: 'Five thousand each',
      literal_translation: 'Five thousand one',
      usage_note:
        'Sellers state the price per item this way. "Satu" at the end means "per piece".',
      wordTexts: ['ribu'],
    },
    {
      id: 'f1000000-0021-4000-8000-000000000003',
      text_target: 'Bisa kurang?',
      text_en: 'Can you lower it?',
      literal_translation: 'Can less?',
      usage_note:
        'A polite way to ask for a discount. "Kurang" means less or not enough. Sellers expect this at traditional markets.',
      wordTexts: ['kurang'],
    },
    {
      id: 'f1000000-0021-4000-8000-000000000004',
      text_target: 'Murah sekali!',
      text_en: 'Very cheap!',
      literal_translation: 'Cheap very!',
      usage_note:
        '"Murah" means cheap or affordable. Opposite of "mahal". Useful for bargaining at the market.',
      wordTexts: ['murah'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0021-4000-8000-000000000001',
      pattern_template: 'number + ribu',
      pattern_en: 'number + thousand',
      explanation:
        'Indonesian numbers use "ribu" for thousands. "Lima ribu" = 5,000, "dua puluh ribu" = 20,000.',
      prompt: 'Dua puluh ___ rupiah.',
      hint_en: 'Twenty thousand rupiah.',
      correct_answer: 'ribu',
      distractors: ['ratus', 'buah', 'jeruk'],
    },
    {
      id: '0a000000-0021-4000-8000-000000000002',
      pattern_template: 'number + ratus',
      pattern_en: 'number + hundred',
      explanation:
        '"Ratus" means hundred. "Tiga ratus" = 300, "lima ratus" = 500. Combine with "ribu" for larger numbers.',
      prompt: 'Tiga ___ rupiah.',
      hint_en: 'Three hundred rupiah.',
      correct_answer: 'ratus',
      distractors: ['ribu', 'buah', 'kurang'],
    },
    {
      id: '0a000000-0021-4000-8000-000000000003',
      pattern_template: 'number + buah + noun',
      pattern_en: 'number + (classifier) + noun',
      explanation:
        '"Buah" is a classifier for objects. "Tiga buah mangga" = three mangoes. Indonesian uses classifiers between numbers and nouns.',
      prompt: 'Tiga ___ mangga.',
      hint_en: 'Three mangoes.',
      correct_answer: 'buah',
      distractors: ['ribu', 'ratus', 'kilo'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000168', text: 'murah', meaning_en: 'cheap', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000169', text: 'kurang', meaning_en: 'less / not enough', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000170', text: 'ribu', meaning_en: 'thousand', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000171', text: 'ratus', meaning_en: 'hundred', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000172', text: 'buah', meaning_en: 'fruit / classifier', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000173', text: 'jeruk', meaning_en: 'orange (fruit)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000174', text: 'mangga', meaning_en: 'mango', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'berapa', 'harga', 'mahal', 'bisa', 'mau', 'satu', 'dua', 'tiga',
    'lima', 'saya', 'ini', 'baik', 'terima kasih',
  ],
};

// ── Scene 4.2b: Tawar-Menawar (Bargaining) ─────────────────────────

const scene4_2b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000041',
  title: 'Tawar-Menawar (Bargaining)',
  description: 'Bargaining at the market with classifiers and quantities',
  scene_context:
    "You continue shopping at the market. Now you bargain for apples, ask about freshness, and learn how items are packaged and counted.",
  sort_order: 26,
  dialogues: [
    {
      id: 'e1000000-0041-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Apel yang segar ada? Berapa satu kilo?',
      text_en: 'Do you have fresh apples? How much per kilo?',
    },
    {
      id: 'e1000000-0041-4000-8000-000000000002',
      speaker: 'Penjual',
      text_target: 'Ada! Empat puluh ribu satu kilo. Matang semua.',
      text_en: 'Yes! Forty thousand per kilo. All ripe.',
    },
    {
      id: 'e1000000-0041-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Mahal! Bisa tiga puluh lima ribu?',
      text_en: 'Expensive! Can you do thirty-five thousand?',
    },
    {
      id: 'e1000000-0041-4000-8000-000000000004',
      speaker: 'Penjual',
      text_target: 'Baik, tiga puluh lima ribu. Bungkus ya?',
      text_en: 'Okay, thirty-five thousand. Wrap it up?',
    },
    {
      id: 'e1000000-0041-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Ya, satu kantong saja. Itu ikan, berapa satu ekor?',
      text_en: 'Yes, just one bag. That fish, how much per piece?',
    },
    {
      id: 'e1000000-0041-4000-8000-000000000006',
      speaker: 'Penjual',
      text_target: 'Lima belas ribu satu ekor. Segar dari pagi!',
      text_en: 'Fifteen thousand each. Fresh from the morning!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0041-4000-8000-000000000001',
      text_target: 'Bungkus ya',
      text_en: 'Wrap it up / bag it please',
      literal_translation: 'Wrap yes',
      usage_note:
        'Ask the seller to bag your items. "Ya" at the end softens the request.',
      wordTexts: ['bungkus'],
    },
    {
      id: 'f1000000-0041-4000-8000-000000000002',
      text_target: 'Satu kantong saja',
      text_en: 'Just one bag',
      literal_translation: 'One bag only',
      usage_note:
        '"Kantong" is a plastic bag. "Saja" means "just" or "only". Useful when you want minimal packaging.',
      wordTexts: ['kantong'],
    },
    {
      id: 'f1000000-0041-4000-8000-000000000003',
      text_target: 'Apel yang matang',
      text_en: 'Ripe apples',
      literal_translation: 'Apple which ripe',
      usage_note:
        '"Yang" links a noun with a describing word. "Matang" means ripe, ready to eat.',
      wordTexts: ['apel', 'matang'],
    },
    {
      id: 'f1000000-0041-4000-8000-000000000004',
      text_target: 'Segar dari pagi',
      text_en: 'Fresh from the morning',
      literal_translation: 'Fresh from morning',
      usage_note:
        'Sellers use this to emphasize freshness. "Segar" = fresh, opposite of stale.',
      wordTexts: ['segar'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0041-4000-8000-000000000001',
      pattern_template: 'number + ekor + animal',
      pattern_en: 'number + (animal classifier) + animal',
      explanation:
        '"Ekor" literally means "tail" but is the classifier for animals. "Satu ekor ikan" = one fish.',
      prompt: 'Satu ___ ikan.',
      hint_en: 'One fish.',
      correct_answer: 'ekor',
      distractors: ['buah', 'kilo', 'kantong'],
    },
    {
      id: '0a000000-0041-4000-8000-000000000002',
      pattern_template: 'noun + yang + segar/matang',
      pattern_en: 'noun + that is + fresh/ripe',
      explanation:
        '"Yang" before an adjective specifies which item. "Apel yang segar" = the fresh apples.',
      prompt: 'Apel ___ segar.',
      hint_en: 'Fresh apples.',
      correct_answer: 'yang',
      distractors: ['ini', 'itu', 'dan'],
    },
    {
      id: '0a000000-0041-4000-8000-000000000003',
      pattern_template: 'Satu kilo ___',
      pattern_en: 'One kilo of ___',
      explanation:
        'Put the quantity and unit before the noun. "Satu kilo apel" = one kilo of apples.',
      prompt: 'Satu ___ apel.',
      hint_en: 'One kilo of apples.',
      correct_answer: 'kilo',
      distractors: ['buah', 'ribu', 'ekor'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000175', text: 'apel', meaning_en: 'apple', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000176', text: 'kilo', meaning_en: 'kilogram', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000177', text: 'segar', meaning_en: 'fresh', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000178', text: 'matang', meaning_en: 'ripe', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000179', text: 'bungkus', meaning_en: 'to wrap / package', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000180', text: 'kantong', meaning_en: 'bag / plastic bag', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000181', text: 'ekor', meaning_en: 'tail / classifier (animals)', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'berapa', 'mahal', 'murah', 'bisa', 'mau', 'satu', 'saya', 'baik',
    'terima kasih', 'ada', 'itu', 'ribu', 'buah', 'jeruk', 'mangga',
    'empat', 'lima', 'puluh', 'ya',
  ],
};

// ── Scene 4.3a: Coba Baju (Trying Clothes) ─────────────────────────

const scene4_3a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000022',
  title: 'Coba Baju (Trying Clothes)',
  description: 'Shopping for clothes, asking about sizes and colors',
  scene_context:
    "You're shopping for clothes at a market in Bali. You ask about sizes, colors, and browse shirts and pants.",
  sort_order: 27,
  dialogues: [
    {
      id: 'e1000000-0022-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, ada baju warna biru?',
      text_en: 'Excuse me, do you have a blue shirt?',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000002',
      speaker: 'Penjual',
      text_target: 'Ada! Biru, hitam, dan cokelat. Ukuran berapa?',
      text_en: 'Yes! Blue, black, and brown. What size?',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Ukuran besar. Celana juga ada?',
      text_en: 'Large size. Do you have pants too?',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000004',
      speaker: 'Penjual',
      text_target: 'Ada celana hitam. Baju ini bagus, warna biru!',
      text_en: 'There are black pants. This shirt is nice, blue color!',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Berapa harga baju yang biru itu?',
      text_en: 'How much is that blue shirt?',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000006',
      speaker: 'Penjual',
      text_target: 'Delapan puluh ribu. Baju cokelat lebih murah.',
      text_en: 'Eighty thousand. The brown shirt is cheaper.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0022-4000-8000-000000000001',
      text_target: 'Warna apa?',
      text_en: 'What color?',
      literal_translation: 'Color what?',
      usage_note:
        'Ask about available colors. "Warna" = color. You can also say "warna biru" (blue color) to specify.',
      wordTexts: ['warna'],
    },
    {
      id: 'f1000000-0022-4000-8000-000000000002',
      text_target: 'Ukuran besar',
      text_en: 'Large size',
      literal_translation: 'Size big',
      usage_note:
        '"Ukuran" means size. In Indonesian, the adjective comes after: "ukuran kecil" (small), "ukuran besar" (large).',
      wordTexts: ['ukuran', 'besar'],
    },
    {
      id: 'f1000000-0022-4000-8000-000000000003',
      text_target: 'Baju hitam',
      text_en: 'Black shirt',
      literal_translation: 'Shirt black',
      usage_note:
        'Color words come after the noun. "Baju hitam" = black shirt, "celana biru" = blue pants.',
      wordTexts: ['baju', 'hitam'],
    },
    {
      id: 'f1000000-0022-4000-8000-000000000004',
      text_target: 'Celana cokelat',
      text_en: 'Brown pants',
      literal_translation: 'Pants brown',
      usage_note:
        '"Cokelat" means both brown (the color) and chocolate. Context makes the meaning clear.',
      wordTexts: ['celana', 'cokelat'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0022-4000-8000-000000000001',
      pattern_template: 'Warna + color',
      pattern_en: 'color + name',
      explanation:
        '"Warna" followed by a color word describes the color. "Warna biru" = blue color.',
      prompt: 'Baju ___ hitam.',
      hint_en: 'A black shirt.',
      correct_answer: 'warna',
      distractors: ['yang', 'ini', 'ada'],
    },
    {
      id: '0a000000-0022-4000-8000-000000000002',
      pattern_template: 'noun + warna + color',
      pattern_en: 'noun + color + name',
      explanation:
        'To describe an item by its color: noun + "warna" + color. "Baju warna biru" = blue shirt.',
      prompt: 'Ada baju ___ biru?',
      hint_en: 'Do you have a blue shirt?',
      correct_answer: 'warna',
      distractors: ['ukuran', 'harga', 'dan'],
    },
    {
      id: '0a000000-0022-4000-8000-000000000003',
      pattern_template: 'Ukuran + size',
      pattern_en: 'Size + description',
      explanation:
        '"Ukuran" + size word describes the fit. "Ukuran besar" = large size, "ukuran kecil" = small size.',
      prompt: '___ berapa?',
      hint_en: 'What size?',
      correct_answer: 'Ukuran',
      distractors: ['Warna', 'Harga', 'Baju'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000182', text: 'baju', meaning_en: 'clothes / shirt', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000183', text: 'celana', meaning_en: 'pants / trousers', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000184', text: 'ukuran', meaning_en: 'size', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000185', text: 'warna', meaning_en: 'color', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000186', text: 'hitam', meaning_en: 'black', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000187', text: 'biru', meaning_en: 'blue', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000188', text: 'cokelat', meaning_en: 'brown / chocolate', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'ada', 'besar', 'kecil', 'mahal', 'bisa', 'mau', 'berapa', 'harga',
    'ini', 'itu', 'saya', 'bagus', 'merah', 'putih',
  ],
};

// ── Scene 4.3b: Yang Mana? (Which One?) ─────────────────────────────

const scene4_3b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000042',
  title: 'Yang Mana? (Which One?)',
  description: 'Choosing and comparing items while shopping',
  scene_context:
    "You're trying on clothes and deciding which to buy. You learn to compare, choose, and ask about different options.",
  sort_order: 28,
  dialogues: [
    {
      id: 'e1000000-0042-4000-8000-000000000001',
      speaker: 'Penjual',
      text_target: 'Yang mana? Yang hitam atau yang biru?',
      text_en: 'Which one? The black one or the blue one?',
    },
    {
      id: 'e1000000-0042-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Saya mau coba pakai yang biru.',
      text_en: 'I want to try on the blue one.',
    },
    {
      id: 'e1000000-0042-4000-8000-000000000003',
      speaker: 'Penjual',
      text_target: 'Bagaimana? Cocok sekali!',
      text_en: 'How is it? It fits perfectly!',
    },
    {
      id: 'e1000000-0042-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Cantik! Tapi ada warna lain? Yang murah?',
      text_en: 'Pretty! But do you have another color? A cheaper one?',
    },
    {
      id: 'e1000000-0042-4000-8000-000000000005',
      speaker: 'Penjual',
      text_target: 'Yang hitam lebih murah. Bagaimana, mau yang mana?',
      text_en: 'The black one is cheaper. So, which one do you want?',
    },
    {
      id: 'e1000000-0042-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Yang biru, cocok sekali! Saya pakai ini.',
      text_en: 'The blue one, it fits perfectly! I will take this one.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0042-4000-8000-000000000001',
      text_target: 'Yang mana?',
      text_en: 'Which one?',
      literal_translation: 'Which which?',
      usage_note:
        'A very common question to ask someone to point out which specific item they mean.',
      wordTexts: ['yang', 'mana'],
    },
    {
      id: 'f1000000-0042-4000-8000-000000000002',
      text_target: 'Cocok sekali!',
      text_en: 'It fits perfectly!',
      literal_translation: 'Suitable very!',
      usage_note:
        '"Cocok" means suitable or matching. With "sekali" it means a perfect fit.',
      wordTexts: ['cocok'],
    },
    {
      id: 'f1000000-0042-4000-8000-000000000003',
      text_target: 'Coba pakai',
      text_en: 'Try it on',
      literal_translation: 'Try wear',
      usage_note:
        '"Pakai" means to wear or use. "Coba pakai" is how you say "try it on" when shopping for clothes.',
      wordTexts: ['pakai'],
    },
    {
      id: 'f1000000-0042-4000-8000-000000000004',
      text_target: 'Ada yang lain?',
      text_en: 'Is there another one?',
      literal_translation: 'There-is which other?',
      usage_note:
        '"Lain" means other or different. "Ada yang lain?" asks if there are other options available.',
      wordTexts: ['lain'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0042-4000-8000-000000000001',
      pattern_template: 'Yang + adjective',
      pattern_en: 'The ___ one',
      explanation:
        '"Yang" + adjective picks out a specific item by its quality. "Yang besar" = the big one.',
      prompt: '___ hitam juga bagus.',
      hint_en: 'The black one is also nice.',
      correct_answer: 'Yang',
      distractors: ['Ini', 'Ada', 'Itu'],
    },
    {
      id: '0a000000-0042-4000-8000-000000000002',
      pattern_template: 'Bagaimana?',
      pattern_en: 'How is it?',
      explanation:
        '"Bagaimana" means "how" and is used to ask for opinions. "Bagaimana baju ini?" = How is this shirt?',
      prompt: '___? Cocok sekali!',
      hint_en: 'How is it? Fits perfectly!',
      correct_answer: 'Bagaimana',
      distractors: ['Berapa', 'Apa', 'Mana'],
    },
    {
      id: '0a000000-0042-4000-8000-000000000003',
      pattern_template: 'Ada yang + adjective + lain?',
      pattern_en: 'Is there another + adjective + one?',
      explanation:
        '"Ada yang lain" asks for other options. Add an adjective to specify: "Ada yang murah lain?" = Is there another cheap one?',
      prompt: 'Ada warna ___?',
      hint_en: 'Is there another color?',
      correct_answer: 'lain',
      distractors: ['ini', 'itu', 'mana'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000189', text: 'pakai', meaning_en: 'to wear / to use', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000190', text: 'cocok', meaning_en: 'suitable / matching', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000191', text: 'cantik', meaning_en: 'beautiful / pretty', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000192', text: 'bagaimana', meaning_en: 'how', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000193', text: 'yang', meaning_en: 'which / that', part_of_speech: 'pronoun' },
    { id: 'b1000000-0001-4000-8000-000000000194', text: 'lain', meaning_en: 'other / different', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000195', text: 'mana', meaning_en: 'which', part_of_speech: 'pronoun' },
  ],
  existingWordTexts: [
    'ada', 'besar', 'kecil', 'bisa', 'mau', 'ini', 'itu', 'saya',
    'bagus', 'sekali', 'baju', 'warna', 'hitam', 'biru', 'murah',
  ],
};

// ── Scene 4.4a: Barang di Toko (Store Items) ────────────────────────

const scene4_4a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000023',
  title: 'Barang di Toko (Store Items)',
  description: 'Shopping for toiletries and everyday items at a store',
  scene_context:
    'You stop at a minimarket to buy toiletries and drinks. You practice asking for items and understanding the total.',
  sort_order: 29,
  dialogues: [
    {
      id: 'e1000000-0023-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, ada sabun dan pasta gigi?',
      text_en: 'Excuse me, do you have soap and toothpaste?',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000002',
      speaker: 'Kasir',
      text_target: 'Ada! Sabun di situ, pasta gigi di sini.',
      text_en: 'Yes! Soap is over there, toothpaste is here.',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Saya mau dua botol air putih juga.',
      text_en: 'I want two bottles of water too.',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000004',
      speaker: 'Kasir',
      text_target: 'Baik. Semua empat puluh lima ribu.',
      text_en: 'Okay. That is forty-five thousand total.',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Ini lima puluh ribu. Berapa totalnya?',
      text_en: 'Here is fifty thousand. What is the total?',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000006',
      speaker: 'Kasir',
      text_target: 'Total empat puluh lima ribu. Kembalian lima ribu.',
      text_en: 'Total is forty-five thousand. Change is five thousand.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0023-4000-8000-000000000001',
      text_target: 'Berapa totalnya?',
      text_en: "What's the total?",
      literal_translation: 'How-much total-its?',
      usage_note:
        '"-nya" on "total" makes it "the total". A polite way to ask for the bill.',
      wordTexts: ['berapa', 'total'],
    },
    {
      id: 'f1000000-0023-4000-8000-000000000002',
      text_target: 'Ini kembaliannya',
      text_en: "Here's the change",
      literal_translation: 'This change-its',
      usage_note:
        'The cashier says this when giving you change. "Kembalian" = change (money returned).',
      wordTexts: ['ini', 'kembalian'],
    },
    {
      id: 'f1000000-0023-4000-8000-000000000003',
      text_target: 'Semua empat puluh lima ribu',
      text_en: 'Forty-five thousand total',
      literal_translation: 'All four ten five thousand',
      usage_note:
        '"Semua" means "all" or "altogether". Used to state a total price for multiple items.',
      wordTexts: ['semua'],
    },
    {
      id: 'f1000000-0023-4000-8000-000000000004',
      text_target: 'Dua botol air putih',
      text_en: 'Two bottles of water',
      literal_translation: 'Two bottle water white',
      usage_note:
        '"Botol" is a classifier for bottles. "Air putih" = plain water (literally "white water").',
      wordTexts: ['botol'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0023-4000-8000-000000000001',
      pattern_template: 'Semua + number',
      pattern_en: 'All together + number',
      explanation:
        '"Semua" means "all" or "altogether". Used to state a total price.',
      prompt: '___ empat puluh lima ribu.',
      hint_en: 'Forty-five thousand altogether.',
      correct_answer: 'Semua',
      distractors: ['Total', 'Berapa', 'Ada'],
    },
    {
      id: '0a000000-0023-4000-8000-000000000002',
      pattern_template: 'Berapa + noun-nya',
      pattern_en: 'How much is the + noun',
      explanation:
        '"Berapa" + noun + "-nya" asks about the amount. The "-nya" suffix makes it definite ("the").',
      prompt: '___ totalnya?',
      hint_en: "What's the total?",
      correct_answer: 'Berapa',
      distractors: ['Apa', 'Mana', 'Ini'],
    },
    {
      id: '0a000000-0023-4000-8000-000000000003',
      pattern_template: 'number + botol + noun',
      pattern_en: 'number + bottle(s) of + noun',
      explanation:
        '"Botol" is a classifier for bottled items. "Dua botol air" = two bottles of water.',
      prompt: 'Dua ___ air putih.',
      hint_en: 'Two bottles of water.',
      correct_answer: 'botol',
      distractors: ['buah', 'kantong', 'ribu'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000196', text: 'semua', meaning_en: 'all', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000197', text: 'total', meaning_en: 'total', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000198', text: 'kembalian', meaning_en: 'change (money)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000202', text: 'botol', meaning_en: 'bottle', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000203', text: 'sabun', meaning_en: 'soap', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000204', text: 'pasta gigi', meaning_en: 'toothpaste', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'berapa', 'satu', 'dua', 'mau', 'terima kasih', 'ada', 'ini',
    'tidak', 'empat', 'lima', 'puluh', 'air putih', 'sore', 'ribu',
  ],
};

// ── Scene 4.4b: Bayar di Kasir (Paying at the Register) ─────────────

const scene4_4b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000043',
  title: 'Bayar di Kasir (Paying at the Register)',
  description: 'Paying for items with card or cash at a minimarket',
  scene_context:
    'You are at the register paying for your items. You learn about payment methods, receipts, and common checkout phrases.',
  sort_order: 30,
  dialogues: [
    {
      id: 'e1000000-0043-4000-8000-000000000001',
      speaker: 'Kasir',
      text_target: 'Semuanya sabun, sikat gigi, dan tisu. Pakai kantong?',
      text_en: 'Altogether soap, toothbrush, and tissue. Use a bag?',
    },
    {
      id: 'e1000000-0043-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Tidak, terima kasih. Berapa totalnya?',
      text_en: 'No, thank you. How much is the total?',
    },
    {
      id: 'e1000000-0043-4000-8000-000000000003',
      speaker: 'Kasir',
      text_target: 'Semua tiga puluh ribu. Bayar pakai kartu atau tunai?',
      text_en: 'Altogether thirty thousand. Pay by card or cash?',
    },
    {
      id: 'e1000000-0043-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Bayar pakai kartu, bisa?',
      text_en: 'Pay by card, can I?',
    },
    {
      id: 'e1000000-0043-4000-8000-000000000005',
      speaker: 'Kasir',
      text_target: 'Bisa! Ini struk. Ada yang lain?',
      text_en: 'Yes! Here is the receipt. Anything else?',
    },
    {
      id: 'e1000000-0043-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Satu botol sabun lagi. Terima kasih!',
      text_en: 'One more bottle of soap. Thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0043-4000-8000-000000000001',
      text_target: 'Bayar pakai kartu',
      text_en: 'Pay by card',
      literal_translation: 'Pay use card',
      usage_note:
        '"Pakai" means "to use". "Bayar pakai kartu" = pay using a card. You can also say "bayar tunai" for cash.',
      wordTexts: ['kartu'],
    },
    {
      id: 'f1000000-0043-4000-8000-000000000002',
      text_target: 'Bayar tunai',
      text_en: 'Pay cash',
      literal_translation: 'Pay cash',
      usage_note:
        '"Tunai" means cash. "Bayar tunai" = pay with cash. The opposite of paying by card.',
      wordTexts: ['tunai'],
    },
    {
      id: 'f1000000-0043-4000-8000-000000000003',
      text_target: 'Ini struk',
      text_en: 'Here is the receipt',
      literal_translation: 'This receipt',
      usage_note:
        '"Struk" is a receipt (from Dutch). The cashier hands this to you after payment.',
      wordTexts: ['struk'],
    },
    {
      id: 'f1000000-0043-4000-8000-000000000004',
      text_target: 'Sikat gigi dan tisu',
      text_en: 'Toothbrush and tissue',
      literal_translation: 'Brush tooth and tissue',
      usage_note:
        '"Sikat gigi" literally means "tooth brush". "Tisu" is tissue or napkins, common at minimarkets.',
      wordTexts: ['sikat gigi', 'tisu'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0043-4000-8000-000000000001',
      pattern_template: 'Bayar pakai + payment method',
      pattern_en: 'Pay by + payment method',
      explanation:
        '"Bayar pakai" + payment method tells how you want to pay. "Kartu" = card, "tunai" = cash.',
      prompt: 'Bayar ___ kartu.',
      hint_en: 'Pay by card.',
      correct_answer: 'pakai',
      distractors: ['mau', 'bisa', 'ada'],
    },
    {
      id: '0a000000-0043-4000-8000-000000000002',
      pattern_template: 'Kartu atau tunai?',
      pattern_en: 'Card or cash?',
      explanation:
        'Cashiers ask this to know your payment method. "Atau" = or.',
      prompt: 'Kartu ___ tunai?',
      hint_en: 'Card or cash?',
      correct_answer: 'atau',
      distractors: ['dan', 'dengan', 'pakai'],
    },
    {
      id: '0a000000-0043-4000-8000-000000000003',
      pattern_template: 'Ini + noun (handing over)',
      pattern_en: 'Here is + noun',
      explanation:
        '"Ini" + noun is how you present something. "Ini struk" = here is the receipt.',
      prompt: 'Ini ___.',
      hint_en: 'Here is the receipt.',
      correct_answer: 'struk',
      distractors: ['kartu', 'tunai', 'botol'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000199', text: 'kartu', meaning_en: 'card', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000200', text: 'tunai', meaning_en: 'cash', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000201', text: 'struk', meaning_en: 'receipt', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000205', text: 'sikat gigi', meaning_en: 'toothbrush', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000206', text: 'tisu', meaning_en: 'tissue', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000207', text: 'juta', meaning_en: 'million', part_of_speech: 'numeral' },
  ],
  existingWordTexts: [
    'bayar', 'uang', 'berapa', 'bisa', 'mau', 'terima kasih', 'ada',
    'ini', 'tidak', 'pakai', 'kantong', 'semua', 'total', 'sabun', 'botol',
  ],
};

// ── Scene 4.5a: Kurs Hari Ini (Exchange Rates) ─────────────────────

const scene4_5a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000024',
  title: 'Kurs Hari Ini (Exchange Rates)',
  description: 'Exchanging foreign currency and understanding rates',
  scene_context:
    'You need to exchange dollars for rupiah at a money changer. You ask about exchange rates and compare them.',
  sort_order: 31,
  dialogues: [
    {
      id: 'e1000000-0024-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, saya mau tukar dolar ke rupiah.',
      text_en: 'Excuse me, I want to exchange dollars to rupiah.',
    },
    {
      id: 'e1000000-0024-4000-8000-000000000002',
      speaker: 'Pegawai',
      text_target: 'Baik. Kurs hari ini lima belas ribu tiga ratus.',
      text_en: "Okay. Today's rate is fifteen thousand three hundred.",
    },
    {
      id: 'e1000000-0024-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Ini kurs paling tinggi?',
      text_en: 'Is this the highest rate?',
    },
    {
      id: 'e1000000-0024-4000-8000-000000000004',
      speaker: 'Pegawai',
      text_target: 'Ya, lebih tinggi dari kemarin sedikit.',
      text_en: 'Yes, a little higher than yesterday.',
    },
    {
      id: 'e1000000-0024-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Baik, saya mau tukar satu ratus dolar.',
      text_en: 'Okay, I want to exchange one hundred dollars.',
    },
    {
      id: 'e1000000-0024-4000-8000-000000000006',
      speaker: 'Pegawai',
      text_target: 'Baik. Ini rupiah, terima kasih!',
      text_en: 'Okay. Here is the rupiah, thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0024-4000-8000-000000000001',
      text_target: 'Tukar dolar ke rupiah',
      text_en: 'Exchange dollars to rupiah',
      literal_translation: 'Exchange dollar to rupiah',
      usage_note:
        '"Tukar" + currency + "ke" + currency is the pattern for currency exchange.',
      wordTexts: ['tukar', 'dolar'],
    },
    {
      id: 'f1000000-0024-4000-8000-000000000002',
      text_target: 'Kurs hari ini berapa?',
      text_en: "What's today's rate?",
      literal_translation: 'Rate day this how-much?',
      usage_note:
        '"Kurs" is the exchange rate. "Hari ini" means "today" (literally "day this").',
      wordTexts: ['kurs', 'berapa'],
    },
    {
      id: 'f1000000-0024-4000-8000-000000000003',
      text_target: 'Lebih tinggi dari kemarin',
      text_en: 'Higher than yesterday',
      literal_translation: 'More high from yesterday',
      usage_note:
        '"Lebih" + adjective + "dari" makes a comparison. "Kemarin" = yesterday.',
      wordTexts: ['lebih', 'tinggi'],
    },
    {
      id: 'f1000000-0024-4000-8000-000000000004',
      text_target: 'Paling tinggi',
      text_en: 'The highest',
      literal_translation: 'Most high',
      usage_note:
        '"Paling" + adjective creates a superlative. "Paling tinggi" = the highest, "paling murah" = the cheapest.',
      wordTexts: ['paling', 'tinggi'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0024-4000-8000-000000000001',
      pattern_template: 'Tukar + currency + ke + currency',
      pattern_en: 'Exchange + currency + to + currency',
      explanation:
        '"Tukar" + source currency + "ke" + target currency is the standard exchange request.',
      prompt: 'Saya mau ___ dolar ke rupiah.',
      hint_en: 'I want to exchange dollars to rupiah.',
      correct_answer: 'tukar',
      distractors: ['beli', 'bayar', 'bawa'],
    },
    {
      id: '0a000000-0024-4000-8000-000000000002',
      pattern_template: 'Lebih + adjective + dari',
      pattern_en: 'More + adjective + than',
      explanation:
        '"Lebih" before an adjective and "dari" after it makes a comparison: more [adj] than.',
      prompt: '___ tinggi dari kemarin.',
      hint_en: 'Higher than yesterday.',
      correct_answer: 'Lebih',
      distractors: ['Paling', 'Sangat', 'Terlalu'],
    },
    {
      id: '0a000000-0024-4000-8000-000000000003',
      pattern_template: 'Paling + adjective',
      pattern_en: 'The most + adjective',
      explanation:
        '"Paling" + adjective creates a superlative. "Paling tinggi" = the highest.',
      prompt: 'Kurs ___ tinggi.',
      hint_en: 'The highest rate.',
      correct_answer: 'paling',
      distractors: ['lebih', 'sangat', 'tidak'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000208', text: 'tukar', meaning_en: 'to exchange', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000209', text: 'kurs', meaning_en: 'exchange rate', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000210', text: 'dolar', meaning_en: 'dollar', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000211', text: 'lebih', meaning_en: 'more / -er (comparative)', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000212', text: 'paling', meaning_en: 'most / -est (superlative)', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000213', text: 'tinggi', meaning_en: 'high / tall', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'uang', 'berapa', 'mau', 'saya', 'bisa', 'baik', 'terima kasih',
    'ke', 'ini', 'ribu', 'ratus', 'sedikit',
  ],
};

// ── Scene 4.5b: Cukup atau Kurang? (Enough or Not?) ────────────────

const scene4_5b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000044',
  title: 'Cukup atau Kurang? (Enough or Not?)',
  description: 'Comparing, needing, and having enough money',
  scene_context:
    'You continue at the money changer. You need to figure out how much you need, whether you have enough, and learn about ATM withdrawals.',
  sort_order: 32,
  dialogues: [
    {
      id: 'e1000000-0044-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Saya butuh dua juta rupiah. Cukup satu ratus dolar?',
      text_en: 'I need two million rupiah. Is one hundred dollars enough?',
    },
    {
      id: 'e1000000-0044-4000-8000-000000000002',
      speaker: 'Pegawai',
      text_target: 'Lebih dari cukup! Ada sisa dolar.',
      text_en: 'More than enough! There will be remaining dollars.',
    },
    {
      id: 'e1000000-0044-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Kurs di situ lebih rendah, ya?',
      text_en: 'The rate over there is lower, right?',
    },
    {
      id: 'e1000000-0044-4000-8000-000000000004',
      speaker: 'Pegawai',
      text_target: 'Ya, lebih rendah. Di sini lebih tinggi.',
      text_en: 'Yes, lower. Here is higher.',
    },
    {
      id: 'e1000000-0044-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Baik. Bisa tarik tunai di ATM juga?',
      text_en: 'Okay. Can I withdraw cash at the ATM too?',
    },
    {
      id: 'e1000000-0044-4000-8000-000000000006',
      speaker: 'Pegawai',
      text_target: 'Bisa! ATM ada di sana. Ini rupiah dan sisa dolarnya.',
      text_en: 'Yes! The ATM is over there. Here is the rupiah and remaining dollars.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0044-4000-8000-000000000001',
      text_target: 'Saya butuh rupiah',
      text_en: 'I need rupiah',
      literal_translation: 'I need rupiah',
      usage_note:
        '"Butuh" is an informal way to say "need". More casual than "perlu".',
      wordTexts: ['butuh', 'rupiah'],
    },
    {
      id: 'f1000000-0044-4000-8000-000000000002',
      text_target: 'Cukup atau kurang?',
      text_en: 'Enough or not enough?',
      literal_translation: 'Enough or less?',
      usage_note:
        '"Cukup" = enough, "kurang" = not enough / less. A useful pair for checking quantities.',
      wordTexts: ['cukup'],
    },
    {
      id: 'f1000000-0044-4000-8000-000000000003',
      text_target: 'Ada sisa',
      text_en: 'There is a remainder',
      literal_translation: 'There-is leftover',
      usage_note:
        '"Sisa" means remaining or leftover. "Ada sisa" = there is some left.',
      wordTexts: ['sisa'],
    },
    {
      id: 'f1000000-0044-4000-8000-000000000004',
      text_target: 'Tarik tunai',
      text_en: 'Withdraw cash',
      literal_translation: 'Pull cash',
      usage_note:
        '"Tarik" means to pull. "Tarik tunai" = withdraw cash (at an ATM). A very useful banking phrase.',
      wordTexts: ['tarik'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0044-4000-8000-000000000001',
      pattern_template: 'Saya butuh + amount',
      pattern_en: 'I need + amount',
      explanation:
        '"Butuh" means "need" (informal). Follow it with what you need: "Saya butuh dua juta" = I need two million.',
      prompt: 'Saya ___ dua juta rupiah.',
      hint_en: 'I need two million rupiah.',
      correct_answer: 'butuh',
      distractors: ['mau', 'bisa', 'ada'],
    },
    {
      id: '0a000000-0044-4000-8000-000000000002',
      pattern_template: 'Lebih rendah / lebih tinggi',
      pattern_en: 'Lower / higher',
      explanation:
        '"Rendah" = low, "tinggi" = high. With "lebih" they become comparative: "lebih rendah" = lower.',
      prompt: 'Kurs di situ lebih ___.',
      hint_en: 'The rate over there is lower.',
      correct_answer: 'rendah',
      distractors: ['tinggi', 'murah', 'mahal'],
    },
    {
      id: '0a000000-0044-4000-8000-000000000003',
      pattern_template: 'Cukup + noun',
      pattern_en: 'Enough + noun',
      explanation:
        '"Cukup" means enough. "Cukup uang" = enough money, "cukup dolar" = enough dollars.',
      prompt: '___ satu ratus dolar?',
      hint_en: 'Is one hundred dollars enough?',
      correct_answer: 'Cukup',
      distractors: ['Berapa', 'Ada', 'Bisa'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000214', text: 'rendah', meaning_en: 'low', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000215', text: 'butuh', meaning_en: 'to need (informal)', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000216', text: 'cukup', meaning_en: 'enough', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000217', text: 'sisa', meaning_en: 'remaining / leftover', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000218', text: 'rupiah', meaning_en: 'rupiah (currency)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000219', text: 'tarik', meaning_en: 'to pull / withdraw', part_of_speech: 'verb' },
  ],
  existingWordTexts: [
    'uang', 'berapa', 'mau', 'saya', 'ada', 'baik', 'terima kasih',
    'dua', 'juta', 'tunai', 'tukar', 'dolar', 'lebih', 'tinggi',
    'tapi', 'atau',
  ],
};

export const UNIT4_SCENES: DialogueSceneData[] = [scene4_2a, scene4_2b, scene4_3a, scene4_3b, scene4_4a, scene4_4b, scene4_5a, scene4_5b];
