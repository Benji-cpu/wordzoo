// Scene anchor image prompts for the "memory palace room" image per scene.
// Keyed by scene ID.

export interface SceneAnchorEntry {
  anchorImagePrompt: string;
}

export const SCENE_ANCHOR_DATA: Record<string, SceneAnchorEntry> = {
  // Scene 1: Selamat! (Hello!) — A cozy Balinese cafe
  'd1000000-0001-4000-8000-000000000004': {
    anchorImagePrompt: 'A cozy Balinese cafe with woven rattan furniture, tropical plants spilling over the balcony, a steaming cup of Bali coffee on a carved wooden table, frangipani flowers scattered around, warm golden afternoon light filtering through palm fronds, a friendly cat napping on a cushion, digital illustration, warm colors, atmospheric lighting, wide composition, establishing shot',
  },

  // Scene 2: Siapa Itu? (Who's That?) — A social gathering
  'd1000000-0001-4000-8000-000000000005': {
    anchorImagePrompt: 'A lively Balinese garden gathering at dusk with string lights draped between palm trees, people mingling on a stone terrace, offerings and candles on small tables, bougainvillea climbing stone walls, a traditional gate in the background, warm twilight glow, digital illustration, warm colors, atmospheric lighting, wide composition, establishing shot',
  },

  // Scene 3: Saya Mau... (I Want...) — A warung food stall
  'd1000000-0001-4000-8000-000000000006': {
    anchorImagePrompt: 'A charming Balinese warung food stall with a corrugated tin roof, steaming pots of nasi goreng and mie goreng on the counter, colorful plastic stools, a hand-painted menu board, wok flames flickering in the kitchen, tropical street scene with motorbikes in the background, digital illustration, warm colors, atmospheric lighting, wide composition, establishing shot',
  },

  // Scene 4: Berapa Harganya? (How Much?) — A traditional Ubud market
  'd1000000-0001-4000-8000-000000000007': {
    anchorImagePrompt: 'A bustling traditional Ubud art market with wooden carvings and colorful batik fabrics hanging from stalls, woven baskets piled high, a stone temple entrance visible beyond the market canopy, dappled sunlight through fabric awnings, rich earthy tones, digital illustration, warm colors, atmospheric lighting, wide composition, establishing shot',
  },

  // Scene 5: Enak Sekali! (So Delicious!) — Eating at the warung
  'd1000000-0001-4000-8000-000000000008': {
    anchorImagePrompt: 'A close-up warung table scene with plates of colorful Indonesian food — nasi goreng with a fried egg, satay skewers with peanut sauce, sambal in small bowls, es teh with condensation, banana leaf placemats, warm kitchen glow in the background, steam rising from the food, digital illustration, warm colors, atmospheric lighting, wide composition, establishing shot',
  },

  // Scene 6: Di Mana...? (Where Is...?) — Walking around Ubud streets
  'd1000000-0001-4000-8000-000000000009': {
    anchorImagePrompt: 'A winding Ubud street with moss-covered stone walls, a traditional Balinese split gate at a crossroads, rice paddies visible in the distance, a motorbike parked by a pharmacy sign, frangipani trees lining the road, soft morning mist, carved stone guardian statues, digital illustration, warm colors, atmospheric lighting, wide composition, establishing shot',
  },
};
