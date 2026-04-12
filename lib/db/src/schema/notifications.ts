import { pgTable, serial, integer, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  body: text("body"),
  question_id: integer("question_id"),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});
