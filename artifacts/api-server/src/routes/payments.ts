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

router.get("/payments/packages", (_req: Request, res: Response): void => {
  res.json({ packages: POINT_PACKAGES });
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = parseInt(session.metadata?.userId ?? "0");
    const points = parseInt(session.metadata?.points ?? "0");

    if (userId && points) {
      await db.update(usersTable)
        .set({ points: sql`${usersTable.points} + ${points}` })
        .where(eq(usersTable.id, userId));
      console.log(`[Stripe] Added ${points} points to user ${userId}`);
    }
  }
}

export default router;
