import {
  getRecentNudges,
  insertNudge,
  updateNudge,
  getWeakWords,
  getUserDueWords,
  getUserStreak,
} from '@/lib/db';
import { checkAccess } from '@/lib/services/billing-service';

export interface NudgeResult {
  id: string;
  type: string;
  message: string;
  suggestedMode: string;
  context: Record<string, unknown> | null;
}

const NUDGE_MESSAGES: Record<string, { message: string; mode: string }> = {
  weak_words: {
    message: 'Some words need extra practice. Chat with the tutor to strengthen them!',
    mode: 'word_review',
  },
  post_lesson: {
    message: 'Great lesson! Practice what you just learned in a conversation.',
    mode: 'free_chat',
  },
  grammar_pattern: {
    message: 'Want to brush up on grammar? The tutor can help with patterns.',
    mode: 'grammar_glimpse',
  },
  review_streak: {
    message: 'You have words due for review. Try practicing them in conversation!',
    mode: 'word_review',
  },
  return_visit: {
    message: 'Welcome back! A quick tutor session will keep your skills sharp.',
    mode: 'free_chat',
  },
};

const COOLDOWN_SHOWN_MS = 24 * 60 * 60 * 1000; // 24h
const COOLDOWN_DISMISSED_MS = 72 * 60 * 60 * 1000; // 72h

export async function getActiveNudge(
  userId: string,
  languageId: string,
  pageContext: string
): Promise<NudgeResult | null> {
  // Suppress nudge if user has no tutor messages remaining
  const access = await checkAccess(userId, 'tutor_message');
  if (!access.allowed) return null;

  // Check recent nudges for cooldown
  const since = new Date(Date.now() - COOLDOWN_DISMISSED_MS);
  const recentNudges = await getRecentNudges(userId, since);

  for (const nudge of recentNudges) {
    // If any nudge was dismissed within 72h, suppress all nudges
    if (nudge.dismissed_at) return null;
    // If any nudge was shown within 24h, suppress
    if (nudge.shown_at && Date.now() - new Date(nudge.shown_at).getTime() < COOLDOWN_SHOWN_MS) {
      return null;
    }
  }

  // Evaluate triggers in priority order
  // 1. Weak words (ease_factor < 2.0)
  const weakWords = await getWeakWords(userId, languageId, 2.0);
  if (weakWords.length >= 3) {
    return createNudge(userId, 'weak_words', {
      wordCount: weakWords.length,
      words: weakWords.slice(0, 3).map((w) => w.text),
    });
  }

  // 2. Due words for review
  const dueWords = await getUserDueWords(userId, languageId, 5);
  if (dueWords.length >= 5) {
    return createNudge(userId, 'review_streak', {
      dueCount: dueWords.length,
    });
  }

  // 3. Post-lesson (on dashboard after learning)
  if (pageContext === 'dashboard') {
    const streak = await getUserStreak(userId);
    if (streak.current_streak > 0) {
      return createNudge(userId, 'return_visit', null);
    }
  }

  return null;
}

async function createNudge(
  userId: string,
  type: string,
  context: Record<string, unknown> | null
): Promise<NudgeResult> {
  const nudge = await insertNudge(userId, type, context);
  const config = NUDGE_MESSAGES[type] ?? NUDGE_MESSAGES.return_visit;
  return {
    id: nudge.id,
    type,
    message: config.message,
    suggestedMode: config.mode,
    context,
  };
}

export async function recordNudgeShown(nudgeId: string): Promise<void> {
  await updateNudge(nudgeId, { shownAt: new Date().toISOString() });
}

export async function recordNudgeDismissed(nudgeId: string): Promise<void> {
  await updateNudge(nudgeId, { dismissedAt: new Date().toISOString() });
}

export async function recordNudgeAccepted(nudgeId: string): Promise<void> {
  await updateNudge(nudgeId, { acceptedAt: new Date().toISOString() });
}
