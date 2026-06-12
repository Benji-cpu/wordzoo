import { Resend } from 'resend';

/**
 * Retention email sender. Degrades gracefully: without RESEND_API_KEY every
 * send is skipped (logged, non-fatal) so the cron stays green until the key
 * lands in Vercel env. Until a custom domain is verified in Resend, use the
 * test sender (onboarding@resend.dev) — it only delivers to the account
 * owner's inbox, which is fine for validation.
 */

const FROM = process.env.EMAIL_FROM ?? 'WordZoo <onboarding@resend.dev>';

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:8000';
}

export interface SendResult {
  sent: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email-service] RESEND_API_KEY not set, skipping send to ${opts.to}`);
    return { sent: false, skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'send failed' };
  }
}

// ---- Templates ----------------------------------------------------------

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function firstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] ?? 'there';
}

function layout(body: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#faf7f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:20px;font-weight:800;color:#e2742d;margin:0 0 24px;">WordZoo</p>
    ${body}
    <p style="font-size:12px;color:#9a8f80;margin-top:32px;border-top:1px solid #eee5d8;padding-top:16px;">
      You're getting this because daily reminders are on.
      <a href="${unsubscribeUrl}" style="color:#9a8f80;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

function unsubscribeUrlFor(token: string): string {
  return `${appUrl()}/unsubscribe/${token}`;
}

export function streakReminderEmail(p: {
  name: string | null;
  streak: number;
  dueCount: number;
  unsubscribeToken: string;
}): EmailContent {
  const unsubscribeUrl = unsubscribeUrlFor(p.unsubscribeToken);
  const subject = `🔥 Your ${p.streak}-day streak is on the line`;
  const reviewLine =
    p.dueCount > 0
      ? `You have ${p.dueCount} ${p.dueCount === 1 ? 'word' : 'words'} ready to review — two minutes keeps the flame alive.`
      : 'A quick two-minute session keeps the flame alive.';
  const html = layout(
    `<p style="font-size:16px;color:#3d3528;">Hey ${firstName(p.name)},</p>
     <p style="font-size:16px;color:#3d3528;">You've practiced <strong>${p.streak} ${p.streak === 1 ? 'day' : 'days'} in a row</strong> — but not yet today. ${reviewLine}</p>
     <p style="margin:24px 0;">
       <a href="${appUrl()}/review" style="background:#e2742d;color:#fff;font-weight:700;padding:12px 24px;border-radius:12px;text-decoration:none;display:inline-block;">Keep the streak →</a>
     </p>`,
    unsubscribeUrl
  );
  const text = `Hey ${firstName(p.name)},\n\nYou've practiced ${p.streak} days in a row — but not yet today. ${reviewLine}\n\nKeep the streak: ${appUrl()}/review\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { subject, html, text };
}

export function dueReviewsEmail(p: {
  name: string | null;
  dueCount: number;
  unsubscribeToken: string;
}): EmailContent {
  const unsubscribeUrl = unsubscribeUrlFor(p.unsubscribeToken);
  const subject = `${p.dueCount} words are ready for review`;
  const html = layout(
    `<p style="font-size:16px;color:#3d3528;">Hey ${firstName(p.name)},</p>
     <p style="font-size:16px;color:#3d3528;"><strong>${p.dueCount} words</strong> are due for review — they're right at the edge of memory, which is exactly when reviewing locks them in.</p>
     <p style="margin:24px 0;">
       <a href="${appUrl()}/review" style="background:#e2742d;color:#fff;font-weight:700;padding:12px 24px;border-radius:12px;text-decoration:none;display:inline-block;">Review now →</a>
     </p>`,
    unsubscribeUrl
  );
  const text = `Hey ${firstName(p.name)},\n\n${p.dueCount} words are due for review — they're right at the edge of memory, which is exactly when reviewing locks them in.\n\nReview now: ${appUrl()}/review\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { subject, html, text };
}

export function weeklyRecapEmail(p: {
  name: string | null;
  wordsLearned: number;
  reviewsDone: number;
  xpGained: number;
  streak: number;
  unsubscribeToken: string;
}): EmailContent {
  const unsubscribeUrl = unsubscribeUrlFor(p.unsubscribeToken);
  const subject = 'Your week at WordZoo 📚';
  const statRow = (label: string, value: string | number) =>
    `<tr><td style="padding:8px 0;color:#9a8f80;font-size:14px;">${label}</td><td style="padding:8px 0;text-align:right;font-weight:800;color:#3d3528;font-size:14px;">${value}</td></tr>`;
  const html = layout(
    `<p style="font-size:16px;color:#3d3528;">Hey ${firstName(p.name)},</p>
     <p style="font-size:16px;color:#3d3528;">Here's what your week looked like:</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">
       ${statRow('New words learned', p.wordsLearned)}
       ${statRow('Words reviewed', p.reviewsDone)}
       ${statRow('XP earned', p.xpGained)}
       ${statRow('Current streak', `${p.streak} ${p.streak === 1 ? 'day' : 'days'}`)}
     </table>
     <p style="margin:24px 0;">
       <a href="${appUrl()}/dashboard" style="background:#e2742d;color:#fff;font-weight:700;padding:12px 24px;border-radius:12px;text-decoration:none;display:inline-block;">Start this week →</a>
     </p>`,
    unsubscribeUrl
  );
  const text = `Hey ${firstName(p.name)},\n\nYour week at WordZoo:\n- New words learned: ${p.wordsLearned}\n- Words reviewed: ${p.reviewsDone}\n- XP earned: ${p.xpGained}\n- Current streak: ${p.streak} days\n\nStart this week: ${appUrl()}/dashboard\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { subject, html, text };
}
