import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user || !user.isActive) {
    res.status(401).json({ error: "User not found or inactive" });
    return;
  }

  req.userId = user.id;
  req.userRole = user.role;
  next();
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      // Always read the freshest role/active flag from the DB so that
      // changes (role demotion, account deactivation) take effect immediately
      // instead of waiting for the JWT to expire.
      try {
        const [user] = await db
          .select({ id: usersTable.id, role: usersTable.role, isActive: usersTable.isActive })
          .from(usersTable)
          .where(eq(usersTable.id, payload.userId));
        if (user && user.isActive) {
          req.userId = user.id;
          req.userRole = user.role;
        }
      } catch {
        // On DB error, treat the request as anonymous instead of trusting the JWT.
      }
    }
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
