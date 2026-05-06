export const CUSTOM_PATH_SYSTEM_PROMPT = `You are a language learning curriculum designer. You create vocabulary learning paths organized into scenes (themed groups of words).

RULES:
- Generate 20-30 words total, organized into 4-5 scenes of 5-7 words each
- Words should be practical, high-frequency vocabulary relevant to the theme
- Each scene should have a coherent theme (e.g., "At the Restaurant", "Asking for Directions")
- Include a mix of parts of speech: nouns, verbs, adjectives, common phrases
- Provide romanization for non-Latin scripts
- Scene narratives should set a vivid, memorable context for the words

OUTPUT FORMAT: Respond with ONLY valid JSON, no markdown fences. Use this structure:
{
  "pathTitle": "string",
  "pathDescription": "string",
  "scenes": [
    {
      "title": "string",
      "narrative": "string (2-3 sentences setting the scene)",
      "words": [
        {
          "text": "string (word in target language)",
          "romanization": "string or null",
          "meaning": "string (English meaning)",
          "part_of_speech": "string (noun, verb, adjective, phrase, etc.)"
        }
      ]
    }
  ]
}`;

export function buildCustomPathPrompt(userInput: string, languageName: string): string {
  return `Create a ${languageName} vocabulary learning path based on this request: "${userInput}"

Generate a path with 4-5 scenes of 5-7 words each. Focus on practical, useful vocabulary that matches the user's interest.`;
}

export function buildTravelPackPrompt(
  destination: string,
  duration: string,
  languageName: string,
  useCases: string[] = [],
  tripDays = 14,
): string {
  const sceneCount = Math.max(3, Math.min(7, tripDays));
  const useCaseList = useCases.length > 0
    ? useCases.map((u) => `- ${u}`).join('\n')
    : '- general travel survival';

  return `Create a ${languageName} travel vocabulary pack for someone visiting ${destination} for ${duration}.

The traveller specifically wants to be able to do these things on their trip (in priority order):
${useCaseList}

Design exactly ${sceneCount} scenes of 5-8 words each — one scene per study day, paced to fit the trip length. Each scene corresponds to one of the use cases above and should be ordered so the most-checked use cases come FIRST (Day 1, Day 2, etc).

For each scene:
- The "title" should clearly name the use case it serves (e.g. "Eating at warungs", "Riding a scooter", "Bargaining at markets").
- The "narrative" should be a vivid, locally-flavoured 2-3 sentence scene set in ${destination}.
- The "words" should be the 5-8 most useful items for that specific situation — phrases the traveller will actually say or hear, not abstract vocabulary.

Prioritise:
- Phrases the traveller will need within the first hour of arrival (greetings, "thank you", "how much", numbers).
- Local-specific terms (e.g. "warung", "nasi campur", "ojek") rather than generic textbook words.
- Words the traveller will recognise on signs, menus, and from locals talking to them.

Return ONLY the JSON described in the system prompt — no commentary, no markdown fences.`;
}
