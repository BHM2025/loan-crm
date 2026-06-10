import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function GET() {
  const db = await initDb();
  const result = await db.execute(`
    SELECT id, submission_id, business_name, dba_name, owner_name, owner_email,
           owner_phone, amount_requested, credit_score, entity_type, industry,
           status, application_date, status_updated_at, created_at
    FROM applications
    WHERE archived = 0 OR archived IS NULL
    ORDER BY created_at DESC
  `);
  return NextResponse.json(result.rows);
}
