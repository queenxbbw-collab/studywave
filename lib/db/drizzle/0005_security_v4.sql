-- Round 4 hardening: prevent duplicate verification requests at the DB level.
-- The route already does a SELECT-then-INSERT check, but two simultaneous
-- requests from the same user could both pass the check before either insert
-- lands. A unique index on user_id makes the second insert fail cleanly.
DELETE FROM verification_requests
WHERE id NOT IN (
  SELECT MIN(id) FROM verification_requests GROUP BY user_id
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_user_id_unique
  ON verification_requests (user_id);
