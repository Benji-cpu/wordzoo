import type { ProficiencyTier } from '@/lib/services/learner-profile-service';

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  /** Per-tier register awareness text for tutor prompts */
  registerAwareness: Record<ProficiencyTier, string>;
  /** Cultural context string for scene anchor image generation */
  sceneAnchorCulture: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    registerAwareness: {
      beginner:
        `## Register Awareness (Formal vs Informal)\n` +
        `Indonesian has distinct formal (bahasa baku) and informal registers. This is essential for natural communication.\n` +
        `Common register pairs: saya/aku/gue (I), tidak/nggak/gak (not), apa kabar/gimana (how are you), terima kasih/makasih (thanks), sudah/udah (already), belum/belom (not yet), ini/nih (this), itu/tuh (that).\n` +
        `At beginner level: use formal Indonesian with informal in parentheses. E.g., "**saya** (or **aku/gue** casually)".\n` +
        `Only introduce informal variants when the formal form has been learned first.`,
      intermediate:
        `## Register Awareness (Formal vs Informal)\n` +
        `Indonesian has distinct formal (bahasa baku) and informal registers. This is essential for natural communication.\n` +
        `Common register pairs: saya/aku/gue (I), tidak/nggak/gak (not), apa kabar/gimana (how are you), terima kasih/makasih (thanks), sudah/udah (already), belum/belom (not yet), ini/nih (this), itu/tuh (that).\n` +
        `At intermediate level: can switch to casual register naturally. Explain register differences when they come up.\n` +
        `If the student uses formal when casual would be more natural (or vice versa), mention it briefly.`,
      advanced:
        `## Register Awareness (Formal vs Informal)\n` +
        `Indonesian has distinct formal (bahasa baku) and informal registers. This is essential for natural communication.\n` +
        `Common register pairs: saya/aku/gue (I), tidak/nggak/gak (not), apa kabar/gimana (how are you), terima kasih/makasih (thanks), sudah/udah (already), belum/belom (not yet), ini/nih (this), itu/tuh (that).\n` +
        `At advanced level: use natural register mixing. Point out subtle register nuances (e.g., Jakarta slang vs standard informal).`,
    },
    sceneAnchorCulture: 'Balinese location',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    registerAwareness: {
      beginner:
        `## Register Awareness (Tú vs Usted)\n` +
        `Spanish distinguishes between informal "tú" and formal "usted" for "you". This affects verb conjugation.\n` +
        `Key pairs: tú/usted (you), ¿Cómo estás?/¿Cómo está? (How are you?), tienes/tiene (you have), quieres/quiere (you want).\n` +
        `At beginner level: teach "tú" as default for everyday conversation. Mention "usted" in parentheses for formal contexts.\n` +
        `Only introduce usted forms when the tú form has been learned first.`,
      intermediate:
        `## Register Awareness (Tú vs Usted)\n` +
        `Spanish distinguishes between informal "tú" and formal "usted" for "you". This affects verb conjugation.\n` +
        `Key pairs: tú/usted (you), ¿Cómo estás?/¿Cómo está? (How are you?), tienes/tiene (you have), quieres/quiere (you want).\n` +
        `At intermediate level: switch between tú and usted naturally based on context. Explain when each is appropriate.\n` +
        `If the student uses the wrong register for the situation, mention it briefly.`,
      advanced:
        `## Register Awareness (Tú vs Usted)\n` +
        `Spanish distinguishes between informal "tú" and formal "usted" for "you". This affects verb conjugation.\n` +
        `Key pairs: tú/usted (you), ¿Cómo estás?/¿Cómo está? (How are you?), tienes/tiene (you have), quieres/quiere (you want).\n` +
        `At advanced level: use natural register mixing. Point out regional variations (vos in Argentina, ustedes vs vosotros in Spain vs Latin America).`,
    },
    sceneAnchorCulture: 'Latin American street scene',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    registerAwareness: {
      beginner:
        `## Register Awareness (Polite vs Casual)\n` +
        `Japanese has distinct politeness levels (keigo). The -masu/-desu forms are polite; dictionary forms are casual.\n` +
        `Key pairs: です/だ (is), ます/る (verb ending), ください/ちょうだい (please), すみません/ごめん (sorry).\n` +
        `At beginner level: always use polite (-masu/-desu) forms. Mention casual forms in parentheses only.\n` +
        `Only introduce casual forms when the polite form has been learned first.`,
      intermediate:
        `## Register Awareness (Polite vs Casual)\n` +
        `Japanese has distinct politeness levels (keigo). The -masu/-desu forms are polite; dictionary forms are casual.\n` +
        `Key pairs: です/だ (is), ます/る (verb ending), ください/ちょうだい (please), すみません/ごめん (sorry).\n` +
        `At intermediate level: switch between polite and casual based on context. Explain when each is appropriate.\n` +
        `If the student uses the wrong register for the situation, mention it briefly.`,
      advanced:
        `## Register Awareness (Polite vs Casual)\n` +
        `Japanese has distinct politeness levels (keigo). The -masu/-desu forms are polite; dictionary forms are casual.\n` +
        `Key pairs: です/だ (is), ます/る (verb ending), ください/ちょうだい (please), すみません/ごめん (sorry).\n` +
        `At advanced level: use natural register mixing including humble (kenjougo) and honorific (sonkeigo) forms. Point out nuances in business vs social keigo.`,
    },
    sceneAnchorCulture: 'Japanese urban setting',
  },
};

export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS[code];
}

export function getAllLanguageConfigs(): Record<string, LanguageConfig> {
  return LANGUAGE_CONFIGS;
}
