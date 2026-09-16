// Hand-authored can-dos for the Portuguese stream, Unit 4 (scenes 41–44).
// Same contract as id.ts: prompt_en is a situation, never a translation, and
// must not contain the Portuguese answer; must_include ships empty on purpose.
//
// Seed with: npx tsx lib/db/seed-can-dos.ts --language=pt
import type { CanDoData } from './types';

export const PT_UNIT4_CAN_DOS: CanDoData[] = [
  // ── Scene 41: Na rodoviária ────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000041',
    sceneId: 'd4000000-0001-4000-8000-000000000041',
    statement_en: 'I can buy a return ticket at a counter.',
    prompt_en: 'You are at the bus station counter. You are going to the coast and coming back on Sunday. Ask for the ticket you need.',
    reference_target: 'Uma passagem de ida e volta, por favor.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000041',
    sceneId: 'd4000000-0001-4000-8000-000000000041',
    statement_en: 'I can ask when the next departure is and when it arrives.',
    prompt_en: 'You have missed the bus you planned to take. Ask the clerk when the next one leaves and what time it gets there.',
    reference_target: 'Que horas sai o próximo ônibus? Que horas chega?',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000041',
    sceneId: 'd4000000-0001-4000-8000-000000000041',
    statement_en: 'I can ask which gate to go to and whether the bus is late.',
    prompt_en: 'The departure board is not showing your service and boarding time is close. Ask a member of staff which gate it is and whether it is running late.',
    reference_target: 'Qual é o portão? O ônibus está atrasado?',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 42: Na pousada ───────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000042',
    sceneId: 'd4000000-0001-4000-8000-000000000042',
    statement_en: 'I can ask what a room rate includes.',
    prompt_en: 'You are checking in to a small guesthouse and want to know whether you need to find somewhere to eat in the morning. Ask the owner.',
    reference_target: 'O café da manhã está incluído?',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000042',
    sceneId: 'd4000000-0001-4000-8000-000000000042',
    statement_en: 'I can ask for the wifi password and check the room has what I need.',
    prompt_en: 'You are shown to your room. You need to get online, and in this heat you want to know about the air conditioning. Ask about both.',
    reference_target: 'Qual é a senha da internet? O quarto tem ar-condicionado?',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000042',
    sceneId: 'd4000000-0001-4000-8000-000000000042',
    statement_en: 'I can report that something in the room is not working and ask for what is missing.',
    prompt_en: 'There is no towel in your room and the shower will not run. Go to reception and explain both problems.',
    reference_target: 'O chuveiro não funciona. Preciso de uma toalha.',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 43: Dia de praia ─────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000043',
    sceneId: 'd4000000-0001-4000-8000-000000000043',
    statement_en: 'I can hire a chair and an umbrella on the beach.',
    prompt_en: 'You arrive at a busy beach with your mother and there is nowhere shaded to sit. A vendor comes over. Ask him for what you need.',
    reference_target: 'Uma cadeira e um guarda-sol, por favor.',
    accept_notes: 'Asking for two chairs ("Duas cadeiras...") is equally correct.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000043',
    sceneId: 'd4000000-0001-4000-8000-000000000043',
    statement_en: 'I can remark on the weather and ask the price of a drink.',
    prompt_en: 'It is baking hot and a vendor walks past with a cooler of coconuts. Say something about the heat and ask what one costs.',
    reference_target: 'Hoje está muito calor. Quanto custa a água de coco?',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000043',
    sceneId: 'd4000000-0001-4000-8000-000000000043',
    statement_en: 'I can suggest going in the water and say how lovely it looks.',
    prompt_en: 'Your partner is lying in the shade and the sea is flat and clear. Say how beautiful it looks and suggest the two of you swim.',
    reference_target: 'O mar está lindo! Vamos nadar?',
    must_include: [],
    sort_order: 2,
  },

  // ── Scene 44: Pedindo dicas ────────────────────────────────────────────
  {
    id: 'c4000000-0000-4000-8000-000000000044',
    sceneId: 'd4000000-0001-4000-8000-000000000044',
    statement_en: 'I can ask a local for a recommendation.',
    prompt_en: 'You have an afternoon free in a city you do not know and your driver seems friendly. Ask him to recommend somewhere to go.',
    reference_target: 'Você recomenda um lugar?',
    accept_notes: '"O que você recomenda?" passes too.',
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c4000000-0001-4000-8000-000000000044',
    sceneId: 'd4000000-0001-4000-8000-000000000044',
    statement_en: 'I can ask whether an area is safe.',
    prompt_en: 'You are thinking of walking back to the guesthouse after dark and want a local opinion first. Ask whether the city is safe.',
    reference_target: 'A cidade é segura?',
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c4000000-0002-4000-8000-000000000044',
    sceneId: 'd4000000-0001-4000-8000-000000000044',
    statement_en: 'I can say I am lost, ask for help, and find a pharmacy.',
    prompt_en: 'You have taken a wrong turn, your mother has a bad headache, and you need somewhere to buy painkillers. Stop someone in the street and explain.',
    reference_target: 'Estou perdido. Pode me ajudar? Onde tem uma farmácia?',
    accept_notes: '"Estou perdida" for a woman. "Onde fica uma farmácia?" is equally natural.',
    must_include: [],
    sort_order: 2,
  },
];
