"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push(params.get("from") || "/");
    } else {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    width: "100%", padding: "12px 16px", borderRadius: 10,
    border: `1.5px solid ${hasError ? "#ef4444" : "#e2e8f0"}`,
    fontSize: 14, outline: "none", backgroundColor: "#f8fafc",
    boxSizing: "border-box" as const, transition: "border 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", backgroundImage: "url('/bg.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>MX</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>Maple X Loan CRM</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: 32 }}>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Email</label>
              <input
                type="text" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com (or 'admin')"
                required autoFocus style={inputStyle(!!error)}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = error ? "#ef4444" : "#e2e8f0"}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required style={inputStyle(!!error)}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = error ? "#ef4444" : "#e2e8f0"}
              />
              {error && <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>⚠️ {error}</div>}
            </div>
            <button type="submit" disabled={loading || !email || !password}
              style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading || !email || !password ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading || !email || !password ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.4)", transition: "all 0.15s" }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 20 }}>🔒 Secure admin & agent access</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
