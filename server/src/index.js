// ============================================================
// Lably — Server Entry Point
// Enterprise-grade Express app setup:
//   Helmet, CORS, compression, rate limiting, logging,
//   route mounting, and global error handler.
// ============================================================

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";

import config from "./config/index.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

// ── Crash safety — log unhandled errors instead of dying ─────
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled rejection:", reason);
});

const app = express();

// ── Security Headers ─────────────────────────────────────────
// Trust proxy (required behind load balancers, Render, Railway, etc.)
app.set("trust proxy", 1);
app.use(helmet());

// ── HTTPS Redirect (production only) ───────────────────────
if (!config.isDev) {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(`https://${req.header("host")}${req.url}`);
    }
    next();
  });
}

// ── CORS ─────────────────────────────────────────────────────
// Only allow the configured frontend origin
app.use(
  cors({
    origin: config.app.clientUrl,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── HTTP Request Logging ─────────────────────────────────────
app.use(morgan(config.isDev ? "dev" : "combined"));

// ── Body Parsing ──────────────────────────────────────────────
// NOTE: /api/webhook needs raw body — handled inside the route
// with express.raw(). All other routes use JSON.
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhook") return next();
  express.json({ limit: "1mb" })(req, res, next);
});

// ── Routes ────────────────────────────────────────────────────
app.use("/api", routes);

// ── Global Error Handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(
    `✅ Lably API running on http://localhost:${config.port} [${config.env}]`
  );
});

export default app;
