import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await initDb();

  const [statusCounts, fundedTotal, recentActivity] = await Promise.all([
    db.execute({
      sql: `SELECT status, COUNT(*) as count FROM applications WHERE archived = 0 GROUP BY status`,
      args: [],
    }),
    db.execute({
      sql: `SELECT SUM(CAST(REPLACE(REPLACE(amount_requested, '$', ''), ',', '') AS REAL)) as total
            FROM applications WHERE status = 'Funded' AND archived = 0`,
      args: [],
    }),
    db.execute({
      sql: `SELECT status, COUNT(*) as count, DATE(created_at) as date
            FROM applications WHERE archived = 0
            GROUP BY DATE(created_at), status
            ORDER BY date DESC LIMIT 60`,
      args: [],
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const row of statusCounts.rows) {
    counts[row.status as string] = Number(row.count);
  }

  const total = Number(statusCounts.rows.reduce((s, r) => s + Number(r.count), 0));
  const funded = counts["Funded"] ?? 0;
  const approved = counts["Approved"] ?? 0;
  const declined = counts["Declined"] ?? 0;
  const conversionRate = total > 0 ? ((funded / total) * 100).toFixed(1) : "0.0";
  const approvalRate = total > 0 ? (((funded + approved) / total) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    total,
    statusCounts: counts,
    fundedAmount: Number(fundedTotal.rows[0]?.total ?? 0),
    conversionRate,
    approvalRate,
    recentActivity: recentActivity.rows,
  });
}
