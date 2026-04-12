ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_premium" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "premium_expires_at" timestamp with time zone;
