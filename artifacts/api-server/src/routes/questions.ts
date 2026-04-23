import { Router } from "express";
import { db, usersTable, questionsTable, answersTable, questionVotesTable, activityTable } from "@workspace/db";
import { eq, count, sql, and, desc, asc, ilike, or, gte } from "drizzle-orm";
import { authenticate, optionalAuthenticate } from "../middlewares/authenticate";
import { CreateQuestionBody, UpdateQuestionBody, VoteQuestionBody, ListQuestionsQueryParams } from "@workspace/api-zod";
import { checkAndAwardBadges, revokeUnearnedBadges } from "../lib/badges";
import { createNotification } from "./notifications";
import { getEffectivePremium } from "../lib/premium";
import { bumpStreak } from "../lib/streak";
import { shouldCountView } from "../lib/viewThrottle";

const router = Router();

// --- Limits ---
const DAILY_QUESTION_LIMIT = 5;
const MIN_TITLE_LENGTH = 15;
const MIN_CONTENT_LENGTH = 50;

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function validateCreateQuestion(body: unknown): { error?: string; data?: { title: string; content: string; subject: string; imageUrls: string[] } } {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };
  const { title, content, subject, imageUrls } = body as Record<string, unknown>;
  if (!title || typeof title !== "string" || title.trim().length < MIN_TITLE_LENGTH)
    return { error: `Title must be at least ${MIN_TITLE_LENGTH} characters` };
  if (title.trim().length > 200)
    return { error: "Title must be 200 characters or less" };
  if (!content || typeof content !== "string" || content.trim().length < MIN_CONTENT_LENGTH)
    return { error: `Description must be at least ${MIN_CONTENT_LENGTH} characters` };
  if (content.trim().length > 10000)
    return { error: "Description must be 10,000 characters or less" };
  if (!subject || typeof subject !== "string" || subject.trim().length === 0)
    return { error: "Subject is required" };
  const urls: string[] = [];
  if (imageUrls !== undefined) {
    if (!Array.isArray(imageUrls)) return { error: "imageUrls must be an array" };
    if (imageUrls.length > 5) return { error: "Maximum 5 image URLs allowed" };
    for (const u of imageUrls) {
      if (typeof u !== "string") return { error: "Each image URL must be a string" };
      let parsed: URL;
      try { parsed = new URL(u); } catch { return { error: `Invalid URL: ${u}` }; }
      // Reject anything that isn't a real http(s) URL — this blocks javascript:, data:, file:,
      // vbscript: etc. which would otherwise survive into the rendered page and could XSS.
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { error: `Image URL must use http or https: ${u}` };
      }
      urls.push(u);
    }
  }
  return { data: { title: title.trim(), content: content.trim(), subject: subject.trim(), imageUrls: urls } };
}

router.get("/questions", optionalAuthenticate, async (req, res): Promise<void> => {
  const params = ListQuestionsQueryParams.safeParse(req.query);
  const page = params.success && params.data.page ? Number(params.data.page) : 1;
  const limit = Math.min(50, params.success && params.data.limit ? Number(params.data.limit) : 10);
  const subject = params.success ? params.data.subject : undefined;
  const search = params.success ? params.data.search : undefined;
  const sort = params.success ? params.data.sort : "newest";
  const offset = (page - 1) * limit;

  const conditions = [eq(questionsTable.isHidden, false)];
  if (subject && subject !== "all") conditions.push(eq(questionsTable.subject, subject));
  if (search) conditions.push(or(ilike(questionsTable.title, `%${search}%`), ilike(questionsTable.content, `%${search}%`)));
  const whereClause = and(...conditions);

  let orderClause;
  if (sort === "oldest") orderClause = asc(questionsTable.createdAt);
  else if (sort === "most-voted") orderClause = desc(questionsTable.upvotes);
  else if (sort === "unsolved") orderClause = asc(questionsTable.isSolved);
  else if (sort === "trending") orderClause = desc(sql`(${questionsTable.upvotes} * 3 + ${questionsTable.views}) / POWER(GREATEST(1, EXTRACT(EPOCH FROM (NOW() - ${questionsTable.createdAt})) / 3600 + 2), 1.5)`);
  else orderClause = desc(questionsTable.createdAt);

  const [totalRow] = await db.select({ count: count() }).from(questionsTable).where(whereClause);
  const total = Number(totalRow.count);

  const questions = await db
    .select({ q: questionsTable, author: { username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl, isPremium: usersTable.isPremium } })
    .from(questionsTable)
    .innerJoin(usersTable, eq(questionsTable.authorId, usersTable.id))
    .where(whereClause)
    .orderBy(orderClause)
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
      imageUrls: JSON.parse(q.imageUrls || "[]"),
      authorId: q.authorId,
      authorUsername: author.username,
      authorDisplayName: author.displayName,
      authorAvatarUrl: author.avatarUrl,
      authorIsPremium: author.isPremium ?? false,
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

router.post("/questions", authenticate, async (req, res): Promise<void> => {
  const validation = validateCreateQuestion(req.body);
  if (validation.error) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const { imageUrls, ...rest } = validation.data!;

  const isPremium = await getEffectivePremium(req.userId!);

  // --- Daily rate limit (atomic) ---
  // The previous "SELECT COUNT then INSERT" left a race window where N concurrent requests
  // all read the same count and all bypassed the cap. We now do COUNT + INSERT inside a
  // transaction guarded by a per-user advisory lock, so concurrent requests serialize for
  // the same user (and don't block other users at all).
  const todayStart = startOfTodayUTC();
  const inserted = await db.transaction(async (tx) => {
    if (!isPremium) {
      // Per-user advisory lock — held until the transaction ends.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`q_daily:${req.userId}`}))`);

      const [todayCount] = await tx
        .select({ cnt: count() })
        .from(questionsTable)
        .where(and(
          eq(questionsTable.authorId, req.userId!),
          gte(questionsTable.createdAt, todayStart),
        ));

      if (Number(todayCount.cnt) >= DAILY_QUESTION_LIMIT) {
        return null;
      }
    }

    const [q] = await tx.insert(questionsTable).values({
      ...rest,
      imageUrls: JSON.stringify(imageUrls || []),
      authorId: req.userId!,
    }).returning();
    return q;
  });

  if (!inserted) {
    res.status(429).json({
      error: `You've reached the daily limit of ${DAILY_QUESTION_LIMIT} questions. Upgrade to Premium for unlimited questions!`,
      code: "DAILY_LIMIT_REACHED",
    });
    return;
  }
  const question = inserted;

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  await db.insert(activityTable).values({ type: "question_asked", userId: req.userId!, questionId: question.id });
  await db.update(usersTable).set({ points: sql`${usersTable.points} + 5` }).where(eq(usersTable.id, req.userId!));
  await bumpStreak(req.userId!);
  await checkAndAwardBadges(req.userId!);

  res.status(201).json({
    id: question.id,
    title: question.title,
    content: question.content,
    subject: question.subject,
    imageUrls: imageUrls || [],
    authorId: question.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    upvotes: question.upvotes,
    downvotes: question.downvotes,
    answerCount: 0,
    hasAwardedAnswer: question.hasAwardedAnswer,
    isSolved: question.isSolved,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  });
});

router.get("/questions/:id", optionalAuthenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [questionRow] = await db
    .select({ q: questionsTable, author: { username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl, points: usersTable.points, isPremium: usersTable.isPremium } })
    .from(questionsTable)
    .innerJoin(usersTable, eq(questionsTable.authorId, usersTable.id))
    .where(eq(questionsTable.id, id));

  if (!questionRow) { res.status(404).json({ error: "Question not found" }); return; }

  // Hidden questions are only visible to the author and admins.
  if (questionRow.q.isHidden && req.userRole !== "admin" && req.userId !== questionRow.q.authorId) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const answers = await db
    .select({ a: answersTable, author: { username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl, points: usersTable.points, isPremium: usersTable.isPremium } })
    .from(answersTable)
    .innerJoin(usersTable, eq(answersTable.authorId, usersTable.id))
    .where(and(eq(answersTable.questionId, id), eq(answersTable.isHidden, false)))
    .orderBy(desc(answersTable.isAwarded), desc(answersTable.upvotes), asc(answersTable.createdAt));

  // Increment view count — throttled per viewer (30 min) and skipping the author.
  const viewerKey: string | number =
    req.userId && req.userId !== questionRow.q.authorId
      ? req.userId
      : !req.userId
        ? (req.ip ?? req.socket.remoteAddress ?? "anon")
        : ""; // author viewing their own question — never counted
  if (viewerKey !== "" && shouldCountView(id, viewerKey)) {
    db.execute(sql`UPDATE questions SET views = views + 1 WHERE id = ${id}`).catch(() => {});
  }

  const { q, author } = questionRow;
  res.json({
    id: q.id,
    title: q.title,
    content: q.content,
    subject: q.subject,
    imageUrls: JSON.parse(q.imageUrls || "[]"),
    authorId: q.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points,
    authorIsPremium: author.isPremium ?? false,
    upvotes: q.upvotes,
    downvotes: q.downvotes,
    views: (q as any).views ?? 0,
    hasAwardedAnswer: q.hasAwardedAnswer,
    isSolved: q.isSolved,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    answers: answers.map(({ a, author: aa }) => ({
      id: a.id,
      content: a.content,
      questionId: a.questionId,
      authorId: a.authorId,
      authorUsername: aa.username,
      authorDisplayName: aa.displayName,
      authorAvatarUrl: aa.avatarUrl,
      authorPoints: aa.points,
      authorIsPremium: aa.isPremium ?? false,
      upvotes: a.upvotes,
      downvotes: a.downvotes,
      isAwarded: a.isAwarded,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
});

router.patch("/questions/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateQuestionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }
  if (question.authorId !== req.userId && req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  // Strict allow-list: only these user-editable fields can ever be changed via this endpoint.
  // Prevents mass-assignment (e.g. upvotes, authorId, isHidden) even if the zod schema is loosened later.
  const updateData: { title?: string; content?: string; subject?: string } = {};
  if (typeof parsed.data.title === "string") updateData.title = parsed.data.title.trim();
  if (typeof parsed.data.content === "string") updateData.content = parsed.data.content.trim();
  if (typeof parsed.data.subject === "string") updateData.subject = parsed.data.subject.trim();
  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No editable fields provided" });
    return;
  }

  const [updated] = await db.update(questionsTable).set(updateData).where(eq(questionsTable.id, id)).returning();
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));
  const [answerCount] = await db.select({ cnt: count() }).from(answersTable).where(eq(answersTable.questionId, id));

  res.json({
    id: updated.id, title: updated.title, content: updated.content, subject: updated.subject,
    imageUrls: JSON.parse(updated.imageUrls || "[]"),
    authorId: updated.authorId, authorUsername: author.username, authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl, upvotes: updated.upvotes, downvotes: updated.downvotes,
    answerCount: Number(answerCount.cnt), hasAwardedAnswer: updated.hasAwardedAnswer,
    isSolved: updated.isSolved, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/questions/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }
  if (question.authorId !== req.userId && req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  // Anti-farming: capture answer info BEFORE deletion so we can refund points.
  const allAnswers = await db.select({ authorId: answersTable.authorId, isAwarded: answersTable.isAwarded })
    .from(answersTable)
    .where(eq(answersTable.questionId, id));

  await db.delete(questionVotesTable).where(eq(questionVotesTable.questionId, id));
  await db.delete(answersTable).where(eq(answersTable.questionId, id));
  await db.delete(activityTable).where(eq(activityTable.questionId, id));
  await db.delete(questionsTable).where(eq(questionsTable.id, id));

  // Refund the +5 the question author received on creation (clamped at 0)
  await db.update(usersTable)
    .set({ points: sql`GREATEST(0, ${usersTable.points} - 5)` })
    .where(eq(usersTable.id, question.authorId));

  // Refund +10 per answer (and +50 if it was awarded a Gold Ribbon)
  for (const a of allAnswers) {
    const refund = 10 + (a.isAwarded ? 50 : 0);
    await db.update(usersTable)
      .set({ points: sql`GREATEST(0, ${usersTable.points} - ${refund})` })
      .where(eq(usersTable.id, a.authorId));
  }

  // After refunding, re-evaluate badges so users can't keep ones they no longer
  // qualify for (e.g. "Minte Curioasă" requires 5 questions).
  await revokeUnearnedBadges(question.authorId);
  const refundedAuthors = new Set(allAnswers.map(a => a.authorId));
  for (const authorId of refundedAuthors) {
    await revokeUnearnedBadges(authorId);
  }

  res.sendStatus(204);
});

router.post("/questions/:id/vote", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = VoteQuestionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { type } = parsed.data;
  if (type !== "up" && type !== "down") { res.status(400).json({ error: "Vote type must be 'up' or 'down'" }); return; }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }

  // Block any interaction on hidden questions (admins included for vote integrity).
  if (question.isHidden) {
    res.status(403).json({ error: "This question is hidden and cannot be voted on" });
    return;
  }

  // Block voting on own question
  if (question.authorId === req.userId) {
    res.status(403).json({ error: "You cannot vote on your own question" });
    return;
  }

  // Wrap the read-modify-write in a transaction with a row lock on the question to prevent
  // lost-update / counter drift when two clients vote at (almost) the same time. Counters are
  // re-derived from the votes table inside the lock, so they can never disagree with reality.
  const existingVote = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM questions WHERE id = ${id} FOR UPDATE`);

    const [prev] = await tx.select().from(questionVotesTable)
      .where(and(eq(questionVotesTable.questionId, id), eq(questionVotesTable.userId, req.userId!)));

    if (prev) {
      if (prev.voteType === type) {
        await tx.delete(questionVotesTable).where(eq(questionVotesTable.id, prev.id));
      } else {
        await tx.update(questionVotesTable).set({ voteType: type }).where(eq(questionVotesTable.id, prev.id));
      }
    } else {
      await tx.insert(questionVotesTable).values({ questionId: id, userId: req.userId!, voteType: type });
    }

    // Re-derive counters from the source of truth.
    await tx.execute(sql`
      UPDATE questions SET
        upvotes = (SELECT COUNT(*) FROM question_votes WHERE question_id = ${id} AND vote_type = 'up'),
        downvotes = (SELECT COUNT(*) FROM question_votes WHERE question_id = ${id} AND vote_type = 'down')
      WHERE id = ${id}
    `);

    return prev;
  });

  const [updated] = await db.select({ q: questionsTable, author: { username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl } })
    .from(questionsTable).innerJoin(usersTable, eq(questionsTable.authorId, usersTable.id)).where(eq(questionsTable.id, id));
  const [answerCount] = await db.select({ cnt: count() }).from(answersTable).where(eq(answersTable.questionId, id));

  // Notify on upvote milestones
  const Q_UPVOTE_MILESTONES = [1, 5, 10, 25, 50, 100];
  if (!existingVote && type === "up" && question.authorId !== req.userId && Q_UPVOTE_MILESTONES.includes(updated.q.upvotes)) {
    await createNotification(
      question.authorId,
      "question_upvote",
      `Întrebarea ta a ajuns la ${updated.q.upvotes} vot${updated.q.upvotes === 1 ? "" : "uri"} pozitiv${updated.q.upvotes === 1 ? "" : "e"}!`,
      `"${question.title.slice(0, 70)}" tocmai a atins ${updated.q.upvotes} vot${updated.q.upvotes === 1 ? "" : "uri"} pozitiv${updated.q.upvotes === 1 ? "" : "e"}.`,
      id
    );
  }

  res.json({
    id: updated.q.id, title: updated.q.title, content: updated.q.content, subject: updated.q.subject,
    imageUrls: JSON.parse(updated.q.imageUrls || "[]"),
    authorId: updated.q.authorId, authorUsername: updated.author.username, authorDisplayName: updated.author.displayName,
    authorAvatarUrl: updated.author.avatarUrl, upvotes: updated.q.upvotes, downvotes: updated.q.downvotes,
    answerCount: Number(answerCount.cnt), hasAwardedAnswer: updated.q.hasAwardedAnswer,
    isSolved: updated.q.isSolved, createdAt: updated.q.createdAt.toISOString(), updatedAt: updated.q.updatedAt.toISOString(),
  });
});

// Get current user's daily usage limits
router.get("/my-limits", authenticate, async (req, res): Promise<void> => {
  const todayStart = startOfTodayUTC();
  const [qCount] = await db.select({ cnt: count() }).from(questionsTable)
    .where(and(eq(questionsTable.authorId, req.userId!), gte(questionsTable.createdAt, todayStart)));
  const [aCount] = await db.select({ cnt: count() }).from(answersTable)
    .where(and(eq(answersTable.authorId, req.userId!), gte(answersTable.createdAt, todayStart)));
  const [userRow] = await db.select({ points: usersTable.points })
    .from(usersTable).where(eq(usersTable.id, req.userId!));

  const premium = await getEffectivePremium(req.userId!);

  res.json({
    questionsToday: Number(qCount.cnt),
    questionLimit: premium ? null : DAILY_QUESTION_LIMIT,
    questionsRemaining: premium ? null : Math.max(0, DAILY_QUESTION_LIMIT - Number(qCount.cnt)),
    questionBonusPool: 0,
    answersToday: Number(aCount.cnt),
    answerLimit: premium ? null : 15,
    answersRemaining: premium ? null : Math.max(0, 15 - Number(aCount.cnt)),
    points: userRow?.points ?? 0,
    isPremium: premium,
  });
});


router.get("/questions/:id/similar", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [qRow] = await db.select({ subject: questionsTable.subject }).from(questionsTable).where(eq(questionsTable.id, id));
  if (!qRow) { res.status(404).json({ error: "Question not found" }); return; }

  const similar = await db
    .select({ q: questionsTable, author: { displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl } })
    .from(questionsTable)
    .innerJoin(usersTable, eq(questionsTable.authorId, usersTable.id))
    .where(and(eq(questionsTable.subject, qRow.subject), sql`${questionsTable.id} != ${id}`, eq(questionsTable.isHidden, false)))
    .orderBy(desc(questionsTable.upvotes))
    .limit(4);

  res.json(similar.map(({ q, author }) => ({
    id: q.id,
    title: q.title,
    subject: q.subject,
    upvotes: q.upvotes,
    isSolved: q.isSolved,
    createdAt: q.createdAt.toISOString(),
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
  })));
});

export default router;
