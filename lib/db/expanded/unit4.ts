// Unit 4: Shopping & Money — Scenes 4.2, 4.3, 4.4, 4.5
// Extended dialogue scenes for Indonesian language learning.

import type { DialogueSceneData } from '../dialogue-data';

// ── Scene 4.2: Di Pasar (At the Market) ─────────────────────────────

const scene4_2: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000021',
  title: 'Di Pasar (At the Market)',
  description: 'Buying fruit and vegetables at a traditional market',
  scene_context:
    "You're at the morning market in Ubud buying fresh fruit. You practice bargaining and using quantities with classifiers.",
  sort_order: 17,
  dialogues: [
    {
      id: 'e1000000-0021-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, satu kilo jeruk berapa?',
      text_en: 'Excuse me, how much is one kilo of oranges?',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000002',
      speaker: 'Penjual',
      text_target: 'Dua puluh ribu satu kilo. Segar sekali hari ini!',
      text_en: 'Twenty thousand per kilo. Very fresh today!',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Mangga yang matang ada? Berapa satu buah?',
      text_en: 'Do you have ripe mangoes? How much each?',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000004',
      speaker: 'Penjual',
      text_target: 'Ada! Lima ribu satu buah. Mau berapa?',
      text_en: 'Yes! Five thousand each. How many do you want?',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Tiga buah mangga dan satu kilo jeruk. Bisa kurang?',
      text_en: 'Three mangoes and one kilo of oranges. Can you lower it?',
    },
    {
      id: 'e1000000-0021-4000-8000-000000000006',
      speaker: 'Penjual',
      text_target: 'Baik, tiga puluh ribu semua. Bungkus ya?',
      text_en: 'Okay, thirty thousand total. Wrap it up?',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0021-4000-8000-000000000001',
      text_target: 'Satu kilo berapa?',
      text_en: 'How much per kilo?',
      literal_translation: 'One kilo how-much?',
      usage_note:
        'The standard way to ask the price per kilo at a market. Put the quantity first, then "berapa".',
      wordTexts: ['satu', 'kilo', 'berapa'],
    },
    {
      id: 'f1000000-0021-4000-8000-000000000002',
      text_target: 'Lima ribu satu',
      text_en: 'Five thousand each',
      literal_translation: 'Five thousand one',
      usage_note:
        'Sellers state the price per item this way. "Satu" at the end means "per piece".',
      wordTexts: ['lima', 'ribu', 'satu'],
    },
    {
      id: 'f1000000-0021-4000-8000-000000000003',
      text_target: 'Bungkus ya',
      text_en: 'Wrap it up / bag it please',
      literal_translation: 'Wrap yes',
      usage_note:
        'Ask the seller to bag your items. "Ya" at the end softens the request.',
      wordTexts: ['bungkus'],
    },
    {
      id: 'f1000000-0021-4000-8000-000000000004',
      text_target: 'Mangga yang matang',
      text_en: 'Ripe mangoes',
      literal_translation: 'Mango which ripe',
      usage_note:
        '"Yang" links a noun with a describing adjective. "Mangga yang matang" = mangoes that are ripe.',
      wordTexts: ['mangga', 'matang'],
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
      distractors: ['ratus', 'buah', 'kilo'],
    },
    {
      id: '0a000000-0021-4000-8000-000000000002',
      pattern_template: 'Satu kilo ___',
      pattern_en: 'One kilo of ___',
      explanation:
        'Put the quantity and unit before the noun. "Satu kilo jeruk" = one kilo of oranges.',
      prompt: 'Satu ___ jeruk.',
      hint_en: 'One kilo of oranges.',
      correct_answer: 'kilo',
      distractors: ['buah', 'ribu', 'ratus'],
    },
    {
      id: '0a000000-0021-4000-8000-000000000003',
      pattern_template: 'yang + adjective',
      pattern_en: 'the one that is + adjective',
      explanation:
        '"Yang" before an adjective specifies which item. "Yang matang" = the ripe one(s).',
      prompt: 'Mangga ___ matang.',
      hint_en: 'Ripe mangoes (mangoes that are ripe).',
      correct_answer: 'yang',
      distractors: ['ini', 'itu', 'dan'],
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
    { id: 'b1000000-0001-4000-8000-000000000175', text: 'apel', meaning_en: 'apple', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000176', text: 'kilo', meaning_en: 'kilogram', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000177', text: 'segar', meaning_en: 'fresh', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000178', text: 'matang', meaning_en: 'ripe', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000179', text: 'bungkus', meaning_en: 'to wrap / package', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000180', text: 'kantong', meaning_en: 'bag / plastic bag', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000181', text: 'ekor', meaning_en: 'tail / classifier (animals)', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'berapa', 'harga', 'mahal', 'bisa', 'mau', 'satu', 'dua', 'tiga',
    'empat', 'lima', 'saya', 'ini', 'itu', 'baik', 'terima kasih',
  ],
};

// ── Scene 4.3: Beli Baju (Buying Clothes) ───────────────────────────

const scene4_3: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000022',
  title: 'Beli Baju (Buying Clothes)',
  description: 'Shopping for clothing at a market',
  scene_context:
    "You're shopping for clothes at a market in Bali. You ask about sizes, colors, and prices.",
  sort_order: 18,
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
      text_target: 'Ada! Yang ini atau yang itu? Ukuran berapa?',
      text_en: 'Yes! This one or that one? What size?',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Yang itu. Ada yang lebih kecil?',
      text_en: 'That one. Is there a smaller one?',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000004',
      speaker: 'Penjual',
      text_target: 'Ada. Yang hitam juga bagus. Mau coba pakai?',
      text_en: 'Yes. The black one is also nice. Want to try it on?',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Cocok sekali! Berapa harganya?',
      text_en: 'It fits perfectly! How much is it?',
    },
    {
      id: 'e1000000-0022-4000-8000-000000000006',
      speaker: 'Penjual',
      text_target: 'Delapan puluh ribu. Cantik sekali!',
      text_en: 'Eighty thousand. Very pretty!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0022-4000-8000-000000000001',
      text_target: 'Ada yang lebih kecil?',
      text_en: 'Is there a smaller one?',
      literal_translation: 'There-is which more small?',
      usage_note:
        '"Ada yang lebih" + adjective asks if there is a more [adjective] option. Very useful when shopping.',
      wordTexts: ['ada', 'kecil'],
    },
    {
      id: 'f1000000-0022-4000-8000-000000000002',
      text_target: 'Warna apa?',
      text_en: 'What color?',
      literal_translation: 'Color what?',
      usage_note:
        'Ask about available colors. "Warna" = color, "apa" = what.',
      wordTexts: ['warna'],
    },
    {
      id: 'f1000000-0022-4000-8000-000000000003',
      text_target: 'Yang mana?',
      text_en: 'Which one?',
      literal_translation: 'Which which?',
      usage_note:
        'A very common question to ask someone to point out which specific item they mean.',
      wordTexts: ['yang', 'mana'],
    },
    {
      id: 'f1000000-0022-4000-8000-000000000004',
      text_target: 'Cocok sekali!',
      text_en: 'It fits perfectly!',
      literal_translation: 'Suitable very!',
      usage_note:
        '"Cocok" means suitable or matching. With "sekali" it means a perfect fit.',
      wordTexts: ['cocok'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0022-4000-8000-000000000001',
      pattern_template: 'Ada yang + adjective',
      pattern_en: 'Is there one that is + adjective',
      explanation:
        '"Ada yang" + adjective asks if a version with that quality exists. "Ada yang murah?" = Is there a cheap one?',
      prompt: 'Ada ___ lebih kecil?',
      hint_en: 'Is there a smaller one?',
      correct_answer: 'yang',
      distractors: ['ini', 'itu', 'apa'],
    },
    {
      id: '0a000000-0022-4000-8000-000000000002',
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
      id: '0a000000-0022-4000-8000-000000000003',
      pattern_template: 'Yang + adjective',
      pattern_en: 'The ___ one',
      explanation:
        '"Yang" + adjective picks out a specific item by its quality. "Yang besar" = the big one.',
      prompt: '___ hitam juga bagus.',
      hint_en: 'The black one is also nice.',
      correct_answer: 'Yang',
      distractors: ['Ini', 'Ada', 'Itu'],
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
    { id: 'b1000000-0001-4000-8000-000000000189', text: 'pakai', meaning_en: 'to wear / to use', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000190', text: 'cocok', meaning_en: 'suitable / matching', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000191', text: 'cantik', meaning_en: 'beautiful / pretty', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000192', text: 'bagaimana', meaning_en: 'how', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000193', text: 'yang', meaning_en: 'which / that', part_of_speech: 'pronoun' },
    { id: 'b1000000-0001-4000-8000-000000000194', text: 'lain', meaning_en: 'other / different', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000195', text: 'mana', meaning_en: 'which', part_of_speech: 'pronoun' },
  ],
  existingWordTexts: [
    'ada', 'besar', 'kecil', 'mahal', 'merah', 'putih', 'hijau',
    'bisa', 'mau', 'berapa', 'harga', 'ini', 'itu', 'saya', 'baik', 'bagus',
    // From scene 4.2:
    'murah',
  ],
};

// ── Scene 4.4: Di Minimarket (At the Convenience Store) ─────────────

const scene4_4: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000023',
  title: 'Di Minimarket (At the Convenience Store)',
  description: 'Shopping at Indomaret/Alfamart',
  scene_context:
    'You stop at a minimarket to buy toiletries and drinks. Practice fixed-price shopping vocabulary.',
  sort_order: 19,
  dialogues: [
    {
      id: 'e1000000-0023-4000-8000-000000000001',
      speaker: 'Kasir',
      text_target: 'Selamat sore! Pakai kantong?',
      text_en: 'Good afternoon! Use a bag?',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Ya, satu kantong. Berapa totalnya?',
      text_en: 'Yes, one bag. What is the total?',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000003',
      speaker: 'Kasir',
      text_target: 'Sabun, pasta gigi, sikat gigi, dua botol air putih... Semua empat puluh lima ribu.',
      text_en: 'Soap, toothpaste, toothbrush, two bottles of water... Forty-five thousand total.',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Bayar pakai kartu, bisa?',
      text_en: 'Pay by card, can I?',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000005',
      speaker: 'Kasir',
      text_target: 'Bisa! Ini struk. Tisu mau?',
      text_en: 'Yes! Here is the receipt. Want tissue?',
    },
    {
      id: 'e1000000-0023-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Tidak, terima kasih!',
      text_en: 'No, thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0023-4000-8000-000000000001',
      text_target: 'Bayar pakai kartu',
      text_en: 'Pay by card',
      literal_translation: 'Pay use card',
      usage_note:
        '"Pakai" means "to use". "Bayar pakai kartu" = pay using a card. You can also say "bayar tunai" for cash.',
      wordTexts: ['bayar', 'pakai', 'kartu'],
    },
    {
      id: 'f1000000-0023-4000-8000-000000000002',
      text_target: 'Pakai kantong?',
      text_en: 'Use a bag?',
      literal_translation: 'Use bag?',
      usage_note:
        'Cashiers ask this to see if you want a plastic bag. Indonesia charges for bags at minimarkets.',
      wordTexts: ['pakai', 'kantong'],
    },
    {
      id: 'f1000000-0023-4000-8000-000000000003',
      text_target: 'Berapa totalnya?',
      text_en: "What's the total?",
      literal_translation: 'How-much total-its?',
      usage_note:
        '"-nya" on "total" makes it "the total". A polite way to ask for the bill.',
      wordTexts: ['berapa', 'total'],
    },
    {
      id: 'f1000000-0023-4000-8000-000000000004',
      text_target: 'Ini kembaliannya',
      text_en: "Here's the change",
      literal_translation: 'This change-its',
      usage_note:
        'The cashier says this when giving you change. "Kembalian" = change (money returned).',
      wordTexts: ['ini', 'kembalian'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0023-4000-8000-000000000001',
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
      pattern_template: 'Semua + number',
      pattern_en: 'All together + number',
      explanation:
        '"Semua" means "all" or "altogether". Used to state a total price.',
      prompt: '___ empat puluh lima ribu.',
      hint_en: 'Forty-five thousand altogether.',
      correct_answer: 'Semua',
      distractors: ['Total', 'Berapa', 'Ada'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000196', text: 'semua', meaning_en: 'all', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000197', text: 'total', meaning_en: 'total', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000198', text: 'kembalian', meaning_en: 'change (money)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000199', text: 'kartu', meaning_en: 'card', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000200', text: 'tunai', meaning_en: 'cash', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000201', text: 'struk', meaning_en: 'receipt', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000202', text: 'botol', meaning_en: 'bottle', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000203', text: 'sabun', meaning_en: 'soap', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000204', text: 'pasta gigi', meaning_en: 'toothpaste', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000205', text: 'sikat gigi', meaning_en: 'toothbrush', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000206', text: 'tisu', meaning_en: 'tissue', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000207', text: 'juta', meaning_en: 'million', part_of_speech: 'numeral' },
  ],
  existingWordTexts: [
    'berapa', 'bayar', 'uang', 'satu', 'dua', 'mau', 'terima kasih', 'ada', 'bisa',
    'ini', 'tidak', 'empat', 'lima', 'puluh', 'air putih', 'sore',
    // From scene 4.2:
    'kantong', 'ribu',
    // From scene 4.3:
    'pakai',
  ],
};

// ── Scene 4.5: Tukar Uang (Exchanging Money) ────────────────────────

const scene4_5: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000024',
  title: 'Tukar Uang (Exchanging Money)',
  description: 'Exchanging foreign currency',
  scene_context:
    'You need to exchange dollars for rupiah at a money changer. Practice large numbers and comparing rates.',
  sort_order: 20,
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
      text_en: 'Okay. Today\'s rate is fifteen thousand three hundred.',
    },
    {
      id: 'e1000000-0024-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Lebih tinggi dari kemarin?',
      text_en: 'Higher than yesterday?',
    },
    {
      id: 'e1000000-0024-4000-8000-000000000004',
      speaker: 'Pegawai',
      text_target: 'Ya, lebih tinggi sedikit. Mau tukar berapa?',
      text_en: 'Yes, a little higher. How much do you want to exchange?',
    },
    {
      id: 'e1000000-0024-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Saya butuh dua juta rupiah. Cukup satu ratus dolar?',
      text_en: 'I need two million rupiah. Is one hundred dollars enough?',
    },
    {
      id: 'e1000000-0024-4000-8000-000000000006',
      speaker: 'Pegawai',
      text_target: 'Cukup! Ini rupiah dan ini sisa dolarnya.',
      text_en: 'Enough! Here is the rupiah and here is the remaining dollars.',
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
      wordTexts: ['tukar', 'dolar', 'rupiah'],
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
      text_target: 'Saya butuh rupiah',
      text_en: 'I need rupiah',
      literal_translation: 'I need rupiah',
      usage_note:
        '"Butuh" is an informal way to say "need". More casual than "perlu".',
      wordTexts: ['saya', 'butuh', 'rupiah'],
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
      pattern_template: 'Berapa + kurs',
      pattern_en: 'What is the + rate',
      explanation:
        '"Berapa" + a financial term asks for a number. "Berapa kurs?" = What is the rate?',
      prompt: 'Kurs hari ini ___?',
      hint_en: "What's today's rate?",
      correct_answer: 'berapa',
      distractors: ['apa', 'mana', 'siapa'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000208', text: 'tukar', meaning_en: 'to exchange', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000209', text: 'kurs', meaning_en: 'exchange rate', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000210', text: 'dolar', meaning_en: 'dollar', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000211', text: 'lebih', meaning_en: 'more / -er (comparative)', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000212', text: 'paling', meaning_en: 'most / -est (superlative)', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000213', text: 'tinggi', meaning_en: 'high / tall', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000214', text: 'rendah', meaning_en: 'low', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000215', text: 'butuh', meaning_en: 'to need (informal)', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000216', text: 'cukup', meaning_en: 'enough', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000217', text: 'sisa', meaning_en: 'remaining / leftover', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000218', text: 'rupiah', meaning_en: 'rupiah (currency)', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000219', text: 'tarik', meaning_en: 'to pull / withdraw', part_of_speech: 'verb' },
  ],
  existingWordTexts: [
    'uang', 'berapa', 'mau', 'saya', 'bisa', 'ada', 'baik', 'terima kasih',
    'tapi', 'atau', 'sedikit', 'ke', 'ini', 'dua',
    // From scene 4.2:
    'ribu', 'ratus',
    // From scene 4.4:
    'juta', 'tunai',
  ],
};

export const UNIT4_SCENES: DialogueSceneData[] = [scene4_2, scene4_3, scene4_4, scene4_5];
