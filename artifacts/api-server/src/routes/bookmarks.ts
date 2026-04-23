import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

router.post("/bookmarks", authenticate, async (req, res): Promise<void> => {
  const { questionId } = req.body as { questionId?: number };
  if (!questionId || typeof questionId !== "number") { res.status(400).json({ error: "questionId required" }); return; }
  const [q] = (await db.execute(sql`SELECT id FROM questions WHERE id = ${questionId}`)).rows;
  if (!q) { res.status(404).json({ error: "Question not found" }); return; }
  // Idempotent: ON CONFLICT DO NOTHING relies on the unique index on (user_id, question_id).
  // Replaces the previous silent try/catch which masked any unrelated DB error too.
  await db.execute(sql`
    INSERT INTO bookmarks (user_id, question_id)
    VALUES (${req.userId}, ${questionId})
    ON CONFLICT (user_id, question_id) DO NOTHING
  `);
  res.json({ bookmarked: true });
});

router.get("/bookmarks/:questionId", authenticate, async (req, res): Promise<void> => {
  const questionId = parseInt(req.params.questionId);
  if (isNaN(questionId)) { res.status(400).json({ error: "Invalid question ID" }); return; }
  const [existing] = (await db.execute(sql`SELECT id FROM bookmarks WHERE user_id = ${req.userId} AND question_id = ${questionId}`)).rows;
  res.json({ isBookmarked: !!existing });
});

router.delete("/bookmarks/:questionId", authenticate, async (req, res): Promise<void> => {
  const questionId = parseInt(req.params.questionId);
  if (isNaN(questionId)) { res.status(400).json({ error: "Invalid question ID" }); return; }
  await db.execute(sql`DELETE FROM bookmarks WHERE user_id = ${req.userId} AND question_id = ${questionId}`);
  res.json({ bookmarked: false });
});

router.get("/bookmarks", authenticate, async (req, res): Promise<void> => {
  const questions = await db.execute(sql`
    SELECT q.id, q.title, q.content, q.subject, q.upvotes, q.downvotes, q.views,
      q.is_solved, q.created_at,
      u.id as author_id, u.display_name as author_display_name,
      u.points as author_points, u.avatar_url as author_avatar_url,
      COUNT(DISTINCT a.id) as answer_count,
      b.created_at as bookmarked_at
    FROM bookmarks b
    JOIN questions q ON b.question_id = q.id
    JOIN users u ON q.author_id = u.id
    LEFT JOIN answers a ON a.question_id = q.id
    WHERE b.user_id = ${req.userId}
    GROUP BY q.id, u.id, b.created_at
    ORDER BY b.created_at DESC
  `);

  const mapped = questions.rows.map((q: any) => ({
    bookmarkId: q.id,
    id: q.id,
    title: q.title,
    content: q.content,
    subject: q.subject,
    upvotes: q.upvotes,
    downvotes: q.downvotes,
    views: q.views,
    isSolved: q.is_solved,
    createdAt: q.created_at,
    bookmarkedAt: q.bookmarked_at,
    authorId: q.author_id,
    authorDisplayName: q.author_display_name,
    authorPoints: q.author_points,
    authorAvatarUrl: q.author_avatar_url,
    answerCount: parseInt(q.answer_count),
  }));
  res.json({ bookmarks: mapped });
});

export default router;
