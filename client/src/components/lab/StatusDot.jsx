import { STATUS_COLORS } from "../../constants/statusColors";

export function StatusDot({ status }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.unknown;
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: s.dot,
        flexShrink: 0,
        marginTop: 4,
      }}
    />
  );
}
