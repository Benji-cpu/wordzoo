// Hand-authored can-dos for the Portuguese stream, Unit 1 (scenes 11–14).
// Same contract as id.ts: prompt_en is a situation, never a translation, and
// must not contain the Portuguese answer; must_include ships empty on purpose.
//
// Seed with: npx tsx lib/db/seed-can-dos.ts --language=pt
import type { CanDoData } from './types';

export const PT_UNIT1_CAN_DOS: CanDoData[] = [
  // ── Scene 11: No aeroporto ─────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000011',
    sceneId: 'd4000000-0001-4000-8000-000000000011',
    statement_en: 'I can greet someone in the morning.',
    prompt_en: 'You have just landed and a host smiles at you at the arrivals gate. It is 9am. Greet them.',
    reference_target: 'Bom dia!',
    accept_notes: '"Oi, bom dia!" and "Olá, bom dia!" are equally natural.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000011',
    sceneId: 'd4000000-0001-4000-8000-000000000011',
    statement_en: 'I can say who I am and that I am pleased to meet someone.',
    prompt_en: 'A host has just told you their name. Tell them yours is Ben and that you are pleased to meet them.',
    reference_target: 'Eu sou o Ben. Muito prazer!',
    accept_notes: '"Sou o Ben, prazer." is fine; the article before the name is optional.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000011',
    sceneId: 'd4000000-0001-4000-8000-000000000011',
    statement_en: 'I can ask someone their name politely.',
    prompt_en: 'Someone has introduced themselves too quickly and you missed it. Politely ask what their name is.',
    reference_target: 'Qual é o seu nome, por favor?',
    accept_notes: '"Como você se chama?" is also correct and common.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 12: Check-in no hotel ────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000012',
    sceneId: 'd4000000-0001-4000-8000-000000000012',
    statement_en: 'I can tell reception that I have a reservation.',
    prompt_en: 'You walk up to the hotel front desk in the afternoon. Greet the receptionist and say you have a booking.',
    reference_target: 'Boa tarde! Eu tenho uma reserva.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000012',
    sceneId: 'd4000000-0001-4000-8000-000000000012',
    statement_en: 'I can ask for a room for a given number of nights.',
    prompt_en: 'There is no booking under your name. Say you want a room for one night.',
    reference_target: 'Quero um quarto para uma noite, por favor.',
    accept_notes: '"Eu gostaria de um quarto para uma noite" is the more polite version and also passes.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000012',
    sceneId: 'd4000000-0001-4000-8000-000000000012',
    statement_en: 'I can thank someone and wish them a good night.',
    prompt_en: 'The receptionist hands you your key. It is late evening. Thank them and say good night. You are a man.',
    reference_target: 'Obrigado! Boa noite!',
    accept_notes: 'The learner is a man, so "obrigado"; "obrigada" is the form a woman uses.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 13: Conhecendo os vizinhos ───────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000013',
    sceneId: 'd4000000-0001-4000-8000-000000000013',
    statement_en: 'I can ask someone where they are from.',
    prompt_en: 'You are chatting with a new neighbour and want to know their home town or country. Ask.',
    reference_target: 'De onde você é?',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000013',
    sceneId: 'd4000000-0001-4000-8000-000000000013',
    statement_en: 'I can say where I am from.',
    prompt_en: 'Someone asks where you come from. Tell them you are from London.',
    reference_target: 'Eu sou de Londres.',
    accept_notes: '"Sou de Londres" without the pronoun is just as natural.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000013',
    sceneId: 'd4000000-0001-4000-8000-000000000013',
    statement_en: 'I can introduce a friend to someone.',
    prompt_en: 'Your friend Ana is standing next to you and your neighbour has not met her. Introduce her as your friend.',
    reference_target: 'Esta é a Ana, minha amiga.',
    accept_notes: '"Essa é a Ana, minha amiga" is what most Brazilians actually say and passes.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 14: Primeiro passeio ─────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000014',
    sceneId: 'd4000000-0001-4000-8000-000000000014',
    statement_en: 'I can stop a stranger politely and ask where the beach is.',
    prompt_en: 'You are on a street in a new town and want to find the beach. Stop a passer-by politely and ask.',
    reference_target: 'Desculpe, onde fica a praia?',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000014',
    sceneId: 'd4000000-0001-4000-8000-000000000014',
    statement_en: 'I can ask whether a place is near or far.',
    prompt_en: 'Someone has pointed down the road. Check whether it is close or a long way off.',
    reference_target: 'Fica perto ou longe?',
    accept_notes: '"É perto?" or "É longe daqui?" on its own is acceptable.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000014',
    sceneId: 'd4000000-0001-4000-8000-000000000014',
    statement_en: 'I can understand and confirm a direction such as left or right.',
    prompt_en: 'You were told to turn one way but are not sure you heard it. Ask whether it is to the left or to the right.',
    reference_target: 'À esquerda ou à direita?',
    accept_notes: '"É à esquerda?" alone is a fair confirmation.',
    must_include: [],
    sort_order: 2,
  },
];
