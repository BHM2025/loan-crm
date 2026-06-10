import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";

function findField(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const [k, v] of Object.entries(raw)) {
    const lower = k.toLowerCase();
    for (const key of keys) {
      if (lower.includes(key.toLowerCase())) {
        if (typeof v === "string") return v;
        if (typeof v === "object" && v !== null) {
          const obj = v as Record<string, string>;
          const parts = [obj.first, obj.middle, obj.last, obj.addr_line1, obj.addr_line2, obj.city, obj.state, obj.postal, obj.country].filter(Boolean);
          if (parts.length) return parts.join(", ");
          return JSON.stringify(v);
        }
      }
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const db = await initDb();

    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((v, k) => { body[k] = v; });
    }

    const submissionId = String(body.submissionID || body.submission_id || Date.now());

    let raw: Record<string, unknown> = {};
    if (body.rawRequest) {
      try { raw = JSON.parse(String(body.rawRequest)); } catch {}
    }
    for (const [k, v] of Object.entries(body)) {
      if (/^q\d+/.test(k)) raw[k] = v;
    }

    const businessName     = findField(raw, "businessName", "business_name", "companyname");
    const dbaName          = findField(raw, "dba", "alternate");
    const industry         = findField(raw, "industry");
    const amountRequested  = findField(raw, "amount", "loanAmount", "amountRequested");
    const useOfFunds       = findField(raw, "useOf", "purpose");
    const priority         = findField(raw, "priority");
    const firstTimeFunding = findField(raw, "firstTime", "first_time");
    const entityType       = findField(raw, "entity", "businessType");
    const dateStarted      = findField(raw, "dateStarted", "date_started", "started");
    const numEmployees     = findField(raw, "employee", "numEmployee");
    const ein              = findField(raw, "ein", "taxId", "federalTax");
    const creditScore      = findField(raw, "credit");
    const businessAddress  = findField(raw, "businessAddress", "business_address");
    const ownerName        = findField(raw, "ownerName", "owner_name", "ownerFirst", "ownerLast");
    const ownerHomeAddress = findField(raw, "homeAddress", "home_address");
    const ownerPhone       = findField(raw, "phone", "phoneNumber");
    const ownerDob         = findField(raw, "dob", "dateOf", "birth");
    const ownerSsn         = findField(raw, "ssn");
    const ownerEmail       = findField(raw, "email");
    const ownershipPct     = findField(raw, "ownership", "percentage");
    const applicationDate  = new Date().toISOString();

    const existing = await db.execute({ sql: "SELECT id FROM applications WHERE submission_id = ?", args: [submissionId] });
    if (existing.rows.length > 0) return NextResponse.json({ ok: true, message: "duplicate" });

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

    const docLabels: Record<string, string> = {
      recent:        "Most Recent Bank Statements",
      "4month":      "Last 4 Months Bank Statements",
      fourmonth:     "Last 4 Months Bank Statements",
      lastfour:      "Last 4 Months Bank Statements",
      bankstatement: "Last 4 Months Bank Statements",
      driver:        "Driver's License",
      license:       "Driver's License",
      void:          "Voided Check",
      voidedcheck:   "Voided Check",
      creditreport:  "Credit Report",
    };

    for (const [fieldKey, fieldVal] of Object.entries(raw)) {
      const urls: string[] = [];
      if (Array.isArray(fieldVal)) {
        for (const item of fieldVal) {
          if (typeof item === "string" && item.startsWith("http")) urls.push(item);
        }
      } else if (typeof fieldVal === "string" && fieldVal.startsWith("http")) {
        urls.push(fieldVal);
      }
      if (urls.length === 0) continue;

      const lowerKey = fieldKey.toLowerCase();
      let docType = "Document";
      for (const [key, label] of Object.entries(docLabels)) {
        if (lowerKey.includes(key)) { docType = label; break; }
      }

      for (const url of urls) {
        const ext = url.split(".").pop()?.split("?")[0] || "pdf";
        const filename = `${appId}_${docType.replace(/[^a-z0-9]/gi, "_")}.${ext}`;
        await db.execute({
          sql: "INSERT INTO documents (application_id, document_type, original_url, filename, file_path) VALUES (?, ?, ?, ?, ?)",
          args: [appId, docType, url, filename, url],
        });
      }
    }

    return NextResponse.json({ ok: true, id: appId });
  } catch (err) {
    console.error("JotForm webhook error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
