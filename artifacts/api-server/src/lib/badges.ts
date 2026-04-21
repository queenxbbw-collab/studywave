import { db, usersTable, badgesTable, userBadgesTable, questionsTable, answersTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";

/**
 * Compute the real metrics that drive non-points badges.
 */
async function getUserMetrics(userId: number) {
  const [qRow] = await db.select({ cnt: count() }).from(questionsTable).where(eq(questionsTable.authorId, userId));
  const [aRow] = await db.select({ cnt: count() }).from(answersTable).where(eq(answersTable.authorId, userId));
  const [awRow] = await db.select({ cnt: count() }).from(answersTable)
    .where(and(eq(answersTable.authorId, userId), eq(answersTable.isAwarded, true)));
  const [refRow] = await db.select({ cnt: count() }).from(usersTable).where(eq(usersTable.referredBy, userId));
  const [user] = await db.select({
    points: usersTable.points,
    currentStreak: usersTable.currentStreak,
    longestStreak: usersTable.longestStreak,
  }).from(usersTable).where(eq(usersTable.id, userId));

  return {
    points: user?.points ?? 0,
    questions: Number(qRow?.cnt ?? 0),
    answers: Number(aRow?.cnt ?? 0),
    awardedAnswers: Number(awRow?.cnt ?? 0),
    referrals: Number(refRow?.cnt ?? 0),
    longestStreak: user?.longestStreak ?? 0,
  };
}

/**
 * Map badge name → predicate. Each predicate decides whether the user
 * truly earned the badge based on real activity, not just point totals.
 * Badges not in this map fall back to the points threshold.
 */
type Metrics = Awaited<ReturnType<typeof getUserMetrics>>;
const NAME_RULES: Record<string, (m: Metrics) => boolean> = {
  "Primul Pas":                   m => m.questions >= 1,
  "Minte Curioasă":               m => m.questions >= 5,
  "Căutător de Cunoștințe":       m => m.questions >= 25,
  "Ajutor":                       m => m.answers >= 1,
  "Rezolvator de Probleme":       m => m.awardedAnswers >= 10,
  "Mentor":                       m => m.awardedAnswers >= 50,
  "Câștigător Panglica de Aur":   m => m.awardedAnswers >= 1,
  "În Flăcări":                   m => m.longestStreak >= 7,
  "Dedicat":                      m => m.longestStreak >= 30,
  "Conector":                     m => m.referrals >= 3,
  "Influencer":                   m => m.referrals >= 10,
  "Ambasador":                    m => m.referrals >= 25,
};

export async function checkAndAwardBadges(userId: number): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const existingUserBadges = await db.select({ badgeId: userBadgesTable.badgeId })
    .from(userBadgesTable)
    .where(eq(userBadgesTable.userId, userId));
  const ownedBadgeIds = new Set(existingUserBadges.map(b => b.badgeId));

  const allBadges = await db.select().from(badgesTable);
  if (allBadges.every(b => ownedBadgeIds.has(b.id))) return;

  const metrics = await getUserMetrics(userId);

  for (const badge of allBadges) {
    if (ownedBadgeIds.has(badge.id)) continue;
    const rule = NAME_RULES[badge.name];
    const earned = rule ? rule(metrics) : metrics.points >= badge.pointsRequired;
    if (earned) {
      await db.insert(userBadgesTable).values({ userId, badgeId: badge.id });
    }
  }
}
