// Unit 2: Getting Around — Indonesian language learning scene data.
// Covers taking taxis, motorbike taxis, walking around, and taking buses.

import type { DialogueSceneData } from '../dialogue-data';

// ── Scene 2.2: Naik Taksi (Taking a Taxi) ────────────────────────────

const scene2_2: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000014',
  title: 'Naik Taksi (Taking a Taxi)',
  description: 'Taking a taxi from the airport',
  scene_context:
    'You need to get from the airport to your hotel in Ubud. You negotiate with a taxi driver. Practice stating destinations and discussing prices.',
  sort_order: 7,
  dialogues: [
    {
      id: 'e1000000-0014-4000-8000-000000000001',
      speaker: 'Supir',
      text_target: 'Mau ke mana?',
      text_en: 'Where do you want to go?',
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
      text_target: 'Lima puluh ribu rupiah.',
      text_en: 'Fifty thousand rupiah.',
    },
    {
      id: 'e1000000-0014-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Terlalu mahal! Empat puluh, bisa?',
      text_en: 'Too expensive! Forty, can?',
    },
    {
      id: 'e1000000-0014-4000-8000-000000000005',
      speaker: 'Supir',
      text_target: 'Baik, empat puluh. Naik, naik!',
      text_en: 'Okay, forty. Get in, get in!',
    },
    {
      id: 'e1000000-0014-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Tolong pelan-pelan. Terima kasih!',
      text_en: 'Please go slowly. Thank you!',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0014-4000-8000-000000000001',
      text_target: 'Mau ke mana?',
      text_en: 'Where do you want to go?',
      literal_translation: 'Want to where?',
      usage_note:
        'The standard question taxi drivers ask. "Ke" means "to" and "mana" means "where".',
      wordTexts: ['mau', 'ke'],
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
        'Tell the driver where to stop. "Di sini" means "here".',
      wordTexts: ['berhenti', 'di sini'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0014-4000-8000-000000000001',
      pattern_template: 'ke + place',
      pattern_en: 'to + place',
      explanation:
        '"Ke" means "to" and is placed before a destination. "Ke Ubud" = "to Ubud".',
      prompt: 'Saya mau ___ Ubud.',
      hint_en: 'I want to go to Ubud.',
      correct_answer: 'ke',
      distractors: ['di', 'dari', 'dan'],
    },
    {
      id: '0a000000-0014-4000-8000-000000000002',
      pattern_template: 'Berapa ke + place',
      pattern_en: 'How much to + place',
      explanation:
        '"Berapa" + "ke" + place asks the price of getting to a destination.',
      prompt: '___ ke Ubud?',
      hint_en: 'How much to Ubud?',
      correct_answer: 'Berapa',
      distractors: ['Apa', 'Di mana', 'Siapa'],
    },
    {
      id: '0a000000-0014-4000-8000-000000000003',
      pattern_template: 'Berhenti di + location',
      pattern_en: 'Stop at + location',
      explanation:
        '"Berhenti" means "to stop". Combine with "di" + location to say where.',
      prompt: '___ di sini.',
      hint_en: 'Stop here.',
      correct_answer: 'Berhenti',
      distractors: ['Belok', 'Naik', 'Cepat'],
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
    { id: 'b1000000-0001-4000-8000-000000000081', text: 'kamu', meaning_en: 'you (informal)', part_of_speech: 'pronoun' },
    { id: 'b1000000-0001-4000-8000-000000000082', text: 'aku', meaning_en: 'I (informal)', part_of_speech: 'pronoun' },
    { id: 'b1000000-0001-4000-8000-000000000083', text: 'tapi', meaning_en: 'but', part_of_speech: 'conjunction' },
    { id: 'b1000000-0001-4000-8000-000000000084', text: 'atau', meaning_en: 'or', part_of_speech: 'conjunction' },
    { id: 'b1000000-0001-4000-8000-000000000085', text: 'empat', meaning_en: 'four', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000086', text: 'lima', meaning_en: 'five', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000087', text: 'puluh', meaning_en: 'tens (multiplier)', part_of_speech: 'numeral' },
  ],
  existingWordTexts: ['ke', 'mau', 'berapa', 'saya', 'tolong', 'mahal', 'baik', 'terima kasih', 'lama'],
};

// ── Scene 2.3: Ojek Online (Motorbike Taxi) ──────────────────────────

const scene2_3: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000015',
  title: 'Ojek Online (Motorbike Taxi)',
  description: 'Ordering and riding a motorbike taxi (Grab/Gojek)',
  scene_context:
    'You order a Grab motorbike and wait for the driver. Practice confirming pickup location and giving simple instructions.',
  sort_order: 8,
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
      text_target: 'Saya di depan pintu. Tunggu sebentar, ya.',
      text_en: 'I am in front of the gate. Wait a moment, okay.',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000003',
      speaker: 'Supir',
      text_target: 'Sudah siap? Ini helm untuk kamu.',
      text_en: 'Already ready? Here is a helmet for you.',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Sudah siap. Terima kasih!',
      text_en: 'Already ready. Thank you!',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Tolong pelan-pelan ya. Hati-hati!',
      text_en: 'Please go slowly, okay. Be careful!',
    },
    {
      id: 'e1000000-0015-4000-8000-000000000006',
      speaker: 'Supir',
      text_target: 'Siap! Duduk di belakang ya.',
      text_en: 'Ready! Sit in the back, okay.',
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
      pattern_template: 'Di depan/belakang + noun',
      pattern_en: 'In front of / behind + noun',
      explanation:
        '"Di depan" = in front of, "di belakang" = behind. Follow with a noun to describe position.',
      prompt: 'Di ___ pintu.',
      hint_en: 'In front of the door.',
      correct_answer: 'depan',
      distractors: ['belakang', 'samping', 'sini'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000088', text: 'tunggu', meaning_en: 'to wait', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000089', text: 'sebentar', meaning_en: 'a moment', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000090', text: 'siap', meaning_en: 'ready', part_of_speech: 'adjective' },
    { id: 'b1000000-0001-4000-8000-000000000091', text: 'motor', meaning_en: 'motorbike', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000092', text: 'helm', meaning_en: 'helmet', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000093', text: 'pelan-pelan', meaning_en: 'slowly', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000094', text: 'hati-hati', meaning_en: 'be careful', part_of_speech: 'interjection' },
    { id: 'b1000000-0001-4000-8000-000000000095', text: 'bawa', meaning_en: 'to bring / carry', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000096', text: 'duduk', meaning_en: 'to sit', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000097', text: 'di depan', meaning_en: 'in front of', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000098', text: 'di belakang', meaning_en: 'behind', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000099', text: 'pintu', meaning_en: 'door / gate', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'di sini', 'di sana', 'sudah', 'naik', 'cepat', 'pelan',
    'kamu', 'ya', 'tolong', 'terima kasih',
  ],
};

// ── Scene 2.4: Jalan-Jalan (Walking Around) ──────────────────────────

const scene2_4: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000016',
  title: 'Jalan-Jalan (Walking Around)',
  description: 'Exploring on foot, asking about nearby places',
  scene_context:
    'You are walking around Ubud and want to find interesting places nearby. You ask a local about what is around. Practice prepositions and place vocabulary.',
  sort_order: 9,
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
      text_target: 'Ada! Di samping toko itu.',
      text_en: 'There is! Next to that shop.',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Terima kasih. Saya juga cari bank. Ada di dekat sini?',
      text_en: 'Thank you. I am also looking for a bank. Is there one nearby?',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000004',
      speaker: 'Warga',
      text_target: 'Bank ada di seberang restoran. Jalan lurus, di kiri.',
      text_en: 'The bank is across from the restaurant. Walk straight, on the left.',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Di seberang restoran? Baik, terima kasih!',
      text_en: 'Across from the restaurant? Okay, thank you!',
    },
    {
      id: 'e1000000-0016-4000-8000-000000000006',
      speaker: 'Warga',
      text_target: 'Sama-sama! Pantai juga dekat, di belakang masjid.',
      text_en: 'You are welcome! The beach is also close, behind the mosque.',
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
      text_target: 'Di samping toko',
      text_en: 'Next to the shop',
      literal_translation: 'At beside shop',
      usage_note:
        '"Di samping" means "next to" or "beside". Use with a landmark.',
      wordTexts: ['di samping', 'toko'],
    },
    {
      id: 'f1000000-0016-4000-8000-000000000003',
      text_target: 'Di seberang jalan',
      text_en: 'Across the road',
      literal_translation: 'At across road',
      usage_note:
        '"Di seberang" means "across from" or "opposite". Very useful for giving directions.',
      wordTexts: ['seberang'],
    },
    {
      id: 'f1000000-0016-4000-8000-000000000004',
      text_target: 'Saya cari bank',
      text_en: 'I am looking for a bank',
      literal_translation: 'I search bank',
      usage_note:
        '"Cari" means "to look for". Use it when you need to find something.',
      wordTexts: ['saya', 'cari', 'bank'],
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
      pattern_template: 'Di samping/seberang + noun',
      pattern_en: 'Next to / across from + noun',
      explanation:
        '"Di samping" = next to, "di seberang" = across from. Follow with a landmark noun.',
      prompt: 'Di ___ toko itu.',
      hint_en: 'Next to that shop.',
      correct_answer: 'samping',
      distractors: ['depan', 'belakang', 'atas'],
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
    { id: 'b1000000-0001-4000-8000-000000000106', text: 'di samping', meaning_en: 'beside / next to', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000107', text: 'di antara', meaning_en: 'between', part_of_speech: 'preposition' },
    { id: 'b1000000-0001-4000-8000-000000000108', text: 'atas', meaning_en: 'above / up', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000109', text: 'bawah', meaning_en: 'below / down', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000110', text: 'seberang', meaning_en: 'across / opposite', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000111', text: 'cari', meaning_en: 'to look for / search', part_of_speech: 'verb' },
  ],
  existingWordTexts: [
    'ada', 'dekat', 'di sini', 'di depan', 'di belakang', 'permisi',
    'kiri', 'kanan', 'lurus', 'juga', 'saya', 'baik', 'terima kasih',
  ],
};

// ── Scene 2.5: Naik Bus (Taking a Bus) ───────────────────────────────

const scene2_5: DialogueSceneData = {
  id: 'd1000000-0001-4000-8000-000000000017',
  title: 'Naik Bus (Taking a Bus)',
  description: 'Taking public transport, buying tickets',
  scene_context:
    'You are taking a bus from Ubud to Denpasar. You buy a ticket and ask about the schedule. Practice time-related vocabulary.',
  sort_order: 10,
  dialogues: [
    {
      id: 'e1000000-0017-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Permisi, saya mau tiket ke Denpasar.',
      text_en: 'Excuse me, I want a ticket to Denpasar.',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000002',
      speaker: 'Petugas',
      text_target: 'Tiket ke Denpasar, dua puluh ribu. Mau berapa tiket?',
      text_en: 'Ticket to Denpasar, twenty thousand. How many tickets do you want?',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Satu tiket. Kapan berangkat?',
      text_en: 'One ticket. When does it leave?',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000004',
      speaker: 'Petugas',
      text_target: 'Jam delapan. Sekarang jam tujuh setengah.',
      text_en: 'At eight o\'clock. Now it is seven thirty.',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Baik. Kapan pulang dari Denpasar?',
      text_en: 'Okay. When is the return from Denpasar?',
    },
    {
      id: 'e1000000-0017-4000-8000-000000000006',
      speaker: 'Petugas',
      text_target: 'Bus pulang jam lima sore.',
      text_en: 'The return bus is at five in the afternoon.',
    },
  ],
  phrases: [
    {
      id: 'f1000000-0017-4000-8000-000000000001',
      text_target: 'Kapan berangkat?',
      text_en: 'When does it leave?',
      literal_translation: 'When depart?',
      usage_note:
        '"Kapan" means "when". Use it to ask about schedules and timing.',
      wordTexts: ['kapan'],
    },
    {
      id: 'f1000000-0017-4000-8000-000000000002',
      text_target: 'Jam berapa?',
      text_en: 'What time?',
      literal_translation: 'Hour how much?',
      usage_note:
        '"Jam" means "hour/clock". "Jam berapa?" asks for a specific time.',
      wordTexts: ['jam', 'berapa'],
    },
    {
      id: 'f1000000-0017-4000-8000-000000000003',
      text_target: 'Tiket ke Denpasar',
      text_en: 'Ticket to Denpasar',
      literal_translation: 'Ticket to Denpasar',
      usage_note:
        '"Tiket" + "ke" + destination is how you ask for a ticket to a place.',
      wordTexts: ['tiket', 'ke'],
    },
    {
      id: 'f1000000-0017-4000-8000-000000000004',
      text_target: 'Mau pulang',
      text_en: 'Want to go home / return',
      literal_translation: 'Want return home',
      usage_note:
        '"Pulang" specifically means to return home or go back. Different from "pergi" (to go).',
      wordTexts: ['mau', 'pulang'],
    },
  ],
  patterns: [
    {
      id: '0a000000-0017-4000-8000-000000000001',
      pattern_template: 'Kapan + verb?',
      pattern_en: 'When + verb?',
      explanation:
        '"Kapan" asks "when". Follow with a verb to ask when something happens.',
      prompt: '___ berangkat?',
      hint_en: 'When does it leave?',
      correct_answer: 'Kapan',
      distractors: ['Berapa', 'Apa', 'Di mana'],
    },
    {
      id: '0a000000-0017-4000-8000-000000000002',
      pattern_template: 'Jam + number',
      pattern_en: 'At + number + o\'clock',
      explanation:
        '"Jam" + a number tells the time. "Jam delapan" = "eight o\'clock".',
      prompt: '___ delapan.',
      hint_en: 'At eight o\'clock.',
      correct_answer: 'Jam',
      distractors: ['Kapan', 'Berapa', 'Satu'],
    },
    {
      id: '0a000000-0017-4000-8000-000000000003',
      pattern_template: 'Tiket ke + place',
      pattern_en: 'Ticket to + place',
      explanation:
        '"Tiket" + "ke" + destination is how you request a ticket to somewhere.',
      prompt: '___ ke Denpasar.',
      hint_en: 'Ticket to Denpasar.',
      correct_answer: 'Tiket',
      distractors: ['Naik', 'Pergi', 'Pulang'],
    },
  ],
  newWords: [
    { id: 'b1000000-0001-4000-8000-000000000112', text: 'kapan', meaning_en: 'when', part_of_speech: 'adverb' },
    { id: 'b1000000-0001-4000-8000-000000000113', text: 'jam', meaning_en: 'hour / clock / o\'clock', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000114', text: 'setengah', meaning_en: 'half', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000115', text: 'enam', meaning_en: 'six', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000116', text: 'tujuh', meaning_en: 'seven', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000117', text: 'delapan', meaning_en: 'eight', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000118', text: 'sembilan', meaning_en: 'nine', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000119', text: 'sepuluh', meaning_en: 'ten', part_of_speech: 'numeral' },
    { id: 'b1000000-0001-4000-8000-000000000120', text: 'tiket', meaning_en: 'ticket', part_of_speech: 'noun' },
    { id: 'b1000000-0001-4000-8000-000000000121', text: 'pergi', meaning_en: 'to go', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000122', text: 'pulang', meaning_en: 'to return home', part_of_speech: 'verb' },
    { id: 'b1000000-0001-4000-8000-000000000123', text: 'sekarang', meaning_en: 'now', part_of_speech: 'adverb' },
  ],
  existingWordTexts: [
    'ke', 'mau', 'berapa', 'satu', 'dua', 'tiga', 'empat', 'lima', 'naik',
    'saya', 'baik', 'permisi',
  ],
};

export const UNIT2_SCENES: DialogueSceneData[] = [scene2_2, scene2_3, scene2_4, scene2_5];
