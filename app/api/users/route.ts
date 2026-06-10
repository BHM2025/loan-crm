import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await initDb();
  const result = await db.execute("SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC");
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = await initDb();
  const password_hash = await bcrypt.hash(password, 10);

  try {
    await db.execute({
      sql: "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      args: [name, email, password_hash, role ?? "agent"],
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}
