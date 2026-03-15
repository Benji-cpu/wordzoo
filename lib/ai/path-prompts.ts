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
  languageName: string
): string {
  return `Create a ${languageName} travel vocabulary pack for someone visiting ${destination} for ${duration}.

Focus on:
- Essential survival phrases (greetings, directions, emergencies)
- Food and restaurant vocabulary specific to ${destination}
- Transportation words relevant to ${destination}
- Cultural phrases and local expressions
- Shopping and bargaining vocabulary

Generate a path with 4-5 scenes of 5-7 words each, organized by travel situation.`;
}
