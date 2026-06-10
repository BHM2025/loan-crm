import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";

const VALID_STATUSES = ["New", "Underwriting", "Approved", "Funded", "Declined"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await initDb();
  const { id } = await params;
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const result = await db.execute({
    sql: "UPDATE applications SET status = ?, status_updated_at = ? WHERE id = ?",
    args: [status, now, id],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.execute({
    sql: "INSERT INTO status_history (application_id, status, changed_at) VALUES (?, ?, ?)",
    args: [id, status, now],
  });

  return NextResponse.json({ ok: true, status, updatedAt: now });
}
