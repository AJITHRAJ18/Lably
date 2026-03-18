import { useState } from "react";
import { StatusDot } from "./StatusDot";
import { StatusBadge } from "./StatusBadge";

export function MarkerCard({ marker }) {
  const [open, setOpen] = useState(marker.flag);

  return (
    <div
      onClick={() => setOpen((o) => !o)}
      style={{
        border: `1px solid ${marker.flag ? "#f0c0a0" : "#e5e2da"}`,
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        background: marker.flag ? "#fffaf6" : "#fff",
        cursor: "pointer",
        transition: "box-shadow .15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <StatusDot status={marker.status} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15 }}>{marker.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, color: "#555" }}>
                {marker.value} {marker.unit}
              </span>
              <StatusBadge status={marker.status} />
            </div>
          </div>

          {marker.reference_range && (
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
              Reference: {marker.reference_range}
            </div>
          )}

          {open && (
            <div
              style={{
                marginTop: 10,
                borderTop: "1px solid #f0ede5",
                paddingTop: 10,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: "#333",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {marker.plain_english}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#888",
                  marginTop: 6,
                  fontStyle: "italic",
                }}
              >
                {marker.why_it_matters}
              </p>

              {/* Extra details for flagged markers */}
              {marker.flag && marker.possible_reasons?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#856404", marginBottom: 4 }}>
                    Possible reasons
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                    {marker.possible_reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}

              {marker.flag && marker.food_habits?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2d6a4f", marginBottom: 4 }}>
                    Foods &amp; dietary tips
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                    {marker.food_habits.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <span style={{ color: "#bbb", fontSize: 12, flexShrink: 0 }}>
          {open ? "▲" : "▼"}
        </span>
      </div>
    </div>
  );
}
