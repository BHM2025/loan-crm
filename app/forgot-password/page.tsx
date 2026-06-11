"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>MX</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Reset your password</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>Enter your email to receive a reset link</p>
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: 32 }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, margin: "0 0 8px" }}>Check your inbox</p>
              <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px" }}>If an account exists for <strong>{email}</strong>, a reset link has been sent. It expires in 1 hour.</p>
              <Link href="/login" style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>← Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Email address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required autoFocus
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
              <button type="submit" disabled={loading || !email}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading || !email ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading || !email ? "not-allowed" : "pointer", marginBottom: 16 }}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <div style={{ textAlign: "center" }}>
                <Link href="/login" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>← Back to sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
