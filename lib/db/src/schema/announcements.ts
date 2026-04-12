import { pgTable, serial, integer, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").default("info"),
  is_active: boolean("is_active").default(true),
  created_by: integer("created_by"),
  created_at: timestamp("created_at").defaultNow(),
});
