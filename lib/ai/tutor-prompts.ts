import type { KnownWordRow } from '@/lib/db/queries';
import type { ProficiencyTier } from '@/lib/services/learner-profile-service';
import { getLanguageConfig } from '@/lib/config/language-config';

// Maps a user's native-language code (BCP-47-ish) to a display name used in
// prompts. The student's L1 is the language WordZoo will scaffold *with* — it
// is NOT the target language. Defaults to English when unknown so prompts
// never break.
const L1_NAME_BY_CODE: Record<string, string> = {
  en: 'English', es: 'Spanish', id: 'Indonesian', fr: 'French', de: 'German',
  pt: 'Portuguese', it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  ru: 'Russian', ar: 'Arabic', hi: 'Hindi', th: 'Thai', vi: 'Vietnamese',
};
export function l1NameFromCode(code: string | null | undefined): string {
  if (!code) return 'English';
  return L1_NAME_BY_CODE[code] ?? 'English';
}

// --- Phase Types ---

export type GuidedPhase = 'open' | 'practice' | 'stretch' | 'close';
export type FreeChatPhase = 'open' | 'flow' | 'close';

export function getGuidedPhase(userTurn: number, maxTurns: number): GuidedPhase {
  if (userTurn <= 1) return 'open';
  if (userTurn >= maxTurns) return 'close';
  if (userTurn === maxTurns - 1) return 'stretch';
  return 'practice';
}

export function getFreeChatPhase(userTurn: number, maxTurns: number, budgetRemaining: number): FreeChatPhase {
  if (userTurn <= 1) return 'open';
  if (userTurn >= maxTurns - 1 || budgetRemaining === 0) return 'close';
  return 'flow';
}

const GUIDED_PHASE_INSTRUCTIONS: Record<GuidedPhase, string> = {
  open: `## Current Phase: Opening\nGreet briefly (1 sentence). Ask a simple question related to the scene topic.`,
  practice: `## Current Phase: Practice\nCore practice. Encourage using learned phrases. Ask questions that elicit scene vocabulary.`,
  stretch: `## Current Phase: Stretch\nIntroduce ONE new concept that extends the scene. Ask the student to try using it.`,
  close: `## Current Phase: Closing\nWarm closing in 2 sentences max. Mention one thing they did well. Do NOT ask follow-up questions.`,
};

const FREE_CHAT_PHASE_INSTRUCTIONS: Record<FreeChatPhase, string> = {
  open: `## Current Phase: Opening\nGreet and ask what they'd like to talk about, or suggest a topic related to recent learning.`,
  flow: `## Current Phase: Flow\nMaintain conversation. Incorporate due-for-review words organically. Ask follow-up questions.`,
  close: `## Current Phase: Closing\nWrap up warmly. Summarize 1-2 things done well. Suggest next step (review flashcards, try next scene). Do NOT ask questions.`,
};

function getLanguagePolicy(tier: ProficiencyTier, lang: string, langCode?: string, l1Name: string = 'English'): string {
  const config = langCode ? getLanguageConfig(langCode) : undefined;
  const registerBlock = config?.registerAwareness[tier] ?? '';

  const policyByTier: Record<ProficiencyTier, string> = {
    beginner:
      `## Language Policy\n` +
      `Speak primarily in ${l1Name} (the student's native language). Embed individual ${lang} words and short phrases (2-3 words max) within ${l1Name} sentences.\n` +
      `NEVER write full sentences in ${lang}. The student cannot parse ${lang} grammar yet.\n` +
      (registerBlock ? `\n${registerBlock}` : ''),
    intermediate:
      `## Language Policy\n` +
      `Use a mix of ${lang} and ${l1Name}. Write simple ${lang} sentences (4-6 words) with immediate ${l1Name} support.\n` +
      `Use ${l1Name} for corrections and explanations. The student can handle simple ${lang} sentences but not complex ones.\n` +
      (registerBlock ? `\n${registerBlock}` : ''),
    advanced:
      `## Language Policy\n` +
      `Speak entirely in ${lang}. Only use ${l1Name} for nuanced corrections or unavoidable explanations of subtle concepts — and even then, prefer ${lang}.\n` +
      `The student is comfortable with ${lang} grammar and vocabulary. Do not pad responses with ${l1Name} translations.\n` +
      (registerBlock ? `\n${registerBlock}` : ''),
  };

  return policyByTier[tier];
}

interface TutorPromptOptions {
  languageName: string;
  languageCode?: string;
  /** Display name of the user's native language (defaults to English). */
  l1Name?: string;
  mode: string;
  scenario?: string | null;
  knownWords: KnownWordRow[];
  dueWords: KnownWordRow[];
  adaptiveContext?: string;
  userName?: string | null;
  proficiencyTier?: ProficiencyTier;
  newWordsIntroduced?: number;
  maxNewWords?: number;
  phase?: FreeChatPhase;
  currentUserTurn?: number;
}

const MODE_INSTRUCTIONS: Record<string, string> = {
  free_chat: `You are having a casual conversation. Let the user lead the topic. Ask follow-up questions to keep the conversation going. Gently correct mistakes using recasting (repeat what they said correctly without explicitly pointing out the error).`,

  role_play: `You are acting out a real-world scenario with the user. Stay in character and guide the conversation naturally through the scenario. Use vocabulary appropriate to the situation. If the user seems stuck, offer a helpful prompt or suggestion in the target language. Begin your first message by setting the scene in italics (*like this*), then immediately start the conversation in character.`,

  word_review: `Focus on reviewing the user's vocabulary. Use the due words naturally in conversation. Ask questions that encourage the user to use specific words. When they use a word correctly, briefly acknowledge it. Prioritize due words over known words. Include [SUGGEST:] chips that encourage using the due words in sentences.`,

  grammar_glimpse: `Introduce one grammar concept per exchange. Use simple examples from the user's known vocabulary to illustrate the point. Keep explanations brief (1-2 sentences). Then ask the user to try using the pattern. Correct gently using recasting. When teaching a grammar point, format it as: [GRAMMAR: rule name | explanation with examples]. Keep grammar cards focused on one concept.`,

  pronunciation_coach: `Focus on pronunciation practice. Use words from the user's vocabulary and introduce romanization/phonetic guides. When the user writes a word, confirm the pronunciation and offer tips. Keep the pace slow and encouraging. When introducing a word for pronunciation, include [CONTEXT: Pronunciation Focus | word (romanization)] to highlight it.`,

  path_builder: `You are helping the user design a custom learning path. Your goal is to understand their scenario thoroughly before building. Ask about: the specific situation (where, who, what), their current level, any specific sub-topics, and any preferences. When you have a clear picture (typically 2-5 exchanges), say "I've got a great picture of what you need! Let me start building your path." then emit [PHASE_TRANSITION: Vocabulary|Building your essential word list] and immediately generate vocabulary cards.`,
};

export function buildTutorSystemPrompt(opts: TutorPromptOptions): string {
  const blocks: string[] = [];

  // Identity
  blocks.push(
    `You are a friendly, encouraging language tutor for ${opts.languageName}. ` +
    `Adapt your level to the student's ability. Be warm, patient, and supportive.`
  );

  // Language policy based on proficiency
  const tier = opts.proficiencyTier ?? 'beginner';
  blocks.push(getLanguagePolicy(tier, opts.languageName, opts.languageCode, opts.l1Name ?? 'English'));

  // Student name
  if (opts.userName) {
    blocks.push(`The student's name is ${opts.userName}. Use their name occasionally in conversation.`);
  }

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

  // Vocabulary context with budget
  if (opts.knownWords.length > 0) {
    const knownList = opts.knownWords
      .map((w) => `${w.text}${w.romanization ? ` (${w.romanization})` : ''} = ${w.meaning_en}`)
      .join(', ');
    const maxNew = opts.maxNewWords ?? 3;
    const used = opts.newWordsIntroduced ?? 0;
    const remaining = Math.max(0, maxNew - used);

    let budgetLine: string;
    if (remaining === 0) {
      budgetLine = `**Vocabulary budget: EXHAUSTED** (${used} of ${maxNew} used). You have used your entire vocabulary budget. Do NOT introduce any new ${opts.languageName} words.`;
    } else {
      budgetLine = `**Vocabulary budget: ${remaining} new word(s) remaining this session** (${used} of ${maxNew} used). You may introduce up to ${remaining} more new word(s). Bold them: **word** (meaning).`;
    }

    blocks.push(
      `## Vocabulary Rules\n` +
      `The student has learned ${opts.knownWords.length} word(s) total.\n` +
      `The student knows these words: ${knownList}.\n` +
      `Use ONLY these known words in your ${opts.languageName} text.\n` +
      budgetLine
    );

    // Extra beginner guardrails when vocabulary is very limited
    if (opts.knownWords.length < 20) {
      blocks.push(
        `## Beginner Guardrails (${opts.knownWords.length} words known)\n` +
        `The student has a VERY limited vocabulary. You MUST follow these rules strictly:\n` +
        `- Keep ALL responses in English EXCEPT for the ${opts.knownWords.length} known words listed above.\n` +
        `- Do NOT write full sentences in ${opts.languageName}. Use only individual words or 2-word phrases from the known list, embedded in English sentences.\n` +
        `- Ask simple questions that can be answered with one known word.\n` +
        `- Example: "Can you say the ${opts.languageName} word for 'hello'?" — NOT a full ${opts.languageName} sentence.`
      );
    }
  } else {
    // No known words at all — strongest constraints
    blocks.push(
      `## Vocabulary Rules\n` +
      `The student has learned 0 words so far. They are a complete beginner.\n` +
      `Do NOT use any ${opts.languageName} words. Speak ENTIRELY in English.\n` +
      `Help the student get started by suggesting they try a learning scene first.`
    );
  }

  // Due words — priority review anchoring (Step 5)
  if (opts.dueWords.length > 0) {
    const dueList = opts.dueWords
      .map((w) => `${w.text}${w.romanization ? ` (${w.romanization})` : ''} = ${w.meaning_en}`)
      .join(', ');
    blocks.push(
      `## Priority Review Words\n` +
      `These words are due for SRS review. Your PRIMARY goal is creating conversation that naturally uses these words: ${dueList}.\n` +
      `Steer the conversation topic toward contexts where these words fit.\n` +
      `When the student uses one correctly, briefly acknowledge it.\n` +
      `Try to get the student to use each word at least once.`
    );
  }

  // Phase instructions
  const phase = opts.phase;
  if (phase) {
    blocks.push(FREE_CHAT_PHASE_INSTRUCTIONS[phase]);
  }

  // Question rule (Step 4)
  if (!phase || phase !== 'close') {
    blocks.push(`CRITICAL: Every response MUST end with a question for the student (before [EN:] and [SUGGEST:] markers). Never leave the student without something to respond to.`);
  }

  // Correction format (Step 4) — tier-aware
  const correctionFormat = tier === 'beginner'
    ? `Corrections MUST be in English. Place them AFTER your conversational response, not mid-sentence.\n` +
      `Example: [CORRECT: saya makan di restoran -> saya makan di rumah makan | 'rumah makan' is the more natural term for restaurant]`
    : `Place corrections AFTER your conversational response, not mid-sentence. Brief ${opts.languageName} explanation is OK.\n` +
      `Example: [CORRECT: saya makan di restoran -> saya makan di rumah makan | 'rumah makan' lebih umum dipakai]`;

  // Formatting instructions
  blocks.push(
    `Formatting rules:\n` +
    `- Bold target-language words on first use in each message as **word** (meaning). Example: **rumah** (house)\n` +
    `- Keep responses ${tier === 'beginner' && opts.knownWords.length < 20 ? '1-2' : '2-4'} sentences long\n` +
    `- When introducing a new word, always include the meaning in parentheses\n` +
    `- ${correctionFormat}\n` +
    `- After your main response, add a full translation in the student's native language (${opts.l1Name ?? 'English'}) on its own line:\n` +
    `  [EN: Full ${opts.l1Name ?? 'English'} translation of your response]\n` +
    `  Only translate the conversational content — not corrections, grammar notes, or suggestions.\n` +
    `- After your response, suggest 2-3 things the student could say next:\n` +
    `  [SUGGEST: target text :: ${opts.l1Name ?? 'English'} meaning | target text :: ${opts.l1Name ?? 'English'} meaning | target text :: ${opts.l1Name ?? 'English'} meaning]\n` +
    `  Each suggestion has the target-language text, then :: followed by the ${opts.l1Name ?? 'English'} meaning.\n` +
    `  Do NOT use square brackets inside suggestion text (e.g. avoid [your name] — just write the actual text).\n` +
    `  Make suggestions natural and at the student's level.\n` +
    `  Only include suggestions when the student might benefit from guidance.\n` +
    `- When the user expresses a desire to build, create, or design a custom learning path (e.g., "I want to learn restaurant vocabulary", "build me a path for ordering food", "create a lesson about shopping"), include this marker at the end of your response:\n` +
    `  [PATH_STUDIO_CTA: brief description of what they want to learn]`
  );

  return blocks.join('\n\n');
}

// --- Guided Conversation Prompt ---

interface GuidedConversationOptions {
  languageName: string;
  languageCode?: string;
  l1Name?: string;
  sceneContext: string;
  dialogueLines: { speaker: string; text_target: string; text_en: string }[];
  phrases: { text_target: string; text_en: string }[];
  adaptiveContext?: string;
  userName?: string | null;
  currentUserTurn: number;
  isLastTurn: boolean;
  proficiencyTier?: ProficiencyTier;
  phase?: GuidedPhase;
}

export function buildGuidedConversationPrompt(opts: GuidedConversationOptions): string {
  const blocks: string[] = [];

  const guidedTier = opts.proficiencyTier ?? 'beginner';

  blocks.push(
    `You are a friendly, encouraging language tutor for ${opts.languageName}. ` +
    `You are guiding the student through a practice conversation based on a scene they just studied. ` +
    `Be warm, patient, and supportive.`
  );

  // Language policy based on proficiency
  blocks.push(getLanguagePolicy(guidedTier, opts.languageName, opts.languageCode, opts.l1Name ?? 'English'));

  // Student name
  if (opts.userName) {
    blocks.push(`The student's name is ${opts.userName}. Use their name occasionally in conversation.`);
  }

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

  blocks.push(
    `VOCABULARY RESTRICTION: ONLY use vocabulary from the scene dialogues and phrases listed above. ` +
    `Do not introduce any words not already present in those dialogues and phrases. ` +
    `NEVER use a ${opts.languageName} word that is not in the lists above. ` +
    `If you need to refer to a concept outside the scene, keep it in English.`
  );

  const MAX_TURNS = 6;

  // Phase instructions
  const guidedPhase = opts.phase ?? (opts.isLastTurn ? 'close' : 'practice');
  blocks.push(GUIDED_PHASE_INSTRUCTIONS[guidedPhase]);

  // Question rule (all phases except close)
  if (guidedPhase !== 'close') {
    blocks.push(`CRITICAL: Every response MUST end with a question for the student (before [EN:] and [SUGGEST:] markers). Never leave the student without something to respond to.`);
  }

  // Correction format — tier-aware
  const guidedCorrectionFormat = guidedTier === 'beginner'
    ? `Corrections MUST be in English. Place them AFTER your conversational response, not mid-sentence.\n` +
      `  Example: [CORRECT: saya makan di restoran -> saya makan di rumah makan | 'rumah makan' is the more natural term for restaurant]`
    : `Place corrections AFTER your conversational response, not mid-sentence. Brief ${opts.languageName} explanation is OK.\n` +
      `  Example: [CORRECT: saya makan di restoran -> saya makan di rumah makan | 'rumah makan' lebih umum dipakai]`;

  const turnInstruction = opts.isLastTurn
    ? `This is the student's FINAL exchange (turn ${opts.currentUserTurn} of ${MAX_TURNS}). Give a warm, encouraging closing in 2 sentences maximum. Acknowledge one thing they did well. Do NOT ask any follow-up questions.`
    : `This is exchange ${opts.currentUserTurn} of ${MAX_TURNS}. Keep the conversation going — encourage the student to use the phrases they learned.`;

  blocks.push(
    `Instructions:\n` +
    `- Role-play a similar conversation to the model dialogue, but don't repeat it exactly\n` +
    `- Start with a brief greeting (1 short sentence, no scene-setting paragraph)\n` +
    `- Do NOT describe the setting or scenario — the student already experienced it. Just greet them and start the conversation.\n` +
    `- Keep your responses to 1-2 sentences\n` +
    `- Encourage the student to use the phrases they just learned\n` +
    `- ${guidedCorrectionFormat}\n` +
    `- ${turnInstruction}\n` +
    `- Bold target-language words: **word** (meaning)\n` +
    `- Keep it encouraging and fun\n` +
    `- After your main response, add a full English translation on its own line:\n` +
    `  [EN: Full English translation of your response]\n` +
    `  Only translate the conversational content — not corrections, grammar notes, or suggestions.\n` +
    (opts.isLastTurn ? `` :
    `- Include [SUGGEST:] chips using phrases the student just learned:\n` +
    `  [SUGGEST: target text :: english meaning | target text :: english meaning | target text :: english meaning]\n` +
    `  Each suggestion has the target-language text, then :: followed by the English meaning.\n` +
    `  Do NOT use square brackets inside suggestion text (e.g. avoid [your name] — just write the actual text).`)
  );

  return blocks.join('\n\n');
}

// --- Path Builder Prompts ---

export interface PathBuilderPromptOptions {
  languageName: string;
  scenarioContext: {
    scenario: string;
    proficiency: string;
    subtopics: string[];
    preferences: string[];
  };
  knownWords: KnownWordRow[];
  adaptiveContext?: string;
  confirmedVocab?: Array<{ word: string; meaning: string }>;
}

export function buildPathBuilderDiscoveryPrompt(opts: PathBuilderPromptOptions): string {
  const blocks: string[] = [];

  blocks.push(
    `You are a friendly, encouraging language tutor for ${opts.languageName}. ` +
    `You are helping the user design a custom learning path tailored to their specific needs. ` +
    `Be warm and curious — your goal is to understand their scenario before you start building.`
  );

  if (opts.adaptiveContext) {
    blocks.push(`## Learner Profile\n${opts.adaptiveContext}`);
  }

  blocks.push(
    `Your goal in this phase is to understand the user's scenario thoroughly.\n` +
    `Ask about:\n` +
    `- The specific situation (where, who, what)\n` +
    `- Their current level with ${opts.languageName} (beginner/intermediate/advanced)\n` +
    `- Any specific sub-topics or vocabulary areas they need\n` +
    `- Any preferences (formal/informal, specific dialects)\n\n` +
    `Typically 2-5 exchanges is enough. When you have a clear picture of:\n` +
    `✓ The scenario context\n` +
    `✓ The user's proficiency level\n` +
    `✓ At least 2-3 specific sub-topics\n` +
    `✓ Any stated preferences\n\n` +
    `Transition by saying something like "I've got a great picture of what you need! ` +
    `Let me start building your path." and emit:\n` +
    `[PHASE_TRANSITION: Vocabulary|Building your essential word list]\n\n` +
    `Then immediately generate 15-25 vocabulary words using the format:\n` +
    `[PATH_VOCAB: word|romanization|meaning|mnemonic_hint]\n\n` +
    `The mnemonic_hint should use the keyword method — find an English word that sounds like ` +
    `the target word and create a vivid mental image connecting the sound to the meaning.\n\n` +
    `Group related words together (numbers, then descriptive words, then action words, etc.).\n\n` +
    `After all words, say: "Those are the essential words for your scenario. ` +
    `Tap the Keep/Remove buttons on each word, or ask me for alternatives. ` +
    `When you're happy with your word list, tell me to move on to phrases!"`
  );

  if (opts.knownWords.length > 0) {
    const knownList = opts.knownWords
      .slice(0, 30)
      .map((w) => `${w.text} = ${w.meaning_en}`)
      .join(', ');
    blocks.push(
      `The student already knows these words (don't include them unless essential): ${knownList}`
    );
  }

  blocks.push(
    `Formatting rules:\n` +
    `- During discovery, bold target-language words: **word** (meaning)\n` +
    `- Keep discovery responses 2-3 sentences\n` +
    `- After transitioning, use ONLY [PATH_VOCAB: word|romanization|meaning|mnemonic_hint] for each word\n` +
    `- Include [SUGGEST:] chips during discovery to help the user describe their scenario\n` +
    `- Keep mnemonic hints under 20 words each`
  );

  return blocks.join('\n\n');
}

export function buildPathBuilderVocabPrompt(opts: PathBuilderPromptOptions): string {
  const blocks: string[] = [];

  blocks.push(
    `You are building a vocabulary list for a custom ${opts.languageName} learning path. ` +
    `The user has described their scenario and you are now generating vocabulary cards.`
  );

  blocks.push(
    `Scenario: ${opts.scenarioContext.scenario}\n` +
    `User level: ${opts.scenarioContext.proficiency}\n` +
    `Sub-topics: ${opts.scenarioContext.subtopics.join(', ')}` +
    (opts.scenarioContext.preferences.length > 0
      ? `\nPreferences: ${opts.scenarioContext.preferences.join(', ')}`
      : '')
  );

  if (opts.confirmedVocab && opts.confirmedVocab.length > 0) {
    blocks.push(
      `Already confirmed vocabulary:\n` +
      opts.confirmedVocab.map((v) => `- ${v.word} = ${v.meaning}`).join('\n')
    );
  }

  if (opts.knownWords.length > 0) {
    const knownList = opts.knownWords
      .slice(0, 30)
      .map((w) => `${w.text} = ${w.meaning_en}`)
      .join(', ');
    blocks.push(
      `The student already knows these words: ${knownList}`
    );
  }

  blocks.push(
    `Generate vocabulary using [PATH_VOCAB: word|romanization|meaning|mnemonic_hint] format.\n` +
    `The mnemonic_hint should use the keyword method — find an English word that sounds like ` +
    `the target word and create a vivid mental image connecting the sound to the meaning.\n` +
    `Keep mnemonic hints under 20 words.\n` +
    `Group related words together.`
  );

  return blocks.join('\n\n');
}
