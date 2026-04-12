import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In production, serve the built React frontend
if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Default: studywave dist folder is at ../studywave/dist/public relative to api-server root
  const staticDir =
    process.env.STATIC_PATH ||
    path.resolve(__dirname, "..", "..", "studywave", "dist", "public");

  app.use(express.static(staticDir));

  // API routes
  app.use("/api", router);

  // SPA catch-all — serve index.html for all non-API routes
  app.use((req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  app.use("/api", router);
}

// JSON error handler — must be last, always returns JSON for API errors
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;
