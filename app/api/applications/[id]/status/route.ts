import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";

const VALID_STATUSES = ["New", "Underwriting", "Approved", "Funded", "Declined"];

const STATUS_MESSAGES: Record<string, string> = {
  New: "Your application has been received and is under initial review.",
  Underwriting: "Your application is now in underwriting. Our team is reviewing your documents.",
  Approved: "Great news! Your application has been approved.",
  Funded: "Congratulations! Your funding has been disbursed.",
  Declined: "After review, we are unable to approve your application at this time. Please contact us for details.",
};

async function sendStatusEmail(ownerName: string, ownerEmail: string, businessName: string, status: string, appId: string) {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: "0c976883-44fe-4650-8610-88bc3aeeed34",
        subject: `Application Update: ${status} — ${businessName}`,
        from_name: "Maple X Business Funding",
        to: ownerEmail,
        name: ownerName,
        message: `Hi ${ownerName},\n\nYour application for ${businessName} has been updated.\n\nNew Status: ${status}\n\n${STATUS_MESSAGES[status] ?? ""}\n\nApplication ID: #${appId}\n\nIf you have questions, please contact our team.\n\n— Maple X Business Funding`,
      }),
    });
  } catch {
    // non-blocking — log but don't fail the request
    console.error("Failed to send status email");
  }
}

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
      sendStatusEmail(ownerName, ownerEmail, businessName, status, id);
    }
  }

  return NextResponse.json({ ok: true, status, updatedAt: now });
}
