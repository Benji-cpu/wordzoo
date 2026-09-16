// Hand-authored can-dos for the Portuguese stream, Unit 3 (scenes 31–34).
// Same contract as id.ts: prompt_en is a situation, never a translation, and
// must not contain the Portuguese answer; must_include ships empty on purpose.
//
// Seed with: npx tsx lib/db/seed-can-dos.ts --language=pt
import type { CanDoData } from './types';

export const PT_UNIT3_CAN_DOS: CanDoData[] = [
  // ── Scene 31: Chegando na casa da família ──────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000031',
    sceneId: 'd4000000-0001-4000-8000-000000000031',
    statement_en: 'I can greet someone warmly at their front door and ask how they are.',
    prompt_en: "You have just arrived at your partner's parents' house for the first time. Her mother opens the door. Greet her warmly and ask how she is.",
    reference_target: 'Oi, tudo bem?',
    accept_notes: '"Olá, tudo bem?" or "Boa tarde, tudo bem?" pass equally. A hug/kiss mention is a bonus, not required.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000031',
    sceneId: 'd4000000-0001-4000-8000-000000000031',
    statement_en: 'I can say that I am tired from travelling.',
    prompt_en: 'You have been on a plane and a bus for nearly a day. Someone asks how the journey was. Say you are tired from the trip.',
    reference_target: 'Estou cansado da viagem.',
    accept_notes: '"Estou cansada" if the learner is speaking as a woman. "Estou muito cansado" also passes.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000031',
    sceneId: 'd4000000-0001-4000-8000-000000000031',
    statement_en: 'I can welcome someone into a home.',
    prompt_en: 'You are now the one holding the door open as a friend arrives at the house where you are staying. Welcome them in.',
    reference_target: 'Bem-vindo à nossa casa!',
    accept_notes: '"Bem-vinda" for a woman; "Bem-vindo!" alone is enough.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 32: Quem é quem ──────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000032',
    sceneId: 'd4000000-0001-4000-8000-000000000032',
    statement_en: 'I can ask who someone is.',
    prompt_en: 'The living room is full of relatives you have never met. A woman across the room waves at you. Quietly ask your partner who she is.',
    reference_target: 'Quem é ela?',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000032',
    sceneId: 'd4000000-0001-4000-8000-000000000032',
    statement_en: 'I can introduce a member of my family.',
    prompt_en: 'You are showing a family photo to someone new. Point out your brother and tell them who he is.',
    reference_target: 'Este é o meu irmão.',
    accept_notes: '"Esse é o meu irmão" is just as natural in Brazil.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000032',
    sceneId: 'd4000000-0001-4000-8000-000000000032',
    statement_en: "I can say how I am connected to my partner's family.",
    prompt_en: "An older relative has not worked out who you are yet and asks. Explain that you are Dani's boyfriend.",
    reference_target: 'Sou o namorado da Dani.',
    accept_notes: '"Eu sou o namorado da Dani" in full is equally correct.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 33: Falando de mim ───────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000033',
    sceneId: 'd4000000-0001-4000-8000-000000000033',
    statement_en: 'I can say where I live and what I do for work.',
    prompt_en: "Your partner's grandmother wants to know about your life. Tell her where you live and what your job is.",
    reference_target: 'Eu moro em Bali. Sou professor de ioga.',
    accept_notes: 'Any real place and job pass — the test is the two sentence frames, not the facts.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000033',
    sceneId: 'd4000000-0001-4000-8000-000000000033',
    statement_en: 'I can explain that my Portuguese is limited but improving.',
    prompt_en: 'Someone compliments your Portuguese and then speaks much faster. Explain that you only speak a little and that you are still learning.',
    reference_target: 'Falo um pouco de português. Estou aprendendo.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000033',
    sceneId: 'd4000000-0001-4000-8000-000000000033',
    statement_en: 'I can ask someone to speak more slowly.',
    prompt_en: 'A relative is telling you a long story and you have lost the thread completely. Politely ask them to slow down.',
    reference_target: 'Mais devagar, por favor.',
    accept_notes: '"Pode falar mais devagar, por favor?" is a fuller, equally good answer.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 34: Churrasco de domingo ─────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000034',
    sceneId: 'd4000000-0001-4000-8000-000000000034',
    statement_en: 'I can ask someone at the table to pass me something.',
    prompt_en: 'You are at a crowded Sunday lunch and the beans are at the far end of the table. Ask the person next to you to pass them.',
    reference_target: 'Me passa o feijão, por favor?',
    accept_notes: '"Pode me passar o feijão, por favor?" is the fuller polite form.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000034',
    sceneId: 'd4000000-0001-4000-8000-000000000034',
    statement_en: 'I can compliment the cooking and ask for more.',
    prompt_en: 'The meat off the grill is the best thing you have eaten all trip. Tell the cook so, and ask for a bit more.',
    reference_target: 'Está muito gostoso! Quero mais, por favor.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000034',
    sceneId: 'd4000000-0001-4000-8000-000000000034',
    statement_en: 'I can refuse more food politely because I am full.',
    prompt_en: 'You are being offered a fourth helping and you genuinely cannot eat any more. Turn it down warmly, without causing offence.',
    reference_target: 'Estou satisfeito, obrigado!',
    accept_notes: '"Estou satisfeita, obrigada" for a woman. Saying only "Não, obrigado" is thinner but acceptable.',
    must_include: [],
    sort_order: 2,
  },
];
