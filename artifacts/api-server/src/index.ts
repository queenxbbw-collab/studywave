import path from "node:path";
import crypto from "node:crypto";
import app from "./app";
import { logger } from "./lib/logger";
import { pool, db, usersTable, badgesTable } from "@workspace/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq, isNull } from "drizzle-orm";
import { hashPassword } from "./lib/auth";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

function makeReferralCode(username: string): string {
  const hash = crypto.createHash("sha256").update(username + Date.now()).digest("hex");
  return (username.slice(0, 4) + hash.slice(0, 6)).toUpperCase();
}

async function seedDatabase() {
  try {
    // ── 1. Seed users ────────────────────────────────────────────────────────
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, "admin@studywave.com"))
      .limit(1);

    if (existing.length === 0) {
      const adminHash = await hashPassword("admin123");
      const userHash  = await hashPassword("user123");

      await db.insert(usersTable).values([
        {
          username: "admin",
          email: "admin@studywave.com",
          displayName: "Admin",
          passwordHash: adminHash,
          role: "admin",
          points: 9999,
          bio: "Platform administrator",
          referralCode: makeReferralCode("admin"),
        },
        {
          username: "alex",
          email: "alex@studywave.com",
          displayName: "Alex",
          passwordHash: userHash,
          role: "user",
          points: 150,
          bio: "StudyWave member",
          referralCode: makeReferralCode("alex"),
        },
      ]);
      logger.info("Users seeded — admin@studywave.com / admin123 created");
    } else {
      // Patch any existing user that has no referral code
      const noCode = await db
        .select({ id: usersTable.id, username: usersTable.username })
        .from(usersTable)
        .where(isNull(usersTable.referralCode));

      for (const u of noCode) {
        await db
          .update(usersTable)
          .set({ referralCode: makeReferralCode(u.username) })
          .where(eq(usersTable.id, u.id));
      }
      if (noCode.length > 0) {
        logger.info(`Patched ${noCode.length} user(s) with missing referral codes`);
      }
    }

    // ── 2. Seed default badges ───────────────────────────────────────────────
    const existingBadges = await db.select({ id: badgesTable.id }).from(badgesTable).limit(1);
    if (existingBadges.length === 0) {
      await db.insert(badgesTable).values([
        // Beginner
        { name: "First Step",        description: "Ask your very first question",             icon: "Sparkles",    color: "purple",  pointsRequired: 0,     category: "general"   },
        { name: "Curious Mind",      description: "Ask 5 questions",                          icon: "HelpCircle",  color: "blue",    pointsRequired: 25,    category: "questions" },
        { name: "Helper",            description: "Post your first answer",                   icon: "MessageCircle", color: "green", pointsRequired: 10,    category: "answers"   },
        { name: "Quick Learner",     description: "Earn 50 points",                           icon: "Zap",         color: "gold",    pointsRequired: 50,    category: "points"    },
        // Intermediate
        { name: "Knowledge Seeker",  description: "Ask 25 questions",                         icon: "BookOpen",    color: "blue",    pointsRequired: 100,   category: "questions" },
        { name: "Problem Solver",    description: "Have 10 answers accepted",                 icon: "CheckCircle", color: "green",   pointsRequired: 150,   category: "answers"   },
        { name: "Rising Star",       description: "Earn 250 points",                          icon: "Star",        color: "gold",    pointsRequired: 250,   category: "points"    },
        { name: "On Fire",           description: "Maintain a 7-day answer streak",           icon: "Flame",       color: "red",     pointsRequired: 200,   category: "answers"   },
        { name: "Connector",         description: "Refer 3 friends to StudyWave",             icon: "Heart",       color: "purple",  pointsRequired: 175,   category: "general"   },
        { name: "Voted Up",          description: "Receive 50 upvotes on your answers",       icon: "Target",      color: "blue",    pointsRequired: 200,   category: "answers"   },
        // Advanced
        { name: "Expert",            description: "Earn 500 points",                          icon: "Award",       color: "silver",  pointsRequired: 500,   category: "points"    },
        { name: "Gold Ribbon Winner",description: "Win your first Gold Ribbon answer",        icon: "Trophy",      color: "gold",    pointsRequired: 400,   category: "awards"    },
        { name: "Mentor",            description: "Have 50 answers accepted",                 icon: "Shield",      color: "green",   pointsRequired: 600,   category: "answers"   },
        { name: "Influencer",        description: "Refer 10 friends to StudyWave",            icon: "Rocket",      color: "purple",  pointsRequired: 550,   category: "general"   },
        { name: "Top Contributor",   description: "Earn 1,000 points",                        icon: "Medal",       color: "gold",    pointsRequired: 1000,  category: "points"    },
        // Elite
        { name: "Legend",            description: "Earn 2,500 points",                        icon: "Crown",       color: "purple",  pointsRequired: 2500,  category: "points"    },
        { name: "Grand Master",      description: "Earn 5,000 points",                        icon: "Brain",       color: "red",     pointsRequired: 5000,  category: "points"    },
        { name: "StudyWave Elite",   description: "Earn 10,000 points",                       icon: "Lightbulb",   color: "gold",    pointsRequired: 10000, category: "points"    },
        { name: "Dedicated",         description: "Keep a 30-day activity streak",            icon: "Flame",       color: "red",     pointsRequired: 450,   category: "general"   },
        { name: "Ambassador",        description: "Refer 25 friends to StudyWave",            icon: "Rocket",      color: "blue",    pointsRequired: 2000,  category: "general"   },
      ]);
      logger.info("Default badges seeded (20 badges)");
    }
  } catch (err: any) {
    logger.warn({ errMsg: String(err?.message ?? err) }, "Seed warning — continuing");
  }
}

async function start() {
  // Run DB migrations
  try {
    const migDb = drizzle(pool);
    const migrationsFolder = path.join(__dirname, "../../../lib/db/drizzle");
    await migrate(migDb, { migrationsFolder });
    logger.info("Database migrations applied successfully");
  } catch (err: any) {
    logger.warn({ errMsg: String(err?.message ?? err) }, "Migrations warning — continuing");
  }

  await seedDatabase();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();
