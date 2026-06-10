"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

const STATUS_OPTIONS = ["New", "Underwriting", "Approved", "Funded", "Declined"];

const STATUS_STYLES: Record<string, { badge: string; btn: string; dot: string }> = {
  New:          { badge: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",          btn: "bg-blue-600 text-white hover:bg-blue-700",          dot: "bg-blue-500" },
  Underwriting: { badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",        btn: "bg-amber-500 text-white hover:bg-amber-600",         dot: "bg-amber-500" },
  Approved:     { badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",  btn: "bg-emerald-600 text-white hover:bg-emerald-700",     dot: "bg-emerald-500" },
  Funded:       { badge: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",     btn: "bg-violet-600 text-white hover:bg-violet-700",       dot: "bg-violet-500" },
  Declined:     { badge: "bg-red-100 text-red-700 ring-1 ring-red-200",             btn: "bg-red-600 text-white hover:bg-red-700",             dot: "bg-red-500" },
};

interface Document {
  id: number;
  document_type: string;
  original_url: string;
  filename: string;
  file_path: string;
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <h2 className="font-semibold text-slate-700 text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-sm text-slate-800 font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchApp = async () => {
    const res = await fetch(`/api/applications/${id}`);
    if (res.ok) setApp(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchApp(); }, [id]);

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

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Loading application...</div>
    </div>
  );
  if (!app) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Application not found.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
              <span>←</span>
              <span>All Applications</span>
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">MX</span>
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm leading-tight">{app.business_name || `Application #${app.id}`}</div>
                <div className="text-xs text-slate-400 leading-tight">Submitted {formatDate(app.application_date)}</div>
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_STYLES[app.status]?.badge ?? "bg-slate-100 text-slate-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[app.status]?.dot ?? "bg-slate-400"}`} />
            {app.status}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Amount highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-5 text-white shadow-md">
            <div className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Amount Requested</div>
            <div className="text-3xl font-bold">{formatCurrency(app.amount_requested)}</div>
            {app.use_of_funds && <div className="text-blue-200 text-xs mt-1 truncate">{app.use_of_funds}</div>}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Credit Score</div>
            <div className="text-2xl font-bold text-slate-800">{app.credit_score || "—"}</div>
            <div className="text-slate-400 text-xs mt-1">{app.entity_type || ""}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Application Date</div>
            <div className="text-base font-bold text-slate-800">{formatDate(app.application_date).split(",")[0]}</div>
            <div className="text-slate-400 text-xs mt-1">Status updated {formatDate(app.status_updated_at).split(",")[0]}</div>
          </div>
        </div>

        {/* Status update */}
        <Card title="Update Status" icon="🔄">
          <div className="flex flex-wrap gap-2 items-center">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${
                  app.status === s
                    ? STATUS_STYLES[s]?.btn + " shadow-md scale-105 cursor-default"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                }`}
              >
                {s}
              </button>
            ))}
            {updating && <span className="text-xs text-slate-400 animate-pulse ml-1">Saving…</span>}
            {saved && <span className="text-xs text-emerald-600 font-semibold ml-1">✓ Status updated</span>}
          </div>
        </Card>

        {/* Business info */}
        <Card title="Business Information" icon="🏢">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
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
            <Field label="EIN / Tax ID" value={app.ein} mono />
            <Field label="Credit Score" value={app.credit_score} />
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <Field label="Business Address" value={app.business_address} />
          </div>
        </Card>

        {/* Owner info */}
        <Card title="Owner Information" icon="👤">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <Field label="Full Name" value={app.owner_name} />
            <Field label="Email" value={app.owner_email} />
            <Field label="Phone" value={app.owner_phone} />
            <Field label="Date of Birth" value={app.owner_dob} />
            <Field label="SSN" value={app.owner_ssn ? `•••-••-${app.owner_ssn.slice(-4)}` : undefined} mono />
            <Field label="Ownership %" value={app.ownership_percentage} />
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <Field label="Home Address" value={app.owner_home_address} />
          </div>
        </Card>

        {/* Documents */}
        <Card title={`Documents (${app.documents.length})`} icon="📁">
          {app.documents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-slate-400 text-sm">No documents uploaded with this application.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {app.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-sm shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{doc.document_type}</div>
                    <div className="text-xs text-slate-400 truncate">{doc.filename || "View file"}</div>
                  </div>
                  <a
                    href={doc.file_path || doc.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-semibold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
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
            <p className="text-sm text-slate-400">No history yet.</p>
          ) : (
            <div className="relative pl-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
              <div className="space-y-4">
                {app.statusHistory.map((h, i) => (
                  <div key={h.id} className="relative flex items-center gap-4 pl-4">
                    <div className={`absolute -left-[1px] w-3 h-3 rounded-full border-2 border-white shadow ${i === app.statusHistory.length - 1 ? STATUS_STYLES[h.status]?.dot ?? "bg-blue-500" : "bg-slate-300"}`} />
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[h.status]?.badge ?? "bg-slate-100 text-slate-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[h.status]?.dot ?? "bg-slate-400"}`} />
                      {h.status}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(h.changed_at)}</span>
                    {i === app.statusHistory.length - 1 && (
                      <span className="text-xs text-emerald-600 font-semibold">Current</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
