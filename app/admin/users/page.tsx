"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", email: "", password: "", role: "agent" });
      setShowForm(false);
      await fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create user");
    }
    setSaving(false);
  };

  const toggleActive = async (user: User) => {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    await fetchUsers();
  };

  const deleteUser = async (id: number) => {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await fetchUsers();
  };

  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [resetSent, setResetSent] = useState<number | null>(null);
  const sendReset = async (id: number) => {
    await fetch(`/api/users/${id}/send-reset`, { method: "POST" });
    setResetSent(id);
    setTimeout(() => setResetSent(null), 3000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "transparent", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ color: "#64748b", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>← Dashboard</Link>
            <span style={{ width: 1, height: 20, backgroundColor: "#e2e8f0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>MX</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>User Management</div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Manage agents & admins</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}
            >
              + Add User
            </button>
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
              style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Team Members</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Add agents who can log in, view applications and upload documents</p>
        </div>

        {/* Add user form */}
        {showForm && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 20, marginTop: 0 }}>Add New User</h2>
            <form onSubmit={createUser}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full Name *</label>
                  <input
                    required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email *</label>
                  <input
                    required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@company.com"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password *</label>
                  <input
                    required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Set a password"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Role *</label>
                  <select
                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", backgroundColor: "#fff", boxSizing: "border-box" }}
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {error && <div style={{ marginBottom: 12, fontSize: 12, color: "#ef4444" }}>⚠️ {error}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" disabled={saving}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {saving ? "Creating…" : "Create User"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users table */}
        {loading ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading...</div>
        ) : users.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
            <div style={{ color: "#64748b", fontSize: 14 }}>No users yet. Add your first agent above.</div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                  {["User", "Email", "Role", "Status", "Created", "Actions"].map(h => (
                    <th key={h} style={{ padding: "13px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #f8fafc", backgroundColor: i % 2 === 1 ? "#fafafa" : "#fff" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: user.role === "admin" ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "linear-gradient(135deg,#3b82f6,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                          {user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#64748b" }}>{user.email}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: user.role === "admin" ? "#f5f3ff" : "#eff6ff", color: user.role === "admin" ? "#5b21b6" : "#1d4ed8", border: user.role === "admin" ? "1px solid #ddd6fe" : "1px solid #bfdbfe" }}>
                        {user.role === "admin" ? "Admin" : "Agent"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: user.is_active ? "#ecfdf5" : "#f1f5f9", color: user.is_active ? "#065f46" : "#64748b", border: user.is_active ? "1px solid #a7f3d0" : "1px solid #e2e8f0" }}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 12 }}>{formatDate(user.created_at)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => sendReset(user.id)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #bfdbfe", backgroundColor: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          {resetSent === user.id ? "✓ Sent!" : "Send reset link"}
                        </button>
                        <button onClick={() => toggleActive(user)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                        {confirmDelete === user.id ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Sure?</span>
                            <button onClick={() => deleteUser(user.id)}
                              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              Yes, delete
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDelete(user.id)}
                            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
