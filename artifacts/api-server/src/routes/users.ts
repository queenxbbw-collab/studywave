import { Router } from "express";
import { db, usersTable, badgesTable, userBadgesTable, questionsTable, answersTable, userFollowsTable } from "@workspace/db";
import { eq, count, sql, and } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { hashPassword, comparePassword } from "../lib/auth";
import { UpdateSettingsBody, UploadAvatarBody } from "@workspace/api-zod";
import { createNotification } from "./notifications";

const router = Router();

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const numericId = parseInt(raw, 10);
  const isNumeric = !isNaN(numericId) && String(numericId) === raw;

  const [user] = isNumeric
    ? await db.select().from(usersTable).where(eq(usersTable.id, numericId))
    : await db.select().from(usersTable).where(eq(usersTable.username, raw));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const id = user.id;
  const [qCount] = await db.select({ count: count() }).from(questionsTable).where(eq(questionsTable.authorId, id));
  const [aCount] = await db.select({ count: count() }).from(answersTable).where(eq(answersTable.authorId, id));
  const [awardedCount] = await db.select({ count: count() }).from(answersTable)
    .where(sql`${answersTable.authorId} = ${id} AND ${answersTable.isAwarded} = true`);

  const userBadgeRows = await db
    .select({ badge: badgesTable })
    .from(userBadgesTable)
    .innerJoin(badgesTable, eq(userBadgesTable.badgeId, badgesTable.id))
    .where(eq(userBadgesTable.userId, id));

  const badges = userBadgeRows.map(r => ({
    id: r.badge.id,
    name: r.badge.name,
    description: r.badge.description,
    icon: r.badge.icon,
    color: r.badge.color,
    pointsRequired: r.badge.pointsRequired,
    category: r.badge.category,
    createdAt: r.badge.createdAt.toISOString(),
  }));

  const [followersCount] = await db.select({ count: count() }).from(userFollowsTable).where(eq(userFollowsTable.followingId, id));
  const [followingCount] = await db.select({ count: count() }).from(userFollowsTable).where(eq(userFollowsTable.followerId, id));

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    website: user.website,
    twitter: user.twitter,
    github: user.github,
    linkedin: user.linkedin,
    points: user.points,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    questionCount: Number(qCount.count),
    answerCount: Number(aCount.count),
    awardedAnswerCount: Number(awardedCount.count),
    currentStreak: user.currentStreak ?? 0,
    longestStreak: user.longestStreak ?? 0,
    followersCount: Number(followersCount.count),
    followingCount: Number(followingCount.count),
    isPremium: user.isPremium ?? false,
    premiumExpiresAt: user.premiumExpiresAt?.toISOString() ?? null,
    bannerColor: user.bannerColor,
    isVerified: user.isVerified ?? false,
    badges,
  });
});

router.get("/users/:id/questions", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const questions = await db
    .select({
      q: questionsTable,
      author: {
        username: usersTable.username,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
      },
    })
    .from(questionsTable)
    .innerJoin(usersTable, eq(questionsTable.authorId, usersTable.id))
    .where(and(eq(questionsTable.authorId, id), eq(questionsTable.isHidden, false)))
    .orderBy(sql`${questionsTable.createdAt} DESC`);

  const [answerCounts] = await Promise.all([
    db.select({ questionId: answersTable.questionId, count: count() })
      .from(answersTable)
      .groupBy(answersTable.questionId),
  ]);

  const answerCountMap = new Map(answerCounts.map(a => [a.questionId, Number(a.count)]));

  res.json(questions.map(({ q, author }) => ({
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
  })));
});

router.get("/users/:id/answers", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const answers = await db
    .select({
      a: answersTable,
      author: {
        username: usersTable.username,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        points: usersTable.points,
      },
    })
    .from(answersTable)
    .innerJoin(usersTable, eq(answersTable.authorId, usersTable.id))
    .where(and(eq(answersTable.authorId, id), eq(answersTable.isHidden, false)))
    .orderBy(sql`${answersTable.createdAt} DESC`);

  res.json(answers.map(({ a, author }) => ({
    id: a.id,
    content: a.content,
    questionId: a.questionId,
    authorId: a.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points,
    upvotes: a.upvotes,
    downvotes: a.downvotes,
    isAwarded: a.isAwarded,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  })));
});

router.patch("/users/settings", authenticate, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { displayName, bio, email, currentPassword, newPassword, website, twitter, github, linkedin } = parsed.data;

  // bannerColor isn't in the generated zod schema yet, so accept it manually but enforce a strict
  // "#RRGGBB" or "#RGB" hex pattern. Anything else (e.g. javascript:, css escape, long string) is
  // rejected outright.
  let bannerColor: string | undefined;
  const rawBanner = (req.body as any).bannerColor;
  if (rawBanner !== undefined && rawBanner !== null) {
    if (typeof rawBanner !== "string" || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(rawBanner)) {
      res.status(400).json({ error: "bannerColor must be a hex color like #1a2b3c" });
      return;
    }
    bannerColor = rawBanner;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (newPassword && currentPassword) {
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
  }

  const updateData: Record<string, unknown> = {};
  if (displayName) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (website !== undefined) updateData.website = website;
  if (twitter !== undefined) updateData.twitter = twitter;
  if (github !== undefined) updateData.github = github;
  if (linkedin !== undefined) updateData.linkedin = linkedin;
  if (bannerColor !== undefined) updateData.bannerColor = bannerColor;
  if (email) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing && existing.id !== user.id) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    updateData.email = email;
  }
  if (newPassword && currentPassword) {
    updateData.passwordHash = await hashPassword(newPassword);
  }

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, req.userId!)).returning();

  res.json({
    id: updated.id,
    username: updated.username,
    email: updated.email,
    displayName: updated.displayName,
    avatarUrl: updated.avatarUrl,
    bio: updated.bio,
    website: updated.website,
    twitter: updated.twitter,
    github: updated.github,
    linkedin: updated.linkedin,
    points: updated.points,
    role: updated.role,
    isActive: updated.isActive,
    isPremium: updated.isPremium ?? false,
    premiumExpiresAt: updated.premiumExpiresAt?.toISOString() ?? null,
    bannerColor: updated.bannerColor,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/users/:id/follow-status", authenticate, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  const [follow] = await db.select().from(userFollowsTable)
    .where(and(eq(userFollowsTable.followerId, req.userId!), eq(userFollowsTable.followingId, targetId)));
  res.json({ isFollowing: !!follow });
});

router.post("/users/:id/follow", authenticate, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  if (targetId === req.userId) {
    res.status(400).json({ error: "You cannot follow yourself" });
    return;
  }
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  // Atomic insert: only insert if no row exists for this (follower, following) pair.
  // RETURNING tells us whether a row was actually created — used to gate the notification
  // so a double-click never produces two "new follower" notifications.
  const insertResult = await db.execute(sql`
    INSERT INTO user_follows (follower_id, following_id)
    SELECT ${req.userId!}, ${targetId}
    WHERE NOT EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = ${req.userId!} AND following_id = ${targetId}
    )
    RETURNING id
  `);
  const inserted = insertResult.rows.length > 0;
  if (!inserted) { res.json({ message: "Already following" }); return; }

  // Notify the person being followed (only on the real first follow).
  const [follower] = await db.select({ displayName: usersTable.displayName, username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await createNotification(
    targetId,
    "new_follower",
    "Ai un urmăritor nou!",
    `${follower?.displayName || follower?.username || "Cineva"} a început să te urmărească.`
  );
  res.json({ message: "Now following" });
});

router.delete("/users/:id/follow", authenticate, async (req, res): Promise<void> => {
  const targetId = parseInt(req.params.id, 10);
  await db.delete(userFollowsTable)
    .where(and(eq(userFollowsTable.followerId, req.userId!), eq(userFollowsTable.followingId, targetId)));
  res.json({ message: "Unfollowed" });
});

router.post("/users/avatar", authenticate, async (req, res): Promise<void> => {
  const parsed = UploadAvatarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(usersTable)
    .set({ avatarUrl: parsed.data.avatarUrl })
    .where(eq(usersTable.id, req.userId!))
    .returning();

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

export default router;
