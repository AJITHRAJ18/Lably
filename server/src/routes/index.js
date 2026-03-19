// ============================================================
// Lably — Route Index
// Mounts all sub-routers under /api/*
// ============================================================

import express from "express";
import { globalLimiter } from "../middleware/rateLimiter.js";
import healthRouter from "./health.js";
import translateRouter from "./translate.js";
import checkoutRouter from "./checkout.razorpay.js";
import adminRouter from "./admin.js";

const router = express.Router();

// Webhook must be ABOVE global limiter — Razorpay retries would get blocked
router.use("/webhook", checkoutRouter);

// Apply global rate limit to all other API routes
router.use(globalLimiter);

// Health check — no auth required
router.use("/health", healthRouter);

// Lab report translation — auth-gated
router.use("/translate", translateRouter);

// Razorpay checkout routes (/api/checkout/report, /subscribe, /verify, /cancel)
router.use("/checkout", checkoutRouter);

// Admin API for user billing updates
router.use("/admin", adminRouter);

export default router;
