import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { handleStripeWebhook } from "./routes/payments";

const app: Express = express();

// We run behind the Replit edge proxy (and any deployment proxy in production), so without
// this `req.ip` would always be the proxy's address. That breaks every express-rate-limit
// bucket: instead of one bucket per attacker, you get one shared global bucket — the
// attacker either trivially DoSes the limit for everyone or sails past it because his
// requests blend with the rest of the traffic. We trust exactly one hop (the immediate
// proxy) so that downstream X-Forwarded-For headers from clients can't be spoofed.
app.set("trust proxy", 1);

// Stripe webhook must be registered BEFORE express.json() to receive raw Buffer
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) { res.status(400).json({ error: "Missing stripe-signature" }); return; }
  try {
    await handleStripeWebhook(req.body as Buffer, Array.isArray(sig) ? sig[0] : sig);
    res.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe webhook]", err.message);
    res.status(400).json({ error: "Webhook error" });
  }
});

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
app.use(express.json({ limit: "2mb" }));
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
