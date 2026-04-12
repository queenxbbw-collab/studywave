import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export interface AdminLogEntry {
  adminId: number;
  adminUsername: string;
  action: string;
  category: "users" | "content" | "badges" | "moderation" | "announcements" | "suggestions";
  targetType?: string;
  targetId?: number;
  targetLabel?: string;
  details?: string;
}

export async function logAdminAction(entry: AdminLogEntry): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO admin_logs (admin_id, admin_username, action, category, target_type, target_id, target_label, details)
      VALUES (
        ${entry.adminId},
        ${entry.adminUsername},
        ${entry.action},
        ${entry.category},
        ${entry.targetType ?? null},
        ${entry.targetId ?? null},
        ${entry.targetLabel ?? null},
        ${entry.details ?? null}
      )
    `);
  } catch (e) {
    // Logging should never break the main flow
    console.error("Failed to log admin action:", e);
  }
}
