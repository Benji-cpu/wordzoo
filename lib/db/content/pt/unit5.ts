// Portuguese (pt-BR) expanded content — Unit 5: Festas com a minha mãe
// Christmas, New Year and Carnival with your partner's family, your mother along for the trip.

import type { DialogueSceneData } from '../../dialogue-data';

const scene51: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000051",
  "title": "Apresentando a minha mãe",
  "description": "Introducing your mother to the family and helping her follow along when she doesn't speak Portuguese.",
  "scene_context": "You have brought your mother to your partner Dani's family home for the holidays. She doesn't speak Portuguese, so you introduce her and keep the conversation slow enough for her to follow.",
  "sort_order": 17,
  "dialogues": [
    {
      "id": "e4000000-0051-4000-8000-000000000001",
      "speaker": "You",
      "text_target": "Dona Márcia, esta é a minha mãe. Ela não fala português.",
      "text_en": "Dona Márcia, this is my mother. She doesn't speak Portuguese."
    },
    {
      "id": "e4000000-0051-4000-8000-000000000002",
      "speaker": "Dona Márcia",
      "text_target": "Que bom! Muito prazer, senhora! A senhora está bem?",
      "text_en": "How lovely! Very nice to meet you, madam! Are you well?"
    },
    {
      "id": "e4000000-0051-4000-8000-000000000003",
      "speaker": "You",
      "text_target": "Ela está bem, obrigado. Ela entende um pouco. Repete de novo, devagar?",
      "text_en": "She is well, thank you. She understands a little. Can you say it again, slowly?"
    },
    {
      "id": "e4000000-0051-4000-8000-000000000004",
      "speaker": "Seu Roberto",
      "text_target": "Claro! Prazer em conhecer a senhora. Eu sou o Roberto.",
      "text_en": "Of course! A pleasure to meet you, madam. I am Roberto."
    },
    {
      "id": "e4000000-0051-4000-8000-000000000005",
      "speaker": "You",
      "text_target": "Mãe, ele é o pai da Dani. Ele fala devagar para você.",
      "text_en": "Mum, he is Dani's father. He speaks slowly for you."
    },
    {
      "id": "e4000000-0051-4000-8000-000000000006",
      "speaker": "Mãe",
      "text_target": "Prazer, senhor! Estou muito feliz aqui. Obrigada!",
      "text_en": "Nice to meet you, sir! I am very happy here. Thank you!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0051-4000-8000-000000000001",
      "text_target": "Esta é a minha mãe.",
      "text_en": "This is my mother.",
      "literal_translation": "This is the my mother.",
      "usage_note": "Brazilians put 'a' before 'minha mãe'; use 'este é o meu pai' for a man, since 'este/esta' and 'meu/minha' agree with the person's gender.",
      "wordTexts": [
        "esta",
        "é"
      ]
    },
    {
      "id": "f4000000-0051-4000-8000-000000000002",
      "text_target": "Ela não fala português.",
      "text_en": "She doesn't speak Portuguese.",
      "literal_translation": "She not speaks Portuguese.",
      "usage_note": "'Fala' is the he/she/você form of 'falar' (to speak); 'não' goes straight before the verb to make it negative.",
      "wordTexts": [
        "ela",
        "não",
        "fala"
      ]
    },
    {
      "id": "f4000000-0051-4000-8000-000000000003",
      "text_target": "Repete de novo, por favor?",
      "text_en": "Can you say that again, please?",
      "literal_translation": "Repeat of new, by favour?",
      "usage_note": "'De novo' means 'again'; 'repete' is the everyday spoken request, and 'pode repetir?' is the slightly more polite version.",
      "wordTexts": [
        "repete",
        "de novo",
        "por favor"
      ]
    },
    {
      "id": "f4000000-0051-4000-8000-000000000004",
      "text_target": "Prazer em conhecer a senhora.",
      "text_en": "A pleasure to meet you, madam.",
      "literal_translation": "Pleasure in to-know the lady.",
      "usage_note": "'A senhora' / 'o senhor' is the respectful 'you' for older people or someone you have just met; family will soon switch you to 'você'.",
      "wordTexts": [
        "prazer",
        "conhecer",
        "senhora"
      ]
    },
    {
      "id": "f4000000-0051-4000-8000-000000000005",
      "text_target": "Ela entende um pouco.",
      "text_en": "She understands a little.",
      "literal_translation": "She understands a little.",
      "usage_note": "'Entende' is the he/she form of 'entender'; say 'eu entendo um pouco' about yourself and hosts will slow down for you.",
      "wordTexts": [
        "ela",
        "entende"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0051-4000-8000-000000000001",
      "pattern_template": "___ não fala português.",
      "pattern_en": "She doesn't speak Portuguese.",
      "explanation": "'Ela' means 'she'; ela, ele and você all take the same third-person verb form.",
      "prompt": "___ não fala português.",
      "hint_en": "Which word means 'she'?",
      "correct_answer": "ela",
      "distractors": [
        "ele",
        "você",
        "eu"
      ]
    },
    {
      "id": "0b400000-0051-4000-8000-000000000002",
      "pattern_template": "Prazer em ___ a senhora.",
      "pattern_en": "A pleasure to meet you, madam.",
      "explanation": "'Conhecer' is the verb 'to meet / to get to know'; after 'prazer em' it stays in the infinitive.",
      "prompt": "Prazer em ___ a senhora.",
      "hint_en": "Which verb means 'to meet'?",
      "correct_answer": "conhecer",
      "distractors": [
        "repete",
        "entende",
        "fala"
      ]
    },
    {
      "id": "0b400000-0051-4000-8000-000000000003",
      "pattern_template": "Repete ___, por favor?",
      "pattern_en": "Say it again, please?",
      "explanation": "'De novo' means 'again' and usually comes right after the verb.",
      "prompt": "Repete ___, por favor?",
      "hint_en": "Which words mean 'again'?",
      "correct_answer": "de novo",
      "distractors": [
        "claro",
        "bem",
        "feliz"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000191",
      "text": "ela",
      "meaning_en": "she",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000192",
      "text": "ele",
      "meaning_en": "he",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000193",
      "text": "fala",
      "meaning_en": "he / she speaks",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000194",
      "text": "entende",
      "meaning_en": "he / she understands",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000195",
      "text": "de novo",
      "meaning_en": "again",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000196",
      "text": "repete",
      "meaning_en": "repeat (say it again)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000197",
      "text": "conhecer",
      "meaning_en": "to meet / to get to know",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000198",
      "text": "feliz",
      "meaning_en": "happy",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000199",
      "text": "senhora",
      "meaning_en": "madam / ma'am (respectful 'you' for a woman)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000200",
      "text": "senhor",
      "meaning_en": "sir (respectful 'you' for a man)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000201",
      "text": "claro",
      "meaning_en": "of course / sure",
      "part_of_speech": "interjection"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000202",
      "text": "bem",
      "meaning_en": "well / fine",
      "part_of_speech": "adverb"
    }
  ],
  "existingWordTexts": [
    "esta",
    "é",
    "não",
    "obrigado",
    "prazer",
    "por favor",
    "está",
    "muito",
    "aqui",
    "obrigada"
  ]
};

const scene52: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000052",
  "title": "Ceia de Natal",
  "description": "Christmas Eve dinner with the family: the supper, presents at midnight, songs, everyone together.",
  "scene_context": "You are at the family's Christmas Eve table, the ceia, with your mother beside you. The grandmother has cooked, the presents wait under the tree, and the family sings after dinner.",
  "sort_order": 18,
  "dialogues": [
    {
      "id": "e4000000-0052-4000-8000-000000000001",
      "speaker": "Vó Neide",
      "text_target": "Feliz Natal, meu filho! A ceia está pronta.",
      "text_en": "Merry Christmas, my son! The supper is ready."
    },
    {
      "id": "e4000000-0052-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Feliz Natal, Vó Neide! Todos juntos, que bonito!",
      "text_en": "Merry Christmas, Grandma Neide! Everyone together, how lovely!"
    },
    {
      "id": "e4000000-0052-4000-8000-000000000003",
      "speaker": "Lucas",
      "text_target": "Tem peru e farofa. Vamos abrir o presente à meia-noite.",
      "text_en": "There's turkey and farofa. We'll open the present at midnight."
    },
    {
      "id": "e4000000-0052-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Que bom! Eu adoro Natal no Brasil. Vamos cantar?",
      "text_en": "Great! I love Christmas in Brazil. Shall we sing?"
    },
    {
      "id": "e4000000-0052-4000-8000-000000000005",
      "speaker": "Dani",
      "text_target": "Sim! Depois da ceia, a família canta uma música de Natal.",
      "text_en": "Yes! After the supper, the family sings a Christmas song."
    },
    {
      "id": "e4000000-0052-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Minha mãe quer cantar também. Obrigado por tudo, família!",
      "text_en": "My mum wants to sing too. Thank you for everything, family!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0052-4000-8000-000000000001",
      "text_target": "Feliz Natal!",
      "text_en": "Merry Christmas!",
      "literal_translation": "Happy Christmas!",
      "usage_note": "Said from Christmas Eve through the 25th to everyone you meet; the reply is simply 'Feliz Natal!' back.",
      "wordTexts": [
        "feliz Natal"
      ]
    },
    {
      "id": "f4000000-0052-4000-8000-000000000002",
      "text_target": "A ceia está pronta.",
      "text_en": "The supper is ready.",
      "literal_translation": "The supper is ready.",
      "usage_note": "'Ceia' is specifically the late Christmas Eve meal, usually served close to midnight, not an everyday word for dinner.",
      "wordTexts": [
        "ceia",
        "está"
      ]
    },
    {
      "id": "f4000000-0052-4000-8000-000000000003",
      "text_target": "Vamos abrir o presente à meia-noite.",
      "text_en": "Let's open the present at midnight.",
      "literal_translation": "Let's open the present at-the midnight.",
      "usage_note": "'Abrir' is 'to open'; 'à meia-noite' means 'at midnight', when Brazilian families exchange gifts on the 24th.",
      "wordTexts": [
        "vamos",
        "abrir",
        "presente",
        "meia-noite"
      ]
    },
    {
      "id": "f4000000-0052-4000-8000-000000000004",
      "text_target": "Todos juntos!",
      "text_en": "Everyone together!",
      "literal_translation": "All together!",
      "usage_note": "'Todos' is 'everyone' and 'juntos' is 'together'; use 'todas juntas' if the group is all women.",
      "wordTexts": [
        "todos",
        "juntos"
      ]
    },
    {
      "id": "f4000000-0052-4000-8000-000000000005",
      "text_target": "Vamos cantar uma música?",
      "text_en": "Shall we sing a song?",
      "literal_translation": "Let's sing a music?",
      "usage_note": "'Música' means both 'music' and 'a song'; 'vamos' plus a verb is the friendly way to suggest doing something together.",
      "wordTexts": [
        "vamos",
        "cantar",
        "uma",
        "música"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0052-4000-8000-000000000001",
      "pattern_template": "Feliz ___!",
      "pattern_en": "Merry Christmas!",
      "explanation": "'Natal' is Christmas; 'feliz' (happy) goes before the name of the holiday to make the greeting.",
      "prompt": "Feliz ___!",
      "hint_en": "Which word is the holiday on the 25th of December?",
      "correct_answer": "Natal",
      "distractors": [
        "ceia",
        "peru",
        "música"
      ]
    },
    {
      "id": "0b400000-0052-4000-8000-000000000002",
      "pattern_template": "Vamos ___ o presente.",
      "pattern_en": "Let's open the present.",
      "explanation": "After 'vamos' the next verb stays in the infinitive; 'abrir' means 'to open'.",
      "prompt": "Vamos ___ o presente.",
      "hint_en": "Which verb means 'to open'?",
      "correct_answer": "abrir",
      "distractors": [
        "cantar",
        "comer",
        "beber"
      ]
    },
    {
      "id": "0b400000-0052-4000-8000-000000000003",
      "pattern_template": "A ceia é à ___.",
      "pattern_en": "The supper is at midnight.",
      "explanation": "'Meia-noite' is 'midnight'; 'à' (with the accent) means 'at' before a feminine time word.",
      "prompt": "A ceia é à ___.",
      "hint_en": "Which word means 'midnight'?",
      "correct_answer": "meia-noite",
      "distractors": [
        "hoje",
        "amanhã",
        "noite"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000203",
      "text": "Natal",
      "meaning_en": "Christmas",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000204",
      "text": "feliz Natal",
      "meaning_en": "Merry Christmas",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000205",
      "text": "presente",
      "meaning_en": "present / gift",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000206",
      "text": "ceia",
      "meaning_en": "Christmas Eve supper",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000207",
      "text": "meia-noite",
      "meaning_en": "midnight",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000208",
      "text": "abrir",
      "meaning_en": "to open",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000209",
      "text": "peru",
      "meaning_en": "turkey",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000210",
      "text": "cantar",
      "meaning_en": "to sing",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000211",
      "text": "música",
      "meaning_en": "song / music",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000212",
      "text": "todos",
      "meaning_en": "everyone / all",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000213",
      "text": "juntos",
      "meaning_en": "together",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000214",
      "text": "bonito",
      "meaning_en": "beautiful / lovely",
      "part_of_speech": "adjective"
    }
  ],
  "existingWordTexts": [
    "tem",
    "vamos",
    "está",
    "sim",
    "eu",
    "família",
    "também",
    "obrigado",
    "uma"
  ]
};

const scene53: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000053",
  "title": "Réveillon na praia",
  "description": "New Year's Eve on the beach: white clothes, fireworks, jumping seven waves, a toast and a wish.",
  "scene_context": "You are spending New Year's Eve, the Réveillon, on the beach with Dani and the family. Everyone is in white, the fireworks go off at midnight, and there are traditions to learn.",
  "sort_order": 19,
  "dialogues": [
    {
      "id": "e4000000-0053-4000-8000-000000000001",
      "speaker": "Dani",
      "text_target": "Hoje é Réveillon! Na praia, todo mundo veste branco.",
      "text_en": "Today is New Year's Eve! On the beach, everyone wears white."
    },
    {
      "id": "e4000000-0053-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Tenho uma roupa branca. Que horas começa a festa?",
      "text_en": "I have a white outfit. What time does the party start?"
    },
    {
      "id": "e4000000-0053-4000-8000-000000000003",
      "speaker": "Dani",
      "text_target": "À meia-noite tem fogos. Depois a gente vai dançar até de manhã.",
      "text_en": "At midnight there are fireworks. Then we'll dance until morning."
    },
    {
      "id": "e4000000-0053-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "E a tradição de pular sete ondas?",
      "text_en": "And the tradition of jumping seven waves?"
    },
    {
      "id": "e4000000-0053-4000-8000-000000000005",
      "speaker": "Dani",
      "text_target": "Sim! Você pula sete ondas e faz um desejo. Dá sorte!",
      "text_en": "Yes! You jump seven waves and make a wish. It brings luck!"
    },
    {
      "id": "e4000000-0053-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Adoro! Vamos brindar: feliz ano novo, família!",
      "text_en": "I love it! Let's toast: happy New Year, family!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0053-4000-8000-000000000001",
      "text_target": "Feliz ano novo!",
      "text_en": "Happy New Year!",
      "literal_translation": "Happy year new!",
      "usage_note": "In Portuguese the adjective 'novo' comes after 'ano'; this is the midnight greeting and it works all through the first days of January.",
      "wordTexts": [
        "ano novo"
      ]
    },
    {
      "id": "f4000000-0053-4000-8000-000000000002",
      "text_target": "Todo mundo veste branco.",
      "text_en": "Everyone wears white.",
      "literal_translation": "All world wears white.",
      "usage_note": "'Todo mundo' is the everyday way to say 'everyone'; white on New Year's Eve stands for peace, and many people add a colour for luck or love.",
      "wordTexts": [
        "branco"
      ]
    },
    {
      "id": "f4000000-0053-4000-8000-000000000003",
      "text_target": "Que horas começa a festa?",
      "text_en": "What time does the party start?",
      "literal_translation": "What hours begins the party?",
      "usage_note": "'Começa' is the he/she/it form of 'começar' (to begin); swap 'a festa' for any event to ask when it starts.",
      "wordTexts": [
        "que horas",
        "começa",
        "festa"
      ]
    },
    {
      "id": "f4000000-0053-4000-8000-000000000004",
      "text_target": "Pular sete ondas dá sorte.",
      "text_en": "Jumping seven waves brings luck.",
      "literal_translation": "To-jump seven waves gives luck.",
      "usage_note": "'Dá sorte' literally 'gives luck' is how Brazilians say something is lucky; you make one wish per wave and never turn your back on the sea.",
      "wordTexts": [
        "pular",
        "sete",
        "sorte"
      ]
    },
    {
      "id": "f4000000-0053-4000-8000-000000000005",
      "text_target": "Vamos brindar!",
      "text_en": "Let's toast!",
      "literal_translation": "Let's toast!",
      "usage_note": "'Brindar' is to raise a glass; the word you say as the glasses touch is 'saúde!'.",
      "wordTexts": [
        "vamos",
        "brindar"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0053-4000-8000-000000000001",
      "pattern_template": "Todo mundo veste ___.",
      "pattern_en": "Everyone wears white.",
      "explanation": "'Branco' is 'white'; colours come after the noun and agree with it ('roupa branca').",
      "prompt": "Todo mundo veste ___.",
      "hint_en": "Which word is the colour everyone wears on New Year's Eve?",
      "correct_answer": "branco",
      "distractors": [
        "roupa",
        "festa",
        "sorte"
      ]
    },
    {
      "id": "0b400000-0053-4000-8000-000000000002",
      "pattern_template": "Que horas ___ a festa?",
      "pattern_en": "What time does the party start?",
      "explanation": "'Começa' means 'begins / starts' for he, she or it; the subject 'a festa' can come after the verb in a question.",
      "prompt": "Que horas ___ a festa?",
      "hint_en": "Which verb means 'begins'?",
      "correct_answer": "começa",
      "distractors": [
        "pular",
        "dançar",
        "brindar"
      ]
    },
    {
      "id": "0b400000-0053-4000-8000-000000000003",
      "pattern_template": "Você pula ___ ondas.",
      "pattern_en": "You jump seven waves.",
      "explanation": "'Sete' is 'seven'; numbers go directly before the noun with no extra word.",
      "prompt": "Você pula ___ ondas.",
      "hint_en": "How many waves do you jump for luck?",
      "correct_answer": "sete",
      "distractors": [
        "dois",
        "três",
        "cinco"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000215",
      "text": "ano novo",
      "meaning_en": "New Year",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000216",
      "text": "branco",
      "meaning_en": "white",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000217",
      "text": "roupa",
      "meaning_en": "clothes / outfit",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000218",
      "text": "fogos",
      "meaning_en": "fireworks",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000219",
      "text": "pular",
      "meaning_en": "to jump",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000220",
      "text": "festa",
      "meaning_en": "party",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000221",
      "text": "dançar",
      "meaning_en": "to dance",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000222",
      "text": "brindar",
      "meaning_en": "to toast (raise a glass)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000223",
      "text": "sete",
      "meaning_en": "seven",
      "part_of_speech": "number"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000224",
      "text": "sorte",
      "meaning_en": "luck",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000225",
      "text": "desejo",
      "meaning_en": "wish",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000226",
      "text": "começa",
      "meaning_en": "begins / starts",
      "part_of_speech": "verb"
    }
  ],
  "existingWordTexts": [
    "hoje",
    "é",
    "a praia",
    "tenho",
    "uma",
    "que horas",
    "tem",
    "sim",
    "você",
    "vamos"
  ]
};

const scene54: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000054",
  "title": "Carnaval e a despedida",
  "description": "A Carnival street party, then saying goodbye to the family and promising to come back next year.",
  "scene_context": "You are heading out to a Carnival bloco with Dani's brother on your last full day in Brazil. Tomorrow you and your mother fly home, so the day ends with goodbyes at the family's door.",
  "sort_order": 20,
  "dialogues": [
    {
      "id": "e4000000-0054-4000-8000-000000000001",
      "speaker": "Lucas",
      "text_target": "É Carnaval! O bloco sai às dez. Você tem fantasia?",
      "text_en": "It's Carnival! The bloco leaves at ten. Do you have a costume?"
    },
    {
      "id": "e4000000-0054-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Tenho, sim! Adoro samba. Que alegria!",
      "text_en": "Yes, I do! I love samba. What joy!"
    },
    {
      "id": "e4000000-0054-4000-8000-000000000003",
      "speaker": "Dona Márcia",
      "text_target": "Amanhã vocês vão voltar para casa. Vou sentir saudade!",
      "text_en": "Tomorrow you're going back home. I'm going to miss you!"
    },
    {
      "id": "e4000000-0054-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Eu também. Quero ficar mais, e voltar ano que vem!",
      "text_en": "Me too. I want to stay longer, and come back next year!"
    },
    {
      "id": "e4000000-0054-4000-8000-000000000005",
      "speaker": "Seu Roberto",
      "text_target": "Cuide-se, meu filho. Você é sempre bem-vindo aqui.",
      "text_en": "Take care, my son. You are always welcome here."
    },
    {
      "id": "e4000000-0054-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Obrigado por tudo! Tudo de bom para vocês. Até logo!",
      "text_en": "Thank you for everything! All the best to you. See you soon!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0054-4000-8000-000000000001",
      "text_target": "Vou sentir saudade.",
      "text_en": "I'm going to miss you.",
      "literal_translation": "(I) go to-feel longing.",
      "usage_note": "'Saudade' is the famous untranslatable word for missing someone; 'vou sentir saudade' is the standard warm goodbye, and you can add 'de você' or 'da senhora'.",
      "wordTexts": [
        "vou",
        "saudade"
      ]
    },
    {
      "id": "f4000000-0054-4000-8000-000000000002",
      "text_target": "Quero voltar ano que vem.",
      "text_en": "I want to come back next year.",
      "literal_translation": "(I) want to-return year that comes.",
      "usage_note": "'Ano que vem' literally 'the year that comes' is the everyday way to say 'next year'; 'voltar' means 'to come back'.",
      "wordTexts": [
        "quero",
        "voltar",
        "ano que vem"
      ]
    },
    {
      "id": "f4000000-0054-4000-8000-000000000003",
      "text_target": "Cuide-se!",
      "text_en": "Take care!",
      "literal_translation": "Care-yourself!",
      "usage_note": "A warm parting word; in casual speech you'll also hear 'se cuida!', which means exactly the same.",
      "wordTexts": [
        "cuide-se"
      ]
    },
    {
      "id": "f4000000-0054-4000-8000-000000000004",
      "text_target": "Tudo de bom para vocês!",
      "text_en": "All the best to you!",
      "literal_translation": "All of good for you-all!",
      "usage_note": "'Tudo de bom' is the go-to well-wishing phrase for goodbyes and messages; 'vocês' is the plural 'you'.",
      "wordTexts": [
        "tudo de bom",
        "para"
      ]
    },
    {
      "id": "f4000000-0054-4000-8000-000000000005",
      "text_target": "Você tem fantasia?",
      "text_en": "Do you have a costume?",
      "literal_translation": "You have costume?",
      "usage_note": "'Fantasia' is a false friend: it means 'costume', not 'fantasy', and Carnival blocos are full of them.",
      "wordTexts": [
        "você",
        "tem",
        "fantasia"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0054-4000-8000-000000000001",
      "pattern_template": "Vou sentir ___.",
      "pattern_en": "I'm going to miss you.",
      "explanation": "'Saudade' is the noun for missing someone; 'sentir saudade' is 'to feel that longing'.",
      "prompt": "Vou sentir ___.",
      "hint_en": "Which word means the feeling of missing someone?",
      "correct_answer": "saudade",
      "distractors": [
        "alegria",
        "samba",
        "fantasia"
      ]
    },
    {
      "id": "0b400000-0054-4000-8000-000000000002",
      "pattern_template": "Quero ___ ano que vem.",
      "pattern_en": "I want to come back next year.",
      "explanation": "'Voltar' means 'to come back'; after 'quero' the verb stays in the infinitive.",
      "prompt": "Quero ___ ano que vem.",
      "hint_en": "Which verb means 'to come back'?",
      "correct_answer": "voltar",
      "distractors": [
        "ficar",
        "comer",
        "ir"
      ]
    },
    {
      "id": "0b400000-0054-4000-8000-000000000003",
      "pattern_template": "Você é ___ bem-vindo.",
      "pattern_en": "You are always welcome.",
      "explanation": "'Sempre' means 'always' and sits between the verb and the adjective.",
      "prompt": "Você é ___ bem-vindo.",
      "hint_en": "Which word means 'always'?",
      "correct_answer": "sempre",
      "distractors": [
        "agora",
        "hoje",
        "amanhã"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000227",
      "text": "Carnaval",
      "meaning_en": "Carnival",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000228",
      "text": "bloco",
      "meaning_en": "Carnival street party (bloco)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000229",
      "text": "fantasia",
      "meaning_en": "costume",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000230",
      "text": "samba",
      "meaning_en": "samba",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000231",
      "text": "alegria",
      "meaning_en": "joy",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000232",
      "text": "saudade",
      "meaning_en": "longing / missing someone",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000233",
      "text": "voltar",
      "meaning_en": "to come back / to return",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000234",
      "text": "ano que vem",
      "meaning_en": "next year",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000235",
      "text": "cuide-se",
      "meaning_en": "take care",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000236",
      "text": "ficar",
      "meaning_en": "to stay",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000237",
      "text": "sempre",
      "meaning_en": "always",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000238",
      "text": "tudo de bom",
      "meaning_en": "all the best",
      "part_of_speech": "phrase"
    }
  ],
  "existingWordTexts": [
    "é",
    "você",
    "tem",
    "sim",
    "eu",
    "também",
    "quero",
    "amanhã",
    "obrigado",
    "até logo",
    "aqui",
    "para"
  ]
};

export const UNIT5_SCENES: DialogueSceneData[] = [scene51, scene52, scene53, scene54];
