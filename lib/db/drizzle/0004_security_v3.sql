-- Round-3 security hardening: vote/bookmark uniqueness + Stripe webhook idempotency.

-- 1) Deduplicate any pre-existing duplicate answer_votes so the unique index can be created.
--    Keep the lowest-id row per (answer_id, user_id); the API only ever wants one vote per pair.
DELETE FROM "answer_votes" a USING "answer_votes" b
WHERE a.id > b.id
  AND a.answer_id = b.answer_id
  AND a.user_id  = b.user_id;
--> statement-breakpoint
-- 2) Enforce one vote per (answer, user) at the database layer. This is the real fix for the
--    SELECT-then-INSERT race in /answers/:id/vote, where two concurrent requests could both
--    pass the existence check and insert two rows, inflating upvote/downvote counters.
CREATE UNIQUE INDEX IF NOT EXISTS "answer_votes_answer_user_unique"
  ON "answer_votes" ("answer_id", "user_id");
--> statement-breakpoint
-- 3) Same treatment for bookmarks: dedupe, then enforce one bookmark per (user, question).
DELETE FROM "bookmarks" a USING "bookmarks" b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.question_id = b.question_id;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bookmarks_user_question_unique"
  ON "bookmarks" ("user_id", "question_id");
--> statement-breakpoint
-- 4) Stripe delivers webhooks "at least once" — the same checkout.session.completed event can
--    arrive multiple times. Without this table, every redelivery would credit points / re-set
--    premium. We INSERT the event id before doing any side-effects; a duplicate insert means
--    the event was already processed and we skip silently.
CREATE TABLE IF NOT EXISTS "processed_stripe_events" (
  "event_id" text PRIMARY KEY,
  "event_type" text NOT NULL,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
