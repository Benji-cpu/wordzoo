// AI-drafted by lib/db/generate-can-dos.ts. HAND-EDIT THIS FILE.
//
// The generator will not overwrite it without --force, because this editing
// pass is the point: the model is good at proposing communicative acts and
// unreliable at must_include and at keeping the answer out of prompt_en.
//
// Checklist when editing:
//   - prompt_en must not contain the target-language answer or any of its words
//   - must_include ships EMPTY on purpose. The model over-populates it, and a
//     wrong lemma rejects a valid answer before the grader ever runs, with no
//     appeal. The model's suggestion is left in a comment above each entry —
//     opt in deliberately, don't accept it wholesale.
//   - reference_target should use only vocabulary taught in that scene
//
// Seed with: npx tsx lib/db/seed-can-dos.ts --language=id
import type { CanDoData } from './types';

export const ID_CAN_DOS: CanDoData[] = [
  {
    id: 'c1000000-0000-4000-8000-000000000004',
    sceneId: 'd1000000-0001-4000-8000-000000000004',
    statement_en: "I can greet someone in the morning.",
    prompt_en: "You see a local person at a cafe in the morning. Greet them.",
    reference_target: "Selamat pagi.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000004',
    sceneId: 'd1000000-0001-4000-8000-000000000004',
    statement_en: "I can ask someone how they are.",
    prompt_en: "You've just greeted someone. Now ask them about their condition.",
    reference_target: "Apa kabar?",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000004',
    sceneId: 'd1000000-0001-4000-8000-000000000004',
    statement_en: "I can introduce myself by stating my name.",
    prompt_en: "You are meeting a new person. Tell them your name is Budi.",
    reference_target: "Nama saya Budi.",
    accept_notes: "\"Saya Budi\" is also a common and acceptable way to introduce oneself.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000004',
    sceneId: 'd1000000-0001-4000-8000-000000000004',
    statement_en: "I can ask someone where they are from.",
    prompt_en: "You are chatting with a new acquaintance. Ask them about their place of origin.",
    reference_target: "Dari mana?",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000005',
    sceneId: 'd1000000-0001-4000-8000-000000000005',
    statement_en: "I can introduce a friend.",
    prompt_en: "You are with your friend. You want to introduce them to someone else. What do you say?",
    reference_target: "Ini teman saya.",
    accept_notes: "Also 'Ini teman saya [name]' where [name] is a person's name.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000005',
    sceneId: 'd1000000-0001-4000-8000-000000000005',
    statement_en: "I can say where someone is from.",
    prompt_en: "You are talking about your friend. You want to say that he is from a specific country. How do you say it?",
    reference_target: "Dia dari Amerika.",
    accept_notes: "Also 'Dia dari Indonesia' or other country names.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000005',
    sceneId: 'd1000000-0001-4000-8000-000000000005',
    statement_en: "I can say 'nice to meet you too' when introduced to someone.",
    prompt_en: "You have just been introduced to someone new, and they said 'Nice to meet you.' You want to respond in kind. What do you say?",
    reference_target: "Senang bertemu juga.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000011',
    sceneId: 'd1000000-0001-4000-8000-000000000011',
    statement_en: "I can ask where a place is.",
    prompt_en: "You are lost and need to find the airport. Ask someone for directions.",
    reference_target: "Permisi, di mana bandara?",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000011',
    sceneId: 'd1000000-0001-4000-8000-000000000011',
    statement_en: "I can state my desired destination.",
    prompt_en: "An immigration officer asks about your destination. Tell them you want to go to Ubud.",
    reference_target: "Saya mau ke Ubud.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000011',
    sceneId: 'd1000000-0001-4000-8000-000000000011',
    statement_en: "I can express that I have arrived at a place.",
    prompt_en: "You've just landed and are excited to be in Bali. Express your arrival.",
    reference_target: "Sampai di Bali!",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000011',
    sceneId: 'd1000000-0001-4000-8000-000000000011',
    statement_en: "I can politely accept an offer of help.",
    prompt_en: "Someone offers to help you with your bags. Accept their offer politely.",
    reference_target: "Ya, tolong.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000006',
    sceneId: 'd1000000-0001-4000-8000-000000000006',
    statement_en: "I can order a specific food item.",
    prompt_en: "You are at a food stall. The server asks what you want to order. You want the fried rice. What do you say?",
    reference_target: "Saya mau nasi goreng.",
    accept_notes: "A shorter form like 'Nasi goreng' is also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000006',
    sceneId: 'd1000000-0001-4000-8000-000000000006',
    statement_en: "I can specify a preference for my food order.",
    prompt_en: "You are at a food stall. You want the fried rice, but you don't want it spicy. Tell the server what you want.",
    reference_target: "Saya mau nasi goreng tidak pedas.",
    accept_notes: "A shorter form like 'Nasi goreng tidak pedas' is also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000006',
    sceneId: 'd1000000-0001-4000-8000-000000000006',
    statement_en: "I can order a specific drink item.",
    prompt_en: "You have finished ordering food. The server then asks what you want to drink. You want plain water. What do you say?",
    reference_target: "Saya mau air putih.",
    accept_notes: "A shorter form like 'Air putih' is also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000006',
    sceneId: 'd1000000-0001-4000-8000-000000000006',
    statement_en: "I can order both a food and a drink item.",
    prompt_en: "You are ordering at a food stall. You want fried rice and plain water. Tell the server your complete order.",
    reference_target: "Saya mau nasi goreng dan air putih.",
    accept_notes: "A shorter form like 'Nasi goreng dan air putih' is also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000031',
    sceneId: 'd1000000-0001-4000-8000-000000000031',
    statement_en: "I can ask for help with my bag.",
    prompt_en: "You have a very heavy bag and need help. Ask someone to help you with your bag.",
    reference_target: "Tolong tas saya.",
    accept_notes: "Tolong tas saya, ya. is also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000031',
    sceneId: 'd1000000-0001-4000-8000-000000000031',
    statement_en: "I can express that something is very heavy.",
    prompt_en: "You are trying to lift a suitcase and it is extremely heavy. Exclaim how heavy it is.",
    reference_target: "Berat sekali!",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000031',
    sceneId: 'd1000000-0001-4000-8000-000000000031',
    statement_en: "I can ask the price for one night's stay.",
    prompt_en: "You are checking into a hotel and want to know the cost for one night. Ask how much it is for a night.",
    reference_target: "Berapa satu malam?",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000012',
    sceneId: 'd1000000-0001-4000-8000-000000000012',
    statement_en: "I can ask if there is a room available.",
    prompt_en: "You arrive at a hotel. You need to ask if they have any rooms.",
    reference_target: "Ada kamar?",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000012',
    sceneId: 'd1000000-0001-4000-8000-000000000012',
    statement_en: "I can ask for a big room.",
    prompt_en: "You are checking into a hotel and want a large room. Tell the receptionist.",
    reference_target: "Saya mau kamar besar.",
    accept_notes: "Also accept 'Mau kamar besar.'",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000012',
    sceneId: 'd1000000-0001-4000-8000-000000000012',
    statement_en: "I can state how many nights I want to stay.",
    prompt_en: "The receptionist asks how many nights you will stay. You want to stay for two nights.",
    reference_target: "Dua malam.",
    accept_notes: "Also accept 'Saya mau dua malam.'",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000012',
    sceneId: 'd1000000-0001-4000-8000-000000000012',
    statement_en: "I can confirm that something is my room key.",
    prompt_en: "The receptionist hands you a key. You want to confirm it is your room key.",
    reference_target: "Ini kunci kamar saya.",
    accept_notes: "Also accept 'Ini kunci kamar.'",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000007',
    sceneId: 'd1000000-0001-4000-8000-000000000007',
    statement_en: "I can ask the price of an item.",
    prompt_en: "You see a souvenir you like at the market. Ask the vendor how much it costs.",
    reference_target: "Berapa harganya?",
    accept_notes: "Also accept: \"Berapa harga ini?\" or \"Berapa harga itu?\"",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000007',
    sceneId: 'd1000000-0001-4000-8000-000000000007',
    statement_en: "I can say I want a specific item.",
    prompt_en: "You've decided on a souvenir. Tell the vendor you want this one.",
    reference_target: "Saya mau ini.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000007',
    sceneId: 'd1000000-0001-4000-8000-000000000007',
    statement_en: "I can say that something is too expensive.",
    prompt_en: "The vendor tells you the price, and you think it's too high. Express that it's too expensive.",
    reference_target: "Terlalu mahal.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000007',
    sceneId: 'd1000000-0001-4000-8000-000000000007',
    statement_en: "I can ask if the price can be lowered.",
    prompt_en: "You think the price is too high and want to bargain. Ask the vendor if they can offer a lower price.",
    reference_target: "Bisa kurang?",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000013',
    sceneId: 'd1000000-0001-4000-8000-000000000013',
    statement_en: "I can state my name.",
    prompt_en: "Your new neighbor introduces themselves. You want to tell them your name.",
    reference_target: "Nama saya Budi.",
    accept_notes: "Answers like 'Nama saya [any name]' or just 'Nama saya' are acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000013',
    sceneId: 'd1000000-0001-4000-8000-000000000013',
    statement_en: "I can ask someone where they live.",
    prompt_en: "You're making small talk with your new neighbor. You want to ask them where they live.",
    reference_target: "Tinggal di mana?",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000013',
    sceneId: 'd1000000-0001-4000-8000-000000000013',
    statement_en: "I can state that I haven't lived in a place for a long time.",
    prompt_en: "Your new neighbor asks if you have been living here for a long time. Tell them you haven't lived here long yet.",
    reference_target: "Belum lama.",
    accept_notes: "Answers like 'Saya belum lama' are also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000013',
    sceneId: 'd1000000-0001-4000-8000-000000000013',
    statement_en: "I can express that I am glad to meet someone.",
    prompt_en: "You've just met your new neighbor. Tell them you are glad to meet them.",
    reference_target: "Senang bertemu.",
    accept_notes: "Answers like 'Saya senang bertemu' are also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000008',
    sceneId: 'd1000000-0001-4000-8000-000000000008',
    statement_en: "I can compliment food.",
    prompt_en: "You just took a bite of the food. It's really good! Express your appreciation.",
    reference_target: "Enak sekali!",
    accept_notes: "None. This is a common fixed phrase.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000008',
    sceneId: 'd1000000-0001-4000-8000-000000000008',
    statement_en: "I can express that I like a food.",
    prompt_en: "You are eating a new food and really enjoy it. Tell your friend you like this food.",
    reference_target: "Saya suka ini.",
    accept_notes: "Answers like 'Saya suka' (I like it/them) or 'Suka ini' (like this) are also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000008',
    sceneId: 'd1000000-0001-4000-8000-000000000008',
    statement_en: "I can express that I don't like a food.",
    prompt_en: "You try a new food but don't enjoy it. Tell your friend you don't like this food.",
    reference_target: "Saya tidak suka ini.",
    accept_notes: "Answers like 'Saya tidak suka' (I don't like it/them) or 'Tidak suka ini' (don't like this) are also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000008',
    sceneId: 'd1000000-0001-4000-8000-000000000008',
    statement_en: "I can ask someone if they want to try something.",
    prompt_en: "You have a tasty snack and want to offer some to your friend. Ask if they want to try it.",
    reference_target: "Mau coba?",
    accept_notes: "None. This is a common fixed phrase.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000014',
    sceneId: 'd1000000-0001-4000-8000-000000000014',
    statement_en: "I can tell a driver I want to go to a specific destination.",
    prompt_en: "You are at the airport and hail a taxi. Tell the driver you want to go to your hotel.",
    reference_target: "Saya mau ke sana.",
    accept_notes: "Also accept 'Mau ke sana.'",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000014',
    sceneId: 'd1000000-0001-4000-8000-000000000014',
    statement_en: "I can ask a driver how much a ride costs to a specific place.",
    prompt_en: "You've told the driver you want to go to your hotel. Now ask how much the fare will be to that place.",
    reference_target: "Berapa ke sana?",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000014',
    sceneId: 'd1000000-0001-4000-8000-000000000014',
    statement_en: "I can say that a quoted price is too expensive.",
    prompt_en: "The taxi driver quotes a price you think is too high. Express that it is too expensive.",
    reference_target: "Terlalu mahal.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000014',
    sceneId: 'd1000000-0001-4000-8000-000000000014',
    statement_en: "I can ask a driver to stop at a specific location.",
    prompt_en: "You've arrived at your hotel. Tell the driver to stop here.",
    reference_target: "Tolong berhenti di sini.",
    accept_notes: "Also accept 'Berhenti di sini.'",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000034',
    sceneId: 'd1000000-0001-4000-8000-000000000034',
    statement_en: "I can ask someone where they are from.",
    prompt_en: "You're chatting with your Grab driver. You want to ask him where he is from. What do you say?",
    reference_target: "Kamu dari mana?",
    accept_notes: "None.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000034',
    sceneId: 'd1000000-0001-4000-8000-000000000034',
    statement_en: "I can state my desired destination.",
    prompt_en: "Your driver asks where you want to go. You want to go to Ubud. What do you say?",
    reference_target: "Aku mau ke Ubud.",
    accept_notes: "Also accept 'Saya mau ke Ubud.'",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000034',
    sceneId: 'd1000000-0001-4000-8000-000000000034',
    statement_en: "I can state a number in the tens.",
    prompt_en: "Your driver asks about the estimated travel time. You want to say 'forty minutes'. What do you say?",
    reference_target: "Empat puluh menit.",
    accept_notes: "Also accept 'Empat puluh.'",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000034',
    sceneId: 'd1000000-0001-4000-8000-000000000034',
    statement_en: "I can ask for a choice between two options.",
    prompt_en: "You are discussing transportation with a friend. You want to ask if they prefer a taxi or an ojek. What do you say?",
    reference_target: "Taksi atau ojek?",
    accept_notes: "None.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-4000-8000-000000000015',
    sceneId: 'd1000000-0001-4000-8000-000000000015',
    statement_en: "I can confirm that I am ready.",
    prompt_en: "Your motorbike driver has arrived and asks if you are ready to go. Tell them you are ready.",
    reference_target: "Sudah siap.",
    accept_notes: "Both 'Siap' and 'Sudah siap' are acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 0,
  },
  {
    id: 'c1000000-0001-4000-8000-000000000015',
    sceneId: 'd1000000-0001-4000-8000-000000000015',
    statement_en: "I can ask someone to wait for a moment.",
    prompt_en: "Your driver has arrived, but you need one more minute before you can leave. Ask them to wait a moment.",
    reference_target: "Tunggu sebentar.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 1,
  },
  {
    id: 'c1000000-0002-4000-8000-000000000015',
    sceneId: 'd1000000-0001-4000-8000-000000000015',
    statement_en: "I can ask a driver to go slowly.",
    prompt_en: "You are on the motorbike and feel the driver is going too fast. Politely ask them to drive slowly.",
    reference_target: "Pelan-pelan ya.",
    accept_notes: "'Pelan-pelan' is also acceptable.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 2,
  },
  {
    id: 'c1000000-0003-4000-8000-000000000015',
    sceneId: 'd1000000-0001-4000-8000-000000000015',
    statement_en: "I can indicate my current location as \"here\".",
    prompt_en: "Your driver calls and asks where you are. You are at the pickup spot. Tell them you are here.",
    reference_target: "Di sini.",
    // Model suggested: [] — opt in only where
    // you are certain EVERY acceptable answer contains the lemma.
    must_include: [],
    sort_order: 3,
  },
];
