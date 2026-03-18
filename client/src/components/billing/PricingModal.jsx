import { usePurchase } from "../../hooks/usePurchase";

const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 20,
    padding: "36px 32px",
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    position: "relative",
  },
  close: {
    position: "absolute",
    top: 16,
    right: 18,
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#999",
    lineHeight: 1,
  },
  h2: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1a18",
    marginBottom: 6,
    lineHeight: 1.2,
  },
  sub: { fontSize: 15, color: "#777", marginBottom: 28 },
  cards: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  card: (featured) => ({
    border: featured ? "2px solid #2d6a4f" : "1.5px solid #e0ddd5",
    borderRadius: 14,
    padding: "22px 18px",
    cursor: "pointer",
    background: featured ? "#f0f9f4" : "#fff",
    position: "relative",
  }),
  featuredBadge: {
    position: "absolute",
    top: -11,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#2d6a4f",
    color: "#fff",
    fontSize: 10,
    fontWeight: 600,
    padding: "3px 12px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },
  price: { fontSize: 32, fontWeight: 700, color: "#1a1a18", lineHeight: 1 },
  priceSup: { fontSize: 16, verticalAlign: "super" },
  priceLabel: { fontSize: 13, color: "#999", marginTop: 4 },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a18",
    marginBottom: 6,
    marginTop: 14,
  },
  feature: {
    fontSize: 13,
    color: "#555",
    marginTop: 5,
    display: "flex",
    gap: 7,
    alignItems: "flex-start",
  },
  check: { color: "#2d6a4f", fontWeight: 700, flexShrink: 0 },
  btn: (variant) => ({
    width: "100%",
    marginTop: 18,
    padding: "11px",
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: variant === "primary" ? "#2d6a4f" : "#f0f0ec",
    color: variant === "primary" ? "#fff" : "#333",
  }),
  note: {
    fontSize: 12,
    color: "#bbb",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 1.6,
  },
  errorNote: {
    fontSize: 13,
    color: "#c0392b",
    textAlign: "center",
    marginTop: 12,
  },
};

export function PricingModal({ onClose, userId, userEmail }) {
  const handleSuccess = (type) => {
    onClose();
    if (type === "report") {
      window.location.href = "/upload?unlocked=1";
    } else {
      window.location.href = "/dashboard?subscribed=1";
    }
  };

  const { loading, error, checkout } = usePurchase(userId, userEmail, handleSuccess);

  return (
    <div
      style={S.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={S.modal}>
        <button style={S.close} onClick={onClose} aria-label="Close">
          ×
        </button>

        <div style={S.h2}>You've used your free report 🔬</div>
        <div style={S.sub}>Choose how you'd like to continue</div>

        <div style={S.cards}>
          {/* ONE-TIME */}
          <div style={S.card(false)}>
            <div style={S.price}>
              <sup style={S.priceSup}>₹</sup>10
            </div>
            <div style={S.priceLabel}>one report</div>
            <div style={S.cardTitle}>Single report</div>
            <div style={S.feature}>
              <span style={S.check}>✓</span> Full translation
            </div>
            <div style={S.feature}>
              <span style={S.check}>✓</span> Traffic light flags
            </div>
            <div style={S.feature}>
              <span style={S.check}>✓</span> Doctor questions
            </div>
            <button
              style={{
                ...S.btn("secondary"),
                opacity: loading === "report" ? 0.6 : 1,
              }}
              onClick={() => checkout("report")}
              disabled={!!loading}
            >
              {loading === "report" ? "Processing…" : "Pay ₹10"}
            </button>
          </div>

          {/* SUBSCRIPTION */}
          <div style={S.card(true)}>
            <div style={S.featuredBadge}>Best value</div>
            <div style={S.price}>
              <sup style={S.priceSup}>₹</sup>200
            </div>
            <div style={S.priceLabel}>per month</div>
            <div style={S.cardTitle}>Monthly plan</div>
            <div style={S.feature}>
              <span style={S.check}>✓</span> Unlimited reports
            </div>
            <div style={S.feature}>
              <span style={S.check}>✓</span> Trend tracking
            </div>
            <div style={S.feature}>
              <span style={S.check}>✓</span> PDF export
            </div>
            <button
              style={{
                ...S.btn("primary"),
                opacity: loading === "monthly" ? 0.6 : 1,
              }}
              onClick={() => checkout("monthly")}
              disabled={!!loading}
            >
              {loading === "monthly" ? "Processing…" : "Start ₹200/mo"}
            </button>
          </div>
        </div>

        {error && <div style={S.errorNote}>{error}</div>}

        <div style={S.note}>
          Payments secured by Razorpay. Cancel anytime from your account.
        </div>
      </div>
    </div>
  );
}
