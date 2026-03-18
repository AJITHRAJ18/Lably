import { useState } from "react";
import { PricingModal } from "./PricingModal";

/**
 * PaywallGate — wraps content that requires a paid plan.
 * - subscribers/credit-holders: see content directly
 * - free users: see a blurred overlay with an upgrade CTA
 *
 * Props:
 *   access    — "free" | "credits" | "subscriber"
 *   userId    — from auth session
 *   userEmail — from auth session
 *   children  — the component to protect
 */
export function PaywallGate({ access, userId, userEmail, children }) {
  const [showModal, setShowModal] = useState(false);

  if (access === "subscriber" || access === "credits") {
    return <>{children}</>;
  }

  return (
    <div style={{ position: "relative", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Blurred preview */}
      <div
        style={{
          filter: "blur(4px)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.5,
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Upgrade overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(247,245,240,0.75)",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔬</div>
        <div
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: "#1a1a18",
            marginBottom: 8,
          }}
        >
          Your free report is ready
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#777",
            marginBottom: 24,
            maxWidth: 320,
          }}
        >
          Unlock your results — one report for ₹449, or unlimited for ₹749/mo.
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "#2d6a4f",
            color: "#fff",
            border: "none",
            borderRadius: 100,
            padding: "13px 32px",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(45,106,79,0.3)",
          }}
        >
          See my results →
        </button>
      </div>

      {showModal && (
        <PricingModal
          onClose={() => setShowModal(false)}
          userId={userId}
          userEmail={userEmail}
        />
      )}
    </div>
  );
}
