import type { GeneratedScene } from './content-generation';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGeneratedScene(scene: GeneratedScene): ValidationResult {
  const errors: string[] = [];

  // Check required top-level fields
  if (!scene.title?.trim()) errors.push('Scene title is empty');
  if (!scene.description?.trim()) errors.push('Scene description is empty');
  if (!scene.scene_context?.trim()) errors.push('Scene context is empty');
  if (!scene.anchor_image_prompt?.trim()) errors.push('Anchor image prompt is empty');

  // Check words
  if (!scene.words || scene.words.length === 0) {
    errors.push('No words generated');
  } else {
    for (const w of scene.words) {
      if (!w.text?.trim()) errors.push('Word has empty text');
      if (!w.meaning_en?.trim()) errors.push(`Word "${w.text}" has empty meaning_en`);
      if (!w.part_of_speech?.trim()) errors.push(`Word "${w.text}" has empty part_of_speech`);
    }
  }

  // Check mnemonics
  if (!scene.mnemonics || scene.mnemonics.length === 0) {
    errors.push('No mnemonics generated');
  } else {
    for (const m of scene.mnemonics) {
      if (!m.word_text?.trim()) errors.push('Mnemonic has empty word_text');
      if (!m.keyword_text?.trim()) errors.push(`Mnemonic for "${m.word_text}" has empty keyword_text`);
      if (!m.scene_description?.trim()) errors.push(`Mnemonic for "${m.word_text}" has empty scene_description`);
      if (!m.bridge_sentence?.trim()) errors.push(`Mnemonic for "${m.word_text}" has empty bridge_sentence`);

      // Check keyword is not identical to target word
      if (m.keyword_text?.trim().toLowerCase() === m.word_text?.trim().toLowerCase()) {
        errors.push(`Mnemonic keyword "${m.keyword_text}" is identical to target word "${m.word_text}"`);
      }
    }
  }

  // Check dialogues
  if (!scene.dialogues || scene.dialogues.length === 0) {
    errors.push('No dialogue lines generated');
  } else {
    for (const d of scene.dialogues) {
      if (!d.speaker?.trim()) errors.push('Dialogue line has empty speaker');
      if (!d.text_target?.trim()) errors.push('Dialogue line has empty text_target');
      if (!d.text_en?.trim()) errors.push('Dialogue line has empty text_en');
    }
  }

  // Check that all target words appear in at least one dialogue line
  if (scene.words && scene.dialogues && scene.dialogues.length > 0) {
    const allDialogueText = scene.dialogues.map(d => d.text_target.toLowerCase()).join(' ');
    for (const w of scene.words) {
      if (!allDialogueText.includes(w.text.toLowerCase())) {
        errors.push(`Word "${w.text}" does not appear in any dialogue line`);
      }
    }
  }

  // Check phrases
  if (!scene.phrases || scene.phrases.length === 0) {
    errors.push('No phrases generated');
  } else {
    for (const p of scene.phrases) {
      if (!p.text_target?.trim()) errors.push('Phrase has empty text_target');
      if (!p.text_en?.trim()) errors.push('Phrase has empty text_en');
      if (!p.literal_translation?.trim()) errors.push(`Phrase "${p.text_target}" has empty literal_translation`);
    }
  }

  // Check patterns
  if (!scene.patterns || scene.patterns.length === 0) {
    errors.push('No pattern exercises generated');
  } else {
    const validTypes = ['fill_blank', 'sentence_build', 'typed_translation'];
    for (const p of scene.patterns) {
      if (!p.prompt?.trim()) errors.push('Pattern exercise has empty prompt');
      if (!p.correct_answer?.trim()) errors.push(`Pattern "${p.prompt}" has empty correct_answer`);
      if (!p.pattern_template?.trim()) errors.push(`Pattern "${p.prompt}" has empty pattern_template`);
      if (!p.pattern_en?.trim()) errors.push(`Pattern "${p.prompt}" has empty pattern_en`);
      if (!p.explanation?.trim()) errors.push(`Pattern "${p.prompt}" has empty explanation`);
      if (!p.distractors || p.distractors.length === 0) {
        errors.push(`Pattern "${p.prompt}" has no distractors`);
      }
      if (!validTypes.includes(p.exercise_type)) {
        errors.push(`Pattern "${p.prompt}" has invalid exercise_type: "${p.exercise_type}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
