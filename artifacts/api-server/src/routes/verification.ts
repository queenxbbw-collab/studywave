import { Router } from "express";
import { db, usersTable, verificationRequestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/authenticate";

const router = Router();

router.post("/verification/request", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const { firstName, lastName, grade, favoriteFeature } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !grade?.trim() || !favoriteFeature?.trim()) {
    res.status(400).json({ error: "Toate câmpurile sunt obligatorii." });
    return;
  }

  const existing = await db
    .select()
    .from(verificationRequestsTable)
    .where(eq(verificationRequestsTable.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Ai deja o cerere de verificare trimisă.", status: existing[0].status });
    return;
  }

  const [request] = await db
    .insert(verificationRequestsTable)
    .values({ userId, firstName: firstName.trim(), lastName: lastName.trim(), grade: grade.trim(), favoriteFeature: favoriteFeature.trim() })
    .returning();

  res.status(201).json({ request });
});

router.get("/verification/my-status", authenticate, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const [request] = await db
    .select()
    .from(verificationRequestsTable)
    .where(eq(verificationRequestsTable.userId, userId))
    .limit(1);

  res.json({ request: request ?? null });
});

router.get("/admin/verification-requests", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const requests = await db
    .select({
      id: verificationRequestsTable.id,
      userId: verificationRequestsTable.userId,
      firstName: verificationRequestsTable.firstName,
      lastName: verificationRequestsTable.lastName,
      grade: verificationRequestsTable.grade,
      favoriteFeature: verificationRequestsTable.favoriteFeature,
      status: verificationRequestsTable.status,
      createdAt: verificationRequestsTable.createdAt,
      reviewedAt: verificationRequestsTable.reviewedAt,
      username: usersTable.username,
      displayName: usersTable.displayName,
      avatarUrl: usersTable.avatarUrl,
    })
    .from(verificationRequestsTable)
    .leftJoin(usersTable, eq(verificationRequestsTable.userId, usersTable.id))
    .orderBy(desc(verificationRequestsTable.createdAt));

  res.json({ requests });
});

router.patch("/admin/verification-requests/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { action } = req.body;
  const adminId = req.userId!;

  if (!["approve", "reject"].includes(action)) {
    res.status(400).json({ error: "Acțiune invalidă." });
    return;
  }

  const [request] = await db
    .select()
    .from(verificationRequestsTable)
    .where(eq(verificationRequestsTable.id, id))
    .limit(1);

  if (!request) {
    res.status(404).json({ error: "Cerere negăsită." });
    return;
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  await db
    .update(verificationRequestsTable)
    .set({ status: newStatus, reviewedBy: adminId, reviewedAt: new Date() })
    .where(eq(verificationRequestsTable.id, id));

  await db
    .update(usersTable)
    .set({ isVerified: action === "approve" })
    .where(eq(usersTable.id, request.userId));

  res.json({ success: true, status: newStatus });
});

export default router;
