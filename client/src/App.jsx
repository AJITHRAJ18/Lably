import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import LabUploader from "./components/LabUploader";
import { PricingModal } from "./components/billing/PricingModal";
import { SubscriptionBadge } from "./components/billing/SubscriptionBadge";
import { ManageBillingButton } from "./components/billing/ManageBillingButton";

// ─────────────────────────────────────────────────────────────
// Disclaimer Banner
// ─────────────────────────────────────────────────────────────

function DisclaimerBar() {
  return (
    <div
      style={{
        background: "#1a1a18",
        color: "#c8c4ba",
        fontSize: 12,
        textAlign: "center",
        padding: "8px 24px",
        lineHeight: 1.4,
      }}
    >
      ⚕️ Lab in English is for educational purposes only and does not constitute medical
      advice. Always discuss your results with a qualified healthcare provider.
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Nav Bar
// ─────────────────────────────────────────────────────────────

function NavBar({ user, access, credits, onSignIn, onSignOut }) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(247,245,240,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e0ddd5",
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 22,
          color: "#1a1a18",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 22 }}>🧪</span>
        <span>Lab <span style={{ color: "#2d6a4f", fontStyle: "italic" }}>in English</span></span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {user ? (
          <>
            <SubscriptionBadge access={access} credits={credits} />
            {access === "subscriber" && (
              <ManageBillingButton userId={user.id} />
            )}
            <button
              onClick={onSignOut}
              style={{
                background: "none",
                border: "1px solid #e0ddd5",
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 13,
                color: "#777",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={onSignIn}
            style={{
              background: "#1a1a18",
              color: "#fff",
              border: "none",
              borderRadius: 100,
              padding: "9px 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "64px 24px 48px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#d8f3dc",
          color: "#2d6a4f",
          fontSize: 13,
          fontWeight: 500,
          padding: "6px 14px",
          borderRadius: 100,
          marginBottom: 28,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#2d6a4f",
          }}
        />
        AI-powered lab report translation
      </div>

      <h1
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(36px, 6vw, 60px)",
          fontWeight: 400,
          color: "#1a1a18",
          lineHeight: 1.1,
          marginBottom: 20,
        }}
      >
        Understand your medical lab results{" "}
        <em style={{ fontStyle: "italic", color: "#2d6a4f" }}>in plain English</em>
      </h1>

      <p
        style={{
          fontSize: 18,
          color: "#4a4a45",
          maxWidth: 540,
          margin: "0 auto 40px",
          lineHeight: 1.6,
        }}
      >
        Upload your medical lab report PDF and get a clear, calm explanation of every
        biomarker — no jargon, no alarm bells.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Auth Modal (email magic link)
// ─────────────────────────────────────────────────────────────

function AuthModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !supabase) return;
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "40px 36px",
          maxWidth: 420,
          width: "100%",
          position: "relative",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 18,
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "#999",
          }}
        >
          ×
        </button>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📬</div>
            <div
              style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}
            >
              Check your email
            </div>
            <div style={{ fontSize: 14, color: "#777" }}>
              We sent a magic link to <strong>{email}</strong>. Click it to
              sign in.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              Sign in to Lab in English
            </div>
            <div style={{ fontSize: 14, color: "#777", marginBottom: 24 }}>
              We'll email you a magic link — no password needed.
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1.5px solid #e0ddd5",
                  borderRadius: 10,
                  fontSize: 15,
                  outline: "none",
                  marginBottom: 12,
                }}
              />
              {error && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#c0392b",
                    marginBottom: 10,
                  }}
                >
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !supabase}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#2d6a4f",
                  color: "#fff",
                  border: "none",
                  borderRadius: 100,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
              {!supabase && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#aaa",
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  Auth not configured. Add VITE_SUPABASE_* env vars.
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App Root
// ─────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(null);
  const [access, setAccess] = useState("free");
  const [credits, setCredits] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // ── Initialize Supabase auth state ──────────────────────────
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => setSession(sess)
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch access level when session changes ─────────────────
  useEffect(() => {
    if (!session) {
      setAccess("free");
      setCredits(0);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    fetch(`${apiUrl}/api/health`) // lightweight check
      .catch(() => {})
      .finally(() => {
        // Fetch user billing info — your backend can expose a /api/user/access endpoint
        // For now we derive from the session via Supabase directly
        if (!supabase) return;
        supabase
          .from("user_billing")
          .select("access_level, report_credits")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setAccess(data.access_level || "free");
              setCredits(data.report_credits || 0);
            }
          });
      });
  }, [session]);

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setAccess("free");
    setCredits(0);
  };

  if (!authReady) return null; // Prevent flash before auth check

  return (
    <div style={{ minHeight: "100vh", background: "#f7f5f0" }}>
      <DisclaimerBar />

      <NavBar
        user={session?.user ?? null}
        access={access}
        credits={credits}
        onSignIn={() => setShowAuth(true)}
        onSignOut={handleSignOut}
      />

      <main>
        <Hero />

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>
          <LabUploader
            authToken={session?.access_token ?? null}
            credits={credits}
            onPaywallHit={() => setShowPaywall(true)}
            onSignInRequired={() => setShowAuth(true)}
          />
        </div>
      </main>

      {/* Footer / Contact */}
      <footer
        style={{
          padding: "32px 24px",
          borderTop: "1px solid #e0ddd5",
          fontSize: 13,
          color: "#999",
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ marginBottom: 4 }}>
              Built by{" "}
              <strong style={{ color: "#555" }}>
                Ajithraj
              </strong>
            </div>
            <div>
              Contact:{" "}
              <a
                href="mailto:ajithrajepm2218@gmail.com"
                style={{ color: "#2d6a4f", textDecoration: "none" }}
              >
                ajithrajepm2218@gmail.com
              </a>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <a
              href="/about.html"
              style={{ color: "#777", textDecoration: "none" }}
            >
              About
            </a>
            <a
              href="/privacy.html"
              style={{ color: "#777", textDecoration: "none" }}
            >
              Privacy
            </a>
            <a
              href="/terms.html"
              style={{ color: "#777", textDecoration: "none" }}
            >
              Terms
            </a>
          </div>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {showPaywall && (
        <PricingModal
          onClose={() => setShowPaywall(false)}
          userId={session?.user?.id ?? null}
          userEmail={session?.user?.email ?? null}
        />
      )}
    </div>
  );
}
