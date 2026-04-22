import { Router } from "express";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, sql, and, gt, isNull } from "drizzle-orm";
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

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again in 1 hour." },
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

router.post("/auth/forgot-password", forgotLimiter, async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  const GENERIC = { message: "If that email is registered, a reset link has been sent to your inbox." };
  if (!user) {
    res.json(GENERIC);
    return;
  }
  // Per-user cooldown: refuse to issue a new token if one was issued in the last 2 minutes.
  // The global forgotLimiter caps requests per IP; this stops one IP from spamming a single
  // victim's inbox with reset tokens (or rotating them out from under a legitimate user).
  const COOLDOWN_MS = 2 * 60 * 1000;
  const recent = (await db.execute(sql`
    SELECT created_at FROM password_reset_tokens
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 1
  `)).rows as Array<{ created_at: string | Date }>;
  if (recent[0]) {
    const last = new Date(recent[0].created_at).getTime();
    if (Date.now() - last < COOLDOWN_MS) {
      // Stay generic — don't leak that the email exists.
      res.json(GENERIC);
      return;
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.execute(sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`);
  await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });
  console.log(`[PASSWORD RESET] user_id=${user.id} email=${user.email} token=${token}`);
  res.json(GENERIC);
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || typeof token !== "string" || typeof newPassword !== "string") {
    res.status(400).json({ error: "Token and new password are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const now = new Date();
  const [record] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        gt(passwordResetTokensTable.expiresAt, now),
        isNull(passwordResetTokensTable.usedAt)
      )
    );
  if (!record) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }
  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, record.userId));
  await db.execute(sql`UPDATE password_reset_tokens SET used_at = now() WHERE id = ${record.id}`);
  res.json({ message: "Password updated successfully" });
});

export default router;
