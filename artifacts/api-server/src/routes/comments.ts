import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { createNotification } from "./notifications";

const router: IRouter = Router();

const DAILY_COMMENT_LIMIT = 50;
const MIN_COMMENT_LENGTH = 5;

async function checkCommentLimit(userId: number): Promise<boolean> {
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const [row] = (await db.execute(sql`
    SELECT COUNT(*) as cnt FROM comments
    WHERE user_id = ${userId} AND created_at >= ${todayUTC.toISOString()}
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

  const [answer] = (await db.execute(sql`SELECT id FROM answers WHERE id = ${answerId}`)).rows;
  if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }

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
      "New comment on your answer",
      `${user?.display_name || user?.username || "Someone"} commented: "${content.trim().slice(0, 80)}"`,
      answerRow.question_id
    );
  }

  res.status(201).json({ comment: {
    id: comment.id, content: comment.content, createdAt: comment.created_at,
    authorId: user.id, authorDisplayName: user.display_name, authorUsername: user.username, authorAvatarUrl: user.avatar_url,
  }});
});

router.post("/comments/answer/:answerId", authenticate, async (req, res): Promise<void> => {
  const answerId = parseInt(req.params.answerId);
  const { content } = req.body as { content?: string };
  if (isNaN(answerId)) { res.status(400).json({ error: "Invalid answer ID" }); return; }
  if (!content || content.trim().length < MIN_COMMENT_LENGTH) { res.status(400).json({ error: `Comment must be at least ${MIN_COMMENT_LENGTH} characters` }); return; }
  if (content.trim().length > 500) { res.status(400).json({ error: "Comment too long (max 500 chars)" }); return; }

  const canComment = await checkCommentLimit(req.userId!);
  if (!canComment) { res.status(429).json({ error: `You've reached the daily limit of ${DAILY_COMMENT_LIMIT} comments. Come back tomorrow!` }); return; }

  const [answer] = (await db.execute(sql`SELECT id FROM answers WHERE id = ${answerId}`)).rows;
  if (!answer) { res.status(404).json({ error: "Answer not found" }); return; }

  const result = await db.execute(sql`
    INSERT INTO comments (answer_id, user_id, content) VALUES (${answerId}, ${req.userId}, ${content.trim()})
    RETURNING id, content, created_at
  `);
  const comment = result.rows[0] as any;

  const [user] = (await db.execute(sql`SELECT id, display_name, username, avatar_url FROM users WHERE id = ${req.userId}`)).rows as any[];

  // Notify answer author (unless they are the commenter)
  const [answerRow2] = (await db.execute(sql`SELECT author_id, question_id FROM answers WHERE id = ${answerId}`)).rows as any[];
  if (answerRow2 && answerRow2.author_id !== req.userId) {
    await createNotification(
      answerRow2.author_id,
      "new_comment",
      "New comment on your answer",
      `${user?.display_name || user?.username || "Someone"} commented: "${content.trim().slice(0, 80)}"`,
      answerRow2.question_id
    );
  }

  res.status(201).json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.created_at,
    authorId: user.id,
    authorDisplayName: user.display_name,
    authorUsername: user.username,
    authorAvatarUrl: user.avatar_url,
  });
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
