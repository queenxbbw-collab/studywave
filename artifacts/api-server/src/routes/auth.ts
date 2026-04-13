import { Router } from "express";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, sql, and, gt, isNull } from "drizzle-orm";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { authenticate } from "../middlewares/authenticate";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import crypto from "crypto";
import { createNotification } from "./notifications";

const router = Router();

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
    questionBonusPool: user.questionBonusPool,
    currentStreak: u.currentStreak ?? u.current_streak ?? 0,
    longestStreak: u.longestStreak ?? u.longest_streak ?? 0,
    lastActivityDate: u.lastActivityDate ?? u.last_activity_date ?? null,
    createdAt: user.createdAt.toISOString(),
    isPremium: user.isPremium ?? false,
    premiumExpiresAt: user.premiumExpiresAt ? user.premiumExpiresAt.toISOString() : null,
    bannerColor: u.bannerColor ?? u.banner_color ?? null,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, email, password, displayName } = parsed.data;
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
      "🎉 Someone joined using your referral!",
      `${displayName || username} just registered with your referral code. You earned +25 points!`
    );
  }

  const token = signToken(user.id, user.role);

  res.status(201).json({ user: formatUser(user), token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

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

  // Update streak
  const today = new Date().toISOString().split("T")[0];
  const lastDate = user.lastActivityDate ? new Date(user.lastActivityDate as unknown as string).toISOString().split("T")[0] : null;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let newStreak = (user as any).currentStreak ?? 0;
  if (!lastDate || lastDate < yesterday) newStreak = 1;
  else if (lastDate === yesterday) newStreak = newStreak + 1;
  const newLongest = Math.max(newStreak, (user as any).longestStreak ?? 0);
  await db.execute(sql`UPDATE users SET current_streak = ${newStreak}, longest_streak = ${newLongest}, last_activity_date = ${today} WHERE id = ${user.id}`);

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

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
  // Always return the same generic response to prevent email enumeration
  const GENERIC = { message: "If that email is registered, a reset link has been sent to your inbox." };
  if (!user) {
    res.json(GENERIC);
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db.execute(sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`);
  await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });
  // NOTE: In production, send this token via email. For now log server-side only.
  // NEVER expose the token in the HTTP response.
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
