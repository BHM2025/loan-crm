import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Public endpoint for external forms (e.g. bhm-funding.vercel.app) to upload files to Blob
// Returns the blob URL — no auth required since files are already public anyway
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const docType = String(formData.get("docType") || "Document");

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400, headers: CORS });

    const filename = `uploads/${docType.replace(/[^a-zA-Z0-9._-]/g, "_")}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const blob = await put(filename, file, { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN });

    return NextResponse.json({ ok: true, url: blob.url, name: file.name }, { headers: CORS });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
