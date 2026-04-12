import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/authenticate";
import { logAdminAction } from "../lib/adminLog";

const router: IRouter = Router();

router.post("/suggestions", authenticate, async (req, res): Promise<void> => {
  const { title, description } = req.body as { title?: string; description?: string };
  if (!title?.trim() || !description?.trim()) {
    res.status(400).json({ error: "Title and description are required" });
    return;
  }
  if (title.trim().length < 5) {
    res.status(400).json({ error: "Title must be at least 5 characters" });
    return;
  }
  if (description.trim().length < 20) {
    res.status(400).json({ error: "Description must be at least 20 characters" });
    return;
  }

  const result = await db.execute(sql`
    INSERT INTO suggestions (user_id, title, description)
    VALUES (${req.userId}, ${title.trim()}, ${description.trim()})
    RETURNING id, title, description, status, created_at
  `);
  const s = result.rows[0] as any;
  res.status(201).json({ id: s.id, title: s.title, description: s.description, status: s.status, createdAt: s.created_at });
});

router.get("/suggestions/mine", authenticate, async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT id, title, description, status, created_at
    FROM suggestions
    WHERE user_id = ${req.userId}
    ORDER BY created_at DESC
  `);
  res.json(rows.rows.map((s: any) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: s.status,
    createdAt: s.created_at,
  })));
});

router.get("/admin/suggestions", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT s.id, s.title, s.description, s.status, s.created_at,
           u.username, u.display_name, u.avatar_url
    FROM suggestions s
    LEFT JOIN users u ON u.id = s.user_id
    ORDER BY s.created_at DESC
  `);
  res.json(rows.rows.map((s: any) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: s.status,
    createdAt: s.created_at,
    author: { username: s.username, displayName: s.display_name, avatarUrl: s.avatar_url },
  })));
});

router.patch("/admin/suggestions/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { status } = req.body as { status?: string };
  const validStatus = ["pending", "reviewing", "planned", "done", "rejected"].includes(status ?? "") ? status : "pending";

  const existing = await db.execute(sql`SELECT id, title, status FROM suggestions WHERE id = ${id}`);
  const sug = existing.rows[0] as any;

  await db.execute(sql`UPDATE suggestions SET status = ${validStatus} WHERE id = ${id}`);

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "suggestion.status_change",
    category: "suggestions",
    targetType: "suggestion",
    targetId: id,
    targetLabel: sug?.title?.slice(0, 80) ?? `#${id}`,
    details: `Changed suggestion "${sug?.title?.slice(0, 60) ?? id}" status: "${sug?.status ?? "?"}" → "${validStatus}"`,
  });

  res.json({ success: true });
});

router.delete("/admin/suggestions/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);

  const existing = await db.execute(sql`SELECT id, title FROM suggestions WHERE id = ${id}`);
  const sug = existing.rows[0] as any;

  await db.execute(sql`DELETE FROM suggestions WHERE id = ${id}`);

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "suggestion.delete",
    category: "suggestions",
    targetType: "suggestion",
    targetId: id,
    targetLabel: sug?.title?.slice(0, 80) ?? `#${id}`,
    details: `Deleted suggestion: "${sug?.title?.slice(0, 80) ?? id}"`,
  });

  res.json({ success: true });
});

export default router;
