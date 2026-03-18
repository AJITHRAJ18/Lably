// ============================================================
// Lably — Razorpay Service
// Wraps Razorpay SDK calls for orders and payment verification.
// ============================================================

import Razorpay from "razorpay";
import crypto from "crypto";
import config from "../config/index.js";
import { createError } from "../middleware/errorHandler.js";
import { supabase } from "./supabase.js";

export const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * createReportOrder — one-time ₹10 order for a single report.
 */
export async function createReportOrder(userId, userEmail) {
  try {
    const shortId = userId.slice(0, 8);
    const order = await razorpay.orders.create({
      amount: 1000, // ₹10 in paise
      currency: "INR",
      receipt: `rpt_${shortId}_${Date.now()}`,
      notes: { userId, userEmail, type: "report_credit", credits: "1" },
    });
    return order;
  } catch (err) {
    console.error("[Razorpay] Order creation error:", err.error || err.message || err);
    throw createError(500, "razorpay_error", "Could not create order.");
  }
}

/**
 * createSubscriptionOrder — ₹200/mo subscription order.
 * Razorpay subscriptions use Plans + Subscriptions API.
 */
export async function createSubscriptionOrder(userId, userEmail) {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: config.razorpay.plans.monthly,
      total_count: 12, // max 12 billing cycles
      notes: { userId, userEmail, type: "subscription" },
    });
    return subscription;
  } catch (err) {
    console.error("[Razorpay] Subscription creation error:", err.error || err.message || err);
    throw createError(500, "razorpay_error", "Could not create subscription.");
  }
}

/**
 * verifyPaymentSignature — validates Razorpay payment signature.
 * Returns true if valid, throws 400 if invalid.
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expectedSignature = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw createError(400, "signature_invalid", "Payment signature verification failed.");
  }
  return true;
}

/**
 * verifySubscriptionSignature — validates Razorpay subscription payment signature.
 */
export function verifySubscriptionSignature({ subscriptionId, paymentId, signature }) {
  const expectedSignature = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw createError(400, "signature_invalid", "Subscription signature verification failed.");
  }
  return true;
}

/**
 * verifyWebhookSignature — validates Razorpay webhook signature.
 */
export function verifyWebhookSignature(body, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", config.razorpay.webhookSecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw createError(400, "webhook_signature_invalid", "Webhook signature verification failed.");
  }
  return true;
}
