// Unit 3: Food & Drink — Spanish language learning content
// 4 scenes covering ordering food and drinks in a Spanish-speaking country.

import type { DialogueSceneData } from '../../dialogue-data';

// ── Scene 3.1: En el restaurante (Ordering at a Restaurant) ──────────

const scene3_1: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000019',
  title: 'En el restaurante',
  description: 'Ordering food at a restaurant with a waiter',
  scene_context:
    'You sit down at a small restaurant for lunch. The waiter brings you a menu and you order a meal. Practice ordering food, asking for the menu, and requesting items.',
  sort_order: 9,
  dialogues: [
    {
      id: 'e2000000-0019-4000-8000-000000000001',
      speaker: 'Camarero',
      text_target: '¡Buenas tardes! ¿Mesa para uno?',
      text_en: 'Good afternoon! Table for one?',
    },
    {
      id: 'e2000000-0019-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Sí, por favor. ¿Tiene el menú?',
      text_en: 'Yes, please. Do you have the menu?',
    },
    {
      id: 'e2000000-0019-4000-8000-000000000003',
      speaker: 'Camarero',
      text_target: 'Aquí tiene. Hoy tenemos sopa, pollo con arroz y ensalada.',
      text_en: 'Here you go. Today we have soup, chicken with rice, and salad.',
    },
    {
      id: 'e2000000-0019-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Quiero el pollo con arroz, por favor. Sin ensalada.',
      text_en: 'I want the chicken with rice, please. Without salad.',
    },
    {
      id: 'e2000000-0019-4000-8000-000000000005',
      speaker: 'Camarero',
      text_target: 'Muy bien. ¿Y para beber? ¿Agua o algo más?',
      text_en: 'Very well. And to drink? Water or something else?',
    },
    {
      id: 'e2000000-0019-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Un agua, por favor. Y el plato del día, ¿qué es?',
      text_en: 'A water, please. And the dish of the day, what is it?',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0019-4000-8000-000000000001',
      text_target: '¿Tiene el menú?',
      text_en: 'Do you have the menu?',
      literal_translation: 'Have-you the menu?',
      usage_note:
        'The first thing to ask when you sit down at a restaurant. "Tiene" is formal.',
      wordTexts: ['tiene', 'menú'],
    },
    {
      id: 'f2000000-0019-4000-8000-000000000002',
      text_target: 'Quiero el pollo con arroz',
      text_en: 'I want the chicken with rice',
      literal_translation: 'I-want the chicken with rice',
      usage_note:
        'Use "quiero" + food item to order. "Con" means with, "sin" means without.',
      wordTexts: ['quiero', 'pollo', 'con', 'arroz'],
    },
    {
      id: 'f2000000-0019-4000-8000-000000000003',
      text_target: '¿Y para beber?',
      text_en: 'And to drink?',
      literal_translation: 'And for to-drink?',
      usage_note:
        'The waiter asks this after you order food. "Para" means "for" or "in order to."',
      wordTexts: ['para', 'beber'],
    },
    {
      id: 'f2000000-0019-4000-8000-000000000004',
      text_target: 'Sin ensalada',
      text_en: 'Without salad',
      literal_translation: 'Without salad',
      usage_note:
        '"Sin" means "without." Very useful for customizing your order.',
      wordTexts: ['sin', 'ensalada'],
    },
    {
      id: 'f2000000-0019-4000-8000-000000000005',
      text_target: 'El plato del día',
      text_en: 'The dish of the day',
      literal_translation: 'The dish of-the day',
      usage_note:
        'Most restaurants have a daily special. "Del" is a contraction of "de" + "el."',
      wordTexts: ['plato'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0019-4000-8000-000000000001',
      pattern_template: 'Quiero el ___ con arroz',
      pattern_en: 'I want the ___ with rice',
      explanation:
        '"Quiero" means "I want." Follow with the food item you would like to order.',
      prompt: 'Quiero el ___ con arroz.',
      hint_en: 'I want the chicken with rice.',
      correct_answer: 'pollo',
      distractors: ['menú', 'plato', 'agua'],
    },
    {
      id: '0b200000-0019-4000-8000-000000000002',
      pattern_template: '___ ensalada',
      pattern_en: 'Without salad',
      explanation:
        '"Sin" means "without." Use it before any food item to exclude it from your order.',
      prompt: '___ ensalada.',
      hint_en: 'Without salad.',
      correct_answer: 'Sin',
      distractors: ['Con', 'Para', 'Un'],
    },
    {
      id: '0b200000-0019-4000-8000-000000000003',
      pattern_template: '¿Y ___ beber?',
      pattern_en: 'And to drink?',
      explanation:
        '"Para" means "for" or "in order to." It connects a purpose to an action.',
      prompt: '¿Y ___ beber?',
      hint_en: 'And to drink?',
      correct_answer: 'para',
      distractors: ['con', 'sin', 'por'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000099', text: 'menú', meaning_en: 'menu', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000100', text: 'mesa', meaning_en: 'table', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000101', text: 'plato', meaning_en: 'dish / plate', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000102', text: 'pollo', meaning_en: 'chicken', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000103', text: 'arroz', meaning_en: 'rice', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000104', text: 'ensalada', meaning_en: 'salad', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000105', text: 'sopa', meaning_en: 'soup', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000106', text: 'camarero', meaning_en: 'waiter', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000107', text: 'pedir', meaning_en: 'to order / to ask for', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000108', text: 'para', meaning_en: 'for / in order to', part_of_speech: 'preposition' },
    { id: 'b2000000-0001-4000-8000-000000000109', text: 'sin', meaning_en: 'without', part_of_speech: 'preposition' },
    { id: 'b2000000-0001-4000-8000-000000000110', text: 'con', meaning_en: 'with', part_of_speech: 'preposition' },
  ],
  existingWordTexts: [
    'hola', 'gracias', 'por favor', 'quiero', 'agua', 'comida', 'comer', 'beber', 'bueno', 'si',
    // From Unit 1:
    'una', 'tiene', 'aquí', 'muy',
    // From Unit 2:
    'hoy',
  ],
};

// ── Scene 3.2: Comida callejera (Street Food) ────────────────────────

const scene3_2: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000020',
  title: 'Comida callejera',
  description: 'Ordering food at a street food stand',
  scene_context:
    'You are walking through a lively street market and spot a popular taco stand. You order some food and chat with the vendor about flavors. Practice ordering street food and describing tastes.',
  sort_order: 10,
  dialogues: [
    {
      id: 'e2000000-0020-4000-8000-000000000001',
      speaker: 'Vendedor',
      text_target: '¡Hola, amigo! ¿Quiere probar nuestros tacos?',
      text_en: 'Hello, friend! Do you want to try our tacos?',
    },
    {
      id: 'e2000000-0020-4000-8000-000000000002',
      speaker: 'You',
      text_target: '¡Sí! Quiero un taco con pollo, por favor. ¿Es picante?',
      text_en: 'Yes! I want a chicken taco, please. Is it spicy?',
    },
    {
      id: 'e2000000-0020-4000-8000-000000000003',
      speaker: 'Vendedor',
      text_target: 'Un poco picante. ¿Quiere salsa? La roja es muy picante.',
      text_en: 'A little spicy. Do you want salsa? The red one is very spicy.',
    },
    {
      id: 'e2000000-0020-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'No muy picante, por favor. ¿Tiene algo más frío?',
      text_en: 'Not too spicy, please. Do you have something colder?',
    },
    {
      id: 'e2000000-0020-4000-8000-000000000005',
      speaker: 'Vendedor',
      text_target: '¡Sí! Tenemos agua fría y limonada. ¿Quiere otro taco?',
      text_en: 'Yes! We have cold water and lemonade. Do you want another taco?',
    },
    {
      id: 'e2000000-0020-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Sí, otro más. ¡Está muy rico! ¿Cuánto cuesta todo?',
      text_en: 'Yes, another one. It is very tasty! How much is everything?',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0020-4000-8000-000000000001',
      text_target: '¿Es picante?',
      text_en: 'Is it spicy?',
      literal_translation: 'Is spicy?',
      usage_note:
        'Ask this before ordering street food. "Picante" means spicy or hot (in flavor).',
      wordTexts: ['picante'],
    },
    {
      id: 'f2000000-0020-4000-8000-000000000002',
      text_target: '¿Quiere probar?',
      text_en: 'Do you want to try?',
      literal_translation: 'Want to-try?',
      usage_note:
        'Vendors often offer samples. "Probar" means to try or to taste.',
      wordTexts: ['probar'],
    },
    {
      id: 'f2000000-0020-4000-8000-000000000003',
      text_target: '¡Está muy rico!',
      text_en: 'It is very tasty!',
      literal_translation: 'Is very tasty!',
      usage_note:
        '"Rico" means tasty or delicious when describing food. A great compliment to the cook.',
      wordTexts: ['rico', 'muy'],
    },
    {
      id: 'f2000000-0020-4000-8000-000000000004',
      text_target: 'Otro más',
      text_en: 'Another one / one more',
      literal_translation: 'Other more',
      usage_note:
        'Use "otro" to ask for another of the same thing. "Más" means more.',
      wordTexts: ['otro', 'más'],
    },
    {
      id: 'f2000000-0020-4000-8000-000000000005',
      text_target: 'Un poco picante',
      text_en: 'A little spicy',
      literal_translation: 'A little spicy',
      usage_note:
        '"Un poco" means "a little." Use it to soften any adjective.',
      wordTexts: ['poco', 'picante'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0020-4000-8000-000000000001',
      pattern_template: '¿Quiere ___ nuestros tacos?',
      pattern_en: 'Do you want to try our tacos?',
      explanation:
        '"Probar" means "to try" or "to taste." Use it when offering or accepting samples.',
      prompt: '¿Quiere ___ nuestros tacos?',
      hint_en: 'Do you want to try our tacos?',
      correct_answer: 'probar',
      distractors: ['pedir', 'comer', 'beber'],
    },
    {
      id: '0b200000-0020-4000-8000-000000000002',
      pattern_template: '¡Está muy ___!',
      pattern_en: 'It is very tasty!',
      explanation:
        '"Rico" means "tasty" or "delicious" when describing food. A common compliment.',
      prompt: '¡Está muy ___!',
      hint_en: 'It is very tasty!',
      correct_answer: 'rico',
      distractors: ['picante', 'frío', 'caliente'],
    },
    {
      id: '0b200000-0020-4000-8000-000000000003',
      pattern_template: 'Un ___ picante',
      pattern_en: 'A little spicy',
      explanation:
        '"Poco" means "a little" or "a bit." Use "un poco" to moderate an adjective.',
      prompt: 'Un ___ picante.',
      hint_en: 'A little spicy.',
      correct_answer: 'poco',
      distractors: ['muy', 'más', 'otro'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000111', text: 'taco', meaning_en: 'taco', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000112', text: 'picante', meaning_en: 'spicy / hot', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000113', text: 'salsa', meaning_en: 'sauce / salsa', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000114', text: 'rico', meaning_en: 'tasty / delicious', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000115', text: 'probar', meaning_en: 'to try / to taste', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000116', text: 'otro', meaning_en: 'another / other', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000117', text: 'más', meaning_en: 'more', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000118', text: 'poco', meaning_en: 'a little / few', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000119', text: 'caliente', meaning_en: 'hot (temperature)', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000120', text: 'frío', meaning_en: 'cold', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'quiero', 'gracias', 'por favor', 'bueno', 'si', 'no', 'agua', 'amigo',
    // From Unit 1:
    'una', 'muy', 'tiene',
    // From Unit 2:
    'cuánto cuesta',
    // From Scene 3.1:
    'con', 'sin', 'pollo',
  ],
};

// ── Scene 3.3: En el mercado (Shopping at a Food Market) ─────────────

const scene3_3: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000021',
  title: 'En el mercado',
  description: 'Shopping for food at a traditional market',
  scene_context:
    'You visit a colorful traditional market to buy fresh fruit and vegetables. You bargain with vendors and ask about produce. Practice food shopping vocabulary and quantities.',
  sort_order: 11,
  dialogues: [
    {
      id: 'e2000000-0021-4000-8000-000000000001',
      speaker: 'You',
      text_target: '¡Buenos días! ¿Tiene fruta fresca?',
      text_en: 'Good morning! Do you have fresh fruit?',
    },
    {
      id: 'e2000000-0021-4000-8000-000000000002',
      speaker: 'Vendedora',
      text_target: '¡Sí, claro! Tenemos de todo. Estos mangos son muy buenos.',
      text_en: 'Yes, of course! We have everything. These mangos are very good.',
    },
    {
      id: 'e2000000-0021-4000-8000-000000000003',
      speaker: 'You',
      text_target: '¿Cuánto cuesta un kilo de esos mangos?',
      text_en: 'How much does a kilo of those mangos cost?',
    },
    {
      id: 'e2000000-0021-4000-8000-000000000004',
      speaker: 'Vendedora',
      text_target: 'Tres euros el kilo. ¿Quiere medio kilo o un kilo?',
      text_en: 'Three euros per kilo. Do you want half a kilo or a kilo?',
    },
    {
      id: 'e2000000-0021-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Medio kilo, por favor. ¿Y tiene verdura? ¿Es barato?',
      text_en: 'Half a kilo, please. And do you have vegetables? Is it cheap?',
    },
    {
      id: 'e2000000-0021-4000-8000-000000000006',
      speaker: 'Vendedora',
      text_target: 'Sí, la verdura está fresca y barata. ¿Quiere algo más?',
      text_en: 'Yes, the vegetables are fresh and cheap. Do you want something else?',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0021-4000-8000-000000000001',
      text_target: '¿Tiene fruta fresca?',
      text_en: 'Do you have fresh fruit?',
      literal_translation: 'Have-you fruit fresh?',
      usage_note:
        '"Fresco/fresca" means fresh. Adjectives change to match the noun gender.',
      wordTexts: ['tiene', 'fruta', 'fresco'],
    },
    {
      id: 'f2000000-0021-4000-8000-000000000002',
      text_target: 'Un kilo de ...',
      text_en: 'A kilo of ...',
      literal_translation: 'A kilo of ...',
      usage_note:
        'Markets sell produce by the kilo. Use "medio kilo" for half a kilo.',
      wordTexts: ['kilo'],
    },
    {
      id: 'f2000000-0021-4000-8000-000000000003',
      text_target: '¿Quiere algo más?',
      text_en: 'Do you want something else?',
      literal_translation: 'Want something more?',
      usage_note:
        'Vendors ask this to see if you need anything else. "Algo" means "something."',
      wordTexts: ['algo', 'más'],
    },
    {
      id: 'f2000000-0021-4000-8000-000000000004',
      text_target: 'Estos mangos son muy buenos',
      text_en: 'These mangos are very good',
      literal_translation: 'These mangos are very good',
      usage_note:
        '"Estos" means "these" (masculine plural). Use "estas" for feminine plural nouns.',
      wordTexts: ['estos', 'muy', 'bueno'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0021-4000-8000-000000000001',
      pattern_template: '¿Cuánto cuesta un ___ de mangos?',
      pattern_en: 'How much does a kilo of mangos cost?',
      explanation:
        '"Kilo" is the standard unit at markets. Use "un kilo de" + item to specify quantity.',
      prompt: '¿Cuánto cuesta un ___ de mangos?',
      hint_en: 'How much does a kilo of mangos cost?',
      correct_answer: 'kilo',
      distractors: ['plato', 'poco', 'otro'],
    },
    {
      id: '0b200000-0021-4000-8000-000000000002',
      pattern_template: '___ kilo, por favor',
      pattern_en: 'Half a kilo, please',
      explanation:
        '"Medio" means "half." Use it before measurement words like "kilo" or "litro."',
      prompt: '___ kilo, por favor.',
      hint_en: 'Half a kilo, please.',
      correct_answer: 'Medio',
      distractors: ['Un', 'Otro', 'Este'],
    },
    {
      id: '0b200000-0021-4000-8000-000000000003',
      pattern_template: '¿Quiere ___ más?',
      pattern_en: 'Do you want something else?',
      explanation:
        '"Algo" means "something." Use "algo más" to ask about anything else.',
      prompt: '¿Quiere ___ más?',
      hint_en: 'Do you want something else?',
      correct_answer: 'algo',
      distractors: ['otro', 'poco', 'todo'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000121', text: 'fruta', meaning_en: 'fruit', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000122', text: 'verdura', meaning_en: 'vegetable(s)', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000123', text: 'fresco', meaning_en: 'fresh', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000124', text: 'kilo', meaning_en: 'kilogram', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000125', text: 'medio', meaning_en: 'half', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000126', text: 'estos', meaning_en: 'these (masculine)', part_of_speech: 'determiner' },
    { id: 'b2000000-0001-4000-8000-000000000127', text: 'esos', meaning_en: 'those (masculine)', part_of_speech: 'determiner' },
    { id: 'b2000000-0001-4000-8000-000000000128', text: 'barato', meaning_en: 'cheap / inexpensive', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000129', text: 'caro', meaning_en: 'expensive', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000130', text: 'algo', meaning_en: 'something', part_of_speech: 'pronoun' },
  ],
  existingWordTexts: [
    'cuanto', 'dinero', 'cuenta', 'bueno', 'quiero', 'por favor', 'si',
    // From Unit 1:
    'grande', 'tiene', 'muy',
    // From Unit 2:
    'cuánto cuesta',
    // From Scene 3.2:
    'más', 'otro',
  ],
};

// ── Scene 3.4: En el café (At a Coffee Shop) ─────────────────────────

const scene3_4: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000022',
  title: 'En el café',
  description: 'Ordering drinks and pastries at a coffee shop',
  scene_context:
    'You stop at a cozy café for an afternoon break. You order coffee and chat with the barista about drink options. Practice ordering hot and cold drinks and customizing your order.',
  sort_order: 12,
  dialogues: [
    {
      id: 'e2000000-0022-4000-8000-000000000001',
      speaker: 'Barista',
      text_target: '¡Buenas tardes! ¿Qué quiere tomar?',
      text_en: 'Good afternoon! What would you like to have?',
    },
    {
      id: 'e2000000-0022-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Un café con leche, por favor. ¿Lo tiene caliente?',
      text_en: 'A coffee with milk, please. Do you have it hot?',
    },
    {
      id: 'e2000000-0022-4000-8000-000000000003',
      speaker: 'Barista',
      text_target: '¡Claro! ¿Quiere azúcar? También tenemos café helado.',
      text_en: 'Of course! Do you want sugar? We also have iced coffee.',
    },
    {
      id: 'e2000000-0022-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Sin azúcar, gracias. ¿El café helado es dulce?',
      text_en: 'Without sugar, thanks. Is the iced coffee sweet?',
    },
    {
      id: 'e2000000-0022-4000-8000-000000000005',
      speaker: 'Barista',
      text_target: 'Un poco dulce. ¿Quiere una taza grande o pequeña?',
      text_en: 'A little sweet. Do you want a large or small cup?',
    },
    {
      id: 'e2000000-0022-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Una taza grande, por favor. ¿Tiene un café solo también?',
      text_en: 'A large cup, please. Do you have a black coffee too?',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0022-4000-8000-000000000001',
      text_target: 'Un café con leche',
      text_en: 'A coffee with milk',
      literal_translation: 'A coffee with milk',
      usage_note:
        'The most popular coffee order in Spanish-speaking countries. "Leche" means milk.',
      wordTexts: ['café', 'con', 'leche'],
    },
    {
      id: 'f2000000-0022-4000-8000-000000000002',
      text_target: 'Sin azúcar',
      text_en: 'Without sugar',
      literal_translation: 'Without sugar',
      usage_note:
        'Use "sin" + ingredient to exclude something from your drink.',
      wordTexts: ['sin', 'azúcar'],
    },
    {
      id: 'f2000000-0022-4000-8000-000000000003',
      text_target: 'Un café solo',
      text_en: 'A black coffee',
      literal_translation: 'A coffee alone',
      usage_note:
        '"Solo" means "alone" or "just." A "café solo" is a black coffee without milk.',
      wordTexts: ['café', 'solo'],
    },
    {
      id: 'f2000000-0022-4000-8000-000000000004',
      text_target: '¿Lo tiene caliente?',
      text_en: 'Do you have it hot?',
      literal_translation: 'It have-you hot?',
      usage_note:
        '"Caliente" means hot (temperature). Not to be confused with "picante" (spicy).',
      wordTexts: ['tiene', 'caliente'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0022-4000-8000-000000000001',
      pattern_template: 'Un café con ___',
      pattern_en: 'A coffee with milk',
      explanation:
        '"Leche" means "milk." "Con" means "with." Together: "a coffee with milk."',
      prompt: 'Un café con ___.',
      hint_en: 'A coffee with milk.',
      correct_answer: 'leche',
      distractors: ['azúcar', 'agua', 'arroz'],
    },
    {
      id: '0b200000-0022-4000-8000-000000000002',
      pattern_template: '___ azúcar, gracias',
      pattern_en: 'Without sugar, thanks',
      explanation:
        '"Sin" means "without." It is the opposite of "con" (with). Use it to customize any order.',
      prompt: '___ azúcar, gracias.',
      hint_en: 'Without sugar, thanks.',
      correct_answer: 'Sin',
      distractors: ['Con', 'Un', 'Para'],
    },
    {
      id: '0b200000-0022-4000-8000-000000000003',
      pattern_template: '¿Quiere una taza ___ o pequeña?',
      pattern_en: 'Do you want a large or small cup?',
      explanation:
        '"Grande" means "large." "Pequeña" means "small." Use with "o" (or) to offer a choice.',
      prompt: '¿Quiere una taza ___ o pequeña?',
      hint_en: 'Do you want a large or small cup?',
      correct_answer: 'grande',
      distractors: ['caliente', 'dulce', 'solo'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000131', text: 'café', meaning_en: 'coffee / cafe', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000132', text: 'leche', meaning_en: 'milk', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000133', text: 'azúcar', meaning_en: 'sugar', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000134', text: 'taza', meaning_en: 'cup / mug', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000135', text: 'helado', meaning_en: 'iced / ice cream', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000136', text: 'dulce', meaning_en: 'sweet', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000137', text: 'solo', meaning_en: 'alone / just / black (coffee)', part_of_speech: 'adjective' },
  ],
  existingWordTexts: [
    'quiero', 'por favor', 'gracias', 'agua', 'beber',
    // From Unit 1:
    'una', 'grande', 'tiene', 'también',
    // From Scene 3.1:
    'con', 'sin', 'para',
    // From Scene 3.2:
    'poco', 'caliente',
  ],
};

export const UNIT3_SCENES: DialogueSceneData[] = [scene3_1, scene3_2, scene3_3, scene3_4];
