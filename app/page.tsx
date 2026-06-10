"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const STATUS_OPTIONS = ["New", "Underwriting", "Approved", "Funded", "Declined"];

const STATUS_COLORS: Record<string, string> = {
  New:          "bg-blue-100 text-blue-800 border-blue-200",
  Underwriting: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Approved:     "bg-green-100 text-green-800 border-green-200",
  Funded:       "bg-emerald-100 text-emerald-800 border-emerald-200",
  Declined:     "bg-red-100 text-red-800 border-red-200",
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loan Application CRM</h1>
            <p className="text-sm text-gray-500 mt-0.5">Maple X Business Funding</p>
          </div>
          <div className="text-sm text-gray-500 font-medium">{apps.length} total applications</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "All" : s)}
              className={`rounded-xl border p-4 text-left transition-all hover:shadow-md cursor-pointer ${
                filter === s
                  ? STATUS_COLORS[s] + " border-2 shadow-md"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="text-3xl font-bold">{counts[s] ?? 0}</div>
              <div className="text-sm font-medium mt-1">{s}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search business, owner, email, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-400 text-sm">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400 text-sm">
            {apps.length === 0
              ? "No applications yet. Once the JotForm is submitted, applications will appear here automatically."
              : "No applications match your current filter."}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600">Business</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Owner</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Applied</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Status Updated</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Change Status</th>
                    <th className="px-4 py-3 font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app, i) => (
                    <tr key={app.id} className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{app.business_name || "—"}</div>
                        {app.dba_name && <div className="text-xs text-gray-400">DBA: {app.dba_name}</div>}
                        {app.industry && <div className="text-xs text-gray-400">{app.industry}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-800">{app.owner_name || "—"}</div>
                        {app.owner_email && <div className="text-xs text-gray-400">{app.owner_email}</div>}
                        {app.owner_phone && <div className="text-xs text-gray-400">{app.owner_phone}</div>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{formatCurrency(app.amount_requested)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(app.application_date)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(app.status_updated_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={app.status}
                            disabled={updatingId === app.id}
                            onChange={(e) => updateStatus(app.id, e.target.value)}
                            className="text-xs rounded-lg border border-gray-300 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          {updatingId === app.id && <span className="text-xs text-gray-400">Saving…</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/application/${app.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs whitespace-nowrap">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
