// ============================================================
// Lably — Health Check Route
// GET /api/health
// Used by load balancers, uptime monitors, and CI checks.
// ============================================================

import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "lably-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;
