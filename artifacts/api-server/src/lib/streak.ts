import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

/**
 * Bump a user's daily activity streak. Safe to call from any activity hook
 * (post question, post answer, post comment, login). Idempotent for the
 * same UTC day — calling multiple times will not inflate it.
 *
 * The whole calculation is done in a single atomic UPDATE driven by the
 * row's own current values, so two concurrent activities (e.g. answer +
 * comment posted in parallel) cannot both read the same stale state and
 * race each other into miscounting the streak.
 */
export async function bumpStreak(userId: number): Promise<void> {
  await db.execute(sql`
    UPDATE users
    SET
      current_streak = CASE
        -- Same UTC day → no change.
        WHEN last_activity_date = (NOW() AT TIME ZONE 'UTC')::date
          THEN current_streak
        -- Yesterday → +1.
        WHEN last_activity_date = (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '1 day'
          THEN current_streak + 1
        -- Anything else (gap or first-ever) → reset to 1.
        ELSE 1
      END,
      longest_streak = GREATEST(
        longest_streak,
        CASE
          WHEN last_activity_date = (NOW() AT TIME ZONE 'UTC')::date
            THEN current_streak
          WHEN last_activity_date = (NOW() AT TIME ZONE 'UTC')::date - INTERVAL '1 day'
            THEN current_streak + 1
          ELSE 1
        END
      ),
      last_activity_date = (NOW() AT TIME ZONE 'UTC')::date
    WHERE id = ${userId}
      AND (last_activity_date IS DISTINCT FROM (NOW() AT TIME ZONE 'UTC')::date)
  `);
}
