import { Router } from "express";
import { db, quizResultsTable, classQuizQuestionsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { QUIZ_ANSWERS, QUIZ_TOTALS } from "../lib/quizAnswers";

const router = Router();

router.post("/quiz/submit", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const { classGrade, answers, extraAnswers, timeTaken } = req.body;

  if (!classGrade || !Array.isArray(answers)) {
    res.status(400).json({ error: "classGrade and answers[] are required." });
    return;
  }

  // Base questions come from the hardcoded answer key (grades 1–8). Higher grades have
  // no built-in quiz, so an empty base array is allowed if extras are present.
  const correctAnswers = QUIZ_ANSWERS[String(classGrade)] ?? [];
  const baseTotal = correctAnswers.length;
  if (answers.length !== baseTotal) {
    res.status(400).json({ error: `Expected ${baseTotal} base answers.` });
    return;
  }

  for (const a of answers) {
    if (typeof a !== "number" || !Number.isInteger(a) || a < 0 || a > 10) {
      res.status(400).json({ error: "Invalid answer format." });
      return;
    }
  }

  // Validate extras shape: array of { id: number, answer: number }
  let extras: { id: number; answer: number }[] = [];
  if (extraAnswers !== undefined) {
    if (!Array.isArray(extraAnswers)) {
      res.status(400).json({ error: "extraAnswers must be an array." });
      return;
    }
    for (const e of extraAnswers) {
      if (
        !e || typeof e !== "object"
        || typeof e.id !== "number" || !Number.isInteger(e.id)
        || typeof e.answer !== "number" || !Number.isInteger(e.answer)
        || e.answer < 0 || e.answer > 10
      ) {
        res.status(400).json({ error: "Invalid extraAnswer format." });
        return;
      }
    }
    extras = extraAnswers;
  }

  const cleanTimeTaken =
    typeof timeTaken === "number" && Number.isFinite(timeTaken) && timeTaken >= 0 && timeTaken <= 24 * 60 * 60
      ? Math.floor(timeTaken)
      : null;

  let baseScore = answers.reduce((acc: number, a: number, i: number) => {
    return acc + (a === correctAnswers[i] ? 1 : 0);
  }, 0);

  // Score the admin-added (DB-backed) questions against the trusted server-side answer key.
  let extraScore = 0;
  let extraTotal = 0;
  if (extras.length > 0) {
    const ids = extras.map(e => e.id);
    const dbQuestions = await db
      .select({ id: classQuizQuestionsTable.id, answer: classQuizQuestionsTable.answer, grade: classQuizQuestionsTable.grade })
      .from(classQuizQuestionsTable)
      .where(inArray(classQuizQuestionsTable.id, ids));
    const byId = new Map(dbQuestions.map(q => [q.id, q]));
    for (const e of extras) {
      const q = byId.get(e.id);
      // Silently ignore unknown ids (deleted between fetch & submit) and ids belonging
      // to other grades — they shouldn't have been on the page in the first place.
      if (!q || q.grade !== Number(classGrade)) continue;
      extraTotal++;
      if (q.answer === e.answer) extraScore++;
    }
  }

  const score = baseScore + extraScore;
  const total = baseTotal + extraTotal;
  if (total === 0) {
    res.status(400).json({ error: "No quiz questions configured for this class." });
    return;
  }

  const existing = await db
    .select()
    .from(quizResultsTable)
    .where(and(eq(quizResultsTable.userId, userId), eq(quizResultsTable.classGrade, String(classGrade))))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Ai dat deja quiz-ul pentru această clasă.", result: existing[0] });
    return;
  }

  // The DB-level unique index on (user_id, class_grade) is the real safety net here:
  // even if two requests slip past the SELECT above (double-click / parallel tabs),
  // the second INSERT will hit code 23505 and we return the already-saved row instead
  // of creating a duplicate.
  try {
    const [result] = await db
      .insert(quizResultsTable)
      .values({ userId, classGrade: String(classGrade), score, total, timeTaken: cleanTimeTaken })
      .returning();
    res.status(201).json({ result });
  } catch (err: any) {
    if (err?.code === "23505") {
      const [already] = await db
        .select()
        .from(quizResultsTable)
        .where(and(eq(quizResultsTable.userId, userId), eq(quizResultsTable.classGrade, String(classGrade))))
        .limit(1);
      res.status(409).json({ error: "Ai dat deja quiz-ul pentru această clasă.", result: already });
      return;
    }
    throw err;
  }
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
