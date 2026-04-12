import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

const CATEGORY_MAP: Record<string, string> = {
  new_answer: "activity",
  gold_ribbon: "rewards",
  badge_earned: "rewards",
  announcement: "system",
  referral_signup: "social",
  new_follower: "social",
  answer_upvote: "activity",
  question_upvote: "activity",
  new_comment: "activity",
};

function getCategory(type: string): string {
  return CATEGORY_MAP[type] ?? "activity";
}

router.get("/notifications", authenticate, async (req, res): Promise<void> => {
  const limit = Math.min(parseInt((req.query.limit as string) || "30", 10), 100);
  const category = req.query.category as string | undefined;

  // Fetch all recent notifications for this user (200 max), filter by category in JS
  const allNotifs = await db.execute(sql`
    SELECT id, type, title, body, question_id, is_read, created_at
    FROM notifications
    WHERE user_id = ${req.userId}
    ORDER BY created_at DESC
    LIMIT 200
  `);

  const allowedTypes = (category && category !== "all")
    ? Object.entries(CATEGORY_MAP).filter(([, c]) => c === category).map(([t]) => t)
    : null;

  const filtered = allowedTypes
    ? allNotifs.rows.filter((n: any) => allowedTypes.includes(n.type))
    : allNotifs.rows;

  const [countRow] = (
    await db.execute(
      sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${req.userId} AND is_read = FALSE`
    )
  ).rows as any[];

  res.json({
    notifications: filtered.slice(0, limit).map((n: any) => ({
      id: n.id,
      type: n.type,
      category: getCategory(n.type),
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
  const [row] = (
    await db.execute(
      sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${req.userId} AND is_read = FALSE`
    )
  ).rows as any[];
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
  await db.execute(
    sql`UPDATE notifications SET is_read = TRUE WHERE id = ${id} AND user_id = ${req.userId}`
  );
  res.json({ success: true });
});
router.put("/notifications/:id/read", authenticate, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.execute(
    sql`UPDATE notifications SET is_read = TRUE WHERE id = ${id} AND user_id = ${req.userId}`
  );
  res.json({ success: true });
});

router.get("/referrals", authenticate, async (req, res): Promise<void> => {
  const referrals = await db.execute(sql`
    SELECT id, username, display_name, avatar_url, points, created_at
    FROM users
    WHERE referred_by = ${req.userId}
    ORDER BY created_at DESC
  `);
  res.json({
    referrals: referrals.rows.map((u: any) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      points: u.points,
      joinedAt: u.created_at,
    })),
    total: referrals.rows.length,
  });
});

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  body: string,
  questionId?: number
) {
  try {
    await db.execute(sql`
      INSERT INTO notifications (user_id, type, title, body, question_id)
      VALUES (${userId}, ${type}, ${title}, ${body}, ${questionId ?? null})
    `);
  } catch {}
}

export default router;
