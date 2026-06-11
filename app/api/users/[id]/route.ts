import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = await initDb();

  if (body.is_active !== undefined) {
    await db.execute({ sql: "UPDATE users SET is_active = ? WHERE id = ?", args: [body.is_active ? 1 : 0, id] });
  }
  if (body.password) {
    const hash = await bcrypt.hash(body.password, 10);
    await db.execute({ sql: "UPDATE users SET password_hash = ? WHERE id = ?", args: [hash, id] });
  }
  if (body.role) {
    await db.execute({ sql: "UPDATE users SET role = ? WHERE id = ?", args: [body.role, id] });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = await initDb();
  await db.execute({ sql: "DELETE FROM password_reset_tokens WHERE user_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
  return NextResponse.json({ ok: true });
}
