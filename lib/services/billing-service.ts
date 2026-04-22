import type { BillingFeature } from '@/types/api';
import {
  getUserById,
  getSubscriptionByUserId,
  getDailyUsage,
  incrementDailyUsageWordsLearned,
  incrementDailyUsageTutorMessages,
  incrementDailyUsageHandsFreeSeconds,
  incrementDailyUsageRegenerations,
  resetAllDailyUsage,
  getExpiringSubscriptions,
  updateSubscriptionStatus,
  updateUserSubscriptionTier,
} from '@/lib/db/queries';

function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? [];
  return adminEmails.includes(email.toLowerCase());
}

const FREE_LIMITS: Record<string, { field: string; limit: number }> = {
  new_word: { field: 'words_learned', limit: 5 },
  tutor_message: { field: 'tutor_messages', limit: 3 },
  hands_free: { field: 'hands_free_seconds', limit: 300 },
  regenerate_mnemonic: { field: 'regenerations', limit: 2 },
};

const PREMIUM_ONLY_FEATURES = new Set<string>([
  'custom_path',
  'offline_download',
]);

const UPGRADE_MESSAGES: Record<string, string> = {
  new_word: 'You\'ve reached your daily word limit. Upgrade to Premium for unlimited learning!',
  tutor_message: 'You\'ve used all your free tutor messages today. Upgrade for unlimited conversations!',
  hands_free: 'You\'ve reached your daily hands-free time limit. Upgrade for unlimited hands-free learning!',
  regenerate_mnemonic: 'You\'ve used all your free mnemonic regenerations today. Upgrade for unlimited creativity!',
  custom_path: 'Custom paths are a Premium feature. Upgrade to create personalized learning paths!',
  offline_download: 'Offline downloads are a Premium feature. Upgrade to learn anywhere!',
  studio_path: 'Create rich dialogue paths with Path Studio! $2.99 per path, or upgrade to Premium for unlimited.',
};

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export interface AccessCheckResult {
  allowed: boolean;
  reason: string | null;
  currentUsage: number | null;
  limit: number | null;
  upgradeMessage: string | null;
}

export async function checkAccess(
  userId: string,
  feature: BillingFeature
): Promise<AccessCheckResult> {
  const user = await getUserById(userId);
  if (!user) {
    return { allowed: false, reason: 'User not found', currentUsage: null, limit: null, upgradeMessage: null };
  }

  // Admin users bypass all billing limits
  if (isAdminUser(user.email)) {
    return { allowed: true, reason: null, currentUsage: null, limit: null, upgradeMessage: null };
  }

  // Premium users: check for subscription expiry defensively
  if (user.subscription_tier === 'premium') {
    const subscription = await getSubscriptionByUserId(userId);
    if (subscription && subscription.status === 'active') {
      // Defensive expiry check
      if (new Date(subscription.current_period_end) < new Date()) {
        await updateUserSubscriptionTier(userId, 'free');
        await updateSubscriptionStatus(subscription.stripe_subscription_id, 'canceled');
        // Fall through to free tier checks
      } else {
        return { allowed: true, reason: null, currentUsage: null, limit: null, upgradeMessage: null };
      }
    } else if (!subscription) {
      // No subscription record but marked as premium — allow (could be manual upgrade)
      return { allowed: true, reason: null, currentUsage: null, limit: null, upgradeMessage: null };
    }
  }

  // Studio paths: free users can purchase per-path (not premium-gated)
  if (feature === 'studio_path') {
    return {
      allowed: false,
      reason: 'requires_purchase',
      currentUsage: null,
      limit: null,
      upgradeMessage: 'Create rich dialogue paths with Path Studio! $2.99 per path, or upgrade to Premium for unlimited.',
    };
  }

  // Premium-only features: hard gate
  if (PREMIUM_ONLY_FEATURES.has(feature)) {
    return {
      allowed: false,
      reason: 'premium_only',
      currentUsage: null,
      limit: null,
      upgradeMessage: UPGRADE_MESSAGES[feature] ?? 'Upgrade to Premium to access this feature.',
    };
  }

  // Free tier: check daily usage
  const limitConfig = FREE_LIMITS[feature];
  if (!limitConfig) {
    // Unknown feature — allow by default
    return { allowed: true, reason: null, currentUsage: null, limit: null, upgradeMessage: null };
  }

  const today = getTodayDate();
  const usage = await getDailyUsage(userId, today);
  const currentValue = usage ? (usage as unknown as Record<string, number>)[limitConfig.field] : 0;

  if (currentValue >= limitConfig.limit) {
    return {
      allowed: false,
      reason: 'daily_limit_reached',
      currentUsage: currentValue,
      limit: limitConfig.limit,
      upgradeMessage: UPGRADE_MESSAGES[feature] ?? 'Upgrade to Premium for unlimited access.',
    };
  }

  return {
    allowed: true,
    reason: null,
    currentUsage: currentValue,
    limit: limitConfig.limit,
    upgradeMessage: null,
  };
}

const INCREMENT_FNS: Record<string, (userId: string, date: string, amount: number) => Promise<void>> = {
  new_word: incrementDailyUsageWordsLearned,
  tutor_message: incrementDailyUsageTutorMessages,
  hands_free: incrementDailyUsageHandsFreeSeconds,
  regenerate_mnemonic: incrementDailyUsageRegenerations,
};

export async function incrementUsage(
  userId: string,
  feature: BillingFeature,
  amount: number = 1
): Promise<void> {
  // Skip usage tracking for premium and admin users
  const user = await getUserById(userId);
  if (user?.subscription_tier === 'premium') return;
  if (isAdminUser(user?.email)) return;

  const incrementFn = INCREMENT_FNS[feature];
  if (!incrementFn) return;

  const today = getTodayDate();
  await incrementFn(userId, today, amount);
}

export async function getDailyUsageForUser(userId: string): Promise<{
  words_learned: { current: number; limit: number };
  tutor_messages: { current: number; limit: number };
  hands_free_seconds: { current: number; limit: number };
  regenerations: { current: number; limit: number };
}> {
  const today = getTodayDate();
  const usage = await getDailyUsage(userId, today);

  return {
    words_learned: {
      current: usage?.words_learned ?? 0,
      limit: FREE_LIMITS.new_word.limit,
    },
    tutor_messages: {
      current: usage?.tutor_messages ?? 0,
      limit: FREE_LIMITS.tutor_message.limit,
    },
    hands_free_seconds: {
      current: usage?.hands_free_seconds ?? 0,
      limit: FREE_LIMITS.hands_free.limit,
    },
    regenerations: {
      current: usage?.regenerations ?? 0,
      limit: FREE_LIMITS.regenerate_mnemonic.limit,
    },
  };
}

export async function getSubscriptionStatus(userId: string): Promise<{
  tier: string;
  plan: string | null;
  status: string | null;
  currentPeriodEnd: Date | null;
}> {
  const user = await getUserById(userId);
  const subscription = await getSubscriptionByUserId(userId);

  return {
    tier: user?.subscription_tier ?? 'free',
    plan: subscription?.plan ?? null,
    status: subscription?.status ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
  };
}

export async function resetDailyLimits(): Promise<void> {
  await resetAllDailyUsage();
}

export async function checkExpiringSubscriptions(): Promise<void> {
  const expiring = await getExpiringSubscriptions();

  for (const sub of expiring) {
    await updateSubscriptionStatus(sub.stripe_subscription_id, 'canceled');
    await updateUserSubscriptionTier(sub.user_id, 'free');
  }
}
