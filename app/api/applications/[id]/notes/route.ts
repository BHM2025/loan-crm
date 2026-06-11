import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail, noteAddedEmail } from "@/lib/email";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await initDb();
  const { id } = await params;
  const result = await db.execute({
    sql: "SELECT * FROM notes WHERE application_id = ? ORDER BY created_at DESC",
    args: [id],
  });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await initDb();
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty note" }, { status: 400 });

  const result = await db.execute({
    sql: "INSERT INTO notes (application_id, content, created_at) VALUES (?, ?, ?)",
    args: [id, content.trim(), new Date().toISOString()],
  });

  // Send email notification to applicant (non-blocking)
  const appResult = await db.execute({
    sql: "SELECT owner_name, owner_email, business_name FROM applications WHERE id = ?",
    args: [id],
  });
  if (appResult.rows.length > 0) {
    const row = appResult.rows[0];
    const ownerEmail = row.owner_email as string;
    const ownerName = (row.owner_name as string) || "Applicant";
    const businessName = (row.business_name as string) || "your business";
    if (ownerEmail) {
      const { html, text } = noteAddedEmail(ownerName, businessName, content.trim(), id);
      sendEmail({ to: ownerEmail, subject: `Message from your Maple X agent — ${businessName}`, html, text });
    }
  }

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await initDb();
  const { noteId } = await req.json();
  await db.execute({ sql: "DELETE FROM notes WHERE id = ? AND application_id = ?", args: [noteId, (await params).id] });
  return NextResponse.json({ ok: true });
}
