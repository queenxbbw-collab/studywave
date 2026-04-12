import path from "node:path";
import app from "./app";
import { logger } from "./lib/logger";
import { pool, db, usersTable } from "@workspace/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import { hashPassword } from "./lib/auth";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedDatabase() {
  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, "admin@studywave.com"))
      .limit(1);

    if (existing.length > 0) {
      logger.info("Seed skipped — admin already exists");
      return;
    }

    const adminHash = await hashPassword("admin123");
    const userHash = await hashPassword("user123");

    await db.insert(usersTable).values([
      {
        username: "admin",
        email: "admin@studywave.com",
        displayName: "Admin",
        passwordHash: adminHash,
        role: "admin",
        points: 9999,
        bio: "Platform administrator",
      },
      {
        username: "alex",
        email: "alex@studywave.com",
        displayName: "Alex",
        passwordHash: userHash,
        role: "user",
        points: 150,
        bio: "StudyWave member",
      },
    ]);

    logger.info("Database seeded — admin@studywave.com / admin123 created");
  } catch (err: any) {
    logger.warn({ errMsg: String(err?.message ?? err) }, "Seed warning — continuing");
  }
}

async function start() {
  // Run DB migrations on startup so tables are always up to date
  try {
    const migDb = drizzle(pool);
    // __dirname is injected by the esbuild banner; from dist/ go up 3 levels to project root
    const migrationsFolder = path.join(__dirname, "../../../lib/db/drizzle");
    await migrate(migDb, { migrationsFolder });
    logger.info("Database migrations applied successfully");
  } catch (err: any) {
    logger.warn({ errMsg: String(err?.message ?? err) }, "Migrations warning — continuing");
  }

  // Seed default accounts if they don't exist
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
