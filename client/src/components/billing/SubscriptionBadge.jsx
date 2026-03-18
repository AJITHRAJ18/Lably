const CONFIGS = {
  subscriber: {
    label: "Pro — unlimited",
    bg: "#d8f3dc",
    color: "#2d6a4f",
  },
  credits: {
    bg: "#fff3cd",
    color: "#856404",
  },
  free: {
    label: "Free plan",
    bg: "#f0f0ec",
    color: "#666",
  },
};

export function SubscriptionBadge({ access, credits }) {
  const config = CONFIGS[access] ?? CONFIGS.free;

  const label =
    access === "credits"
      ? `${credits ?? 0} report${credits !== 1 ? "s" : ""} left`
      : config.label;

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 11px",
        borderRadius: 20,
        background: config.bg,
        color: config.color,
      }}
    >
      {label}
    </span>
  );
}
