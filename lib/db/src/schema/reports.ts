import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => usersTable.id),
  targetType: text("target_type").notNull(), // 'question' | 'answer' | 'user'
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"), // 'pending' | 'reviewed' | 'dismissed'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
