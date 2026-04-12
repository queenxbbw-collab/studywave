import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { questionsTable } from "./questions";

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  questionId: integer("question_id").notNull().references(() => questionsTable.id),
  authorId: integer("author_id").notNull().references(() => usersTable.id),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  isAwarded: boolean("is_awarded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answersTable.$inferSelect;

export const answerVotesTable = pgTable("answer_votes", {
  id: serial("id").primaryKey(),
  answerId: integer("answer_id").notNull().references(() => answersTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  voteType: text("vote_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  questionId: integer("question_id").references(() => questionsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
