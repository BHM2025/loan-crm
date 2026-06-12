import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { sendAlert } from "@/lib/email";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const db = await initDb();
    const body = await req.json();

    const submissionId = String(body.submissionId ?? `bhm-${Date.now()}`);

    // Deduplicate
    const existing = await db.execute({
      sql: "SELECT id FROM applications WHERE submission_id = ?",
      args: [submissionId],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ ok: true, message: "duplicate" }, { headers: CORS });
    }

    const businessAddress = [body.businessStreet, body.businessCity, body.businessState, body.businessZip]
      .filter(Boolean).join(", ");
    const ownerHomeAddress = [body.homeStreet, body.homeCity, body.homeState, body.homeZip]
      .filter(Boolean).join(", ");
    const ownerName = [body.firstName, body.lastName].filter(Boolean).join(" ");
    const applicationDate = new Date().toISOString();

    const result = await db.execute({
      sql: `INSERT INTO applications (
              submission_id, business_name, dba_name, industry, amount_requested,
              use_of_funds, priority, first_time_funding, entity_type, date_started,
              num_employees, ein, credit_score, business_address, owner_name,
              owner_home_address, owner_phone, owner_dob, owner_ssn, owner_email,
              ownership_percentage, status, application_date, status_updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        submissionId,
        body.businessLegalName ?? "",
        body.dba ?? "",
        body.industry ?? "",
        body.amountRequested ?? "",
        body.useOfFunds ?? "",
        body.mostImportant ?? "",
        body.firstTimeFunding ?? "",
        body.entityType ?? "",
        body.dateStarted ?? "",
        body.numEmployees ?? "",
        body.ein ?? "",
        body.creditScore ?? "",
        businessAddress,
        ownerName,
        ownerHomeAddress,
        body.phone ?? "",
        body.dob ?? "",
        body.ssn ?? "",
        body.email ?? "",
        body.ownershipPct ?? "",
        "New",
        applicationDate,
        applicationDate,
      ],
    });

    const appId = Number(result.lastInsertRowid);
    await db.execute({
      sql: "INSERT INTO status_history (application_id, status) VALUES (?, ?)",
      args: [appId, "New"],
    });

    // Store uploaded document URLs passed from the form
    const docs: { url: string; name: string; docType: string }[] = body.documents ?? [];
    for (const doc of docs) {
      await db.execute({
        sql: "INSERT INTO documents (application_id, document_type, original_url, filename, file_path) VALUES (?, ?, ?, ?, ?)",
        args: [appId, doc.docType, doc.url, doc.name, doc.url],
      });
    }

    // Store signature as a document if provided
    if (body.signature && typeof body.signature === "string" && body.signature.startsWith("data:image")) {
      await db.execute({
        sql: "INSERT INTO documents (application_id, document_type, original_url, filename, file_path) VALUES (?, ?, ?, ?, ?)",
        args: [appId, "Signature", body.signature, "signature.png", body.signature],
      });
    }

    return NextResponse.json({ ok: true, id: appId }, { headers: CORS });
  } catch (err) {
    console.error("BHM webhook error:", err);
    sendAlert({ subject: "Form submission failed — BHM webhook error", details: String(err) });
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500, headers: CORS });
  }
}
