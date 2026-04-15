import { Router } from "express";
import { db, quizResultsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.post("/quiz/submit", authenticate, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { classGrade, score, total, timeTaken } = req.body;

  if (!classGrade || score === undefined || total === undefined) {
    res.status(400).json({ error: "Date incomplete." });
    return;
  }

  const existing = await db
    .select()
    .from(quizResultsTable)
    .where(and(eq(quizResultsTable.userId, userId), eq(quizResultsTable.classGrade, classGrade)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Ai dat deja quiz-ul pentru această clasă.", result: existing[0] });
    return;
  }

  const [result] = await db
    .insert(quizResultsTable)
    .values({ userId, classGrade, score, total, timeTaken: timeTaken ?? null })
    .returning();

  res.status(201).json({ result });
});

router.get("/quiz/my-results", authenticate, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;

  const results = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.userId, userId));

  res.json({ results });
});

export default router;
