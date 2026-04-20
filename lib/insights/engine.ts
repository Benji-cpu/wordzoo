import {
  INSIGHTS,
  DAILY_INSIGHT_BUDGET,
  EXISTING_USER_SCENE_THRESHOLD,
  type InsightDefinition,
  type TriggerContext,
} from './data';

export interface InsightUserState {
  seenInsightIds: Set<string>;
  insightsShownToday: number;
  totalMnemonicsViewed: number;
  totalScenesCompleted: number;
  totalWordsLearned: number;
}

/**
 * Returns the single best insight to show for the given context, or null.
 * Pure function — no side effects.
 */
export function getEligibleInsight(
  context: TriggerContext,
  userState: InsightUserState
): InsightDefinition | null {
  const {
    seenInsightIds,
    insightsShownToday,
    totalMnemonicsViewed,
    totalScenesCompleted,
    totalWordsLearned,
  } = userState;

  // Budget check
  if (insightsShownToday >= DAILY_INSIGHT_BUDGET) return null;

  // Existing users skip early insights (1-4)
  const isExistingUser = totalScenesCompleted >= EXISTING_USER_SCENE_THRESHOLD;

  const candidates = INSIGHTS.filter((insight) => {
    // Must match the current context
    if (insight.triggerContext !== context) return false;

    // Must not have been seen before
    if (seenInsightIds.has(insight.id)) return false;

    // Existing users skip insights 1-4
    if (isExistingUser && insight.priority <= 4) return false;

    // Check trigger condition
    const cond = insight.triggerCondition;
    switch (cond.type) {
      case 'nth_encounter':
        if (cond.context === 'mnemonic_viewed') {
          return totalMnemonicsViewed >= cond.n;
        }
        return false;

      case 'first_encounter':
        // Just needs to be unseen (already checked above)
        return true;

      case 'milestone':
        if (cond.metric === 'words_learned') {
          return totalWordsLearned >= cond.value;
        }
        return false;

      default:
        return false;
    }
  });

  if (candidates.length === 0) return null;

  // Sort by priority (lower = higher priority) and return the best one
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0];
}
