import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, COOKIE } from "@/lib/auth";
import { initDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const db = await initDb();

  // Check users table first
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE email = ? AND is_active = 1",
    args: [email],
  });

  let sessionUser;

  if (result.rows.length > 0) {
    const user = result.rows[0] as unknown as { id: number; name: string; email: string; password_hash: string; role: string };
    const valid = await bcrypt.compare(password, String(user.password_hash));
    if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    sessionUser = { id: Number(user.id), name: String(user.name), email: String(user.email), role: String(user.role) as "admin" | "agent" };
  } else {
    // Super-admin via env vars — never visible in Users list
    const superEmail = process.env.SUPER_ADMIN_EMAIL;
    const superPassword = process.env.SUPER_ADMIN_PASSWORD;
    if (superEmail && superPassword && email === superEmail && password === superPassword) {
      sessionUser = { id: -1, name: "Super Admin", email: superEmail, role: "admin" as const };
    } else {
      // Fallback: legacy admin login via env var
      const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
      if (email !== "admin" || password !== adminPassword) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
      sessionUser = { id: 0, name: "Admin", email: "admin", role: "admin" as const };
    }
  }

  const token = await createSession(sessionUser);
  const res = NextResponse.json({ ok: true, user: sessionUser });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
