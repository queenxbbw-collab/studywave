import { Router } from "express";
import { db, usersTable, questionsTable, answersTable, answerVotesTable, activityTable } from "@workspace/db";
import { eq, count, sql, and } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { CreateAnswerBody, UpdateAnswerBody, VoteAnswerBody } from "@workspace/api-zod";
import { checkAndAwardBadges } from "../lib/badges";

const router = Router();

router.post("/answers", authenticate, async (req, res): Promise<void> => {
  const parsed = CreateAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, parsed.data.questionId));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const [answer] = await db.insert(answersTable).values({
    content: parsed.data.content,
    questionId: parsed.data.questionId,
    authorId: req.userId!,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  await db.insert(activityTable).values({
    type: "answer_posted",
    userId: req.userId!,
    questionId: parsed.data.questionId,
  });

  await db.update(usersTable).set({ points: sql`${usersTable.points} + 10` }).where(eq(usersTable.id, req.userId!));
  await checkAndAwardBadges(req.userId!);

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
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }

  if (answer.authorId !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db.update(answersTable).set({ content: parsed.data.content }).where(eq(answersTable.id, id)).returning();
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));

  res.json({
    id: updated.id,
    content: updated.content,
    questionId: updated.questionId,
    authorId: updated.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    isAwarded: updated.isAwarded,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/answers/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }

  if (answer.authorId !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(answerVotesTable).where(eq(answerVotesTable.answerId, id));
  await db.delete(answersTable).where(eq(answersTable.id, id));

  res.sendStatus(204);
});

router.post("/answers/:id/vote", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = VoteAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type } = parsed.data;
  if (type !== "up" && type !== "down") {
    res.status(400).json({ error: "Vote type must be 'up' or 'down'" });
    return;
  }

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }

  const [existingVote] = await db.select()
    .from(answerVotesTable)
    .where(and(eq(answerVotesTable.answerId, id), eq(answerVotesTable.userId, req.userId!)));

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
    id: updated.id,
    content: updated.content,
    questionId: updated.questionId,
    authorId: updated.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    isAwarded: updated.isAwarded,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.post("/answers/:id/award", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [answer] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, answer.questionId));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

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

  await db.update(answersTable).set({ isAwarded: true }).where(eq(answersTable.id, id));
  await db.update(questionsTable).set({ hasAwardedAnswer: true, isSolved: true }).where(eq(questionsTable.id, answer.questionId));
  await db.update(usersTable).set({ points: sql`${usersTable.points} + 50` }).where(eq(usersTable.id, answer.authorId));
  await checkAndAwardBadges(answer.authorId);

  await db.insert(activityTable).values({
    type: "answer_awarded",
    userId: answer.authorId,
    questionId: answer.questionId,
  });

  const [updated] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));

  res.json({
    id: updated.id,
    content: updated.content,
    questionId: updated.questionId,
    authorId: updated.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    isAwarded: updated.isAwarded,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default router;
