// Unit 2: Getting Around — Indonesian language learning scene data.
// Covers taking taxis, numbers, motorbike taxis, riding, walking around,
// position words, telling time, and buying bus tickets.
// Each original scene has been split into two scenes of 6-7 words each.

import type { DialogueSceneData } from '../../dialogue-data';

// ── Scene 2.2a: Naik Taksi (Taking a Taxi) ──────────────────────────

const scene2_2a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000014',
  title: 'Naik Taksi (Taking a Taxi)',
  description: 'Hailing a taxi and negotiating the fare',
  scene_context:
    'You need to get from the airport to your hotel in Ubud. You hail a taxi and negotiate with the driver. Practice stating destinations, discussing prices, and giving simple instructions.',
  sort_order: 7,
  dialogues: [
    {
      id: 'e1000000-0014-4000-8000-000000000001',
      speaker: 'Supir',
      text_target: 'Mau ke mana? Naik taksi?',
      text_en: 'Where do you want to go? Take a taxi?',
    },
    {
      id: 'e1000000-0014-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Saya mau ke Ubud. Berapa ke Ubud?',
      text_en: 'I want to go to Ubud. How much to Ubud?',
    },
    {
      id: 'e1000000-0014-4000-8000-000000000003',
      speaker: 'Supir',
      text_target: 'Lima puluh ribu. Cepat sampai!',
      text_en: 'Fifty thousand. We will arrive fast!',
    },
    {
      id: 'e1000000-0014-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Terlalu mahal! Tolong pelan, ya.',
      text_en: 'Too expensive! Please go slow, okay.',
    },
    {
      id: 'e1000000-0014-4000-8000-000000000005',
      speaker: 'Supir',
      text_target: 'Baik. Berhenti di sini atau di sana?',
      text_en: 'Okay. Stop here or over there?',
    },
    {
      id: 'e1000000-0014-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Berhenti di sini. Terima kasih!',
      text_en: 'Stop here. Thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0014-4000-8000-000000000001',
      text_target: 'Naik taksi',
      text_en: 'Take a taxi',
      literal_translation: 'Ride taxi',
      usage_note:
        '"Naik" means "to ride" or "to get on". Use it with any vehicle: naik taksi, naik bus, naik motor.',
      wordTexts: ['naik', 'taksi'],
    },
    {
      id: 'f1000000-0014-4000-8000-000000000002',
      text_target: 'Berapa ke Ubud?',
      text_en: 'How much to Ubud?',
      literal_translation: 'How much to Ubud?',
      usage_note:
        'Quick way to ask the fare. "Berapa" + "ke" + destination.',
      wordTexts: ['berapa', 'ke'],
    },
    {
      id: 'f1000000-0014-4000-8000-000000000003',
      text_target: 'Terlalu mahal',
      text_en: 'Too expensive',
      literal_translation: 'Too expensive',
      usage_note:
        'Essential for bargaining with taxi drivers. Follow up with your counter-offer.',
      wordTexts: ['mahal'],
    },
    {
      id: 'f1000000-0014-4000-8000-000000000004',
      text_target: 'Berhenti di sini',
      text_en: 'Stop here',
      literal_translation: 'Stop at here',
      usage_note:
        'Tell the driver where to stop. "Di sini" means "here", "di sana" means "over there".',
      wordTexts: ['berhenti', 'di sini'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0014-4000-8000-000000000001',
      pattern_template: 'Naik + vehicle',
      pattern_en: 'Ride / take + vehicle',
      explanation:
        '"Naik" means "to ride" or "to get on". Place the vehicle after it: "naik taksi", "naik bus".',
      prompt: '___ taksi ke Ubud.',
      hint_en: 'Take a taxi to Ubud.',
      correct_answer: 'Naik',
      distractors: ['Berhenti', 'Cepat', 'Mau'],
    },
    {
      id: '0a000000-0014-4000-8000-000000000002',
      pattern_template: 'Berhenti di + location',
      pattern_en: 'Stop at + location',
      explanation:
        '"Berhenti" means "to stop". Combine with "di" + location to say where to stop.',
      prompt: '___ di sini.',
      hint_en: 'Stop here.',
      correct_answer: 'Berhenti',
      distractors: ['Belok', 'Naik', 'Cepat'],
    },
    {
      id: '0a000000-0014-4000-8000-000000000003',
      pattern_template: 'Cepat vs. Pelan',
      pattern_en: 'Fast vs. Slow',
      explanation:
        '"Cepat" means "fast" and "pelan" means "slow". Use to describe speed: "Tolong pelan" = "Please go slow".',
      prompt: 'Tolong ___. Jangan cepat!',
      hint_en: 'Please go slow. Do not go fast!',
      correct_answer: 'pelan',
      distractors: ['cepat', 'berhenti', 'naik'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000074', text: 'naik', meaning_en: 'to ride / go up', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000075', text: 'taksi', meaning_en: 'taxi', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000076', text: 'berhenti', meaning_en: 'to stop', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000077', text: 'di sini', meaning_en: 'here', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000078', text: 'di sana', meaning_en: 'there (over there)', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000079', text: 'cepat', meaning_en: 'fast', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000080', text: 'pelan', meaning_en: 'slow', part_of_speech: 'adjective' },
  ],
  existingWordTexts: ['ke', 'mau', 'berapa', 'saya', 'tolong', 'mahal', 'baik', 'terima kasih'],
};

// ── Scene 2.2b: Angka dan Kata (Numbers & Words) ────────────────────

const scene2_2b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000034',
  title: 'Angka dan Kata (Numbers & Words)',
  description: 'Informal pronouns, conjunctions, and counting to fifty',
  scene_context:
    'You chat with your Grab driver on the way to Ubud. He teaches you numbers and casual pronouns. Practice informal speech and counting in tens.',
  sort_order: 8,
  dialogues: [
    {
      id: 'e1000000-0034-4000-8000-000000000001',
      speaker: 'Supir',
      text_target: 'Kamu dari mana?',
      text_en: 'Where are you from?',
    },
    {
      id: 'e1000000-0034-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Aku dari Australia. Mau ke Ubud.',
      text_en: 'I am from Australia. I want to go to Ubud.',
    },
    {
      id: 'e1000000-0034-4000-8000-000000000003',
      speaker: 'Supir',
      text_target: 'Bagus! Empat puluh menit, atau lima puluh kalau macet.',
      text_en: 'Great! Forty minutes, or fifty if there is traffic.',
    },
    {
      id: 'e1000000-0034-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Empat puluh, baik. Tapi jangan cepat ya!',
      text_en: 'Forty, okay. But do not go fast, okay!',
    },
    {
      id: 'e1000000-0034-4000-8000-000000000005',
      speaker: 'Supir',
      text_target: 'Tenang! Aku bawa pelan. Kamu naik taksi atau ojek di sini?',
      text_en: 'Relax! I will drive slow. Do you take taxis or ojeks here?',
    },
    {
      id: 'e1000000-0034-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Taksi, tapi aku mau coba naik ojek juga. Terima kasih!',
      text_en: 'Taxi, but I want to try riding an ojek too. Thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0034-4000-8000-000000000001',
      text_target: 'Kamu dari mana?',
      text_en: 'Where are you from?',
      literal_translation: 'You from where?',
      usage_note:
        '"Kamu" is the informal "you". Use with friends or people your age. "Anda" is more formal.',
      wordTexts: ['kamu'],
    },
    {
      id: 'f1000000-0034-4000-8000-000000000002',
      text_target: 'Aku mau ke Ubud',
      text_en: 'I want to go to Ubud',
      literal_translation: 'I want to Ubud',
      usage_note:
        '"Aku" is the informal "I". "Saya" is more polite. Both are correct; "aku" sounds friendlier.',
      wordTexts: ['aku', 'mau'],
    },
    {
      id: 'f1000000-0034-4000-8000-000000000003',
      text_target: 'Empat puluh menit',
      text_en: 'Forty minutes',
      literal_translation: 'Four ten minutes',
      usage_note:
        'Indonesian builds tens by combining a digit + "puluh". Four-tens = forty.',
      wordTexts: ['empat', 'puluh'],
    },
    {
      id: 'f1000000-0034-4000-8000-000000000004',
      text_target: 'Taksi atau ojek?',
      text_en: 'Taxi or ojek?',
      literal_translation: 'Taxi or ojek?',
      usage_note:
        '"Atau" means "or". "Tapi" means "but". These two conjunctions appear constantly in conversation.',
      wordTexts: ['taksi', 'atau'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0034-4000-8000-000000000001',
      pattern_template: 'Kamu / Aku (informal pronouns)',
      pattern_en: 'You / I (informal)',
      explanation:
        '"Kamu" is informal "you" (vs. formal "Anda"). "Aku" is informal "I" (vs. polite "saya"). Use with friends and peers.',
      prompt: '___ dari mana?',
      hint_en: 'Where are you from? (informal)',
      correct_answer: 'Kamu',
      distractors: ['Saya', 'Aku', 'Dia'],
    },
    {
      id: '0a000000-0034-4000-8000-000000000002',
      pattern_template: 'digit + puluh = tens',
      pattern_en: 'digit + tens = number',
      explanation:
        'Indonesian tens are formed by digit + "puluh". Empat puluh = 40, lima puluh = 50. Simple and regular!',
      prompt: 'Lima ___ = 50.',
      hint_en: 'Five tens = 50.',
      correct_answer: 'puluh',
      distractors: ['ribu', 'ratus', 'belas'],
    },
    {
      id: '0a000000-0034-4000-8000-000000000003',
      pattern_template: 'A tapi B / A atau B',
      pattern_en: 'A but B / A or B',
      explanation:
        '"Tapi" means "but" and "atau" means "or". They connect two ideas or choices.',
      prompt: 'Taksi ___ ojek?',
      hint_en: 'Taxi or ojek?',
      correct_answer: 'atau',
      distractors: ['tapi', 'dan', 'ke'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000081', text: 'kamu', meaning_en: 'you (informal)', part_of_speech: 'pronoun' },
    { id: 'b1000000-0001-4000-8000-000000000082', text: 'aku', meaning_en: 'I (informal)', part_of_speech: 'pronoun' },
    { id: 'b1000000-0001-4000-8000-000000000083', text: 'tapi', meaning_en: 'but', part_of_speech: 'conjunction' },
    { id: 'b1000000-0001-4000-8000-000000000084', text: 'atau', meaning_en: 'or', part_of_speech: 'conjunction' },
    { id: 'b1000000-0001-4000-8000-000000000085', text: 'empat', meaning_en: 'four', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000086', text: 'lima', meaning_en: 'five', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000087', text: 'puluh', meaning_en: 'tens (multiplier)', part_of_speech: 'numeral' },
  ],
  existingWordTexts: ['ke', 'mau', 'saya', 'baik', 'terima kasih', 'satu', 'dua', 'tiga', 'naik', 'taksi', 'di sini'],
};

// ── Scene 2.3a: Pesan Ojek (Ordering an Ojek) ──────────────────────

const scene2_3a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000015',
  title: 'Pesan Ojek (Ordering an Ojek)',
  description: 'Ordering a Grab or Gojek and confirming the pickup',
  scene_context:
    'You order a Grab motorbike on your phone. The driver calls and you confirm your pickup spot. Practice waiting, confirming readiness, and motorbike vocabulary.',
  sort_order: 9,
  dialogues: [
    {
      id: 'e1000000-0015-4000-8000-000000000001',
      speaker: 'Supir',
      text_target: 'Halo, saya supir Grab. Kamu di mana?',
      text_en: 'Hello, I am the Grab driver. Where are you?',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Di sini, di depan toko. Tunggu sebentar, ya.',
      text_en: 'Here, in front of the shop. Wait a moment, okay.',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000003',
      speaker: 'Supir',
      text_target: 'Siap. Saya tunggu di sana.',
      text_en: 'Ready. I will wait over there.',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Sudah siap! Itu motor kamu?',
      text_en: 'I am ready! Is that your motorbike?',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000005',
      speaker: 'Supir',
      text_target: 'Ya, ini motor saya. Ini helm untuk kamu.',
      text_en: 'Yes, this is my motorbike. Here is a helmet for you.',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Terima kasih. Tolong pelan-pelan ya!',
      text_en: 'Thank you. Please go slowly, okay!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0015-4000-8000-000000000001',
      text_target: 'Tunggu sebentar',
      text_en: 'Wait a moment',
      literal_translation: 'Wait a moment',
      usage_note:
        'A very common phrase. Use when you need someone to wait briefly.',
      wordTexts: ['tunggu', 'sebentar'],
    },
    {
      id: 'f1000000-0015-4000-8000-000000000002',
      text_target: 'Sudah siap',
      text_en: 'Already ready',
      literal_translation: 'Already ready',
      usage_note:
        '"Sudah" means "already" and indicates a completed state. "Siap" means "ready".',
      wordTexts: ['siap'],
    },
    {
      id: 'f1000000-0015-4000-8000-000000000003',
      text_target: 'Pelan-pelan ya',
      text_en: 'Slowly, okay?',
      literal_translation: 'Slow-slow okay?',
      usage_note:
        'Repeating a word intensifies or softens it. "Pelan-pelan" = gently/slowly. Very useful on motorbikes!',
      wordTexts: ['pelan-pelan'],
    },
    {
      id: 'f1000000-0015-4000-8000-000000000004',
      text_target: 'Ini helm untuk kamu',
      text_en: 'Here is a helmet for you',
      literal_translation: 'This helmet for you',
      usage_note:
        '"Helm" is borrowed from Dutch. Always wear one when riding a motor in Indonesia!',
      wordTexts: ['helm'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0015-4000-8000-000000000001',
      pattern_template: 'Tunggu + sebentar',
      pattern_en: 'Wait + a moment',
      explanation:
        '"Tunggu" means "to wait". "Sebentar" means "a moment". Together they form a polite request.',
      prompt: '___ sebentar.',
      hint_en: 'Wait a moment.',
      correct_answer: 'Tunggu',
      distractors: ['Berhenti', 'Naik', 'Duduk'],
    },
    {
      id: '0a000000-0015-4000-8000-000000000002',
      pattern_template: 'Sudah + adjective',
      pattern_en: 'Already + adjective',
      explanation:
        '"Sudah" before an adjective means that state has been reached. "Sudah siap" = "already ready".',
      prompt: 'Sudah ___.',
      hint_en: 'Already ready.',
      correct_answer: 'siap',
      distractors: ['cepat', 'pelan', 'besar'],
    },
    {
      id: '0a000000-0015-4000-8000-000000000003',
      pattern_template: 'Ini + noun + untuk kamu',
      pattern_en: 'Here is + noun + for you',
      explanation:
        '"Ini" means "this". Follow with a noun and "untuk kamu" to offer something to someone.',
      prompt: 'Ini ___ untuk kamu.',
      hint_en: 'Here is a helmet for you.',
      correct_answer: 'helm',
      distractors: ['motor', 'taksi', 'tiket'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000088', text: 'tunggu', meaning_en: 'to wait', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000089', text: 'sebentar', meaning_en: 'a moment', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000090', text: 'siap', meaning_en: 'ready', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000091', text: 'motor', meaning_en: 'motorbike', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000092', text: 'helm', meaning_en: 'helmet', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000093', text: 'pelan-pelan', meaning_en: 'slowly', part_of_speech: 'adverb' },
  ],
  existingWordTexts: ['di sini', 'di sana', 'sudah', 'kamu', 'ya', 'tolong', 'terima kasih'],
};

// ── Scene 2.3b: Di Atas Motor (On the Motorcycle) ───────────────────

const scene2_3b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000035',
  title: 'Di Atas Motor (On the Motorcycle)',
  description: 'Riding a motorbike, giving directions, and position words',
  scene_context:
    'You are on the back of the ojek heading to your hotel. You give the driver directions and learn position words. Practice careful riding instructions and spatial vocabulary.',
  sort_order: 10,
  dialogues: [
    {
      id: 'e1000000-0035-4000-8000-000000000001',
      speaker: 'Supir',
      text_target: 'Siap! Duduk di belakang ya. Hati-hati!',
      text_en: 'Ready! Sit in the back, okay. Be careful!',
    },
    {
      id: 'e1000000-0035-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Siap. Tolong pelan-pelan, ya. Hati-hati di jalan!',
      text_en: 'Ready. Please go slowly, okay. Be careful on the road!',
    },
    {
      id: 'e1000000-0035-4000-8000-000000000003',
      speaker: 'Supir',
      text_target: 'Bawa helm, ya. Hotel di depan atau di belakang?',
      text_en: 'Bring the helmet, okay. Is the hotel in front or behind?',
    },
    {
      id: 'e1000000-0035-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Di depan, dekat pintu besar.',
      text_en: 'In front, near the big gate.',
    },
    {
      id: 'e1000000-0035-4000-8000-000000000005',
      speaker: 'Supir',
      text_target: 'Yang di depan pintu itu? Sudah sampai!',
      text_en: 'The one in front of that gate? We have arrived!',
    },
    {
      id: 'e1000000-0035-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Ya, di sini. Terima kasih! Hati-hati pulang!',
      text_en: 'Yes, here. Thank you! Be careful going home!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0035-4000-8000-000000000001',
      text_target: 'Hati-hati!',
      text_en: 'Be careful!',
      literal_translation: 'Heart-heart!',
      usage_note:
        '"Hati" means "heart" or "liver". Repeating it means "be careful" — one of the most common Indonesian expressions.',
      wordTexts: ['hati-hati'],
    },
    {
      id: 'f1000000-0035-4000-8000-000000000002',
      text_target: 'Duduk di belakang',
      text_en: 'Sit in the back',
      literal_translation: 'Sit at behind',
      usage_note:
        '"Duduk" means "to sit". On a motorbike, passengers always sit "di belakang" (in the back).',
      wordTexts: ['duduk', 'di belakang'],
    },
    {
      id: 'f1000000-0035-4000-8000-000000000003',
      text_target: 'Bawa helm',
      text_en: 'Bring a helmet',
      literal_translation: 'Bring helmet',
      usage_note:
        '"Bawa" means "to bring" or "to carry". It is also used for driving: "bawa motor" = to drive a motorbike.',
      wordTexts: ['bawa', 'helm'],
    },
    {
      id: 'f1000000-0035-4000-8000-000000000004',
      text_target: 'Di depan pintu',
      text_en: 'In front of the door/gate',
      literal_translation: 'At front door',
      usage_note:
        '"Di depan" means "in front of". Use it with a landmark to describe your location.',
      wordTexts: ['di depan', 'pintu'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0035-4000-8000-000000000001',
      pattern_template: 'Hati-hati + context',
      pattern_en: 'Be careful + context',
      explanation:
        '"Hati-hati" is used to warn someone to be careful. Can stand alone or be followed by context like "di jalan" (on the road).',
      prompt: '___! Jalan licin.',
      hint_en: 'Be careful! The road is slippery.',
      correct_answer: 'Hati-hati',
      distractors: ['Pelan-pelan', 'Tunggu', 'Berhenti'],
    },
    {
      id: '0a000000-0035-4000-8000-000000000002',
      pattern_template: 'Di depan / di belakang + noun',
      pattern_en: 'In front of / behind + noun',
      explanation:
        '"Di depan" = in front of, "di belakang" = behind. Follow with a noun to describe position.',
      prompt: 'Duduk di ___ ya.',
      hint_en: 'Sit in the back, okay.',
      correct_answer: 'belakang',
      distractors: ['depan', 'samping', 'sini'],
    },
    {
      id: '0a000000-0035-4000-8000-000000000003',
      pattern_template: 'Bawa + noun',
      pattern_en: 'Bring / carry + noun',
      explanation:
        '"Bawa" means "to bring" or "to carry". Also used informally for driving: "bawa motor" = drive a motorbike.',
      prompt: '___ helm, ya.',
      hint_en: 'Bring the helmet, okay.',
      correct_answer: 'Bawa',
      distractors: ['Naik', 'Duduk', 'Tunggu'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000094', text: 'hati-hati', meaning_en: 'be careful', part_of_speech: 'interjection' },
    { id: 'b1000000-0001-4000-8000-000000000095', text: 'bawa', meaning_en: 'to bring / carry', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000096', text: 'duduk', meaning_en: 'to sit', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000097', text: 'di depan', meaning_en: 'in front of', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000098', text: 'di belakang', meaning_en: 'behind', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000099', text: 'pintu', meaning_en: 'door / gate', part_of_speech: 'noun' },
  ],
  existingWordTexts: ['di sini', 'sudah', 'naik', 'cepat', 'pelan', 'ya', 'tolong', 'motor', 'helm', 'pelan-pelan', 'siap'],
};

// ── Scene 2.4a: Tempat di Kota (Places in Town) ─────────────────────

const scene2_4a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000016',
  title: 'Tempat di Kota (Places in Town)',
  description: 'Learning place vocabulary and landmarks around town',
  scene_context:
    'You are walking around Ubud and want to find interesting places. You ask a local shopkeeper about what is nearby. Practice place vocabulary and asking where things are.',
  sort_order: 11,
  dialogues: [
    {
      id: 'e1000000-0016-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, ada restoran di dekat sini?',
      text_en: 'Excuse me, is there a restaurant nearby?',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000002',
      speaker: 'Warga',
      text_target: 'Ada! Restoran Bali dekat toko saya.',
      text_en: 'There is! Bali Restaurant is near my shop.',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Baik, terima kasih. Saya juga cari bank.',
      text_en: 'Okay, thank you. I am also looking for a bank.',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000004',
      speaker: 'Warga',
      text_target: 'Bank ada di dekat masjid. Gereja juga dekat.',
      text_en: 'The bank is near the mosque. The church is also close.',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Ada pantai di dekat sini?',
      text_en: 'Is there a beach nearby?',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000006',
      speaker: 'Warga',
      text_target: 'Pantai jauh. Toko, restoran, bank — semua di sini.',
      text_en: 'The beach is far. Shops, restaurants, banks — all are here.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0016-4000-8000-000000000001',
      text_target: 'Ada restoran di dekat sini?',
      text_en: 'Is there a restaurant nearby?',
      literal_translation: 'Exist restaurant at near here?',
      usage_note:
        '"Ada" + noun + "di dekat sini?" is the pattern for asking if something exists nearby.',
      wordTexts: ['ada', 'restoran', 'dekat', 'di sini'],
    },
    {
      id: 'f1000000-0016-4000-8000-000000000002',
      text_target: 'Dekat toko saya',
      text_en: 'Near my shop',
      literal_translation: 'Near shop I',
      usage_note:
        '"Dekat" means "near" or "close to". Use it with a landmark to describe location.',
      wordTexts: ['dekat', 'toko', 'saya'],
    },
    {
      id: 'f1000000-0016-4000-8000-000000000003',
      text_target: 'Saya cari bank',
      text_en: 'I am looking for a bank',
      literal_translation: 'I search bank',
      usage_note:
        '"Cari" means "to look for". Use it when you need to find something.',
      wordTexts: ['saya', 'cari', 'bank'],
    },
    {
      id: 'f1000000-0016-4000-8000-000000000004',
      text_target: 'Dekat masjid dan gereja',
      text_en: 'Near the mosque and church',
      literal_translation: 'Near mosque and church',
      usage_note:
        'Indonesia has many religions. Mosques (masjid) and churches (gereja) are common landmarks for directions.',
      wordTexts: ['masjid', 'gereja'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0016-4000-8000-000000000001',
      pattern_template: 'Ada + noun + di dekat sini?',
      pattern_en: 'Is there + noun + nearby?',
      explanation:
        '"Ada" means "there is". Add a noun and "di dekat sini" (nearby) to ask if something exists close by.',
      prompt: '___ restoran di dekat sini?',
      hint_en: 'Is there a restaurant nearby?',
      correct_answer: 'Ada',
      distractors: ['Ini', 'Itu', 'Mau'],
    },
    {
      id: '0a000000-0016-4000-8000-000000000002',
      pattern_template: 'noun + dekat + landmark',
      pattern_en: 'noun + near + landmark',
      explanation:
        '"Dekat" means "near". Place it between two nouns to say one thing is near another.',
      prompt: 'Bank ___ masjid.',
      hint_en: 'The bank is near the mosque.',
      correct_answer: 'dekat',
      distractors: ['ada', 'di', 'ke'],
    },
    {
      id: '0a000000-0016-4000-8000-000000000003',
      pattern_template: 'Cari + noun',
      pattern_en: 'Looking for + noun',
      explanation:
        '"Cari" means "to look for". Follow with what you need to find.',
      prompt: 'Saya ___ bank.',
      hint_en: 'I am looking for a bank.',
      correct_answer: 'cari',
      distractors: ['mau', 'ada', 'suka'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000100', text: 'toko', meaning_en: 'shop / store', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000101', text: 'restoran', meaning_en: 'restaurant', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000102', text: 'pantai', meaning_en: 'beach', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000103', text: 'masjid', meaning_en: 'mosque', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000104', text: 'gereja', meaning_en: 'church', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000105', text: 'bank', meaning_en: 'bank', part_of_speech: 'noun' },
  ],
  existingWordTexts: ['ada', 'dekat', 'di sini', 'permisi', 'saya', 'baik', 'terima kasih', 'juga', 'cari'],
};

// ── Scene 2.4b: Di Mana Posisinya? (Position Words) ─────────────────

const scene2_4b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000036',
  title: 'Di Mana Posisinya? (Position Words)',
  description: 'Spatial prepositions and giving detailed directions',
  scene_context:
    'You are trying to find the bank near the market. A helpful local gives you detailed directions using position words. Practice spatial vocabulary and prepositions.',
  sort_order: 12,
  dialogues: [
    {
      id: 'e1000000-0036-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, saya cari bank. Ada di dekat sini?',
      text_en: 'Excuse me, I am looking for a bank. Is it nearby?',
    },
    {
      id: 'e1000000-0036-4000-8000-000000000002',
      speaker: 'Warga',
      text_target: 'Ada! Bank di samping restoran, di seberang toko.',
      text_en: 'There is! The bank is next to the restaurant, across from the shop.',
    },
    {
      id: 'e1000000-0036-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Di samping restoran? Yang di atas atau di bawah?',
      text_en: 'Next to the restaurant? The one upstairs or downstairs?',
    },
    {
      id: 'e1000000-0036-4000-8000-000000000004',
      speaker: 'Warga',
      text_target: 'Di bawah. Di antara restoran dan toko.',
      text_en: 'Downstairs. Between the restaurant and the shop.',
    },
    {
      id: 'e1000000-0036-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Jadi di seberang jalan, lurus di depan?',
      text_en: 'So across the road, straight ahead?',
    },
    {
      id: 'e1000000-0036-4000-8000-000000000006',
      speaker: 'Warga',
      text_target: 'Ya, lurus. Bank di kiri, di antara dua toko.',
      text_en: 'Yes, straight. The bank is on the left, between two shops.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0036-4000-8000-000000000001',
      text_target: 'Di samping restoran',
      text_en: 'Next to the restaurant',
      literal_translation: 'At beside restaurant',
      usage_note:
        '"Di samping" means "next to" or "beside". Use with a landmark to describe location.',
      wordTexts: ['di samping', 'restoran'],
    },
    {
      id: 'f1000000-0036-4000-8000-000000000002',
      text_target: 'Di seberang toko',
      text_en: 'Across from the shop',
      literal_translation: 'At across shop',
      usage_note:
        '"Di seberang" means "across from" or "opposite". Very useful for giving directions.',
      wordTexts: ['seberang', 'toko'],
    },
    {
      id: 'f1000000-0036-4000-8000-000000000003',
      text_target: 'Di antara restoran dan toko',
      text_en: 'Between the restaurant and the shop',
      literal_translation: 'At between restaurant and shop',
      usage_note:
        '"Di antara" means "between". Use it when something is located between two landmarks.',
      wordTexts: ['di antara', 'restoran', 'toko'],
    },
    {
      id: 'f1000000-0036-4000-8000-000000000004',
      text_target: 'Di atas dan di bawah',
      text_en: 'Above and below',
      literal_translation: 'At above and at below',
      usage_note:
        '"Atas" = above/up, "bawah" = below/down. Also used for upstairs/downstairs.',
      wordTexts: ['atas', 'bawah'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0036-4000-8000-000000000001',
      pattern_template: 'Di samping / di seberang + noun',
      pattern_en: 'Next to / across from + noun',
      explanation:
        '"Di samping" = next to, "di seberang" = across from. Follow with a landmark noun.',
      prompt: 'Bank di ___ restoran.',
      hint_en: 'The bank is next to the restaurant.',
      correct_answer: 'samping',
      distractors: ['depan', 'belakang', 'atas'],
    },
    {
      id: '0a000000-0036-4000-8000-000000000002',
      pattern_template: 'Di antara + A + dan + B',
      pattern_en: 'Between + A + and + B',
      explanation:
        '"Di antara" means "between". Follow with two nouns connected by "dan" (and).',
      prompt: 'Di ___ restoran dan toko.',
      hint_en: 'Between the restaurant and the shop.',
      correct_answer: 'antara',
      distractors: ['samping', 'depan', 'seberang'],
    },
    {
      id: '0a000000-0036-4000-8000-000000000003',
      pattern_template: 'Di atas / di bawah',
      pattern_en: 'Above / below (upstairs / downstairs)',
      explanation:
        '"Atas" = above/up, "bawah" = below/down. Used for floors, position, and general direction.',
      prompt: 'Restoran di ___. Bank di atas.',
      hint_en: 'The restaurant is downstairs. The bank is upstairs.',
      correct_answer: 'bawah',
      distractors: ['atas', 'depan', 'samping'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000106', text: 'di samping', meaning_en: 'beside / next to', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000107', text: 'di antara', meaning_en: 'between', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000108', text: 'atas', meaning_en: 'above / up', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000109', text: 'bawah', meaning_en: 'below / down', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000110', text: 'seberang', meaning_en: 'across / opposite', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000111', text: 'cari', meaning_en: 'to look for / search', part_of_speech: 'verb' },
  ],
  existingWordTexts: ['ada', 'dekat', 'di sini', 'di depan', 'di belakang', 'kiri', 'kanan', 'lurus', 'toko', 'restoran', 'bank'],
};

// ── Scene 2.5a: Jam Berapa? (What Time?) ────────────────────────────

const scene2_5a: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000017',
  title: 'Jam Berapa? (What Time?)',
  description: 'Telling time and clock vocabulary',
  scene_context:
    'You are at your guesthouse and want to arrange activities for the day. You ask the receptionist about times. Practice telling time and using numbers with "jam".',
  sort_order: 13,
  dialogues: [
    {
      id: 'e1000000-0017-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, sekarang jam berapa?',
      text_en: 'Excuse me, what time is it now?',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000002',
      speaker: 'Resepsionis',
      text_target: 'Sekarang jam tujuh setengah.',
      text_en: 'Now it is seven thirty.',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Kapan sarapan? Jam berapa?',
      text_en: 'When is breakfast? What time?',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000004',
      speaker: 'Resepsionis',
      text_target: 'Sarapan jam tujuh sampai jam delapan.',
      text_en: 'Breakfast is from seven to eight.',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Baik! Saya mau sarapan jam tujuh. Kapan tutup?',
      text_en: 'Okay! I want breakfast at seven. When does it close?',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000006',
      speaker: 'Resepsionis',
      text_target: 'Tutup jam delapan setengah. Masih ada waktu!',
      text_en: 'It closes at eight thirty. There is still time!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0017-4000-8000-000000000001',
      text_target: 'Jam berapa?',
      text_en: 'What time?',
      literal_translation: 'Hour how much?',
      usage_note:
        '"Jam" means "hour/clock". "Jam berapa?" asks for a specific time.',
      wordTexts: ['jam', 'berapa'],
    },
    {
      id: 'f1000000-0017-4000-8000-000000000002',
      text_target: 'Kapan sarapan?',
      text_en: 'When is breakfast?',
      literal_translation: 'When breakfast?',
      usage_note:
        '"Kapan" means "when". Use it to ask about schedules and timing.',
      wordTexts: ['kapan'],
    },
    {
      id: 'f1000000-0017-4000-8000-000000000003',
      text_target: 'Jam tujuh setengah',
      text_en: 'Seven thirty',
      literal_translation: 'Hour seven half',
      usage_note:
        '"Setengah" means "half". "Jam tujuh setengah" = 7:30. Simple and logical!',
      wordTexts: ['jam', 'tujuh', 'setengah'],
    },
    {
      id: 'f1000000-0017-4000-8000-000000000004',
      text_target: 'Jam enam sampai jam delapan',
      text_en: 'From six to eight',
      literal_translation: 'Hour six until hour eight',
      usage_note:
        'Use "sampai" between two times to express a range. "Jam enam sampai jam delapan" = from 6 to 8.',
      wordTexts: ['jam', 'enam', 'delapan'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0017-4000-8000-000000000001',
      pattern_template: 'Kapan + noun/verb?',
      pattern_en: 'When + noun/verb?',
      explanation:
        '"Kapan" asks "when". Follow with a verb or noun to ask when something happens.',
      prompt: '___ sarapan?',
      hint_en: 'When is breakfast?',
      correct_answer: 'Kapan',
      distractors: ['Berapa', 'Apa', 'Di mana'],
    },
    {
      id: '0a000000-0017-4000-8000-000000000002',
      pattern_template: 'Jam + number',
      pattern_en: 'At + number + o\'clock',
      explanation:
        '"Jam" + a number tells the time. "Jam delapan" = "eight o\'clock". Add "setengah" for half past.',
      prompt: '___ delapan.',
      hint_en: 'At eight o\'clock.',
      correct_answer: 'Jam',
      distractors: ['Kapan', 'Berapa', 'Satu'],
    },
    {
      id: '0a000000-0017-4000-8000-000000000003',
      pattern_template: 'Jam + number + setengah',
      pattern_en: 'Number + thirty (half past)',
      explanation:
        '"Setengah" means "half". Add it after the hour number for :30. "Jam tujuh setengah" = 7:30.',
      prompt: 'Jam tujuh ___.',
      hint_en: 'Seven thirty.',
      correct_answer: 'setengah',
      distractors: ['puluh', 'delapan', 'enam'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000112', text: 'kapan', meaning_en: 'when', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000113', text: 'jam', meaning_en: 'hour / clock / o\'clock', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000114', text: 'setengah', meaning_en: 'half', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000115', text: 'enam', meaning_en: 'six', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000116', text: 'tujuh', meaning_en: 'seven', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000117', text: 'delapan', meaning_en: 'eight', part_of_speech: 'numeral' },
  ],
  existingWordTexts: ['berapa', 'satu', 'dua', 'tiga', 'empat', 'lima', 'sekarang', 'saya', 'mau'],
};

// ── Scene 2.5b: Tiket Bus (Bus Ticket) ──────────────────────────────

const scene2_5b: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000037',
  title: 'Tiket Bus (Bus Ticket)',
  description: 'Buying bus tickets and talking about going and returning',
  scene_context:
    'You are at the bus station in Ubud buying a ticket to Denpasar. You ask about the schedule, ticket price, and return trip. Practice travel vocabulary and higher numbers.',
  sort_order: 14,
  dialogues: [
    {
      id: 'e1000000-0037-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, saya mau tiket ke Denpasar.',
      text_en: 'Excuse me, I want a ticket to Denpasar.',
    },
    {
      id: 'e1000000-0037-4000-8000-000000000002',
      speaker: 'Petugas',
      text_target: 'Tiket ke Denpasar, dua puluh ribu. Mau pergi sekarang?',
      text_en: 'Ticket to Denpasar, twenty thousand. Want to go now?',
    },
    {
      id: 'e1000000-0037-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Satu tiket. Mau naik bus jam sembilan.',
      text_en: 'One ticket. I want to take the nine o\'clock bus.',
    },
    {
      id: 'e1000000-0037-4000-8000-000000000004',
      speaker: 'Petugas',
      text_target: 'Baik, jam sembilan. Mau pulang kapan?',
      text_en: 'Okay, nine o\'clock. When do you want to return?',
    },
    {
      id: 'e1000000-0037-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Pulang jam sepuluh sore. Berapa tiket pulang?',
      text_en: 'Return at ten in the evening. How much is a return ticket?',
    },
    {
      id: 'e1000000-0037-4000-8000-000000000006',
      speaker: 'Petugas',
      text_target: 'Sama, dua puluh ribu. Pergi dan pulang, empat puluh ribu.',
      text_en: 'Same, twenty thousand. Going and returning, forty thousand.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0037-4000-8000-000000000001',
      text_target: 'Tiket ke Denpasar',
      text_en: 'Ticket to Denpasar',
      literal_translation: 'Ticket to Denpasar',
      usage_note:
        '"Tiket" + "ke" + destination is how you ask for a ticket to a place.',
      wordTexts: ['tiket', 'ke'],
    },
    {
      id: 'f1000000-0037-4000-8000-000000000002',
      text_target: 'Mau pergi sekarang',
      text_en: 'Want to go now',
      literal_translation: 'Want go now',
      usage_note:
        '"Pergi" means "to go" (away from home). "Sekarang" means "now". A useful combination for immediate travel.',
      wordTexts: ['pergi', 'sekarang'],
    },
    {
      id: 'f1000000-0037-4000-8000-000000000003',
      text_target: 'Mau pulang',
      text_en: 'Want to go home / return',
      literal_translation: 'Want return home',
      usage_note:
        '"Pulang" specifically means to return home or go back. Different from "pergi" (to go somewhere).',
      wordTexts: ['mau', 'pulang'],
    },
    {
      id: 'f1000000-0037-4000-8000-000000000004',
      text_target: 'Jam sembilan sampai jam sepuluh',
      text_en: 'From nine to ten',
      literal_translation: 'Hour nine until hour ten',
      usage_note:
        '"Sembilan" = nine, "sepuluh" = ten. Use "sampai" between times for a range.',
      wordTexts: ['jam', 'sembilan', 'sepuluh'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0037-4000-8000-000000000001',
      pattern_template: 'Tiket ke + place',
      pattern_en: 'Ticket to + place',
      explanation:
        '"Tiket" + "ke" + destination is how you request a ticket to somewhere.',
      prompt: '___ ke Denpasar.',
      hint_en: 'Ticket to Denpasar.',
      correct_answer: 'Tiket',
      distractors: ['Naik', 'Pergi', 'Pulang'],
    },
    {
      id: '0a000000-0037-4000-8000-000000000002',
      pattern_template: 'Pergi vs. Pulang',
      pattern_en: 'Go (away) vs. Return (home)',
      explanation:
        '"Pergi" = to go/depart (away from home). "Pulang" = to return/go home. They are natural opposites in Indonesian.',
      prompt: 'Mau ___ ke Denpasar, lalu pulang sore.',
      hint_en: 'I want to go to Denpasar, then return in the afternoon.',
      correct_answer: 'pergi',
      distractors: ['pulang', 'naik', 'tiket'],
    },
    {
      id: '0a000000-0037-4000-8000-000000000003',
      pattern_template: 'Sekarang + verb/time',
      pattern_en: 'Now + verb/time',
      explanation:
        '"Sekarang" means "now". Use it to talk about the present moment: "sekarang jam tujuh" = "it is now seven o\'clock".',
      prompt: '___ jam berapa?',
      hint_en: 'What time is it now?',
      correct_answer: 'Sekarang',
      distractors: ['Kapan', 'Berapa', 'Mau'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000118', text: 'sembilan', meaning_en: 'nine', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000119', text: 'sepuluh', meaning_en: 'ten', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000120', text: 'tiket', meaning_en: 'ticket', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000121', text: 'pergi', meaning_en: 'to go', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000122', text: 'pulang', meaning_en: 'to return home', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000123', text: 'sekarang', meaning_en: 'now', part_of_speech: 'adverb' },
  ],
  existingWordTexts: ['ke', 'mau', 'berapa', 'satu', 'naik', 'saya', 'baik', 'permisi', 'jam', 'kapan', 'enam', 'tujuh', 'delapan', 'sore'],
};

export const UNIT2_SCENES: DialogueSceneData[] = [scene2_2a, scene2_2b, scene2_3a, scene2_3b, scene2_4a, scene2_4b, scene2_5a, scene2_5b];
