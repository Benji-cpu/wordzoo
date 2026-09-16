// Portuguese (pt-BR) expanded content — Unit 4: Viajando pelo Brasil
// Travelling around Brazil with your partner and your mother: bus station,
// guesthouse, beach day, asking locals for tips.

import type { DialogueSceneData } from '../../dialogue-data';

const scene41: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000041",
  "title": "Na rodoviária",
  "description": "At the bus station: buying tickets, finding the gate, departure and arrival times, delays and seats.",
  "scene_context": "You, Dani and your mother are leaving Rio for a few days on the coast. You go to the bus station counter to buy the tickets and find your gate.",
  "sort_order": 13,
  "dialogues": [
    {
      "id": "e4000000-0041-4000-8000-000000000001",
      "speaker": "Atendente",
      "text_target": "Bom dia! Passagem para onde?",
      "text_en": "Good morning! Ticket to where?"
    },
    {
      "id": "e4000000-0041-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Três passagens de ida e volta para Paraty, por favor.",
      "text_en": "Three return tickets to Paraty, please."
    },
    {
      "id": "e4000000-0041-4000-8000-000000000003",
      "speaker": "Atendente",
      "text_target": "O próximo ônibus sai às dez e chega à uma. Assento na janela?",
      "text_en": "The next bus leaves at ten and arrives at one. Window seat?"
    },
    {
      "id": "e4000000-0041-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Sim, obrigado. Qual é o portão? E o horário está certo?",
      "text_en": "Yes, thank you. Which gate is it? And is the time right?"
    },
    {
      "id": "e4000000-0041-4000-8000-000000000005",
      "speaker": "Atendente",
      "text_target": "Portão cinco. Hoje o ônibus não está atrasado. A mala vai embaixo.",
      "text_en": "Gate five. The bus isn't delayed today. Luggage goes underneath."
    },
    {
      "id": "e4000000-0041-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Perfeito. O voo de volta é só amanhã, então tudo bem.",
      "text_en": "Perfect. Our flight back is only tomorrow, so that's fine."
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0041-4000-8000-000000000001",
      "text_target": "Uma passagem de ida e volta, por favor.",
      "text_en": "One return ticket, please.",
      "literal_translation": "One ticket of going and return, by favor.",
      "usage_note": "'Passagem' is a travel ticket (bus, plane); for a one-way ticket say 'só ida'.",
      "wordTexts": [
        "uma",
        "passagem",
        "ida e volta",
        "por favor"
      ]
    },
    {
      "id": "f4000000-0041-4000-8000-000000000002",
      "text_target": "Que horas sai o próximo ônibus?",
      "text_en": "What time does the next bus leave?",
      "literal_translation": "What hours leaves the next bus?",
      "usage_note": "'Sai' is the he/she/it form of 'sair' (to leave); swap 'ônibus' for 'voo' at the airport.",
      "wordTexts": [
        "que horas",
        "sai",
        "próximo",
        "ônibus"
      ]
    },
    {
      "id": "f4000000-0041-4000-8000-000000000003",
      "text_target": "Qual é o portão?",
      "text_en": "Which gate is it?",
      "literal_translation": "Which is the gate?",
      "usage_note": "'Portão' is a gate at a station or airport; 'qual' asks 'which one'.",
      "wordTexts": [
        "portão"
      ]
    },
    {
      "id": "f4000000-0041-4000-8000-000000000004",
      "text_target": "O ônibus está atrasado?",
      "text_en": "Is the bus delayed?",
      "literal_translation": "The bus is delayed?",
      "usage_note": "'Atrasado' is masculine to agree with 'ônibus' and 'voo'; a question is just a rising tone.",
      "wordTexts": [
        "ônibus",
        "está",
        "atrasado"
      ]
    },
    {
      "id": "f4000000-0041-4000-8000-000000000005",
      "text_target": "Que horas chega?",
      "text_en": "What time does it arrive?",
      "literal_translation": "What hours arrives?",
      "usage_note": "'Chega' (arrives) pairs with 'sai' (leaves); Brazilians often drop the subject when it's obvious.",
      "wordTexts": [
        "que horas",
        "chega"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0041-4000-8000-000000000001",
      "pattern_template": "Uma ___ para Paraty, por favor.",
      "pattern_en": "One ticket to Paraty, please.",
      "explanation": "'Passagem' is the word for a travel ticket; 'para' says where it goes.",
      "prompt": "Uma ___ para Paraty, por favor.",
      "hint_en": "Which word means 'ticket' for a bus or plane?",
      "correct_answer": "passagem",
      "distractors": [
        "mala",
        "portão",
        "assento"
      ]
    },
    {
      "id": "0b400000-0041-4000-8000-000000000002",
      "pattern_template": "O ônibus ___ às dez.",
      "pattern_en": "The bus leaves at ten.",
      "explanation": "'Sai' is the third-person form of 'sair', used for buses, flights and people leaving.",
      "prompt": "O ônibus ___ às dez.",
      "hint_en": "Which verb means 'leaves'?",
      "correct_answer": "sai",
      "distractors": [
        "chega",
        "está",
        "tem"
      ]
    },
    {
      "id": "0b400000-0041-4000-8000-000000000003",
      "pattern_template": "O voo está ___.",
      "pattern_en": "The flight is delayed.",
      "explanation": "'Estar' + adjective describes a temporary state; 'atrasado' agrees with the masculine 'voo'.",
      "prompt": "O voo está ___.",
      "hint_en": "Which word means 'delayed'?",
      "correct_answer": "atrasado",
      "distractors": [
        "próximo",
        "caro",
        "longe"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000141",
      "text": "passagem",
      "meaning_en": "ticket (bus / plane)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000142",
      "text": "voo",
      "meaning_en": "flight",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000143",
      "text": "rodoviária",
      "meaning_en": "bus station",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000144",
      "text": "mala",
      "meaning_en": "suitcase / luggage",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000145",
      "text": "portão",
      "meaning_en": "gate",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000146",
      "text": "horário",
      "meaning_en": "timetable / time (schedule)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000147",
      "text": "sai",
      "meaning_en": "leaves / departs (he-she-it)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000148",
      "text": "chega",
      "meaning_en": "arrives (he-she-it)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000149",
      "text": "atrasado",
      "meaning_en": "delayed / late",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000150",
      "text": "ida e volta",
      "meaning_en": "return (round trip)",
      "part_of_speech": "phrase"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000151",
      "text": "próximo",
      "meaning_en": "next",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000152",
      "text": "assento",
      "meaning_en": "seat",
      "part_of_speech": "noun"
    }
  ],
  "existingWordTexts": [
    "bom dia",
    "para",
    "onde",
    "três",
    "por favor",
    "ônibus",
    "que horas",
    "está",
    "hoje",
    "amanhã",
    "obrigado",
    "cinco"
  ]
};

const scene42: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000042",
  "title": "Na pousada",
  "description": "Checking into a guesthouse: breakfast included, air conditioning, the wifi password, towels, hot water and what isn't working.",
  "scene_context": "You arrive at a small family-run guesthouse by the sea. The owner shows you the rooms and you sort out the details for your mother's room and yours.",
  "sort_order": 14,
  "dialogues": [
    {
      "id": "e4000000-0042-4000-8000-000000000001",
      "speaker": "Dona Célia",
      "text_target": "Bem-vindos à pousada! O café da manhã está incluído na diária.",
      "text_en": "Welcome to the guesthouse! Breakfast is included in the nightly rate."
    },
    {
      "id": "e4000000-0042-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Que bom! Os quartos têm ar-condicionado? Aqui está muito quente.",
      "text_en": "Great! Do the rooms have air conditioning? It's very hot here."
    },
    {
      "id": "e4000000-0042-4000-8000-000000000003",
      "speaker": "Dona Célia",
      "text_target": "Têm, sim. E a senha da internet fica na porta do quarto.",
      "text_en": "They do. And the internet password is on the room door."
    },
    {
      "id": "e4000000-0042-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Obrigado. Minha mãe precisa de mais uma toalha, por favor.",
      "text_en": "Thank you. My mother needs one more towel, please."
    },
    {
      "id": "e4000000-0042-4000-8000-000000000005",
      "speaker": "Dona Célia",
      "text_target": "Claro. O chuveiro é elétrico, a água quente funciona bem.",
      "text_en": "Of course. The shower is electric, the hot water works well."
    },
    {
      "id": "e4000000-0042-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Perfeito. Não gosto de banho frio! Até logo.",
      "text_en": "Perfect. I don't like cold showers! See you soon."
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0042-4000-8000-000000000001",
      "text_target": "O café da manhã está incluído?",
      "text_en": "Is breakfast included?",
      "literal_translation": "The coffee of the morning is included?",
      "usage_note": "'Café da manhã' is breakfast (literally 'morning coffee'); 'incluído' means it comes with the price.",
      "wordTexts": [
        "café da manhã",
        "está",
        "incluído"
      ]
    },
    {
      "id": "f4000000-0042-4000-8000-000000000002",
      "text_target": "Qual é a senha da internet?",
      "text_en": "What is the wifi password?",
      "literal_translation": "Which is the password of-the internet?",
      "usage_note": "'Senha' is any password or PIN; Brazilians say 'internet' or 'wi-fi' (pronounced 'wee-fee').",
      "wordTexts": [
        "senha",
        "internet"
      ]
    },
    {
      "id": "f4000000-0042-4000-8000-000000000003",
      "text_target": "O quarto tem ar-condicionado?",
      "text_en": "Does the room have air conditioning?",
      "literal_translation": "The room has air-conditioned?",
      "usage_note": "'Tem' does the job of 'has' and 'is there'; ask this before you book anywhere hot.",
      "wordTexts": [
        "quarto",
        "tem",
        "ar-condicionado"
      ]
    },
    {
      "id": "f4000000-0042-4000-8000-000000000004",
      "text_target": "Preciso de uma toalha.",
      "text_en": "I need a towel.",
      "literal_translation": "(I) need of a towel.",
      "usage_note": "'Precisar' takes 'de' before a noun: 'preciso de' + the thing you need.",
      "wordTexts": [
        "preciso",
        "uma",
        "toalha"
      ]
    },
    {
      "id": "f4000000-0042-4000-8000-000000000005",
      "text_target": "O chuveiro não funciona.",
      "text_en": "The shower isn't working.",
      "literal_translation": "The shower not works.",
      "usage_note": "'Não funciona' is the all-purpose way to report anything broken: the wifi, the a/c, the key.",
      "wordTexts": [
        "chuveiro",
        "não",
        "funciona"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0042-4000-8000-000000000001",
      "pattern_template": "O ___ está incluído na diária.",
      "pattern_en": "Breakfast is included in the nightly rate.",
      "explanation": "'Café da manhã' is a fixed three-word noun for breakfast; 'diária' is the price per night.",
      "prompt": "O ___ está incluído na diária.",
      "hint_en": "Which word means 'breakfast'?",
      "correct_answer": "café da manhã",
      "distractors": [
        "chuveiro",
        "toalha",
        "internet"
      ]
    },
    {
      "id": "0b400000-0042-4000-8000-000000000002",
      "pattern_template": "Qual é a ___ da internet?",
      "pattern_en": "What is the internet password?",
      "explanation": "'Senha' is feminine, so it takes 'a'; 'da' is 'de' + 'a' (of the).",
      "prompt": "Qual é a ___ da internet?",
      "hint_en": "Which word means 'password'?",
      "correct_answer": "senha",
      "distractors": [
        "diária",
        "pousada",
        "toalha"
      ]
    },
    {
      "id": "0b400000-0042-4000-8000-000000000003",
      "pattern_template": "A água está muito ___.",
      "pattern_en": "The water is very cold.",
      "explanation": "Adjectives of temperature follow 'estar'; 'frio' stays masculine here because it describes the state, not the noun's gender.",
      "prompt": "A água está muito ___.",
      "hint_en": "Which word means 'cold'?",
      "correct_answer": "frio",
      "distractors": [
        "quente",
        "incluído",
        "atrasado"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000153",
      "text": "pousada",
      "meaning_en": "guesthouse / inn",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000154",
      "text": "café da manhã",
      "meaning_en": "breakfast",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000155",
      "text": "incluído",
      "meaning_en": "included",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000156",
      "text": "ar-condicionado",
      "meaning_en": "air conditioning",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000157",
      "text": "senha",
      "meaning_en": "password / PIN",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000158",
      "text": "toalha",
      "meaning_en": "towel",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000159",
      "text": "chuveiro",
      "meaning_en": "shower",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000160",
      "text": "quente",
      "meaning_en": "hot",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000161",
      "text": "frio",
      "meaning_en": "cold",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000162",
      "text": "internet",
      "meaning_en": "internet / wifi",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000163",
      "text": "diária",
      "meaning_en": "nightly rate (price per night)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000164",
      "text": "funciona",
      "meaning_en": "works / is working (it)",
      "part_of_speech": "verb"
    }
  ],
  "existingWordTexts": [
    "está",
    "quarto",
    "tem",
    "aqui",
    "muito",
    "obrigado",
    "preciso",
    "uma",
    "por favor",
    "água",
    "não",
    "gosto",
    "até logo"
  ]
};

const scene43: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000043",
  "title": "Dia de praia",
  "description": "A day at the beach: sun and heat, waves and sand, renting a chair and umbrella, coconut water and açaí, going for a swim.",
  "scene_context": "You spend the day on a long beach with Dani and your mother. A vendor rents out chairs and umbrellas and sells drinks, and Dani wants you in the water.",
  "sort_order": 15,
  "dialogues": [
    {
      "id": "e4000000-0043-4000-8000-000000000001",
      "speaker": "Dani",
      "text_target": "Que sol! Hoje está muito calor. Você passou protetor solar?",
      "text_en": "What sun! It's really hot today. Did you put on sunscreen?"
    },
    {
      "id": "e4000000-0043-4000-8000-000000000002",
      "speaker": "You",
      "text_target": "Passei, sim. O mar está lindo, mas a onda está grande.",
      "text_en": "I did. The sea is beautiful, but the waves are big."
    },
    {
      "id": "e4000000-0043-4000-8000-000000000003",
      "speaker": "Vendedor",
      "text_target": "Cadeira e guarda-sol? Vinte reais o dia. Tem água de coco também.",
      "text_en": "Chair and umbrella? Twenty reais for the day. I have coconut water too."
    },
    {
      "id": "e4000000-0043-4000-8000-000000000004",
      "speaker": "You",
      "text_target": "Três cadeiras e um guarda-sol, por favor. E duas águas de coco.",
      "text_en": "Three chairs and one umbrella, please. And two coconut waters."
    },
    {
      "id": "e4000000-0043-4000-8000-000000000005",
      "speaker": "Dani",
      "text_target": "A areia está quente! Vamos nadar? Depois a gente come um açaí.",
      "text_en": "The sand is hot! Shall we swim? Afterwards we'll have an açaí."
    },
    {
      "id": "e4000000-0043-4000-8000-000000000006",
      "speaker": "You",
      "text_target": "Vamos! Minha mãe fica aqui na cadeira, na sombra.",
      "text_en": "Let's go! My mother is staying here on the chair, in the shade."
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0043-4000-8000-000000000001",
      "text_target": "Hoje está muito calor.",
      "text_en": "It's very hot today.",
      "literal_translation": "Today is much heat.",
      "usage_note": "Weather uses 'está' + a noun: 'está calor' (it's hot), 'está frio' (it's cold), 'está sol' (it's sunny).",
      "wordTexts": [
        "hoje",
        "está",
        "muito",
        "calor"
      ]
    },
    {
      "id": "f4000000-0043-4000-8000-000000000002",
      "text_target": "Uma cadeira e um guarda-sol, por favor.",
      "text_en": "A chair and an umbrella, please.",
      "literal_translation": "A chair and a guard-sun, by favor.",
      "usage_note": "Beach vendors rent 'cadeira' and 'guarda-sol' by the day; agree the price before you sit.",
      "wordTexts": [
        "uma",
        "cadeira",
        "um",
        "guarda-sol",
        "por favor"
      ]
    },
    {
      "id": "f4000000-0043-4000-8000-000000000003",
      "text_target": "Quanto custa a água de coco?",
      "text_en": "How much is the coconut water?",
      "literal_translation": "How-much costs the water of coconut?",
      "usage_note": "'Água de coco' is sold straight from the coconut on every Brazilian beach; 'quanto custa' asks the price.",
      "wordTexts": [
        "quanto custa",
        "água de coco"
      ]
    },
    {
      "id": "f4000000-0043-4000-8000-000000000004",
      "text_target": "Vamos nadar?",
      "text_en": "Shall we swim?",
      "literal_translation": "(We) go to-swim?",
      "usage_note": "'Vamos' + a verb in the infinitive is how you suggest doing something together.",
      "wordTexts": [
        "vamos",
        "nadar"
      ]
    },
    {
      "id": "f4000000-0043-4000-8000-000000000005",
      "text_target": "O mar está lindo!",
      "text_en": "The sea is beautiful!",
      "literal_translation": "The sea is beautiful!",
      "usage_note": "'Lindo' is a warm, everyday 'beautiful' (stronger than 'bonito'); it becomes 'linda' for feminine nouns like 'praia'.",
      "wordTexts": [
        "mar",
        "está",
        "lindo"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0043-4000-8000-000000000001",
      "pattern_template": "Hoje está muito ___.",
      "pattern_en": "It's very hot today.",
      "explanation": "'Calor' is the noun 'heat'; Brazilian weather talk uses 'está calor', not 'está quente'.",
      "prompt": "Hoje está muito ___.",
      "hint_en": "Which word means 'heat' (it's hot)?",
      "correct_answer": "calor",
      "distractors": [
        "sol",
        "areia",
        "onda"
      ]
    },
    {
      "id": "0b400000-0043-4000-8000-000000000002",
      "pattern_template": "Vamos ___?",
      "pattern_en": "Shall we swim?",
      "explanation": "After 'vamos' the verb stays in the infinitive (-ar / -er / -ir form).",
      "prompt": "Vamos ___?",
      "hint_en": "Which verb means 'to swim'?",
      "correct_answer": "nadar",
      "distractors": [
        "comer",
        "beber",
        "ir"
      ]
    },
    {
      "id": "0b400000-0043-4000-8000-000000000003",
      "pattern_template": "Uma cadeira e um ___, por favor.",
      "pattern_en": "A chair and an umbrella, please.",
      "explanation": "'Guarda-sol' is masculine, so it takes 'um'; hyphenated compounds keep the gender of the last word.",
      "prompt": "Uma cadeira e um ___, por favor.",
      "hint_en": "Which word means 'beach umbrella'?",
      "correct_answer": "guarda-sol",
      "distractors": [
        "açaí",
        "protetor solar",
        "mar"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000165",
      "text": "sol",
      "meaning_en": "sun",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000166",
      "text": "calor",
      "meaning_en": "heat (it's hot)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000167",
      "text": "mar",
      "meaning_en": "sea",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000168",
      "text": "onda",
      "meaning_en": "wave",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000169",
      "text": "areia",
      "meaning_en": "sand",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000170",
      "text": "guarda-sol",
      "meaning_en": "beach umbrella",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000171",
      "text": "cadeira",
      "meaning_en": "chair",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000172",
      "text": "água de coco",
      "meaning_en": "coconut water",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000173",
      "text": "açaí",
      "meaning_en": "açaí (frozen berry bowl)",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000174",
      "text": "nadar",
      "meaning_en": "to swim",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000175",
      "text": "protetor solar",
      "meaning_en": "sunscreen",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000176",
      "text": "lindo",
      "meaning_en": "beautiful / gorgeous",
      "part_of_speech": "adjective"
    }
  ],
  "existingWordTexts": [
    "hoje",
    "está",
    "muito",
    "você",
    "sim",
    "reais",
    "tem",
    "também",
    "três",
    "um",
    "por favor",
    "vamos",
    "aqui",
    "fica"
  ]
};

const scene44: DialogueSceneData = {
  "id": "d4000000-0001-4000-8000-000000000044",
  "title": "Pedindo dicas",
  "description": "Asking locals for tips and getting around safely: recommendations, the ride-app driver, your phone, getting lost, finding a pharmacy.",
  "scene_context": "You are in a new city without Dani for the afternoon. You ask the ride-app driver where to go, and later you need a pharmacy for your mother's headache.",
  "sort_order": 16,
  "dialogues": [
    {
      "id": "e4000000-0044-4000-8000-000000000001",
      "speaker": "You",
      "text_target": "Boa tarde! Você recomenda um lugar bom para almoçar aqui?",
      "text_en": "Good afternoon! Do you recommend a good place for lunch here?"
    },
    {
      "id": "e4000000-0044-4000-8000-000000000002",
      "speaker": "Motorista",
      "text_target": "Uma dica: o mercado no centro. Mas cuidado com o celular na rua.",
      "text_en": "A tip: the market in the centre. But be careful with your phone in the street."
    },
    {
      "id": "e4000000-0044-4000-8000-000000000003",
      "speaker": "You",
      "text_target": "Obrigado. A cidade é segura à noite?",
      "text_en": "Thank you. Is the city safe at night?"
    },
    {
      "id": "e4000000-0044-4000-8000-000000000004",
      "speaker": "Motorista",
      "text_target": "No centro, sim. Se você ficar perdido, pede ajuda a um motorista.",
      "text_en": "In the centre, yes. If you get lost, ask a driver for help."
    },
    {
      "id": "e4000000-0044-4000-8000-000000000005",
      "speaker": "You",
      "text_target": "Mais uma coisa: onde tem uma farmácia? Minha mãe está com dor de cabeça.",
      "text_en": "One more thing: where is there a pharmacy? My mother has a headache."
    },
    {
      "id": "e4000000-0044-4000-8000-000000000006",
      "speaker": "Motorista",
      "text_target": "Tem uma ali, perto do ponto de ônibus. Boa sorte!",
      "text_en": "There's one there, near the bus stop. Good luck!"
    }
  ],
  "phrases": [
    {
      "id": "f4000000-0044-4000-8000-000000000001",
      "text_target": "Você recomenda um lugar?",
      "text_en": "Do you recommend a place?",
      "literal_translation": "You recommend a place?",
      "usage_note": "'Recomenda' is the 'você' form of 'recomendar'; add 'para comer' or 'para visitar' to say what for.",
      "wordTexts": [
        "você",
        "recomenda",
        "um",
        "lugar"
      ]
    },
    {
      "id": "f4000000-0044-4000-8000-000000000002",
      "text_target": "A cidade é segura?",
      "text_en": "Is the city safe?",
      "literal_translation": "The city is safe?",
      "usage_note": "'Seguro' becomes 'segura' after the feminine 'cidade'; use 'é' for a permanent quality, not 'está'.",
      "wordTexts": [
        "cidade",
        "é",
        "seguro"
      ]
    },
    {
      "id": "f4000000-0044-4000-8000-000000000003",
      "text_target": "Cuidado com o celular!",
      "text_en": "Careful with your phone!",
      "literal_translation": "Care with the cellphone!",
      "usage_note": "'Cuidado' on its own means 'watch out'; 'celular' is the Brazilian word for a mobile phone.",
      "wordTexts": [
        "cuidado",
        "celular"
      ]
    },
    {
      "id": "f4000000-0044-4000-8000-000000000004",
      "text_target": "Estou perdido. Pode me ajudar?",
      "text_en": "I'm lost. Can you help me?",
      "literal_translation": "(I) am lost. Can me to-help?",
      "usage_note": "'Perdido' is what a man says; a woman says 'perdida'. 'Pode me ajudar?' is the politest way to ask for help.",
      "wordTexts": [
        "perdido",
        "ajuda"
      ]
    },
    {
      "id": "f4000000-0044-4000-8000-000000000005",
      "text_target": "Onde tem uma farmácia?",
      "text_en": "Where is there a pharmacy?",
      "literal_translation": "Where has a pharmacy?",
      "usage_note": "'Onde tem…?' is the everyday way to ask where something is; pharmacies in Brazil sell many medicines over the counter.",
      "wordTexts": [
        "onde",
        "tem",
        "uma",
        "farmácia"
      ]
    }
  ],
  "patterns": [
    {
      "id": "0b400000-0044-4000-8000-000000000001",
      "pattern_template": "Você ___ um lugar bom para almoçar?",
      "pattern_en": "Do you recommend a good place for lunch?",
      "explanation": "Regular -ar verbs take -a in the 'você' form: recomendar → recomenda.",
      "prompt": "Você ___ um lugar bom para almoçar?",
      "hint_en": "Which verb means 'recommend'?",
      "correct_answer": "recomenda",
      "distractors": [
        "funciona",
        "chega",
        "sai"
      ]
    },
    {
      "id": "0b400000-0044-4000-8000-000000000002",
      "pattern_template": "___ com o celular na rua.",
      "pattern_en": "Careful with your phone in the street.",
      "explanation": "'Cuidado' is a noun used as a warning; 'com' says what to be careful with.",
      "prompt": "___ com o celular na rua.",
      "hint_en": "Which word means 'careful'?",
      "correct_answer": "cuidado",
      "distractors": [
        "dica",
        "ajuda",
        "dor"
      ]
    },
    {
      "id": "0b400000-0044-4000-8000-000000000003",
      "pattern_template": "Onde tem uma ___?",
      "pattern_en": "Where is there a pharmacy?",
      "explanation": "'Farmácia' is feminine, so it takes 'uma'; 'onde tem' asks where something can be found.",
      "prompt": "Onde tem uma ___?",
      "hint_en": "Which word means 'pharmacy'?",
      "correct_answer": "farmácia",
      "distractors": [
        "cidade",
        "pousada",
        "rodoviária"
      ]
    }
  ],
  "newWords": [
    {
      "id": "b4000000-0001-4000-8000-000000000177",
      "text": "dica",
      "meaning_en": "tip / recommendation",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000178",
      "text": "recomenda",
      "meaning_en": "recommends (you / he / she)",
      "part_of_speech": "verb"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000179",
      "text": "lugar",
      "meaning_en": "place",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000180",
      "text": "cidade",
      "meaning_en": "city",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000181",
      "text": "seguro",
      "meaning_en": "safe",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000182",
      "text": "cuidado",
      "meaning_en": "careful / watch out",
      "part_of_speech": "interjection"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000183",
      "text": "motorista",
      "meaning_en": "driver",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000184",
      "text": "celular",
      "meaning_en": "mobile phone",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000185",
      "text": "perdido",
      "meaning_en": "lost",
      "part_of_speech": "adjective"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000186",
      "text": "ajuda",
      "meaning_en": "help",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000187",
      "text": "farmácia",
      "meaning_en": "pharmacy",
      "part_of_speech": "noun"
    },
    {
      "id": "b4000000-0001-4000-8000-000000000188",
      "text": "dor",
      "meaning_en": "pain / ache",
      "part_of_speech": "noun"
    }
  ],
  "existingWordTexts": [
    "boa tarde",
    "você",
    "um",
    "aqui",
    "centro",
    "rua",
    "obrigado",
    "é",
    "noite",
    "sim",
    "onde",
    "tem",
    "uma",
    "está",
    "ali",
    "perto",
    "ponto"
  ]
};

export const UNIT4_SCENES: DialogueSceneData[] = [scene41, scene42, scene43, scene44];
