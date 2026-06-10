import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await initDb();
  const { id } = await params;

  const appResult = await db.execute({ sql: "SELECT * FROM applications WHERE id = ?", args: [id] });
  if (appResult.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docsResult = await db.execute({
    sql: "SELECT * FROM documents WHERE application_id = ? ORDER BY uploaded_at ASC",
    args: [id],
  });
  const historyResult = await db.execute({
    sql: "SELECT * FROM status_history WHERE application_id = ? ORDER BY changed_at ASC",
    args: [id],
  });

  return NextResponse.json({
    ...appResult.rows[0],
    documents: docsResult.rows,
    statusHistory: historyResult.rows,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await initDb();
  const { id } = await params;

  await db.execute({ sql: "UPDATE applications SET archived = 1 WHERE id = ?", args: [id] });

  return NextResponse.json({ ok: true });
}
