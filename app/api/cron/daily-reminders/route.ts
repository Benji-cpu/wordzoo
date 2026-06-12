import { NextRequest, NextResponse } from 'next/server';
import {
  getStreakAtRiskUsers,
  getUsersWithDueReviews,
  getWeeklyRecapRecipients,
} from '@/lib/db/email-queries';
import {
  sendEmail,
  streakReminderEmail,
  dueReviewsEmail,
  weeklyRecapEmail,
} from '@/lib/services/email-service';

export const maxDuration = 300;

/** Defensive ceiling on sends per run. */
const MAX_SENDS = 200;

/**
 * Daily retention email cron (see vercel.json). Sundays send the weekly
 * recap; other days send streak-at-risk nudges (priority) and due-review
 * reminders. No-ops cleanly when RESEND_API_KEY is unset.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  async function dispatch(to: string, content: { subject: string; html: string; text: string }) {
    if (sent + skipped >= MAX_SENDS) return;
    const result = await sendEmail({ to, ...content });
    if (result.sent) sent++;
    else if (result.skipped) skipped++;
    else if (result.error) errors.push(`${to}: ${result.error}`);
  }

  try {
    const isSunday = new Date().getUTCDay() === 0;

    if (isSunday) {
      const recipients = await getWeeklyRecapRecipients();
      for (const r of recipients) {
        await dispatch(
          r.email,
          weeklyRecapEmail({
            name: r.name,
            wordsLearned: r.words_learned,
            reviewsDone: r.reviews_done,
            xpGained: r.xp_gained,
            streak: r.current_streak,
            unsubscribeToken: r.unsubscribe_token,
          })
        );
      }
      return NextResponse.json({ mode: 'weekly_recap', recipients: recipients.length, sent, skipped, errors });
    }

    const streakUsers = await getStreakAtRiskUsers();
    const streakIds = new Set(streakUsers.map((u) => u.id));

    for (const u of streakUsers) {
      await dispatch(
        u.email,
        streakReminderEmail({
          name: u.name,
          streak: u.current_streak,
          dueCount: u.due_count,
          unsubscribeToken: u.unsubscribe_token,
        })
      );
    }

    // Due-review reminders for everyone else with a meaningful queue.
    const dueUsers = (await getUsersWithDueReviews()).filter((u) => !streakIds.has(u.id));
    for (const u of dueUsers) {
      await dispatch(
        u.email,
        dueReviewsEmail({
          name: u.name,
          dueCount: u.due_count,
          unsubscribeToken: u.unsubscribe_token,
        })
      );
    }

    return NextResponse.json({
      mode: 'daily',
      streakAtRisk: streakUsers.length,
      dueReviews: dueUsers.length,
      sent,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('Daily reminders cron error:', error);
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 });
  }
}
