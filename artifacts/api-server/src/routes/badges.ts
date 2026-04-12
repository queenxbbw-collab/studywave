import { Router } from "express";
import { db, badgesTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router = Router();

router.get("/badges", async (_req, res): Promise<void> => {
  const badges = await db.select().from(badgesTable).orderBy(asc(badgesTable.pointsRequired));

  res.json(badges.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    color: b.color,
    pointsRequired: b.pointsRequired,
    category: b.category,
    createdAt: b.createdAt.toISOString(),
  })));
});

export default router;
