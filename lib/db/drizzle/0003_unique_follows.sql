-- Defeat the duplicate-follow race at the database layer. Even with the application-level
-- "INSERT ... WHERE NOT EXISTS" check, two concurrent requests can both pass the existence
-- check and both insert. A unique index makes the second one fail outright.
DELETE FROM "user_follows" a USING "user_follows" b
WHERE a.id > b.id
  AND a.follower_id = b.follower_id
  AND a.following_id = b.following_id;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_follows_pair_unique"
  ON "user_follows" ("follower_id", "following_id");
