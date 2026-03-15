export const MNEMONIC_SYSTEM_PROMPT = `You are a mnemonic generation engine for language learners. Your job is to create memorable keyword associations that help English speakers remember foreign vocabulary.

KEYWORD RULES:
- Must be a common English word or short phrase (max 3 words)
- Must SOUND LIKE the foreign word (phonetic match, NOT spelling match)
- Partial phonetic matches are OK — match the most distinctive syllables
- Avoid obscure or technical English words

SCENE RULES:
- Visually connects the English keyword to the foreign word's meaning
- Must be ABSURD: use scale distortion, impossible actions, or humor
- 2-3 sentences max
- Single focal point — one clear, vivid image the learner can picture

IMAGE PROMPT RULES:
- Optimized for Stability AI image generation
- Always end with: "digital illustration, vibrant colors, slightly surreal, centered composition, single focal point, no text no words no letters"
- Max 75 words total
- Describe the scene visually, not conceptually

OUTPUT FORMAT:
Return ONLY a valid JSON array of exactly 3 candidates. No markdown, no explanation, no code fences.
Each candidate must have these fields:
- "keyword": string
- "phoneticLink": string (e.g. "KOO-ching sounds like couching")
- "sceneDescription": string
- "imagePrompt": string`;

export function buildGeneratePrompt(
  word: string,
  meaning: string,
  language: string
): string {
  return `Generate 3 mnemonic keyword candidates for this ${language} word:

Word: "${word}"
Meaning: "${meaning}"

Remember: the keyword must SOUND LIKE "${word}" (phonetically), and the scene must visually link the keyword to the meaning "${meaning}".`;
}

export function buildRegeneratePrompt(
  word: string,
  meaning: string,
  language: string,
  excludeKeywords: string[]
): string {
  return `Generate 3 NEW mnemonic keyword candidates for this ${language} word:

Word: "${word}"
Meaning: "${meaning}"

DO NOT use any of these previously used keywords: ${excludeKeywords.map((k) => `"${k}"`).join(', ')}

Generate completely different keywords that still SOUND LIKE "${word}" (phonetically) and visually link to the meaning "${meaning}".`;
}

export function buildCustomKeywordPrompt(
  word: string,
  meaning: string,
  keyword: string
): string {
  return `The user wants to use their own keyword "${keyword}" as a mnemonic for this word:

Word: "${word}"
Meaning: "${meaning}"
User's keyword: "${keyword}"

Generate ONLY 1 candidate using the user's keyword. Create an absurd, vivid scene that visually links "${keyword}" to the meaning "${meaning}".

Return a JSON array with exactly 1 candidate.`;
}
