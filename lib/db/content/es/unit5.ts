// Unit 5: Daily Life & Socializing — Spanish language learning content
// 3 scenes covering neighborhood life, daily routines, and making plans with friends.

import type { DialogueSceneData } from '../../dialogue-data';

// ── Scene 5.1: En el barrio (Getting to Know the Neighborhood) ───────

const scene5_1: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000027',
  title: 'En el barrio',
  description: 'Getting to know your neighborhood and chatting with a neighbor',
  scene_context:
    'You have just moved into your apartment in a Spanish-speaking city. Your neighbor greets you in the hallway and you chat about the neighborhood, what you like about it, and daily life. Practice neighborhood vocabulary and expressing likes.',
  sort_order: 17,
  dialogues: [
    {
      id: 'e2000000-0027-4000-8000-000000000001',
      speaker: 'Vecina',
      text_target: '!Hola! ?Eres nueva aqui? Me llamo Rosa. Vivo en el apartamento de al lado.',
      text_en: 'Hello! Are you new here? My name is Rosa. I live in the apartment next door.',
    },
    {
      id: 'e2000000-0027-4000-8000-000000000002',
      speaker: 'You',
      text_target: '!Hola, Rosa! Si, soy nueva. ?Como es el barrio?',
      text_en: 'Hello, Rosa! Yes, I am new. What is the neighborhood like?',
    },
    {
      id: 'e2000000-0027-4000-8000-000000000003',
      speaker: 'Vecina',
      text_target: 'El barrio es muy bonito y tranquilo. Hay tiendas cerca y un parque grande.',
      text_en: 'The neighborhood is very pretty and quiet. There are shops nearby and a big park.',
    },
    {
      id: 'e2000000-0027-4000-8000-000000000004',
      speaker: 'You',
      text_target: '!Que bueno! Me gusta mucho la vida aqui. La gente es muy amable.',
      text_en: 'How nice! I really like the life here. The people are very friendly.',
    },
    {
      id: 'e2000000-0027-4000-8000-000000000005',
      speaker: 'Vecina',
      text_target: 'Si, siempre hay gente en el parque por la manana y por la tarde.',
      text_en: 'Yes, there are always people in the park in the morning and in the afternoon.',
    },
    {
      id: 'e2000000-0027-4000-8000-000000000006',
      speaker: 'You',
      text_target: '?Nunca es ruidoso? Yo vengo de una casa tranquila.',
      text_en: 'It is never noisy? I come from a quiet house.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0027-4000-8000-000000000001',
      text_target: '?Como es el barrio?',
      text_en: 'What is the neighborhood like?',
      literal_translation: 'How is the neighborhood?',
      usage_note:
        'Use "?Como es ...?" to ask what something is like in general. Different from "?Como esta?" which asks about a temporary state.',
      wordTexts: ['barrio'],
    },
    {
      id: 'f2000000-0027-4000-8000-000000000002',
      text_target: 'Me gusta mucho',
      text_en: 'I like it a lot',
      literal_translation: 'Me pleases much',
      usage_note:
        '"Gustar" works differently — the thing you like is the subject. "Me gusta" = it pleases me = I like it.',
      wordTexts: ['gustar', 'me gusta'],
    },
    {
      id: 'f2000000-0027-4000-8000-000000000003',
      text_target: 'Vivo en el barrio',
      text_en: 'I live in the neighborhood',
      literal_translation: 'I-live in the neighborhood',
      usage_note:
        '"Vivir" means to live. "Vivo en ..." tells where you live. A key phrase for settling in.',
      wordTexts: ['vivir'],
    },
    {
      id: 'f2000000-0027-4000-8000-000000000004',
      text_target: 'Siempre hay gente',
      text_en: 'There are always people',
      literal_translation: 'Always there-is people',
      usage_note:
        '"Siempre" means always. Place it before the verb to describe something that happens all the time.',
      wordTexts: ['siempre'],
    },
    {
      id: 'f2000000-0027-4000-8000-000000000005',
      text_target: 'Por la manana',
      text_en: 'In the morning',
      literal_translation: 'By the morning',
      usage_note:
        '"Por la manana" = in the morning, "por la tarde" = in the afternoon, "por la noche" = in the evening.',
      wordTexts: ['manana', 'tarde'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0027-4000-8000-000000000001',
      pattern_template: 'Me ___ el barrio',
      pattern_en: 'I like the neighborhood',
      explanation:
        '"Me gusta" means "I like." The thing you like comes after "gusta." Use "gustan" for plural nouns.',
      prompt: 'Me ___ el barrio.',
      hint_en: 'I like the neighborhood.',
      correct_answer: 'gusta',
      distractors: ['gusto', 'gustan', 'quiero'],
    },
    {
      id: '0b200000-0027-4000-8000-000000000002',
      pattern_template: '___ hay gente en el parque',
      pattern_en: 'There are always people in the park',
      explanation:
        '"Siempre" means "always." Place it before the verb to express frequency.',
      prompt: '___ hay gente en el parque.',
      hint_en: 'There are always people in the park.',
      correct_answer: 'Siempre',
      distractors: ['Nunca', 'Todos', 'Mucho'],
    },
    {
      id: '0b200000-0027-4000-8000-000000000003',
      pattern_template: 'Yo ___ en este barrio',
      pattern_en: 'I live in this neighborhood',
      explanation:
        '"Vivo" is "I live" from "vivir." Use "vivo en" + place to say where you live.',
      prompt: 'Yo ___ en este barrio.',
      hint_en: 'I live in this neighborhood.',
      correct_answer: 'vivo',
      distractors: ['soy', 'estoy', 'tengo'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000176', text: 'barrio', meaning_en: 'neighborhood', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000177', text: 'vivir', meaning_en: 'to live', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000178', text: 'casa', meaning_en: 'house / home', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000179', text: 'tiempo', meaning_en: 'time / weather', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000180', text: 'manana', meaning_en: 'morning / tomorrow', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000181', text: 'tarde', meaning_en: 'afternoon / late', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000182', text: 'siempre', meaning_en: 'always', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000183', text: 'nunca', meaning_en: 'never', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000184', text: 'todos los dias', meaning_en: 'every day', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000185', text: 'gustar', meaning_en: 'to like / to please', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000186', text: 'me gusta', meaning_en: 'I like (it pleases me)', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000187', text: 'la vida', meaning_en: 'life', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'hola', 'como', 'estas', 'bien', 'bueno', 'bonito', 'aqui', 'cerca', 'hay', 'amigo', 'gente',
    // From Unit 1:
    'me llamo', 'si', 'muy', 'amable', 'eres', 'grande', 'tienda', 'este',
    // From Unit 2:
    'parque',
  ],
};

// ── Scene 5.2: Un dia normal (Describing Daily Routine) ──────────────

const scene5_2: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000028',
  title: 'Un dia normal',
  description: 'Describing your daily routine to a new friend',
  scene_context:
    'You are having coffee with your neighbor Rosa. She asks about your daily routine and you compare schedules. Practice daily activity verbs, time expressions, and sequencing words.',
  sort_order: 18,
  dialogues: [
    {
      id: 'e2000000-0028-4000-8000-000000000001',
      speaker: 'Vecina',
      text_target: '?A que hora te despiertas? Yo me despierto muy temprano.',
      text_en: 'What time do you wake up? I wake up very early.',
    },
    {
      id: 'e2000000-0028-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Me despierto a las siete. Primero desayuno, luego camino al trabajo.',
      text_en: 'I wake up at seven. First I have breakfast, then I walk to work.',
    },
    {
      id: 'e2000000-0028-4000-8000-000000000003',
      speaker: 'Vecina',
      text_target: '?Caminas al trabajo? ?A que hora es el almuerzo?',
      text_en: 'You walk to work? What time is lunch?',
    },
    {
      id: 'e2000000-0028-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'El almuerzo es a la una. Despues trabajo hasta las cinco.',
      text_en: 'Lunch is at one. After that I work until five.',
    },
    {
      id: 'e2000000-0028-4000-8000-000000000005',
      speaker: 'Vecina',
      text_target: '?Y la cena? ?Cocinas en casa o comes en un restaurante?',
      text_en: 'And dinner? Do you cook at home or eat at a restaurant?',
    },
    {
      id: 'e2000000-0028-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Siempre cocino en casa. Cuando termino, duermo a las diez.',
      text_en: 'I always cook at home. When I finish, I sleep at ten.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0028-4000-8000-000000000001',
      text_target: '?A que hora te despiertas?',
      text_en: 'What time do you wake up?',
      literal_translation: 'At what hour you wake-up?',
      usage_note:
        '"?A que hora ...?" is how you ask what time something happens. Essential for talking about schedules.',
      wordTexts: ['hora', 'despertarse'],
    },
    {
      id: 'f2000000-0028-4000-8000-000000000002',
      text_target: 'Primero desayuno, luego trabajo',
      text_en: 'First I have breakfast, then I work',
      literal_translation: 'First breakfast, then work',
      usage_note:
        '"Primero ... luego ..." is how you sequence events. Very natural way to describe a routine.',
      wordTexts: ['desayuno', 'luego'],
    },
    {
      id: 'f2000000-0028-4000-8000-000000000003',
      text_target: 'Cocino en casa',
      text_en: 'I cook at home',
      literal_translation: 'I-cook at home',
      usage_note:
        '"Cocinar" means to cook. "En casa" means at home. A common phrase for daily life.',
      wordTexts: ['cocinar', 'casa'],
    },
    {
      id: 'f2000000-0028-4000-8000-000000000004',
      text_target: 'Trabajo hasta las cinco',
      text_en: 'I work until five',
      literal_translation: 'I-work until the five',
      usage_note:
        '"Hasta" means "until." Use it with times to say when something ends.',
      wordTexts: ['trabajar'],
    },
    {
      id: 'f2000000-0028-4000-8000-000000000005',
      text_target: 'Duermo a las diez',
      text_en: 'I sleep at ten',
      literal_translation: 'I-sleep at the ten',
      usage_note:
        '"Dormir" means to sleep. It changes to "duermo" in the first person — a common stem change.',
      wordTexts: ['dormir'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0028-4000-8000-000000000001',
      pattern_template: 'Me ___ a las siete',
      pattern_en: 'I wake up at seven',
      explanation:
        '"Despertarse" is a reflexive verb — it uses "me" for "I." "Me despierto" = I wake up.',
      prompt: 'Me ___ a las siete.',
      hint_en: 'I wake up at seven.',
      correct_answer: 'despierto',
      distractors: ['duermo', 'como', 'llamo'],
    },
    {
      id: '0b200000-0028-4000-8000-000000000002',
      pattern_template: 'Primero ___, luego trabajo',
      pattern_en: 'First I have breakfast, then I work',
      explanation:
        '"Desayuno" means "I have breakfast" or "breakfast." Use "primero ... luego ..." to sequence activities.',
      prompt: 'Primero ___, luego trabajo.',
      hint_en: 'First I have breakfast, then I work.',
      correct_answer: 'desayuno',
      distractors: ['almuerzo', 'cena', 'cocino'],
    },
    {
      id: '0b200000-0028-4000-8000-000000000003',
      pattern_template: 'Cuando termino, ___ a las diez',
      pattern_en: 'When I finish, I sleep at ten',
      explanation:
        '"Cuando" means "when." Use it to connect two actions: when one ends, another begins.',
      prompt: '___ termino, duermo a las diez.',
      hint_en: 'When I finish, I sleep at ten.',
      correct_answer: 'Cuando',
      distractors: ['Siempre', 'Luego', 'Despues'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000188', text: 'despertarse', meaning_en: 'to wake up', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000189', text: 'desayuno', meaning_en: 'breakfast', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000190', text: 'trabajar', meaning_en: 'to work', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000191', text: 'hora', meaning_en: 'hour / time', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000192', text: 'temprano', meaning_en: 'early', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000193', text: 'almuerzo', meaning_en: 'lunch', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000194', text: 'cena', meaning_en: 'dinner', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000195', text: 'cocinar', meaning_en: 'to cook', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000196', text: 'caminar', meaning_en: 'to walk', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000197', text: 'dormir', meaning_en: 'to sleep', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000198', text: 'cuando', meaning_en: 'when', part_of_speech: 'conjunction' },
    { id: 'b2000000-0001-4000-8000-000000000199', text: 'luego', meaning_en: 'then / later', part_of_speech: 'adverb' },
  ],
  existingWordTexts: [
    'comer', 'beber', 'ir', 'a',
    // From Unit 1:
    'noche', 'muy',
    // From Unit 2:
    'despues',
    // From Unit 3:
    'cafe',
    // From Scene 5.1:
    'manana', 'tarde', 'siempre', 'casa',
  ],
};

// ── Scene 5.3: Haciendo planes (Making Plans with Friends) ────────────

const scene5_3: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000029',
  title: 'Haciendo planes',
  description: 'Making plans for an outing with friends',
  scene_context:
    'Your new friend from the neighborhood invites you to go out this evening. You discuss what to do, when to meet, and who else is coming. Practice making plans, expressing ability, and showing enthusiasm.',
  sort_order: 19,
  dialogues: [
    {
      id: 'e2000000-0029-4000-8000-000000000001',
      speaker: 'Rosa',
      text_target: '!Hola! ?Quieres ir a una fiesta esta noche? Un amigo nos invita.',
      text_en: 'Hello! Do you want to go to a party tonight? A friend is inviting us.',
    },
    {
      id: 'e2000000-0029-4000-8000-000000000002',
      speaker: 'You',
      text_target: '!Claro que si! ?Que tipo de fiesta? ?Hay una pelicula tambien?',
      text_en: 'Of course! What kind of party? Is there a movie too?',
    },
    {
      id: 'e2000000-0029-4000-8000-000000000003',
      speaker: 'Rosa',
      text_target: 'No, solo una fiesta con musica. ?Puedes ir a las ocho?',
      text_en: 'No, just a party with music. Can you go at eight?',
    },
    {
      id: 'e2000000-0029-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Si, puedo ir. ?Vamos juntos? !Que genial!',
      text_en: 'Yes, I can go. Shall we go together? How great!',
    },
    {
      id: 'e2000000-0029-4000-8000-000000000005',
      speaker: 'Rosa',
      text_target: '!Perfecto! Nos vemos a las ocho en mi casa. !Va a ser divertido!',
      text_en: 'Perfect! See you at eight at my house. It is going to be fun!',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0029-4000-8000-000000000001',
      text_target: '!Vamos juntos!',
      text_en: 'Let us go together!',
      literal_translation: 'We-go together!',
      usage_note:
        '"Vamos" means "let us go" or "we go." Adding "juntos" means together. Great for making plans.',
      wordTexts: ['vamos', 'juntos'],
    },
    {
      id: 'f2000000-0029-4000-8000-000000000002',
      text_target: '!Claro que si!',
      text_en: 'Of course!',
      literal_translation: 'Clear that yes!',
      usage_note:
        '"Claro" means "of course." Adding "que si" makes it emphatic — an enthusiastic yes.',
      wordTexts: ['claro'],
    },
    {
      id: 'f2000000-0029-4000-8000-000000000003',
      text_target: '!Nos vemos!',
      text_en: 'See you!',
      literal_translation: 'Us we-see!',
      usage_note:
        'A common way to say goodbye when you plan to meet again. Literally "we see each other."',
      wordTexts: ['nos vemos'],
    },
    {
      id: 'f2000000-0029-4000-8000-000000000004',
      text_target: '?Puedes ir?',
      text_en: 'Can you go?',
      literal_translation: 'Can-you go?',
      usage_note:
        '"Poder" means "to be able to / can." "Puedes" is the informal "you can." Essential for making plans.',
      wordTexts: ['poder'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0029-4000-8000-000000000001',
      pattern_template: '?___ ir a la fiesta?',
      pattern_en: 'Can you go to the party?',
      explanation:
        '"Puedes" means "can you." Use "?Puedes + infinitive?" to ask if someone is able to do something.',
      prompt: '?___ ir a la fiesta?',
      hint_en: 'Can you go to the party?',
      correct_answer: 'Puedes',
      distractors: ['Quieres', 'Tienes', 'Vienes'],
    },
    {
      id: '0b200000-0029-4000-8000-000000000002',
      pattern_template: '!___ juntos!',
      pattern_en: 'Let us go together!',
      explanation:
        '"Vamos" means "let us go" or "we go." It is also used to suggest doing something together.',
      prompt: '!___ juntos!',
      hint_en: 'Let us go together!',
      correct_answer: 'Vamos',
      distractors: ['Somos', 'Estamos', 'Tenemos'],
    },
    {
      id: '0b200000-0029-4000-8000-000000000003',
      pattern_template: 'Un amigo nos ___',
      pattern_en: 'A friend is inviting us',
      explanation:
        '"Invitar" means "to invite." "Nos invita" means "invites us." Common when relaying plans.',
      prompt: 'Un amigo nos ___.',
      hint_en: 'A friend is inviting us.',
      correct_answer: 'invita',
      distractors: ['llama', 'quiere', 'tiene'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000200', text: 'vamos', meaning_en: 'let us go / we go', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000201', text: 'juntos', meaning_en: 'together', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000202', text: 'fiesta', meaning_en: 'party / celebration', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000203', text: 'pelicula', meaning_en: 'movie / film', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000204', text: 'invitar', meaning_en: 'to invite', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000205', text: 'poder', meaning_en: 'to be able to / can', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000206', text: 'claro', meaning_en: 'of course / clear', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000207', text: 'genial', meaning_en: 'great / awesome', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000208', text: 'nos vemos', meaning_en: 'see you / we will see each other', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000209', text: 'que', meaning_en: 'what / how (exclamation)', part_of_speech: 'pronoun' },
  ],
  existingWordTexts: [
    'amigo', 'quiero', 'ir', 'a', 'bueno', 'si', 'no',
    // From Unit 1:
    'hola', 'noche', 'tambien',
    // From Unit 2:
    'hoy',
    // From Scene 5.1:
    'tarde',
    // From Scene 5.2:
    'cuando',
    // From Unit 4:
    'perfecto',
  ],
};

export const UNIT5_SCENES: DialogueSceneData[] = [scene5_1, scene5_2, scene5_3];
