import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

/**
 * Bump a user's daily activity streak. Safe to call from any activity hook
 * (post question, post answer, post comment, login). It is idempotent for
 * the same UTC day — calling multiple times in one day will not inflate it.
 */
export async function bumpStreak(userId: number): Promise<void> {
  const [user] = await db.select({
    currentStreak: usersTable.currentStreak,
    longestStreak: usersTable.longestStreak,
    lastActivityDate: usersTable.lastActivityDate,
  }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];
  const lastDate = user.lastActivityDate
    ? new Date(user.lastActivityDate as unknown as string).toISOString().split("T")[0]
    : null;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Already counted today — nothing to do.
  if (lastDate === today) return;

  let newStreak: number;
  if (!lastDate || lastDate < yesterday) newStreak = 1;
  else if (lastDate === yesterday) newStreak = (user.currentStreak ?? 0) + 1;
  else newStreak = 1;

  const newLongest = Math.max(newStreak, user.longestStreak ?? 0);

  await db.execute(sql`
    UPDATE users
    SET current_streak = ${newStreak},
        longest_streak = ${newLongest},
        last_activity_date = ${today}
    WHERE id = ${userId}
  `);
}
