import { LANGUAGE_VOICE_MAP } from './voice-map';
import type { SupportedLanguageCode } from '@/types/audio';

const LABELS: Record<string, string> = {
  'pt-BR': 'Portuguese (Brazil)',
  'id-ID': 'Indonesian',
  'es-MX': 'Spanish (Mexico)',
  'ja-JP': 'Japanese',
  'en-US': 'English',
};

/**
 * What the mic is told to listen for, and how to say so on screen.
 *
 * Always the target language's own code (pt -> pt-BR), never the phone's
 * locale: a chip that names the language is what makes a transcript in the
 * wrong language diagnosable at a glance.
 */
export function recognitionLang(languageCode: string): { bcp47: string; label: string } {
  const bcp47 = LANGUAGE_VOICE_MAP[languageCode as SupportedLanguageCode]?.bcp47 ?? languageCode;
  return { bcp47, label: LABELS[bcp47] ?? bcp47 };
}
