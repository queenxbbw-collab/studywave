import { Router, type IRouter, type Request, type Response } from "express";
import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

export const POINT_PACKAGES = [
  { id: "pack_100", label: "Starter Pack", points: 100, price: 99, description: "100 points to get started" },
  { id: "pack_500", label: "Explorer Pack", points: 500, price: 399, description: "500 points — best value" },
  { id: "pack_1200", label: "Scholar Pack", points: 1200, price: 799, description: "1200 points for power users" },
  { id: "pack_3000", label: "Master Pack", points: 3000, price: 1499, description: "3000 points — maximum power" },
];

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const PREMIUM_PRICE_MONTHLY = 499; // $4.99/month in cents

router.get("/payments/packages", (_req: Request, res: Response): void => {
  res.json({ packages: POINT_PACKAGES });
});

router.post("/payments/subscribe", authenticate, async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Payment system not configured. Please contact admin." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName,
      metadata: { userId: String(user.id) },
    });
    customerId = customer.id;
    await db.update(usersTable).set({ stripeCustomerId: customerId }).where(eq(usersTable.id, req.userId!));
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: PREMIUM_PRICE_MONTHLY,
        recurring: { interval: "month" },
        product_data: {
          name: "StudyWave Premium",
          description: "Unlimited questions per day + Premium badge",
        },
      },
      quantity: 1,
    }],
    metadata: { userId: String(user.id), type: "premium_subscription" },
    success_url: `${origin}/buy-points?premium_success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/buy-points?canceled=1`,
  });

  res.json({ url: session.url });
});

router.post("/payments/checkout", authenticate, async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Payment system not configured. Please contact admin." });
    return;
  }

  const { packageId } = req.body as { packageId?: string };
  const pkg = POINT_PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    res.status(400).json({ error: "Invalid package" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName,
      metadata: { userId: String(user.id) },
    });
    customerId = customer.id;
    await db.update(usersTable).set({ stripeCustomerId: customerId }).where(eq(usersTable.id, req.userId!));
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: pkg.price,
        product_data: {
          name: pkg.label,
          description: `${pkg.points} StudyWave points`,
          metadata: { packageId: pkg.id },
        },
      },
      quantity: 1,
    }],
    metadata: {
      userId: String(user.id),
      packageId: pkg.id,
      points: String(pkg.points),
    },
    success_url: `${origin}/buy-points?success=1&points=${pkg.points}`,
    cancel_url: `${origin}/buy-points?canceled=1`,
  });

  res.json({ url: session.url });
});

router.post("/payments/verify-premium", authenticate, async (req: Request, res: Response): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Payment system not configured" });
    return;
  }

  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) {
    res.status(400).json({ error: "sessionId required" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = parseInt(session.metadata?.userId ?? "0");
    const type = session.metadata?.type;

    if (session.payment_status !== "paid" && session.status !== "complete") {
      res.status(400).json({ error: "Payment not completed" });
      return;
    }

    if (type !== "premium_subscription" || !userId || userId !== req.userId) {
      res.status(403).json({ error: "Invalid session" });
      return;
    }

    const subId = session.subscription as string;
    let expiresAt: Date | null = null;
    try {
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const periodEnd = (sub as any).current_period_end as number | undefined;
        if (periodEnd) expiresAt = new Date(periodEnd * 1000);
      }
    } catch (e: any) {
      console.error("[Stripe] failed to retrieve subscription period:", e.message);
    }
    if (!expiresAt) {
      // Safety fallback: 35 days (covers monthly cycle + grace period) so premium can NEVER be permanent
      expiresAt = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
    }
    await db.update(usersTable)
      .set({ isPremium: true, stripeSubscriptionId: subId ?? null, premiumExpiresAt: expiresAt })
      .where(eq(usersTable.id, userId));

    const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    res.json({ success: true, isPremium: updatedUser.isPremium });
  } catch (err: any) {
    console.error("[Stripe] verify-premium error:", err.message);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// Stripe guarantees "at least once" webhook delivery — the same event id can be re-sent
// minutes or hours later (network blips, manual replay from the dashboard, etc.). Without
// this guard, every redelivery of `checkout.session.completed` would credit points or
// re-set premium. We INSERT the event id first; ON CONFLICT means it was already processed
// and we return false so the caller skips the side-effects.
async function markEventProcessed(eventId: string, eventType: string): Promise<boolean> {
  const result = await db.execute(sql`
    INSERT INTO processed_stripe_events (event_id, event_type)
    VALUES (${eventId}, ${eventType})
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id
  `);
  return result.rows.length > 0;
}

export async function handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe] STRIPE_WEBHOOK_SECRET not set");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe] Webhook signature failed:", err.message);
    return;
  }

  // Idempotency gate: skip the rest if we've already handled this event id.
  const fresh = await markEventProcessed(event.id, event.type);
  if (!fresh) {
    console.log(`[Stripe] Skipping duplicate event ${event.id} (${event.type})`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.userId ?? "0");
    const type = session.metadata?.type;

    if (type === "premium_subscription" && userId) {
      const subId = session.subscription as string;
      let expiresAt: Date | null = null;
      try {
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const periodEnd = (sub as any).current_period_end as number | undefined;
          if (periodEnd) expiresAt = new Date(periodEnd * 1000);
        }
      } catch (e: any) {
        console.error("[Stripe] failed to retrieve subscription period:", e.message);
      }
      if (!expiresAt) expiresAt = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
      await db.update(usersTable)
        .set({ isPremium: true, stripeSubscriptionId: subId, premiumExpiresAt: expiresAt })
        .where(eq(usersTable.id, userId));
      console.log(`[Stripe] Activated Premium for user ${userId} until ${expiresAt.toISOString()}`);
    } else {
      const points = parseInt(session.metadata?.points ?? "0");
      if (userId && points) {
        await db.update(usersTable)
          .set({ points: sql`${usersTable.points} + ${points}` })
          .where(eq(usersTable.id, userId));
        console.log(`[Stripe] Added ${points} points to user ${userId}`);
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const periodEnd = (sub as any).current_period_end as number | undefined;
    const status = sub.status;
    const isActive = status === "active" || status === "trialing";
    const expiresAt = periodEnd ? new Date(periodEnd * 1000) : null;
    await db.update(usersTable)
      .set({
        isPremium: isActive,
        premiumExpiresAt: expiresAt,
        ...(isActive ? {} : { stripeSubscriptionId: null }),
      })
      .where(eq(usersTable.stripeSubscriptionId, sub.id));
    console.log(`[Stripe] Subscription ${sub.id} updated: status=${status}, expires=${expiresAt?.toISOString() ?? "n/a"}`);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const subId = sub.id;
    await db.update(usersTable)
      .set({ isPremium: false, stripeSubscriptionId: null, premiumExpiresAt: null })
      .where(eq(usersTable.stripeSubscriptionId, subId));
    console.log(`[Stripe] Deactivated Premium for subscription ${subId}`);
  }
}

export default router;
