import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

router.get("/notifications", authenticate, async (req, res): Promise<void> => {
  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 50);
  const notifs = await db.execute(sql`
    SELECT id, type, title, body, question_id, is_read, created_at
    FROM notifications
    WHERE user_id = ${req.userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
  const [countRow] = (await db.execute(sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${req.userId} AND is_read = FALSE`)).rows as any[];
  res.json({
    notifications: notifs.rows.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      questionId: n.question_id,
      isRead: n.is_read,
      createdAt: n.created_at,
    })),
    unreadCount: parseInt(countRow.count),
  });
});

router.get("/notifications/unread-count", authenticate, async (req, res): Promise<void> => {
  const [row] = (await db.execute(sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${req.userId} AND is_read = FALSE`)).rows as any[];
  res.json({ count: parseInt(row.count) });
});

router.patch("/notifications/read-all", authenticate, async (req, res): Promise<void> => {
  await db.execute(sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${req.userId}`);
  res.json({ success: true });
});
router.put("/notifications/read-all", authenticate, async (req, res): Promise<void> => {
  await db.execute(sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${req.userId}`);
  res.json({ success: true });
});

router.patch("/notifications/:id/read", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.execute(sql`UPDATE notifications SET is_read = TRUE WHERE id = ${id} AND user_id = ${req.userId}`);
  res.json({ success: true });
});
router.put("/notifications/:id/read", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.execute(sql`UPDATE notifications SET is_read = TRUE WHERE id = ${id} AND user_id = ${req.userId}`);
  res.json({ success: true });
});

export async function createNotification(userId: number, type: string, title: string, body: string, questionId?: number) {
  try {
    await db.execute(sql`
      INSERT INTO notifications (user_id, type, title, body, question_id)
      VALUES (${userId}, ${type}, ${title}, ${body}, ${questionId ?? null})
    `);
  } catch {}
}

export default router;
