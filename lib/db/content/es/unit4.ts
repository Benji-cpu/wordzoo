// Unit 4: Shopping & Money — Spanish language learning content
// 4 scenes covering shopping for clothes, souvenirs, paying, and bargaining.

import type { DialogueSceneData } from '../../dialogue-data';

// ── Scene 4.1: En la tienda de ropa (Clothes Shopping) ──────────────

const scene4_1: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000023',
  title: 'En la tienda de ropa',
  description: 'Shopping for clothes at a clothing store',
  scene_context:
    'You enter a clothing store in the city center to buy some new clothes. A friendly shop attendant helps you find the right size and color. Practice asking about clothes, sizes, and colors.',
  sort_order: 13,
  dialogues: [
    {
      id: 'e2000000-0023-4000-8000-000000000001',
      speaker: 'Dependienta',
      text_target: '!Buenas tardes! ?En que puedo ayudarle?',
      text_en: 'Good afternoon! How can I help you?',
    },
    {
      id: 'e2000000-0023-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Hola, quiero una camisa. ?Tiene en color azul?',
      text_en: 'Hello, I want a shirt. Do you have it in blue?',
    },
    {
      id: 'e2000000-0023-4000-8000-000000000003',
      speaker: 'Dependienta',
      text_target: '!Si, claro! Tenemos azul, rojo, negro y blanco. ?Que talla necesita?',
      text_en: 'Yes, of course! We have blue, red, black, and white. What size do you need?',
    },
    {
      id: 'e2000000-0023-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Talla mediana, por favor. ?Puedo probarmela?',
      text_en: 'Medium size, please. Can I try it on?',
    },
    {
      id: 'e2000000-0023-4000-8000-000000000005',
      speaker: 'Dependienta',
      text_target: '!Claro! El probador esta a la derecha. Tambien tenemos pantalones muy bonitos.',
      text_en: 'Of course! The fitting room is on the right. We also have very nice pants.',
    },
    {
      id: 'e2000000-0023-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'La camisa es perfecta. ?Cuanto cuesta?',
      text_en: 'The shirt is perfect. How much does it cost?',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0023-4000-8000-000000000001',
      text_target: '?Tiene en color azul?',
      text_en: 'Do you have it in blue?',
      literal_translation: 'Have-you in color blue?',
      usage_note:
        'Use "?Tiene en color ...?" + color name to ask if something comes in a specific color.',
      wordTexts: ['tiene', 'color', 'azul'],
    },
    {
      id: 'f2000000-0023-4000-8000-000000000002',
      text_target: '?Que talla necesita?',
      text_en: 'What size do you need?',
      literal_translation: 'What size need-you?',
      usage_note:
        '"Talla" is the word for clothing size. Common sizes: pequena, mediana, grande.',
      wordTexts: ['talla', 'necesito'],
    },
    {
      id: 'f2000000-0023-4000-8000-000000000003',
      text_target: '?Puedo probarmela?',
      text_en: 'Can I try it on?',
      literal_translation: 'Can-I try-it-on?',
      usage_note:
        '"Probarse" means to try on clothes. Essential for any clothing store visit.',
      wordTexts: ['probarse'],
    },
    {
      id: 'f2000000-0023-4000-8000-000000000004',
      text_target: 'La camisa es perfecta',
      text_en: 'The shirt is perfect',
      literal_translation: 'The shirt is perfect',
      usage_note:
        'Use this to tell the attendant you like the item. Adjectives match the noun gender.',
      wordTexts: ['camisa'],
    },
    {
      id: 'f2000000-0023-4000-8000-000000000005',
      text_target: 'Tenemos azul, rojo, negro y blanco',
      text_en: 'We have blue, red, black, and white',
      literal_translation: 'We-have blue, red, black and white',
      usage_note:
        'Colors are adjectives in Spanish. Learn these four basic colors for shopping.',
      wordTexts: ['azul', 'rojo', 'negro', 'blanco'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0023-4000-8000-000000000001',
      pattern_template: '?Tiene en color ___?',
      pattern_en: 'Do you have it in blue?',
      explanation:
        '"Color" + the color name asks about available colors. "Azul" means blue.',
      prompt: '?Tiene en color ___?',
      hint_en: 'Do you have it in blue?',
      correct_answer: 'azul',
      distractors: ['rojo', 'negro', 'blanco'],
    },
    {
      id: '0b200000-0023-4000-8000-000000000002',
      pattern_template: 'Quiero una ___',
      pattern_en: 'I want a shirt',
      explanation:
        '"Quiero" + article + clothing item is how you ask for what you want in a store.',
      prompt: 'Quiero una ___.',
      hint_en: 'I want a shirt.',
      correct_answer: 'camisa',
      distractors: ['talla', 'color', 'tienda'],
    },
    {
      id: '0b200000-0023-4000-8000-000000000003',
      pattern_template: '?Puedo ___?',
      pattern_en: 'Can I try it on?',
      explanation:
        '"Puedo" means "can I." Follow with an infinitive verb to ask permission.',
      prompt: '?Puedo ___?',
      hint_en: 'Can I try it on?',
      correct_answer: 'probarmela',
      distractors: ['comprar', 'pagar', 'ver'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000138', text: 'ropa', meaning_en: 'clothes / clothing', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000139', text: 'camisa', meaning_en: 'shirt', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000140', text: 'pantalon', meaning_en: 'pants / trousers', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000141', text: 'talla', meaning_en: 'size (clothing)', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000142', text: 'color', meaning_en: 'color', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000143', text: 'rojo', meaning_en: 'red', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000144', text: 'azul', meaning_en: 'blue', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000145', text: 'negro', meaning_en: 'black', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000146', text: 'blanco', meaning_en: 'white', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000147', text: 'probarse', meaning_en: 'to try on (clothes)', part_of_speech: 'verb' },
  ],
  existingWordTexts: [
    'quiero', 'por favor', 'si', 'hola', 'bueno',
    // From Unit 1:
    'tiene', 'necesito', 'grande', 'pequena', 'bonito', 'derecha',
    // From Unit 2:
    'cuanto cuesta',
  ],
};

// ── Scene 4.2: En el mercado de artesanias (Souvenir/Craft Market) ──

const scene4_2: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000024',
  title: 'En el mercado de artesanias',
  description: 'Browsing and bargaining at a souvenir market',
  scene_context:
    'You visit a colorful craft market to find souvenirs for your friends and family. A vendor shows you handmade items and you negotiate a price. Practice bargaining and complimenting handmade goods.',
  sort_order: 14,
  dialogues: [
    {
      id: 'e2000000-0024-4000-8000-000000000001',
      speaker: 'Vendedor',
      text_target: '!Bienvenido! Mire, todo hecho a mano. ?Busca un regalo?',
      text_en: 'Welcome! Look, everything handmade. Are you looking for a gift?',
    },
    {
      id: 'e2000000-0024-4000-8000-000000000002',
      speaker: 'You',
      text_target: 'Si, quiero un recuerdo bonito. ?Cuanto cuesta este?',
      text_en: 'Yes, I want a nice souvenir. How much does this one cost?',
    },
    {
      id: 'e2000000-0024-4000-8000-000000000003',
      speaker: 'Vendedor',
      text_target: 'Ese cuesta veinticinco euros. Es un muy buen precio.',
      text_en: 'That one costs twenty-five euros. It is a very good price.',
    },
    {
      id: 'e2000000-0024-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Es demasiado caro. ?Puede hacer un descuento?',
      text_en: 'It is too expensive. Can you give a discount?',
    },
    {
      id: 'e2000000-0024-4000-8000-000000000005',
      speaker: 'Vendedor',
      text_target: 'Mi ultimo precio es veinte euros. Es hecho a mano, muy buena calidad.',
      text_en: 'My last price is twenty euros. It is handmade, very good quality.',
    },
    {
      id: 'e2000000-0024-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Bueno, lo quiero. ?Puedo pagar con tarjeta?',
      text_en: 'Okay, I want it. Can I pay with a card?',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0024-4000-8000-000000000001',
      text_target: '?Busca un regalo?',
      text_en: 'Are you looking for a gift?',
      literal_translation: 'Look-for-you a gift?',
      usage_note:
        '"Buscar" means to look for or to search. Vendors use this to offer help.',
      wordTexts: ['regalo'],
    },
    {
      id: 'f2000000-0024-4000-8000-000000000002',
      text_target: 'Es demasiado caro',
      text_en: 'It is too expensive',
      literal_translation: 'Is too-much expensive',
      usage_note:
        '"Demasiado" means "too" or "too much." Use it before an adjective to start bargaining.',
      wordTexts: ['demasiado', 'caro'],
    },
    {
      id: 'f2000000-0024-4000-8000-000000000003',
      text_target: '?Puede hacer un descuento?',
      text_en: 'Can you give a discount?',
      literal_translation: 'Can-you make a discount?',
      usage_note:
        'The polite way to ask for a lower price. "Descuento" means discount.',
      wordTexts: ['descuento'],
    },
    {
      id: 'f2000000-0024-4000-8000-000000000004',
      text_target: 'Mi ultimo precio',
      text_en: 'My last price',
      literal_translation: 'My last price',
      usage_note:
        'Vendors say this when they give their final offer. "Ultimo" means last or final.',
      wordTexts: ['ultimo', 'precio'],
    },
    {
      id: 'f2000000-0024-4000-8000-000000000005',
      text_target: 'Hecho a mano',
      text_en: 'Handmade',
      literal_translation: 'Made by hand',
      usage_note:
        '"Hecho a mano" means handmade. Common in craft markets to highlight quality.',
      wordTexts: ['hecho a mano'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0024-4000-8000-000000000001',
      pattern_template: 'Es ___ caro',
      pattern_en: 'It is too expensive',
      explanation:
        '"Demasiado" means "too" or "too much." Put it before an adjective to intensify it.',
      prompt: 'Es ___ caro.',
      hint_en: 'It is too expensive.',
      correct_answer: 'demasiado',
      distractors: ['muy', 'poco', 'mas'],
    },
    {
      id: '0b200000-0024-4000-8000-000000000002',
      pattern_template: '?Puede hacer un ___?',
      pattern_en: 'Can you give a discount?',
      explanation:
        '"Descuento" means "discount." Ask "?Puede hacer un descuento?" to bargain politely.',
      prompt: '?Puede hacer un ___?',
      hint_en: 'Can you give a discount?',
      correct_answer: 'descuento',
      distractors: ['precio', 'regalo', 'recuerdo'],
    },
    {
      id: '0b200000-0024-4000-8000-000000000003',
      pattern_template: '?Puedo ___ con tarjeta?',
      pattern_en: 'Can I pay with a card?',
      explanation:
        '"Pagar" means "to pay." Use "?Puedo pagar con ...?" to ask about payment methods.',
      prompt: '?Puedo ___ con tarjeta?',
      hint_en: 'Can I pay with a card?',
      correct_answer: 'pagar',
      distractors: ['comprar', 'tener', 'hacer'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000148', text: 'regalo', meaning_en: 'gift / present', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000149', text: 'recuerdo', meaning_en: 'souvenir / memory', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000150', text: 'hecho a mano', meaning_en: 'handmade', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000151', text: 'precio', meaning_en: 'price', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000152', text: 'descuento', meaning_en: 'discount', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000153', text: 'demasiado', meaning_en: 'too / too much', part_of_speech: 'adverb' },
    { id: 'b2000000-0001-4000-8000-000000000154', text: 'mejor', meaning_en: 'better / best', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000155', text: 'ultimo', meaning_en: 'last / final', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000156', text: 'pagar', meaning_en: 'to pay', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000157', text: 'tarjeta', meaning_en: 'card (credit/debit)', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'cuanto', 'dinero', 'caro', 'bueno', 'quiero', 'si',
    // From Unit 1:
    'bonito', 'este', 'muy', 'bienvenido',
    // From Unit 2:
    'cuanto cuesta',
    // From Unit 3:
    'barato',
  ],
};

// ── Scene 4.3: Pagando (Paying and Money) ───────────────────────────

const scene4_3: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000025',
  title: 'Pagando',
  description: 'Paying at a store and handling money',
  scene_context:
    'You are at the register in a store, ready to pay for your purchases. You discuss payment methods, ask for a receipt, and handle the change. Practice money vocabulary and paying transactions.',
  sort_order: 15,
  dialogues: [
    {
      id: 'e2000000-0025-4000-8000-000000000001',
      speaker: 'Cajero',
      text_target: 'El total son treinta y cinco pesos. ?Como quiere pagar?',
      text_en: 'The total is thirty-five pesos. How do you want to pay?',
    },
    {
      id: 'e2000000-0025-4000-8000-000000000002',
      speaker: 'You',
      text_target: '?Puedo pagar en efectivo?',
      text_en: 'Can I pay in cash?',
    },
    {
      id: 'e2000000-0025-4000-8000-000000000003',
      speaker: 'Cajero',
      text_target: '!Claro! ?Tiene un billete de cincuenta? No tengo monedas pequenas.',
      text_en: 'Of course! Do you have a fifty bill? I do not have small coins.',
    },
    {
      id: 'e2000000-0025-4000-8000-000000000004',
      speaker: 'You',
      text_target: 'Si, aqui tiene. ?Me da el recibo, por favor?',
      text_en: 'Yes, here you go. Can you give me the receipt, please?',
    },
    {
      id: 'e2000000-0025-4000-8000-000000000005',
      speaker: 'Cajero',
      text_target: 'Aqui esta su recibo y su vuelto: quince pesos.',
      text_en: 'Here is your receipt and your change: fifteen pesos.',
    },
    {
      id: 'e2000000-0025-4000-8000-000000000006',
      speaker: 'You',
      text_target: 'Gracias. ?Se deja propina aqui?',
      text_en: 'Thanks. Do you leave a tip here?',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0025-4000-8000-000000000001',
      text_target: '?Como quiere pagar?',
      text_en: 'How do you want to pay?',
      literal_translation: 'How want-you to-pay?',
      usage_note:
        'The cashier asks this at checkout. Common answers: "en efectivo" (cash) or "con tarjeta" (card).',
      wordTexts: ['pagar'],
    },
    {
      id: 'f2000000-0025-4000-8000-000000000002',
      text_target: 'En efectivo',
      text_en: 'In cash',
      literal_translation: 'In cash',
      usage_note:
        '"Efectivo" means cash. "Pagar en efectivo" is to pay with cash.',
      wordTexts: ['efectivo'],
    },
    {
      id: 'f2000000-0025-4000-8000-000000000003',
      text_target: '?Me da el recibo?',
      text_en: 'Can you give me the receipt?',
      literal_translation: 'Me give the receipt?',
      usage_note:
        '"Recibo" is the receipt. Always ask for one to keep track of your spending.',
      wordTexts: ['recibo'],
    },
    {
      id: 'f2000000-0025-4000-8000-000000000004',
      text_target: 'Su vuelto: quince pesos',
      text_en: 'Your change: fifteen pesos',
      literal_translation: 'Your change: fifteen pesos',
      usage_note:
        '"Vuelto" is the change you get back. Also called "cambio" in some countries.',
      wordTexts: ['vuelto', 'pesos'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0025-4000-8000-000000000001',
      pattern_template: '?Puedo pagar en ___?',
      pattern_en: 'Can I pay in cash?',
      explanation:
        '"Efectivo" means "cash." "En efectivo" is how you say "in cash" in Spanish.',
      prompt: '?Puedo pagar en ___?',
      hint_en: 'Can I pay in cash?',
      correct_answer: 'efectivo',
      distractors: ['tarjeta', 'moneda', 'billete'],
    },
    {
      id: '0b200000-0025-4000-8000-000000000002',
      pattern_template: '?Me da el ___?',
      pattern_en: 'Can you give me the receipt?',
      explanation:
        '"Recibo" is the receipt. "?Me da ...?" is a polite way to ask someone to give you something.',
      prompt: '?Me da el ___, por favor?',
      hint_en: 'Can you give me the receipt, please?',
      correct_answer: 'recibo',
      distractors: ['vuelto', 'billete', 'total'],
    },
    {
      id: '0b200000-0025-4000-8000-000000000003',
      pattern_template: 'El ___ son treinta y cinco pesos',
      pattern_en: 'The total is thirty-five pesos',
      explanation:
        '"Total" means the total amount. The cashier will tell you the total before you pay.',
      prompt: 'El ___ son treinta y cinco pesos.',
      hint_en: 'The total is thirty-five pesos.',
      correct_answer: 'total',
      distractors: ['precio', 'vuelto', 'recibo'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000158', text: 'efectivo', meaning_en: 'cash', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000159', text: 'cambio', meaning_en: 'change / exchange', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000160', text: 'recibo', meaning_en: 'receipt', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000161', text: 'propina', meaning_en: 'tip / gratuity', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000162', text: 'total', meaning_en: 'total', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000163', text: 'pesos', meaning_en: 'pesos (currency)', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000164', text: 'moneda', meaning_en: 'coin / currency', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000165', text: 'billete', meaning_en: 'bill / banknote', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000166', text: 'cobrar', meaning_en: 'to charge / to collect payment', part_of_speech: 'verb' },
    { id: 'b2000000-0001-4000-8000-000000000167', text: 'vuelto', meaning_en: 'change (money returned)', part_of_speech: 'noun' },
  ],
  existingWordTexts: [
    'cuenta', 'dinero', 'cuanto', 'gracias', 'por favor', 'si',
    // From Unit 1:
    'tiene', 'aqui',
    // From Scene 4.2:
    'tarjeta', 'pagar', 'precio',
  ],
};

// ── Scene 4.4: ?Tiene algo mas barato? (Bargaining & Comparing) ─────

const scene4_4: DialogueSceneData = {
  id: 'd2000000-0001-4000-8000-000000000026',
  title: '?Tiene algo mas barato?',
  description: 'Bargaining and comparing items at a market',
  scene_context:
    'You return to the market to find a gift but everything seems expensive. You compare items, ask for better deals, and practice negotiating prices. Practice comparing items and bargaining phrases.',
  sort_order: 16,
  dialogues: [
    {
      id: 'e2000000-0026-4000-8000-000000000001',
      speaker: 'You',
      text_target: 'Me gusta este, pero es muy caro. ?Tiene algo mas barato?',
      text_en: 'I like this one, but it is very expensive. Do you have something cheaper?',
    },
    {
      id: 'e2000000-0026-4000-8000-000000000002',
      speaker: 'Vendedora',
      text_target: '!Si! Este es nuevo y mas barato. Es igual de bonito.',
      text_en: 'Yes! This one is new and cheaper. It is equally pretty.',
    },
    {
      id: 'e2000000-0026-4000-8000-000000000003',
      speaker: 'You',
      text_target: '?Y el viejo? Es diferente. ?Cual es el mejor precio?',
      text_en: 'And the old one? It is different. What is the best price?',
    },
    {
      id: 'e2000000-0026-4000-8000-000000000004',
      speaker: 'Vendedora',
      text_target: 'Para usted, una oferta especial: quince euros los dos.',
      text_en: 'For you, a special offer: fifteen euros for both.',
    },
    {
      id: 'e2000000-0026-4000-8000-000000000005',
      speaker: 'You',
      text_target: '?Quince euros por los dos? !Perfecto! !Vale, me los llevo!',
      text_en: 'Fifteen euros for both? Perfect! Okay, I will take them!',
    },
    {
      id: 'e2000000-0026-4000-8000-000000000006',
      speaker: 'Vendedora',
      text_target: '!Muy bien! Es un buen negocio. !Gracias, amigo!',
      text_en: 'Very good! It is a good deal. Thanks, friend!',
    },
  ],
  phrases: [
    {
      id: 'f2000000-0026-4000-8000-000000000001',
      text_target: '?Tiene algo mas barato?',
      text_en: 'Do you have something cheaper?',
      literal_translation: 'Have-you something more cheap?',
      usage_note:
        'The essential bargaining phrase. "Mas barato" means "cheaper" — literally "more cheap."',
      wordTexts: ['tiene', 'algo', 'mas', 'barato'],
    },
    {
      id: 'f2000000-0026-4000-8000-000000000002',
      text_target: 'Una oferta especial',
      text_en: 'A special offer',
      literal_translation: 'A offer special',
      usage_note:
        '"Oferta" means offer or deal. Vendors use this to make you feel you are getting a bargain.',
      wordTexts: ['oferta'],
    },
    {
      id: 'f2000000-0026-4000-8000-000000000003',
      text_target: '!Vale, me los llevo!',
      text_en: 'Okay, I will take them!',
      literal_translation: 'Okay, me them I-take!',
      usage_note:
        '"Vale" means "okay" or "deal." "Me lo llevo" (I will take it) seals the purchase.',
      wordTexts: ['vale'],
    },
    {
      id: 'f2000000-0026-4000-8000-000000000004',
      text_target: 'Es igual de bonito',
      text_en: 'It is equally pretty',
      literal_translation: 'Is equal of pretty',
      usage_note:
        '"Igual" means "equal" or "the same." Use "igual de" + adjective to compare things.',
      wordTexts: ['igual', 'bonito'],
    },
  ],
  patterns: [
    {
      id: '0b200000-0026-4000-8000-000000000001',
      pattern_template: '?Tiene algo mas ___?',
      pattern_en: 'Do you have something cheaper?',
      explanation:
        '"Mas" + adjective makes a comparative. "Mas barato" = cheaper, "mas grande" = bigger.',
      prompt: '?Tiene algo mas ___?',
      hint_en: 'Do you have something cheaper?',
      correct_answer: 'barato',
      distractors: ['caro', 'bonito', 'nuevo'],
    },
    {
      id: '0b200000-0026-4000-8000-000000000002',
      pattern_template: '?Cual es el ___ precio?',
      pattern_en: 'What is the best price?',
      explanation:
        '"Mejor" means "better" or "best." Use "el mejor precio" to ask for the lowest offer.',
      prompt: '?Cual es el ___ precio?',
      hint_en: 'What is the best price?',
      correct_answer: 'mejor',
      distractors: ['ultimo', 'otro', 'nuevo'],
    },
    {
      id: '0b200000-0026-4000-8000-000000000003',
      pattern_template: '!___, me lo llevo!',
      pattern_en: 'Okay, I will take it!',
      explanation:
        '"Vale" means "okay" or "deal." It confirms you agree. Very common in Spain and Latin America.',
      prompt: '!___, me lo llevo!',
      hint_en: 'Okay, I will take it!',
      correct_answer: 'Vale',
      distractors: ['Bueno', 'Si', 'Bien'],
    },
  ],
  newWords: [
    { id: 'b2000000-0001-4000-8000-000000000168', text: 'mejor precio', meaning_en: 'best price', part_of_speech: 'phrase' },
    { id: 'b2000000-0001-4000-8000-000000000169', text: 'oferta', meaning_en: 'offer / deal', part_of_speech: 'noun' },
    { id: 'b2000000-0001-4000-8000-000000000170', text: 'igual', meaning_en: 'equal / same', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000171', text: 'diferente', meaning_en: 'different', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000172', text: 'nuevo', meaning_en: 'new', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000173', text: 'viejo', meaning_en: 'old', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000174', text: 'perfecto', meaning_en: 'perfect', part_of_speech: 'adjective' },
    { id: 'b2000000-0001-4000-8000-000000000175', text: 'vale', meaning_en: 'okay / deal / agreed', part_of_speech: 'interjection' },
  ],
  existingWordTexts: [
    'caro', 'bueno', 'quiero', 'gracias', 'amigo', 'si',
    // From Unit 1:
    'tiene', 'grande', 'pequena', 'bonito', 'este', 'muy',
    // From Unit 3:
    'barato', 'otro', 'mas', 'algo',
    // From Scene 4.2:
    'precio', 'mejor', 'demasiado', 'pagar',
  ],
};

export const UNIT4_SCENES: DialogueSceneData[] = [scene4_1, scene4_2, scene4_3, scene4_4];
