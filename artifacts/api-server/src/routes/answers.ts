import { Router } from "express";
import { db, usersTable, questionsTable, answersTable, answerVotesTable, activityTable } from "@workspace/db";
import { eq, count, sql, and, gte } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { UpdateAnswerBody, VoteAnswerBody } from "@workspace/api-zod";
import { checkAndAwardBadges } from "../lib/badges";
import { createNotification } from "./notifications";

// --- Limits ---
const DAILY_ANSWER_LIMIT = 15;
const MIN_ANSWER_LENGTH = 30;

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function validateCreateAnswer(body: unknown): { error?: string; data?: { questionId: number; content: string } } {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };
  const { questionId, content } = body as Record<string, unknown>;
  if (!questionId || typeof questionId !== "number" || !Number.isInteger(questionId) || questionId <= 0)
    return { error: "Valid questionId is required" };
  if (!content || typeof content !== "string" || content.trim().length < MIN_ANSWER_LENGTH)
    return { error: `Answer must be at least ${MIN_ANSWER_LENGTH} characters` };
  if (content.trim().length > 10000)
    return { error: "Answer must be 10,000 characters or less" };
  return { data: { questionId, content: content.trim() } };
}

const router = Router();

router.post("/answers", authenticate, async (req, res): Promise<void> => {
  const validation = validateCreateAnswer(req.body);
  if (validation.error) {
    res.status(400).json({ error: validation.error });
    return;
  }
  const { questionId, content } = validation.data!;

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, questionId));
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }

  // Block answering own question (prevents self-farming)
  if (question.authorId === req.userId) {
    res.status(403).json({ error: "You cannot answer your own question" });
    return;
  }

  // Duplicate answer check (one answer per question per user)
  const [existingAnswer] = await db.select().from(answersTable)
    .where(and(eq(answersTable.questionId, questionId), eq(answersTable.authorId, req.userId!)));
  if (existingAnswer) {
    res.status(409).json({ error: "You have already answered this question. Edit your existing answer instead." });
    return;
  }

  // Daily answer rate limit
  const todayStart = startOfTodayUTC();
  const [todayCount] = await db.select({ cnt: count() }).from(answersTable)
    .where(and(eq(answersTable.authorId, req.userId!), gte(answersTable.createdAt, todayStart)));
  if (Number(todayCount.cnt) >= DAILY_ANSWER_LIMIT) {
    res.status(429).json({ error: `You've reached the daily limit of ${DAILY_ANSWER_LIMIT} answers. Come back tomorrow!` });
    return;
  }

  const [answer] = await db.insert(answersTable).values({
    content,
    questionId,
    authorId: req.userId!,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  await db.insert(activityTable).values({ type: "answer_posted", userId: req.userId!, questionId });
  await db.update(usersTable).set({ points: sql`${usersTable.points} + 10` }).where(eq(usersTable.id, req.userId!));
  await checkAndAwardBadges(req.userId!);
  // Notify question author
  if (question.authorId !== req.userId) {
    const [answerer] = await db.select({ displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, req.userId!));
    await createNotification(
      question.authorId,
      "new_answer",
      "New answer on your question",
      `${answerer?.displayName ?? "Someone"} answered: "${question.title.slice(0, 60)}"`,
      questionId
    );
  }

  res.status(201).json({
    id: answer.id,
    content: answer.content,
    questionId: answer.questionId,
    authorId: answer.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points + 10,
    upvotes: answer.upvotes,
    downvotes: answer.downvotes,
    isAwarded: answer.isAwarded,
    createdAt: answer.createdAt.toISOString(),
    updatedAt: answer.updatedAt.toISOString(),
  });
});

router.patch("/answers/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = UpdateAnswerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }
  if (answer.authorId !== req.userId && req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  // Validate min length on edit too
  if (parsed.data.content && parsed.data.content.length < MIN_ANSWER_LENGTH) {
    res.status(400).json({ error: `Answer must be at least ${MIN_ANSWER_LENGTH} characters` });
    return;
  }

  const [updated] = await db.update(answersTable).set({ content: parsed.data.content }).where(eq(answersTable.id, id)).returning();
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));

  res.json({
    id: updated.id, content: updated.content, questionId: updated.questionId, authorId: updated.authorId,
    authorUsername: author.username, authorDisplayName: author.displayName, authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points, upvotes: updated.upvotes, downvotes: updated.downvotes,
    isAwarded: updated.isAwarded, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/answers/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }
  if (answer.authorId !== req.userId && req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(answerVotesTable).where(eq(answerVotesTable.answerId, id));
  await db.delete(answersTable).where(eq(answersTable.id, id));
  res.sendStatus(204);
});

router.post("/answers/:id/vote", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = VoteAnswerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { type } = parsed.data;
  if (type !== "up" && type !== "down") { res.status(400).json({ error: "Vote type must be 'up' or 'down'" }); return; }

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }

  // Block voting on own answer
  if (answer.authorId === req.userId) {
    res.status(403).json({ error: "You cannot vote on your own answer" });
    return;
  }

  const [existingVote] = await db.select().from(answerVotesTable).where(and(eq(answerVotesTable.answerId, id), eq(answerVotesTable.userId, req.userId!)));

  if (existingVote) {
    if (existingVote.voteType === type) {
      await db.delete(answerVotesTable).where(eq(answerVotesTable.id, existingVote.id));
      if (type === "up") await db.update(answersTable).set({ upvotes: sql`${answersTable.upvotes} - 1` }).where(eq(answersTable.id, id));
      else await db.update(answersTable).set({ downvotes: sql`${answersTable.downvotes} - 1` }).where(eq(answersTable.id, id));
    } else {
      await db.update(answerVotesTable).set({ voteType: type }).where(eq(answerVotesTable.id, existingVote.id));
      if (type === "up") await db.update(answersTable).set({ upvotes: sql`${answersTable.upvotes} + 1`, downvotes: sql`${answersTable.downvotes} - 1` }).where(eq(answersTable.id, id));
      else await db.update(answersTable).set({ downvotes: sql`${answersTable.downvotes} + 1`, upvotes: sql`${answersTable.upvotes} - 1` }).where(eq(answersTable.id, id));
    }
  } else {
    await db.insert(answerVotesTable).values({ answerId: id, userId: req.userId!, voteType: type });
    if (type === "up") await db.update(answersTable).set({ upvotes: sql`${answersTable.upvotes} + 1` }).where(eq(answersTable.id, id));
    else await db.update(answersTable).set({ downvotes: sql`${answersTable.downvotes} + 1` }).where(eq(answersTable.id, id));
  }

  const [updated] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));

  res.json({
    id: updated.id, content: updated.content, questionId: updated.questionId, authorId: updated.authorId,
    authorUsername: author.username, authorDisplayName: author.displayName, authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points, upvotes: updated.upvotes, downvotes: updated.downvotes,
    isAwarded: updated.isAwarded, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString(),
  });
});

router.post("/answers/:id/award", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, answer.questionId));
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }

  if (question.authorId !== req.userId) {
    res.status(403).json({ error: "Only the question author can award an answer" });
    return;
  }
  if (question.hasAwardedAnswer) {
    res.status(400).json({ error: "This question already has an awarded answer" });
    return;
  }
  if (answer.authorId === req.userId) {
    res.status(400).json({ error: "You cannot award your own answer" });
    return;
  }

  // Limit: question must have at least 1 answer from someone else besides author — already checked above
  // Additional: question must be at least 5 minutes old (anti-collude)
  const questionAge = Date.now() - new Date(question.createdAt).getTime();
  if (questionAge < 5 * 60 * 1000) {
    res.status(400).json({ error: "You must wait at least 5 minutes after asking before awarding a Gold Ribbon." });
    return;
  }

  await db.update(answersTable).set({ isAwarded: true }).where(eq(answersTable.id, id));
  await db.update(questionsTable).set({ hasAwardedAnswer: true, isSolved: true }).where(eq(questionsTable.id, answer.questionId));
  await db.update(usersTable).set({ points: sql`${usersTable.points} + 50` }).where(eq(usersTable.id, answer.authorId));
  await checkAndAwardBadges(answer.authorId);

  await db.insert(activityTable).values({ type: "answer_awarded", userId: answer.authorId, questionId: answer.questionId });
  // Notify winner
  await createNotification(
    answer.authorId,
    "gold_ribbon",
    "🎖️ Your answer won a Gold Ribbon!",
    `You earned +50 points for the best answer on: "${question.title.slice(0, 60)}"`,
    answer.questionId
  );

  const [updated] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));

  res.json({
    id: updated.id, content: updated.content, questionId: updated.questionId, authorId: updated.authorId,
    authorUsername: author.username, authorDisplayName: author.displayName, authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points, upvotes: updated.upvotes, downvotes: updated.downvotes,
    isAwarded: updated.isAwarded, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
