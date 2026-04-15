// Unit 2: Getting Around — Spanish language learning content
// 4 scenes covering navigating a Spanish-speaking city.

import type { DialogueSceneData } from '../../dialogue-data';

// ── Scene 2.1: El taxi (Taking a Taxi) ──────────────────────────────

const scene2_1: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000015',
  title: 'El taxi',
  description: 'Taking a taxi from the hotel to the city center',
  scene_context:
    'You need to get from your hotel to the city center. You flag down a taxi outside and negotiate the ride. Practice giving directions to a driver and asking about fares.',
  sort_order: 5,
  dialogues: [
    {
      id: 'e2000000-0015-4000-8000-000000000001',
      speaker: 'You',
      text_target: '!Hola! Necesito ir al centro, por favor.',
      text_en: 'Hello! I need to go to the center, please.',
    },
    {
      id: 'e2000000-0015-4000-8000-000000000002',
      speaker: 'Taxista',
      text_target: '!Claro! Suba. ?Sabe la direccion?',
      text_en: 'Of course! Get in. Do you know the address?',
    },
    {
      id: 'e2000000-0015-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Si, por esta calle, por favor. No muy rapido.',
      text_en: 'Yes, along this street, please. Not too fast.',
    },
    {
      id: 'e2000000-0015-4000-8000-000000000004',
      speaker: 'Taxista',
      text_target: 'Tranquilo. ?Quiere ir por la avenida o por las calles pequenas?',
      text_en: 'Relax. Do you want to go via the avenue or the small streets?',
    },
    {
      id: 'e2000000-0015-4000-8000-000000000005',
      speaker: 'You',
      text_target: 'Por la avenida, es mas rapido. ?Cuanto cuesta?',
      text_en: 'Via the avenue, it is faster. How much does it cost?',
    },
    {
      id: 'e2000000-0015-4000-8000-000000000006',
      speaker: 'Taxista',
      text_target: 'Diez euros. Puede parar aqui, ?verdad?',
      text_en: 'Ten euros. I can stop here, right?',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0015-4000-8000-000000000001',
      text_target: 'Necesito ir a ...',
      text_en: 'I need to go to ...',
      literal_translation: 'I-need to-go to ...',
      usage_note:
        'Use "necesito ir a" + place to tell a driver where you want to go.',
      wordTexts: ['necesito', 'ir'],
    },
    {
      id: 'f2000000-0015-4000-8000-000000000002',
      text_target: '?Cuanto cuesta?',
      text_en: 'How much does it cost?',
      literal_translation: 'How-much costs?',
      usage_note:
        'Essential phrase for taxis, shops, and restaurants. Always ask before you ride.',
      wordTexts: ['cuanto cuesta'],
    },
    {
      id: 'f2000000-0015-4000-8000-000000000003',
      text_target: 'No muy rapido',
      text_en: 'Not too fast',
      literal_translation: 'Not very fast',
      usage_note:
        'A polite way to ask a taxi driver to slow down. "Rapido" means fast.',
      wordTexts: ['rapido'],
    },
    {
      id: 'f2000000-0015-4000-8000-000000000004',
      text_target: 'Puede parar aqui',
      text_en: 'You can stop here',
      literal_translation: 'Can stop here',
      usage_note:
        'Use "puede parar" to tell the driver to stop. "Aqui" means here.',
      wordTexts: ['parar', 'aqui'],
    },
    {
      id: 'f2000000-0015-4000-8000-000000000005',
      text_target: 'Por esta calle',
      text_en: 'Along this street',
      literal_translation: 'By this street',
      usage_note:
        '"Por" + place gives a general direction or route to follow.',
      wordTexts: ['calle'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0015-4000-8000-000000000001',
      pattern_template: 'Necesito ___ al centro',
      pattern_en: 'I need to go to the center',
      explanation:
        '"Ir" means "to go." Use "necesito ir a" + place to say where you need to go.',
      prompt: 'Necesito ___ al centro.',
      hint_en: 'I need to go to the center.',
      correct_answer: 'ir',
      distractors: ['parar', 'cuesta', 'tiene'],
    },
    {
      id: '0b200000-0015-4000-8000-000000000002',
      pattern_template: '?Cuanto ___?',
      pattern_en: 'How much does it cost?',
      explanation:
        '"Cuanto cuesta" asks the price of something. "Cuesta" means "it costs."',
      prompt: '?Cuanto ___?',
      hint_en: 'How much does it cost?',
      correct_answer: 'cuesta',
      distractors: ['ir', 'parar', 'tiene'],
    },
    {
      id: '0b200000-0015-4000-8000-000000000003',
      pattern_template: 'Puede ___ aqui',
      pattern_en: 'You can stop here',
      explanation:
        '"Puede" means "you can." "Parar" means "to stop." Use this to tell the driver where to stop.',
      prompt: 'Puede ___ aqui.',
      hint_en: 'You can stop here.',
      correct_answer: 'parar',
      distractors: ['ir', 'cuesta', 'llevar'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000061', text: 'taxi', meaning_en: 'taxi', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000062', text: 'ir', meaning_en: 'to go', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000063', text: 'a', meaning_en: 'to / at', part_of_speech: 'preposition' },
    { id: 'b2000000-0001-4000-8000-000000000064', text: 'rapido', meaning_en: 'fast / quick', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000065', text: 'lento', meaning_en: 'slow', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000066', text: 'centro', meaning_en: 'center / downtown', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000067', text: 'parar', meaning_en: 'to stop', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000068', text: 'llevar', meaning_en: 'to take / to carry', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000069', text: 'cuanto cuesta', meaning_en: 'how much does it cost', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000070', text: 'por', meaning_en: 'by / through / along', part_of_speech: 'preposition' },
  ],
  existingWordTexts: [
    'hola', 'gracias', 'por favor', 'bueno', 'dinero',
    // From Unit 1:
    'aqui', 'calle', 'necesito', 'muy', 'si',
  ],
};

// ── Scene 2.2: El metro (Using Public Transit) ──────────────────────

const scene2_2: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000016',
  title: 'El metro',
  description: 'Navigating the metro system in the city',
  scene_context:
    'You want to take the metro across the city. You approach the ticket booth and ask a fellow passenger for help finding the right line. Practice buying tickets and understanding transit directions.',
  sort_order: 6,
  dialogues: [
    {
      id: 'e2000000-0016-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Perdon, ?donde esta la estacion de metro?',
      text_en: 'Excuse me, where is the metro station?',
    },
    {
      id: 'e2000000-0016-4000-8000-000000000002',
      speaker: 'Local',
      text_target: 'Esta aqui, en la entrada. ?Necesita un boleto?',
      text_en: 'It is here, at the entrance. Do you need a ticket?',
    },
    {
      id: 'e2000000-0016-4000-8000-000000000003',
      speaker: 'You',
      text_target: 'Si, un boleto, por favor. ?Que linea va al centro?',
      text_en: 'Yes, one ticket, please. Which line goes to the center?',
    },
    {
      id: 'e2000000-0016-4000-8000-000000000004',
      speaker: 'Local',
      text_target: 'La linea tres. El proximo tren llega en cinco minutos.',
      text_en: 'Line three. The next train arrives in five minutes.',
    },
    {
      id: 'e2000000-0016-4000-8000-000000000005',
      speaker: 'You',
      text_target: '?Necesito cambiar de linea?',
      text_en: 'Do I need to change lines?',
    },
    {
      id: 'e2000000-0016-4000-8000-000000000006',
      speaker: 'Local',
      text_target: 'No, es directo. La parada es la siguiente. La salida esta a la derecha.',
      text_en: 'No, it is direct. The stop is the next one. The exit is on the right.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0016-4000-8000-000000000001',
      text_target: '?Donde esta la estacion?',
      text_en: 'Where is the station?',
      literal_translation: 'Where is the station?',
      usage_note:
        'Use "?Donde esta ...?" to ask where a specific place is located.',
      wordTexts: ['estacion'],
    },
    {
      id: 'f2000000-0016-4000-8000-000000000002',
      text_target: 'Un boleto, por favor',
      text_en: 'One ticket, please',
      literal_translation: 'A ticket, please',
      usage_note:
        'The basic phrase for buying a single ticket. Add a number for multiple: "dos boletos."',
      wordTexts: ['boleto'],
    },
    {
      id: 'f2000000-0016-4000-8000-000000000003',
      text_target: '?Que linea va a ...?',
      text_en: 'Which line goes to ...?',
      literal_translation: 'What line goes to ...?',
      usage_note:
        '"?Que linea?" asks which metro or bus line. "Va a" means "goes to."',
      wordTexts: ['linea'],
    },
    {
      id: 'f2000000-0016-4000-8000-000000000004',
      text_target: 'El proximo tren',
      text_en: 'The next train',
      literal_translation: 'The next train',
      usage_note:
        '"Proximo" means "next." Use it for trains, buses, or any upcoming event.',
      wordTexts: ['proximo', 'tren'],
    },
    {
      id: 'f2000000-0016-4000-8000-000000000005',
      text_target: '?Necesito cambiar de linea?',
      text_en: 'Do I need to change lines?',
      literal_translation: 'Need-I to-change of line?',
      usage_note:
        '"Cambiar" means "to change." Essential for multi-line metro journeys.',
      wordTexts: ['cambiar', 'linea'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0016-4000-8000-000000000001',
      pattern_template: '?Donde esta la ___?',
      pattern_en: 'Where is the ___?',
      explanation:
        '"?Donde esta ...?" asks where something specific is. Follow with the place you seek.',
      prompt: '?Donde esta la ___?',
      hint_en: 'Where is the station?',
      correct_answer: 'estacion',
      distractors: ['boleto', 'linea', 'tren'],
    },
    {
      id: '0b200000-0016-4000-8000-000000000002',
      pattern_template: 'El ___ tren llega en cinco minutos',
      pattern_en: 'The next train arrives in five minutes',
      explanation:
        '"Proximo" means "next." Place it before the noun it describes.',
      prompt: 'El ___ tren llega en cinco minutos.',
      hint_en: 'The next train arrives in five minutes.',
      correct_answer: 'proximo',
      distractors: ['siguiente', 'ultimo', 'grande'],
    },
    {
      id: '0b200000-0016-4000-8000-000000000003',
      pattern_template: '?Necesito ___ de linea?',
      pattern_en: 'Do I need to change lines?',
      explanation:
        '"Cambiar" means "to change." Use "cambiar de" + noun to switch between things.',
      prompt: '?Necesito ___ de linea?',
      hint_en: 'Do I need to change lines?',
      correct_answer: 'cambiar',
      distractors: ['ir', 'parar', 'llevar'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000071', text: 'estacion', meaning_en: 'station', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000072', text: 'linea', meaning_en: 'line', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000073', text: 'boleto', meaning_en: 'ticket', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000074', text: 'tren', meaning_en: 'train', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000075', text: 'proximo', meaning_en: 'next (upcoming)', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000076', text: 'siguiente', meaning_en: 'following / next', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000077', text: 'salida', meaning_en: 'exit', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000078', text: 'entrada', meaning_en: 'entrance', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000079', text: 'cambiar', meaning_en: 'to change', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000080', text: 'parada', meaning_en: 'stop (bus/metro)', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'donde', 'gracias', 'por favor', 'si', 'no',
    // From Unit 1:
    'aqui', 'necesito', 'cerca', 'derecha',
    // From Scene 2.1:
    'ir', 'centro',
  ],
};

// ── Scene 2.3: Pidiendo direcciones (Asking for Directions) ─────────

const scene2_3: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000017',
  title: 'Pidiendo direcciones',
  description: 'Asking for directions on the street',
  scene_context:
    'You are walking through the city and need to find a famous plaza. You stop a passerby to ask for directions. Practice understanding and giving directions with landmarks.',
  sort_order: 7,
  dialogues: [
    {
      id: 'e2000000-0017-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Perdon, ?como llego a la plaza central?',
      text_en: 'Excuse me, how do I get to the central plaza?',
    },
    {
      id: 'e2000000-0017-4000-8000-000000000002',
      speaker: 'Local',
      text_target: 'Siga todo recto por esta calle.',
      text_en: 'Go straight ahead along this street.',
    },
    {
      id: 'e2000000-0017-4000-8000-000000000003',
      speaker: 'You',
      text_target: '?Y despues?',
      text_en: 'And then?',
    },
    {
      id: 'e2000000-0017-4000-8000-000000000004',
      speaker: 'Local',
      text_target: 'Despues del semaforo, gire a la izquierda. La plaza esta en la esquina.',
      text_en: 'After the traffic light, turn left. The plaza is on the corner.',
    },
    {
      id: 'e2000000-0017-4000-8000-000000000005',
      speaker: 'You',
      text_target: '?Esta lejos? ?Necesito cruzar la calle?',
      text_en: 'Is it far? Do I need to cross the street?',
    },
    {
      id: 'e2000000-0017-4000-8000-000000000006',
      speaker: 'Local',
      text_target: 'No, esta cerca. Cruce en el semaforo. La plaza esta al lado del museo.',
      text_en: 'No, it is close. Cross at the traffic light. The plaza is next to the museum.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0017-4000-8000-000000000001',
      text_target: 'Siga todo recto',
      text_en: 'Go straight ahead',
      literal_translation: 'Continue all straight',
      usage_note:
        '"Todo recto" means straight ahead. "Siga" is a polite command for "continue."',
      wordTexts: ['todo recto'],
    },
    {
      id: 'f2000000-0017-4000-8000-000000000002',
      text_target: 'Gire a la izquierda',
      text_en: 'Turn left',
      literal_translation: 'Turn to the left',
      usage_note:
        '"Gire" is the polite command for "turn." Use "a la derecha" for right.',
      wordTexts: ['girar', 'izquierda'],
    },
    {
      id: 'f2000000-0017-4000-8000-000000000003',
      text_target: 'Al lado de ...',
      text_en: 'Next to ...',
      literal_translation: 'At the side of ...',
      usage_note:
        'Use "al lado de" + place to say something is next to something else.',
      wordTexts: ['al lado de'],
    },
    {
      id: 'f2000000-0017-4000-8000-000000000004',
      text_target: 'Cruce la calle',
      text_en: 'Cross the street',
      literal_translation: 'Cross the street',
      usage_note:
        '"Cruce" is the polite command for "cross." Use it with streets and intersections.',
      wordTexts: ['cruzar', 'calle'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0017-4000-8000-000000000001',
      pattern_template: 'Siga todo ___',
      pattern_en: 'Go straight ahead',
      explanation:
        '"Todo recto" means "straight ahead." "Siga" means "continue" in a polite form.',
      prompt: 'Siga todo ___.',
      hint_en: 'Go straight ahead.',
      correct_answer: 'recto',
      distractors: ['cerca', 'lejos', 'rapido'],
    },
    {
      id: '0b200000-0017-4000-8000-000000000002',
      pattern_template: '___ a la izquierda',
      pattern_en: 'Turn left',
      explanation:
        '"Gire" means "turn" as a polite instruction. Follow with "a la izquierda" or "a la derecha."',
      prompt: '___ a la izquierda.',
      hint_en: 'Turn left.',
      correct_answer: 'Gire',
      distractors: ['Siga', 'Cruce', 'Pare'],
    },
    {
      id: '0b200000-0017-4000-8000-000000000003',
      pattern_template: '___ del semaforo, gire a la derecha',
      pattern_en: 'After the traffic light, turn right',
      explanation:
        '"Despues" means "after." Use "despues de" + landmark for location directions.',
      prompt: '___ del semaforo, gire a la derecha.',
      hint_en: 'After the traffic light, turn right.',
      correct_answer: 'Despues',
      distractors: ['Antes', 'Enfrente', 'Entre'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000081', text: 'todo recto', meaning_en: 'straight ahead', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000082', text: 'girar', meaning_en: 'to turn', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000083', text: 'esquina', meaning_en: 'corner', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000084', text: 'semaforo', meaning_en: 'traffic light', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000085', text: 'cruzar', meaning_en: 'to cross', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000086', text: 'despues', meaning_en: 'after / then', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000087', text: 'antes', meaning_en: 'before', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000088', text: 'al lado de', meaning_en: 'next to', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000089', text: 'enfrente', meaning_en: 'in front of / opposite', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000090', text: 'entre', meaning_en: 'between', part_of_speech: 'preposition' },
  ],
  existingWordTexts: [
    'izquierda', 'derecha', 'donde', 'hay',
    // From Unit 1:
    'calle', 'cerca', 'lejos', 'perdon',
    // From Scene 2.1:
    'ir',
  ],
};

// ── Scene 2.4: Visitando lugares (Visiting Landmarks) ───────────────

const scene2_4: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000018',
  title: 'Visitando lugares',
  description: 'Visiting landmarks and attractions in the city',
  scene_context:
    'You arrive at a famous plaza and want to visit the nearby museum and church. You ask a guide about opening hours and tickets. Practice talking about places and schedules.',
  sort_order: 8,
  dialogues: [
    {
      id: 'e2000000-0018-4000-8000-000000000001',
      speaker: 'You',
      text_target: '!Hola! ?El museo esta abierto hoy?',
      text_en: 'Hello! Is the museum open today?',
    },
    {
      id: 'e2000000-0018-4000-8000-000000000002',
      speaker: 'Guia',
      text_target: 'Si, esta abierto. El horario es de nueve a cinco.',
      text_en: 'Yes, it is open. The schedule is from nine to five.',
    },
    {
      id: 'e2000000-0018-4000-8000-000000000003',
      speaker: 'You',
      text_target: '?Cuanto cuesta la entrada?',
      text_en: 'How much does the entrance ticket cost?',
    },
    {
      id: 'e2000000-0018-4000-8000-000000000004',
      speaker: 'Guia',
      text_target: 'La entrada cuesta ocho euros. El museo es muy bonito.',
      text_en: 'The entrance costs eight euros. The museum is very pretty.',
    },
    {
      id: 'e2000000-0018-4000-8000-000000000005',
      speaker: 'You',
      text_target: '?Hay una iglesia cerca? ?Tambien esta abierta?',
      text_en: 'Is there a church nearby? Is it also open?',
    },
    {
      id: 'e2000000-0018-4000-8000-000000000006',
      speaker: 'Guia',
      text_target: 'Si, la iglesia esta en la plaza. Esta abierta pero el parque esta cerrado hoy.',
      text_en: 'Yes, the church is in the plaza. It is open but the park is closed today.',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0018-4000-8000-000000000001',
      text_target: '?Esta abierto?',
      text_en: 'Is it open?',
      literal_translation: 'Is open?',
      usage_note:
        'Use "abierto" for masculine nouns, "abierta" for feminine. Essential for visiting places.',
      wordTexts: ['abierto'],
    },
    {
      id: 'f2000000-0018-4000-8000-000000000002',
      text_target: 'Esta cerrado',
      text_en: 'It is closed',
      literal_translation: 'Is closed',
      usage_note:
        'The opposite of "abierto." "Cerrado" for masculine, "cerrada" for feminine.',
      wordTexts: ['cerrado'],
    },
    {
      id: 'f2000000-0018-4000-8000-000000000003',
      text_target: '?Cuanto cuesta la entrada?',
      text_en: 'How much does the entrance cost?',
      literal_translation: 'How-much costs the entrance?',
      usage_note:
        '"Entrada" can mean both "entrance" and "ticket" depending on context.',
      wordTexts: ['cuanto cuesta', 'entrada'],
    },
    {
      id: 'f2000000-0018-4000-8000-000000000004',
      text_target: 'El horario es de ... a ...',
      text_en: 'The schedule is from ... to ...',
      literal_translation: 'The schedule is of ... to ...',
      usage_note:
        'Use "de ... a ..." with times to say opening and closing hours.',
      wordTexts: ['horario'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0018-4000-8000-000000000001',
      pattern_template: '?El museo esta ___?',
      pattern_en: 'Is the museum open?',
      explanation:
        '"Abierto" means "open." Use "esta abierto" for masculine places, "esta abierta" for feminine.',
      prompt: '?El museo esta ___?',
      hint_en: 'Is the museum open?',
      correct_answer: 'abierto',
      distractors: ['cerrado', 'grande', 'bonito'],
    },
    {
      id: '0b200000-0018-4000-8000-000000000002',
      pattern_template: 'El parque esta ___ hoy',
      pattern_en: 'The park is closed today',
      explanation:
        '"Cerrado" means "closed." The opposite of "abierto." Use it for places that are not open.',
      prompt: 'El parque esta ___ hoy.',
      hint_en: 'The park is closed today.',
      correct_answer: 'cerrado',
      distractors: ['abierto', 'lejos', 'cerca'],
    },
    {
      id: '0b200000-0018-4000-8000-000000000003',
      pattern_template: 'La iglesia esta en la ___',
      pattern_en: 'The church is in the plaza',
      explanation:
        '"Plaza" is a common public square found in every Spanish-speaking city.',
      prompt: 'La iglesia esta en la ___.',
      hint_en: 'The church is in the plaza.',
      correct_answer: 'plaza',
      distractors: ['calle', 'estacion', 'entrada'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000091', text: 'museo', meaning_en: 'museum', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000092', text: 'iglesia', meaning_en: 'church', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000093', text: 'plaza', meaning_en: 'plaza / square', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000094', text: 'parque', meaning_en: 'park', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000095', text: 'abierto', meaning_en: 'open', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000096', text: 'cerrado', meaning_en: 'closed', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000097', text: 'horario', meaning_en: 'schedule / hours', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000098', text: 'hoy', meaning_en: 'today', part_of_speech: 'adverb' },
  ],
  existingWordTexts: [
    'donde', 'bueno', 'hay',
    // From Unit 1:
    'bonito', 'grande', 'aqui', 'cerca', 'tambien', 'si',
    // From Scene 2.1:
    'cuanto cuesta',
    // From Scene 2.2:
    'entrada', 'estacion',
  ],
};

export const UNIT2_SCENES: DialogueSceneData[] = [scene2_1, scene2_2, scene2_3, scene2_4];
