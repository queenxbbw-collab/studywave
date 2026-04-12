import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
