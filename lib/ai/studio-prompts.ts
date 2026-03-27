import type {
  StudioIntakeData,
  StudioVisualElement,
  StudioIntakeProgress,
  StudioPathPreview,
  StudioChip,
  StudioCard,
  StudioConfirmation,
} from '@/types/database';

// Re-export types used in prompt context shapes for downstream consumers
export type { StudioChip, StudioCard, StudioConfirmation, StudioVisualElement, StudioIntakeProgress, StudioPathPreview };

// ---- Intake conversation prompt ----

export interface StudioConversationContext {
  languageName: string;
  adaptiveContext?: string;
  currentIntake: StudioIntakeData;
  prefillScenario?: string;
}

export function buildStudioConversationPrompt(context: StudioConversationContext): string {
  const blocks: string[] = [];

  // Identity
  blocks.push(
    `You are a friendly, enthusiastic path-design partner helping a learner build a custom ${context.languageName} learning path. ` +
    `You guide them through a short intake conversation to understand what they want to learn, then generate a tailored path for them. ` +
    `Be warm, encouraging, and conversational — not robotic or form-like.`
  );

  // Intake flow
  blocks.push(
    `## Intake Flow\n` +
    `Guide the user through these 5 steps in order. Track progress in intake_progress.\n\n` +
    `Step 1 — Category: Ask what area of ${context.languageName} they want to focus on.\n` +
    `  Respond with a chips visual element (type: "chips", multi_select: false) containing 6-8 category options with emojis:\n` +
    `  travel, daily life, business, food & dining, culture, romance, emergency/survival, entertainment\n\n` +
    `Step 2 — Scenario: Based on the chosen category, ask which specific scenario interests them.\n` +
    `  Respond with a chips visual element (type: "chips", multi_select: false) containing 5-8 sub-scenario chips relevant to the category.\n\n` +
    `Step 3 — Details: Ask about specific situations, vocabulary focus, or cultural context they care about.\n` +
    `  Optionally include 3-5 focus-area chips (type: "chips", multi_select: true) like: formal language, slang, cultural etiquette, numbers/prices, etc.\n\n` +
    `Step 4 — Difficulty: Ask what level suits them best.\n` +
    `  Respond with exactly 3 difficulty cards (type: "cards", multi_select: false):\n` +
    `  - Beginner: "Just starting out, need basics and simple phrases"\n` +
    `  - Intermediate: "Know some vocabulary, ready for natural conversation"\n` +
    `  - Advanced: "Comfortable with basics, want nuance and fluency"\n\n` +
    `Step 5 — Confirmation: Summarise what you've collected and ask them to confirm.\n` +
    `  Respond with a confirmation visual element (type: "confirmation") showing the summary.\n` +
    `  Set intake_progress.can_generate = true at this step.`
  );

  // Output format
  blocks.push(
    `## Output Format\n` +
    `Always respond with ONLY valid JSON — no markdown fences, no surrounding text. Use this exact structure:\n` +
    `{\n` +
    `  "text": "your conversational message to the user",\n` +
    `  "visual_elements": [\n` +
    `    {\n` +
    `      "type": "chips" | "cards" | "confirmation",\n` +
    `      "data": [...chips or cards or confirmation object],\n` +
    `      "multi_select": true | false\n` +
    `    }\n` +
    `  ],\n` +
    `  "intake_progress": {\n` +
    `    "current_step": 1,\n` +
    `    "total_steps": 5,\n` +
    `    "step_label": "Choosing a category",\n` +
    `    "can_generate": false\n` +
    `  },\n` +
    `  "path_preview": {\n` +
    `    "title": "optional, appears from step 2 onward",\n` +
    `    "description": "optional",\n` +
    `    "difficulty": "optional",\n` +
    `    "estimated_words": null,\n` +
    `    "scenes": []\n` +
    `  }\n` +
    `}\n\n` +
    `Rules:\n` +
    `- visual_elements is always an array (can be empty [])\n` +
    `- path_preview builds incrementally: title appears at step 2, estimated_words and scenes appear at step 4-5\n` +
    `- Use emojis in chip labels and card titles to make them visually friendly\n` +
    `- Chip ids should be lowercase_snake_case\n` +
    `- intake_progress.step_label should be a short human-readable label like "Choosing a category" or "Picking difficulty"\n` +
    `- Keep "text" messages to 1-3 sentences — friendly and to the point`
  );

  // Learner profile
  if (context.adaptiveContext) {
    blocks.push(
      `## Learner Profile\n${context.adaptiveContext}\n\n` +
      `Use this learner profile to calibrate difficulty suggestions. ` +
      `If they appear to be a beginner, lead with the beginner difficulty option. ` +
      `If they're advanced, acknowledge their level warmly.`
    );
  }

  // Prefill scenario
  if (context.prefillScenario) {
    blocks.push(
      `## Pre-filled Scenario\n` +
      `The user has already indicated they want to learn about: "${context.prefillScenario}"\n` +
      `Skip step 1 (category) and start at step 2 (scenario). ` +
      `Acknowledge the pre-selected topic warmly and present sub-scenario options.`
    );
  }

  // Current intake state
  const intakeKeys = Object.keys(context.currentIntake).filter(
    (k) => context.currentIntake[k as keyof StudioIntakeData] !== undefined
  );
  if (intakeKeys.length > 0) {
    const summary = intakeKeys
      .map((k) => {
        const val = context.currentIntake[k as keyof StudioIntakeData];
        return `${k}: ${Array.isArray(val) ? val.join(', ') : String(val)}`;
      })
      .join('\n');
    blocks.push(
      `## Already Collected\n` +
      `The following intake data has already been gathered in this session:\n${summary}\n\n` +
      `Do not re-ask for information already collected. Continue from the next uncompleted step.`
    );
  }

  return blocks.join('\n\n');
}

// ---- Sub-scenario chip generation prompt ----

export function buildSubScenarioPrompt(scenario: string, languageName: string): string {
  return (
    `Generate 5-8 specific sub-scenario chips for someone learning ${languageName} in the context of: "${scenario}"\n\n` +
    `Each chip should represent a distinct, concrete situation within that scenario — not a vocabulary category, but an actual scene a learner might find themselves in.\n\n` +
    `OUTPUT FORMAT: Respond with ONLY a valid JSON array — no markdown fences, no surrounding text:\n` +
    `[\n` +
    `  { "id": "sub_1", "label": "Ordering street food", "emoji": "🍜" },\n` +
    `  { "id": "sub_2", "label": "Reading a restaurant menu", "emoji": "📋" }\n` +
    `]\n\n` +
    `Rules:\n` +
    `- ids must be sub_1, sub_2, sub_3, etc.\n` +
    `- Labels should be short action phrases (3-6 words), starting with a verb or noun\n` +
    `- Each emoji should visually represent the situation\n` +
    `- Sub-scenarios should feel distinct from each other — no overlapping situations\n` +
    `- Make them specific to the ${languageName}-speaking cultural context where relevant`
  );
}

// ---- Full path generation prompt ----

export function buildStudioPathGenerationPrompt(
  intakeData: StudioIntakeData,
  languageName: string,
  knownVocabulary?: string[]
): string {
  const blocks: string[] = [];

  // Identity
  blocks.push(
    `You are an expert ${languageName} language learning curriculum designer. ` +
    `Create a complete, dialogue-based learning path based on the intake data below. ` +
    `The path should feel natural, culturally authentic, and highly practical for a real-world learner.`
  );

  // Intake summary
  const intakeSummary: string[] = [];
  if (intakeData.category) intakeSummary.push(`Category: ${intakeData.category}`);
  if (intakeData.scenario) intakeSummary.push(`Scenario: ${intakeData.scenario}`);
  if (intakeData.sub_scenarios?.length) intakeSummary.push(`Specific situations: ${intakeData.sub_scenarios.join(', ')}`);
  if (intakeData.difficulty) intakeSummary.push(`Difficulty level: ${intakeData.difficulty}`);
  if (intakeData.focus_areas?.length) intakeSummary.push(`Focus areas: ${intakeData.focus_areas.join(', ')}`);

  blocks.push(`## Learner Request\n${intakeSummary.join('\n')}`);

  // Vocabulary exclusion
  if (knownVocabulary && knownVocabulary.length > 0) {
    blocks.push(
      `## Vocabulary to Avoid\n` +
      `The learner already knows these words — do NOT include them as vocabulary items:\n` +
      knownVocabulary.join(', ')
    );
  }

  // Generation rules
  const difficultyGuidance: Record<string, string> = {
    beginner: 'Use simple, high-frequency vocabulary. Dialogues should be short (4-5 lines) and use basic sentence structures. Avoid complex grammar.',
    intermediate: 'Mix common and moderately complex vocabulary. Dialogues can be 5-6 lines with natural conversational flow. Include some idiomatic expressions.',
    advanced: 'Include nuanced vocabulary, cultural expressions, and idioms. Dialogues should feel authentically fluent — 5-6 lines with natural complexity.',
  };
  const diffLevel = intakeData.difficulty ?? 'intermediate';
  const diffGuide = difficultyGuidance[diffLevel] ?? difficultyGuidance.intermediate;

  blocks.push(
    `## Generation Rules\n` +
    `- Generate 3-5 scenes, each covering a distinct sub-situation within the overall scenario\n` +
    `- Each scene must have 4-6 vocabulary words AND 4-6 dialogue lines\n` +
    `- Vocabulary words should include the key terms actually used in that scene's dialogue\n` +
    `- Dialogues must be natural conversation — not textbook-stiff\n` +
    `- Speakers should have contextually appropriate names/roles (e.g., Vendor, Customer, Colleague, Host)\n` +
    `- Include romanization for all non-Latin script words\n` +
    `- Make content culturally appropriate for ${languageName}-speaking contexts\n` +
    `- Difficulty guidance: ${diffGuide}`
  );

  // Output format
  blocks.push(
    `## Output Format\n` +
    `Respond with ONLY valid JSON — no markdown fences, no surrounding text:\n` +
    `{\n` +
    `  "pathTitle": "string (short, evocative title for the path)",\n` +
    `  "pathDescription": "string (1-2 sentences describing what the learner will be able to do after completing this path)",\n` +
    `  "scenes": [\n` +
    `    {\n` +
    `      "title": "string (short scene title, e.g. 'Ordering at the Counter')",\n` +
    `      "description": "string (2-3 sentences setting the scene context — where, who, what's happening)",\n` +
    `      "words": [\n` +
    `        {\n` +
    `          "text": "word in ${languageName}",\n` +
    `          "romanization": "phonetic romanization, or null for Latin-script languages",\n` +
    `          "meaning": "English meaning",\n` +
    `          "part_of_speech": "noun | verb | adjective | adverb | phrase | particle | classifier | other"\n` +
    `        }\n` +
    `      ],\n` +
    `      "dialogue": [\n` +
    `        {\n` +
    `          "speaker": "role name (e.g. Vendor, Customer, Host)",\n` +
    `          "text_target": "line in ${languageName}",\n` +
    `          "text_en": "English translation"\n` +
    `        }\n` +
    `      ]\n` +
    `    }\n` +
    `  ]\n` +
    `}\n\n` +
    `Additional rules:\n` +
    `- pathTitle should be concise and inspiring (e.g. "Street Food Adventures", "The Business Lunch")\n` +
    `- Each scene title should give a clear picture of the micro-situation\n` +
    `- Dialogue speakers should be consistent within a scene but can vary across scenes\n` +
    `- Words must appear in or be directly relevant to that scene's dialogue\n` +
    `- Do not repeat the same vocabulary word across multiple scenes\n` +
    `- Romanization must be included for all non-Latin scripts (Thai, Japanese, Chinese, Arabic, Korean, etc.)`
  );

  return blocks.join('\n\n');
}
