import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";

interface TallyField {
  key: string;
  label: string;
  type: string;
  value: unknown;
}

interface TallyFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

// Match field label to value — case-insensitive partial match
function getField(fields: TallyField[], ...labels: string[]): string {
  for (const field of fields) {
    const lbl = field.label.toLowerCase();
    for (const label of labels) {
      if (lbl.includes(label.toLowerCase())) {
        if (field.value === null || field.value === undefined) return "";
        if (typeof field.value === "string") return field.value;
        if (typeof field.value === "number") return String(field.value);
        if (Array.isArray(field.value)) return field.value.join(", ");
        if (typeof field.value === "object") {
          // address object
          const obj = field.value as Record<string, string>;
          return Object.values(obj).filter(Boolean).join(", ");
        }
        return String(field.value);
      }
    }
  }
  return "";
}

function getFiles(fields: TallyField[], ...labels: string[]): { url: string; name: string; docType: string }[] {
  const result: { url: string; name: string; docType: string }[] = [];
  for (const field of fields) {
    const lbl = field.label.toLowerCase();
    for (const label of labels) {
      if (lbl.includes(label.toLowerCase()) && field.type === "FILE_UPLOAD") {
        const files = field.value as TallyFile[];
        if (Array.isArray(files)) {
          for (const f of files) {
            result.push({ url: f.url, name: f.name, docType: field.label });
          }
        }
      }
    }
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const db = await initDb();
    const body = await req.json();

    // Support both direct Tally payload and wrapped
    const data = body.data ?? body;
    const fields: TallyField[] = data.fields ?? [];
    const submissionId = String(data.responseId ?? body.eventId ?? Date.now());

    // Check duplicate
    const existing = await db.execute({ sql: "SELECT id FROM applications WHERE submission_id = ?", args: [submissionId] });
    if (existing.rows.length > 0) return NextResponse.json({ ok: true, message: "duplicate" });

    // Map fields by label
    const businessName     = getField(fields, "business name");
    const dbaName          = getField(fields, "dba", "alternate");
    const industry         = getField(fields, "industry");
    const amountRequested  = getField(fields, "amount requested", "loan amount", "amount");
    const useOfFunds       = getField(fields, "use of funds", "purpose");
    const priority         = getField(fields, "priority");
    const firstTimeFunding = getField(fields, "first-time", "first time");
    const entityType       = getField(fields, "entity type", "business type");
    const dateStarted      = getField(fields, "date started", "business started");
    const numEmployees     = getField(fields, "employees", "number of employees");
    const ein              = getField(fields, "ein", "tax id", "federal tax");
    const creditScore      = getField(fields, "credit score");
    const businessAddress  = getField(fields, "business address");
    const ownerName        = getField(fields, "owner name", "owner #1 name", "full name");
    const ownerHomeAddress = getField(fields, "home address");
    const ownerPhone       = getField(fields, "phone");
    const ownerDob         = getField(fields, "date of birth", "dob");
    const ownerSsn         = getField(fields, "ssn");
    const ownerEmail       = getField(fields, "email");
    const ownershipPct     = getField(fields, "ownership");
    const applicationDate  = new Date().toISOString();

    const result = await db.execute({
      sql: `INSERT INTO applications (
              submission_id, business_name, dba_name, industry, amount_requested,
              use_of_funds, priority, first_time_funding, entity_type, date_started,
              num_employees, ein, credit_score, business_address, owner_name,
              owner_home_address, owner_phone, owner_dob, owner_ssn, owner_email,
              ownership_percentage, status, application_date, status_updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        submissionId, businessName, dbaName, industry, amountRequested,
        useOfFunds, priority, firstTimeFunding, entityType, dateStarted,
        numEmployees, ein, creditScore, businessAddress, ownerName,
        ownerHomeAddress, ownerPhone, ownerDob, ownerSsn, ownerEmail,
        ownershipPct, "New", applicationDate, applicationDate,
      ],
    });

    const appId = Number(result.lastInsertRowid);
    await db.execute({ sql: "INSERT INTO status_history (application_id, status) VALUES (?, ?)", args: [appId, "New"] });

    // Store all file upload fields
    const allFileFields = fields.filter(f => f.type === "FILE_UPLOAD");
    for (const field of allFileFields) {
      const files = field.value as TallyFile[];
      if (!Array.isArray(files)) continue;
      for (const f of files) {
        await db.execute({
          sql: "INSERT INTO documents (application_id, document_type, original_url, filename, file_path) VALUES (?, ?, ?, ?, ?)",
          args: [appId, field.label, f.url, f.name, f.url],
        });
      }
    }

    // suppress unused warning
    void getFiles;

    return NextResponse.json({ ok: true, id: appId });
  } catch (err) {
    console.error("Tally webhook error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
