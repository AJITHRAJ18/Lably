// ============================================================
// Lably — Checkout & Webhook Routes (Razorpay)
// POST /api/checkout/report     → one-time ₹10 order
// POST /api/checkout/subscribe  → ₹200/mo subscription
// POST /api/checkout/verify     → verify payment signature
// POST /api/webhook             → Razorpay event handler
// ============================================================

import express from "express";
import { checkoutLimiter } from "../middleware/rateLimiter.js";
import { createError } from "../middleware/errorHandler.js";
import config from "../config/index.js";
import {
  createReportOrder,
  createSubscriptionOrder,
  verifyPaymentSignature,
  verifySubscriptionSignature,
  verifyWebhookSignature,
  razorpay,
} from "../services/razorpay.js";
import {
  supabase,
  incrementCredits,
  updateRazorpayCustomer,
  updateSubscriptionStatus,
  isPaymentProcessed,
  markPaymentProcessed,
} from "../services/supabase.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// POST /api/checkout/report
// Creates a Razorpay order for a one-time ₹10 report purchase.
// Returns order details for the client to open Razorpay Checkout.
// ─────────────────────────────────────────────────────────────

router.post("/report", checkoutLimiter, async (req, res, next) => {
  try {
    const { userId, userEmail } = req.body;
    if (!userId) return next(createError(401, "unauthorized", "Not authenticated."));

    const order = await createReportOrder(userId, userEmail);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/checkout/subscribe
// Creates a Razorpay subscription for ₹200/mo.
// Returns subscription details for the client to open Razorpay Checkout.
// ─────────────────────────────────────────────────────────────

router.post("/subscribe", checkoutLimiter, async (req, res, next) => {
  try {
    const { userId, userEmail } = req.body;
    if (!userId) return next(createError(401, "unauthorized", "Not authenticated."));

    const subscription = await createSubscriptionOrder(userId, userEmail);
    res.json({
      subscriptionId: subscription.id,
      keyId: config.razorpay.keyId,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/checkout/verify
// Verifies payment signature after client-side Razorpay Checkout.
// Updates user credits or subscription status in the database.
// ─────────────────────────────────────────────────────────────

router.post("/verify", async (req, res, next) => {
  try {
    const {
      userId,
      type,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = req.body;

    if (!userId) return next(createError(401, "unauthorized", "Not authenticated."));

    if (type === "report_credit") {
      // Verify one-time payment
      verifyPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      // Idempotency: skip if this payment was already processed
      const alreadyProcessed = await isPaymentProcessed(razorpay_payment_id);
      if (alreadyProcessed) {
        return res.json({ success: true, type: "report_credit", duplicate: true });
      }
      await markPaymentProcessed(razorpay_payment_id, "report_credit", userId);

      await updateRazorpayCustomer(userId, razorpay_payment_id);
      await incrementCredits(userId, 1);
      console.log(`[Razorpay] +1 report credit → user ${userId}`);

      res.json({ success: true, type: "report_credit" });

    } else if (type === "subscription") {
      // Verify subscription payment
      verifySubscriptionSignature({
        subscriptionId: razorpay_subscription_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      // Idempotency: skip if this payment was already processed
      const alreadyProcessed = await isPaymentProcessed(razorpay_payment_id);
      if (alreadyProcessed) {
        return res.json({ success: true, type: "subscription", duplicate: true });
      }
      await markPaymentProcessed(razorpay_payment_id, "subscription", userId);

      await updateRazorpayCustomer(userId, razorpay_payment_id);
      await updateSubscriptionStatus(userId, "active", null);
      console.log(`[Razorpay] Subscription activated → user ${userId}`);

      // Store subscription ID for future management
      await supabase
        .from("users")
        .update({ razorpay_subscription_id: razorpay_subscription_id })
        .eq("id", userId);

      res.json({ success: true, type: "subscription" });

    } else {
      return next(createError(400, "invalid_type", "Invalid payment type."));
    }
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/checkout/cancel
// Cancels a Razorpay subscription.
// ─────────────────────────────────────────────────────────────

router.post("/cancel", async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return next(createError(401, "unauthorized", "Not authenticated."));

    const { data: user } = await supabase
      .from("users")
      .select("razorpay_subscription_id")
      .eq("id", userId)
      .single();

    if (!user?.razorpay_subscription_id) {
      return next(createError(400, "no_subscription", "No active subscription found."));
    }

    await razorpay.subscriptions.cancel(user.razorpay_subscription_id);
    await updateSubscriptionStatus(userId, "cancelled", null);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/webhook
// Razorpay sends events here. Handles:
//   - payment.captured        → credit or activate sub
//   - subscription.cancelled  → deactivate sub
//   - payment.failed          → flag failed payment
//
// NOTE: must use raw body for signature verification.
// ─────────────────────────────────────────────────────────────

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = typeof req.body === "string" ? req.body : req.body.toString();

    try {
      verifyWebhookSignature(rawBody, signature);
    } catch (err) {
      return next(err);
    }

    const event = JSON.parse(rawBody);

    try {
      switch (event.event) {
        // ── Payment captured (one-time or subscription) ──
        case "payment.captured": {
          const payment = event.payload?.payment?.entity;
          if (!payment) { console.warn("[Webhook] Malformed payment.captured event"); break; }
          const { userId, type } = payment.notes || {};
          if (!userId) { console.warn("[Webhook] Missing userId in payment notes"); break; }

          // Idempotency: skip if already processed by /verify
          const alreadyDone = await isPaymentProcessed(payment.id);
          if (alreadyDone) { console.log(`[Webhook] Payment ${payment.id} already processed, skipping`); break; }
          await markPaymentProcessed(payment.id, type || "unknown", userId);

          if (type === "report_credit") {
            await incrementCredits(userId, 1);
            console.log(`[Webhook] +1 report credit → user ${userId}`);
          }

          if (type === "subscription") {
            await updateSubscriptionStatus(userId, "active", null);
            console.log(`[Webhook] Subscription activated → user ${userId}`);
          }
          break;
        }

        // ── Subscription charged ──
        case "subscription.charged": {
          const subscription = event.payload.subscription.entity;
          const { userId } = subscription.notes || {};
          if (userId) {
            await updateSubscriptionStatus(userId, "active", null);
          }
          break;
        }

        // ── Subscription cancelled ──
        case "subscription.cancelled": {
          const subscription = event.payload.subscription.entity;
          const { userId } = subscription.notes || {};
          if (userId) {
            const endDate = subscription.current_end
              ? new Date(subscription.current_end * 1000).toISOString()
              : null;
            await updateSubscriptionStatus(userId, "cancelled", endDate);
            console.log(`[Webhook] Subscription cancelled → user ${userId}`);
          }
          break;
        }

        // ── Payment failed ──
        case "payment.failed": {
          const payment = event.payload.payment.entity;
          const { userId } = payment.notes || {};
          if (userId) {
            await updateSubscriptionStatus(userId, "past_due", null);
            console.warn(`[Webhook] Payment failed → user ${userId}`);
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error(`[Webhook] Error handling ${event.event}:`, err.message);
    }

    res.json({ received: true });
  }
);

export default router;
