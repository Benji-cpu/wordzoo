// Hand-authored can-dos for the Portuguese stream, Unit 2 (scenes 21–24).
// Same contract as id.ts: prompt_en is a situation, never a translation, and
// must not contain the Portuguese answer; must_include ships empty on purpose.
//
// Seed with: npx tsx lib/db/seed-can-dos.ts --language=pt
import type { CanDoData } from './types';

export const PT_UNIT2_CAN_DOS: CanDoData[] = [
  // ── Scene 21: No café ──────────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000021',
    sceneId: 'd4000000-0001-4000-8000-000000000021',
    statement_en: 'I can order food and a drink politely.',
    prompt_en: 'You are at a café counter in the morning. Order bread and a coffee, politely.',
    reference_target: 'Eu gostaria de pão com café, por favor.',
    accept_notes: '"Quero um pão e um café, por favor" is more direct but perfectly normal.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000021',
    sceneId: 'd4000000-0001-4000-8000-000000000021',
    statement_en: 'I can say what I do not want.',
    prompt_en: 'The waiter offers you a beer with breakfast. Say you do not want beer, you want water.',
    reference_target: 'Não quero cerveja. Quero água, por favor.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000021',
    sceneId: 'd4000000-0001-4000-8000-000000000021',
    statement_en: 'I can compliment the food.',
    prompt_en: 'The bread you were served is excellent. Tell the waiter so.',
    reference_target: 'O pão é delicioso!',
    accept_notes: '"Está muito bom!" or "Está delicioso!" pass too.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 22: Na feira ─────────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000022',
    sceneId: 'd4000000-0001-4000-8000-000000000022',
    statement_en: 'I can ask how much something costs.',
    prompt_en: 'You are at a market stall holding a piece of fruit with no price on it. Ask the seller the price of one.',
    reference_target: 'Quanto custa um, por favor?',
    accept_notes: '"Quanto é?" is the everyday short form and passes.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000022',
    sceneId: 'd4000000-0001-4000-8000-000000000022',
    statement_en: 'I can say something is too expensive and ask for something cheaper.',
    prompt_en: 'The seller quotes a price that is far more than you expected. Say it is very expensive and ask if there is anything cheaper.',
    reference_target: 'É muito caro. Tem mais barato?',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000022',
    sceneId: 'd4000000-0001-4000-8000-000000000022',
    statement_en: 'I can say how many of something I want using the numbers two to five.',
    prompt_en: 'You have agreed a price. Tell the seller you want four, politely.',
    reference_target: 'Quero quatro, por favor.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 23: Pegando o ônibus ─────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000023',
    sceneId: 'd4000000-0001-4000-8000-000000000023',
    statement_en: 'I can say where I need to go and ask how to get there.',
    prompt_en: 'You are outside a station and need to reach the city centre. Tell a local that, and ask how to get there.',
    reference_target: 'Eu preciso ir para o centro. Como eu vou?',
    accept_notes: '"Como eu chego no centro?" is an equally common way to ask.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000023',
    sceneId: 'd4000000-0001-4000-8000-000000000023',
    statement_en: 'I can ask what time the bus comes.',
    prompt_en: 'You are standing at the bus stop and nothing has come for a while. Ask someone what time the bus passes.',
    reference_target: 'Que horas passa o ônibus?',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000023',
    sceneId: 'd4000000-0001-4000-8000-000000000023',
    statement_en: 'I can ask where the bus stop is.',
    prompt_en: 'You have been told to take the bus but cannot see a stop. Ask where the stop is.',
    reference_target: 'Onde fica o ponto de ônibus?',
    accept_notes: '"Onde é o ponto?" is fine.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 24: Um jantar entre amigos ───────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000024',
    sceneId: 'd4000000-0001-4000-8000-000000000024',
    statement_en: 'I can ask for the bill.',
    prompt_en: 'You have finished dinner in a restaurant and want to pay. Get the waiter\'s attention and ask for the bill.',
    reference_target: 'Garçom, a conta, por favor!',
    accept_notes: '"A conta, por favor" without addressing the waiter passes.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000024',
    sceneId: 'd4000000-0001-4000-8000-000000000024',
    statement_en: 'I can say that I like something a lot.',
    prompt_en: 'Your host asks whether you enjoyed the meal. Tell them you liked it a lot.',
    reference_target: 'Eu gosto muito!',
    accept_notes: '"Gostei muito!" (past) is what a Brazilian would most likely say after the meal and passes.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000024',
    sceneId: 'd4000000-0001-4000-8000-000000000024',
    statement_en: 'I can suggest meeting for lunch tomorrow.',
    prompt_en: 'You had a great evening with a new friend and want to see them again. Suggest having lunch tomorrow.',
    reference_target: 'Vamos almoçar amanhã?',
    must_include: [],
    sort_order: 2,
  },
];
