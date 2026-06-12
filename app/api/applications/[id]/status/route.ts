import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { sendEmail, statusChangeEmail, sendAlert } from "@/lib/email";

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
      const { html, text } = statusChangeEmail(ownerName, businessName, status, id);
      sendEmail({ to: ownerEmail, subject: `Application Update: ${status} — ${businessName}`, html, text });
    }
  }

  return NextResponse.json({ ok: true, status, updatedAt: now });
}
