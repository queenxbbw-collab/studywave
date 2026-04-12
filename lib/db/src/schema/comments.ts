import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  answer_id: integer("answer_id").notNull(),
  user_id: integer("user_id").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
