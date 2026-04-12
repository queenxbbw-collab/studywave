import path from "node:path";
import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

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

async function start() {
  // Run DB migrations on startup so tables are always up to date
  try {
    const db = drizzle(pool);
    // __dirname is injected by the esbuild banner; from dist/ go up 3 levels to project root
    const migrationsFolder = path.join(__dirname, "../../../lib/db/drizzle");
    await migrate(db, { migrationsFolder });
    logger.info("Database migrations applied successfully");
  } catch (err: any) {
    logger.warn({ errMsg: String(err?.message ?? err) }, "Migrations warning — continuing");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();
