import { Router } from "express";
import { db, usersTable, questionsTable, answersTable, badgesTable, userBadgesTable, activityTable, answerVotesTable, questionVotesTable } from "@workspace/db";
import { eq, count, sql, ilike, and, desc } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/authenticate";
import { AdminUpdateUserBody, AdminCreateBadgeBody, AdminUpdateBadgeBody, AdminListUsersQueryParams, AdminListQuestionsQueryParams } from "@workspace/api-zod";
import { checkAndAwardBadges } from "../lib/badges";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/admin/users", async (req, res): Promise<void> => {
  const params = AdminListUsersQueryParams.safeParse(req.query);
  const page = params.success && params.data.page ? Number(params.data.page) : 1;
  const limit = params.success && params.data.limit ? Number(params.data.limit) : 20;
  const search = params.success ? params.data.search : undefined;
  const offset = (page - 1) * limit;

  const condition = search ? ilike(usersTable.username, `%${search}%`) : undefined;

  const [totalRow] = await db.select({ count: count() }).from(usersTable).where(condition);
  const total = Number(totalRow.count);

  const users = await db.select().from(usersTable).where(condition).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);

  res.json({
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      points: u.points,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.patch("/admin/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) updateData.displayName = parsed.data.displayName;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.points !== undefined) updateData.points = parsed.data.points;

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();

  if (parsed.data.points !== undefined) {
    await checkAndAwardBadges(id);
  }

  res.json({
    id: updated.id,
    username: updated.username,
    email: updated.email,
    displayName: updated.displayName,
    avatarUrl: updated.avatarUrl,
    bio: updated.bio,
    points: updated.points,
    role: updated.role,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

router.get("/admin/questions", async (req, res): Promise<void> => {
  const params = AdminListQuestionsQueryParams.safeParse(req.query);
  const page = params.success && params.data.page ? Number(params.data.page) : 1;
  const limit = params.success && params.data.limit ? Number(params.data.limit) : 20;
  const offset = (page - 1) * limit;

  const [totalRow] = await db.select({ count: count() }).from(questionsTable);
  const total = Number(totalRow.count);

  const questions = await db
    .select({
      q: questionsTable,
      author: { username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl },
    })
    .from(questionsTable)
    .innerJoin(usersTable, eq(questionsTable.authorId, usersTable.id))
    .orderBy(desc(questionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const questionIds = questions.map(q => q.q.id);
  let answerCountMap = new Map<number, number>();
  if (questionIds.length > 0) {
    const answerCounts = await db.select({ questionId: answersTable.questionId, cnt: count() })
      .from(answersTable)
      .where(sql`${answersTable.questionId} = ANY(ARRAY[${sql.join(questionIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      .groupBy(answersTable.questionId);
    answerCountMap = new Map(answerCounts.map(a => [a.questionId, Number(a.cnt)]));
  }

  res.json({
    questions: questions.map(({ q, author }) => ({
      id: q.id,
      title: q.title,
      content: q.content,
      subject: q.subject,
      authorId: q.authorId,
      authorUsername: author.username,
      authorDisplayName: author.displayName,
      authorAvatarUrl: author.avatarUrl,
      upvotes: q.upvotes,
      downvotes: q.downvotes,
      answerCount: answerCountMap.get(q.id) || 0,
      hasAwardedAnswer: q.hasAwardedAnswer,
      isSolved: q.isSolved,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.delete("/admin/questions/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!q) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  await db.delete(questionVotesTable).where(eq(questionVotesTable.questionId, id));
  await db.delete(answersTable).where(eq(answersTable.questionId, id));
  await db.delete(activityTable).where(eq(activityTable.questionId, id));
  await db.delete(questionsTable).where(eq(questionsTable.id, id));

  res.sendStatus(204);
});

router.post("/admin/badges", async (req, res): Promise<void> => {
  const parsed = AdminCreateBadgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [badge] = await db.insert(badgesTable).values(parsed.data).returning();

  res.status(201).json({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    color: badge.color,
    pointsRequired: badge.pointsRequired,
    category: badge.category,
    createdAt: badge.createdAt.toISOString(),
  });
});

router.patch("/admin/badges/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = AdminUpdateBadgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(badgesTable).where(eq(badgesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Badge not found" });
    return;
  }

  const [updated] = await db.update(badgesTable).set(parsed.data).where(eq(badgesTable.id, id)).returning();

  res.json({
    id: updated.id,
    name: updated.name,
    description: updated.description,
    icon: updated.icon,
    color: updated.color,
    pointsRequired: updated.pointsRequired,
    category: updated.category,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/admin/badges/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(userBadgesTable).where(eq(userBadgesTable.badgeId, id));
  await db.delete(badgesTable).where(eq(badgesTable.id, id));
  res.sendStatus(204);
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [questionCount] = await db.select({ count: count() }).from(questionsTable);
  const [answerCount] = await db.select({ count: count() }).from(answersTable);
  const [awardedCount] = await db.select({ count: count() }).from(answersTable).where(sql`${answersTable.isAwarded} = true`);
  const [solvedCount] = await db.select({ count: count() }).from(questionsTable).where(sql`${questionsTable.isSolved} = true`);
  const [badgeCount] = await db.select({ count: count() }).from(badgesTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [activeToday] = await db.select({ count: count() }).from(activityTable)
    .where(sql`${activityTable.createdAt} >= ${today.toISOString()}`);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const [newUsersWeek] = await db.select({ count: count() }).from(usersTable)
    .where(sql`${usersTable.createdAt} >= ${oneWeekAgo.toISOString()}`);
  const [newQuestionsWeek] = await db.select({ count: count() }).from(questionsTable)
    .where(sql`${questionsTable.createdAt} >= ${oneWeekAgo.toISOString()}`);
  const [newAnswersWeek] = await db.select({ count: count() }).from(answersTable)
    .where(sql`${answersTable.createdAt} >= ${oneWeekAgo.toISOString()}`);

  const subjectStats = await db
    .select({ subject: questionsTable.subject, count: count() })
    .from(questionsTable)
    .groupBy(questionsTable.subject)
    .orderBy(desc(count()))
    .limit(10);

  const topSubjects = await Promise.all(subjectStats.map(async (s) => {
    const [solvedCnt] = await db.select({ cnt: count() }).from(questionsTable)
      .where(sql`${questionsTable.subject} = ${s.subject} AND ${questionsTable.isSolved} = true`);
    return { subject: s.subject, count: Number(s.count), solvedCount: Number(solvedCnt.cnt) };
  }));

  res.json({
    totalUsers: Number(userCount.count),
    totalQuestions: Number(questionCount.count),
    totalAnswers: Number(answerCount.count),
    totalAwardedAnswers: Number(awardedCount.count),
    solvedQuestions: Number(solvedCount.count),
    activeUsersToday: Number(activeToday.count),
    newUsersThisWeek: Number(newUsersWeek.count),
    newQuestionsThisWeek: Number(newQuestionsWeek.count),
    newAnswersThisWeek: Number(newAnswersWeek.count),
    totalBadges: Number(badgeCount.count),
    topSubjects,
  });
});

export default router;
