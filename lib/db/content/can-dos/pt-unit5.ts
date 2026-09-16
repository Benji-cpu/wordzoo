// Hand-authored can-dos for the Portuguese stream, Unit 5 (scenes 51–54).
// Same contract as id.ts: prompt_en is a situation, never a translation, and
// must not contain the Portuguese answer; must_include ships empty on purpose.
//
// Seed with: npx tsx lib/db/seed-can-dos.ts --language=pt
import type { CanDoData } from './types';

export const PT_UNIT5_CAN_DOS: CanDoData[] = [
  // ── Scene 51: Apresentando a minha mãe ─────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000051',
    sceneId: 'd4000000-0001-4000-8000-000000000051',
    statement_en: 'I can introduce my mother and explain she does not speak the language.',
    prompt_en: "You have brought your mother to your partner's family home. Introduce her to the room, and explain that she does not speak Portuguese but follows a little.",
    reference_target: 'Esta é a minha mãe. Ela não fala português, mas entende um pouco.',
    accept_notes: 'Two separate sentences pass. "Essa é a minha mãe" is equally natural in Brazil.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000051',
    sceneId: 'd4000000-0001-4000-8000-000000000051',
    statement_en: 'I can greet an older person respectfully.',
    prompt_en: "You are introduced to your partner's grandmother, who is in her eighties. Tell her it is a pleasure to meet her, using the respectful form.",
    reference_target: 'Prazer em conhecer a senhora.',
    accept_notes: '"Muito prazer, senhora" passes. Using "você" here is understandable but misses the point of the test.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000051',
    sceneId: 'd4000000-0001-4000-8000-000000000051',
    statement_en: 'I can ask someone to say something again.',
    prompt_en: 'Someone has just told you their name across a noisy room and you did not catch it. Ask them to say it again.',
    reference_target: 'Repete de novo, por favor?',
    accept_notes: '"Pode repetir, por favor?" is the fuller polite form and passes.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 52: Ceia de Natal ────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000052',
    sceneId: 'd4000000-0001-4000-8000-000000000052',
    statement_en: 'I can wish a family a happy Christmas.',
    prompt_en: 'It is Christmas Eve and the whole family is sitting down to supper together. Raise your glass and wish them all a happy Christmas.',
    reference_target: 'Feliz Natal para todos!',
    accept_notes: '"Feliz Natal!" alone passes.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000052',
    sceneId: 'd4000000-0001-4000-8000-000000000052',
    statement_en: 'I can propose when to open the presents.',
    prompt_en: 'The children want the gifts opened straight after dinner, but the family tradition is to wait until twelve. Suggest holding off until then.',
    reference_target: 'Vamos abrir o presente à meia-noite.',
    accept_notes: '"Vamos abrir os presentes à meia-noite" (plural) is equally good.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000052',
    sceneId: 'd4000000-0001-4000-8000-000000000052',
    statement_en: 'I can gather everyone and suggest a song.',
    prompt_en: 'Dinner is over, someone has picked up a guitar, and people are drifting into different rooms. Call everyone back together and suggest a song.',
    reference_target: 'Todos juntos! Vamos cantar uma música?',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 53: Réveillon na praia ───────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000053',
    sceneId: 'd4000000-0001-4000-8000-000000000053',
    statement_en: 'I can wish someone a happy New Year and propose a toast.',
    prompt_en: 'The fireworks have just gone off over the beach and everyone around you is hugging. Wish them a happy new year and call for a toast.',
    reference_target: 'Feliz ano novo! Vamos brindar!',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000053',
    sceneId: 'd4000000-0001-4000-8000-000000000053',
    statement_en: 'I can ask what time an event starts.',
    prompt_en: 'You are told there is a party on the beach tonight but not when. Ask what time it starts.',
    reference_target: 'Que horas começa a festa?',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000053',
    sceneId: 'd4000000-0001-4000-8000-000000000053',
    statement_en: 'I can explain a local New Year tradition to someone.',
    prompt_en: 'Your mother wants to know why everyone on the beach is dressed in white and jumping over the waves. Explain both customs to her in Portuguese so your partner can hear you got it right.',
    reference_target: 'Todo mundo veste branco. Pular sete ondas dá sorte.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 54: Carnaval e a despedida ───────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000054',
    sceneId: 'd4000000-0001-4000-8000-000000000054',
    statement_en: 'I can ask about Carnival plans.',
    prompt_en: "Your partner's brother is taking you to a street party this afternoon and everyone else is already dressed up. Ask him whether he has a costume.",
    reference_target: 'Você tem fantasia?',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000054',
    sceneId: 'd4000000-0001-4000-8000-000000000054',
    statement_en: 'I can tell people I will miss them and that I want to return.',
    prompt_en: 'You are at the door on your last evening with the whole family seeing you off. Tell them you will miss them and that you want to come back next year.',
    reference_target: 'Vou sentir saudade. Quero voltar ano que vem.',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000054',
    sceneId: 'd4000000-0001-4000-8000-000000000054',
    statement_en: 'I can say a warm goodbye to a group.',
    prompt_en: 'The taxi is waiting and there is time for one last thing. Say goodbye to the family, telling them to take care and wishing them well.',
    reference_target: 'Cuide-se! Tudo de bom para vocês!',
    accept_notes: '"Cuidem-se" (plural) is more precise for a group and passes.',
    must_include: [],
    sort_order: 2,
  },
];
