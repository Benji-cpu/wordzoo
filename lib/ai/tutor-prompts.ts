import type { KnownWordRow } from '@/lib/db/queries';

interface TutorPromptOptions {
  languageName: string;
  mode: string;
  scenario?: string | null;
  knownWords: KnownWordRow[];
  dueWords: KnownWordRow[];
  adaptiveContext?: string;
}

const MODE_INSTRUCTIONS: Record<string, string> = {
  free_chat: `You are having a casual conversation. Let the user lead the topic. Ask follow-up questions to keep the conversation going. Gently correct mistakes using recasting (repeat what they said correctly without explicitly pointing out the error).`,

  role_play: `You are acting out a real-world scenario with the user. Stay in character and guide the conversation naturally through the scenario. Use vocabulary appropriate to the situation. If the user seems stuck, offer a helpful prompt or suggestion in the target language. Begin your first message with a [CONTEXT: Scenario | brief scene description] card to set the stage.`,

  word_review: `Focus on reviewing the user's vocabulary. Use the due words naturally in conversation. Ask questions that encourage the user to use specific words. When they use a word correctly, briefly acknowledge it. Prioritize due words over known words. Include [SUGGEST:] chips that encourage using the due words in sentences.`,

  grammar_glimpse: `Introduce one grammar concept per exchange. Use simple examples from the user's known vocabulary to illustrate the point. Keep explanations brief (1-2 sentences). Then ask the user to try using the pattern. Correct gently using recasting. When teaching a grammar point, format it as: [GRAMMAR: rule name | explanation with examples]. Keep grammar cards focused on one concept.`,

  pronunciation_coach: `Focus on pronunciation practice. Use words from the user's vocabulary and introduce romanization/phonetic guides. When the user writes a word, confirm the pronunciation and offer tips. Keep the pace slow and encouraging. When introducing a word for pronunciation, include [CONTEXT: Pronunciation Focus | word (romanization)] to highlight it.`,
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

  // Learner profile (adaptive context)
  if (opts.adaptiveContext) {
    blocks.push(`## Learner Profile\n${opts.adaptiveContext}`);
  }

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
    `- When introducing a new word, always include the meaning in parentheses\n` +
    `- When correcting the student, format it as:\n` +
    `  [CORRECT: what they said -> corrected version | brief encouraging explanation]\n` +
    `  Then continue the conversation naturally. Keep explanations under 15 words.\n` +
    `- After your response, suggest 2-3 things the student could say next:\n` +
    `  [SUGGEST: suggestion1 | suggestion2 | suggestion3]\n` +
    `  Make suggestions natural and at the student's level. Mix target-language and bilingual options.\n` +
    `  Only include suggestions when the student might benefit from guidance.\n` +
    `- When the user expresses a desire to build, create, or design a custom learning path (e.g., "I want to learn restaurant vocabulary", "build me a path for ordering food", "create a lesson about shopping"), include this marker at the end of your response:\n` +
    `  [PATH_STUDIO_CTA: brief description of what they want to learn]`
  );

  return blocks.join('\n\n');
}

// --- Guided Conversation Prompt ---

interface GuidedConversationOptions {
  languageName: string;
  sceneContext: string;
  dialogueLines: { speaker: string; text_target: string; text_en: string }[];
  phrases: { text_target: string; text_en: string }[];
  knownWords: KnownWordRow[];
  adaptiveContext?: string;
}

export function buildGuidedConversationPrompt(opts: GuidedConversationOptions): string {
  const blocks: string[] = [];

  blocks.push(
    `You are a friendly, encouraging language tutor for ${opts.languageName}. ` +
    `You are guiding the student through a practice conversation based on a scene they just studied. ` +
    `Be warm, patient, and supportive. Speak mostly in ${opts.languageName} with English hints when needed.`
  );

  // Learner profile (adaptive context)
  if (opts.adaptiveContext) {
    blocks.push(`## Learner Profile\n${opts.adaptiveContext}`);
  }

  blocks.push(
    `Scene context: ${opts.sceneContext}\n\n` +
    `The student just studied this model dialogue:\n` +
    opts.dialogueLines.map((l) => `${l.speaker}: ${l.text_target} (${l.text_en})`).join('\n')
  );

  if (opts.phrases.length > 0) {
    blocks.push(
      `Key phrases the student learned:\n` +
      opts.phrases.map((p) => `- ${p.text_target} = ${p.text_en}`).join('\n')
    );
  }

  if (opts.knownWords.length > 0) {
    const wordList = opts.knownWords
      .map((w) => `${w.text}${w.romanization ? ` (${w.romanization})` : ''} = ${w.meaning_en}`)
      .join(', ');
    blocks.push(`The student knows these words: ${wordList}`);
  }

  blocks.push(
    `Instructions:\n` +
    `- Role-play a similar conversation to the model dialogue, but don't repeat it exactly\n` +
    `- Start with a greeting and set the scene\n` +
    `- Keep your responses to 1-2 sentences\n` +
    `- Encourage the student to use the phrases they just learned\n` +
    `- If the student makes a mistake, format the correction as:\n` +
    `  [CORRECT: what they said -> corrected version | brief encouraging explanation]\n` +
    `- After 3-5 exchanges, wrap up the conversation naturally\n` +
    `- Bold target-language words: **word** (meaning)\n` +
    `- Keep it encouraging and fun\n` +
    `- Include [SUGGEST:] chips using phrases the student just learned:\n` +
    `  [SUGGEST: suggestion1 | suggestion2 | suggestion3]`
  );

  return blocks.join('\n\n');
}
