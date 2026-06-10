"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const STATUS_OPTIONS = ["New", "Underwriting", "Approved", "Funded", "Declined"];

// Using inline styles for colors so Tailwind purging doesn't remove them
const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; cardBg: string; cardText: string; dot: string; icon: string }> = {
  New:          { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", cardBg: "linear-gradient(135deg,#3b82f6,#6366f1)", cardText: "#fff", dot: "#3b82f6", icon: "📋" },
  Underwriting: { bg: "#fffbeb", text: "#b45309", border: "#fde68a", cardBg: "linear-gradient(135deg,#f59e0b,#ef4444)", cardText: "#fff", dot: "#f59e0b", icon: "🔍" },
  Approved:     { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0", cardBg: "linear-gradient(135deg,#10b981,#059669)", cardText: "#fff", dot: "#10b981", icon: "✅" },
  Funded:       { bg: "#f5f3ff", text: "#5b21b6", border: "#ddd6fe", cardBg: "linear-gradient(135deg,#8b5cf6,#6d28d9)", cardText: "#fff", dot: "#8b5cf6", icon: "💰" },
  Declined:     { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca", cardBg: "linear-gradient(135deg,#ef4444,#dc2626)", cardText: "#fff", dot: "#ef4444", icon: "❌" },
};

const AVATAR_BG = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4"];

interface Application {
  id: number;
  business_name: string;
  dba_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  amount_requested: string;
  credit_score: string;
  entity_type: string;
  industry: string;
  status: string;
  application_date: string;
  status_updated_at: string;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(val: string) {
  const n = parseFloat(val?.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return val || "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function initials(name: string) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function DashboardPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [archivedApps, setArchivedApps] = useState<Application[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchApps = useCallback(async () => {
    const [active, archived] = await Promise.all([
      fetch("/api/applications").then(r => r.json()),
      fetch("/api/applications?archived=1").then(r => r.json()),
    ]);
    setApps(active);
    setArchivedApps(archived);
    setLoading(false);
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchApps();
    setUpdatingId(null);
  };

  const deleteApp = async (id: number, name: string) => {
    if (!confirm(`Archive application for "${name}"? It will be hidden from the dashboard.`)) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    await fetchApps();
  };

  const restoreApp = async (id: number) => {
    await fetch(`/api/applications/${id}`, { method: "PATCH" });
    await fetchApps();
  };

  const filtered = apps.filter((a) => {
    if (filter !== "All" && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.business_name?.toLowerCase().includes(q) ||
        a.owner_name?.toLowerCase().includes(q) ||
        a.owner_email?.toLowerCase().includes(q) ||
        a.industry?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "transparent", fontFamily: "system-ui, sans-serif" }}>

      {/* Navbar */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>MX</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>Maple X</div>
              <div style={{ color: "#94a3b8", fontSize: 11 }}>Loan CRM</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#f1f5f9", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              {apps.length} Applications
            </div>
            <Link href="/admin/users" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#5b21b6", fontWeight: 600, textDecoration: "none" }}>
              👥 Users
            </Link>
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
              style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#dc2626", fontWeight: 600, cursor: "pointer" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Page heading */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2d4ebd", margin: 0 }}>Applications</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Manage and track all loan applications</p>
          </div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: showArchived ? "#1e40af" : "#fff", color: showArchived ? "#fff" : "#64748b", cursor: "pointer" }}
          >
            {showArchived ? "← Active Applications" : `🗄 Archived (${archivedApps.length})`}
          </button>
        </div>

        {/* Status cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 28 }}>
          {STATUS_OPTIONS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? "All" : s)}
                style={{
                  background: cfg.cardBg,
                  border: isActive ? "3px solid #1e40af" : "3px solid transparent",
                  borderRadius: 16,
                  padding: "20px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 8px 24px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.08)",
                  transform: isActive ? "scale(1.03)" : "scale(1)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{cfg.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{counts[s] ?? 0}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: 4 }}>{s}</div>
              </button>
            );
          })}
        </div>

        {/* Archived view */}
        {showArchived && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {archivedApps.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No archived applications.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                    {["Application Date", "Business", "Owner", "Amount", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archivedApps.map((app, i) => {
                    const cfg = STATUS_CONFIG[app.status];
                    return (
                      <tr key={app.id} style={{ borderBottom: "1px solid #f8fafc", backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff" }}>
                        <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(app.application_date)}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{app.business_name || "—"}</div>
                          {app.industry && <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.industry}</div>}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ fontWeight: 500, color: "#334155" }}>{app.owner_name || "—"}</div>
                          {app.owner_email && <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.owner_email}</div>}
                        </td>
                        <td style={{ padding: "14px 20px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{formatCurrency(app.amount_requested)}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: cfg?.bg ?? "#f1f5f9", color: cfg?.text ?? "#475569", border: `1px solid ${cfg?.border ?? "#e2e8f0"}` }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg?.dot ?? "#94a3b8", flexShrink: 0 }} />
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <button
                            onClick={() => restoreApp(app.id)}
                            style={{ fontSize: 12, fontWeight: 600, color: "#065f46", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "6px 12px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc", fontSize: 12, color: "#94a3b8" }}>
              {archivedApps.length} archived application{archivedApps.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* Search bar — hidden when viewing archived */}
        {!showArchived && <>

        {/* Search bar */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", gap: 12 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Search business, owner, email, industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", backgroundColor: "#f8fafc", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ borderRadius: 10, border: "1px solid #e2e8f0", padding: "10px 16px", fontSize: 13, backgroundColor: "#f8fafc", outline: "none" }}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 80, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            Loading applications...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 80, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ color: "#64748b", fontSize: 14 }}>
              {apps.length === 0 ? "No applications yet. Connect your JotForm webhook to get started." : "No applications match your filter."}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                    {["Application Date", "Business", "Owner", "Amount", "Status", "Change Status", "", "Status Updated"].map((h) => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app, i) => {
                    const cfg = STATUS_CONFIG[app.status];
                    return (
                      <tr key={app.id} style={{ borderBottom: "1px solid #f8fafc", backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f0f7ff")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? "#fafafa" : "#fff")}
                      >
                        <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(app.application_date)}</td>
                        <td style={{ padding: "14px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: AVATAR_BG[i % AVATAR_BG.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {initials(app.business_name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>{app.business_name || "—"}</div>
                              {app.industry && <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.industry}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ fontWeight: 500, color: "#334155" }}>{app.owner_name || "—"}</div>
                          {app.owner_email && <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.owner_email}</div>}
                        </td>
                        <td style={{ padding: "14px 20px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{formatCurrency(app.amount_requested)}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: cfg?.bg ?? "#f1f5f9", color: cfg?.text ?? "#475569", border: `1px solid ${cfg?.border ?? "#e2e8f0"}` }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg?.dot ?? "#94a3b8", flexShrink: 0 }} />
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <select
                              value={app.status}
                              disabled={updatingId === app.id}
                              onChange={(e) => updateStatus(app.id, e.target.value)}
                              style={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", padding: "6px 10px", backgroundColor: "#fff", outline: "none", opacity: updatingId === app.id ? 0.5 : 1 }}
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {updatingId === app.id && <span style={{ fontSize: 11, color: "#94a3b8" }}>Saving…</span>}
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Link href={`/application/${app.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6", backgroundColor: "#eff6ff", padding: "6px 12px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}>
                              View →
                            </Link>
                            <button
                              onClick={() => deleteApp(app.id, app.business_name)}
                              style={{ fontSize: 12, fontWeight: 600, color: "#b45309", backgroundColor: "#fffbeb", border: "1px solid #fde68a", padding: "6px 10px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(app.status_updated_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc", fontSize: 12, color: "#94a3b8" }}>
              Showing {filtered.length} of {apps.length} applications
            </div>
          </div>
        )}
        </>}
      </main>
    </div>
  );
}
