import { db, usersTable } from "@workspace/db";
import { eq, and, lt, isNotNull, sql } from "drizzle-orm";

/**
 * Auto-downgrade users whose premium has expired.
 * Returns the effective isPremium flag for the given user.
 * Safety net for cases where Stripe webhooks were missed.
 */
export async function getEffectivePremium(userId: number): Promise<boolean> {
  const [row] = await db
    .select({ isPremium: usersTable.isPremium, premiumExpiresAt: usersTable.premiumExpiresAt })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!row) return false;
  if (!row.isPremium) return false;
  if (row.premiumExpiresAt && new Date(row.premiumExpiresAt).getTime() <= Date.now()) {
    await db.update(usersTable)
      .set({ isPremium: false })
      .where(eq(usersTable.id, userId));
    return false;
  }
  return true;
}

/**
 * Periodic cleanup: downgrade ALL users whose premium expired.
 * Called on a timer from index.ts.
 */
export async function expireStalePremium(): Promise<number> {
  const result = await db.update(usersTable)
    .set({ isPremium: false })
    .where(and(
      eq(usersTable.isPremium, true),
      isNotNull(usersTable.premiumExpiresAt),
      lt(usersTable.premiumExpiresAt, sql`NOW()`),
    ));
  return (result as any).rowCount ?? 0;
}
