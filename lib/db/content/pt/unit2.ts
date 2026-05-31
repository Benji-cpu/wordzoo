// Portuguese (pt-BR) expanded content — Unit 2
// Auto-assembled from the author-portuguese-stream workflow.

import type { DialogueSceneData } from '../../dialogue-data';

const scene21: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000021",
  "title": "No café",
  "description": "Ordering at a café/restaurant: food and drink basics, ordering politely.",
  "scene_context": "You sit down at a cozy corner café for breakfast. A waiter comes over and you order something to eat and drink.",
  "sort_order": 5,
  "dialogues": [
    {
      "id": "e4000000-0021-4000-8000-000000000001",
      "speaker": "Garçom",
      "text_target": "Bom dia! O que você gostaria de comer?",
      "text_en": "Good morning! What would you like to eat?"
    },
    {
      "id": "e4000000-0021-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Bom dia! Eu gostaria de pão com café, por favor.",
      "text_en": "Good morning! I would like bread with coffee, please."
    },
    {
      "id": "e4000000-0021-4000-8000-000000000003",
      "speaker": "Garçom",
      "text_target": "E para beber? Quer água ou uma cerveja?",
      "text_en": "And to drink? Do you want water or a beer?"
    },
    {
      "id": "e4000000-0021-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Água, por favor. Não quero cerveja de manhã.",
      "text_en": "Water, please. I don't want beer in the morning."
    },
    {
      "id": "e4000000-0021-4000-8000-000000000005",
      "speaker": "Garçom",
      "text_target": "Aqui está a comida. O pão é delicioso!",
      "text_en": "Here is the food. The bread is delicious!"
    },
    {
      "id": "e4000000-0021-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Obrigado! Está muito bom.",
      "text_en": "Thank you! It's very good."
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0021-4000-8000-000000000001",
      "text_target": "Eu gostaria de café",
      "text_en": "I would like coffee",
      "literal_translation": "I would-like of coffee",
      "usage_note": "\"Gostaria\" is the polite way to order; softer and more courteous than \"quero\" (I want).",
      "wordTexts": [
        "eu",
        "gostaria",
        "café"
      ]
    },
    {
      "id": "f4000000-0021-4000-8000-000000000002",
      "text_target": "pão com café",
      "text_en": "bread with coffee",
      "literal_translation": "bread with coffee",
      "usage_note": "\"Com\" means \"with\" and links foods or drinks together, just like in English.",
      "wordTexts": [
        "pão",
        "com",
        "café"
      ]
    },
    {
      "id": "f4000000-0021-4000-8000-000000000003",
      "text_target": "E para beber?",
      "text_en": "And to drink?",
      "literal_translation": "And for to-drink?",
      "usage_note": "A waiter's standard question; \"para\" plus a verb expresses purpose (\"to drink\").",
      "wordTexts": [
        "para",
        "beber"
      ]
    },
    {
      "id": "f4000000-0021-4000-8000-000000000004",
      "text_target": "O pão é delicioso!",
      "text_en": "The bread is delicious!",
      "literal_translation": "The bread is delicious!",
      "usage_note": "\"Delicioso\" is masculine to agree with \"pão\"; for a feminine noun like \"comida\" you'd say \"deliciosa\".",
      "wordTexts": [
        "pão",
        "é",
        "delicioso"
      ]
    },
    {
      "id": "f4000000-0021-4000-8000-000000000005",
      "text_target": "Não quero cerveja",
      "text_en": "I don't want beer",
      "literal_translation": "Not I-want beer",
      "usage_note": "Put \"não\" before the verb to make any sentence negative.",
      "wordTexts": [
        "não",
        "quero",
        "cerveja"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0021-4000-8000-000000000001",
      "pattern_template": "Eu ___ de café.",
      "pattern_en": "I would like coffee.",
      "explanation": "Use \"gostaria\" to order politely — it means \"I would like\" and is gentler than \"quero\".",
      "prompt": "Eu ___ de café, por favor.",
      "hint_en": "The polite way to say \"I would like\".",
      "correct_answer": "gostaria",
      "distractors": [
        "comer",
        "beber",
        "com"
      ]
    },
    {
      "id": "0b400000-0021-4000-8000-000000000002",
      "pattern_template": "Pão ___ café.",
      "pattern_en": "Bread with coffee.",
      "explanation": "\"Com\" means \"with\" and joins two items, like bread and coffee.",
      "prompt": "Quero pão ___ café.",
      "hint_en": "The word for \"with\".",
      "correct_answer": "com",
      "distractors": [
        "para",
        "água",
        "é"
      ]
    },
    {
      "id": "0b400000-0021-4000-8000-000000000003",
      "pattern_template": "E ___ beber?",
      "pattern_en": "And to drink?",
      "explanation": "\"Para\" before a verb expresses purpose; here it means \"to (drink)\".",
      "prompt": "E ___ beber, o que você quer?",
      "hint_en": "The word meaning \"for / to\".",
      "correct_answer": "para",
      "distractors": [
        "com",
        "comer",
        "delicioso"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000046",
      "text": "água",
      "meaning_en": "water",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000047",
      "text": "café",
      "meaning_en": "coffee / café",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000048",
      "text": "cerveja",
      "meaning_en": "beer",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000049",
      "text": "comida",
      "meaning_en": "food",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000050",
      "text": "comer",
      "meaning_en": "to eat",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000051",
      "text": "beber",
      "meaning_en": "to drink",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000052",
      "text": "pão",
      "meaning_en": "bread",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000053",
      "text": "gostaria",
      "meaning_en": "I would like",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000054",
      "text": "para",
      "meaning_en": "for / to",
      "part_of_speech": "preposition"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000055",
      "text": "com",
      "meaning_en": "with",
      "part_of_speech": "preposition"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000056",
      "text": "delicioso",
      "meaning_en": "delicious",
      "part_of_speech": "adjective"
    }
  ],
  "existingWordTexts": [
    "bom dia",
    "por favor",
    "eu",
    "você",
    "quero",
    "uma",
    "não",
    "é",
    "obrigado"
  ]
};

const scene22: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000022",
  "title": "Na feira",
  "description": "Shopping at the market: numbers, asking prices, paying with reais.",
  "scene_context": "You wander through a colourful street market full of fruit and crafts. You pick out a few things and ask the vendor how much they cost.",
  "sort_order": 6,
  "dialogues": [
    {
      "id": "e4000000-0022-4000-8000-000000000001",
      "speaker": "Feirante",
      "text_target": "Oi! Bom dia! Tem fruta bem fresca aqui.",
      "text_en": "Hi! Good morning! There's really fresh fruit here."
    },
    {
      "id": "e4000000-0022-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Bom dia! Quanto custa um, por favor?",
      "text_en": "Good morning! How much does one cost, please?"
    },
    {
      "id": "e4000000-0022-4000-8000-000000000003",
      "speaker": "Feirante",
      "text_target": "Cinco reais. Você quer uma?",
      "text_en": "Five reais. Do you want one?"
    },
    {
      "id": "e4000000-0022-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Cinco reais é muito caro. Tem mais barato?",
      "text_en": "Five reais is very expensive. Do you have anything cheaper?"
    },
    {
      "id": "e4000000-0022-4000-8000-000000000005",
      "speaker": "Feirante",
      "text_target": "Tem, sim! Três por dois reais. Bem barato!",
      "text_en": "Yes, I do! Three for two reais. Really cheap!"
    },
    {
      "id": "e4000000-0022-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Quero quatro, por favor. Aqui o dinheiro. Obrigada!",
      "text_en": "I want four, please. Here's the money. Thank you!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0022-4000-8000-000000000001",
      "text_target": "Quanto custa um?",
      "text_en": "How much does one cost?",
      "literal_translation": "How-much costs one?",
      "usage_note": "At a market you can ask the price of a single item this way; use \"um\" for one of something.",
      "wordTexts": [
        "quanto custa",
        "um"
      ]
    },
    {
      "id": "f4000000-0022-4000-8000-000000000002",
      "text_target": "Cinco reais",
      "text_en": "Five reais",
      "literal_translation": "Five reais",
      "usage_note": "Reais is the plural of the Brazilian currency (real); prices are almost always stated as \"X reais.\"",
      "wordTexts": [
        "cinco",
        "reais"
      ]
    },
    {
      "id": "f4000000-0022-4000-8000-000000000003",
      "text_target": "Muito caro",
      "text_en": "Very expensive",
      "literal_translation": "Very expensive",
      "usage_note": "A polite way to start bargaining; \"caro\" is masculine here, but becomes \"cara\" with a feminine noun (fruta cara).",
      "wordTexts": [
        "muito",
        "caro"
      ]
    },
    {
      "id": "f4000000-0022-4000-8000-000000000004",
      "text_target": "Tem mais barato?",
      "text_en": "Do you have anything cheaper?",
      "literal_translation": "Has more cheap?",
      "usage_note": "\"Tem\" doubles as \"do you have?\" and \"is there?\"; pair it with \"barato\" to ask for a lower price.",
      "wordTexts": [
        "tem",
        "barato"
      ]
    },
    {
      "id": "f4000000-0022-4000-8000-000000000005",
      "text_target": "Aqui o dinheiro",
      "text_en": "Here's the money",
      "literal_translation": "Here the money",
      "usage_note": "Say this as you hand over cash; \"dinheiro\" covers money in general, not just coins or notes.",
      "wordTexts": [
        "dinheiro"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0022-4000-8000-000000000001",
      "pattern_template": "___ a fruta?",
      "pattern_en": "How much is the fruit?",
      "explanation": "\"Quanto custa\" means \"how much does it cost\" — use it to ask any price.",
      "prompt": "___ a fruta?",
      "hint_en": "How much is the fruit?",
      "correct_answer": "quanto custa",
      "distractors": [
        "caro",
        "barato",
        "dinheiro"
      ]
    },
    {
      "id": "0b400000-0022-4000-8000-000000000002",
      "pattern_template": "___, sim!",
      "pattern_en": "Yes, I do / there is!",
      "explanation": "\"Tem\" means both \"do you have?\" and \"there is.\" As an answer it confirms something is available.",
      "prompt": "___, sim! Três por dois reais.",
      "hint_en": "Yes, I do! Three for two reais.",
      "correct_answer": "tem",
      "distractors": [
        "fruta",
        "cinco",
        "caro"
      ]
    },
    {
      "id": "0b400000-0022-4000-8000-000000000003",
      "pattern_template": "Quero ___.",
      "pattern_en": "I want [number].",
      "explanation": "Use \"quero\" plus a number to order a quantity. \"Quatro\" is four; the numbers stay the same whatever you are buying.",
      "prompt": "Quero ___, por favor.",
      "hint_en": "I want four, please.",
      "correct_answer": "quatro",
      "distractors": [
        "dinheiro",
        "barato",
        "reais"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000057",
      "text": "quanto custa",
      "meaning_en": "how much does it cost",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000058",
      "text": "dinheiro",
      "meaning_en": "money",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000059",
      "text": "reais",
      "meaning_en": "reais (Brazilian currency)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000061",
      "text": "dois",
      "meaning_en": "two",
      "part_of_speech": "numeral"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000062",
      "text": "três",
      "meaning_en": "three",
      "part_of_speech": "numeral"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000063",
      "text": "quatro",
      "meaning_en": "four",
      "part_of_speech": "numeral"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000064",
      "text": "cinco",
      "meaning_en": "five",
      "part_of_speech": "numeral"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000065",
      "text": "caro",
      "meaning_en": "expensive",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000066",
      "text": "barato",
      "meaning_en": "cheap",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000067",
      "text": "fruta",
      "meaning_en": "fruit",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000068",
      "text": "tem",
      "meaning_en": "there is / do you have",
      "part_of_speech": "verb"
    }
  ],
  "existingWordTexts": [
    "oi",
    "bom dia",
    "por favor",
    "você",
    "quero",
    "uma",
    "é",
    "muito",
    "sim",
    "obrigada",
    "um"
  ]
};

const scene23: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000023",
  "title": "Pegando o ônibus",
  "description": "Getting around the city: transport, asking how to get somewhere, simple useful verbs.",
  "scene_context": "You want to visit the old town across the city and decide to take the bus. You ask a local how to get there.",
  "sort_order": 7,
  "dialogues": [
    {
      "id": "e4000000-0023-4000-8000-000000000001",
      "speaker": "Camila",
      "text_target": "Oi! Você parece perdido. Posso ajudar?",
      "text_en": "Hi! You look lost. Can I help?"
    },
    {
      "id": "e4000000-0023-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Oi! Sim, por favor. Eu preciso ir para o centro. Como eu vou?",
      "text_en": "Hi! Yes, please. I need to go downtown. How do I go?"
    },
    {
      "id": "e4000000-0023-4000-8000-000000000003",
      "speaker": "Camila",
      "text_target": "Você pode pegar o ônibus. O ponto fica logo aqui, perto da estação.",
      "text_en": "You can take the bus. The stop is right here, near the station."
    },
    {
      "id": "e4000000-0023-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Que horas passa o ônibus? Vou agora ou pego um táxi?",
      "text_en": "What time does the bus come? Should I go now or take a taxi?"
    },
    {
      "id": "e4000000-0023-4000-8000-000000000005",
      "speaker": "Camila",
      "text_target": "O ônibus passa agora, daqui a pouco. O táxi é mais caro.",
      "text_en": "The bus comes now, in a little bit. The taxi is more expensive."
    },
    {
      "id": "e4000000-0023-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Obrigado! Então vou de ônibus para o centro.",
      "text_en": "Thank you! Then I'll go downtown by bus."
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0023-4000-8000-000000000001",
      "text_target": "Eu preciso ir para o centro.",
      "text_en": "I need to go downtown.",
      "literal_translation": "I need to-go to the centre.",
      "usage_note": "\"preciso\" already means \"I need\" (1st person), so don't add \"eu\" unless you want emphasis; pair it with the infinitive \"ir\".",
      "wordTexts": [
        "eu",
        "preciso",
        "ir",
        "para",
        "centro"
      ]
    },
    {
      "id": "f4000000-0023-4000-8000-000000000002",
      "text_target": "Como eu vou?",
      "text_en": "How do I go?",
      "literal_translation": "How I go?",
      "usage_note": "A handy way to ask directions; \"vou\" is the \"I\" form of \"ir\", so this asks how you yourself should get somewhere.",
      "wordTexts": [
        "como",
        "eu",
        "vou"
      ]
    },
    {
      "id": "f4000000-0023-4000-8000-000000000003",
      "text_target": "O ponto fica perto da estação.",
      "text_en": "The stop is near the station.",
      "literal_translation": "The stop stays near of-the station.",
      "usage_note": "Use \"fica\" for fixed locations of places; \"estação\" is feminine, so it takes \"da\" (de + a).",
      "wordTexts": [
        "ponto",
        "fica",
        "perto",
        "estação"
      ]
    },
    {
      "id": "f4000000-0023-4000-8000-000000000004",
      "text_target": "Que horas passa o ônibus?",
      "text_en": "What time does the bus come?",
      "literal_translation": "What hours passes the bus?",
      "usage_note": "\"que horas\" is the standard way to ask the time something happens; \"passa\" here means the bus comes by.",
      "wordTexts": [
        "que horas",
        "ônibus"
      ]
    },
    {
      "id": "f4000000-0023-4000-8000-000000000005",
      "text_target": "Vou de ônibus agora.",
      "text_en": "I'm going by bus now.",
      "literal_translation": "I-go by bus now.",
      "usage_note": "Use \"de\" + transport to say how you travel; \"vou\" can mean both \"I go\" and \"I'm going right now\".",
      "wordTexts": [
        "vou",
        "ônibus",
        "agora"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0023-4000-8000-000000000001",
      "pattern_template": "Eu ___ ir para o centro.",
      "pattern_en": "I need to go downtown.",
      "explanation": "\"preciso\" means \"I need\" and is followed by an infinitive verb like \"ir\".",
      "prompt": "Eu ___ ir para o centro.",
      "hint_en": "the verb meaning \"I need\"",
      "correct_answer": "preciso",
      "distractors": [
        "vou",
        "como",
        "agora"
      ]
    },
    {
      "id": "0b400000-0023-4000-8000-000000000002",
      "pattern_template": "___ eu vou para a estação?",
      "pattern_en": "How do I go to the station?",
      "explanation": "\"como\" means \"how\" and starts a question about the way to do something.",
      "prompt": "___ eu vou para a estação?",
      "hint_en": "the question word meaning \"how\"",
      "correct_answer": "como",
      "distractors": [
        "ponto",
        "preciso",
        "táxi"
      ]
    },
    {
      "id": "0b400000-0023-4000-8000-000000000003",
      "pattern_template": "Vou pegar o ___ no ponto.",
      "pattern_en": "I'm going to take the bus at the stop.",
      "explanation": "\"ônibus\" is the bus you catch at a \"ponto\" (bus stop); a \"táxi\" wouldn't wait at a stop.",
      "prompt": "Vou pegar o ___ no ponto.",
      "hint_en": "the public vehicle you wait for at a stop",
      "correct_answer": "ônibus",
      "distractors": [
        "centro",
        "estação",
        "agora"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000069",
      "text": "ônibus",
      "meaning_en": "bus",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000070",
      "text": "táxi",
      "meaning_en": "taxi",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000071",
      "text": "como",
      "meaning_en": "how",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000072",
      "text": "vou",
      "meaning_en": "I go / I am going",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000073",
      "text": "preciso",
      "meaning_en": "I need",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000074",
      "text": "centro",
      "meaning_en": "city centre / downtown",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000075",
      "text": "estação",
      "meaning_en": "station",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000076",
      "text": "ponto",
      "meaning_en": "stop (bus stop)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000077",
      "text": "ir",
      "meaning_en": "to go",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000078",
      "text": "agora",
      "meaning_en": "now",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000079",
      "text": "que horas",
      "meaning_en": "what time",
      "part_of_speech": "phrase"
    }
  ],
  "existingWordTexts": [
    "oi",
    "sim",
    "por favor",
    "eu",
    "você",
    "perto",
    "obrigado",
    "para",
    "aqui"
  ]
};

const scene24: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000024",
  "title": "Um jantar entre amigos",
  "description": "A friendly meal: paying the bill, complimenting the food, making simple plans.",
  "scene_context": "Your new friends invite you to dinner at a lively restaurant. After a great meal you settle the bill and make plans to meet again.",
  "sort_order": 8,
  "dialogues": [
    {
      "id": "e4000000-0024-4000-8000-000000000001",
      "speaker": "Bruno",
      "text_target": "A comida está deliciosa! Você gosta?",
      "text_en": "The food is delicious! Do you like it?"
    },
    {
      "id": "e4000000-0024-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Sim, eu gosto muito! O jantar está muito bom.",
      "text_en": "Yes, I like it a lot! The dinner is very good."
    },
    {
      "id": "e4000000-0024-4000-8000-000000000003",
      "speaker": "Bruno",
      "text_target": "Garçom, a conta, por favor!",
      "text_en": "Waiter, the check, please!"
    },
    {
      "id": "e4000000-0024-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Obrigado pelo jantar. Vamos almoçar amanhã?",
      "text_en": "Thanks for the dinner. Shall we have lunch tomorrow?"
    },
    {
      "id": "e4000000-0024-4000-8000-000000000005",
      "speaker": "Bruno",
      "text_target": "Hoje não, mas amanhã sim! Vamos marcar um almoço.",
      "text_en": "Not today, but tomorrow yes! Let's set up a lunch."
    },
    {
      "id": "e4000000-0024-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Que bom! Tchau, Bruno, até logo!",
      "text_en": "Great! Bye, Bruno, see you soon!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0024-4000-8000-000000000001",
      "text_target": "A conta, por favor",
      "text_en": "The check, please",
      "literal_translation": "The check, by favor",
      "usage_note": "The standard, polite way to ask for the bill in any Brazilian restaurant.",
      "wordTexts": [
        "conta",
        "por favor"
      ]
    },
    {
      "id": "f4000000-0024-4000-8000-000000000002",
      "text_target": "Eu gosto muito",
      "text_en": "I like it a lot",
      "literal_translation": "I like much",
      "usage_note": "Use 'gosto' for 'I like'; add 'muito' (a lot) to show strong enthusiasm.",
      "wordTexts": [
        "eu",
        "gosto",
        "muito"
      ]
    },
    {
      "id": "f4000000-0024-4000-8000-000000000003",
      "text_target": "A comida está deliciosa",
      "text_en": "The food is delicious",
      "literal_translation": "The food is delicious",
      "usage_note": "'está' describes a current state; 'deliciosa' takes a feminine ending to agree with 'comida', which is a feminine noun.",
      "wordTexts": [
        "comida",
        "está",
        "delicioso"
      ]
    },
    {
      "id": "f4000000-0024-4000-8000-000000000004",
      "text_target": "Vamos almoçar amanhã?",
      "text_en": "Shall we have lunch tomorrow?",
      "literal_translation": "Let's-go to-lunch tomorrow?",
      "usage_note": "'Vamos' + verb is the easy way to suggest doing something together; 'amanhã' (tomorrow) sets the time. 'almoçar' is the verb form of the noun 'almoço'.",
      "wordTexts": [
        "vamos",
        "almoço",
        "amanhã"
      ]
    },
    {
      "id": "f4000000-0024-4000-8000-000000000005",
      "text_target": "Tchau, até logo!",
      "text_en": "Bye, see you soon!",
      "literal_translation": "Bye, until soon!",
      "usage_note": "A warm, casual goodbye between friends; 'até logo' implies you'll meet again soon.",
      "wordTexts": [
        "tchau",
        "até logo"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0024-4000-8000-000000000001",
      "pattern_template": "A ___, por favor!",
      "pattern_en": "The ___, please!",
      "explanation": "'conta' is the bill or check you ask for at the end of a meal.",
      "prompt": "You're ready to pay. You call the waiter: \"A ___, por favor!\"",
      "hint_en": "the thing you pay at the end of a meal",
      "correct_answer": "conta",
      "distractors": [
        "comida",
        "almoço",
        "jantar"
      ]
    },
    {
      "id": "0b400000-0024-4000-8000-000000000002",
      "pattern_template": "Eu ___ muito da comida.",
      "pattern_en": "I ___ the food a lot.",
      "explanation": "'gosto' means 'I like' — the first-person form used to express your own preference.",
      "prompt": "Tell your friend you really enjoy the meal: \"Eu ___ muito da comida.\"",
      "hint_en": "I like",
      "correct_answer": "gosto",
      "distractors": [
        "vamos",
        "está",
        "quero"
      ]
    },
    {
      "id": "0b400000-0024-4000-8000-000000000003",
      "pattern_template": "___ almoçar amanhã?",
      "pattern_en": "Shall we have lunch tomorrow?",
      "explanation": "'Vamos' + a verb is how you suggest doing something together ('let's...').",
      "prompt": "Suggest meeting up: \"___ almoçar amanhã?\"",
      "hint_en": "let's go / shall we",
      "correct_answer": "vamos",
      "distractors": [
        "gosto",
        "está",
        "hoje"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000080",
      "text": "conta",
      "meaning_en": "the bill / check",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000081",
      "text": "jantar",
      "meaning_en": "dinner / to have dinner",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000082",
      "text": "almoço",
      "meaning_en": "lunch",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000083",
      "text": "amanhã",
      "meaning_en": "tomorrow",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000084",
      "text": "hoje",
      "meaning_en": "today",
      "part_of_speech": "adverb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000085",
      "text": "vamos",
      "meaning_en": "let's go / we go",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000086",
      "text": "gosto",
      "meaning_en": "I like",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000087",
      "text": "está",
      "meaning_en": "is (right now / state)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000088",
      "text": "bom",
      "meaning_en": "good (masculine)",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000089",
      "text": "tchau",
      "meaning_en": "bye",
      "part_of_speech": "interjection"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000090",
      "text": "até logo",
      "meaning_en": "see you soon",
      "part_of_speech": "phrase"
    }
  ],
  "existingWordTexts": [
    "sim",
    "eu",
    "muito",
    "obrigado",
    "por favor",
    "comida",
    "delicioso",
    "você",
    "não",
    "quero"
  ]
};

export const UNIT2_SCENES: DialogueSceneData[] = [scene21, scene22, scene23, scene24];
