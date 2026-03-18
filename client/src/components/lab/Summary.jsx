export function Summary({ text }) {
  if (!text) return null;

  return (
    <div
      style={{
        background: "#f7f5f0",
        borderRadius: 14,
        padding: "18px 22px",
        marginTop: 16,
        fontSize: 14,
        color: "#444",
        lineHeight: 1.7,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: "#333",
          marginBottom: 8,
        }}
      >
        Overall summary
      </div>
      {text}
    </div>
  );
}
