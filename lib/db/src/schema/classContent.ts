import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const classLessonsTable = pgTable("class_lessons", {
  id: serial("id").primaryKey(),
  grade: integer("grade").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  topics: jsonb("topics").notNull().default([]),
  pages: jsonb("pages").notNull().default([]),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const classQuizQuestionsTable = pgTable("class_quiz_questions", {
  id: serial("id").primaryKey(),
  grade: integer("grade").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull().default([]),
  answer: integer("answer").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const classWorksheetsTable = pgTable("class_worksheets", {
  id: serial("id").primaryKey(),
  grade: integer("grade").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  intro: text("intro").notNull(),
  exercises: jsonb("exercises").notNull().default([]),
  tip: text("tip"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ClassLesson = typeof classLessonsTable.$inferSelect;
export type ClassQuizQuestion = typeof classQuizQuestionsTable.$inferSelect;
export type ClassWorksheet = typeof classWorksheetsTable.$inferSelect;
