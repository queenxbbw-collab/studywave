import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { createNotification, parseMentions } from "./notifications";
import { bumpStreak } from "../lib/streak";

const router: IRouter = Router();

const DAILY_COMMENT_LIMIT = 50;
const MIN_COMMENT_LENGTH = 5;

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function checkCommentLimit(userId: number): Promise<boolean> {
  const todayStart = startOfTodayUTC();
  const [row] = (await db.execute(sql`
    SELECT COUNT(*) as cnt FROM comments
    WHERE user_id = ${userId} AND created_at >= ${todayStart.toISOString()}
  `)).rows as any[];
  return parseInt(row?.cnt ?? "0") < DAILY_COMMENT_LIMIT;
}

router.get("/comments/answer/:answerId", async (req, res): Promise<void> => {
  const answerId = parseInt(req.params.answerId);
  if (isNaN(answerId)) { res.status(400).json({ error: "Invalid answer ID" }); return; }

  const comments = await db.execute(sql`
    SELECT c.id, c.content, c.created_at,
      u.id as author_id, u.display_name as author_display_name,
      u.username as author_username, u.avatar_url as author_avatar_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.answer_id = ${answerId}
    ORDER BY c.created_at ASC
  `);

  res.json({ comments: comments.rows.map((c: any) => ({
    id: c.id,
    content: c.content,
    createdAt: c.created_at,
    authorId: c.author_id,
    authorDisplayName: c.author_display_name,
    authorUsername: c.author_username,
    authorAvatarUrl: c.author_avatar_url,
  })) });
});

router.post("/comments", authenticate, async (req, res): Promise<void> => {
  const { answerId, content } = req.body as { answerId?: number; content?: string };
  if (!answerId || typeof answerId !== "number") { res.status(400).json({ error: "answerId required" }); return; }
  if (!content || content.trim().length < MIN_COMMENT_LENGTH) { res.status(400).json({ error: `Comment must be at least ${MIN_COMMENT_LENGTH} characters` }); return; }
  if (content.trim().length > 500) { res.status(400).json({ error: "Comment too long (max 500 chars)" }); return; }

  const canComment = await checkCommentLimit(req.userId!);
  if (!canComment) { res.status(429).json({ error: `You've reached the daily limit of ${DAILY_COMMENT_LIMIT} comments. Come back tomorrow!` }); return; }

  const [answer] = (await db.execute(sql`
    SELECT a.id, a.is_hidden AS answer_hidden, q.is_hidden AS question_hidden
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    WHERE a.id = ${answerId}
  `)).rows as any[];
  if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }
  if (answer.answer_hidden || answer.question_hidden) {
    res.status(403).json({ error: "This thread is hidden and cannot receive new comments" });
    return;
  }

  const result = await db.execute(sql`
    INSERT INTO comments (answer_id, user_id, content) VALUES (${answerId}, ${req.userId}, ${content.trim()})
    RETURNING id, content, created_at
  `);
  const comment = result.rows[0] as any;
  const [user] = (await db.execute(sql`SELECT id, display_name, username, avatar_url FROM users WHERE id = ${req.userId}`)).rows as any[];

  // Notify answer author (unless they are the commenter)
  const [answerRow] = (await db.execute(sql`SELECT author_id, question_id FROM answers WHERE id = ${answerId}`)).rows as any[];
  if (answerRow && answerRow.author_id !== req.userId) {
    await createNotification(
      answerRow.author_id,
      "new_comment",
      "Comentariu nou la răspunsul tău",
      `${user?.display_name || user?.username || "Cineva"} a comentat: "${content.trim().slice(0, 80)}"`,
      answerRow.question_id
    );
  }
  // Parse @mentions
  await parseMentions(content.trim(), req.userId!, user?.display_name || user?.username || "Cineva", answerRow?.question_id);
  await bumpStreak(req.userId!);

  res.status(201).json({ comment: {
    id: comment.id, content: comment.content, createdAt: comment.created_at,
    authorId: user.id, authorDisplayName: user.display_name, authorUsername: user.username, authorAvatarUrl: user.avatar_url,
  }});
});

router.delete("/comments/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [comment] = (await db.execute(sql`SELECT user_id FROM comments WHERE id = ${id}`)).rows as any[];
  if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }
  if (comment.user_id !== req.userId && req.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await db.execute(sql`DELETE FROM comments WHERE id = ${id}`);
  res.json({ success: true });
});

export default router;
