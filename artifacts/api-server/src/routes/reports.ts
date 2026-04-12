import { Router } from "express";
import { db, reportsTable, usersTable, questionsTable, answersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import { logAdminAction } from "../lib/adminLog";

const router = Router();

router.post("/reports", authenticate, async (req, res): Promise<void> => {
  const { targetType, targetId, reason, details } = req.body;

  if (!targetType || !targetId || !reason) {
    res.status(400).json({ error: "targetType, targetId, and reason are required" });
    return;
  }

  const validTypes = ["question", "answer", "user"];
  if (!validTypes.includes(targetType)) {
    res.status(400).json({ error: "targetType must be question, answer, or user" });
    return;
  }

  const validReasons = [
    "spam",
    "harassment",
    "inappropriate_content",
    "misinformation",
    "off_topic",
    "other",
  ];
  if (!validReasons.includes(reason)) {
    res.status(400).json({ error: "Invalid reason" });
    return;
  }

  const existing = await db
    .select()
    .from(reportsTable)
    .where(
      and(
        eq(reportsTable.reporterId, req.userId!),
        eq(reportsTable.targetType, targetType),
        eq(reportsTable.targetId, Number(targetId))
      )
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "You have already reported this content" });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values({
      reporterId: req.userId!,
      targetType,
      targetId: Number(targetId),
      reason,
      details: details || null,
      status: "pending",
    })
    .returning();

  res.status(201).json({ id: report.id, message: "Report submitted successfully" });
});

router.get("/reports", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const reports = await db
    .select({
      r: reportsTable,
      reporter: {
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
      },
    })
    .from(reportsTable)
    .innerJoin(usersTable, eq(reportsTable.reporterId, usersTable.id))
    .orderBy(desc(reportsTable.createdAt));

  res.json(
    reports.map(({ r, reporter }) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reporter: {
        id: reporter.id,
        username: reporter.username,
        displayName: reporter.displayName,
      },
    }))
  );
});

router.patch("/reports/:id", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const id = parseInt(req.params.id as string, 10);
  const { status } = req.body;

  const validStatuses = ["pending", "reviewed", "dismissed"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [updated] = await db
    .update(reportsTable)
    .set({ status })
    .where(eq(reportsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  await logAdminAction({
    adminId: req.userId!,
    adminUsername: user.username,
    action: `report.${status}`,
    category: "moderation",
    targetType: "report",
    targetId: id,
    targetLabel: `Report #${id} (${updated.targetType} #${updated.targetId})`,
    details: `Marked report #${id} [${updated.targetType} #${updated.targetId}, reason: ${updated.reason}] as "${status}"`,
  });

  res.json({ id: updated.id, status: updated.status });
});

export default router;
