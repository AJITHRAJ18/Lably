export function DoctorQuestions({ questions }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div
      style={{
        background: "#f0f7f4",
        border: "1px solid #b7dfc9",
        borderRadius: 14,
        padding: "20px 22px",
        marginTop: 24,
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: "#2d6a4f",
          marginBottom: 12,
        }}
      >
        💬 Questions to ask your doctor
      </div>
      {questions.map((q, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 10,
            fontSize: 14,
            color: "#333",
          }}
        >
          <span style={{ color: "#52b788", fontWeight: 700, flexShrink: 0 }}>
            {i + 1}.
          </span>
          <span>{q}</span>
        </div>
      ))}
    </div>
  );
}
