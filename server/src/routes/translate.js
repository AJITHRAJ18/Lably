// ============================================================
// Lably — Translate Route
// POST /api/translate
// Pipeline: auth → paywall → PDF extract → Claude → save → respond
// ============================================================

import express from "express";
import multer from "multer";
import config from "../config/index.js";
import { requireAuth } from "../middleware/auth.js";
import { translateLimiter } from "../middleware/rateLimiter.js";
import { createError } from "../middleware/errorHandler.js";
import { extractPdfText } from "../services/pdf.js";
import { translateLabReport } from "../services/claude.js";
import {
  getUserAccess,
  deductCredit,
  saveReport,
} from "../services/supabase.js";

const router = express.Router();

// Multer: in-memory only — PDF never written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileSizeBytes },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(createError(400, "invalid_file_type", "File must be a PDF."));
    }
    cb(null, true);
  },
});

/**
 * POST /api/translate
 *
 * Headers:
 *   Authorization: Bearer <supabase-jwt>
 *
 * Body (multipart/form-data):
 *   report: <pdf-file>
 *
 * Responses:
 *   200 { success: true, data: TranslationResult, credits_remaining?: number }
 *   400 No file / invalid type
 *   401 Not authenticated
 *   402 Payment required
 *   422 PDF unreadable / no markers found
 *   429 Rate limit exceeded
 *   500 Internal error
 */
router.post(
  "/",
  // multer MUST run first — it consumes the multipart body.
  // If auth runs first and rejects, the body stream is never drained,
  // causing a "Request aborted" error on large file uploads.
  upload.single("report"),
  requireAuth,
  translateLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      // ── Admin bypass ───────────────────────────────────────
      const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const isAdmin = ADMIN_EMAILS.includes(userEmail?.toLowerCase());

      // ── 1. Check paywall ───────────────────────────────────
      if (!isAdmin) {
        const access = await getUserAccess(userId);

        if (access === "free") {
          return res.status(402).json({
            error: "payment_required",
            message:
              "You've used your free report. Choose a plan to continue.",
          });
        }
      }

      // ── 2. Validate file presence ──────────────────────────
      if (!req.file) {
        return next(createError(400, "no_file", "No file uploaded."));
      }

      // ── 3. Extract text from PDF ───────────────────────────
      const rawText = await extractPdfText(req.file.buffer);

      // ── 4. Translate with Claude ───────────────────────────
      const result = await translateLabReport(rawText);

      // ── 5. Deduct credit for pay-per-report users ──────────
      if (!isAdmin) {
        const access = await getUserAccess(userId);
        if (access === "credits") {
          await deductCredit(userId);
        }
      }

      // ── 6. Persist report history (non-fatal if it fails) ──
      await saveReport(userId, result);

      // ── 7. Return result ───────────────────────────────────
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
