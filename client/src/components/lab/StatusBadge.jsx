import { STATUS_COLORS } from "../../constants/statusColors";

export function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.unknown;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 9px",
        borderRadius: 20,
        background: s.bg,
        color: s.text,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}
