/**
 * Authored in-scene conversation practice for the Brazilian Portuguese family
 * scenes (Unit 3 lessons 9-12, Unit 5 lessons 17, 18 and 20).
 *
 * The learner is Ben: a man at A1 meeting his partner Dani's family in São Paulo.
 * Every learner turn is graded LOCALLY against `target` plus the `accept` list
 * (accent-, case- and punctuation-insensitive, with typo tolerance) — no model
 * grades these. Each turn therefore lists the other wordings that are just as
 * right: with or without the subject pronoun, another natural wording, with or
 * without "muito" / "sim". An accepted answer must still do everything the
 * `goal_en` asks — one that drops a part (thanks but no compliment) is coached
 * with the full answer instead, which still moves the learner on.
 *
 * Learner lines stay inside each scene's taught words plus every earlier
 * lesson's. NPC lines may reach a little further; the English gloss covers it.
 * Male-speaker forms throughout (obrigado, cansado, satisfeito, bem-vindo), and
 * São Paulo Portuguese, never European.
 *
 * `mode` is left unset on purpose: lib/learn/derive-conversation.ts assigns the
 * difficulty when an exchange is replayed.
 */

import type { ConversationExchange } from '@/lib/learn/conversation-data';

export const PT_FAMILY_CONVERSATIONS: Record<string, ConversationExchange[]> = {
  // ── Lesson 9: Chegando na casa da família ──────────────────────────────────
  'd4000000-0001-4000-8000-000000000031': [
    {
      label: 'Welcome in',
      turns: [
        {
          role: 'npc', speaker: 'Dona Márcia',
          target: 'Bem-vindo! Entre, entre! Tudo bem?',
          en: 'Welcome! Come in, come in! How are you?',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Tell Dona Márcia you're fine, thank her, and say you're pleased to meet her",
          target: 'Tudo bem, obrigado! Muito prazer, Dona Márcia.',
          en: 'All good, thank you! Very nice to meet you, Dona Márcia.',
          distractors: ['Esta é a minha mãe.', 'Estou cansado da viagem.', 'Qual é o seu nome, por favor?'],
          hints: ['obrigado', 'Márcia', 'Tudo', 'prazer'],
          accept: [
            'Tudo bem, obrigado! Muito prazer.',
            'Tudo bem, obrigado! Prazer, Dona Márcia.',
            'Tudo bem, obrigado! Prazer.',
            'Estou bem, obrigado! Muito prazer, Dona Márcia.',
            'Obrigado, tudo bem! Muito prazer, Dona Márcia.',
          ],
        },
      ],
    },
    {
      label: 'Meet Seu Roberto',
      turns: [
        {
          role: 'npc', speaker: 'Dani',
          target: 'Esta é a minha mãe, e este é o meu pai.',
          en: 'This is my mother, and this is my father.',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Give Seu Roberto a hug and tell him what a lovely house he has',
          target: 'Um abraço, Seu Roberto! Que casa bonita!',
          en: 'A hug, Seu Roberto! What a beautiful house!',
          distractors: ['Bem-vindo à nossa casa!', 'Esta é a minha mãe.', 'Estou cansado da viagem.'],
          hints: ['bonita', 'Roberto', 'abraço', 'casa'],
          accept: [
            'Que casa bonita, Seu Roberto! Um abraço!',
            'Um abraço, Seu Roberto! A casa é muito bonita!',
            'Um abraço! Que casa bonita!',
            'Que casa bonita! Um abraço, Seu Roberto!',
            'Seu Roberto, um abraço! Que casa bonita!',
          ],
        },
      ],
    },
    {
      label: 'Tired?',
      turns: [
        {
          role: 'npc', speaker: 'Seu Roberto',
          target: 'Você está cansado da viagem?',
          en: 'Are you tired from the trip?',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Answer Seu Roberto: yes, you're tired from the trip",
          target: 'Sim, estou cansado da viagem.',
          en: 'Yes, I am tired from the trip.',
          distractors: ['Tudo bem?', 'Um abraço, um beijo!', 'Esta é a minha mãe.'],
          hints: ['viagem', 'estou', 'cansado', 'Sim'],
          accept: [
            'Estou cansado da viagem.',
            'Sim, estou cansado.',
            'Estou cansado, sim.',
            'Sim, um pouco cansado.',
            'Um pouco cansado, sim.',
            'Sim, estou um pouco cansado da viagem.',
            'Estou um pouco cansado, sim.',
            'Sim, estou muito cansado da viagem.',
          ],
        },
      ],
    },
    {
      label: "Where's the room?",
      turns: [
        {
          role: 'npc', speaker: 'Dona Márcia',
          target: 'O quarto está pronto. Descanse um pouco!',
          en: 'The room is ready. Rest a little!',
        },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: 'Ask Dona Márcia where the room is',
          target: 'Onde fica o quarto, Dona Márcia?',
          en: 'Where is the room, Dona Márcia?',
          distractors: ['Onde fica a praia?', 'Quero um quarto para uma noite.', 'Você está cansado da viagem?'],
          hints: ['quarto', 'fica', 'Onde', 'Márcia'],
          accept: [
            'Onde fica o quarto?',
            'Dona Márcia, onde fica o quarto?',
            'Onde fica o quarto, por favor?',
            'Dona Márcia, onde fica o quarto, por favor?',
            'Desculpe, onde fica o quarto?',
            'Onde fica o quarto, por favor, Dona Márcia?',
          ],
        },
        { role: 'npc', speaker: 'Dona Márcia', target: 'É ali, à esquerda.', en: "It's over there, on the left." },
      ],
    },
  ],

  // ── Lesson 10: Quem é quem ─────────────────────────────────────────────────
  'd4000000-0001-4000-8000-000000000032': [
    {
      label: 'Who is she?',
      turns: [
        {
          role: 'npc', speaker: 'Dani',
          target: 'Este é o meu irmão, Lucas. E esta é a minha avó.',
          en: 'This is my brother, Lucas. And this is my grandmother.',
        },
        { role: 'npc', speaker: 'Lucas', target: 'Oi! Bem-vindo à família!', en: 'Hi! Welcome to the family!' },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: "Say it's a pleasure to meet them, then ask who the woman by the window is: could she be Dani's sister?",
          target: 'Muito prazer! E quem é ela? A sua irmã?',
          en: 'Very nice to meet you! And who is she? Your sister?',
          distractors: ['Este é o meu irmão.', 'Esta é a minha mãe.', 'Tenho quarenta anos.'],
          hints: ['irmã', 'prazer', 'quem', 'sua'],
          accept: [
            'Muito prazer! Quem é ela? A sua irmã?',
            'Muito prazer! E quem é ela? É a sua irmã?',
            'Muito prazer! Quem é ela? É a sua irmã?',
            'Prazer! E quem é ela? A sua irmã?',
          ],
        },
        { role: 'npc', speaker: 'Dani', target: 'Não, é a minha tia.', en: "No, she's my aunt." },
      ],
    },
    {
      label: "Dani's boyfriend",
      turns: [
        {
          role: 'npc', speaker: 'Lucas',
          target: 'Ei, e você? Você é amigo da Dani?',
          en: "Hey, and you? Are you Dani's friend?",
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Tell Lucas you're not just a friend: you're Dani's boyfriend",
          target: 'Não, sou o namorado da Dani!',
          en: "No, I'm Dani's boyfriend!",
          distractors: ['Eu sou o Bruno.', 'Eu sou de Londres.', 'Esta é a Ana, minha amiga.'],
          hints: ['namorado', 'Não', 'sou', 'Dani'],
          accept: [
            'Não, eu sou o namorado da Dani!',
            'Sou o namorado da Dani.',
            'Eu sou o namorado da Dani.',
            'Não, sou namorado da Dani!',
            'Sou namorado da Dani.',
          ],
        },
      ],
    },
    {
      label: 'How old?',
      turns: [
        {
          role: 'npc', speaker: 'Lucas',
          target: 'Ah, você é o namorado da Dani! Quantos anos você tem?',
          en: "Ah, you're Dani's boyfriend! How old are you?",
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Tell Lucas you're forty, then ask him how old he is",
          target: 'Tenho quarenta anos. E você?',
          en: 'I am forty years old. And you?',
          distractors: ['Eu tenho uma reserva.', 'Sou o namorado da Dani.', 'Quem é ela?'],
          hints: ['quarenta', 'você', 'anos', 'Tenho'],
          accept: [
            'Eu tenho quarenta anos. E você?',
            'Tenho quarenta anos. Quantos anos você tem?',
            'Eu tenho quarenta anos. Quantos anos você tem?',
            'Tenho quarenta anos. E você, quantos anos tem?',
            'Tenho quarenta anos. E você? Quantos anos você tem?',
            'Eu tenho quarenta anos. E você, quantos anos você tem?',
          ],
        },
        { role: 'npc', speaker: 'Lucas', target: 'Eu tenho vinte e cinco!', en: "I'm twenty-five!" },
      ],
    },
    {
      label: 'Ask about Grandpa',
      turns: [
        {
          role: 'npc', speaker: 'Lucas',
          target: 'A minha avó mora aqui. E o meu tio mora em Salvador.',
          en: 'My grandmother lives here. And my uncle lives in Salvador.',
        },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: 'Ask Lucas whether his grandfather lives here as well',
          target: 'E o seu avô mora aqui?',
          en: 'And does your grandfather live here?',
          distractors: ['O meu tio mora em Salvador.', 'Quantos anos você tem?', 'Quem é ela?'],
          hints: ['avô', 'mora', 'aqui', 'seu'],
          accept: [
            'O seu avô mora aqui?',
            'Seu avô mora aqui?',
            'O avô mora aqui?',
            'E o seu avô mora aqui também?',
            'O seu avô mora aqui também?',
            'O seu avô também mora aqui?',
            'Lucas, o seu avô mora aqui?',
          ],
        },
        { role: 'npc', speaker: 'Lucas', target: 'Mora, sim!', en: 'Yes, he does!' },
      ],
    },
  ],

  // ── Lesson 11: Falando de mim ──────────────────────────────────────────────
  'd4000000-0001-4000-8000-000000000033': [
    {
      label: 'Where you live',
      turns: [
        { role: 'npc', speaker: 'Vó Neide', target: 'Onde você mora, meu filho?', en: 'Where do you live, my dear?' },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Tell Vó Neide you live in Bali',
          target: 'Eu moro em Bali.',
          en: 'I live in Bali.',
          distractors: ['O meu tio mora em Salvador.', 'Eu sou de Londres.', 'Tenho quarenta anos.'],
          hints: ['Bali', 'moro', 'em'],
          accept: ['Moro em Bali.', 'Eu moro em Bali, Vó Neide.', 'Moro em Bali, Vó Neide.'],
        },
        { role: 'npc', speaker: 'Vó Neide', target: 'Bali! Que longe!', en: 'Bali! How far!' },
      ],
    },
    {
      label: 'Your work',
      turns: [
        { role: 'npc', speaker: 'Vó Neide', target: 'E com o que você trabalha?', en: 'And what do you do for work?' },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Say you're a yoga teacher",
          target: 'Sou professor de ioga.',
          en: 'I am a yoga teacher.',
          distractors: ['Sou o namorado da Dani.', 'Eu moro em Bali.', 'Falo um pouco de português.'],
          hints: ['ioga', 'Sou', 'professor'],
          accept: [
            'Eu sou professor de ioga.',
            'Trabalho com ioga.',
            'Eu trabalho com ioga.',
            'Sou professor de ioga e trabalho com computador.',
            'Sou professor de ioga, Vó Neide.',
          ],
        },
      ],
    },
    {
      label: 'Your Portuguese',
      turns: [
        {
          role: 'npc', speaker: 'Vó Neide',
          target: 'Que bom! E você fala português muito bem!',
          en: 'How nice! And you speak Portuguese very well!',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Reply modestly: you speak only a little Portuguese and you're still learning",
          target: 'Falo um pouco. Estou aprendendo.',
          en: "I speak a little. I'm learning.",
          distractors: ['Eu moro em Bali.', 'Sou professor de ioga.', 'Eu falo inglês.'],
          hints: ['aprendendo', 'Falo', 'pouco', 'Estou'],
          accept: [
            'Eu falo um pouco. Estou aprendendo.',
            'Falo um pouco de português. Estou aprendendo.',
            'Eu falo um pouco de português. Estou aprendendo.',
            'Obrigado! Falo um pouco. Estou aprendendo.',
            'Um pouco. Estou aprendendo.',
            'Estou aprendendo. Falo um pouco.',
            'Falo um pouco. Eu estou aprendendo.',
          ],
        },
      ],
    },
    {
      label: 'Slow down',
      turns: [
        {
          role: 'npc', speaker: 'Vó Neide',
          target: 'Na nossa família todo mundo fala rápido! Você entende?',
          en: 'In our family everyone talks fast! Do you understand?',
        },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: 'Ask Vó Neide to slow down, please',
          target: 'Mais devagar, por favor.',
          en: 'Slower, please.',
          distractors: ['Desculpe, por favor.', 'Falo um pouco de português.', 'Eu falo inglês.'],
          hints: ['favor', 'Mais', 'devagar'],
          accept: [
            'Devagar, por favor.',
            'Um pouco mais devagar, por favor.',
            'Por favor, mais devagar.',
            'Mais devagar, por favor, Vó Neide.',
            'Entendo um pouco. Mais devagar, por favor.',
            'Eu entendo um pouco. Mais devagar, por favor.',
          ],
        },
        { role: 'npc', speaker: 'Vó Neide', target: 'Claro! Devagar, devagar.', en: 'Of course! Slowly, slowly.' },
      ],
    },
    {
      label: 'I understand',
      turns: [
        {
          role: 'npc', speaker: 'Vó Neide',
          target: 'Você entende quando eu falo devagar?',
          en: 'Do you understand when I speak slowly?',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Say yes, you understand, and that you love Brazil',
          target: 'Entendo, sim! Eu adoro o Brasil!',
          en: 'Yes, I understand! I love Brazil!',
          distractors: ['Mais devagar, por favor.', 'Eu falo inglês.', 'Estou cansado da viagem.'],
          hints: ['Brasil', 'adoro', 'Entendo', 'sim'],
          accept: [
            'Sim, entendo! Eu adoro o Brasil!',
            'Entendo, sim! Adoro o Brasil!',
            'Sim, eu entendo! Adoro o Brasil!',
            'Eu entendo, sim! Eu adoro o Brasil!',
            'Entendo! Eu adoro o Brasil!',
            'Sim, entendo! Adoro o Brasil!',
            'Entendo um pouco, sim! Eu adoro o Brasil!',
          ],
        },
      ],
    },
  ],

  // ── Lesson 12: Churrasco de domingo ────────────────────────────────────────
  'd4000000-0001-4000-8000-000000000034': [
    {
      label: 'More meat?',
      turns: [
        { role: 'npc', speaker: 'Seu Roberto', target: 'Você quer mais carne?', en: 'Do you want more meat?' },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Say yes, you'd like more meat, please",
          target: 'Quero, sim! Mais carne, por favor.',
          en: 'Yes, I do! More meat, please.',
          distractors: ['Estou satisfeito, obrigado.', 'Estou cansado da viagem.', 'Onde fica a praia?'],
          hints: ['carne', 'Quero', 'Mais'],
          accept: [
            'Quero, sim! Quero mais carne, por favor.',
            'Sim, quero! Mais carne, por favor.',
            'Quero mais carne, por favor.',
            'Quero, sim! Mais carne, obrigado!',
            'Quero, sim! Quero mais, por favor.',
            'Quero mais, por favor.',
          ],
        },
      ],
    },
    {
      label: 'Pass the beans',
      turns: [
        {
          role: 'npc', speaker: 'Seu Roberto',
          target: 'Tem arroz, feijão e suco. Fique à vontade!',
          en: "There's rice, beans and juice. Make yourself at home!",
        },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: 'Ask Seu Roberto, politely, to pass you the beans',
          target: 'Me passa o feijão, por favor?',
          en: 'Can you pass me the beans, please?',
          distractors: ['Pode me passar a cerveja também?', 'Quero mais, por favor.', 'Está muito gostoso!'],
          hints: ['feijão', 'passa', 'favor'],
          accept: [
            'Pode me passar o feijão, por favor?',
            'Pode me passar o feijão?',
            'Me passa o feijão?',
            'Você pode me passar o feijão, por favor?',
            'Pode passar o feijão, por favor?',
            'Você pode me passar o feijão?',
          ],
        },
      ],
    },
    {
      label: 'Compliment',
      turns: [
        { role: 'npc', speaker: 'Seu Roberto', target: 'E a carne? Está boa?', en: 'And the meat? Is it good?' },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Tell Seu Roberto the meat is really tasty',
          target: 'A carne está muito gostosa!',
          en: 'The meat is very tasty!',
          distractors: ['O pão é delicioso!', 'Estou satisfeito, obrigado.', 'Quero mais, por favor.'],
          hints: ['gostosa', 'carne', 'muito', 'Está'],
          accept: [
            'Está muito gostosa!',
            'Está muito gostoso!',
            'A carne está gostosa!',
            'A carne está deliciosa!',
            'Está delicioso!',
            'Está muito bom!',
            'A carne está muito boa!',
            'A carne está muito gostosa, Seu Roberto!',
          ],
        },
        { role: 'npc', speaker: 'Seu Roberto', target: 'Que bom! Obrigado!', en: 'Great! Thank you!' },
      ],
    },
    {
      label: 'Toast and beer',
      turns: [
        {
          role: 'npc', speaker: 'Dani',
          target: 'O churrasco do meu pai é o melhor. Saúde!',
          en: "My dad's barbecue is the best. Cheers!",
        },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: 'Join the toast, then ask them to pass you a beer too',
          target: 'Saúde! Pode me passar a cerveja também?',
          en: 'Cheers! Can you pass me the beer too?',
          distractors: ['Me passa o feijão, por favor?', 'A comida está deliciosa!', 'Estou satisfeito, obrigado.'],
          hints: ['cerveja', 'Saúde', 'passar', 'Pode'],
          accept: [
            'Saúde! Pode me passar a cerveja?',
            'Saúde! Me passa a cerveja também?',
            'Saúde! Me passa a cerveja, por favor?',
            'Saúde! Pode me passar a cerveja, por favor?',
            'Saúde! Você pode me passar a cerveja também?',
            'Saúde! Me passa a cerveja?',
          ],
        },
        { role: 'npc', speaker: 'Dani', target: 'Claro! Aqui está.', en: 'Of course! Here you go.' },
      ],
    },
    {
      label: "I'm full",
      turns: [
        {
          role: 'npc', speaker: 'Dona Márcia',
          target: 'Agora a sobremesa! Você quer mais um pouco?',
          en: 'Now dessert! Do you want a little more?',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Politely turn down more dessert: you're full and everything was delicious",
          target: 'Obrigado, mas estou satisfeito. Está tudo delicioso!',
          en: 'Thank you, but I am full. Everything is delicious!',
          distractors: ['Quero mais, por favor.', 'Estou cansado da viagem.', 'Pode me passar a cerveja também?'],
          hints: ['satisfeito', 'delicioso', 'mas', 'Obrigado'],
          accept: [
            'Estou satisfeito, obrigado. Está tudo delicioso!',
            'Obrigado, mas estou satisfeito. Tudo delicioso!',
            'Não, obrigado. Estou satisfeito. Está tudo delicioso!',
            'Estou satisfeito, obrigado. Tudo delicioso!',
          ],
        },
      ],
    },
  ],

  // ── Lesson 17: Apresentando a minha mãe ────────────────────────────────────
  'd4000000-0001-4000-8000-000000000051': [
    {
      label: 'Meet my mother',
      turns: [
        {
          role: 'npc', speaker: 'Dona Márcia',
          target: 'Bem-vindos! E quem é esta senhora?',
          en: 'Welcome, both of you! And who is this lady?',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Introduce your mother to Dona Márcia and say she doesn't speak Portuguese",
          target: 'Esta é a minha mãe. Ela não fala português.',
          en: "This is my mother. She doesn't speak Portuguese.",
          distractors: ['Este é o meu irmão.', 'Prazer em conhecer a senhora.', 'Ela está bem, obrigado.'],
          hints: ['português', 'fala', 'mãe', 'não'],
          accept: [
            'Dona Márcia, esta é a minha mãe. Ela não fala português.',
            'Esta é a minha mãe, Dona Márcia. Ela não fala português.',
            'Esta é a minha mãe. Ela não fala português, Dona Márcia.',
            'Esta é a minha mãe. Desculpe, ela não fala português.',
            'Esta é a minha mãe. Ela não fala português, desculpe.',
          ],
        },
      ],
    },
    {
      label: "She's well",
      turns: [
        {
          role: 'npc', speaker: 'Dona Márcia',
          target: 'Muito prazer, senhora! A senhora está bem?',
          en: 'Very nice to meet you, madam! Are you well?',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Answer for your mother: she's well, thank you, and she understands a little",
          target: 'Ela está bem, obrigado. Ela entende um pouco.',
          en: 'She is well, thank you. She understands a little.',
          distractors: ['Esta é a minha mãe.', 'Ela não fala português.', 'Muito prazer, senhora!'],
          hints: ['entende', 'bem', 'pouco', 'obrigado'],
          accept: [
            'Ela está bem, obrigado. Entende um pouco.',
            'Ela está bem, obrigado. Ela entende um pouco de português.',
            'Ela está muito bem, obrigado. Ela entende um pouco.',
            'Obrigado, ela está bem. Ela entende um pouco.',
            'Obrigado, ela está bem. Entende um pouco.',
            'Está bem, obrigado. Ela entende um pouco.',
          ],
        },
      ],
    },
    {
      label: 'Say again',
      turns: [
        {
          role: 'npc', speaker: 'Dona Márcia',
          target: 'Que simpática! Vamos entrar, o café está pronto!',
          en: "How lovely! Let's go in, the coffee is ready!",
        },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: 'Politely ask Dona Márcia to say that again',
          target: 'Repete de novo, por favor?',
          en: 'Can you say that again, please?',
          distractors: ['Ela não fala português.', 'Você recomenda um lugar?', 'Que horas chega?'],
          hints: ['favor', 'Repete', 'novo'],
          accept: [
            'Repete de novo, devagar, por favor?',
            'Repete de novo, devagar?',
            'Pode repetir, por favor?',
            'Repete, por favor?',
            'Repete devagar, por favor?',
            'Dona Márcia, repete de novo, por favor?',
          ],
        },
        { role: 'npc', speaker: 'Dona Márcia', target: 'Claro! Devagar.', en: 'Of course! Slowly.' },
      ],
    },
    {
      label: 'Meet Roberto',
      turns: [
        {
          role: 'npc', speaker: 'Seu Roberto',
          target: 'Prazer em conhecer a senhora. Eu sou o Roberto.',
          en: 'A pleasure to meet you, madam. I am Roberto.',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Tell your mother that this is Dani's father and that he will speak slowly",
          target: 'Mãe, ele é o pai da Dani. Ele fala devagar.',
          en: "Mum, he is Dani's father. He speaks slowly.",
          distractors: ['Esta é a minha mãe.', 'Ela entende um pouco.', 'Este é o meu irmão.'],
          hints: ['devagar', 'pai', 'Dani', 'fala'],
          accept: [
            'Mãe, este é o pai da Dani. Ele fala devagar.',
            'Mãe, ele é o pai da Dani. Ele fala devagar para você.',
            'Mãe, este é o pai da Dani. Ele fala devagar para você.',
            'Ele é o pai da Dani. Ele fala devagar.',
            'Este é o pai da Dani. Ele fala devagar para você.',
            'Mãe, ele é o Seu Roberto, o pai da Dani. Ele fala devagar.',
          ],
        },
        {
          role: 'npc', speaker: 'Mãe',
          target: 'Prazer, senhor! Estou muito feliz aqui. Obrigada!',
          en: 'Nice to meet you, sir! I am very happy here. Thank you!',
        },
      ],
    },
  ],

  // ── Lesson 18: Ceia de Natal ───────────────────────────────────────────────
  'd4000000-0001-4000-8000-000000000052': [
    {
      label: 'Merry Christmas',
      turns: [
        {
          role: 'npc', speaker: 'Vó Neide',
          target: 'Feliz Natal, meu filho! A ceia está pronta.',
          en: 'Merry Christmas, my son! The supper is ready.',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Return the Christmas greeting and say how lovely it is that everyone is together',
          target: 'Feliz Natal, Vó Neide! Todos juntos, que bonito!',
          en: 'Merry Christmas, Grandma Neide! Everyone together, how lovely!',
          distractors: ['A ceia está pronta.', 'Bem-vindo à nossa casa!', 'Tudo bem, obrigado!'],
          hints: ['Natal', 'juntos', 'bonito', 'Todos'],
          accept: [
            'Feliz Natal! Todos juntos, que bonito!',
            'Feliz Natal, Vó Neide! Que bonito, todos juntos!',
            'Feliz Natal, Vó Neide! Todos juntos, que lindo!',
            'Feliz Natal, Vó Neide! Que bonito!',
            'Feliz Natal! Que bonito!',
            'Feliz Natal, Vó Neide! Todos juntos!',
          ],
        },
      ],
    },
    {
      label: 'Midnight presents',
      turns: [
        {
          role: 'npc', speaker: 'Lucas',
          target: 'Tem peru e farofa. Vamos abrir o presente à meia-noite!',
          en: "There's turkey and farofa. We'll open the present at midnight!",
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Say how great that sounds and that you love Christmas in Brazil',
          target: 'Que bom! Eu adoro o Natal no Brasil!',
          en: 'Great! I love Christmas in Brazil!',
          distractors: ['Feliz Natal!', 'Todos juntos!', 'Estou satisfeito, obrigado.'],
          hints: ['Natal', 'Brasil', 'adoro', 'bom'],
          accept: [
            'Que bom! Adoro o Natal no Brasil!',
            'Que bom! Eu adoro Natal no Brasil!',
            'Que bom! Adoro Natal no Brasil!',
            'Que bom! Eu adoro o Natal aqui no Brasil!',
          ],
        },
      ],
    },
    {
      label: 'Sing together',
      turns: [
        {
          role: 'npc', speaker: 'Lucas',
          target: 'E agora, o que a gente faz até a meia-noite?',
          en: 'So what do we do until midnight?',
        },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: 'Suggest that everyone sing a song together',
          target: 'Vamos cantar uma música?',
          en: 'Shall we sing a song?',
          distractors: ['Vamos almoçar amanhã?', 'Onde fica a praia?', 'Vamos abrir o presente à meia-noite.'],
          hints: ['música', 'cantar', 'Vamos'],
          accept: [
            'Vamos cantar?',
            'Vamos cantar uma música de Natal?',
            'Vamos cantar uma música juntos?',
            'Vamos todos cantar uma música?',
            'Vamos cantar juntos?',
            'Vamos cantar todos juntos?',
            'Vamos cantar uma música todos juntos?',
          ],
        },
        {
          role: 'npc', speaker: 'Dani',
          target: 'Sim! Depois da ceia, a família canta uma música de Natal.',
          en: 'Yes! After the supper, the family sings a Christmas song.',
        },
      ],
    },
    {
      label: 'Thank you',
      turns: [
        {
          role: 'npc', speaker: 'Vó Neide',
          target: 'Vocês cantam com a gente? Vocês são da família agora!',
          en: "Will you sing with us? You're family now!",
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Say your mother wants to sing too, and thank the whole family for everything',
          target: 'Minha mãe quer cantar também. Obrigado por tudo, família!',
          en: 'My mum wants to sing too. Thank you for everything, family!',
          distractors: ['Esta é a minha mãe.', 'Vamos cantar uma música?', 'Feliz Natal!'],
          hints: ['cantar', 'família', 'mãe', 'Obrigado'],
          accept: [
            'A minha mãe quer cantar também. Obrigado por tudo!',
            'Minha mãe quer cantar também. Obrigado por tudo!',
            'A minha mãe também quer cantar. Obrigado por tudo!',
            'Minha mãe também quer cantar. Obrigado por tudo, família!',
            'Obrigado por tudo, família! A minha mãe quer cantar também.',
            'A minha mãe quer cantar também. Obrigado por tudo, família!',
          ],
        },
      ],
    },
  ],

  // ── Lesson 20: Carnaval e a despedida ──────────────────────────────────────
  'd4000000-0001-4000-8000-000000000054': [
    {
      label: 'Costume',
      turns: [
        {
          role: 'npc', speaker: 'Lucas',
          target: 'É Carnaval! Você tem fantasia?',
          en: "It's Carnival! Do you have a costume?",
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Tell Lucas you do have a costume, that you love samba, and what joy it is',
          target: 'Tenho, sim! Adoro samba. Que alegria!',
          en: 'Yes, I do! I love samba. What joy!',
          distractors: ['Vou sentir saudade.', 'Quero voltar ano que vem.', 'Tudo de bom para vocês!'],
          hints: ['samba', 'alegria', 'Tenho', 'Adoro'],
          accept: [
            'Tenho, sim! Eu adoro samba. Que alegria!',
            'Sim, tenho! Adoro samba. Que alegria!',
            'Tenho fantasia, sim! Adoro samba. Que alegria!',
            'Tenho, sim! Adoro o samba. Que alegria!',
          ],
        },
      ],
    },
    {
      label: 'What time?',
      turns: [
        {
          role: 'npc', speaker: 'Lucas',
          target: 'Ótimo! Hoje à noite vamos para o bloco!',
          en: "Great! Tonight we're off to the bloco!",
        },
        {
          role: 'learner', speaker: 'You', side: 'ask',
          goal_en: 'Ask Lucas what time the bloco leaves',
          target: 'Que horas sai o bloco?',
          en: 'What time does the bloco leave?',
          distractors: ['Que horas chega?', 'Quanto custa a água de coco?', 'Você tem fantasia?'],
          hints: ['bloco', 'horas', 'sai', 'Que'],
          accept: [
            'Que horas o bloco sai?',
            'Que horas começa o bloco?',
            'Que horas o bloco começa?',
            'A que horas sai o bloco?',
            'Lucas, que horas sai o bloco?',
            'Que horas sai o bloco, Lucas?',
          ],
        },
        { role: 'npc', speaker: 'Lucas', target: 'O bloco sai às dez!', en: 'The bloco leaves at ten!' },
      ],
    },
    {
      label: "I'll miss you",
      turns: [
        {
          role: 'npc', speaker: 'Dona Márcia',
          target: 'Amanhã vocês vão voltar para casa. Vou sentir saudade!',
          en: "Tomorrow you're going back home. I'm going to miss you!",
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: "Tell Dona Márcia you'll miss her too",
          target: 'Eu também vou sentir saudade!',
          en: "I'm going to miss you too!",
          distractors: ['Quero voltar ano que vem.', 'Adoro samba.', 'Tudo de bom para vocês!'],
          hints: ['saudade', 'sentir', 'também', 'vou'],
          accept: [
            'Vou sentir saudade também!',
            'Também vou sentir saudade!',
            'Eu também vou sentir saudade da senhora!',
            'Eu também vou sentir saudade de você!',
            'Vou sentir saudade da senhora também!',
            'Eu também vou sentir saudade, Dona Márcia!',
          ],
        },
      ],
    },
    {
      label: 'Come back',
      turns: [
        {
          role: 'npc', speaker: 'Dona Márcia',
          target: 'E você, meu filho, vai voltar para nos ver?',
          en: 'And you, my son, will you come back to see us?',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Tell her you want to come back next year',
          target: 'Quero voltar ano que vem!',
          en: 'I want to come back next year!',
          distractors: ['Vou sentir saudade.', 'Cuide-se!', 'Você tem fantasia?'],
          hints: ['voltar', 'ano', 'Quero'],
          accept: [
            'Eu quero voltar ano que vem!',
            'Quero, sim! Quero voltar ano que vem!',
            'Sim! Quero voltar ano que vem!',
            'Quero voltar no ano que vem!',
            'Eu quero voltar no ano que vem!',
            'Quero ficar mais e voltar ano que vem!',
          ],
        },
      ],
    },
    {
      label: 'Goodbye',
      turns: [
        {
          role: 'npc', speaker: 'Seu Roberto',
          target: 'Cuide-se, meu filho. Você é sempre bem-vindo aqui.',
          en: 'Take care, my son. You are always welcome here.',
        },
        {
          role: 'learner', speaker: 'You', side: 'answer',
          goal_en: 'Thank Seu Roberto for everything, wish the family all the best and say see you soon',
          target: 'Obrigado por tudo! Tudo de bom para vocês. Até logo!',
          en: 'Thank you for everything! All the best to you. See you soon!',
          distractors: ['Quero voltar ano que vem.', 'Vou sentir saudade.', 'Adoro samba.'],
          hints: ['vocês', 'logo', 'Obrigado', 'bom'],
          accept: [
            'Obrigado! Tudo de bom para vocês. Até logo!',
            'Obrigado por tudo! Tudo de bom! Até logo!',
          ],
        },
      ],
    },
  ],
};
