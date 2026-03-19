import { useState, useRef, useEffect } from "react";
import { MarkerCard } from "../lab/MarkerCard";
import { DoctorQuestions } from "../lab/DoctorQuestions";
import { Summary } from "../lab/Summary";

// ─────────────────────────────────────────────────────────────
// Upload / Idle Screen
// ─────────────────────────────────────────────────────────────

function UploadZone({ file, error, onFile, onSubmit, inputRef, isAuthenticated }) {
  const [hovering, setHovering] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setHovering(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setHovering(true);
        }}
        onDragLeave={() => setHovering(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${hovering ? "#2d6a4f" : "#c8c4ba"}`,
          borderRadius: 16,
          padding: "48px 24px",
          textAlign: "center",
          background: hovering ? "#f2f9f5" : "#faf9f6",
          cursor: "pointer",
          transition: "border-color .2s, background .2s",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: "#222" }}>
          {file ? file.name : "Drop your lab report PDF here"}
        </div>
        <div style={{ fontSize: 13, color: "#999", marginTop: 6 }}>
          {file
            ? "Ready to translate"
            : "or click to browse — Quest, LabCorp, NHS and more"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={(e) => onFile(e.target.files[0])}
        />
      </div>

      {error && (
        <div
          style={{
            background: "#fde8e8",
            color: "#c0392b",
            borderRadius: 10,
            padding: "10px 14px",
            marginTop: 12,
            fontSize: 14,
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!file}
        style={{
          width: "100%",
          marginTop: 16,
          padding: "14px",
          background: file ? "#2d6a4f" : "#ccc",
          color: "#fff",
          border: "none",
          borderRadius: 100,
          fontSize: 16,
          fontWeight: 500,
          cursor: file ? "pointer" : "default",
          transition: "background .2s",
        }}
      >
        {!file
          ? "Translate my results →"
          : !isAuthenticated
          ? "Sign in to translate →"
          : "Translate my results →"}
      </button>

      <p
        style={{
          fontSize: 12,
          color: "#aaa",
          textAlign: "center",
          marginTop: 10,
        }}
      >
        Your PDF is deleted immediately after processing. We never store your
        file.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress Steps Bar + Loading Screen
// ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Upload", icon: "📄" },
  { label: "Extracting", icon: "🔍" },
  { label: "Translating", icon: "🧠" },
  { label: "Done", icon: "✅" },
];

function ProgressBar({ step }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        margin: "0 auto 32px",
        maxWidth: 460,
      }}
    >
      {STEPS.map((s, i) => {
        const completed = i < step;
        const active = i === step;
        const circleColor = completed
          ? "#2d6a4f"
          : active
          ? "#2d6a4f"
          : "#ddd";
        const textColor = completed || active ? "#2d6a4f" : "#bbb";

        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            {/* Step circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: completed || active ? circleColor : "#fff",
                  border: `2.5px solid ${circleColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: completed ? 16 : 14,
                  color: completed || active ? "#fff" : "#bbb",
                  fontWeight: 700,
                  transition: "all .3s ease",
                }}
              >
                {completed ? "✓" : i + 1}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  color: textColor,
                  marginTop: 6,
                  transition: "color .3s ease",
                }}
              >
                {s.label}
              </div>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 3,
                  background: i < step ? "#2d6a4f" : "#e0ddd5",
                  borderRadius: 2,
                  marginBottom: 20,
                  transition: "background .3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoadingScreen({ step }) {
  const messages = [
    { title: "Uploading your report…", sub: "Sending your PDF securely" },
    { title: "Extracting biomarkers…", sub: "Reading values from your report" },
    { title: "Translating to plain English…", sub: "Our AI is analyzing your results" },
    { title: "Almost done!", sub: "Preparing your results" },
  ];
  const msg = messages[step] || messages[0];

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        textAlign: "center",
        padding: "48px 24px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <ProgressBar step={step} />
      <div style={{ fontSize: 36, marginBottom: 16 }}>{STEPS[step]?.icon || "⏳"}</div>
      <div style={{ fontWeight: 600, fontSize: 18, color: "#222" }}>
        {msg.title}
      </div>
      <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
        {msg.sub}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Results Screen
// ─────────────────────────────────────────────────────────────

function ResultsScreen({ result, onReset }) {
  const flagged = result.markers.filter((m) => m.flag);
  const normal = result.markers.filter((m) => !m.flag);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: "0 16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Your results</div>
          {result.lab_name && (
            <div style={{ fontSize: 13, color: "#999" }}>{result.lab_name}</div>
          )}
          {result.report_date && (
            <div style={{ fontSize: 12, color: "#bbb" }}>
              {result.report_date}
            </div>
          )}
        </div>
        <button
          onClick={onReset}
          style={{
            fontSize: 13,
            color: "#2d6a4f",
            background: "none",
            border: "1px solid #b7dfc9",
            borderRadius: 8,
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >
          Upload another
        </button>
      </div>

      {/* Stats bar */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
      >
        <div
          style={{
            background: "#f7f5f0",
            borderRadius: 10,
            padding: "10px 16px",
            flex: 1,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {result.markers.length}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>markers found</div>
        </div>
        <div
          style={{
            background:
              flagged.length > 0 ? "#fff3cd" : "#d8f3dc",
            borderRadius: 10,
            padding: "10px 16px",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: flagged.length > 0 ? "#856404" : "#2d6a4f",
            }}
          >
            {flagged.length}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>need attention</div>
        </div>
        <div
          style={{
            background: "#d8f3dc",
            borderRadius: 10,
            padding: "10px 16px",
            flex: 1,
          }}
        >
          <div
            style={{ fontSize: 22, fontWeight: 700, color: "#2d6a4f" }}
          >
            {normal.length}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>look normal</div>
        </div>
      </div>

      <Summary text={result.overall_summary} />

      {/* Flagged markers */}
      {flagged.length > 0 && (
        <>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#c0392b",
              margin: "22px 0 10px",
            }}
          >
            ⚠️ Needs attention ({flagged.length})
          </div>
          {flagged.map((m, i) => (
            <MarkerCard key={i} marker={m} />
          ))}
        </>
      )}

      {/* Normal markers */}
      {normal.length > 0 && (
        <>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#2d6a4f",
              margin: "22px 0 10px",
            }}
          >
            ✅ Looking good ({normal.length})
          </div>
          {normal.map((m, i) => (
            <MarkerCard key={i} marker={m} />
          ))}
        </>
      )}

      <DoctorQuestions questions={result.doctor_questions} />

      {/* Disclaimer */}
      {result.disclaimer && (
        <div
          style={{
            fontSize: 12,
            color: "#aaa",
            marginTop: 28,
            padding: "12px 16px",
            background: "#f7f5f0",
            borderRadius: 10,
            lineHeight: 1.5,
          }}
        >
          ⚕️ {result.disclaimer}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main LabUploader Component
// ─────────────────────────────────────────────────────────────

// Map server error codes to user-friendly messages
function friendlyError(json) {
  const code = json.error;
  const msg = json.message;
  switch (code) {
    case "no_markers_found":
      return "We couldn't find any biomarkers in this PDF. Please make sure you're uploading a lab report that contains test results (e.g. blood work, metabolic panel, CBC).";
    case "invalid_file_type":
      return "This file doesn't appear to be a valid PDF. Please upload a PDF lab report.";
    case "ai_unavailable":
      return "Our translation service is temporarily unavailable. Please try again in a moment.";
    case "ai_parse_error":
      return "Something went wrong while reading your results. Please try uploading again.";
    case "response_truncated":
      return "Your report is too large to process at once. Try uploading just the results pages.";
    default:
      return msg || "Something went wrong. Please try again.";
  }
}

export default function LabUploader({ authToken, onPaywallHit, onSignInRequired }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [progressStep, setProgressStep] = useState(0);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("File exceeds the 20 MB limit.");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleSubmit = async () => {
    if (!file) return;

    // Gate: require sign-in before attempting upload
    if (!authToken) {
      if (onSignInRequired) onSignInRequired();
      else setError("Please sign in to translate your report.");
      return;
    }

    setStatus("uploading");
    setProgressStep(0);
    setError("");

    const formData = new FormData();
    formData.append("report", file);

    const headers = { Authorization: `Bearer ${authToken}` };

    // Simulate progress steps (upload → extract → translate)
    // Step 0: uploading, Step 1: extracting, Step 2: translating
    const stepTimer1 = setTimeout(() => setProgressStep(1), 1500);
    const stepTimer2 = setTimeout(() => setProgressStep(2), 4000);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiUrl}/api/translate`, {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await res.json();

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res.status === 402) {
        // Free user hit the paywall — bubble up to parent
        setStatus("idle");
        setProgressStep(0);
        if (onPaywallHit) onPaywallHit();
        return;
      }

      if (!res.ok || !json.success) {
        throw new Error(friendlyError(json));
      }

      setProgressStep(3);
      // Brief pause on "Done" step before showing results
      await new Promise((r) => setTimeout(r, 600));

      setResult(json.data);
      setStatus("done");
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setError(err.message);
      setStatus("error");
      setProgressStep(0);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStatus("idle");
    setError("");
    setProgressStep(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (status === "uploading") return <LoadingScreen step={progressStep} />;

  if (status === "done" && result)
    return <ResultsScreen result={result} onReset={reset} />;

  return (
    <UploadZone
      file={file}
      error={error}
      onFile={handleFile}
      onSubmit={handleSubmit}
      inputRef={inputRef}
      isAuthenticated={!!authToken}
    />
  );
}
