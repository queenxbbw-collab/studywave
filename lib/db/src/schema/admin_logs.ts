import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const admin_logs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  admin_id: integer("admin_id").notNull(),
  admin_username: text("admin_username").notNull(),
  action: text("action").notNull(),
  category: text("category").notNull().default("general"),
  target_type: text("target_type"),
  target_id: integer("target_id"),
  target_label: text("target_label"),
  details: text("details"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
