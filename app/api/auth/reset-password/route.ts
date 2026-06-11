import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const db = await initDb();

  const result = await db.execute({
    sql: `SELECT t.id, t.user_id, t.expires_at, t.used
          FROM password_reset_tokens t
          WHERE t.token = ?`,
    args: [token],
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const row = result.rows[0];

  if (row.used) {
    return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 });
  }

  if (new Date(row.expires_at as string) < new Date()) {
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE id = ?",
    args: [hash, row.user_id],
  });

  await db.execute({
    sql: "UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
    args: [row.id],
  });

  return NextResponse.json({ ok: true });
}
