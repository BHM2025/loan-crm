"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

const STATUS_OPTIONS = ["New", "Underwriting", "Approved", "Funded", "Declined"];

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; btnBg: string; dot: string }> = {
  New:          { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", btnBg: "#3b82f6", dot: "#3b82f6" },
  Underwriting: { bg: "#fffbeb", text: "#b45309", border: "#fde68a", btnBg: "#f59e0b", dot: "#f59e0b" },
  Approved:     { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0", btnBg: "#10b981", dot: "#10b981" },
  Funded:       { bg: "#f5f3ff", text: "#5b21b6", border: "#ddd6fe", btnBg: "#8b5cf6", dot: "#8b5cf6" },
  Declined:     { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca", btnBg: "#ef4444", dot: "#ef4444" },
};

interface Note {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

interface Document {
  id: number;
  document_type: string;
  original_url: string;
  filename: string;
  file_path: string;
  uploaded_by?: string;
  uploaded_at: string;
}

interface StatusEntry {
  id: number;
  status: string;
  changed_at: string;
}

interface AppDetail {
  id: number;
  business_name: string;
  dba_name: string;
  industry: string;
  amount_requested: string;
  use_of_funds: string;
  priority: string;
  first_time_funding: string;
  entity_type: string;
  date_started: string;
  num_employees: string;
  ein: string;
  credit_score: string;
  business_address: string;
  owner_name: string;
  owner_home_address: string;
  owner_phone: string;
  owner_dob: string;
  owner_ssn: string;
  owner_email: string;
  ownership_percentage: string;
  status: string;
  application_date: string;
  status_updated_at: string;
  documents: Document[];
  statusHistory: StatusEntry[];
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(val: string) {
  const n = parseFloat(val?.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return val || "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 700, color: "#334155", fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("Additional Document");
  const [dragOver, setDragOver] = useState(false);

  const fetchNotes = async () => {
    const res = await fetch(`/api/applications/${id}/notes`);
    if (res.ok) setNotes(await res.json());
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    await fetch(`/api/applications/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    });
    setNewNote("");
    await fetchNotes();
    setSavingNote(false);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", uploadDocType);
    await fetch(`/api/applications/${id}/upload`, { method: "POST", body: fd });
    await fetchApp();
    setUploading(false);
  };

  const deleteNote = async (noteId: number) => {
    await fetch(`/api/applications/${id}/notes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId }),
    });
    await fetchNotes();
  };

  const fetchApp = async () => {
    const res = await fetch(`/api/applications/${id}`);
    if (res.ok) setApp(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchApp(); fetchNotes(); }, [id]);

  const updateStatus = async (status: string) => {
    if (!app) return;
    setUpdating(true);
    await fetch(`/api/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchApp();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setUpdating(false);
  };

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontFamily: "system-ui,sans-serif" }}>Loading...</div>;
  if (!app) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontFamily: "system-ui,sans-serif" }}>Not found.</div>;

  const cfg = STATUS_CONFIG[app.status];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "transparent", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ color: "#64748b", textDecoration: "none", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              ← All Applications
            </Link>
            <span style={{ width: 1, height: 20, backgroundColor: "#e2e8f0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>MX</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{app.business_name || `Application #${app.id}`}</div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>Submitted {formatDate(app.application_date)}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, backgroundColor: cfg?.bg ?? "#f1f5f9", color: cfg?.text ?? "#475569", border: `1px solid ${cfg?.border ?? "#e2e8f0"}`, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: cfg?.dot ?? "#94a3b8" }} />
              {app.status}
            </span>
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
              style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#dc2626", fontWeight: 600, cursor: "pointer" }}
            >Sign Out</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Top stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: 16, padding: "22px 24px", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Amount Requested</div>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>{formatCurrency(app.amount_requested)}</div>
            {app.use_of_funds && <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>{app.use_of_funds}</div>}
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Credit Score</div>
            <div style={{ color: "#0f172a", fontSize: 26, fontWeight: 800 }}>{app.credit_score || "—"}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{app.entity_type || ""}</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Application Date</div>
            <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 700 }}>{formatDate(app.application_date)}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Updated {formatDate(app.status_updated_at)}</div>
          </div>
        </div>

        {/* Status update */}
        <Card title="Update Application Status" icon="🔄">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            {STATUS_OPTIONS.map((s) => {
              const scfg = STATUS_CONFIG[s];
              const isActive = app.status === s;
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updating}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: updating ? "not-allowed" : "pointer",
                    backgroundColor: isActive ? scfg.btnBg : "#f1f5f9",
                    color: isActive ? "#fff" : "#475569",
                    boxShadow: isActive ? `0 4px 12px ${scfg.dot}55` : "none",
                    transform: isActive ? "scale(1.04)" : "scale(1)",
                    transition: "all 0.15s",
                    opacity: updating ? 0.6 : 1,
                  }}
                >
                  {s}
                </button>
              );
            })}
            {updating && <span style={{ fontSize: 12, color: "#94a3b8" }}>Saving…</span>}
            {saved && <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>✓ Status updated</span>}
          </div>
        </Card>

        {/* Business info */}
        <Card title="Business Information" icon="🏢">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            <Field label="Business Name" value={app.business_name} />
            <Field label="DBA / Alternate" value={app.dba_name} />
            <Field label="Industry" value={app.industry} />
            <Field label="Amount Requested" value={formatCurrency(app.amount_requested)} />
            <Field label="Use of Funds" value={app.use_of_funds} />
            <Field label="Priority" value={app.priority} />
            <Field label="Entity Type" value={app.entity_type} />
            <Field label="First-Time Funding" value={app.first_time_funding} />
            <Field label="Date Started" value={app.date_started} />
            <Field label="Employees" value={app.num_employees} />
            <Field label="EIN / Tax ID" value={app.ein} />
            <Field label="Credit Score" value={app.credit_score} />
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <Field label="Business Address" value={app.business_address} />
          </div>
        </Card>

        {/* Owner info */}
        <Card title="Owner Information" icon="👤">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            <Field label="Full Name" value={app.owner_name} />
            <Field label="Email" value={app.owner_email} />
            <Field label="Phone" value={app.owner_phone} />
            <Field label="Date of Birth" value={app.owner_dob} />
            <Field label="SSN" value={app.owner_ssn ? `•••-••-${app.owner_ssn.slice(-4)}` : undefined} />
            <Field label="Ownership %" value={app.ownership_percentage} />
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <Field label="Home Address" value={app.owner_home_address} />
          </div>
        </Card>

        {/* Documents */}
        <Card title={`Documents (${app.documents.length})`} icon="📁">

          {/* Upload area */}
          <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: `2px dashed ${dragOver ? "#3b82f6" : "#e2e8f0"}`, backgroundColor: dragOver ? "#eff6ff" : "#f8fafc", transition: "all 0.15s" }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <select value={uploadDocType} onChange={e => setUploadDocType(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, backgroundColor: "#fff", outline: "none" }}>
                  <option>Additional Document</option>
                  <option>Most Recent Bank Statements</option>
                  <option>Last 4 Months Bank Statements</option>
                  <option>Driver&apos;s License</option>
                  <option>Voided Check</option>
                  <option>Credit Report</option>
                  <option>Tax Return</option>
                  <option>Business License</option>
                  <option>Other</option>
                </select>
              </div>
              <label style={{ padding: "9px 18px", borderRadius: 8, background: uploading ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }}>
                {uploading ? "Uploading…" : "📎 Choose File"}
                <input type="file" disabled={uploading} style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
              </label>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>or drag and drop a file here</div>
          </div>

          {app.documents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
              <div style={{ color: "#94a3b8", fontSize: 13 }}>No documents uploaded yet.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {app.documents.map((doc) => (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{doc.document_type}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.filename || "View file"}</div>
                    {doc.uploaded_by && <div style={{ fontSize: 10, color: "#cbd5e1" }}>by {doc.uploaded_by}</div>}
                  </div>
                  <a href={doc.file_path || doc.original_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", backgroundColor: "#eff6ff", padding: "6px 12px", borderRadius: 8, textDecoration: "none", flexShrink: 0 }}>
                    Open ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Status history */}
        <Card title="Status History" icon="📅">
          {app.statusHistory.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No history yet.</div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, backgroundColor: "#e2e8f0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {app.statusHistory.map((h, i) => {
                  const hcfg = STATUS_CONFIG[h.status];
                  const isLatest = i === app.statusHistory.length - 1;
                  return (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
                      <div style={{ position: "absolute", left: -16, width: 12, height: 12, borderRadius: "50%", backgroundColor: isLatest ? (hcfg?.dot ?? "#3b82f6") : "#cbd5e1", border: "2px solid #fff", boxShadow: "0 0 0 1px #e2e8f0" }} />
                      <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: hcfg?.bg ?? "#f1f5f9", color: hcfg?.text ?? "#475569", border: `1px solid ${hcfg?.border ?? "#e2e8f0"}` }}>
                        {h.status}
                      </span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(h.changed_at)}</span>
                      {isLatest && <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>Current</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card title={`Notes & Comments (${notes.length})`} icon="💬">
          {/* Add note */}
          <div style={{ marginBottom: 20 }}>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note or comment about this application..."
              rows={3}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "system-ui,sans-serif", color: "#0f172a", backgroundColor: "#f8fafc" }}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={addNote}
                disabled={savingNote || !newNote.trim()}
                style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: savingNote || !newNote.trim() ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: savingNote || !newNote.trim() ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}
              >
                {savingNote ? "Saving…" : "Add Note"}
              </button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>No notes yet. Add the first one above.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notes.map((note) => (
                <div key={note.id} style={{ padding: "14px 16px", borderRadius: 12, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.6, flex: 1 }}>{note.content}</p>
                    <button
                      onClick={() => deleteNote(note.id)}
                      title="Delete note"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 16, padding: "0 2px", flexShrink: 0, lineHeight: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}
                    >×</button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                    <span style={{ fontWeight: 600 }}>Admin</span> · {formatDate(note.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
