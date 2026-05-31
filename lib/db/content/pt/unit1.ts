// Portuguese (pt-BR) expanded content — Unit 1
// Auto-assembled from the author-portuguese-stream workflow.

import type { DialogueSceneData } from '../../dialogue-data';

const scene11: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000011",
  "title": "No aeroporto",
  "description": "Arriving at the airport: greetings, simple introductions, saying your name and thank you.",
  "scene_context": "You have just landed in Rio de Janeiro and a friendly airport host greets you at the arrivals gate. You exchange first hellos and introduce yourself.",
  "sort_order": 1,
  "dialogues": [
    {
      "id": "e4000000-0011-4000-8000-000000000001",
      "speaker": "Bruno",
      "text_target": "Olá! Bom dia! Bem-vinda ao Rio!",
      "text_en": "Hello! Good morning! Welcome to Rio!"
    },
    {
      "id": "e4000000-0011-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Oi! Bom dia!",
      "text_en": "Hi! Good morning!"
    },
    {
      "id": "e4000000-0011-4000-8000-000000000003",
      "speaker": "Bruno",
      "text_target": "Eu sou o Bruno. Qual é o seu nome, por favor?",
      "text_en": "I am Bruno. What is your name, please?"
    },
    {
      "id": "e4000000-0011-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Eu sou a Ana. Muito prazer!",
      "text_en": "I am Ana. Very nice to meet you!"
    },
    {
      "id": "e4000000-0011-4000-8000-000000000005",
      "speaker": "Bruno",
      "text_target": "Você é a Ana? Sim? Que bom! Obrigado.",
      "text_en": "You are Ana? Yes? How nice! Thank you."
    },
    {
      "id": "e4000000-0011-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Sim, sou eu! Mais bagagem? Não. Obrigada, Bruno!",
      "text_en": "Yes, that's me! More luggage? No. Thank you, Bruno!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0011-4000-8000-000000000001",
      "text_target": "Bom dia!",
      "text_en": "Good morning!",
      "literal_translation": "Good day!",
      "usage_note": "A warm morning greeting used until around noon; fine in any situation, formal or friendly.",
      "wordTexts": [
        "bom dia"
      ]
    },
    {
      "id": "f4000000-0011-4000-8000-000000000002",
      "text_target": "Eu sou a Ana.",
      "text_en": "I am Ana.",
      "literal_translation": "I am the Ana.",
      "usage_note": "Use 'eu sou' to say who you are; Brazilians often put 'o/a' before a name, but you can simply say 'Eu sou Ana.'",
      "wordTexts": [
        "eu",
        "sou"
      ]
    },
    {
      "id": "f4000000-0011-4000-8000-000000000003",
      "text_target": "Qual é o seu nome, por favor?",
      "text_en": "What is your name, please?",
      "literal_translation": "Which is the your name, by favor?",
      "usage_note": "A polite way to ask someone's name; 'por favor' (please) softens any request.",
      "wordTexts": [
        "nome",
        "por favor"
      ]
    },
    {
      "id": "f4000000-0011-4000-8000-000000000004",
      "text_target": "Você é a Ana?",
      "text_en": "Are you Ana?",
      "literal_translation": "You are the Ana?",
      "usage_note": "'Você' is the everyday 'you' in Brazil and takes 3rd-person verb forms (é, not és).",
      "wordTexts": [
        "você"
      ]
    },
    {
      "id": "f4000000-0011-4000-8000-000000000005",
      "text_target": "Sim ou não?",
      "text_en": "Yes or no?",
      "literal_translation": "Yes or no?",
      "usage_note": "'Sim' means yes and 'não' means no; 'não' is also the all-purpose word for 'not' before a verb.",
      "wordTexts": [
        "sim",
        "não"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0011-4000-8000-000000000001",
      "pattern_template": "Eu ___ a Ana.",
      "pattern_en": "I am Ana.",
      "explanation": "'Sou' is the 'I' form of the verb 'to be' (ser); pair it with 'eu' to introduce yourself.",
      "prompt": "Eu ___ a Ana.",
      "hint_en": "Which word means 'am' (I am)?",
      "correct_answer": "sou",
      "distractors": [
        "você",
        "sim",
        "nome"
      ]
    },
    {
      "id": "0b400000-0011-4000-8000-000000000002",
      "pattern_template": "Qual é o seu ___?",
      "pattern_en": "What is your name?",
      "explanation": "'Nome' means 'name'; this is how you ask who someone is.",
      "prompt": "Qual é o seu ___?",
      "hint_en": "You want to ask for someone's 'name'.",
      "correct_answer": "nome",
      "distractors": [
        "bom dia",
        "obrigado",
        "não"
      ]
    },
    {
      "id": "0b400000-0011-4000-8000-000000000003",
      "pattern_template": "___ é a Ana?",
      "pattern_en": "Are you Ana?",
      "explanation": "'Você' is the everyday Brazilian 'you' and uses the 3rd-person verb form 'é'.",
      "prompt": "___ é a Ana?",
      "hint_en": "Which word means 'you'?",
      "correct_answer": "você",
      "distractors": [
        "eu",
        "sim",
        "oi"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000001",
      "text": "olá",
      "meaning_en": "hello",
      "part_of_speech": "interjection"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000002",
      "text": "oi",
      "meaning_en": "hi",
      "part_of_speech": "interjection"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000003",
      "text": "bom dia",
      "meaning_en": "good morning",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000004",
      "text": "obrigado",
      "meaning_en": "thank you (said by a man)",
      "part_of_speech": "interjection"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000005",
      "text": "obrigada",
      "meaning_en": "thank you (said by a woman)",
      "part_of_speech": "interjection"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000006",
      "text": "por favor",
      "meaning_en": "please",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000007",
      "text": "sim",
      "meaning_en": "yes",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000008",
      "text": "não",
      "meaning_en": "no / not",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000009",
      "text": "eu",
      "meaning_en": "I",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000010",
      "text": "você",
      "meaning_en": "you",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000011",
      "text": "nome",
      "meaning_en": "name",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000012",
      "text": "sou",
      "meaning_en": "I am",
      "part_of_speech": "verb"
    }
  ],
  "existingWordTexts": []
};

const scene12: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000012",
  "title": "Check-in no hotel",
  "description": "Checking in at the hotel: asking for a room, mentioning a reservation, the key.",
  "scene_context": "You arrive at your small beachfront hotel and walk up to the front desk. You need to check in and get the key to your room.",
  "sort_order": 2,
  "dialogues": [
    {
      "id": "e4000000-0012-4000-8000-000000000001",
      "speaker": "Recepcionista",
      "text_target": "Boa tarde! Olá, em que posso ajudar?",
      "text_en": "Good afternoon! Hello, how can I help you?"
    },
    {
      "id": "e4000000-0012-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Boa tarde! Eu tenho uma reserva neste hotel.",
      "text_en": "Good afternoon! I have a reservation at this hotel."
    },
    {
      "id": "e4000000-0012-4000-8000-000000000003",
      "speaker": "Recepcionista",
      "text_target": "Que bom! Qual é o seu nome, por favor?",
      "text_en": "Great! What is your name, please?"
    },
    {
      "id": "e4000000-0012-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Sou a Ana. Quero um quarto para uma noite.",
      "text_en": "I'm Ana. I want a room for one night."
    },
    {
      "id": "e4000000-0012-4000-8000-000000000005",
      "speaker": "Recepcionista",
      "text_target": "Perfeito. Aqui está a chave do seu quarto.",
      "text_en": "Perfect. Here is the key to your room."
    },
    {
      "id": "e4000000-0012-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Obrigada! Boa noite!",
      "text_en": "Thank you! Good night!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0012-4000-8000-000000000001",
      "text_target": "Eu tenho uma reserva",
      "text_en": "I have a reservation",
      "literal_translation": "I have a reservation",
      "usage_note": "Use \"tenho\" (I have) to mention something that is yours; \"reserva\" is feminine, so it takes \"uma\".",
      "wordTexts": [
        "eu",
        "tenho",
        "uma",
        "reserva"
      ]
    },
    {
      "id": "f4000000-0012-4000-8000-000000000002",
      "text_target": "Quero um quarto",
      "text_en": "I want a room",
      "literal_translation": "(I) want a room",
      "usage_note": "\"Quero\" already means \"I want\", so you can drop \"eu\"; \"quarto\" is masculine, so use \"um\".",
      "wordTexts": [
        "quero",
        "um",
        "quarto"
      ]
    },
    {
      "id": "f4000000-0012-4000-8000-000000000003",
      "text_target": "para uma noite",
      "text_en": "for one night",
      "literal_translation": "for one night",
      "usage_note": "\"Noite\" is feminine, so \"one/a\" becomes \"uma\"; handy for saying how long you're staying.",
      "wordTexts": [
        "uma",
        "noite"
      ]
    },
    {
      "id": "f4000000-0012-4000-8000-000000000004",
      "text_target": "a chave do quarto",
      "text_en": "the key to the room",
      "literal_translation": "the key of-the room",
      "usage_note": "Ask for your \"chave\" (key) at the front desk; pair it with \"quarto\" to specify which key.",
      "wordTexts": [
        "chave",
        "quarto"
      ]
    },
    {
      "id": "f4000000-0012-4000-8000-000000000005",
      "text_target": "Boa tarde, obrigada!",
      "text_en": "Good afternoon, thank you!",
      "literal_translation": "Good afternoon, thank-you!",
      "usage_note": "Say \"boa tarde\" from midday to evening; a woman says \"obrigada\", a man says \"obrigado\".",
      "wordTexts": [
        "boa tarde",
        "obrigada"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0012-4000-8000-000000000001",
      "pattern_template": "Eu ___ uma reserva.",
      "pattern_en": "I have a reservation.",
      "explanation": "\"Tenho\" is the \"I\" form of \"to have\" — use it to say what you possess, like a booking.",
      "prompt": "Eu ___ uma reserva neste hotel.",
      "hint_en": "Which verb means \"I have\"?",
      "correct_answer": "tenho",
      "distractors": [
        "quero",
        "quarto",
        "chave"
      ]
    },
    {
      "id": "0b400000-0012-4000-8000-000000000002",
      "pattern_template": "Quero ___ quarto.",
      "pattern_en": "I want a room.",
      "explanation": "\"Quarto\" is masculine, so the word for \"a/one\" must be the masculine \"um\".",
      "prompt": "Quero ___ quarto, por favor.",
      "hint_en": "\"Quarto\" is masculine — which form of \"a/one\"?",
      "correct_answer": "um",
      "distractors": [
        "uma",
        "noite",
        "reserva"
      ]
    },
    {
      "id": "0b400000-0012-4000-8000-000000000003",
      "pattern_template": "Quero um quarto para uma ___.",
      "pattern_en": "I want a room for one night.",
      "explanation": "\"Noite\" (night) tells the receptionist how long you're staying.",
      "prompt": "Quero um quarto para uma ___.",
      "hint_en": "For how long? One ___.",
      "correct_answer": "noite",
      "distractors": [
        "chave",
        "hotel",
        "reserva"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000013",
      "text": "boa tarde",
      "meaning_en": "good afternoon",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000014",
      "text": "hotel",
      "meaning_en": "hotel",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000015",
      "text": "quarto",
      "meaning_en": "room",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000016",
      "text": "reserva",
      "meaning_en": "reservation",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000017",
      "text": "chave",
      "meaning_en": "key",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000018",
      "text": "quero",
      "meaning_en": "I want",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000019",
      "text": "tenho",
      "meaning_en": "I have",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000020",
      "text": "uma",
      "meaning_en": "a / one (feminine)",
      "part_of_speech": "article"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000021",
      "text": "um",
      "meaning_en": "a / one (masculine)",
      "part_of_speech": "article"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000022",
      "text": "noite",
      "meaning_en": "night",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000023",
      "text": "boa noite",
      "meaning_en": "good evening / good night",
      "part_of_speech": "phrase"
    }
  ],
  "existingWordTexts": [
    "olá",
    "eu",
    "nome",
    "por favor",
    "sou",
    "obrigada"
  ]
};

const scene13: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000013",
  "title": "Conhecendo os vizinhos",
  "description": "Meeting neighbours: asking where someone is from, talking about friends and family.",
  "scene_context": "On the hotel terrace you meet a couple of friendly neighbours. They want to know where you are from and a little about you.",
  "sort_order": 3,
  "dialogues": [
    {
      "id": "e4000000-0013-4000-8000-000000000001",
      "speaker": "Bruno",
      "text_target": "Boa tarde! Eu sou o Bruno. Muito prazer!",
      "text_en": "Good afternoon! I'm Bruno. Very nice to meet you!"
    },
    {
      "id": "e4000000-0013-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Oi, Bruno! Prazer. Eu sou o seu vizinho.",
      "text_en": "Hi, Bruno! Nice to meet you. I'm your neighbour."
    },
    {
      "id": "e4000000-0013-4000-8000-000000000003",
      "speaker": "Bruno",
      "text_target": "De onde você é?",
      "text_en": "Where are you from?"
    },
    {
      "id": "e4000000-0013-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Eu sou de Londres. E você?",
      "text_en": "I'm from London. And you?"
    },
    {
      "id": "e4000000-0013-4000-8000-000000000005",
      "speaker": "Bruno",
      "text_target": "Eu também sou de fora. Esta é a Ana, minha amiga.",
      "text_en": "I'm also from out of town. This is Ana, my friend."
    },
    {
      "id": "e4000000-0013-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Olá, Ana! Muito prazer. Este é o Tom, da minha família.",
      "text_en": "Hello, Ana! Nice to meet you. This is Tom, from my family."
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0013-4000-8000-000000000001",
      "text_target": "Muito prazer!",
      "text_en": "Very nice to meet you!",
      "literal_translation": "Very pleasure!",
      "usage_note": "The standard friendly greeting when meeting someone for the first time; it works the same for men and women.",
      "wordTexts": [
        "muito",
        "prazer"
      ]
    },
    {
      "id": "f4000000-0013-4000-8000-000000000002",
      "text_target": "De onde você é?",
      "text_en": "Where are you from?",
      "literal_translation": "From where you is?",
      "usage_note": "Uses \"você\" with the 3rd-person verb \"é\"; this is the everyday Brazilian way to ask someone's origin.",
      "wordTexts": [
        "de onde",
        "você",
        "é"
      ]
    },
    {
      "id": "f4000000-0013-4000-8000-000000000003",
      "text_target": "Eu sou de Londres.",
      "text_en": "I'm from London.",
      "literal_translation": "I am from London.",
      "usage_note": "Use \"de\" + a place to say where you are from; swap Londres for your own city.",
      "wordTexts": [
        "eu",
        "sou",
        "de"
      ]
    },
    {
      "id": "f4000000-0013-4000-8000-000000000004",
      "text_target": "Esta é a Ana, minha amiga.",
      "text_en": "This is Ana, my friend.",
      "literal_translation": "This(f) is the Ana, my friend(f).",
      "usage_note": "Use feminine \"esta\" and \"amiga\" when presenting a woman; for a man you would say \"este\" and \"amigo\".",
      "wordTexts": [
        "esta",
        "é",
        "amiga"
      ]
    },
    {
      "id": "f4000000-0013-4000-8000-000000000005",
      "text_target": "Eu também sou de fora.",
      "text_en": "I'm also from out of town.",
      "literal_translation": "I also am from outside.",
      "usage_note": "\"Também\" means \"also/too\" and usually comes right before the verb to add yourself to what was just said.",
      "wordTexts": [
        "eu",
        "também",
        "sou",
        "de"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0013-4000-8000-000000000001",
      "pattern_template": "De onde ___ é?",
      "pattern_en": "Where are you from?",
      "explanation": "\"Você\" is the everyday word for \"you\" in Brazil and pairs with the verb \"é\".",
      "prompt": "De onde ___ é?",
      "hint_en": "Where are you from?",
      "correct_answer": "você",
      "distractors": [
        "eu",
        "sou",
        "de"
      ]
    },
    {
      "id": "0b400000-0013-4000-8000-000000000002",
      "pattern_template": "___ é a Ana, minha amiga.",
      "pattern_en": "This is Ana, my friend.",
      "explanation": "Ana is a woman, so use the feminine \"esta\". The masculine form \"este\" is used for men.",
      "prompt": "___ é a Ana, minha amiga.",
      "hint_en": "\"This\" pointing to a woman (feminine form).",
      "correct_answer": "esta",
      "distractors": [
        "este",
        "muito",
        "de"
      ]
    },
    {
      "id": "0b400000-0013-4000-8000-000000000003",
      "pattern_template": "Eu ___ sou de Londres.",
      "pattern_en": "I'm also from London.",
      "explanation": "\"Também\" means \"also/too\" and sits before the verb to add yourself to what was said.",
      "prompt": "Eu ___ sou de Londres.",
      "hint_en": "Adding \"too / also\".",
      "correct_answer": "também",
      "distractors": [
        "prazer",
        "amigo",
        "esta"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000024",
      "text": "de onde",
      "meaning_en": "from where",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000025",
      "text": "de",
      "meaning_en": "from / of",
      "part_of_speech": "preposition"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000026",
      "text": "muito",
      "meaning_en": "very / a lot",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000027",
      "text": "prazer",
      "meaning_en": "pleasure (nice to meet you)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000028",
      "text": "amigo",
      "meaning_en": "friend (male)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000029",
      "text": "amiga",
      "meaning_en": "friend (female)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000030",
      "text": "família",
      "meaning_en": "family",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000031",
      "text": "este",
      "meaning_en": "this (masculine)",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000032",
      "text": "esta",
      "meaning_en": "this (feminine)",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000033",
      "text": "é",
      "meaning_en": "is / he-she-it is",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000034",
      "text": "também",
      "meaning_en": "also / too",
      "part_of_speech": "adverb"
    }
  ],
  "existingWordTexts": [
    "boa tarde",
    "eu",
    "sou",
    "oi",
    "você",
    "olá"
  ]
};

const scene14: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000014",
  "title": "Primeiro passeio",
  "description": "First walk through town: asking for and understanding simple directions.",
  "scene_context": "You set off for your first walk and quickly get a little lost. You stop a passer-by to ask the way to the beach.",
  "sort_order": 4,
  "dialogues": [
    {
      "id": "e4000000-0014-4000-8000-000000000001",
      "speaker": "You",
      "text_target": "Desculpe, onde fica a praia?",
      "text_en": "Excuse me, where is the beach?"
    },
    {
      "id": "e4000000-0014-4000-8000-000000000002",
      "speaker": "Marcos",
      "text_target": "Oi! A praia fica perto, não é longe daqui.",
      "text_en": "Hi! The beach is near, it's not far from here."
    },
    {
      "id": "e4000000-0014-4000-8000-000000000003",
      "speaker": "You",
      "text_target": "Que bom! É por aqui ou por ali?",
      "text_en": "Great! Is it this way or that way?"
    },
    {
      "id": "e4000000-0014-4000-8000-000000000004",
      "speaker": "Marcos",
      "text_target": "Você vai por esta rua e vira à esquerda.",
      "text_en": "You go along this street and turn left."
    },
    {
      "id": "e4000000-0014-4000-8000-000000000005",
      "speaker": "You",
      "text_target": "À esquerda? Não é à direita?",
      "text_en": "To the left? Not to the right?"
    },
    {
      "id": "e4000000-0014-4000-8000-000000000006",
      "speaker": "Marcos",
      "text_target": "Não, à esquerda. A praia fica bem ali. Bom passeio!",
      "text_en": "No, to the left. The beach is right there. Enjoy your walk!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0014-4000-8000-000000000001",
      "text_target": "onde fica a praia?",
      "text_en": "where is the beach?",
      "literal_translation": "where stays the beach?",
      "usage_note": "The go-to way to ask where any place is located; Brazilians use the verb 'ficar' (to stay/be located) rather than 'ser' for fixed locations.",
      "wordTexts": [
        "onde",
        "fica",
        "a praia"
      ]
    },
    {
      "id": "f4000000-0014-4000-8000-000000000002",
      "text_target": "fica perto",
      "text_en": "it's near / it's close",
      "literal_translation": "stays near",
      "usage_note": "Reassuring reply meaning something is close by; pair it with 'fica longe' for the opposite when distances come up.",
      "wordTexts": [
        "fica",
        "perto"
      ]
    },
    {
      "id": "f4000000-0014-4000-8000-000000000003",
      "text_target": "vira à esquerda",
      "text_en": "turn left",
      "literal_translation": "turn to-the left",
      "usage_note": "Core directions phrase; swap 'esquerda' for 'direita' to say turn right, and note the 'à' (a + a) before the side.",
      "wordTexts": [
        "esquerda"
      ]
    },
    {
      "id": "f4000000-0014-4000-8000-000000000004",
      "text_target": "é por aqui ou por ali?",
      "text_en": "is it this way or that way?",
      "literal_translation": "is by here or by there?",
      "usage_note": "Use 'aqui' for near you and 'ali' for a spot a bit further off when pointing out a direction.",
      "wordTexts": [
        "é",
        "aqui",
        "ali"
      ]
    },
    {
      "id": "f4000000-0014-4000-8000-000000000005",
      "text_target": "desculpe, por favor",
      "text_en": "excuse me, please",
      "literal_translation": "excuse-me, by favor",
      "usage_note": "Polite opener to stop a stranger; 'desculpe' works for both 'excuse me' and 'sorry' regardless of the speaker's gender.",
      "wordTexts": [
        "desculpe",
        "por favor"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0014-4000-8000-000000000001",
      "pattern_template": "___ fica a praia?",
      "pattern_en": "Where is the beach?",
      "explanation": "'Onde' means 'where' and starts a question about location, usually followed by the verb 'fica'.",
      "prompt": "___ fica a praia?",
      "hint_en": "You want to ask WHERE something is.",
      "correct_answer": "onde",
      "distractors": [
        "perto",
        "aqui",
        "esquerda"
      ]
    },
    {
      "id": "0b400000-0014-4000-8000-000000000002",
      "pattern_template": "A praia fica ___, não é longe.",
      "pattern_en": "The beach is near, it's not far.",
      "explanation": "'Perto' (near) is the opposite of 'longe' (far); here the sentence already says it is NOT far.",
      "prompt": "A praia fica ___, não é longe.",
      "hint_en": "The opposite of 'longe' (far).",
      "correct_answer": "perto",
      "distractors": [
        "longe",
        "ali",
        "onde"
      ]
    },
    {
      "id": "0b400000-0014-4000-8000-000000000003",
      "pattern_template": "Vira à ___, não à direita.",
      "pattern_en": "Turn left, not right.",
      "explanation": "Directions: 'esquerda' is left and 'direita' is right; the sentence contrasts the two, so the blank is the opposite of 'direita'.",
      "prompt": "Vira à ___, não à direita.",
      "hint_en": "The opposite of 'direita' (right).",
      "correct_answer": "esquerda",
      "distractors": [
        "direita",
        "perto",
        "aqui"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000035",
      "text": "onde",
      "meaning_en": "where",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000036",
      "text": "fica",
      "meaning_en": "is located / is (stays)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000037",
      "text": "rua",
      "meaning_en": "street",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000038",
      "text": "esquerda",
      "meaning_en": "left",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000039",
      "text": "direita",
      "meaning_en": "right",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000040",
      "text": "perto",
      "meaning_en": "near / close",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000041",
      "text": "longe",
      "meaning_en": "far",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000042",
      "text": "aqui",
      "meaning_en": "here",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000043",
      "text": "ali",
      "meaning_en": "there",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000044",
      "text": "a praia",
      "meaning_en": "the beach",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000045",
      "text": "desculpe",
      "meaning_en": "excuse me / sorry",
      "part_of_speech": "interjection"
    }
  ],
  "existingWordTexts": [
    "oi",
    "é",
    "por favor",
    "você",
    "não"
  ]
};

export const UNIT1_SCENES: DialogueSceneData[] = [scene11, scene12, scene13, scene14];
