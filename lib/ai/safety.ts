import type { MnemonicCandidate } from '@/types/ai';

// Blocklist of slurs, explicit content, and offensive stereotypes
// This is a basic list — extend as needed
const BLOCKED_WORDS = [
  // Slurs and hate speech
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'kike', 'spic',
  'chink', 'wetback', 'beaner', 'gook', 'coon', 'tranny', 'dyke',
  // Explicit sexual content
  'fuck', 'fucking', 'shit', 'cock', 'dick', 'pussy', 'cunt', 'whore',
  'slut', 'bitch', 'porn', 'hentai', 'masturbat', 'orgasm', 'ejaculat',
  // Violence / gore
  'murder', 'rape', 'molest', 'genocide', 'torture', 'dismember',
  'mutilate', 'decapitat',
];

// Patterns that indicate offensive stereotypes or problematic content
const BLOCKED_PATTERNS = [
  /all\s+(asians?|blacks?|whites?|jews?|muslims?|mexicans?)\s+(are|look|smell)/i,
  /terrorist/i,
  /slave\s*(girl|boy|woman|man)?/i,
  /nazi/i,
  /white\s*suprem/i,
  /ethnic\s*cleans/i,
];

export interface SafetyResult {
  safe: boolean;
  reason?: string;
}

export function filterMnemonicContent(candidate: MnemonicCandidate): SafetyResult {
  const textToCheck = [
    candidate.keyword,
    candidate.bridgeSentence,
    candidate.sceneDescription,
    candidate.imagePrompt,
    candidate.phoneticLink,
  ].join(' ').toLowerCase();

  // Check blocklist words
  for (const word of BLOCKED_WORDS) {
    // Match whole word or as a prefix (for variations like "fucking")
    const regex = new RegExp(`\\b${word}`, 'i');
    if (regex.test(textToCheck)) {
      return { safe: false, reason: `Content contains blocked term` };
    }
  }

  // Check offensive patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(textToCheck)) {
      return { safe: false, reason: `Content matches blocked pattern` };
    }
  }

  return { safe: true };
}
