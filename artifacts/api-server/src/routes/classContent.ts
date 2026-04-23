import { Router, type IRouter, type Request, type Response } from "express";
import { db, classLessonsTable, classQuizQuestionsTable, classWorksheetsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/authenticate";

const router: IRouter = Router();

function isStr(v: any, max = 5000): v is string { return typeof v === "string" && v.length > 0 && v.length <= max; }
function isOptStr(v: any, max = 5000): v is string | undefined | null {
  return v == null || (typeof v === "string" && v.length <= max);
}
function isStrArr(v: any, max = 200): v is string[] {
  return Array.isArray(v) && v.length <= max && v.every(s => typeof s === "string" && s.length <= 5000);
}
function isGrade(v: any): v is number {
  return Number.isInteger(v) && v >= 1 && v <= 12;
}

function parseLesson(body: any, partial = false): { ok: true; data: any } | { ok: false; error: string } {
  const out: any = {};
  if (body == null || typeof body !== "object") return { ok: false, error: "Body must be an object" };
  if (body.grade !== undefined) { if (!isGrade(body.grade)) return { ok: false, error: "grade must be 1-12" }; out.grade = body.grade; }
  else if (!partial) return { ok: false, error: "grade required" };
  if (body.title !== undefined) { if (!isStr(body.title, 300)) return { ok: false, error: "title required" }; out.title = body.title; }
  else if (!partial) return { ok: false, error: "title required" };
  if (body.description !== undefined) { if (!isStr(body.description, 1000)) return { ok: false, error: "description required" }; out.description = body.description; }
  else if (!partial) return { ok: false, error: "description required" };
  if (body.topics !== undefined) { if (!isStrArr(body.topics)) return { ok: false, error: "topics must be string[]" }; out.topics = body.topics; }
  else if (!partial) out.topics = [];
  if (body.pages !== undefined) {
    if (!Array.isArray(body.pages)) return { ok: false, error: "pages must be an array" };
    for (const p of body.pages) {
      if (!p || typeof p !== "object") return { ok: false, error: "page must be object" };
      if (!isStr(p.title, 300)) return { ok: false, error: "page.title required" };
      if (!isStr(p.explanation, 10000)) return { ok: false, error: "page.explanation required" };
      if (p.keyPoints != null && !isStrArr(p.keyPoints)) return { ok: false, error: "page.keyPoints must be string[]" };
      if (p.examples != null) {
        if (!Array.isArray(p.examples)) return { ok: false, error: "page.examples must be array" };
        for (const ex of p.examples) {
          if (!ex || typeof ex !== "object" || typeof ex.label !== "string" || typeof ex.value !== "string") {
            return { ok: false, error: "page.examples must be {label,value}[]" };
          }
        }
      }
      if (p.exercise != null && typeof p.exercise !== "string") return { ok: false, error: "page.exercise must be string" };
    }
    out.pages = body.pages;
  } else if (!partial) out.pages = [];
  if (body.position !== undefined) { if (!Number.isInteger(body.position)) return { ok: false, error: "position must be int" }; out.position = body.position; }
  return { ok: true, data: out };
}

function parseQuiz(body: any, partial = false): { ok: true; data: any } | { ok: false; error: string } {
  const out: any = {};
  if (body == null || typeof body !== "object") return { ok: false, error: "Body must be an object" };
  if (body.grade !== undefined) { if (!isGrade(body.grade)) return { ok: false, error: "grade must be 1-12" }; out.grade = body.grade; }
  else if (!partial) return { ok: false, error: "grade required" };
  if (body.question !== undefined) { if (!isStr(body.question, 1000)) return { ok: false, error: "question required" }; out.question = body.question; }
  else if (!partial) return { ok: false, error: "question required" };
  if (body.options !== undefined) {
    if (!isStrArr(body.options) || body.options.length < 2 || body.options.length > 11) return { ok: false, error: "options must have 2-11 strings" };
    out.options = body.options;
  } else if (!partial) return { ok: false, error: "options required" };
  if (body.answer !== undefined) {
    if (!Number.isInteger(body.answer) || body.answer < 0 || body.answer > 10) return { ok: false, error: "answer must be int 0-10" };
    out.answer = body.answer;
  } else if (!partial) return { ok: false, error: "answer required" };
  if (out.options && out.answer !== undefined && out.answer >= out.options.length) {
    return { ok: false, error: "answer index out of range" };
  }
  if (body.position !== undefined) { if (!Number.isInteger(body.position)) return { ok: false, error: "position must be int" }; out.position = body.position; }
  return { ok: true, data: out };
}

function parseWorksheet(body: any, partial = false): { ok: true; data: any } | { ok: false; error: string } {
  const out: any = {};
  if (body == null || typeof body !== "object") return { ok: false, error: "Body must be an object" };
  if (body.grade !== undefined) { if (!isGrade(body.grade)) return { ok: false, error: "grade must be 1-12" }; out.grade = body.grade; }
  else if (!partial) return { ok: false, error: "grade required" };
  if (body.title !== undefined) { if (!isStr(body.title, 300)) return { ok: false, error: "title required" }; out.title = body.title; }
  else if (!partial) return { ok: false, error: "title required" };
  if (body.description !== undefined) { if (!isStr(body.description, 1000)) return { ok: false, error: "description required" }; out.description = body.description; }
  else if (!partial) return { ok: false, error: "description required" };
  if (body.intro !== undefined) { if (!isStr(body.intro, 5000)) return { ok: false, error: "intro required" }; out.intro = body.intro; }
  else if (!partial) return { ok: false, error: "intro required" };
  if (body.tip !== undefined) { if (!isOptStr(body.tip, 1000)) return { ok: false, error: "tip must be string|null" }; out.tip = body.tip ?? null; }
  if (body.exercises !== undefined) {
    if (!Array.isArray(body.exercises)) return { ok: false, error: "exercises must be array" };
    for (const ex of body.exercises) {
      if (!ex || typeof ex !== "object") return { ok: false, error: "exercise must be object" };
      if (!isStr(ex.instruction, 5000)) return { ok: false, error: "exercise.instruction required" };
      if (ex.items != null && !isStrArr(ex.items)) return { ok: false, error: "exercise.items must be string[]" };
      if (ex.hint != null && typeof ex.hint !== "string") return { ok: false, error: "exercise.hint must be string" };
    }
    out.exercises = body.exercises;
  } else if (!partial) out.exercises = [];
  if (body.position !== undefined) { if (!Number.isInteger(body.position)) return { ok: false, error: "position must be int" }; out.position = body.position; }
  return { ok: true, data: out };
}

// Public: returns admin-added extra content for a grade.
router.get("/classes/:grade/extras", async (req: Request, res: Response): Promise<void> => {
  const grade = parseInt(req.params.grade, 10);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    res.status(400).json({ error: "Invalid grade" });
    return;
  }
  const [lessons, quiz, worksheets] = await Promise.all([
    db.select().from(classLessonsTable).where(eq(classLessonsTable.grade, grade)).orderBy(asc(classLessonsTable.position), asc(classLessonsTable.id)),
    db.select().from(classQuizQuestionsTable).where(eq(classQuizQuestionsTable.grade, grade)).orderBy(asc(classQuizQuestionsTable.position), asc(classQuizQuestionsTable.id)),
    db.select().from(classWorksheetsTable).where(eq(classWorksheetsTable.grade, grade)).orderBy(asc(classWorksheetsTable.position), asc(classWorksheetsTable.id)),
  ]);
  // Strip the answer index from quiz questions before returning to public.
  const safeQuiz = quiz.map(q => ({ id: q.id, question: q.question, options: q.options, position: q.position }));
  res.json({ lessons, quiz: safeQuiz, worksheets });
});

// === ADMIN ===

// Lessons
router.post("/admin/classes/lessons", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = parseLesson(req.body, false);
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const [row] = await db.insert(classLessonsTable).values({
    grade: parsed.data.grade,
    title: parsed.data.title,
    description: parsed.data.description,
    topics: parsed.data.topics ?? [],
    pages: parsed.data.pages ?? [],
    position: parsed.data.position ?? 0,
  }).returning();
  res.status(201).json(row);
});

router.patch("/admin/classes/lessons/:id", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = parseLesson(req.body, true);
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const [row] = await db.update(classLessonsTable).set(parsed.data).where(eq(classLessonsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/admin/classes/lessons/:id", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(classLessonsTable).where(eq(classLessonsTable.id, id));
  res.status(204).end();
});

// Quiz
router.post("/admin/classes/quiz", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = parseQuiz(req.body, false);
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const [row] = await db.insert(classQuizQuestionsTable).values({
    grade: parsed.data.grade,
    question: parsed.data.question,
    options: parsed.data.options,
    answer: parsed.data.answer,
    position: parsed.data.position ?? 0,
  }).returning();
  res.status(201).json(row);
});

router.patch("/admin/classes/quiz/:id", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = parseQuiz(req.body, true);
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const [row] = await db.update(classQuizQuestionsTable).set(parsed.data).where(eq(classQuizQuestionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/admin/classes/quiz/:id", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(classQuizQuestionsTable).where(eq(classQuizQuestionsTable.id, id));
  res.status(204).end();
});

// Worksheets
router.post("/admin/classes/worksheets", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = parseWorksheet(req.body, false);
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const [row] = await db.insert(classWorksheetsTable).values({
    grade: parsed.data.grade,
    title: parsed.data.title,
    description: parsed.data.description,
    intro: parsed.data.intro,
    exercises: parsed.data.exercises ?? [],
    tip: parsed.data.tip ?? null,
    position: parsed.data.position ?? 0,
  }).returning();
  res.status(201).json(row);
});

router.patch("/admin/classes/worksheets/:id", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = parseWorksheet(req.body, true);
  if (!parsed.ok) { res.status(400).json({ error: parsed.error }); return; }
  const [row] = await db.update(classWorksheetsTable).set(parsed.data).where(eq(classWorksheetsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/admin/classes/worksheets/:id", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(classWorksheetsTable).where(eq(classWorksheetsTable.id, id));
  res.status(204).end();
});

// Admin: full list including answer keys
router.get("/admin/classes/:grade", authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const grade = parseInt(req.params.grade, 10);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    res.status(400).json({ error: "Invalid grade" });
    return;
  }
  const [lessons, quiz, worksheets] = await Promise.all([
    db.select().from(classLessonsTable).where(eq(classLessonsTable.grade, grade)).orderBy(asc(classLessonsTable.position), asc(classLessonsTable.id)),
    db.select().from(classQuizQuestionsTable).where(eq(classQuizQuestionsTable.grade, grade)).orderBy(asc(classQuizQuestionsTable.position), asc(classQuizQuestionsTable.id)),
    db.select().from(classWorksheetsTable).where(eq(classWorksheetsTable.grade, grade)).orderBy(asc(classWorksheetsTable.position), asc(classWorksheetsTable.id)),
  ]);
  res.json({ lessons, quiz, worksheets });
});

export default router;
