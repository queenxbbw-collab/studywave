import { pgTable, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  question_id: integer("question_id").notNull(),
  created_at: timestamp("created_at").defaultNow(),
}, (t) => ({
  // One bookmark per (user, question) — replaces the silent try/catch dedupe in the route.
  userQuestionUnique: uniqueIndex("bookmarks_user_question_unique").on(t.user_id, t.question_id),
}));
