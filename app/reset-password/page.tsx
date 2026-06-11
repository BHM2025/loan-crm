"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
    setLoading(false);
  };

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>MX</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Set new password</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>Choose a strong password for your account</p>
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: 32 }}>
          {!token ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#ef4444", fontSize: 14, margin: "0 0 16px" }}>Invalid reset link.</p>
              <Link href="/forgot-password" style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>Request a new one →</Link>
            </div>
          ) : done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, margin: "0 0 8px" }}>Password updated!</p>
              <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 4px" }}>Redirecting you to sign in…</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters" required autoFocus style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
              </div>
              {error && <div style={{ marginBottom: 14, fontSize: 12, color: "#ef4444" }}>⚠️ {error}</div>}
              <button type="submit" disabled={loading || !password || !confirm}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading || !password || !confirm ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading || !password || !confirm ? "not-allowed" : "pointer" }}>
                {loading ? "Saving…" : "Set new password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
