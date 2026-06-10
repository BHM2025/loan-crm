import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const docType = String(formData.get("docType") || "Additional Document");

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const filename = `app-${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const db = await initDb();
  await db.execute({
    sql: "INSERT INTO documents (application_id, document_type, original_url, filename, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, docType, blob.url, file.name, blob.url, session.name],
  });

  return NextResponse.json({ ok: true, url: blob.url, name: file.name });
}
