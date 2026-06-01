import type {
  SceneDialogue,
  ScenePhraseWithMnemonics,
} from '@/types/database';

/**
 * Learner personalization for scene content.
 *
 * The seed content represents the learner with a placeholder persona (for
 * Portuguese: a woman named "Ana"). Feedback asked that lessons use the
 * player's real name, and — because Portuguese (like Spanish, French, etc.)
 * inflects for gender — that self-referential wording agree with the
 * player's gender ("Eu sou **o** Carlos" / "obrigad**o**" for a man).
 *
 * This module rewrites only the parts we can change *safely*:
 *   - The learner's self / second-person name in unambiguous copula
 *     patterns ("Eu sou a Ana", "Sou a Ana", "Você é a Ana") — never a
 *     bare "Ana", because the seed reuses "Ana" as a separate NPC in some
 *     scenes ("Esta é a Ana, minha amiga").
 *   - A small, curated set of gendered tokens that agree with the learner:
 *     obrigada/obrigado, bem-vinda/bem-vindo, (a sua vizinha)/(o seu vizinho).
 *
 * Crucially it also NORMALIZES the seed's inconsistent learner gender (the
 * Portuguese content says "Obrigada" in one scene and "Obrigado" in another)
 * to the player's chosen gender. Anything outside these rules is left
 * untouched, so we never emit broken agreement (e.g. "meu mala").
 */

export type LearnerGender = 'male' | 'female';

export interface LearnerIdentity {
  /** Preferred first name for lessons (falls back to the OAuth first name). */
  firstName: string | null;
  /** Grammatical gender for agreement. null → leave the seed forms as-is. */
  gender: LearnerGender | null;
}

/** Placeholder learner persona baked into the seed content, by language code. */
const PLACEHOLDER: Record<string, { name: string }> = {
  pt: { name: 'Ana' },
};

/** Returns the first whitespace-delimited token of a full name, or null. */
export function firstNameOf(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  const token = fullName.trim().split(/\s+/)[0];
  return token && token.length > 0 ? token : null;
}

/** True when the given language has personalization rules implemented. */
export function isPersonalizableLanguage(langCode: string | null | undefined): boolean {
  return !!langCode && langCode in PLACEHOLDER;
}

/** Apply the casing of `sample` (first char) to `replacement`. */
function matchLeadingCase(sample: string, replacement: string): string {
  if (!sample) return replacement;
  const first = sample[0];
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** Escape a literal string for safe use inside a RegExp. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Set a gendered token to the target gender wherever its feminine or
 * masculine form appears as a whole word/phrase. Case of the first letter is
 * preserved. No-op when gender is unknown.
 */
function setGenderedForm(
  text: string,
  fem: string,
  masc: string,
  gender: LearnerGender | null,
): string {
  if (!gender) return text;
  const target = gender === 'male' ? masc : fem;
  const re = new RegExp(`\\b(${escapeRegExp(fem)}|${escapeRegExp(masc)})\\b`, 'gi');
  return text.replace(re, (m) => matchLeadingCase(m, target));
}

interface PtOptions {
  name: string | null;
  gender: LearnerGender | null;
  /** 'learner' → the player is speaking; 'other' → an NPC is speaking. */
  role: 'learner' | 'other';
}

/** Rewrite a Portuguese target-language string for the learner. */
function personalizePtTarget(text: string, { name, gender, role }: PtOptions): string {
  let out = text;

  // Learner self / second-person introduction. Only the copula patterns —
  // never a bare "Ana" (which can be an NPC elsewhere).
  if (name) {
    out = out.replace(
      /\b(Eu sou|Sou|Você é|Voce é)\s+(a|o)\s+Ana\b/g,
      (_m, copula: string, article: string) => {
        const art = gender === 'male' ? 'o' : gender === 'female' ? 'a' : article;
        return `${copula} ${art} ${name}`;
      },
    );
  }

  // "Welcome" agrees with the person being addressed (the learner) — applies
  // regardless of who is speaking.
  out = setGenderedForm(out, 'bem-vinda', 'bem-vindo', gender);

  // First-person self-agreement — only when the learner is the speaker, so we
  // never flip an NPC's own "Obrigado".
  if (role === 'learner') {
    out = setGenderedForm(out, 'obrigada', 'obrigado', gender);
    out = setGenderedForm(out, 'a sua vizinha', 'o seu vizinho', gender);
  }

  return out;
}

/** Rewrite an English helper string (name only — English has no agreement). */
function personalizeEn(text: string, name: string | null): string {
  if (!name) return text;
  // Self / second-person only ("I am Ana", "Are you Ana?", "You are Ana") —
  // never "This is Ana" (an NPC introduction in some scenes).
  return text.replace(
    /\b(I am|I'm|Are you|You are)\s+Ana\b/g,
    (_m, lead: string) => `${lead} ${name}`,
  );
}

/**
 * Personalize a scene's dialogues + phrases for the given learner. Returns
 * new arrays (inputs are not mutated). A no-op when the language is not
 * personalizable or the learner has no name/gender to apply.
 */
export function personalizeSceneContent<
  D extends SceneDialogue,
  P extends ScenePhraseWithMnemonics,
>(
  dialogues: D[],
  phrases: P[],
  langCode: string | null | undefined,
  identity: LearnerIdentity,
): { dialogues: D[]; phrases: P[] } {
  if (!isPersonalizableLanguage(langCode)) return { dialogues, phrases };
  if (!identity.firstName && !identity.gender) return { dialogues, phrases };

  const name = identity.firstName;
  const gender = identity.gender;

  const newDialogues = dialogues.map((d) => {
    const role: 'learner' | 'other' = d.speaker === 'You' ? 'learner' : 'other';
    return {
      ...d,
      text_target: personalizePtTarget(d.text_target, { name, gender, role }),
      text_target_informal: d.text_target_informal
        ? personalizePtTarget(d.text_target_informal, { name, gender, role })
        : d.text_target_informal,
      text_en: personalizeEn(d.text_en, name),
    };
  });

  // Phrases have no speaker; the only learner-name/gendered phrases in the
  // seed are the player's own ("Eu sou a Ana.", "Boa tarde, obrigada!"), so
  // treat them as learner-spoken. The copula guard still protects NPC lines
  // like "Esta é a Ana, minha amiga." (no copula match → untouched).
  const newPhrases = phrases.map((p) => ({
    ...p,
    text_target: personalizePtTarget(p.text_target, { name, gender, role: 'learner' }),
    text_target_informal: p.text_target_informal
      ? personalizePtTarget(p.text_target_informal, { name, gender, role: 'learner' })
      : p.text_target_informal,
    text_en: personalizeEn(p.text_en, name),
    literal_translation: p.literal_translation
      ? personalizeEn(p.literal_translation, name)
      : p.literal_translation,
  }));

  return { dialogues: newDialogues, phrases: newPhrases };
}
