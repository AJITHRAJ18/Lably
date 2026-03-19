// ============================================================
// Lably — usePurchase Hook
// Handles Razorpay checkout for report and subscription.
// ============================================================

import { useState, useCallback } from "react";

/**
 * loadRazorpayScript — dynamically loads the Razorpay checkout script.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * usePurchase — calls the backend to create Razorpay orders/subscriptions
 * and opens the Razorpay Checkout popup.
 *
 * @param {string|null} userId
 * @param {string|null} userEmail
 * @param {Function} onSuccess — callback when payment succeeds
 */
export function usePurchase(userId, userEmail, onSuccess) {
  const [loading, setLoading] = useState(null); // "report" | "monthly" | null
  const [error, setError] = useState(null);

  const checkout = useCallback(async (type) => {
    setLoading(type);
    setError(null);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError("Failed to load Razorpay. Please check your internet connection.");
      setLoading(null);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    const endpoint =
      type === "report"
        ? `${apiUrl}/api/checkout/report`
        : `${apiUrl}/api/checkout/subscribe`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Checkout failed. Please try again.");
      }

      if (type === "report") {
        // One-time payment flow
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "Lab in English",
          description: "Single Lab Report",
          order_id: data.orderId,
          prefill: { email: userEmail },
          theme: { color: "#2d6a4f" },
          handler: async (response) => {
            // Verify payment on server
            try {
              const apiUrl = import.meta.env.VITE_API_URL;
              const verifyRes = await fetch(`${apiUrl}/api/checkout/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  type: "report_credit",
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                onSuccess?.("report");
              } else {
                setError("Payment verification failed. Contact support.");
              }
            } catch {
              setError("Payment verification failed. Contact support.");
            }
            setLoading(null);
          },
          modal: {
            ondismiss: () => setLoading(null),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) => {
          setError(resp.error?.description || "Payment failed. Please try again.");
          setLoading(null);
        });
        rzp.open();

      } else {
        // Subscription flow
        const options = {
          key: data.keyId,
          subscription_id: data.subscriptionId,
          name: "Lab in English",
          description: "Monthly Plan — ₹200/mo",
          prefill: { email: userEmail },
          theme: { color: "#2d6a4f" },
          handler: async (response) => {
            try {
              const apiUrl = import.meta.env.VITE_API_URL;
              const verifyRes = await fetch(`${apiUrl}/api/checkout/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  type: "subscription",
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                onSuccess?.("subscription");
              } else {
                setError("Payment verification failed. Contact support.");
              }
            } catch {
              setError("Payment verification failed. Contact support.");
            }
            setLoading(null);
          },
          modal: {
            ondismiss: () => setLoading(null),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) => {
          setError(resp.error?.description || "Payment failed. Please try again.");
          setLoading(null);
        });
        rzp.open();
      }
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  }, [userId, userEmail, onSuccess]);

  return { loading, error, checkout };
}
