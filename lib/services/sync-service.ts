import { sql } from '@/lib/db/client';
import type { SyncEvent, SyncResult } from '@/types/offline';
import type { UserWord } from '@/types/database';

export async function processBatchSync(
  userId: string,
  events: SyncEvent[]
): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    updated_user_words: [],
  };

  for (const event of events) {
    try {
      // Check if server has a newer review
      const existing = await sql`
        SELECT id, last_reviewed_at, updated_at
        FROM user_words
        WHERE user_id = ${userId} AND word_id = ${event.word_id}
      `;

      if (existing.length > 0 && existing[0].last_reviewed_at) {
        const serverReviewedAt = new Date(existing[0].last_reviewed_at);
        const eventReviewedAt = new Date(event.reviewed_at);
        if (serverReviewedAt > eventReviewedAt) {
          // Server wins — skip this event but return current state
          result.skipped++;
          const current = await sql`
            SELECT * FROM user_words
            WHERE user_id = ${userId} AND word_id = ${event.word_id}
          `;
          if (current.length > 0) {
            result.updated_user_words.push(current[0] as UserWord);
          }
          continue;
        }
      }

      // Upsert user_words with the review data
      const rows = await sql`
        INSERT INTO user_words (user_id, word_id, status, direction, last_reviewed_at, times_reviewed, updated_at)
        VALUES (
          ${userId},
          ${event.word_id},
          'learning',
          ${event.direction},
          ${event.reviewed_at},
          1,
          NOW()
        )
        ON CONFLICT (user_id, word_id) DO UPDATE SET
          last_reviewed_at = ${event.reviewed_at},
          times_reviewed = user_words.times_reviewed + 1,
          times_correct = CASE WHEN ${event.rating} IN ('instant', 'got_it') THEN user_words.times_correct + 1 ELSE user_words.times_correct END,
          updated_at = NOW()
        RETURNING *
      `;

      result.synced++;
      if (rows.length > 0) {
        result.updated_user_words.push(rows[0] as UserWord);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Failed to sync event ${event.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  return result;
}
