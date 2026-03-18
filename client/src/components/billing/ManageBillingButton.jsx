import { useState } from "react";

export function ManageBillingButton({ userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const cancelSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        throw new Error(data.message || "Could not cancel subscription.");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#777" }}>Cancel subscription?</span>
        <button
          onClick={cancelSubscription}
          disabled={loading}
          style={{
            background: "#c0392b",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          style={{
            background: "none",
            border: "1px solid #e0ddd5",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            color: "#555",
            cursor: "pointer",
          }}
        >
          Keep plan
        </button>
        {error && (
          <div style={{ fontSize: 13, color: "#c0392b" }}>{error}</div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      style={{
        background: "none",
        border: "1px solid #e0ddd5",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 14,
        color: "#555",
        cursor: "pointer",
      }}
    >
      Manage billing
    </button>
  );
}
