import { Router } from "express";
import { db, usersTable, questionsTable, answersTable, answerVotesTable, activityTable } from "@workspace/db";
import { eq, count, sql, and, gte } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { UpdateAnswerBody, VoteAnswerBody } from "@workspace/api-zod";
import { checkAndAwardBadges } from "../lib/badges";
import { createNotification, parseMentions } from "./notifications";
import { getEffectivePremium } from "../lib/premium";
import { bumpStreak } from "../lib/streak";

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

  // Hidden questions are locked: no new answers (mirrors UI behavior at the API layer).
  if (question.isHidden) {
    res.status(403).json({ error: "This question is hidden and cannot receive new answers" });
    return;
  }

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

  // Daily answer rate limit (Premium users have unlimited answers)
  const isPremium = await getEffectivePremium(req.userId!);
  if (!isPremium) {
    const todayStart = startOfTodayUTC();
    const [todayCount] = await db.select({ cnt: count() }).from(answersTable)
      .where(and(eq(answersTable.authorId, req.userId!), gte(answersTable.createdAt, todayStart)));
    if (Number(todayCount.cnt) >= DAILY_ANSWER_LIMIT) {
      res.status(429).json({ error: `You've reached the daily limit of ${DAILY_ANSWER_LIMIT} answers. Upgrade to Premium for unlimited answers!` });
      return;
    }
  }

  const [answer] = await db.insert(answersTable).values({
    content,
    questionId,
    authorId: req.userId!,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  await db.insert(activityTable).values({ type: "answer_posted", userId: req.userId!, questionId });
  await db.update(usersTable).set({ points: sql`${usersTable.points} + 10` }).where(eq(usersTable.id, req.userId!));
  await bumpStreak(req.userId!);
  await checkAndAwardBadges(req.userId!);
  // Notify question author
  const [answerer] = await db.select({ displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, req.userId!));
  if (question.authorId !== req.userId) {
    await createNotification(
      question.authorId,
      "new_answer",
      "Răspuns nou la întrebarea ta",
      `${answerer?.displayName ?? "Cineva"} a răspuns la: "${question.title.slice(0, 60)}"`,
      questionId
    );
  }
  // Parse @mentions in answer content
  await parseMentions(content, req.userId!, answerer?.displayName ?? "Someone", questionId);

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

  // Strict allow-list — only `content` may ever be edited via this endpoint.
  if (typeof parsed.data.content !== "string") {
    res.status(400).json({ error: "No editable fields provided" });
    return;
  }
  const newContent = parsed.data.content.trim();
  if (newContent.length < MIN_ANSWER_LENGTH) {
    res.status(400).json({ error: `Answer must be at least ${MIN_ANSWER_LENGTH} characters` });
    return;
  }

  const [updated] = await db.update(answersTable).set({ content: newContent }).where(eq(answersTable.id, id)).returning();
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

  // Anti-farming: refund the +10 granted on creation, plus +50 if the answer was awarded.
  const refund = 10 + (answer.isAwarded ? 50 : 0);
  await db.update(usersTable)
    .set({ points: sql`GREATEST(0, ${usersTable.points} - ${refund})` })
    .where(eq(usersTable.id, answer.authorId));

  // If this was the awarded answer, clear the question's awarded/solved flags.
  if (answer.isAwarded) {
    await db.update(questionsTable)
      .set({ hasAwardedAnswer: false, isSolved: false })
      .where(eq(questionsTable.id, answer.questionId));
  }

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

  // Block votes on hidden answers, or answers belonging to hidden questions.
  if (answer.isHidden) {
    res.status(403).json({ error: "This answer is hidden and cannot be voted on" });
    return;
  }
  const [parentQuestion] = await db.select({ isHidden: questionsTable.isHidden }).from(questionsTable).where(eq(questionsTable.id, answer.questionId));
  if (parentQuestion?.isHidden) {
    res.status(403).json({ error: "This question is hidden and cannot be voted on" });
    return;
  }

  // Block voting on own answer
  if (answer.authorId === req.userId) {
    res.status(403).json({ error: "You cannot vote on your own answer" });
    return;
  }

  // Same locking + recompute pattern as questions/vote — prevents counter drift under concurrent votes.
  const existingVote = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM answers WHERE id = ${id} FOR UPDATE`);

    const [prev] = await tx.select().from(answerVotesTable)
      .where(and(eq(answerVotesTable.answerId, id), eq(answerVotesTable.userId, req.userId!)));

    if (prev) {
      if (prev.voteType === type) {
        await tx.delete(answerVotesTable).where(eq(answerVotesTable.id, prev.id));
      } else {
        await tx.update(answerVotesTable).set({ voteType: type }).where(eq(answerVotesTable.id, prev.id));
      }
    } else {
      await tx.insert(answerVotesTable).values({ answerId: id, userId: req.userId!, voteType: type });
    }

    await tx.execute(sql`
      UPDATE answers SET
        upvotes = (SELECT COUNT(*) FROM answer_votes WHERE answer_id = ${id} AND vote_type = 'up'),
        downvotes = (SELECT COUNT(*) FROM answer_votes WHERE answer_id = ${id} AND vote_type = 'down')
      WHERE id = ${id}
    `);

    return prev;
  });

  const [updated] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));

  // Notify on upvote milestones (new vote only, upvotes going to 1/5/10/25/50/100)
  const UPVOTE_MILESTONES = [1, 5, 10, 25, 50, 100];
  if (!existingVote && type === "up" && answer.authorId !== req.userId && UPVOTE_MILESTONES.includes(updated.upvotes)) {
    const [q] = await db.select({ title: questionsTable.title }).from(questionsTable).where(eq(questionsTable.id, updated.questionId));
    await createNotification(
      answer.authorId,
      "answer_upvote",
      `Răspunsul tău a ajuns la ${updated.upvotes} vot${updated.upvotes === 1 ? "" : "uri"} pozitiv${updated.upvotes === 1 ? "" : "e"}!`,
      `Răspunsul tău la "${q?.title?.slice(0, 60) ?? "o întrebare"}" tocmai a atins ${updated.upvotes} vot${updated.upvotes === 1 ? "" : "uri"} pozitiv${updated.upvotes === 1 ? "" : "e"}.`,
      updated.questionId
    );
  }

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
    "🎖️ Răspunsul tău a câștigat o Panglică de Aur!",
    `Ai primit +50 de puncte pentru cel mai bun răspuns la: "${question.title.slice(0, 60)}"`,
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

// Revoke a previously-awarded Gold Ribbon (question author or admin only).
router.delete("/answers/:id/award", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }
  if (!answer.isAwarded) { res.status(400).json({ error: "This answer does not have a Gold Ribbon" }); return; }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, answer.questionId));
  if (!question) { res.status(404).json({ error: "Question not found" }); return; }

  if (question.authorId !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "Only the question author or an admin can revoke the Gold Ribbon" });
    return;
  }

  await db.update(answersTable).set({ isAwarded: false }).where(eq(answersTable.id, id));
  await db.update(questionsTable)
    .set({ hasAwardedAnswer: false, isSolved: false })
    .where(eq(questionsTable.id, answer.questionId));
  await db.update(usersTable)
    .set({ points: sql`GREATEST(0, ${usersTable.points} - 50)` })
    .where(eq(usersTable.id, answer.authorId));

  await createNotification(
    answer.authorId,
    "gold_ribbon",
    "Panglica de Aur a fost retrasă",
    `Panglica de Aur pentru răspunsul tău la "${question.title.slice(0, 60)}" a fost retrasă. -50 puncte.`,
    answer.questionId
  );

  res.sendStatus(204);
});

export default router;
