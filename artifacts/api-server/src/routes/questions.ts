import { Router } from "express";
import { db, usersTable, questionsTable, answersTable, questionVotesTable, activityTable } from "@workspace/db";
import { eq, count, sql, and, desc, asc, ilike, or } from "drizzle-orm";
import { authenticate, optionalAuthenticate } from "../middlewares/authenticate";
import { CreateQuestionBody, UpdateQuestionBody, VoteQuestionBody, ListQuestionsQueryParams } from "@workspace/api-zod";
import { checkAndAwardBadges } from "../lib/badges";

const router = Router();

router.get("/questions", optionalAuthenticate, async (req, res): Promise<void> => {
  const params = ListQuestionsQueryParams.safeParse(req.query);
  const page = params.success && params.data.page ? Number(params.data.page) : 1;
  const limit = params.success && params.data.limit ? Number(params.data.limit) : 10;
  const subject = params.success ? params.data.subject : undefined;
  const search = params.success ? params.data.search : undefined;
  const sort = params.success ? params.data.sort : "newest";

  const offset = (page - 1) * limit;

  const conditions = [];
  if (subject && subject !== "all") conditions.push(eq(questionsTable.subject, subject));
  if (search) conditions.push(or(ilike(questionsTable.title, `%${search}%`), ilike(questionsTable.content, `%${search}%`)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderClause;
  if (sort === "oldest") orderClause = asc(questionsTable.createdAt);
  else if (sort === "most-voted") orderClause = desc(questionsTable.upvotes);
  else if (sort === "unsolved") orderClause = asc(questionsTable.isSolved);
  else orderClause = desc(questionsTable.createdAt);

  const [totalRow] = await db.select({ count: count() }).from(questionsTable).where(whereClause);
  const total = Number(totalRow.count);

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

router.post("/questions", authenticate, async (req, res): Promise<void> => {
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db.insert(questionsTable).values({
    ...parsed.data,
    authorId: req.userId!,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  await db.insert(activityTable).values({
    type: "question_asked",
    userId: req.userId!,
    questionId: question.id,
  });

  await db.update(usersTable).set({ points: sql`${usersTable.points} + 5` }).where(eq(usersTable.id, req.userId!));
  await checkAndAwardBadges(req.userId!);

  res.status(201).json({
    id: question.id,
    title: question.title,
    content: question.content,
    subject: question.subject,
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
    .select({
      q: questionsTable,
      author: {
        username: usersTable.username,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        points: usersTable.points,
      },
    })
    .from(questionsTable)
    .innerJoin(usersTable, eq(questionsTable.authorId, usersTable.id))
    .where(eq(questionsTable.id, id));

  if (!questionRow) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

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
    .where(eq(answersTable.questionId, id))
    .orderBy(desc(answersTable.isAwarded), desc(answersTable.upvotes), asc(answersTable.createdAt));

  const { q, author } = questionRow;
  res.json({
    id: q.id,
    title: q.title,
    content: q.content,
    subject: q.subject,
    authorId: q.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    authorPoints: author.points,
    upvotes: q.upvotes,
    downvotes: q.downvotes,
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
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  if (question.authorId !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db.update(questionsTable).set(parsed.data).where(eq(questionsTable.id, id)).returning();
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, updated.authorId));

  const [answerCount] = await db.select({ cnt: count() }).from(answersTable).where(eq(answersTable.questionId, id));

  res.json({
    id: updated.id,
    title: updated.title,
    content: updated.content,
    subject: updated.subject,
    authorId: updated.authorId,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    authorAvatarUrl: author.avatarUrl,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    answerCount: Number(answerCount.cnt),
    hasAwardedAnswer: updated.hasAwardedAnswer,
    isSolved: updated.isSolved,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/questions/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  if (question.authorId !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(questionVotesTable).where(eq(questionVotesTable.questionId, id));
  await db.delete(answersTable).where(eq(answersTable.questionId, id));
  await db.delete(activityTable).where(eq(activityTable.questionId, id));
  await db.delete(questionsTable).where(eq(questionsTable.id, id));

  res.sendStatus(204);
});

router.post("/questions/:id/vote", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const parsed = VoteQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type } = parsed.data;
  if (type !== "up" && type !== "down") {
    res.status(400).json({ error: "Vote type must be 'up' or 'down'" });
    return;
  }

  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const [existingVote] = await db.select()
    .from(questionVotesTable)
    .where(and(eq(questionVotesTable.questionId, id), eq(questionVotesTable.userId, req.userId!)));

  if (existingVote) {
    if (existingVote.voteType === type) {
      await db.delete(questionVotesTable).where(eq(questionVotesTable.id, existingVote.id));
      if (type === "up") await db.update(questionsTable).set({ upvotes: sql`${questionsTable.upvotes} - 1` }).where(eq(questionsTable.id, id));
      else await db.update(questionsTable).set({ downvotes: sql`${questionsTable.downvotes} - 1` }).where(eq(questionsTable.id, id));
    } else {
      await db.update(questionVotesTable).set({ voteType: type }).where(eq(questionVotesTable.id, existingVote.id));
      if (type === "up") {
        await db.update(questionsTable).set({ upvotes: sql`${questionsTable.upvotes} + 1`, downvotes: sql`${questionsTable.downvotes} - 1` }).where(eq(questionsTable.id, id));
      } else {
        await db.update(questionsTable).set({ downvotes: sql`${questionsTable.downvotes} + 1`, upvotes: sql`${questionsTable.upvotes} - 1` }).where(eq(questionsTable.id, id));
      }
    }
  } else {
    await db.insert(questionVotesTable).values({ questionId: id, userId: req.userId!, voteType: type });
    if (type === "up") await db.update(questionsTable).set({ upvotes: sql`${questionsTable.upvotes} + 1` }).where(eq(questionsTable.id, id));
    else await db.update(questionsTable).set({ downvotes: sql`${questionsTable.downvotes} + 1` }).where(eq(questionsTable.id, id));
  }

  const [updated] = await db
    .select({ q: questionsTable, author: { username: usersTable.username, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl } })
    .from(questionsTable)
    .innerJoin(usersTable, eq(questionsTable.authorId, usersTable.id))
    .where(eq(questionsTable.id, id));

  const [answerCount] = await db.select({ cnt: count() }).from(answersTable).where(eq(answersTable.questionId, id));

  res.json({
    id: updated.q.id,
    title: updated.q.title,
    content: updated.q.content,
    subject: updated.q.subject,
    authorId: updated.q.authorId,
    authorUsername: updated.author.username,
    authorDisplayName: updated.author.displayName,
    authorAvatarUrl: updated.author.avatarUrl,
    upvotes: updated.q.upvotes,
    downvotes: updated.q.downvotes,
    answerCount: Number(answerCount.cnt),
    hasAwardedAnswer: updated.q.hasAwardedAnswer,
    isSolved: updated.q.isSolved,
    createdAt: updated.q.createdAt.toISOString(),
    updatedAt: updated.q.updatedAt.toISOString(),
  });
});

export default router;
