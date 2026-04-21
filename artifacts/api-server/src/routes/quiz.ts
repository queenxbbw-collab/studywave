import { Router } from "express";
import { db, quizResultsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { QUIZ_ANSWERS, QUIZ_TOTALS } from "../lib/quizAnswers";

const router = Router();

router.post("/quiz/submit", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const { classGrade, answers, timeTaken } = req.body;

  if (!classGrade || !Array.isArray(answers)) {
    res.status(400).json({ error: "classGrade and answers[] are required." });
    return;
  }

  const correctAnswers = QUIZ_ANSWERS[String(classGrade)];
  if (!correctAnswers) {
    res.status(400).json({ error: "Invalid classGrade." });
    return;
  }

  const total = correctAnswers.length;
  if (answers.length !== total) {
    res.status(400).json({ error: `Expected ${total} answers.` });
    return;
  }

  const score = answers.reduce((acc: number, a: number, i: number) => {
    return acc + (a === correctAnswers[i] ? 1 : 0);
  }, 0);

  const existing = await db
    .select()
    .from(quizResultsTable)
    .where(and(eq(quizResultsTable.userId, userId), eq(quizResultsTable.classGrade, String(classGrade))))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Ai dat deja quiz-ul pentru această clasă.", result: existing[0] });
    return;
  }

  const [result] = await db
    .insert(quizResultsTable)
    .values({ userId, classGrade: String(classGrade), score, total, timeTaken: timeTaken ?? null })
    .returning();

  res.status(201).json({ result });
});

router.get("/quiz/my-results", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const results = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.userId, userId));

  res.json({ results });
});

export default router;
