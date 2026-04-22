import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userFollowsTable = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  followingId: integer("following_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // Defeats the duplicate-follow race even if the application-level NOT EXISTS check
  // is bypassed by two near-simultaneous requests.
  pairUnique: uniqueIndex("user_follows_pair_unique").on(t.followerId, t.followingId),
}));

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
