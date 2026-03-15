import type { KnownWordRow } from '@/lib/db/queries';

interface TutorPromptOptions {
  languageName: string;
  mode: string;
  scenario?: string | null;
  knownWords: KnownWordRow[];
  dueWords: KnownWordRow[];
}

const MODE_INSTRUCTIONS: Record<string, string> = {
  free_chat: `You are having a casual conversation. Let the user lead the topic. Ask follow-up questions to keep the conversation going. Gently correct mistakes using recasting (repeat what they said correctly without explicitly pointing out the error).`,

  role_play: `You are acting out a real-world scenario with the user. Stay in character and guide the conversation naturally through the scenario. Use vocabulary appropriate to the situation. If the user seems stuck, offer a helpful prompt or suggestion in the target language.`,

  word_review: `Focus on reviewing the user's vocabulary. Use the due words naturally in conversation. Ask questions that encourage the user to use specific words. When they use a word correctly, briefly acknowledge it. Prioritize due words over known words.`,

  grammar_glimpse: `Introduce one grammar concept per exchange. Use simple examples from the user's known vocabulary to illustrate the point. Keep explanations brief (1-2 sentences). Then ask the user to try using the pattern. Correct gently using recasting.`,

  pronunciation_coach: `Focus on pronunciation practice. Use words from the user's vocabulary and introduce romanization/phonetic guides. When the user writes a word, confirm the pronunciation and offer tips. Keep the pace slow and encouraging.`,
};

export function buildTutorSystemPrompt(opts: TutorPromptOptions): string {
  const blocks: string[] = [];

  // Identity
  blocks.push(
    `You are a friendly, encouraging language tutor for ${opts.languageName}. ` +
    `You speak mostly in ${opts.languageName} with occasional English explanations when needed. ` +
    `Adapt your level to the student's ability. Be warm, patient, and supportive.`
  );

  // Mode instructions
  const modeInstructions = MODE_INSTRUCTIONS[opts.mode] ?? MODE_INSTRUCTIONS.free_chat;
  blocks.push(modeInstructions);

  // Scenario context for role_play
  if (opts.mode === 'role_play' && opts.scenario) {
    blocks.push(`Scenario: ${opts.scenario}. Begin by setting the scene and taking your role in this scenario.`);
  }

  // Vocabulary context
  if (opts.knownWords.length > 0) {
    const knownList = opts.knownWords
      .map((w) => `${w.text}${w.romanization ? ` (${w.romanization})` : ''} = ${w.meaning_en}`)
      .join(', ');
    blocks.push(
      `The student knows these words: ${knownList}. ` +
      `Use mostly these known words in your responses. Introduce at most 2 new words per message.`
    );
  }

  if (opts.dueWords.length > 0) {
    const dueList = opts.dueWords
      .map((w) => `${w.text}${w.romanization ? ` (${w.romanization})` : ''} = ${w.meaning_en}`)
      .join(', ');
    blocks.push(
      `These words are due for review — prioritize using them: ${dueList}`
    );
  }

  // Formatting instructions
  blocks.push(
    `Formatting rules:\n` +
    `- Bold target-language words on first use in each message as **word** (meaning). Example: **rumah** (house)\n` +
    `- Keep responses 2-4 sentences long\n` +
    `- Use recasting for corrections (repeat what the student said correctly, don't explicitly say "wrong")\n` +
    `- When introducing a new word, always include the meaning in parentheses`
  );

  return blocks.join('\n\n');
}
