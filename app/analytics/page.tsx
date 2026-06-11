"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Analytics {
  total: number;
  statusCounts: Record<string, number>;
  fundedAmount: number;
  conversionRate: string;
  approvalRate: string;
  recentActivity: { status: string; count: number; date: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  New: "#3b82f6",
  Underwriting: "#f59e0b",
  Approved: "#10b981",
  Funded: "#8b5cf6",
  Declined: "#ef4444",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: "22px 24px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color ?? "#0f172a" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "system-ui,sans-serif" }}>
        Loading analytics…
      </div>
    );
  }

  if (!data) return null;

  const statuses = ["New", "Underwriting", "Approved", "Funded", "Declined"];
  const maxCount = Math.max(...statuses.map((s) => data.statusCounts[s] ?? 0), 1);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Navbar */}
      <header style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.2)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>MX</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>Maple X Loan CRM</span>
            <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.3)" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Analytics</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 20, padding: "5px 16px", fontSize: 12, color: "#fff", fontWeight: 600, textDecoration: "none" }}>
              ← Applications
            </Link>
            <button onClick={logout} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#dc2626", fontWeight: 600, cursor: "pointer" }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Reporting & Analytics</h1>

        {/* Top KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <div style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: 16, padding: "22px 24px", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Total Funded</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{formatCurrency(data.fundedAmount)}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{data.statusCounts["Funded"] ?? 0} funded applications</div>
          </div>
          <StatCard label="Total Applications" value={String(data.total)} sub="active pipeline" />
          <StatCard label="Funding Rate" value={`${data.conversionRate}%`} sub="New → Funded" color="#8b5cf6" />
          <StatCard label="Approval Rate" value={`${data.approvalRate}%`} sub="Approved + Funded" color="#10b981" />
        </div>

        {/* Pipeline breakdown */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <span style={{ fontWeight: 700, color: "#334155", fontSize: 14 }}>Pipeline by Status</span>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {statuses.map((s) => {
                const count = data.statusCounts[s] ?? 0;
                const pct = data.total > 0 ? (count / data.total) * 100 : 0;
                const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 100, fontSize: 13, fontWeight: 600, color: "#334155", flexShrink: 0 }}>{s}</div>
                    <div style={{ flex: 1, height: 28, backgroundColor: "#f1f5f9", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", width: `${barWidth}%`, backgroundColor: STATUS_COLORS[s] ?? "#94a3b8", borderRadius: 8, transition: "width 0.6s ease", minWidth: count > 0 ? 4 : 0 }} />
                    </div>
                    <div style={{ width: 60, textAlign: "right", fontSize: 13, fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>{count}</div>
                    <div style={{ width: 48, textAlign: "right", fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {statuses.map((s) => {
            const count = data.statusCounts[s] ?? 0;
            const pct = data.total > 0 ? ((count / data.total) * 100).toFixed(0) : "0";
            return (
              <div key={s} style={{ background: "#fff", borderRadius: 14, border: `2px solid ${STATUS_COLORS[s]}22`, padding: "18px 20px", textAlign: "center" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: STATUS_COLORS[s], margin: "0 auto 10px" }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{s}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: STATUS_COLORS[s] }}>{count}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{pct}% of total</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
