// Portuguese (pt-BR) expanded content — Unit 3: A família (meeting the family)
// Storyline: the learner is visiting Brazil for the first time to meet his partner Dani's family.

import type { DialogueSceneData } from '../../dialogue-data';

const scene31: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000031",
  "title": "Chegando na casa da família",
  "description": "Arriving at your partner's family home: first hugs, being welcomed in, saying you are tired from the trip.",
  "scene_context": "You and Dani pull up outside her parents' house after a long journey. Her mother, Dona Márcia, opens the door with her arms already open.",
  "sort_order": 9,
  "dialogues": [
    {
      "id": "e4000000-0031-4000-8000-000000000001",
      "speaker": "Dona Márcia",
      "text_target": "Bem-vindo! Entre, entre! Tudo bem?",
      "text_en": "Welcome! Come in, come in! How are you?"
    },
    {
      "id": "e4000000-0031-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Tudo bem, obrigado! Muito prazer, Dona Márcia.",
      "text_en": "All good, thank you! Very nice to meet you, Dona Márcia."
    },
    {
      "id": "e4000000-0031-4000-8000-000000000003",
      "speaker": "Dani",
      "text_target": "Esta é a minha mãe, e este é o meu pai.",
      "text_en": "This is my mother, and this is my father."
    },
    {
      "id": "e4000000-0031-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Um abraço, Seu Roberto! Que casa bonita!",
      "text_en": "A hug, Seu Roberto! What a beautiful house!"
    },
    {
      "id": "e4000000-0031-4000-8000-000000000005",
      "speaker": "Seu Roberto",
      "text_target": "Obrigado! Você está cansado da viagem?",
      "text_en": "Thank you! Are you tired from the trip?"
    },
    {
      "id": "e4000000-0031-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Um pouco cansado, sim. Um beijo, mãe da Dani!",
      "text_en": "A little tired, yes. A kiss, Dani's mum!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0031-4000-8000-000000000001",
      "text_target": "Tudo bem?",
      "text_en": "How are you? / All good?",
      "literal_translation": "All well?",
      "usage_note": "The most common Brazilian greeting; the answer is the same words without the question: 'Tudo bem!'",
      "wordTexts": [
        "tudo bem"
      ]
    },
    {
      "id": "f4000000-0031-4000-8000-000000000002",
      "text_target": "Esta é a minha mãe.",
      "text_en": "This is my mother.",
      "literal_translation": "This is the my mother.",
      "usage_note": "'Minha' goes with feminine nouns (mãe, casa) and 'meu' with masculine ones (pai, abraço); Brazilians usually add 'a/o' before them.",
      "wordTexts": [
        "esta",
        "é",
        "minha",
        "mãe"
      ]
    },
    {
      "id": "f4000000-0031-4000-8000-000000000003",
      "text_target": "Um abraço, um beijo!",
      "text_en": "A hug, a kiss!",
      "literal_translation": "A hug, a kiss!",
      "usage_note": "Brazilians greet family with a hug and one or two cheek kisses; 'um abraço' and 'um beijo' are also how friendly messages end.",
      "wordTexts": [
        "um",
        "abraço",
        "beijo"
      ]
    },
    {
      "id": "f4000000-0031-4000-8000-000000000004",
      "text_target": "Estou cansado da viagem.",
      "text_en": "I am tired from the trip.",
      "literal_translation": "(I) am tired of-the trip.",
      "usage_note": "A man says 'cansado', a woman 'cansada'; 'da' is 'de' + 'a' squeezed together before a feminine noun like 'viagem'.",
      "wordTexts": [
        "cansado",
        "de",
        "viagem"
      ]
    },
    {
      "id": "f4000000-0031-4000-8000-000000000005",
      "text_target": "Bem-vindo à nossa casa!",
      "text_en": "Welcome to our home!",
      "literal_translation": "Well-come to-the our house!",
      "usage_note": "'Bem-vindo' agrees with the person welcomed: 'bem-vinda' to a woman, 'bem-vindos' to a group; 'entre' (come in) usually follows.",
      "wordTexts": [
        "bem-vindo",
        "casa"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0031-4000-8000-000000000001",
      "pattern_template": "Esta é a minha ___.",
      "pattern_en": "This is my mother.",
      "explanation": "'Mãe' is feminine, which is why the sentence uses 'a minha' before it.",
      "prompt": "Esta é a minha ___.",
      "hint_en": "Which word means 'mother'?",
      "correct_answer": "mãe",
      "distractors": [
        "pai",
        "casa",
        "viagem"
      ]
    },
    {
      "id": "0b400000-0031-4000-8000-000000000002",
      "pattern_template": "Este é o ___ pai.",
      "pattern_en": "This is my father.",
      "explanation": "'Pai' is masculine, so the possessive is 'meu', not 'minha'.",
      "prompt": "Este é o ___ pai.",
      "hint_en": "Which word means 'my' before a masculine noun?",
      "correct_answer": "meu",
      "distractors": [
        "minha",
        "esta",
        "você"
      ]
    },
    {
      "id": "0b400000-0031-4000-8000-000000000003",
      "pattern_template": "Você está ___ da viagem?",
      "pattern_en": "Are you tired from the trip?",
      "explanation": "'Está' + an adjective describes how someone is right now; 'cansado' takes -a for a woman.",
      "prompt": "Você está ___ da viagem?",
      "hint_en": "Which word means 'tired'?",
      "correct_answer": "cansado",
      "distractors": [
        "bem-vindo",
        "perto",
        "bom"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000091",
      "text": "mãe",
      "meaning_en": "mother / mum",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000092",
      "text": "pai",
      "meaning_en": "father / dad",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000093",
      "text": "casa",
      "meaning_en": "house / home",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000094",
      "text": "bem-vindo",
      "meaning_en": "welcome (said to a man)",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000095",
      "text": "tudo bem",
      "meaning_en": "all good / how are you?",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000096",
      "text": "abraço",
      "meaning_en": "hug",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000097",
      "text": "beijo",
      "meaning_en": "kiss",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000098",
      "text": "entre",
      "meaning_en": "come in",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000099",
      "text": "cansado",
      "meaning_en": "tired (masculine)",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000100",
      "text": "viagem",
      "meaning_en": "trip / journey",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000101",
      "text": "meu",
      "meaning_en": "my (masculine)",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000102",
      "text": "minha",
      "meaning_en": "my (feminine)",
      "part_of_speech": "pronoun"
    }
  ],
  "existingWordTexts": [
    "obrigado",
    "muito",
    "prazer",
    "esta",
    "este",
    "é",
    "um",
    "você",
    "está",
    "sim"
  ]
};

const scene32: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000032",
  "title": "Quem é quem",
  "description": "Who's who in the family: siblings, grandparents, aunts and uncles, partners, ages and where people live.",
  "scene_context": "The living room fills up with relatives and Dani walks you through who everyone is. Her brother Lucas wants to know a bit about you too.",
  "sort_order": 10,
  "dialogues": [
    {
      "id": "e4000000-0032-4000-8000-000000000001",
      "speaker": "Dani",
      "text_target": "Este é o meu irmão, Lucas. E esta é a minha avó.",
      "text_en": "This is my brother, Lucas. And this is my grandmother."
    },
    {
      "id": "e4000000-0032-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Muito prazer! E quem é ela? A sua irmã?",
      "text_en": "Nice to meet you! And who is she? Your sister?"
    },
    {
      "id": "e4000000-0032-4000-8000-000000000003",
      "speaker": "Dani",
      "text_target": "Não, é a minha tia. E o meu tio mora em Salvador.",
      "text_en": "No, she is my aunt. And my uncle lives in Salvador."
    },
    {
      "id": "e4000000-0032-4000-8000-000000000004",
      "speaker": "Lucas",
      "text_target": "Então você é o namorado da Dani! Quantos anos você tem?",
      "text_en": "So you are Dani's boyfriend! How old are you?"
    },
    {
      "id": "e4000000-0032-4000-8000-000000000005",
      "speaker": "You",
      "text_target": "Sim, sou eu! Tenho quarenta anos. E o seu avô mora aqui?",
      "text_en": "Yes, that's me! I am forty years old. And does your grandfather live here?"
    },
    {
      "id": "e4000000-0032-4000-8000-000000000006",
      "speaker": "Lucas",
      "text_target": "Mora, sim. E aquela é a filha da minha tia, com a namorada.",
      "text_en": "Yes, he does. And that is my aunt's daughter, with her girlfriend."
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0032-4000-8000-000000000001",
      "text_target": "Quem é ela?",
      "text_en": "Who is she?",
      "literal_translation": "Who is she?",
      "usage_note": "'Quem' means 'who'; swap 'ela' for 'ele' to ask about a man, or point and just say 'Quem é?'",
      "wordTexts": [
        "quem",
        "é"
      ]
    },
    {
      "id": "f4000000-0032-4000-8000-000000000002",
      "text_target": "Este é o meu irmão.",
      "text_en": "This is my brother.",
      "literal_translation": "This is the my brother.",
      "usage_note": "Family words come in pairs: irmão/irmã, avô/avó, tio/tia — the final -o is the man and -a the woman.",
      "wordTexts": [
        "este",
        "é",
        "meu",
        "irmão"
      ]
    },
    {
      "id": "f4000000-0032-4000-8000-000000000003",
      "text_target": "Quantos anos você tem?",
      "text_en": "How old are you?",
      "literal_translation": "How-many years you have?",
      "usage_note": "In Portuguese you 'have' years, not 'are' them; answer with 'Tenho ... anos.'",
      "wordTexts": [
        "anos",
        "você",
        "tem"
      ]
    },
    {
      "id": "f4000000-0032-4000-8000-000000000004",
      "text_target": "O meu tio mora em Salvador.",
      "text_en": "My uncle lives in Salvador.",
      "literal_translation": "The my uncle lives in Salvador.",
      "usage_note": "'Mora' is he/she lives; use it with 'em' (in) before a city or 'aqui' (here).",
      "wordTexts": [
        "meu",
        "tio",
        "mora"
      ]
    },
    {
      "id": "f4000000-0032-4000-8000-000000000005",
      "text_target": "Sou o namorado da Dani.",
      "text_en": "I am Dani's boyfriend.",
      "literal_translation": "(I) am the boyfriend of-the Dani.",
      "usage_note": "'Namorado/namorada' is boyfriend/girlfriend; 'da' (of the) marks whose partner you are — Portuguese has no 's.",
      "wordTexts": [
        "sou",
        "namorado",
        "de"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0032-4000-8000-000000000001",
      "pattern_template": "___ é ela? A sua irmã?",
      "pattern_en": "Who is she? Your sister?",
      "explanation": "'Quem' is the question word for people, like 'who' in English.",
      "prompt": "___ é ela? A sua irmã?",
      "hint_en": "Which word means 'who'?",
      "correct_answer": "quem",
      "distractors": [
        "onde",
        "como",
        "quanto custa"
      ]
    },
    {
      "id": "0b400000-0032-4000-8000-000000000002",
      "pattern_template": "O meu tio ___ em Salvador.",
      "pattern_en": "My uncle lives in Salvador.",
      "explanation": "'Mora' is the he/she form of 'morar' (to live); 'em' means 'in'.",
      "prompt": "O meu tio ___ em Salvador.",
      "hint_en": "Which word means 'lives'?",
      "correct_answer": "mora",
      "distractors": [
        "tem",
        "fica",
        "é"
      ]
    },
    {
      "id": "0b400000-0032-4000-8000-000000000003",
      "pattern_template": "Tenho quarenta ___.",
      "pattern_en": "I am forty years old.",
      "explanation": "Age is expressed with 'ter' (to have) plus 'anos' (years).",
      "prompt": "Tenho quarenta ___.",
      "hint_en": "Which word means 'years'?",
      "correct_answer": "anos",
      "distractors": [
        "irmã",
        "avó",
        "reais"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000103",
      "text": "irmão",
      "meaning_en": "brother",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000104",
      "text": "irmã",
      "meaning_en": "sister",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000105",
      "text": "avó",
      "meaning_en": "grandmother",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000106",
      "text": "avô",
      "meaning_en": "grandfather",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000107",
      "text": "filha",
      "meaning_en": "daughter",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000108",
      "text": "tio",
      "meaning_en": "uncle",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000109",
      "text": "tia",
      "meaning_en": "aunt",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000110",
      "text": "namorado",
      "meaning_en": "boyfriend",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000111",
      "text": "namorada",
      "meaning_en": "girlfriend",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000112",
      "text": "quem",
      "meaning_en": "who",
      "part_of_speech": "pronoun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000113",
      "text": "mora",
      "meaning_en": "he / she lives",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000114",
      "text": "anos",
      "meaning_en": "years (used for age)",
      "part_of_speech": "noun"
    }
  ],
  "existingWordTexts": [
    "este",
    "esta",
    "é",
    "meu",
    "minha",
    "muito",
    "prazer",
    "não",
    "sim",
    "sou",
    "eu",
    "tenho",
    "aqui"
  ]
};

const scene33: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000033",
  "title": "Falando de mim",
  "description": "Talking about yourself: where you live, your work, that you are learning Portuguese, and asking people to slow down.",
  "scene_context": "Over coffee, Vó Neide wants to know all about you — where you live and what you do. You answer as best you can and ask her to speak slowly.",
  "sort_order": 11,
  "dialogues": [
    {
      "id": "e4000000-0033-4000-8000-000000000001",
      "speaker": "Vó Neide",
      "text_target": "Onde você mora, meu filho? E com o que você trabalha?",
      "text_en": "Where do you live, my dear? And what work do you do?"
    },
    {
      "id": "e4000000-0033-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Eu moro em Bali. Sou professor de ioga e trabalho com computador.",
      "text_en": "I live in Bali. I am a yoga teacher and I work with computers."
    },
    {
      "id": "e4000000-0033-4000-8000-000000000003",
      "speaker": "Vó Neide",
      "text_target": "Que bom! E você fala português muito bem!",
      "text_en": "How nice! And you speak Portuguese very well!"
    },
    {
      "id": "e4000000-0033-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Falo um pouco. Estou aprendendo. Eu falo inglês.",
      "text_en": "I speak a little. I am learning. I speak English."
    },
    {
      "id": "e4000000-0033-4000-8000-000000000005",
      "speaker": "Vó Neide",
      "text_target": "Você entende quando eu falo devagar?",
      "text_en": "Do you understand when I speak slowly?"
    },
    {
      "id": "e4000000-0033-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Entendo, sim! Mais devagar, por favor. Eu adoro o Brasil!",
      "text_en": "Yes, I understand! Slower, please. I love Brazil!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0033-4000-8000-000000000001",
      "text_target": "Eu moro em Bali.",
      "text_en": "I live in Bali.",
      "literal_translation": "I live in Bali.",
      "usage_note": "'Moro' is the I-form of 'morar'; the he/she form 'mora' you met in the last scene — the ending changes, not the word order.",
      "wordTexts": [
        "eu",
        "moro"
      ]
    },
    {
      "id": "f4000000-0033-4000-8000-000000000002",
      "text_target": "Falo um pouco de português.",
      "text_en": "I speak a little Portuguese.",
      "literal_translation": "(I) speak a little of Portuguese.",
      "usage_note": "The most useful sentence you'll say all trip; 'um pouco' works before any language and buys you patience.",
      "wordTexts": [
        "falo",
        "um pouco",
        "de",
        "português"
      ]
    },
    {
      "id": "f4000000-0033-4000-8000-000000000003",
      "text_target": "Estou aprendendo.",
      "text_en": "I am learning.",
      "literal_translation": "(I) am learning.",
      "usage_note": "'Estou' + a verb ending in -ndo is the Brazilian 'I am ...ing'; in speech it often shrinks to 'tô aprendendo'.",
      "wordTexts": [
        "aprendendo"
      ]
    },
    {
      "id": "f4000000-0033-4000-8000-000000000004",
      "text_target": "Mais devagar, por favor.",
      "text_en": "Slower, please.",
      "literal_translation": "More slowly, please.",
      "usage_note": "Polite and normal to ask; you can also say 'Devagar, por favor' on its own.",
      "wordTexts": [
        "devagar",
        "por favor"
      ]
    },
    {
      "id": "f4000000-0033-4000-8000-000000000005",
      "text_target": "Sou professor de ioga.",
      "text_en": "I am a yoga teacher.",
      "literal_translation": "(I) am teacher of yoga.",
      "usage_note": "No 'a' before a profession in Portuguese; a woman says 'professora'.",
      "wordTexts": [
        "sou",
        "professor",
        "de",
        "ioga"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0033-4000-8000-000000000001",
      "pattern_template": "Eu ___ em Bali.",
      "pattern_en": "I live in Bali.",
      "explanation": "Verbs change their ending with the person: 'moro' is I, 'mora' is he/she.",
      "prompt": "Eu ___ em Bali.",
      "hint_en": "Which word means 'I live'?",
      "correct_answer": "moro",
      "distractors": [
        "mora",
        "falo",
        "trabalho"
      ]
    },
    {
      "id": "0b400000-0033-4000-8000-000000000002",
      "pattern_template": "Falo ___ de português.",
      "pattern_en": "I speak a little Portuguese.",
      "explanation": "'Um pouco' (a little) goes right after the verb and before 'de' + the language.",
      "prompt": "Falo ___ de português.",
      "hint_en": "Which words mean 'a little'?",
      "correct_answer": "um pouco",
      "distractors": [
        "muito",
        "devagar",
        "também"
      ]
    },
    {
      "id": "0b400000-0033-4000-8000-000000000003",
      "pattern_template": "Você ___ quando eu falo devagar?",
      "pattern_en": "Do you understand when I speak slowly?",
      "explanation": "'Entende' is the you/he/she form of 'entender'; the I-form is 'entendo'.",
      "prompt": "Você ___ quando eu falo devagar?",
      "hint_en": "Which word means 'understand' when talking to 'você'?",
      "correct_answer": "entende",
      "distractors": [
        "entendo",
        "adoro",
        "moro"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000115",
      "text": "moro",
      "meaning_en": "I live",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000116",
      "text": "trabalho",
      "meaning_en": "I work / work (job)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000117",
      "text": "inglês",
      "meaning_en": "English",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000118",
      "text": "falo",
      "meaning_en": "I speak",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000119",
      "text": "um pouco",
      "meaning_en": "a little",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000120",
      "text": "aprendendo",
      "meaning_en": "learning",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000121",
      "text": "português",
      "meaning_en": "Portuguese",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000122",
      "text": "adoro",
      "meaning_en": "I love (things, places)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000123",
      "text": "professor",
      "meaning_en": "teacher (male)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000124",
      "text": "ioga",
      "meaning_en": "yoga",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000125",
      "text": "devagar",
      "meaning_en": "slowly",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000126",
      "text": "entendo",
      "meaning_en": "I understand",
      "part_of_speech": "verb"
    }
  ],
  "existingWordTexts": [
    "onde",
    "você",
    "eu",
    "sou",
    "de",
    "com",
    "muito",
    "sim",
    "por favor",
    "mora"
  ]
};

const scene34: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000034",
  "title": "Churrasco de domingo",
  "description": "The Sunday barbecue: passing food, asking for seconds, complimenting the cook, a toast, and saying you are full.",
  "scene_context": "Sunday means churrasco in the back garden. Seu Roberto is at the grill, plates are piling up, and everyone wants to make sure you eat more.",
  "sort_order": 12,
  "dialogues": [
    {
      "id": "e4000000-0034-4000-8000-000000000001",
      "speaker": "Seu Roberto",
      "text_target": "Você quer mais carne? E tem arroz, feijão e suco.",
      "text_en": "Do you want more meat? And there is rice, beans and juice."
    },
    {
      "id": "e4000000-0034-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Quero, sim! Me passa o feijão, por favor? Está muito gostoso.",
      "text_en": "Yes, I do! Can you pass me the beans, please? It is very tasty."
    },
    {
      "id": "e4000000-0034-4000-8000-000000000003",
      "speaker": "Dani",
      "text_target": "O churrasco do meu pai é o melhor. Saúde!",
      "text_en": "My dad's barbecue is the best. Cheers!"
    },
    {
      "id": "e4000000-0034-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Saúde! Pode me passar a cerveja também?",
      "text_en": "Cheers! Can you pass me the beer too?"
    },
    {
      "id": "e4000000-0034-4000-8000-000000000005",
      "speaker": "Dona Márcia",
      "text_target": "Agora a sobremesa! Você quer mais um pouco?",
      "text_en": "Now dessert! Do you want a little more?"
    },
    {
      "id": "e4000000-0034-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Obrigado, mas estou satisfeito. Tudo delicioso!",
      "text_en": "Thank you, but I am full. Everything delicious!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0034-4000-8000-000000000001",
      "text_target": "Me passa o feijão, por favor?",
      "text_en": "Pass me the beans, please?",
      "literal_translation": "Me pass the beans, please?",
      "usage_note": "Starting with 'me' is the relaxed Brazilian way to ask at the table; add 'por favor' and a rising tone.",
      "wordTexts": [
        "me passa",
        "feijão",
        "por favor"
      ]
    },
    {
      "id": "f4000000-0034-4000-8000-000000000002",
      "text_target": "Está muito gostoso!",
      "text_en": "It's very tasty!",
      "literal_translation": "(It) is very tasty!",
      "usage_note": "'Gostoso' is the everyday word for tasty food; it agrees with the dish — 'a carne está gostosa'.",
      "wordTexts": [
        "está",
        "muito",
        "gostoso"
      ]
    },
    {
      "id": "f4000000-0034-4000-8000-000000000003",
      "text_target": "Quero mais, por favor.",
      "text_en": "I want more, please.",
      "literal_translation": "(I) want more, please.",
      "usage_note": "Accepting seconds is a compliment in a Brazilian home; 'mais' also means 'plus'.",
      "wordTexts": [
        "quero",
        "mais",
        "por favor"
      ]
    },
    {
      "id": "f4000000-0034-4000-8000-000000000004",
      "text_target": "Estou satisfeito, obrigado.",
      "text_en": "I am full, thank you.",
      "literal_translation": "(I) am satisfied, thank-you.",
      "usage_note": "The polite way to refuse more food; 'estou cheio' (I'm full) is more informal, and a woman says 'satisfeita'.",
      "wordTexts": [
        "satisfeito",
        "obrigado"
      ]
    },
    {
      "id": "f4000000-0034-4000-8000-000000000005",
      "text_target": "Saúde!",
      "text_en": "Cheers!",
      "literal_translation": "Health!",
      "usage_note": "Said when clinking glasses — and also when someone sneezes.",
      "wordTexts": [
        "saúde"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0034-4000-8000-000000000001",
      "pattern_template": "Você quer ___ carne?",
      "pattern_en": "Do you want more meat?",
      "explanation": "'Mais' goes directly before the noun, like 'more' in English.",
      "prompt": "Você quer ___ carne?",
      "hint_en": "Which word means 'more'?",
      "correct_answer": "mais",
      "distractors": [
        "muito",
        "um pouco",
        "também"
      ]
    },
    {
      "id": "0b400000-0034-4000-8000-000000000002",
      "pattern_template": "___ me passar a cerveja?",
      "pattern_en": "Can you pass me the beer?",
      "explanation": "'Pode' (can/may) starts a polite request; the verb after it stays in the infinitive.",
      "prompt": "___ me passar a cerveja?",
      "hint_en": "Which word means 'can' or 'may'?",
      "correct_answer": "pode",
      "distractors": [
        "quero",
        "tem",
        "vamos"
      ]
    },
    {
      "id": "0b400000-0034-4000-8000-000000000003",
      "pattern_template": "Obrigado, mas estou ___.",
      "pattern_en": "Thank you, but I am full.",
      "explanation": "'Estou' + adjective describes a temporary state; 'satisfeito' becomes 'satisfeita' for a woman.",
      "prompt": "Obrigado, mas estou ___.",
      "hint_en": "Which word means 'full' (after eating)?",
      "correct_answer": "satisfeito",
      "distractors": [
        "gostoso",
        "cansado",
        "delicioso"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000127",
      "text": "churrasco",
      "meaning_en": "barbecue",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000128",
      "text": "carne",
      "meaning_en": "meat",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000129",
      "text": "arroz",
      "meaning_en": "rice",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000130",
      "text": "feijão",
      "meaning_en": "beans",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000131",
      "text": "mais",
      "meaning_en": "more",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000132",
      "text": "gostoso",
      "meaning_en": "tasty",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000133",
      "text": "satisfeito",
      "meaning_en": "full (after eating)",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000134",
      "text": "saúde",
      "meaning_en": "cheers! / health",
      "part_of_speech": "interjection"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000135",
      "text": "sobremesa",
      "meaning_en": "dessert",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000136",
      "text": "suco",
      "meaning_en": "juice",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000137",
      "text": "pode",
      "meaning_en": "can / may (you, he, she)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000138",
      "text": "me passa",
      "meaning_en": "pass me",
      "part_of_speech": "phrase"
    }
  ],
  "existingWordTexts": [
    "você",
    "quero",
    "tem",
    "por favor",
    "está",
    "muito",
    "cerveja",
    "também",
    "agora",
    "obrigado",
    "delicioso",
    "um pouco"
  ]
};

export const UNIT3_SCENES: DialogueSceneData[] = [scene31, scene32, scene33, scene34];
