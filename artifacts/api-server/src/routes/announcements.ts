import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/authenticate";
import { logAdminAction } from "../lib/adminLog";

const router: IRouter = Router();

router.get("/announcements", async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT id, title, content, type, created_at
    FROM announcements
    WHERE is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 5
  `);
  res.json({ announcements: rows.rows.map((a: any) => ({
    id: a.id, title: a.title, content: a.content, type: a.type, createdAt: a.created_at,
  })) });
});

router.get("/admin/announcements", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`SELECT * FROM announcements ORDER BY created_at DESC`);
  res.json(rows.rows.map((a: any) => ({
    id: a.id, title: a.title, content: a.content, type: a.type,
    isActive: a.is_active, createdAt: a.created_at,
  })));
});

router.post("/admin/announcements", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const { title, content, type } = req.body as { title?: string; content?: string; type?: string };
  if (!title?.trim() || !content?.trim()) { res.status(400).json({ error: "Title and content required" }); return; }
  const validType = ["info", "warning", "success"].includes(type ?? "") ? type : "info";

  const result = await db.execute(sql`
    INSERT INTO announcements (title, content, type, created_by)
    VALUES (${title.trim()}, ${content.trim()}, ${validType}, ${req.userId})
    RETURNING id, title, content, type, is_active, created_at
  `);
  const a = result.rows[0] as any;

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "announcement.create",
    category: "announcements",
    targetType: "announcement",
    targetId: a.id,
    targetLabel: title.trim().slice(0, 80),
    details: `Created "${validType}" announcement: "${title.trim().slice(0, 80)}"`,
  });

  res.status(201).json({ id: a.id, title: a.title, content: a.content, type: a.type, isActive: a.is_active, createdAt: a.created_at });
});

router.patch("/admin/announcements/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { isActive } = req.body as { isActive?: boolean };

  const existing = await db.execute(sql`SELECT id, title FROM announcements WHERE id = ${id}`);
  const ann = existing.rows[0] as any;

  await db.execute(sql`UPDATE announcements SET is_active = ${isActive ?? false} WHERE id = ${id}`);

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "announcement.toggle",
    category: "announcements",
    targetType: "announcement",
    targetId: id,
    targetLabel: ann?.title?.slice(0, 80) ?? `#${id}`,
    details: `${isActive ? "Activated" : "Deactivated"} announcement: "${ann?.title?.slice(0, 80) ?? id}"`,
  });

  res.json({ success: true });
});

router.delete("/admin/announcements/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);

  const existing = await db.execute(sql`SELECT id, title FROM announcements WHERE id = ${id}`);
  const ann = existing.rows[0] as any;

  await db.execute(sql`DELETE FROM announcements WHERE id = ${id}`);

  const [adminUser] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.userId!));
  await logAdminAction({
    adminId: req.userId!,
    adminUsername: adminUser?.username ?? "admin",
    action: "announcement.delete",
    category: "announcements",
    targetType: "announcement",
    targetId: id,
    targetLabel: ann?.title?.slice(0, 80) ?? `#${id}`,
    details: `Deleted announcement: "${ann?.title?.slice(0, 80) ?? id}"`,
  });

  res.json({ success: true });
});

export default router;
