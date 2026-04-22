/**
 * Maps a BCP-47-ish language code ("id", "es", "ja", ...) to the habitat
 * gradient key used by HeroCard / HabitatCard. Anything unknown → 'default'
 * which re-uses the Indonesian warm gradient.
 */

export type HabitatLanguage = 'indonesian' | 'spanish' | 'japanese' | 'default';

export function habitatFromLanguageCode(code?: string | null): HabitatLanguage {
  if (!code) return 'default';
  switch (code.toLowerCase()) {
    case 'id':
    case 'ind':
      return 'indonesian';
    case 'es':
    case 'spa':
      return 'spanish';
    case 'ja':
    case 'jpn':
      return 'japanese';
    default:
      return 'default';
  }
}
