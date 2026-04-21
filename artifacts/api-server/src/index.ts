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
    await seedUsers();
  } catch (err: any) {
    logger.warn({ errMsg: String(err?.message ?? err) }, "User seed warning — continuing");
  }
  try {
    await seedBadges();
  } catch (err: any) {
    logger.warn({ errMsg: String(err?.message ?? err) }, "Badge seed warning — continuing");
  }
}

async function seedUsers() {
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
}

async function seedBadges() {
    // ── 2a. Translate any pre-existing English badges to Romanian ────────────
    const BADGE_TRANSLATIONS: Array<{ old: string; name: string; description: string }> = [
      { old: "First Step",         name: "Primul Pas",                 description: "Pune prima ta întrebare" },
      { old: "Curious Mind",       name: "Minte Curioasă",             description: "Pune 5 întrebări" },
      { old: "Helper",             name: "Ajutor",                     description: "Publică primul tău răspuns" },
      { old: "Quick Learner",      name: "Învățăcel Rapid",            description: "Câștigă 50 de puncte" },
      { old: "Knowledge Seeker",   name: "Căutător de Cunoștințe",     description: "Pune 25 de întrebări" },
      { old: "Problem Solver",     name: "Rezolvator de Probleme",     description: "Ai 10 răspunsuri acceptate" },
      { old: "Rising Star",        name: "Stea în Ascensiune",         description: "Câștigă 250 de puncte" },
      { old: "On Fire",            name: "În Flăcări",                 description: "Menține o serie de 7 zile de răspunsuri" },
      { old: "Connector",          name: "Conector",                   description: "Recomandă 3 prieteni pe StudyWave" },
      { old: "Voted Up",           name: "Apreciat",                   description: "Primește 50 de voturi pozitive la răspunsurile tale" },
      { old: "Expert",             name: "Expert",                     description: "Câștigă 500 de puncte" },
      { old: "Gold Ribbon Winner", name: "Câștigător Panglica de Aur", description: "Câștigă prima ta Panglică de Aur" },
      { old: "Mentor",             name: "Mentor",                     description: "Ai 50 de răspunsuri acceptate" },
      { old: "Influencer",         name: "Influencer",                 description: "Recomandă 10 prieteni pe StudyWave" },
      { old: "Top Contributor",    name: "Contribuitor de Top",        description: "Câștigă 1.000 de puncte" },
      { old: "Legend",             name: "Legendă",                    description: "Câștigă 2.500 de puncte" },
      { old: "Grand Master",       name: "Mare Maestru",               description: "Câștigă 5.000 de puncte" },
      { old: "StudyWave Elite",    name: "StudyWave Elite",            description: "Câștigă 10.000 de puncte" },
      { old: "Dedicated",          name: "Dedicat",                    description: "Menține o serie de activitate de 30 de zile" },
      { old: "Ambassador",         name: "Ambasador",                  description: "Recomandă 25 de prieteni pe StudyWave" },
    ];
    let translated = 0;
    for (const t of BADGE_TRANSLATIONS) {
      const result = await db
        .update(badgesTable)
        .set({ name: t.name, description: t.description })
        .where(eq(badgesTable.name, t.old))
        .returning({ id: badgesTable.id });
      translated += result.length;
    }
    if (translated > 0) {
      logger.info(`Translated ${translated} badge(s) to Romanian`);
    }

    // ── 2b. Seed default badges ──────────────────────────────────────────────
    const existingBadges = await db.select({ id: badgesTable.id }).from(badgesTable).limit(1);
    if (existingBadges.length === 0) {
      await db.insert(badgesTable).values([
        // Începător
        { name: "Primul Pas",                description: "Pune prima ta întrebare",                          icon: "Sparkles",    color: "purple",  pointsRequired: 0,     category: "general"   },
        { name: "Minte Curioasă",            description: "Pune 5 întrebări",                                 icon: "HelpCircle",  color: "blue",    pointsRequired: 25,    category: "questions" },
        { name: "Ajutor",                    description: "Publică primul tău răspuns",                       icon: "MessageCircle", color: "green", pointsRequired: 10,    category: "answers"   },
        { name: "Învățăcel Rapid",           description: "Câștigă 50 de puncte",                             icon: "Zap",         color: "gold",    pointsRequired: 50,    category: "points"    },
        // Intermediar
        { name: "Căutător de Cunoștințe",    description: "Pune 25 de întrebări",                             icon: "BookOpen",    color: "blue",    pointsRequired: 100,   category: "questions" },
        { name: "Rezolvator de Probleme",    description: "Ai 10 răspunsuri acceptate",                       icon: "CheckCircle", color: "green",   pointsRequired: 150,   category: "answers"   },
        { name: "Stea în Ascensiune",        description: "Câștigă 250 de puncte",                            icon: "Star",        color: "gold",    pointsRequired: 250,   category: "points"    },
        { name: "În Flăcări",                description: "Menține o serie de 7 zile de răspunsuri",          icon: "Flame",       color: "red",     pointsRequired: 200,   category: "answers"   },
        { name: "Conector",                  description: "Recomandă 3 prieteni pe StudyWave",                icon: "Heart",       color: "purple",  pointsRequired: 175,   category: "general"   },
        { name: "Apreciat",                  description: "Primește 50 de voturi pozitive la răspunsurile tale", icon: "Target",   color: "blue",    pointsRequired: 200,   category: "answers"   },
        // Avansat
        { name: "Expert",                    description: "Câștigă 500 de puncte",                            icon: "Award",       color: "silver",  pointsRequired: 500,   category: "points"    },
        { name: "Câștigător Panglica de Aur",description: "Câștigă prima ta Panglică de Aur",                 icon: "Trophy",      color: "gold",    pointsRequired: 400,   category: "awards"    },
        { name: "Mentor",                    description: "Ai 50 de răspunsuri acceptate",                    icon: "Shield",      color: "green",   pointsRequired: 600,   category: "answers"   },
        { name: "Influencer",                description: "Recomandă 10 prieteni pe StudyWave",               icon: "Rocket",      color: "purple",  pointsRequired: 550,   category: "general"   },
        { name: "Contribuitor de Top",       description: "Câștigă 1.000 de puncte",                          icon: "Medal",       color: "gold",    pointsRequired: 1000,  category: "points"    },
        // Elită
        { name: "Legendă",                   description: "Câștigă 2.500 de puncte",                          icon: "Crown",       color: "purple",  pointsRequired: 2500,  category: "points"    },
        { name: "Mare Maestru",              description: "Câștigă 5.000 de puncte",                          icon: "Brain",       color: "red",     pointsRequired: 5000,  category: "points"    },
        { name: "StudyWave Elite",           description: "Câștigă 10.000 de puncte",                         icon: "Lightbulb",   color: "gold",    pointsRequired: 10000, category: "points"    },
        { name: "Dedicat",                   description: "Menține o serie de activitate de 30 de zile",      icon: "Flame",       color: "red",     pointsRequired: 450,   category: "general"   },
        { name: "Ambasador",                 description: "Recomandă 25 de prieteni pe StudyWave",            icon: "Rocket",      color: "blue",    pointsRequired: 2000,  category: "general"   },
      ]);
      logger.info("Default badges seeded (20 badges)");
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
