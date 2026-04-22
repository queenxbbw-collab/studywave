-- Ensure the quiz_results table exists (it was missing from the initial migration in some envs).
CREATE TABLE IF NOT EXISTS "quiz_results" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "class_grade" text NOT NULL,
  "score" integer NOT NULL,
  "total" integer NOT NULL,
  "time_taken" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Same for verification_requests, also missing in some envs.
CREATE TABLE IF NOT EXISTS "verification_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "grade" text NOT NULL,
  "favorite_feature" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "reviewed_by" integer REFERENCES "users"("id"),
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Deduplicate any pre-existing duplicate quiz_results so the unique constraint can be created.
DELETE FROM "quiz_results" a USING "quiz_results" b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.class_grade = b.class_grade;
--> statement-breakpoint
-- Enforce one quiz result per (user, class) at the database layer. This blocks the
-- "double-click submit" race regardless of what the application code does.
CREATE UNIQUE INDEX IF NOT EXISTS "quiz_results_user_class_unique"
  ON "quiz_results" ("user_id", "class_grade");
--> statement-breakpoint
-- Speed up the new server-side filtering for the admin audit log.
CREATE INDEX IF NOT EXISTS "admin_logs_created_at_idx" ON "admin_logs" ("created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_logs_category_created_at_idx" ON "admin_logs" ("category", "created_at" DESC);
