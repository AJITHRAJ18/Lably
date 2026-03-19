// ============================================================
// Lably — User Admin API
// Allows admin to update user subscription status for testing.
// ============================================================

import express from "express";
import { supabase } from "../services/supabase.js";

const router = express.Router();

// PATCH /api/admin/user-billing
// Body: { email, subscription_status, subscription_end }
router.patch("/user-billing", async (req, res, next) => {
  const { email, subscription_status, subscription_end } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const { error } = await supabase
    .from("user_billing")
    .update({ subscription_status, subscription_end })
    .eq("email", email);

  if (error) return next(error);
  res.json({ success: true });
});

export default router;
