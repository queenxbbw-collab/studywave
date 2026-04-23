import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { authenticate } from "../middlewares/authenticate";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import crypto from "crypto";
import { createNotification } from "./notifications";
import { bumpStreak } from "../lib/streak";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

function generateReferralCode(username: string): string {
  const hash = crypto.createHash("sha256").update(username + Date.now()).digest("hex");
  return (username.slice(0, 4) + hash.slice(0, 6)).toUpperCase();
}

function formatUser(user: typeof usersTable.$inferSelect) {
  const u = user as any;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    points: user.points,
    role: user.role,
    isActive: user.isActive,
    referralCode: user.referralCode,
    currentStreak: u.currentStreak ?? u.current_streak ?? 0,
    longestStreak: u.longestStreak ?? u.longest_streak ?? 0,
    lastActivityDate: u.lastActivityDate ?? u.last_activity_date ?? null,
    createdAt: user.createdAt.toISOString(),
    isPremium: user.isPremium ?? false,
    premiumExpiresAt: user.premiumExpiresAt ? user.premiumExpiresAt.toISOString() : null,
    bannerColor: u.bannerColor ?? u.banner_color ?? null,
  };
}

router.post("/auth/register", authLimiter, async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, displayName } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const referralCode: string | undefined = req.body.referralCode;

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const [existingUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  let referrerId: number | undefined;
  if (referralCode && referralCode.trim()) {
    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, referralCode.trim().toUpperCase()));
    if (referrer) {
      referrerId = referrer.id;
    }
  }

  const passwordHash = await hashPassword(password);
  const newReferralCode = generateReferralCode(username);

  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      email,
      passwordHash,
      displayName,
      role: "user",
      points: 0,
      isActive: true,
      referralCode: newReferralCode,
      referredBy: referrerId || null,
    })
    .returning();

  if (referrerId) {
    await db
      .update(usersTable)
      .set({ points: sql`${usersTable.points} + 25` })
      .where(eq(usersTable.id, referrerId));
    await createNotification(
      referrerId,
      "referral_signup",
      "🎉 Cineva s-a înregistrat folosind recomandarea ta!",
      `${displayName || username} tocmai s-a înregistrat cu codul tău de recomandare. Ai primit +25 de puncte!`
    );
  }

  const token = signToken(user.id, user.role);

  res.status(201).json({ user: formatUser(user), token });
});

router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Account is disabled" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await bumpStreak(user.id);

  const token = signToken(user.id, user.role);
  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  res.json({ user: formatUser(updatedUser), token });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

// Password reset is disabled until a real email delivery service is wired up.
// Previously the reset token was logged to the server console, which meant anyone
// with log access could request a token for any account and take it over. Until we
// have a proper "send email to the address on file" flow, both endpoints respond
// 404 so the route is fully closed off — even to scripted/manual requests.
router.post("/auth/forgot-password", (_req, res): void => {
  res.status(404).json({ error: "Password reset is currently disabled." });
});

router.post("/auth/reset-password", (_req, res): void => {
  res.status(404).json({ error: "Password reset is currently disabled." });
});

export default router;
