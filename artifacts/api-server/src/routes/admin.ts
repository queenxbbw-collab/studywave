import { Router } from "express";
import { db, usersTable, questionsTable, answersTable, badgesTable, userBadgesTable, activityTable, answerVotesTable, questionVotesTable } from "@workspace/db";
import { eq, count, sql, ilike, and, desc } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/authenticate";
import { AdminUpdateUserBody, AdminCreateBadgeBody, AdminUpdateBadgeBody, AdminListUsersQueryParams, AdminListQuestionsQueryParams } from "@workspace/api-zod";
import { checkAndAwardBadges } from "../lib/badges";
import { logAdminAction } from "../lib/adminLog";

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
  if (parsed.data.isPremium !== undefined) updateData.isPremium = parsed.data.isPremium;

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();

  if (parsed.data.points !== undefined) {
    await checkAndAwardBadges(id);
  }

  // Log specific action
  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  const adminUsername = adminUser?.username ?? "admin";

  if (parsed.data.isActive !== undefined) {
    await logAdminAction({
      adminId: req.userId!,
      adminUsername,
      action: parsed.data.isActive ? "user.unsuspend" : "user.suspend",
      category: "users",
      targetType: "user",
      targetId: id,
      targetLabel: existing.displayName || existing.username,
      details: parsed.data.isActive
        ? `Re-activated account for @${existing.username}`
        : `Suspended account for @${existing.username}`,
    });
  }
  if (parsed.data.role !== undefined && parsed.data.role !== existing.role) {
    await logAdminAction({
      adminId: req.userId!,
      adminUsername,
      action: "user.role_change",
      category: "users",
      targetType: "user",
      targetId: id,
      targetLabel: existing.displayName || existing.username,
      details: `Changed role of @${existing.username} from "${existing.role}" to "${parsed.data.role}"`,
    });
  }
  if (parsed.data.points !== undefined && parsed.data.points !== existing.points) {
    await logAdminAction({
      adminId: req.userId!,
      adminUsername,
      action: "user.points_edit",
      category: "users",
      targetType: "user",
      targetId: id,
      targetLabel: existing.displayName || existing.username,
      details: `Edited points for @${existing.username}: ${existing.points} → ${parsed.data.points}`,
    });
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

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "user.delete",
    category: "users",
    targetType: "user",
    targetId: id,
    targetLabel: existing.displayName || existing.username,
    details: `Deleted (deactivated) account @${existing.username} (${existing.email})`,
  });

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

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "question.delete",
    category: "content",
    targetType: "question",
    targetId: id,
    targetLabel: q.title.slice(0, 80),
    details: `Deleted question #${id} by @${q.authorId}: "${q.title.slice(0, 80)}"`,
  });

  res.sendStatus(204);
});

router.post("/admin/badges", async (req, res): Promise<void> => {
  const parsed = AdminCreateBadgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [badge] = await db.insert(badgesTable).values(parsed.data).returning();

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "badge.create",
    category: "badges",
    targetType: "badge",
    targetId: badge.id,
    targetLabel: badge.name,
    details: `Created badge "${badge.name}" (${badge.pointsRequired} pts, category: ${badge.category})`,
  });

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

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "badge.update",
    category: "badges",
    targetType: "badge",
    targetId: id,
    targetLabel: existing.name,
    details: `Updated badge "${existing.name}"`,
  });

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

  const [existing] = await db.select().from(badgesTable).where(eq(badgesTable.id, id));

  await db.delete(userBadgesTable).where(eq(userBadgesTable.badgeId, id));
  await db.delete(badgesTable).where(eq(badgesTable.id, id));

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "badge.delete",
    category: "badges",
    targetType: "badge",
    targetId: id,
    targetLabel: existing?.name ?? `#${id}`,
    details: `Deleted badge "${existing?.name ?? id}"`,
  });

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

// POST /admin/reset-data — nuke all content + non-admin users
router.post("/admin/reset-data", async (req, res): Promise<void> => {
  const { target } = req.body as { target?: string };
  const VALID = ["questions", "users", "all"];
  if (!target || !VALID.includes(target)) {
    res.status(400).json({ error: "Invalid target. Use: questions, users, all" });
    return;
  }

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  const adminUsername = adminUser?.username ?? "admin";

  if (target === "questions" || target === "all") {
    // FK-safe order: delete child tables before parent tables
    // children of answers first
    await db.execute(sql`DELETE FROM answer_votes`);
    await db.execute(sql`DELETE FROM comments`);
    // children of questions
    await db.execute(sql`DELETE FROM question_votes`);
    await db.execute(sql`DELETE FROM activity`);
    await db.execute(sql`DELETE FROM bookmarks`);
    await db.execute(sql`DELETE FROM notifications`);
    await db.execute(sql`DELETE FROM reports`);
    // now answers (references questions) and questions
    await db.execute(sql`DELETE FROM answers`);
    await db.execute(sql`DELETE FROM questions`);
    await db.execute(sql`DELETE FROM admin_logs WHERE admin_id != ${req.userId!}`);
  }

  if (target === "users" || target === "all") {
    const sub = `(SELECT id FROM users WHERE role != 'admin')`;
    // Delete all data belonging to non-admin users in FK-safe order
    await db.execute(sql.raw(`DELETE FROM answer_votes WHERE user_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM question_votes WHERE user_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM comments WHERE user_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM bookmarks WHERE user_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM notifications WHERE user_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM activity WHERE user_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM reports WHERE reporter_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM suggestions WHERE user_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM answers WHERE author_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM questions WHERE author_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM user_follows WHERE follower_id IN ${sub} OR following_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM user_badges WHERE user_id IN ${sub}`));
    await db.execute(sql.raw(`DELETE FROM password_reset_tokens WHERE user_id IN ${sub}`));
    await db.execute(sql`DELETE FROM users WHERE role != 'admin'`);
  }

  await logAdminAction({
    adminId: req.userId!,
    adminUsername,
    action: "system.reset_data",
    category: "moderation",
    targetType: "system",
    targetId: null,
    targetLabel: target,
    details: `Reset data: target="${target}"`,
  });

  res.json({ ok: true, message: `Reset complete: ${target}` });
});

// PATCH /admin/users/:id/points — quick set points
router.patch("/admin/users/:id/points", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  const { points } = req.body as { points?: number };
  if (isNaN(userId) || points === undefined || typeof points !== "number" || points < 0 || points > 9999999) {
    res.status(400).json({ error: "Invalid userId or points (0–9,999,999)" });
    return;
  }
  const [updated] = await db.update(usersTable).set({ points }).where(eq(usersTable.id, userId)).returning({ points: usersTable.points, username: usersTable.username });
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "user.points_set",
    category: "users",
    targetType: "user",
    targetId: userId,
    targetLabel: updated.username,
    details: `Set points for @${updated.username} → ${points}`,
  });
  res.json({ ok: true, points: updated.points });
});

// GET /admin/logs — full audit log
router.get("/admin/logs", async (req, res): Promise<void> => {
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(50, Math.max(10, parseInt((req.query.limit as string) || "30", 10)));
  const category = req.query.category as string | undefined;
  const offset = (page - 1) * limit;

  const VALID_CATEGORIES = ["users", "content", "badges", "moderation", "announcements", "suggestions"];
  const safeCat = (category && VALID_CATEGORIES.includes(category)) ? category : null;

  const allRows = await db.execute(sql`
    SELECT id, admin_id, admin_username, action, category, target_type, target_id, target_label, details, created_at
    FROM admin_logs
    ORDER BY created_at DESC
    LIMIT 5000
  `);

  const filtered = safeCat
    ? allRows.rows.filter((l: any) => l.category === safeCat)
    : allRows.rows;

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    logs: paginated.map((l: any) => ({
      id: l.id,
      adminId: l.admin_id,
      adminUsername: l.admin_username,
      action: l.action,
      category: l.category,
      targetType: l.target_type,
      targetId: l.target_id,
      targetLabel: l.target_label,
      details: l.details,
      createdAt: l.created_at,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export default router;
