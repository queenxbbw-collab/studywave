import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  question_id: integer("question_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
