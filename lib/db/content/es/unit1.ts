// Unit 1: Arrivals & Greetings — Spanish language learning content
// 4 scenes covering arrival in a Spanish-speaking country.

import type { DialogueSceneData } from '../../dialogue-data';

// ── Scene 1.1: ¡Hola! ¿Cómo estás? (Meeting at the Airport) ───────────

const scene1_1: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000011',
  title: '¡Hola! ¿Cómo estás?',
  description: 'Meeting someone at the airport upon arrival',
  scene_context:
    'You have just landed at the airport in a Spanish-speaking country. A friendly local notices you looking at a map and strikes up a conversation. Practice greetings and introductions.',
  sort_order: 1,
  dialogues: [
    {
      id: 'e2000000-0011-4000-8000-000000000001',
      speaker: 'Carlos',
      text_target: '¡Hola! Bienvenido. ¿Cómo estás?',
      text_en: 'Hello! Welcome. How are you?',
    },
    {
      id: 'e2000000-0011-4000-8000-000000000002',
      speaker: 'You',
      text_target: '¡Hola! Estoy bien, gracias. ¿Y tú?',
      text_en: 'Hello! I am fine, thanks. And you?',
    },
    {
      id: 'e2000000-0011-4000-8000-000000000003',
      speaker: 'Carlos',
      text_target: 'Muy bien, gracias. Me llamo Carlos. ¿Cómo te llamas?',
      text_en: 'Very well, thanks. My name is Carlos. What is your name?',
    },
    {
      id: 'e2000000-0011-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Me llamo ... Mucho gusto, señor.',
      text_en: 'My name is ... Nice to meet you, sir.',
    },
    {
      id: 'e2000000-0011-4000-8000-000000000005',
      speaker: 'Carlos',
      text_target: '¡Encantado! ¿Es tu primera vez aquí?',
      text_en: 'Delighted! Is this your first time here?',
    },
    {
      id: 'e2000000-0011-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Sí, es mi primera vez. Estoy muy contento.',
      text_en: 'Yes, it is my first time. I am very happy.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0011-4000-8000-000000000001',
      text_target: '¿Cómo estás?',
      text_en: 'How are you?',
      literal_translation: 'How are-you?',
      usage_note:
        'The standard informal greeting. Use "¿Cómo está?" (usted) for formal situations.',
      wordTexts: ['cómo', 'estás'],
    },
    {
      id: 'f2000000-0011-4000-8000-000000000002',
      text_target: 'Estoy bien, gracias',
      text_en: 'I am fine, thanks',
      literal_translation: 'I-am well, thanks',
      usage_note:
        'The standard reply to "¿Cómo estás?" Use "estoy" for temporary states like mood or health.',
      wordTexts: ['estoy', 'bien'],
    },
    {
      id: 'f2000000-0011-4000-8000-000000000003',
      text_target: 'Me llamo ...',
      text_en: 'My name is ...',
      literal_translation: 'Me I-call ...',
      usage_note:
        'Literally "I call myself." The most common way to introduce yourself in Spanish.',
      wordTexts: ['me llamo'],
    },
    {
      id: 'f2000000-0011-4000-8000-000000000004',
      text_target: '¡Mucho gusto!',
      text_en: 'Nice to meet you!',
      literal_translation: 'Much pleasure!',
      usage_note:
        'Used when meeting someone for the first time. Very common and polite.',
      wordTexts: ['mucho gusto'],
    },
    {
      id: 'f2000000-0011-4000-8000-000000000005',
      text_target: '¡Bienvenido!',
      text_en: 'Welcome!',
      literal_translation: 'Well-come!',
      usage_note:
        'Use "bienvenido" for a man, "bienvenida" for a woman, "bienvenidos" for a group.',
      wordTexts: ['bienvenido'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0011-4000-8000-000000000001',
      pattern_template: '¿___ estás?',
      pattern_en: 'How are you?',
      explanation:
        '"Cómo" means "how" and is used to form questions about manner or state.',
      prompt: '¿___ estás?',
      hint_en: 'How are you?',
      correct_answer: 'Cómo',
      distractors: ['Dónde', 'Qué', 'Quién'],
    },
    {
      id: '0b200000-0011-4000-8000-000000000002',
      pattern_template: 'Me ___ ...',
      pattern_en: 'My name is ...',
      explanation:
        '"Me llamo" means "I call myself." Fill in your name after "llamo."',
      prompt: 'Me ___ Carlos.',
      hint_en: 'My name is Carlos.',
      correct_answer: 'llamo',
      distractors: ['gusto', 'bien', 'estoy'],
    },
    {
      id: '0b200000-0011-4000-8000-000000000003',
      pattern_template: 'Estoy ___, gracias',
      pattern_en: 'I am ___, thanks',
      explanation:
        '"Estoy" + adjective describes how you feel right now. "Bien" means fine or well.',
      prompt: 'Estoy ___, gracias.',
      hint_en: 'I am fine, thanks.',
      correct_answer: 'bien',
      distractors: ['mucho', 'cómo', 'tú'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000021', text: 'cómo', meaning_en: 'how / like', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000022', text: 'estás', meaning_en: 'you are (informal)', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000023', text: 'bien', meaning_en: 'well / fine', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000024', text: 'mucho gusto', meaning_en: 'nice to meet you', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000025', text: 'me llamo', meaning_en: 'my name is', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000026', text: 'yo', meaning_en: 'I', part_of_speech: 'pronoun' },
    { id: 'b2000000-0001-4000-8000-000000000027', text: 'tú', meaning_en: 'you (informal)', part_of_speech: 'pronoun' },
    { id: 'b2000000-0001-4000-8000-000000000028', text: 'señor', meaning_en: 'sir / mister', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000029', text: 'bienvenido', meaning_en: 'welcome', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000030', text: 'encantado', meaning_en: 'delighted / charmed', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000031', text: 'estoy', meaning_en: 'I am (temporary)', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000032', text: 'muy', meaning_en: 'very', part_of_speech: 'adverb' },
  ],
  existingWordTexts: ['hola', 'nombre', 'bueno', 'gracias', 'si'],
};

// ── Scene 1.2: En el hotel (Hotel Check-in) ─────────────────────────

const scene1_2: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000012',
  title: 'En el hotel',
  description: 'Checking into your hotel after arriving',
  scene_context:
    'You arrive at your hotel after the taxi ride from the airport. The receptionist greets you at the front desk. Practice hotel check-in vocabulary and polite requests.',
  sort_order: 2,
  dialogues: [
    {
      id: 'e2000000-0012-4000-8000-000000000001',
      speaker: 'Recepcionista',
      text_target: 'Buenas tardes. ¿Tiene una reserva?',
      text_en: 'Good afternoon. Do you have a reservation?',
    },
    {
      id: 'e2000000-0012-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Sí, tengo una reserva. A nombre de ...',
      text_en: 'Yes, I have a reservation. Under the name of ...',
    },
    {
      id: 'e2000000-0012-4000-8000-000000000003',
      speaker: 'Recepcionista',
      text_target: 'Perfecto. Una habitación para dos noches. ¿Su pasaporte, por favor?',
      text_en: 'Perfect. A room for two nights. Your passport, please?',
    },
    {
      id: 'e2000000-0012-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Aquí tiene. ¿La habitación tiene llave?',
      text_en: 'Here you go. Does the room have a key?',
    },
    {
      id: 'e2000000-0012-4000-8000-000000000005',
      speaker: 'Recepcionista',
      text_target: 'Sí, aquí está su llave. Habitación doscientos tres.',
      text_en: 'Yes, here is your key. Room two hundred and three.',
    },
    {
      id: 'e2000000-0012-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Muchas gracias. Necesito wifi también.',
      text_en: 'Thank you very much. I need wifi too.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0012-4000-8000-000000000001',
      text_target: '¿Tiene una reserva?',
      text_en: 'Do you have a reservation?',
      literal_translation: 'Have you a reservation?',
      usage_note:
        '"Tiene" is the formal "you have." Hotels always use the formal "usted" form.',
      wordTexts: ['tiene', 'una', 'reserva'],
    },
    {
      id: 'f2000000-0012-4000-8000-000000000002',
      text_target: 'Aquí tiene',
      text_en: 'Here you go',
      literal_translation: 'Here have',
      usage_note:
        'A polite way to hand something to someone. Very common in service situations.',
      wordTexts: ['aquí', 'tiene'],
    },
    {
      id: 'f2000000-0012-4000-8000-000000000003',
      text_target: 'Necesito ...',
      text_en: 'I need ...',
      literal_translation: 'I-need ...',
      usage_note:
        'Use "necesito" + noun to say what you need. More direct than "quiero" (I want).',
      wordTexts: ['necesito'],
    },
    {
      id: 'f2000000-0012-4000-8000-000000000004',
      text_target: 'Una habitación para dos noches',
      text_en: 'A room for two nights',
      literal_translation: 'A room for two nights',
      usage_note:
        'Use "para" + number + "noches" to say how long you are staying.',
      wordTexts: ['una', 'habitación', 'dos', 'noche'],
    },
    {
      id: 'f2000000-0012-4000-8000-000000000005',
      text_target: '¿Su pasaporte, por favor?',
      text_en: 'Your passport, please?',
      literal_translation: 'Your passport, please?',
      usage_note:
        '"Su" is the formal "your." You will hear this at hotels and airports.',
      wordTexts: ['pasaporte'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0012-4000-8000-000000000001',
      pattern_template: '¿Tiene una ___?',
      pattern_en: 'Do you have a ___?',
      explanation:
        '"Tiene" (you have, formal) + article + noun is how to ask if someone has something.',
      prompt: '¿Tiene una ___?',
      hint_en: 'Do you have a reservation?',
      correct_answer: 'reserva',
      distractors: ['llave', 'noche', 'habitación'],
    },
    {
      id: '0b200000-0012-4000-8000-000000000002',
      pattern_template: '___ tiene',
      pattern_en: 'Here you go',
      explanation:
        '"Aquí tiene" is a set phrase for handing something over politely.',
      prompt: '___ tiene.',
      hint_en: 'Here you go.',
      correct_answer: 'Aquí',
      distractors: ['Sí', 'No', 'Bien'],
    },
    {
      id: '0b200000-0012-4000-8000-000000000003',
      pattern_template: '___ wifi',
      pattern_en: 'I need wifi',
      explanation:
        '"Necesito" means "I need." Follow it with the thing you need.',
      prompt: '___ wifi.',
      hint_en: 'I need wifi.',
      correct_answer: 'Necesito',
      distractors: ['Tengo', 'Quiero', 'Tiene'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000033', text: 'habitación', meaning_en: 'room', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000034', text: 'noche', meaning_en: 'night', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000035', text: 'llave', meaning_en: 'key', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000036', text: 'reserva', meaning_en: 'reservation', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000037', text: 'pasaporte', meaning_en: 'passport', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000038', text: 'aquí', meaning_en: 'here', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000039', text: 'tiene', meaning_en: 'you have / he-she has', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000040', text: 'necesito', meaning_en: 'I need', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000041', text: 'una', meaning_en: 'a / one (feminine)', part_of_speech: 'article' },
    { id: 'b2000000-0001-4000-8000-000000000042', text: 'dos', meaning_en: 'two', part_of_speech: 'numeral' },
  ],
  existingWordTexts: ['hola', 'gracias', 'por favor', 'nombre', 'bueno', 'si'],
};

// ── Scene 1.3: Conociendo a los vecinos (Meeting Neighbors) ─────────

const scene1_3: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000013',
  title: 'Conociendo a los vecinos',
  description: 'Meeting your neighbors and local people near the hotel',
  scene_context:
    'You step outside the hotel and meet a friendly couple who live nearby. They are curious about where you come from and why you are visiting. Practice small talk about origins and complimenting a place.',
  sort_order: 3,
  dialogues: [
    {
      id: 'e2000000-0013-4000-8000-000000000001',
      speaker: 'María',
      text_target: '¡Hola! ¿De dónde eres?',
      text_en: 'Hello! Where are you from?',
    },
    {
      id: 'e2000000-0013-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Soy de Australia. ¿Y tú?',
      text_en: 'I am from Australia. And you?',
    },
    {
      id: 'e2000000-0013-4000-8000-000000000003',
      speaker: 'María',
      text_target: 'Yo soy de aquí. Este es mi esposo, Pedro.',
      text_en: 'I am from here. This is my husband, Pedro.',
    },
    {
      id: 'e2000000-0013-4000-8000-000000000004',
      speaker: 'Pedro',
      text_target: '¡Mucho gusto! Este país es muy bonito, ¿verdad?',
      text_en: 'Nice to meet you! This country is very pretty, right?',
    },
    {
      id: 'e2000000-0013-4000-8000-000000000005',
      speaker: 'You',
      text_target: '¡Sí, muy bonito! También la gente es muy amable.',
      text_en: 'Yes, very pretty! The people are also very friendly.',
    },
    {
      id: 'e2000000-0013-4000-8000-000000000006',
      speaker: 'María',
      text_target: '¡Encantada! Bienvenido a nuestro país.',
      text_en: 'Delighted! Welcome to our country.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0013-4000-8000-000000000001',
      text_target: '¿De dónde eres?',
      text_en: 'Where are you from?',
      literal_translation: 'Of where are-you?',
      usage_note:
        'The informal way to ask someone where they are from. Use "¿De dónde es usted?" for formal.',
      wordTexts: ['de donde', 'eres'],
    },
    {
      id: 'f2000000-0013-4000-8000-000000000002',
      text_target: 'Soy de ...',
      text_en: 'I am from ...',
      literal_translation: 'I-am of ...',
      usage_note:
        '"Soy" is "I am" for permanent traits. "Soy de" + place says where you come from.',
      wordTexts: ['soy'],
    },
    {
      id: 'f2000000-0013-4000-8000-000000000003',
      text_target: 'Este país es muy bonito',
      text_en: 'This country is very pretty',
      literal_translation: 'This country is very pretty',
      usage_note:
        '"Este" means "this" for masculine nouns. "Esta" is used for feminine nouns.',
      wordTexts: ['este', 'país', 'bonito'],
    },
    {
      id: 'f2000000-0013-4000-8000-000000000004',
      text_target: '¡Encantada!',
      text_en: 'Delighted!',
      literal_translation: 'Enchanted!',
      usage_note:
        'Women say "encantada," men say "encantado." Used when meeting someone for the first time.',
      wordTexts: ['encantado'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0013-4000-8000-000000000001',
      pattern_template: '¿De ___ eres?',
      pattern_en: 'Where are you from?',
      explanation:
        '"De donde" means "from where." It is used to ask about someone\'s origin.',
      prompt: '¿De ___ eres?',
      hint_en: 'Where are you from?',
      correct_answer: 'donde',
      distractors: ['cómo', 'que', 'aquí'],
    },
    {
      id: '0b200000-0013-4000-8000-000000000002',
      pattern_template: '___ de Australia',
      pattern_en: 'I am from Australia',
      explanation:
        '"Soy" is "I am" for permanent characteristics. "Soy de" + place states your origin.',
      prompt: '___ de Australia.',
      hint_en: 'I am from Australia.',
      correct_answer: 'Soy',
      distractors: ['Estoy', 'Tengo', 'Tiene'],
    },
    {
      id: '0b200000-0013-4000-8000-000000000003',
      pattern_template: '___ país es muy bonito',
      pattern_en: 'This country is very pretty',
      explanation:
        '"Este" means "this" for masculine nouns. "País" (country) is masculine.',
      prompt: '___ país es muy bonito.',
      hint_en: 'This country is very pretty.',
      correct_answer: 'Este',
      distractors: ['Aquí', 'Yo', 'Mi'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000043', text: 'de donde', meaning_en: 'from where', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000044', text: 'soy', meaning_en: 'I am (permanent)', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000045', text: 'y', meaning_en: 'and', part_of_speech: 'conjunction' },
    { id: 'b2000000-0001-4000-8000-000000000046', text: 'también', meaning_en: 'also / too', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000047', text: 'bonito', meaning_en: 'pretty / beautiful', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000048', text: 'este', meaning_en: 'this (masculine)', part_of_speech: 'determiner' },
    { id: 'b2000000-0001-4000-8000-000000000049', text: 'país', meaning_en: 'country', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000050', text: 'eres', meaning_en: 'you are (informal, permanent)', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000051', text: 'gente', meaning_en: 'people', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000052', text: 'amable', meaning_en: 'kind / friendly', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'hola', 'nombre', 'amigo', 'bueno', 'gracias',
    // From scene 1.1:
    'mucho gusto', 'encantado', 'muy', 'aquí', 'bienvenido', 'si',
  ],
};

// ── Scene 1.4: En la calle (First Walk Around Town) ─────────────────

const scene1_4: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000014',
  title: 'En la calle',
  description: 'Taking your first walk and asking for directions',
  scene_context:
    'You step out of the hotel for your first walk around the neighborhood. You need to find a pharmacy and a shop. Practice asking for directions and understanding basic location words.',
  sort_order: 4,
  dialogues: [
    {
      id: 'e2000000-0014-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Perdón, ¿dónde hay una farmacia?',
      text_en: 'Excuse me, where is there a pharmacy?',
    },
    {
      id: 'e2000000-0014-4000-8000-000000000002',
      speaker: 'Local',
      text_target: 'La farmacia está cerca. Siga por esta calle.',
      text_en: 'The pharmacy is nearby. Continue along this street.',
    },
    {
      id: 'e2000000-0014-4000-8000-000000000003',
      speaker: 'You',
      text_target: '¿Está lejos la tienda grande?',
      text_en: 'Is the big shop far away?',
    },
    {
      id: 'e2000000-0014-4000-8000-000000000004',
      speaker: 'Local',
      text_target: 'No, no está lejos. Hay una tienda pequeña aquí a la derecha.',
      text_en: 'No, it is not far. There is a small shop here on the right.',
    },
    {
      id: 'e2000000-0014-4000-8000-000000000005',
      speaker: 'You',
      text_target: '¡Gracias! ¿Y hay un supermercado cerca?',
      text_en: 'Thanks! And is there a supermarket nearby?',
    },
    {
      id: 'e2000000-0014-4000-8000-000000000006',
      speaker: 'Local',
      text_target: 'Sí, hay uno grande a la izquierda, por favor siga recto.',
      text_en: 'Yes, there is a big one on the left, please go straight.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0014-4000-8000-000000000001',
      text_target: 'Perdón, ¿dónde hay ...?',
      text_en: 'Excuse me, where is there ...?',
      literal_translation: 'Pardon, where there-is ...?',
      usage_note:
        '"Perdón" gets attention politely. "¿Dónde hay ...?" asks where something can be found.',
      wordTexts: ['perdón'],
    },
    {
      id: 'f2000000-0014-4000-8000-000000000002',
      text_target: 'Está cerca',
      text_en: 'It is nearby',
      literal_translation: 'Is close',
      usage_note:
        '"Cerca" means near. Use "está cerca" to say something is close by.',
      wordTexts: ['cerca'],
    },
    {
      id: 'f2000000-0014-4000-8000-000000000003',
      text_target: 'Está lejos',
      text_en: 'It is far away',
      literal_translation: 'Is far',
      usage_note:
        '"Lejos" is the opposite of "cerca." Use "está lejos" to say something is far.',
      wordTexts: ['lejos'],
    },
    {
      id: 'f2000000-0014-4000-8000-000000000004',
      text_target: 'Hay una tienda',
      text_en: 'There is a shop',
      literal_translation: 'There-is a shop',
      usage_note:
        '"Hay" means "there is" or "there are." It does not change for singular or plural.',
      wordTexts: ['hay', 'tienda'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0014-4000-8000-000000000001',
      pattern_template: '¿Dónde ___ una farmacia?',
      pattern_en: 'Where is there a pharmacy?',
      explanation:
        '"Hay" means "there is / there are." Use "¿Dónde hay ...?" to ask where to find something.',
      prompt: '¿Dónde ___ una farmacia?',
      hint_en: 'Where is there a pharmacy?',
      correct_answer: 'hay',
      distractors: ['está', 'tiene', 'es'],
    },
    {
      id: '0b200000-0014-4000-8000-000000000002',
      pattern_template: 'La tienda está ___',
      pattern_en: 'The shop is nearby',
      explanation:
        '"Cerca" means close or nearby. "Lejos" means far. Both follow "está."',
      prompt: 'La tienda está ___.',
      hint_en: 'The shop is nearby.',
      correct_answer: 'cerca',
      distractors: ['lejos', 'grande', 'aquí'],
    },
    {
      id: '0b200000-0014-4000-8000-000000000003',
      pattern_template: 'Una tienda ___ a la derecha',
      pattern_en: 'A small shop on the right',
      explanation:
        'Adjectives follow the noun in Spanish. "Pequeña" means small. "Grande" means big.',
      prompt: 'Una tienda ___ a la derecha.',
      hint_en: 'A small shop on the right.',
      correct_answer: 'pequeña',
      distractors: ['grande', 'bonito', 'cerca'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000053', text: 'perdón', meaning_en: 'excuse me / pardon', part_of_speech: 'interjection' },
    { id: 'b2000000-0001-4000-8000-000000000054', text: 'calle', meaning_en: 'street', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000055', text: 'cerca', meaning_en: 'near / close', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000056', text: 'lejos', meaning_en: 'far away', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000057', text: 'hay', meaning_en: 'there is / there are', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000058', text: 'grande', meaning_en: 'big / large', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000059', text: 'pequeña', meaning_en: 'small (feminine)', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000060', text: 'tienda', meaning_en: 'shop / store', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'donde', 'gracias', 'por favor', 'bueno', 'si', 'izquierda', 'derecha', 'no',
    // From scene 1.1:
    'muy', 'aquí',
    // From scene 1.2:
    'una',
    // From scene 1.3:
    'este', 'bonito',
  ],
};

export const UNIT1_SCENES: DialogueSceneData[] = [scene1_1, scene1_2, scene1_3, scene1_4];
