"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const STATUS_OPTIONS = ["New", "Underwriting", "Approved", "Funded", "Declined"];

const STATUS_STYLES: Record<string, { badge: string; card: string; dot: string }> = {
  New:          { badge: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",          card: "from-blue-500 to-blue-600",    dot: "bg-blue-500" },
  Underwriting: { badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",        card: "from-amber-500 to-orange-500", dot: "bg-amber-500" },
  Approved:     { badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",  card: "from-emerald-500 to-green-600", dot: "bg-emerald-500" },
  Funded:       { badge: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",     card: "from-violet-500 to-purple-600", dot: "bg-violet-500" },
  Declined:     { badge: "bg-red-100 text-red-700 ring-1 ring-red-200",             card: "from-red-500 to-rose-600",     dot: "bg-red-500" },
};

const STATUS_ICONS: Record<string, string> = {
  New: "📋", Underwriting: "🔍", Approved: "✅", Funded: "💰", Declined: "❌",
};

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

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500"];

export default function DashboardPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchApps = useCallback(async () => {
    const res = await fetch("/api/applications");
    setApps(await res.json());
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow">
              <span className="text-white text-sm font-bold">MX</span>
            </div>
            <div>
              <div className="font-bold text-slate-800 text-base leading-tight">Maple X</div>
              <div className="text-xs text-slate-400 leading-tight">Loan CRM</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              {apps.length} Applications
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all loan applications</p>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "All" : s)}
              className={`relative rounded-2xl p-5 text-left transition-all cursor-pointer group overflow-hidden shadow-sm hover:shadow-md ${
                filter === s ? "ring-2 ring-offset-2 ring-blue-500 shadow-lg" : ""
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${STATUS_STYLES[s].card} opacity-${filter === s ? "100" : "90"}`} />
              <div className="relative z-10">
                <div className="text-2xl mb-2">{STATUS_ICONS[s]}</div>
                <div className="text-3xl font-bold text-white">{counts[s] ?? 0}</div>
                <div className="text-white/80 text-xs font-medium mt-1">{s}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search business, owner, email, industry..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-20 text-center text-slate-400 text-sm">
            Loading applications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-slate-500 text-sm font-medium">
              {apps.length === 0
                ? "No applications yet. Connect your JotForm webhook to start receiving applications."
                : "No applications match your current filter."}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Business</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Owner</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Applied</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Updated</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Change</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((app, i) => (
                    <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {initials(app.business_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{app.business_name || "—"}</div>
                            {app.industry && <div className="text-xs text-slate-400">{app.industry}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-700 font-medium">{app.owner_name || "—"}</div>
                        {app.owner_email && <div className="text-xs text-slate-400 truncate max-w-[160px]">{app.owner_email}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800">{formatCurrency(app.amount_requested)}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(app.application_date)}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{formatDate(app.status_updated_at)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[app.status]?.badge ?? "bg-slate-100 text-slate-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[app.status]?.dot ?? "bg-slate-400"}`} />
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={app.status}
                            disabled={updatingId === app.id}
                            onChange={(e) => updateStatus(app.id, e.target.value)}
                            className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-slate-700"
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {updatingId === app.id && (
                            <span className="text-xs text-slate-400 animate-pulse">Saving…</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/application/${app.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
              Showing {filtered.length} of {apps.length} applications
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
