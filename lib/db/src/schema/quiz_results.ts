import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  classGrade: text("class_grade").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  timeTaken: integer("time_taken"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QuizResult = typeof quizResultsTable.$inferSelect;
