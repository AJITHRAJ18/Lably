// ============================================================
// Lably — Supabase Service
// Singleton Supabase client for server-side operations.
// Uses the SERVICE ROLE key — never expose this client-side.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import config from "../config/index.js";

export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ─────────────────────────────────────────────────────────────
// User access helpers
// ─────────────────────────────────────────────────────────────

/**
 * getUserAccess — returns the user's current access level.
 * @returns {"free" | "credits" | "subscriber"}
 */
export async function getUserAccess(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("report_credits, subscription_status, subscription_end")
    .eq("id", userId)
    .single();

  if (error || !data) return "free";

  if (
    data.subscription_status === "active" ||
    (data.subscription_end && new Date(data.subscription_end) > new Date())
  ) {
    return "subscriber";
  }

  if (data.report_credits > 0) return "credits";

  return "free";
}

/**
 * deductCredit — decrements one report credit for pay-per-report users.
 * Uses the DB function to avoid race conditions.
 */
export async function deductCredit(userId) {
  const { error } = await supabase.rpc("decrement_credits", {
    user_id: userId,
  });
  if (error) {
    console.error("[Supabase] Failed to deduct credit:", error.message);
  }
}

/**
 * saveReport — persists translated report metadata to report history.
 * NOTE: never saves the original PDF buffer.
 */
export async function saveReport(userId, result) {
  const { error } = await supabase.from("reports").insert({
    user_id: userId,
    lab_name: result.lab_name ?? null,
    report_date: result.report_date ?? null,
    markers: result.markers,
    summary: result.overall_summary ?? null,
    flagged_count: result.flagged_count ?? 0,
  });

  if (error) {
    // Non-fatal: log but don't block the response
    console.error("[Supabase] Failed to save report history:", error.message);
  }
}

/**
 * getReportHistory — fetches a user's past translated reports.
 */
export async function getReportHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from("reports")
    .select("id, created_at, lab_name, report_date, flagged_count, summary")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/**
 * updateRazorpayCustomer — stores the Razorpay payment ID after first checkout.
 */
export async function updateRazorpayCustomer(userId, razorpayPaymentId) {
  await supabase
    .from("users")
    .update({ razorpay_customer_id: razorpayPaymentId })
    .eq("id", userId);
}

/**
 * incrementCredits — adds report credits after a successful purchase.
 */
export async function incrementCredits(userId, amount = 1) {
  await supabase.rpc("increment_credits", {
    user_id: userId,
    amount,
  });
}

/**
 * updateSubscriptionStatus — called by Stripe webhook to sync sub state.
 */
export async function updateSubscriptionStatus(userId, status, endDate = null) {
  await supabase
    .from("users")
    .update({
      subscription_status: status,
      subscription_end: endDate,
    })
    .eq("id", userId);
}

// ─────────────────────────────────────────────────────────────
// Payment idempotency helpers
// Prevents double-credit when /verify and webhook both fire.
// ─────────────────────────────────────────────────────────────

/**
 * isPaymentProcessed — checks if a payment ID was already handled.
 */
export async function isPaymentProcessed(paymentId) {
  const { data } = await supabase
    .from("payment_events")
    .select("id")
    .eq("id", paymentId)
    .maybeSingle();
  return !!data;
}

/**
 * markPaymentProcessed — records a processed payment ID.
 */
export async function markPaymentProcessed(paymentId, eventType, userId) {
  await supabase.from("payment_events").insert({
    id: paymentId,
    event_type: eventType,
    user_id: userId,
  });
}
