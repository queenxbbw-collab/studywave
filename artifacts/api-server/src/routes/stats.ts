import { Router } from "express";
import { db, usersTable, questionsTable, answersTable, badgesTable, activityTable } from "@workspace/db";
import { count, sql, desc, eq } from "drizzle-orm";

const router = Router();

router.get("/stats/platform", async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [questionCount] = await db.select({ count: count() }).from(questionsTable);
  const [answerCount] = await db.select({ count: count() }).from(answersTable);
  const [awardedCount] = await db.select({ count: count() }).from(answersTable).where(sql`${answersTable.isAwarded} = true`);
  const [solvedCount] = await db.select({ count: count() }).from(questionsTable).where(sql`${questionsTable.isSolved} = true`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [activeToday] = await db.select({ count: count() }).from(activityTable)
    .where(sql`${activityTable.createdAt} >= ${today.toISOString()}`);

  res.json({
    totalUsers: Number(userCount.count),
    totalQuestions: Number(questionCount.count),
    totalAnswers: Number(answerCount.count),
    totalAwardedAnswers: Number(awardedCount.count),
    solvedQuestions: Number(solvedCount.count),
    activeUsersToday: Number(activeToday.count),
  });
});

router.get("/stats/leaderboard", async (_req, res): Promise<void> => {
  // Was previously top-50 users + 2 extra COUNT queries per user = 101 round-trips. Now
  // a single LEFT JOIN that aggregates per author, so the whole leaderboard renders in
  // one query.
  const rows = (await db.execute(sql`
    SELECT
      u.id,
      u.username,
      u.display_name AS "displayName",
      u.avatar_url AS "avatarUrl",
      u.points,
      COALESCE(SUM(CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END), 0)::int AS "answerCount",
      COALESCE(SUM(CASE WHEN a.is_awarded = TRUE THEN 1 ELSE 0 END), 0)::int AS "awardedAnswerCount"
    FROM users u
    LEFT JOIN answers a ON a.author_id = u.id
    WHERE u.is_active = TRUE
      AND u.role <> 'admin'
    GROUP BY u.id
    ORDER BY u.points DESC
    LIMIT 50
  `)).rows as any[];

  res.json(rows.map((r, index) => ({ ...r, rank: index + 1 })));
});

router.get("/stats/subjects", async (_req, res): Promise<void> => {
  // Same N+1 fix: was 1 + N queries (subjects list + one COUNT per subject for solved),
  // now a single GROUP BY with conditional sums.
  const rows = (await db.execute(sql`
    SELECT
      subject,
      COUNT(*)::int AS "count",
      COALESCE(SUM(CASE WHEN is_solved = TRUE THEN 1 ELSE 0 END), 0)::int AS "solvedCount"
    FROM questions
    GROUP BY subject
    ORDER BY COUNT(*) DESC
  `)).rows as any[];
  res.json(rows);
});

router.get("/stats/recent-activity", async (_req, res): Promise<void> => {
  const activities = await db
    .select({
      a: activityTable,
      user: {
        username: usersTable.username,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
      },
      question: {
        title: questionsTable.title,
      },
    })
    .from(activityTable)
    .innerJoin(usersTable, eq(activityTable.userId, usersTable.id))
    .leftJoin(questionsTable, eq(activityTable.questionId, questionsTable.id))
    .orderBy(desc(activityTable.createdAt))
    .limit(20);

  res.json(activities.map(({ a, user, question }) => ({
    id: a.id,
    type: a.type,
    userId: a.userId,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    questionId: a.questionId,
    questionTitle: question?.title,
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
