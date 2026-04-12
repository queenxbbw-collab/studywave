import { db, usersTable, badgesTable, userBadgesTable, answersTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

export async function checkAndAwardBadges(userId: number): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const existingUserBadges = await db.select({ badgeId: userBadgesTable.badgeId })
    .from(userBadgesTable)
    .where(eq(userBadgesTable.userId, userId));

  const ownedBadgeIds = new Set(existingUserBadges.map(b => b.badgeId));

  const allBadges = await db.select().from(badgesTable);

  for (const badge of allBadges) {
    if (ownedBadgeIds.has(badge.id)) continue;
    if (user.points >= badge.pointsRequired) {
      await db.insert(userBadgesTable).values({ userId, badgeId: badge.id });
    }
  }
}
