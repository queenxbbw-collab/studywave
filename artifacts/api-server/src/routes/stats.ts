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
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      displayName: usersTable.displayName,
      avatarUrl: usersTable.avatarUrl,
      points: usersTable.points,
    })
    .from(usersTable)
    .where(sql`${usersTable.isActive} = true`)
    .orderBy(desc(usersTable.points))
    .limit(50);

  const leaderboard = await Promise.all(users.map(async (user, index) => {
    const [answerCount] = await db.select({ cnt: count() }).from(answersTable).where(eq(answersTable.authorId, user.id));
    const [awardedCount] = await db.select({ cnt: count() }).from(answersTable).where(sql`${answersTable.authorId} = ${user.id} AND ${answersTable.isAwarded} = true`);
    return {
      ...user,
      answerCount: Number(answerCount.cnt),
      awardedAnswerCount: Number(awardedCount.cnt),
      rank: index + 1,
    };
  }));

  res.json(leaderboard);
});

router.get("/stats/subjects", async (_req, res): Promise<void> => {
  const subjects = await db
    .select({
      subject: questionsTable.subject,
      count: count(),
    })
    .from(questionsTable)
    .groupBy(questionsTable.subject)
    .orderBy(desc(count()));

  const subjectStats = await Promise.all(subjects.map(async (s) => {
    const [solvedCount] = await db.select({ cnt: count() }).from(questionsTable)
      .where(sql`${questionsTable.subject} = ${s.subject} AND ${questionsTable.isSolved} = true`);
    return {
      subject: s.subject,
      count: Number(s.count),
      solvedCount: Number(solvedCount.cnt),
    };
  }));

  res.json(subjectStats);
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
