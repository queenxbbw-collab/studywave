import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

const NOTIFICATION_RETENTION_DAYS = 90;

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
  mention: "activity",
};

function getCategory(type: string): string {
  return CATEGORY_MAP[type] ?? "activity";
}

async function cleanupOldNotifications(userId: number): Promise<void> {
  try {
    // Use a parameterised interval (cast a number of days) instead of sql.raw — the value is a
    // constant today, but stays safe if it ever becomes configurable.
    await db.execute(sql`
      DELETE FROM notifications
      WHERE user_id = ${userId}
        AND is_read = TRUE
        AND created_at < NOW() - (${NOTIFICATION_RETENTION_DAYS}::int * INTERVAL '1 day')
    `);
  } catch {}
}

router.get("/notifications", authenticate, async (req, res): Promise<void> => {
  const limit = Math.min(parseInt((req.query.limit as string) || "30", 10), 100);
  const category = req.query.category as string | undefined;

  // Prune old read notifications in the background (no await needed)
  cleanupOldNotifications(req.userId!);

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

export async function parseMentions(
  content: string,
  authorId: number,
  authorName: string,
  questionId?: number
): Promise<void> {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const usernames = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(content)) !== null) {
    usernames.add(match[1].toLowerCase());
  }
  if (usernames.size === 0) return;

  // Cap per post to defend against `@a @b @c …` flood that would otherwise
  // generate one DB write per mention.
  const MAX_MENTIONS_PER_POST = 10;
  const list = Array.from(usernames).slice(0, MAX_MENTIONS_PER_POST);

  // Resolve all mentioned usernames in a single query instead of one SELECT per name.
  let mentionedRows: any[] = [];
  try {
    mentionedRows = (await db.execute(sql`
      SELECT id FROM users WHERE LOWER(username) = ANY(${list}::text[])
    `)).rows as any[];
  } catch {
    return;
  }

  for (const m of mentionedRows) {
    if (!m || m.id === authorId) continue;
    await createNotification(
      m.id,
      "mention",
      `${authorName} te-a menționat`,
      `Ai fost menționat într-o postare: "${content.slice(0, 80)}..."`,
      questionId
    );
  }
}

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
