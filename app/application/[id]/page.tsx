"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

const STATUS_OPTIONS = ["New", "Underwriting", "Approved", "Funded", "Declined"];

const STATUS_COLORS: Record<string, string> = {
  New:          "bg-blue-100 text-blue-800 border-blue-200",
  Underwriting: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Approved:     "bg-green-100 text-green-800 border-green-200",
  Funded:       "bg-emerald-100 text-emerald-800 border-emerald-200",
  Declined:     "bg-red-100 text-red-800 border-red-200",
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="font-semibold text-gray-600 text-xs uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value || "—"}</div>
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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  if (!app) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Application not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
            <div className="h-4 w-px bg-gray-300" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{app.business_name || `Application #${app.id}`}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(app.application_date)}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-700"}`}>
            {app.status}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Status update */}
        <Section title="Update Application Status">
          <div className="flex flex-wrap gap-2 items-center">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating || app.status === s}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 ${
                  app.status === s
                    ? STATUS_COLORS[s] + " border-2 cursor-default"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 cursor-pointer"
                }`}
              >
                {s}
              </button>
            ))}
            {updating && <span className="text-sm text-gray-400 ml-1">Saving…</span>}
            {saved && <span className="text-sm text-green-600 font-medium ml-1">✓ Status updated</span>}
          </div>
        </Section>

        {/* Business info */}
        <Section title="Business Information">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Field label="Business Name" value={app.business_name} />
            <Field label="DBA / Alternate Name" value={app.dba_name} />
            <Field label="Industry" value={app.industry} />
            <Field label="Amount Requested" value={formatCurrency(app.amount_requested)} />
            <Field label="Use of Funds" value={app.use_of_funds} />
            <Field label="Priority" value={app.priority} />
            <Field label="Entity Type" value={app.entity_type} />
            <Field label="First-Time Funding" value={app.first_time_funding} />
            <Field label="Date Business Started" value={app.date_started} />
            <Field label="Number of Employees" value={app.num_employees} />
            <Field label="EIN / Federal Tax ID" value={app.ein} />
            <Field label="Credit Score" value={app.credit_score} />
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <Field label="Business Address" value={app.business_address} />
          </div>
        </Section>

        {/* Owner info */}
        <Section title="Owner Information">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Field label="Owner Name" value={app.owner_name} />
            <Field label="Email" value={app.owner_email} />
            <Field label="Phone" value={app.owner_phone} />
            <Field label="Date of Birth" value={app.owner_dob} />
            <Field label="SSN" value={app.owner_ssn ? `•••-••-${app.owner_ssn.slice(-4)}` : undefined} />
            <Field label="Ownership %" value={app.ownership_percentage} />
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <Field label="Home Address" value={app.owner_home_address} />
          </div>
        </Section>

        {/* Documents */}
        <Section title={`Documents (${app.documents.length})`}>
          {app.documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents were uploaded with this application.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {app.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-2xl shrink-0">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{doc.document_type}</div>
                    <div className="text-xs text-gray-400 truncate">{doc.filename || doc.original_url}</div>
                    <div className="text-xs text-gray-400">{formatDate(doc.uploaded_at)}</div>
                  </div>
                  <a
                    href={doc.file_path || doc.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold shrink-0 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Open ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Status history */}
        <Section title="Status History">
          {app.statusHistory.length === 0 ? (
            <p className="text-sm text-gray-400">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {app.statusHistory.map((h, i) => (
                <div key={h.id} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${i === app.statusHistory.length - 1 ? "bg-blue-500" : "bg-gray-300"}`} />
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[h.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {h.status}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(h.changed_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
